import { Env } from '../../types/index';
import { authenticateUser } from '../../middleware/auth';

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

    // Verify the student belongs to the current user OR is the current user's student profile
    const { results } = await env.DB.prepare(
      "SELECT id FROM students WHERE id = ? AND (created_by = ? OR id = ?) AND deleted_at IS NULL"
    ).bind(studentId, auth.user.id, auth.user.student_id || '').all();

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
    const fileName = `avatars/${auth.user.id}/${studentId}-${timestamp}.${safeExtension}`;

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    const contentType = normalizedType || (fileExtension ? EXTENSION_TO_MIME[fileExtension] : undefined) || 'application/octet-stream';
    await env.AVATARS.put(fileName, arrayBuffer, {
      httpMetadata: {
        contentType,
      },
      customMetadata: {
        userId: auth.user.id,
        studentId: studentId,
        uploadedAt: new Date().toISOString(),
      }
    });

    // Serve via our Pages Function proxy (avoids needing a separate public avatars domain)
    const avatarUrl = `/api/avatars?key=${encodeURIComponent(fileName)}`;

    // Update student record with avatar URL
    const now = new Date().toISOString();
    await env.DB.prepare(
      "UPDATE students SET avatar_url = ?, updated_at = ?, updated_by = ? WHERE id = ?"
    ).bind(avatarUrl, now, auth.user.id, studentId).run();

    // Also update users table if this student is linked to a user
    await env.DB.prepare(
      "UPDATE users SET avatar_url = ?, updated_at = ? WHERE student_id = ?"
    ).bind(avatarUrl, now, studentId).run();

    return new Response(JSON.stringify({ 
      success: true, 
      avatarUrl: avatarUrl 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
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

    // Get student and verify ownership
    const { results } = await env.DB.prepare(
      "SELECT avatar_url FROM students WHERE id = ? AND created_by = ? AND deleted_at IS NULL"
    ).bind(studentId, auth.user.id).all<{ avatar_url?: string }>();

    if (!results || results.length === 0) {
      return new Response(JSON.stringify({ error: 'Student not found or access denied' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const student = results[0];
    
    // Delete from R2 if avatar exists
    if (student.avatar_url) {
      // Extract key from URL
      const urlObj = new URL(student.avatar_url);
      const key = urlObj.pathname.substring(1); // Remove leading slash
      
      try {
        await env.AVATARS.delete(key);
      } catch (error) {
        console.error('R2 delete error:', error);
        // Continue even if R2 delete fails
      }
    }

    // Update student record to remove avatar URL
    const now = new Date().toISOString();
    await env.DB.prepare(
      "UPDATE students SET avatar_url = NULL, updated_at = ?, updated_by = ? WHERE id = ? AND created_by = ?"
    ).bind(now, auth.user.id, studentId, auth.user.id).run();

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
