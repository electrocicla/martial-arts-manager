import type { Env } from '../../types/index';
import { authenticateUser, getRefreshTokenFromRequest } from '../../middleware/auth';
import { verifyPassword, hashPassword } from '../../utils/hash';
import { errorResponse, jsonResponse } from '../../utils/response';

interface ChangePasswordRequest {
  currentPassword?: string;
  newPassword?: string;
}

/**
 * POST /api/account/change-password
 * Safely changes a user's password and invalidates other sessions.
 */
export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  try {
    // 1. Authenticate user
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return errorResponse(auth.error || 'Unauthorized', 401);
    }

    // 2. Parse request body
    let body: ChangePasswordRequest;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }

    const { currentPassword, newPassword } = body;

    // 3. Validation
    if (!currentPassword || !newPassword) {
      return errorResponse('Current password and new password are required', 400);
    }

    // 4. Retrieve user's current password hash
    const userRow = await env.DB.prepare('SELECT password_hash FROM users WHERE id = ?')
      .bind(auth.user.id)
      .first<{ password_hash: string }>();

    if (!userRow) {
      return errorResponse('User not found', 404);
    }

    // 5. Verify current password
    const isCurrentPasswordCorrect = await verifyPassword(currentPassword, userRow.password_hash);
    if (!isCurrentPasswordCorrect) {
      return errorResponse('Current password is incorrect', 401);
    }

    // 6. Validate new password strength (SOTA standard)
    if (newPassword.length < 8) {
      return errorResponse('New password must be at least 8 characters long', 400);
    }
    if (newPassword.length > 128) {
      return errorResponse('New password must be under 128 characters', 400);
    }

    // Complexity checks: must have uppercase, lowercase, number, and special character
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasDigit = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

    if (!hasUppercase || !hasLowercase || !hasDigit || !hasSpecial) {
      return errorResponse(
        'New password does not meet complexity requirements. It must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
        400
      );
    }

    if (currentPassword === newPassword) {
      return errorResponse('New password cannot be the same as your current password', 400);
    }

    // 7. Hash the new password
    const newPasswordHash = await hashPassword(newPassword);

    // 8. Update in database
    const now = new Date().toISOString();
    await env.DB.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
      .bind(newPasswordHash, now, auth.user.id)
      .run();

    // 9. Session Revocation: Invalidate all other active refresh sessions for this user
    try {
      const currentRefreshToken = getRefreshTokenFromRequest(request);
      if (currentRefreshToken) {
        await env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND refresh_token != ?')
          .bind(auth.user.id, currentRefreshToken)
          .run();
      } else {
        await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?')
          .bind(auth.user.id)
          .run();
      }
    } catch (sessionError) {
      console.error('Failed to revoke other sessions:', sessionError);
      // Don't fail the whole request if only session revocation fails, but log it
    }

    return jsonResponse({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    return errorResponse((error as Error).message || 'Internal server error', 500);
  }
}
