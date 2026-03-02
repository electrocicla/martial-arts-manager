/**
 * usePullToRefresh
 *
 * Detects a "pull-down from the top" gesture on touch devices and calls
 * the provided `onRefresh` callback once the threshold is exceeded.
 *
 * Returns reactive state so the consumer can render a visual indicator:
 *   - `isPulling`   – finger is down and dragging
 *   - `isRefreshing` – refresh callback is running
 *   - `pullDistance` – current pull distance in px (0..MAX_PULL)
 *   - `handlers`    – attach to the scrollable container
 */

import { useState, useRef, useCallback, useEffect } from 'react';

const THRESHOLD = 72;   // px needed to trigger refresh
const MAX_PULL = 100;   // maximum clamped visual travel
const RESISTANCE = 0.45; // how much the indicator resists beyond natural travel

interface PullToRefreshState {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
}

export function usePullToRefresh(onRefresh: () => Promise<void>): PullToRefreshState {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const startY = useRef(0);
  const currentY = useRef(0);
  const pulling = useRef(false);
  const refreshing = useRef(false);

  /** Returns the effective scroll offset, checking both element and window. */
  const getScrollTop = (el: HTMLElement): number => {
    // If the element itself scrolls, use that
    if (el.scrollTop > 0) return el.scrollTop;
    // Otherwise fall back to page scroll
    return window.scrollY ?? document.documentElement.scrollTop ?? document.body.scrollTop ?? 0;
  };

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (refreshing.current) return;
    // Only begin tracking if we're scrolled to the very top
    const target = e.currentTarget as HTMLElement;
    if (getScrollTop(target) > 0) return;

    startY.current = e.touches[0].clientY;
    pulling.current = true;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current || refreshing.current) return;

    // If user scrolled away from top since touchstart, abort
    const target = e.currentTarget as HTMLElement;
    if (getScrollTop(target) > 0) {
      pulling.current = false;
      setIsPulling(false);
      setPullDistance(0);
      return;
    }

    currentY.current = e.touches[0].clientY;
    const delta = (currentY.current - startY.current) * RESISTANCE;

    if (delta <= 0) {
      pulling.current = false;
      setIsPulling(false);
      setPullDistance(0);
      return;
    }

    // Prevent the browser's native overscroll / bounce while we're handling it
    if (delta > 0) {
      e.preventDefault();
    }

    const clamped = Math.min(delta, MAX_PULL);
    setIsPulling(true);
    setPullDistance(clamped);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!pulling.current || refreshing.current) return;
    pulling.current = false;
    setIsPulling(false);

    if (pullDistance >= THRESHOLD * RESISTANCE) {
      // Trigger refresh
      refreshing.current = true;
      setIsRefreshing(true);
      setPullDistance(THRESHOLD * RESISTANCE); // snap to threshold height

      onRefresh().finally(() => {
        refreshing.current = false;
        setIsRefreshing(false);
        setPullDistance(0);
      });
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, onRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      refreshing.current = false;
    };
  }, []);

  return {
    isPulling,
    isRefreshing,
    pullDistance,
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
  };
}
