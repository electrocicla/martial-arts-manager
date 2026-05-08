/**
 * Cloudflare Turnstile server-side token verification utility
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
}

/**
 * Verify a Turnstile challenge token against the Cloudflare siteverify API.
 *
 * @param token   - The cf-turnstile-response token submitted by the client
 * @param secret  - The Turnstile secret key from env.TURNSTILE_SECRET
 * @param ip      - (Optional) The visitor's IP address for extra validation
 * @returns true if the token is valid, false otherwise
 */
export async function verifyTurnstileToken(
  token: string,
  secret: string,
  ip?: string
): Promise<boolean> {
  if (!token || !secret) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set('remoteip', ip);

  const res = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    }
  );

  if (!res.ok) return false;

  const data = await res.json() as TurnstileVerifyResponse;
  return data.success === true;
}
