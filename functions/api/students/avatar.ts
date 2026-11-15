import { Env } from '../../types/index';
import { authenticateUser } from '../../middleware/auth';
import {
  branchErrorResponse,
  resolveRequestBranchId,
} from '../../utils/branches';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/heic',
  'image/heif'
]);

const ALLOWED_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'avif',
  'heic',
  'heif'
]);

const MIME_TYPE_NORMALIZATION: Record<string, string> = {
  'image/jpg': 'image/jpeg'
};

const EXTENSION_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  heic: 'image/heic',
  heif: 'image/heif'
};

const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/heic': 'heic',
  'image/heif': 'heif'
};

const normalizeMimeType = (type: string): string | undefined => {
  if (!type) return undefined;
  return MIME_TYPE_NORMALIZATION[type] || type;
};

const getFileExtension = (fileName: string): string | undefined => {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : undefined;
};

interface AvatarAccessUser {
  id: string;
  role: string;
  student_id?: string | null;
  organization_id: string;
}

export function buildAvatarStudentAccessQuery(
  studentId: string,
  branchId: string,
  user: AvatarAccessUser,
): { query: string; params: string[] } {
  let query = 'SELECT id, avatar_url FROM students WHERE id = ? AND branch_id = ? AND organization_id = ? AND deleted_at IS NULL';
  const params = [studentId, branchId, user.organization_id];

  if (user.role === 'student') {
    query += ' AND id = ?';
    params.push(user.student_id || '');
  } else if (user.role === 'instructor') {
    query += ' AND (created_by = ? OR instructor_id = ? OR instructor_id IS NULL)';
    params.push(user.id, user.id);
  }

  return { query, params };
}

