import { useContext } from 'react';
import { PrivacyContext, type PrivacyContextValue } from '../context/privacyContext.shared';

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
