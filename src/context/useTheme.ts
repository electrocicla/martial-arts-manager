/**
 * useTheme — hook accessor for ThemeContext.
 * Split into its own module to satisfy react-refresh/only-export-components.
 */
import { useContext } from 'react';
import { ThemeContext, type ThemeContextValue } from './themeContext.shared';

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
