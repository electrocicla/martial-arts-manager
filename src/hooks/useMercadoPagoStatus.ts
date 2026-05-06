/**
 * useMercadoPagoStatus
 *
 * Lightweight hook that fetches the public-safe MercadoPago status so any
 * component (StudentTable, StudentGrid, PaymentManager…) can decide whether
 * to render the "Pay with MercadoPago" button. Cached at module level for
 * the lifetime of the page to avoid hammering the API.
 */
import { useCallback, useEffect, useState } from 'react';
import mercadoPagoService from '../services/mercadopago.service';
import type { MercadoPagoStatusDTO } from '../types/index';

interface State {
  status: MercadoPagoStatusDTO | null;
  isLoading: boolean;
  error: string | null;
}

let cache: MercadoPagoStatusDTO | null = null;
let inFlight: Promise<MercadoPagoStatusDTO | null> | null = null;
const subscribers = new Set<(value: MercadoPagoStatusDTO | null) => void>();

async function fetchStatus(force = false): Promise<MercadoPagoStatusDTO | null> {
  if (cache && !force) return cache;
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const res = await mercadoPagoService.getStatus();
    cache = res.success && res.data ? res.data : null;
    subscribers.forEach((cb) => cb(cache));
    return cache;
  })();
  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}

export function invalidateMercadoPagoStatus(): void {
  cache = null;
  void fetchStatus(true);
}

export function useMercadoPagoStatus(): State & { reload: () => Promise<void> } {
  const [state, setState] = useState<State>({ status: cache, isLoading: cache === null, error: null });

  const reload = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const value = await fetchStatus(true);
      setState({ status: value, isLoading: false, error: null });
    } catch (err) {
      setState({ status: null, isLoading: false, error: (err as Error).message });
    }
  }, []);

  useEffect(() => {
    let active = true;
    const subscriber = (value: MercadoPagoStatusDTO | null) => {
      if (active) setState({ status: value, isLoading: false, error: null });
    };
    subscribers.add(subscriber);
    if (cache === null) {
      fetchStatus().catch((err) => {
        if (active) setState({ status: null, isLoading: false, error: (err as Error).message });
      });
    } else {
      setState({ status: cache, isLoading: false, error: null });
    }
    return () => {
      active = false;
      subscribers.delete(subscriber);
    };
  }, []);

  return { ...state, reload };
}

export default useMercadoPagoStatus;
