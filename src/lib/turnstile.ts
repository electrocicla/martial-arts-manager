const turnstileSiteKeyFromEnv = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim();
const TURNSTILE_SITE_KEY = turnstileSiteKeyFromEnv || '0x4AAAAAADLmd_1VIOAIyh2i';

export function isTurnstileConfigured(): boolean {
  return TURNSTILE_SITE_KEY.length > 0;
}
