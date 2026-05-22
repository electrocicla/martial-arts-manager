import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OverdueStudentsView from './OverdueStudentsView';
import type { OverdueStudentsResponse } from '../../../services';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_k: string, fallback?: string | Record<string, unknown>, opts?: Record<string, unknown>) => {
      // support t(key, fallback, { name }) and t(key, { name })
      let template: string | undefined;
      let interp: Record<string, unknown> | undefined;
      if (typeof fallback === 'string') {
        template = fallback;
        interp = opts;
      } else if (fallback && typeof fallback === 'object') {
        template = _k;
        interp = fallback as Record<string, unknown>;
      } else {
        template = _k;
      }
      if (!template) return _k;
      if (!interp) return template;
      return Object.entries(interp).reduce(
        (acc, [k, v]) => acc.replaceAll(`{{${k}}}`, String(v)),
        template,
      );
    },
    i18n: { language: 'en' },
  }),
}));

const showSuccess = vi.fn();
const showError = vi.fn();
vi.mock('../../../hooks/useToast', () => ({
  useToast: () => ({ success: showSuccess, error: showError, info: vi.fn(), warning: vi.fn() }),
}));

const mockNotify = vi.fn();
const mockRefresh = vi.fn();
type HookState = {
  data: OverdueStudentsResponse | null;
  isLoading: boolean;
  error: string | null;
  pendingNotifications: Set<string>;
};
let hookState: HookState = {
  data: null,
  isLoading: true,
  error: null,
  pendingNotifications: new Set<string>(),
};
vi.mock('../../../hooks/useOverdueStudents', () => ({
  useOverdueStudents: () => ({
    ...hookState,
    refresh: mockRefresh,
    notifyStudent: mockNotify,
  }),
}));

const sampleResponse: OverdueStudentsResponse = {
  students: [
    {
      studentId: 's-1',
      studentName: 'Alice',
      studentEmail: 'alice@example.com',
      studentPhone: null,
      belt: 'white',
      discipline: 'karate',
      userId: 'u-1',
      expectedAmount: 35000,
      lastPaymentDate: '2025-12-05',
      lastPaymentAmount: 35000,
      daysOverdue: 7,
      dueDate: '2026-01-05',
    },
  ],
  meta: { dueDay: null, dueDate: '2026-01-05', referenceDate: '2026-01-12', totalOverdue: 1, cycle: 'last_payment_plus_one_month' },
};

describe('OverdueStudentsView', () => {
  beforeEach(() => {
    showSuccess.mockReset();
    showError.mockReset();
    mockNotify.mockReset();
    mockRefresh.mockReset();
    hookState = {
      data: null,
      isLoading: true,
      error: null,
      pendingNotifications: new Set<string>(),
    };
  });

  it('shows the loading spinner while loading', () => {
    const { container } = render(<OverdueStudentsView />);
    expect(container.querySelector('.loading-spinner')).toBeInTheDocument();
  });

  it('renders the empty state when no overdue students', () => {
    hookState = {
      data: { students: [], meta: { dueDay: null, dueDate: '2026-01-05', referenceDate: '2026-01-12', totalOverdue: 0, cycle: 'last_payment_plus_one_month' } },
      isLoading: false,
      error: null,
      pendingNotifications: new Set<string>(),
    };
    render(<OverdueStudentsView />);
    expect(screen.getByText(/up to date|al d|em dia/i)).toBeInTheDocument();
  });

  it('renders the error card with retry', () => {
    hookState = { data: null, isLoading: false, error: 'Boom', pendingNotifications: new Set<string>() };
    render(<OverdueStudentsView />);
    expect(screen.getByText('Could not load overdue students')).toBeInTheDocument();
    expect(screen.getByText('Boom')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('renders the row and dispatches notifyStudent + success toast', async () => {
    hookState = { data: sampleResponse, isLoading: false, error: null, pendingNotifications: new Set<string>() };
    mockNotify.mockResolvedValue({ success: true });

    const onCountChange = vi.fn();
    render(<OverdueStudentsView onCountChange={onCountChange} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(onCountChange).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByRole('button', { name: /send reminder|enviar/i }));

    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith({
        studentId: 's-1',
        daysOverdue: 7,
        expectedAmount: 35000,
        monthLabel: '2026-01',
      });
      expect(showSuccess).toHaveBeenCalled();
    });
  });

  it('shows error toast when notifyStudent fails', async () => {
    hookState = { data: sampleResponse, isLoading: false, error: null, pendingNotifications: new Set<string>() };
    mockNotify.mockResolvedValue({ success: false, error: 'No linked account' });

    render(<OverdueStudentsView />);
    fireEvent.click(screen.getByRole('button', { name: /send reminder|enviar/i }));

    await waitFor(() => {
      expect(showError).toHaveBeenCalled();
    });
  });
});
