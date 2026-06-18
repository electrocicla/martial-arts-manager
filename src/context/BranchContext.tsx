import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiClient } from '../lib/api-client';
import { branchService } from '../services/branch.service';
import type { BranchSummary } from '../types';
import { useAuth } from './AuthContext';
import { BranchContext, type BranchContextValue } from './branchContext.shared';
import { invalidateMercadoPagoStatus } from '../hooks/useMercadoPagoStatus';

const BRANCH_STORAGE_KEY = 'hamarr:selected-branch';
const MAIN_BRANCH_ID = 'main';

function readStoredBranchId(): string {
  if (typeof window === 'undefined') return MAIN_BRANCH_ID;
  try {
    return window.localStorage.getItem(BRANCH_STORAGE_KEY) || MAIN_BRANCH_ID;
  } catch {
    return MAIN_BRANCH_ID;
  }
}

export function BranchProvider({ children }: { children: ReactNode }) {
  const { user, accessToken, isLoading: authLoading } = useAuth();
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [activeBranchId, setActiveBranchId] = useState(readStoredBranchId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  apiClient.setBranchId(activeBranchId);

  const selectBranch = useCallback((branchId: string) => {
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
    if (authLoading || !user || !accessToken) {
      setBranches([]);
      return;
    }

    apiClient.setAccessToken(accessToken);
    apiClient.setBranchId(activeBranchId);
    setIsLoading(true);
    setError(null);

    const response = await branchService.getAll();
    if (response.success && response.data) {
      const nextBranches = response.data.branches;
      setBranches(nextBranches);

      if (!nextBranches.some((branch) => branch.id === activeBranchId)) {
        const fallback = nextBranches.find((branch) => branch.is_main === 1) ?? nextBranches[0];
        if (fallback) selectBranch(fallback.id);
      }
    } else {
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
