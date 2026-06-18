import { createContext } from 'react';
import type { BranchSummary } from '../types';

export interface BranchContextValue {
  branches: BranchSummary[];
  activeBranch: BranchSummary | null;
  activeBranchId: string;
  isLoading: boolean;
  error: string | null;
  selectBranch: (branchId: string) => void;
  refreshBranches: () => Promise<void>;
}

export const BranchContext = createContext<BranchContextValue | null>(null);
