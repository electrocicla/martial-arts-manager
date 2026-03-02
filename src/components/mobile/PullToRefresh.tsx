/**
 * PullToRefresh
 *
 * Wraps its children with touch-based pull-to-refresh behaviour.
 * Only rendered / active on touch-capable devices.
 *
 * On pull release (past threshold) it dispatches invalidation events
 * for every data type so all mounted hooks refetch automatically.
 */

import { useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { dispatchDataEvent, type DataEventType } from '../../lib/dataEvents';

const ALL_DATA_EVENTS: DataEventType[] = [
  'students',
  'payments',
  'attendance',
  'classes',
  'pendingApprovals',
  'qrCodes',
  'notifications',
];

/** Returns true only on touch-capable devices (mobile / tablet). */
function isTouchDevice(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0)
  );
}

interface PullToRefreshProps {
  children: React.ReactNode;
}

export default function PullToRefresh({ children }: PullToRefreshProps) {
  // Skip entirely on desktop / non-touch environments
  if (!isTouchDevice()) {
    return <>{children}</>;
  }

  return <PullToRefreshInner>{children}</PullToRefreshInner>;
}

function PullToRefreshInner({ children }: PullToRefreshProps) {
  const handleRefresh = useCallback(async () => {
    // Small deliberate delay so the spinner is visible for at least one beat
    await new Promise<void>((resolve) => setTimeout(resolve, 300));
    ALL_DATA_EVENTS.forEach((type) => dispatchDataEvent(type));
    // Give hooks a moment to settle before hiding the indicator
    await new Promise<void>((resolve) => setTimeout(resolve, 400));
  }, []);

  const { isPulling, isRefreshing, pullDistance, handlers } = usePullToRefresh(handleRefresh);

  // Visible when pulling or refreshing
  const indicatorVisible = isPulling || isRefreshing;

  // Indicator height follows pull distance; snaps to fixed height while refreshing
  const indicatorHeight = isRefreshing ? 56 : pullDistance;

  // Rotation: 0° at start, 180° at full threshold
  const MAX_PULL = 100;
  const rotation = Math.min((pullDistance / (MAX_PULL * 0.45)) * 180, 180);

  return (
    <div
      className="relative flex flex-col w-full"
      style={{ overflowX: 'hidden' }}
      {...handlers}
    >
      {/* Pull indicator */}
      <div
        aria-hidden="true"
        style={{
          height: indicatorHeight,
          overflow: 'hidden',
          transition: isPulling ? 'none' : 'height 0.25s ease-out',
          willChange: 'height',
          // Keep layout flow – don't use absolute positioning so content is pushed down
          flexShrink: 0,
        }}
        className="flex items-center justify-center w-full"
      >
        {indicatorVisible && (
          <div
            className="flex items-center justify-center rounded-full bg-base-200 shadow-md"
            style={{
              width: 40,
              height: 40,
              opacity: Math.min(pullDistance / 20, 1),
            }}
          >
            <RefreshCw
              size={20}
              className={`text-primary ${isRefreshing ? 'animate-spin' : ''}`}
              style={
                !isRefreshing
                  ? { transform: `rotate(${rotation}deg)`, transition: 'none' }
                  : undefined
              }
            />
          </div>
        )}
      </div>

      {/* Page content */}
      <div className="flex-1">{children}</div>
    </div>
  );
}