/** New R2 keys bind org/branch; legacy uploads bind at least studentId. */
export function avatarObjectOwnedByStudent(
  metadata: Readonly<Record<string, string>> | undefined,
  studentId: string,
  organizationId: string,
  branchId: string,
): boolean {
  return metadata?.studentId === studentId &&
    (!metadata.organizationId || metadata.organizationId === organizationId) &&
    (!metadata.branchId || metadata.branchId === branchId);
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  try {
    // Authenticate user
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('avatar') as File;
    const studentId = formData.get('studentId') as string;

    if (!file || !studentId) {
      return new Response(JSON.stringify({ error: 'Avatar file and studentId are required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate file type
    const normalizedType = normalizeMimeType(file.type);
    const fileExtension = getFileExtension(file.name || '');
    const isAllowedType = normalizedType ? ALLOWED_MIME_TYPES.has(normalizedType) : false;
    const isAllowedExtension = fileExtension ? ALLOWED_EXTENSIONS.has(fileExtension) : false;
    if (!isAllowedType && !isAllowedExtension) {
      return new Response(JSON.stringify({ error: 'Invalid file type. Only JPG, PNG, GIF, WebP, AVIF, and HEIC/HEIF are allowed' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return new Response(JSON.stringify({ error: 'File too large. Maximum size is 5MB' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const branchId = await resolveRequestBranchId(request, env, auth.user);

    // Match the staff access rules used by the student detail endpoints.
    const access = buildAvatarStudentAccessQuery(studentId, branchId, auth.user);
    const { results } = await env.DB.prepare(access.query).bind(...access.params).all();

    if (!results || results.length === 0) {
      return new Response(JSON.stringify({ error: 'Student not found or access denied' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const resolvedExtension = (fileExtension && ALLOWED_EXTENSIONS.has(fileExtension))
      ? fileExtension
      : (normalizedType ? MIME_TO_EXTENSION[normalizedType] : undefined);
    const safeExtension = resolvedExtension || 'bin';
    const fileName = `avatars/${auth.user.organization_id}/${branchId}/${studentId}-${timestamp}-${crypto.randomUUID()}.${safeExtension}`;

    // Each upload uses a fresh R2 key. Preserve the previously referenced
    // object until the D1 pointer and linked-user pointer commit together.
    const previousAvatarUrl = (results[0] as { avatar_url?: string | null }).avatar_url ?? null;
    const avatarUrl = `/api/avatars?key=${encodeURIComponent(fileName)}`;
    const arrayBuffer = await file.arrayBuffer();
    const contentType = normalizedType || (fileExtension ? EXTENSION_TO_MIME[fileExtension] : undefined) || 'application/octet-stream';
    await env.AVATARS.put(fileName, arrayBuffer, {
      httpMetadata: { contentType },
      customMetadata: {
        userId: auth.user.id, studentId, organizationId: auth.user.organization_id,
        branchId, uploadedAt: new Date().toISOString(),
      },
    });

    try {
      const now = new Date().toISOString();
      // D1 batch is transactional: if linked user update fails, student update
      // rolls back. The old avatar reference is never overwritten on failure.
      const [studentUpdate] = await env.DB.batch<{ id: string }>([
        env.DB.prepare(
          `UPDATE students SET avatar_url = ?, updated_at = ?, updated_by = ?
             WHERE id = ? AND organization_id = ? AND branch_id = ?
               AND avatar_url IS ? AND deleted_at IS NULL RETURNING id`,
        ).bind(avatarUrl, now, auth.user.id, studentId, auth.user.organization_id, branchId, previousAvatarUrl),
        env.DB.prepare(
          `UPDATE users SET avatar_url = ?, updated_at = ?
             WHERE student_id = ? AND id IN (
               SELECT user_id FROM organization_memberships
                WHERE organization_id = ? AND student_id = ?
             ) AND EXISTS (
               SELECT 1 FROM students s
                WHERE s.id = ? AND s.organization_id = ? AND s.branch_id = ?
                  AND s.avatar_url = ? AND s.deleted_at IS NULL
             )`,
        ).bind(avatarUrl, now, studentId, auth.user.organization_id, studentId,
          studentId, auth.user.organization_id, branchId, avatarUrl),
      ]);
      if (studentUpdate.results?.[0]?.id !== studentId) {
        throw new Error('Student avatar reference changed concurrently');
      }
    } catch (persistError: unknown) {
      // Never delete the previous avatar: only the newly created unique R2
      // object is eligible for compensation. Failed cleanup is logged for GC.
      try {
        await env.AVATARS.delete(fileName);
      } catch (cleanupError: unknown) {
        console.error('R2 orphan avatar cleanup failed:', cleanupError);
      }
      throw persistError;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      avatarUrl: avatarUrl 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const branchResponse = branchErrorResponse(error);
    if (branchResponse) return branchResponse;
    console.error('Avatar upload error:', error);
    return new Response(JSON.stringify({ 
      error: (error as Error).message || 'Failed to upload avatar' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestDelete({ request, env }: { request: Request; env: Env }) {
  try {
    // Authenticate user
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get student ID from URL
    const url = new URL(request.url);
    const studentId = url.searchParams.get('studentId');

    if (!studentId) {
      return new Response(JSON.stringify({ error: 'Student ID required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Use the identical organization, branch and role predicate as avatar upload.
    const branchId = await resolveRequestBranchId(request, env, auth.user);
    const access = buildAvatarStudentAccessQuery(studentId, branchId, auth.user);
    const { results } = await env.DB.prepare(access.query).bind(...access.params).all<{ avatar_url?: string }>();

    if (!results || results.length === 0) {
      return new Response(JSON.stringify({ error: 'Student not found or access denied' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const student = results[0];
    
    // Delete from R2 if avatar exists
    if (student.avatar_url) {
      // Extract R2 key from the avatar URL (format: /api/avatars?key=avatars/...)
      let key: string | undefined;
      try {
        if (student.avatar_url.startsWith('/api/avatars')) {
          const urlObj = new URL(student.avatar_url, 'http://localhost');
          key = urlObj.searchParams.get('key') || undefined;
        } else if (student.avatar_url.startsWith('avatars/')) {
          key = student.avatar_url;
        }
      } catch {
        // If URL parsing fails, skip R2 deletion
      }
      
      if (key && key.startsWith('avatars/') && !key.includes('..') && !key.includes('\\')) {
        try {
          // A stored avatar_url never grants permission to delete an R2 object.
          // Check the exact student and the tenant/branch on new object metadata.
          const object = await env.AVATARS.head(key);
          if (avatarObjectOwnedByStudent(
            object?.customMetadata, studentId, auth.user.organization_id, branchId,
          )) {
            await env.AVATARS.delete(key);
          }
        } catch (error) {
          console.error('R2 delete error:', error);
        }
      }
    }

    // Update student record to remove avatar URL
    const now = new Date().toISOString();
    await env.DB.prepare(
      "UPDATE students SET avatar_url = NULL, updated_at = ?, updated_by = ? WHERE id = ? AND organization_id = ? AND branch_id = ?"
    ).bind(now, auth.user.id, studentId, auth.user.organization_id, branchId).run();

    return new Response(JSON.stringify({ success: true }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Avatar delete error:', error);
    return new Response(JSON.stringify({ 
      error: (error as Error).message || 'Failed to delete avatar' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
