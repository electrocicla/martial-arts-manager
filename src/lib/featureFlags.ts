/**
 * Feature flags for the dashboard UI/UX revamp rollout.
 * See audit/dashboard-uiux-revamp/AUDIT.md §11 and DECISIONS.md.
 *
 * Activation:
 *   - localStorage.setItem('uiV2', '1')
 *   - or visit any page with ?uiV2=1
 */

const KEY = 'uiV2';

function readStorage(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

function readUrl(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const v = new URLSearchParams(window.location.search).get(KEY);
    return v === '1';
  } catch {
    return false;
  }
}

export function isDashboardV2(): boolean {
  return readUrl() || readStorage();
}

export function enableDashboardV2(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, '1');
  } catch {
    /* noop */
  }
}

export function disableDashboardV2(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

export const FLAG_KEY = KEY;
