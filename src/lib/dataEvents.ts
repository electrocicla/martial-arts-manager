/**
 * Lightweight data-invalidation event bus.
 *
 * Hooks dispatch an event after any mutation so that every other mounted hook
 * instance that manages the same resource refetches from the server immediately,
 * keeping all views in sync without a full page reload.
 *
 * Usage:
 *   // After a mutation in usePayments:
 *   dispatchDataEvent('payments');
 *
 *   // Inside a hook that should react to payments changes:
 *   useDataEvent('payments', reload);
 */

export type DataEventType =
  | 'students'
  | 'payments'
  | 'attendance'
  | 'classes'
  | 'pendingApprovals'
  | 'qrCodes'
  | 'notifications';

const DATA_EVENT = 'hamarr:dataChanged';

/** Dispatch an invalidation signal for the given resource type. */
export function dispatchDataEvent(type: DataEventType): void {
  window.dispatchEvent(new CustomEvent<{ type: DataEventType }>(DATA_EVENT, { detail: { type } }));
}

/** Subscribe to invalidation events for one or more resource types. Returns cleanup fn. */
export function onDataEvent(
  types: DataEventType | DataEventType[],
  callback: () => void
): () => void {
  const watched = Array.isArray(types) ? types : [types];
  const handler = (e: Event) => {
    const { type } = (e as CustomEvent<{ type: DataEventType }>).detail;
    if (watched.includes(type)) callback();
  };
  window.addEventListener(DATA_EVENT, handler);
  return () => window.removeEventListener(DATA_EVENT, handler);
}
