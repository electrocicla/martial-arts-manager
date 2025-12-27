import { Env } from '../../types/index';
import { authenticateUser } from '../../middleware/auth';

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
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed' }), { 
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
    const fileExtension = file.name.split('.').pop();
    const fileName = `avatars/${auth.user.id}/${studentId}-${timestamp}.${fileExtension}`;

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    await env.AVATARS.put(fileName, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        userId: auth.user.id,
        studentId: studentId,
        uploadedAt: new Date().toISOString(),
      }
    });

    // Generate public URL (adjust domain as needed)
    // Note: In a real app, you'd use a custom domain or worker to serve R2 files
    // For now we assume a public bucket or worker route
    const avatarUrl = `https://avatars.martial-arts-manager.pages.dev/${fileName}`;

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
