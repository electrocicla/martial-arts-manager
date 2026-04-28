/**
 * PrivacyContext — Hide/Show financial values (revenue, payments, profit) for
 * privacy when the instructor/admin is showing the app in front of others.
 *
 * Default: hidden=true for admin/instructor (similar to bank apps where balances
 * are masked until the user reveals them). Students never have values masked.
 *
 * Persisted in localStorage so the preference survives reloads.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'hamarr_money_hidden';
const MASK_TEXT = '••••••';

interface PrivacyContextValue {
  /** Whether financial values should be hidden in the UI. */
  hidden: boolean;
  /** Whether the toggle is available to the current user. */
  canToggle: boolean;
  /** Toggle the hidden state. */
  toggle: () => void;
  /** Explicitly set the hidden state. */
  setHidden: (next: boolean) => void;
  /** Mask helper for plain text usages. */
  mask: (value: string) => string;
}

const PrivacyContext = createContext<PrivacyContextValue | undefined>(undefined);

function readStored(): boolean | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
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
    window.localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
  } catch {
    /* noop */
  }
}

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const canToggle = user?.role === 'admin' || user?.role === 'instructor';

  // Default: hidden when admin/instructor, visible otherwise.
  const [hidden, setHiddenState] = useState<boolean>(() => {
    const stored = readStored();
    if (stored !== null) return stored;
    return true;
  });

  // When the user changes (login/logout), reset to safe defaults.
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

export function usePrivacy(): PrivacyContextValue {
  const ctx = useContext(PrivacyContext);
  if (!ctx) {
    // Safe fallback when used outside the provider (e.g. tests).
    return {
      hidden: false,
      canToggle: false,
      toggle: () => {},
      setHidden: () => {},
      mask: (v: string) => v,
    };
  }
  return ctx;
}

export const MONEY_MASK = MASK_TEXT;
