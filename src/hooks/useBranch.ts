import { useContext } from 'react';
import { BranchContext } from '../context/branchContext.shared';

export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
}
