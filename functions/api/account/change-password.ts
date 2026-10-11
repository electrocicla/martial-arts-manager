import type { Env } from '../../types/index';
import { authenticateUser, getRefreshTokenFromRequest } from '../../middleware/auth';
import { verifyPassword, hashPassword } from '../../utils/hash';
import { errorResponse, jsonResponse } from '../../utils/response';

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

function parseChangePasswordRequest(value: unknown): ChangePasswordRequest | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const fields = value as Record<string, unknown>;
  if (typeof fields.currentPassword !== 'string' || typeof fields.newPassword !== 'string') {
    return null;
  }
  return { currentPassword: fields.currentPassword, newPassword: fields.newPassword };
}

function passwordStrengthError(password: string): string | null {
  if (password.length < 8 || password.length > 128) {
    return 'New password must contain between 8 and 128 characters';
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return 'New password must contain uppercase, lowercase, number, and special characters';
  }
  return null;
}

/**
 * Updates a global identity password. An identity can belong to multiple
 * academies, so the new password applies to every one of its memberships.
 * Password update and refresh-session revocation must commit atomically.
 */
export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return errorResponse(auth.error, auth.status ?? 401);
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }

    const data = parseChangePasswordRequest(payload);
    if (!data || !data.currentPassword || !data.newPassword || data.currentPassword.length > 256) {
      return errorResponse('Current password and new password are required', 400);
    }

    const currentHash = await env.DB.prepare('SELECT password_hash FROM users WHERE id = ?')
      .bind(auth.user.id)
      .first<{ password_hash: string }>();
    if (!currentHash) return errorResponse('User not found', 404);
    if (!await verifyPassword(data.currentPassword, currentHash.password_hash)) {
      return errorResponse('Current password is incorrect', 401);
    }

    const strengthError = passwordStrengthError(data.newPassword);
    if (strengthError) return errorResponse(strengthError, 400);
    if (data.currentPassword === data.newPassword) {
      return errorResponse('New password must differ from the current password', 400);
    }

    const newHash = await hashPassword(data.newPassword);
    const currentRefreshToken = getRefreshTokenFromRequest(request);
    const revokeSessions = currentRefreshToken
      ? env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND refresh_token != ?')
        .bind(auth.user.id, currentRefreshToken)
      : env.DB.prepare('DELETE FROM sessions WHERE user_id = ?')
        .bind(auth.user.id);
    // A failed session deletion must also roll back the password update.
    const results = await env.DB.batch([
      env.DB.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ? AND password_hash = ?')
        .bind(newHash, new Date().toISOString(), auth.user.id, currentHash.password_hash),
      revokeSessions,
    ]);
    if (results.length !== 2 || !results.every((result) => result.success) || results[0].meta.changes !== 1) {
      return errorResponse('Password was not changed. Please retry.', 409);
    }

    return jsonResponse({
      success: true,
      message: 'Password updated. Other refresh sessions have been revoked.',
    });
  } catch (error: unknown) {
    console.error('Password change failed:', error instanceof Error ? error.message : 'Unknown error');
    return errorResponse('Unable to change password', 500);
  }
}
