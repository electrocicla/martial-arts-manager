/**
 * PrivacyContext — Hide/Show financial values (revenue, payments, profit) for
 * privacy when the instructor/admin is showing the app in front of others.
 *
 * Default: hidden=true for admin/instructor (similar to bank apps where balances
 * are masked until the user reveals them). Students never have values masked.
 *
 * Persisted in localStorage so the preference survives reloads.
 *
 * Only exports a single React component (PrivacyProvider) so that
 * react-refresh/only-export-components is satisfied.
 * Constants and the hook live in:
 *   - src/context/privacyContext.shared.ts  (MONEY_MASK, PrivacyContextValue, PrivacyContext)
 *   - src/hooks/usePrivacy.ts               (usePrivacy)
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import {
  PrivacyContext,
  PRIVACY_STORAGE_KEY,
  type PrivacyContextValue,
} from './privacyContext.shared';

const MASK_TEXT = '••••••';

function readStored(): boolean | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(PRIVACY_STORAGE_KEY);
    if (v === 'true') return true;
    if (v === 'false') return false;
  } catch {
    /* noop */
  }
  return null;
}

function writeStored(value: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PRIVACY_STORAGE_KEY, value ? 'true' : 'false');
  } catch {
    /* noop */
  }
}

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const canToggle = user?.role === 'admin' || user?.role === 'instructor';

  const [hidden, setHiddenState] = useState<boolean>(() => {
    const stored = readStored();
    if (stored !== null) return stored;
    return true;
  });

  useEffect(() => {
    if (!canToggle) {
      setHiddenState(false);
      return;
    }
    const stored = readStored();
    setHiddenState(stored !== null ? stored : true);
  }, [canToggle, user?.id]);

  const setHidden = useCallback((next: boolean) => {
    setHiddenState(next);
    writeStored(next);
  }, []);

  const toggle = useCallback(() => {
    setHiddenState((prev) => {
      const next = !prev;
      writeStored(next);
      return next;
    });
  }, []);

  const mask = useCallback(
    (value: string) => (hidden && canToggle ? MASK_TEXT : value),
    [hidden, canToggle]
  );

  const effectiveHidden = canToggle && hidden;

  const value = useMemo<PrivacyContextValue>(
    () => ({
      hidden: effectiveHidden,
      canToggle,
      toggle,
      setHidden,
      mask,
    }),
    [effectiveHidden, canToggle, toggle, setHidden, mask]
  );

  return <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>;
}

