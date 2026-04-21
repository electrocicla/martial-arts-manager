/**
 * useBreakpoint — Single source of truth for adaptive (mount-time) layout choices.
 * Use this only when a *layout* change is needed (mobile vs desktop component).
 * For visual-only differences, use Tailwind responsive classes.
 *
 * Defaults match Tailwind v4 breakpoints.
 */
import { useEffect, useState } from 'react';

export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const widths: Record<Breakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

/**
 * Returns true once the viewport is ≥ the given breakpoint.
 * Re-evaluates on resize. Safe in SSR (returns false until mounted).
 */
export function useBreakpoint(bp: Breakpoint): boolean {
  const min = widths[bp];
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(`(min-width: ${min}px)`).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${min}px)`);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', onChange);
    setMatches(mql.matches);
    return () => mql.removeEventListener('change', onChange);
  }, [min]);

  return matches;
}

/**
 * useMatchMedia — generic media query hook. Prefer useBreakpoint for size queries.
 */
export function useMatchMedia(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', onChange);
    setMatches(mql.matches);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/**
 * usePrefersReducedMotion — true when the user has reduced-motion preferred.
 */
export function usePrefersReducedMotion(): boolean {
  return useMatchMedia('(prefers-reduced-motion: reduce)');
}
