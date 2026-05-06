export const APP_PREFERENCE_KEYS = {
  androidInstallPrompt: 'hamarr_android_install_prompt_enabled',
  pullToRefresh: 'hamarr_pull_to_refresh_enabled',
} as const;

export const PREFERENCE_CHANGE_EVENT = 'hamarr:preference-change';

export type BooleanPreferenceKey = typeof APP_PREFERENCE_KEYS[keyof typeof APP_PREFERENCE_KEYS];

export function readBooleanPreference(key: BooleanPreferenceKey, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback;

  try {
    const storedValue = window.localStorage.getItem(key);
    if (storedValue === 'true') return true;
    if (storedValue === 'false') return false;
  } catch {
    return fallback;
  }

  return fallback;
}

export function writeBooleanPreference(key: BooleanPreferenceKey, value: boolean): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, value ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent(PREFERENCE_CHANGE_EVENT, { detail: { key, value } }));
  } catch {
    return;
  }
}