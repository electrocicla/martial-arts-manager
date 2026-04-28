/**
 * Shared constants and types for PrivacyContext.
 * Kept in a separate file so that react-refresh/only-export-components is satisfied.
 */
import { createContext } from 'react';

export const MONEY_MASK = '••••••';
export const PRIVACY_STORAGE_KEY = 'hamarr_money_hidden';

export interface PrivacyContextValue {
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

export const PrivacyContext = createContext<PrivacyContextValue | undefined>(undefined);
