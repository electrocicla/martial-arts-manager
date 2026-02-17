export function normalizeAvatarUrl(avatarUrl: unknown): string | undefined {
  if (typeof avatarUrl !== 'string' || avatarUrl.trim().length === 0) {
    return undefined;
  }

  // Already proxied through our Pages Function endpoint
  if (avatarUrl.startsWith('/api/avatars')) {
    return avatarUrl;
  }

  // Bare R2 key format
  if (avatarUrl.startsWith('avatars/')) {
    return `/api/avatars?key=${encodeURIComponent(avatarUrl)}`;
  }

  // Absolute URL that still points to an avatars path
  try {
    const parsed = new URL(avatarUrl);
    const key = parsed.pathname.startsWith('/') ? parsed.pathname.slice(1) : parsed.pathname;
    if (key.startsWith('avatars/')) {
      return `/api/avatars?key=${encodeURIComponent(key)}`;
    }
  } catch {
    // Keep original value when it's not a URL
  }

  return avatarUrl;
}