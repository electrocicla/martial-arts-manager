import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useContext } from 'react';
import { BranchProvider } from './BranchContext';
import { BranchContext } from './branchContext.shared';
import { branchService } from '../services/branch.service';
import { apiClient } from '../lib/api-client';
import { BRANCH_STORAGE_KEY } from '../lib/organization';
import type { BranchSummary } from '../types';

vi.mock('../hooks/useMercadoPagoStatus', () => ({ invalidateMercadoPagoStatus: vi.fn() }));

vi.mock('./AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'staff', role: 'admin', organization_id: 'hamarr' },
    accessToken: 'test-token',
    isLoading: false,
  }),
}));

function branch(id: string, isMain: number): BranchSummary {
  return {
    id, name: id, is_main: isMain, is_active: 1,
    address: null, phone: null, email: null, notes: null,
    created_at: '', updated_at: '',
    student_count: 0, active_student_count: 0, total_revenue: 0,
    monthly_revenue: 0, pending_revenue: 0,
    active_class_count: 0, upcoming_class_count: 0, attendance_count: 0,
  };
}

function BranchActions() {
  const context = useContext(BranchContext);
  if (!context) throw new Error('BranchContext not mounted');
  return (
    <>
      <div data-testid="branch-id">{context.activeBranchId}</div>
      <div data-testid="loading">{context.isLoading ? 'loading' : 'ready'}</div>
      <button onClick={() => context.selectBranch('foreign-tenant')}>Foreign branch</button>
      <button onClick={() => context.selectBranch('secondary')}>Authorized branch</button>
    </>
  );
}

describe('BranchProvider tenant-safe branch selection', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    apiClient.setBranchId(null);
    apiClient.setAccessToken(null);
  });

  it('rejects arbitrary branch selections after loading the authorized list', async () => {
    vi.spyOn(branchService, 'getAll').mockResolvedValue({
      success: true,
      data: { branches: [branch('main', 1), branch('secondary', 0)] },
    });
    const user = userEvent.setup();
    render(<BranchProvider><BranchActions /></BranchProvider>);

    await waitFor(() => expect(screen.getByTestId('branch-id')).toHaveTextContent('main'));
    await user.click(screen.getByRole('button', { name: 'Foreign branch' }));
    expect(screen.getByTestId('branch-id')).toHaveTextContent('main');
    expect(apiClient.getBranchId()).toBe('main');
    expect(window.localStorage.getItem(BRANCH_STORAGE_KEY)).toBe('main');

    await user.click(screen.getByRole('button', { name: 'Authorized branch' }));
    await waitFor(() => expect(screen.getByTestId('branch-id')).toHaveTextContent('secondary'));
    expect(apiClient.getBranchId()).toBe('secondary');
  });

  it('does not activate a stored foreign branch when none are authorized', async () => {
    window.localStorage.setItem(BRANCH_STORAGE_KEY, 'foreign-tenant');
    vi.spyOn(branchService, 'getAll').mockResolvedValue({
      success: true,
      data: { branches: [] },
    });
    render(<BranchProvider><BranchActions /></BranchProvider>);
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));
    expect(apiClient.getBranchId()).toBeNull();
    expect(screen.getByTestId('branch-id')).toBeEmptyDOMElement();
  });
});
