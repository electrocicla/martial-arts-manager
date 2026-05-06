import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PaymentHistoryView from './PaymentHistoryView';
import type { PaymentHistoryResponse } from '../../../services';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_k: string, fallback?: string) => fallback ?? _k,
    i18n: { language: 'en' },
  }),
}));

const mockRefresh = vi.fn();
type HookState = {
  data: PaymentHistoryResponse | null;
  isLoading: boolean;
  error: string | null;
};
let hookState: HookState = { data: null, isLoading: true, error: null };
vi.mock('../../../hooks/usePaymentHistory', () => ({
  usePaymentHistory: () => ({ ...hookState, refresh: mockRefresh }),
}));

const sample: PaymentHistoryResponse = {
  months: [
    {
      monthKey: '2026-01',
      totalAmount: 35000,
      totalCount: 1,
      completedCount: 1,
      pendingCount: 0,
      failedCount: 0,
      refundedCount: 0,
      payments: [
        {
          id: 'p-1',
          student_id: 's-1',
          student_name: 'Alice',
          student_email: 'alice@example.com',
          amount: 35000,
          date: '2026-01-05',
          type: 'monthly',
          notes: null,
          status: 'completed',
          payment_method: 'cash',
          created_at: '2026-01-05T12:00:00Z',
          updated_at: '2026-01-05T12:00:00Z',
        },
      ],
    },
  ],
  totals: {
    totalAmount: 35000,
    totalCount: 1,
    completedAmount: 35000,
    pendingAmount: 0,
    monthsTracked: 1,
  },
};

describe('PaymentHistoryView', () => {
  beforeEach(() => {
    mockRefresh.mockReset();
    hookState = { data: null, isLoading: true, error: null };
  });

  it('shows loading spinner', () => {
    const { container } = render(<PaymentHistoryView />);
    expect(container.querySelector('.loading-spinner')).toBeInTheDocument();
  });

  it('shows the empty state with no months', () => {
    hookState = {
      data: { months: [], totals: { totalAmount: 0, totalCount: 0, completedAmount: 0, pendingAmount: 0, monthsTracked: 0 } },
      isLoading: false,
      error: null,
    };
    render(<PaymentHistoryView />);
    // Renders the EmptyState component (no toolbar, no summary).
    expect(screen.getByText(/no payment history yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /refresh/i })).not.toBeInTheDocument();
  });

  it('shows error card and triggers retry', () => {
    hookState = { data: null, isLoading: false, error: 'Boom' };
    render(<PaymentHistoryView />);
    expect(screen.getByText('Could not load payment history')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('renders summary + month card with the row data', () => {
    hookState = { data: sample, isLoading: false, error: null };
    render(<PaymentHistoryView />);

    expect(screen.getByText('Payment history')).toBeInTheDocument();
    // First month is auto-expanded → student name renders.
    // The details panel renders both a mobile card layout and a desktop table
    // (Tailwind responsive classes hide one or the other in the browser; in
    // jsdom both are present), so the student name appears twice.
    expect(screen.getAllByText('Alice').length).toBeGreaterThanOrEqual(1);
  });

  it('triggers refresh from the toolbar button', () => {
    hookState = { data: sample, isLoading: false, error: null };
    render(<PaymentHistoryView />);
    fireEvent.click(screen.getByRole('button', { name: /refresh/i }));
    expect(mockRefresh).toHaveBeenCalled();
  });
});
