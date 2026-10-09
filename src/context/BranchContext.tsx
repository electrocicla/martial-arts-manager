import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { apiClient } from '../lib/api-client';
import { branchService } from '../services/branch.service';
import { BRANCH_STORAGE_KEY, INITIAL_BRANCH_ID, resolveAuthorizedBranchId } from '../lib/organization';
import type { BranchSummary } from '../types';
import { useAuth } from './AuthContext';
import { BranchContext, type BranchContextValue } from './branchContext.shared';
import { invalidateMercadoPagoStatus } from '../hooks/useMercadoPagoStatus';

function readStoredBranchId(): string {
  if (typeof window === 'undefined') return INITIAL_BRANCH_ID;
  try {
    return window.localStorage.getItem(BRANCH_STORAGE_KEY) || INITIAL_BRANCH_ID;
  } catch {
    return INITIAL_BRANCH_ID;
  }
}

export function BranchProvider({ children }: { children: ReactNode }) {
  const { user, accessToken, isLoading: authLoading } = useAuth();
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const preferredBranchIdRef = useRef(readStoredBranchId());
  const branchLoadGenerationRef = useRef(0);
  const authorizedBranchIdsRef = useRef<ReadonlySet<string>>(new Set());
  // Do not trust a persisted branch until the backend returns authorized branches.
  const [activeBranchId, setActiveBranchId] = useState(INITIAL_BRANCH_ID);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  apiClient.setBranchId(activeBranchId || null);

  const selectBranch = useCallback((branchId: string) => {
    // A stale or forged branch selection must never become an API header.
    if (!authorizedBranchIdsRef.current.has(branchId)) return;
    branchLoadGenerationRef.current += 1;
    preferredBranchIdRef.current = branchId;
    apiClient.setBranchId(branchId);
    invalidateMercadoPagoStatus();
    setActiveBranchId(branchId);
    try {
      window.localStorage.setItem(BRANCH_STORAGE_KEY, branchId);
    } catch {
      // In-memory branch selection remains functional.
    }
  }, []);

  const refreshBranches = useCallback(async () => {
    const requestGeneration = ++branchLoadGenerationRef.current;
    if (authLoading || !user || !accessToken) {
      authorizedBranchIdsRef.current = new Set();
      apiClient.setBranchId(null);
      setActiveBranchId(INITIAL_BRANCH_ID);
      setBranches([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    apiClient.setAccessToken(accessToken);
    apiClient.setBranchId(activeBranchId || null);
    setIsLoading(true);
    setError(null);

    const response = await branchService.getAll();
    // Ignore a stale response after logout or a newer branch refresh.
    if (requestGeneration !== branchLoadGenerationRef.current) return;
    if (response.success && response.data) {
      const nextBranches = response.data.branches;
      authorizedBranchIdsRef.current = new Set(nextBranches.map((branch) => branch.id));
      setBranches(nextBranches);

      const resolvedBranchId = resolveAuthorizedBranchId(
        nextBranches,
        activeBranchId || preferredBranchIdRef.current,
      );
      if (resolvedBranchId && resolvedBranchId !== activeBranchId) {
        selectBranch(resolvedBranchId);
      } else if (!resolvedBranchId) {
        // Zero authorized branches must not preserve a prior account's selection.
        apiClient.setBranchId(null);
        invalidateMercadoPagoStatus();
        setActiveBranchId(INITIAL_BRANCH_ID);
      }
    } else {
      authorizedBranchIdsRef.current = new Set();
      apiClient.setBranchId(null);
      invalidateMercadoPagoStatus();
      setActiveBranchId(INITIAL_BRANCH_ID);
      setBranches([]);
      setError(response.error || 'No se pudieron cargar las sedes');
    }
    setIsLoading(false);
  }, [accessToken, activeBranchId, authLoading, selectBranch, user]);

  useEffect(() => {
    void refreshBranches();
  }, [refreshBranches]);

  const activeBranch = useMemo(
    () => branches.find((branch) => branch.id === activeBranchId) ?? null,
    [activeBranchId, branches],
  );

  const value = useMemo<BranchContextValue>(() => ({
    branches,
    activeBranch,
    activeBranchId,
    isLoading,
    error,
    selectBranch,
    refreshBranches,
  }), [
    activeBranch,
    activeBranchId,
    branches,
    error,
    isLoading,
    refreshBranches,
    selectBranch,
  ]);

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}
