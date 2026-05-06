import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import PaymentConfirmationCard from './PaymentConfirmationCard';
import type { Notification } from '../context/PollingContext';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
    i18n: { language: 'en' },
  }),
}));

const mockConfirm = vi.fn();
vi.mock('../services', () => ({
  notificationService: {
    confirm: (id: string) => mockConfirm(id),
  },
}));

function buildNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 'notif-1',
    user_id: 'u-1',
    type: 'info',
    title: 'Payment overdue',
    message: 'Your monthly fee is overdue.',
    is_read: false,
    is_active: true,
    created_at: '2026-01-12T00:00:00Z',
    action_type: 'payment_pending',
    requires_confirmation: 1,
    confirmation_notify_user_id: 'admin-1',
    metadata: JSON.stringify({
      kind: 'payment_pending',
      monthLabel: '2026-01',
      daysOverdue: 7,
      expectedAmount: 35000,
      issuedBy: 'admin-1',
      issuedAt: '2026-01-12T00:00:00Z',
    }),
    ...overrides,
  } as Notification;
}

describe('PaymentConfirmationCard', () => {
  beforeEach(() => {
    mockConfirm.mockReset();
  });

  it('renders the message and parsed metadata fields', () => {
    render(<PaymentConfirmationCard notification={buildNotification()} onConfirmed={vi.fn()} />);

    expect(screen.getByText('Pending payment reminder')).toBeInTheDocument();
    expect(screen.getByText('Your monthly fee is overdue.')).toBeInTheDocument();
    expect(screen.getByText('2026-01')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    // Currency formatted via Intl in en-US (MXN)
    expect(screen.getByText(/MX\$\s?35,000/)).toBeInTheDocument();
  });

  it('calls notificationService.confirm and reports back on success', async () => {
    mockConfirm.mockResolvedValue({ success: true, data: { success: true } });
    const onConfirmed = vi.fn();

    render(<PaymentConfirmationCard notification={buildNotification()} onConfirmed={onConfirmed} />);

    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalledWith('notif-1');
      expect(onConfirmed).toHaveBeenCalledWith('notif-1');
    });
  });

  it('surfaces backend error message in alert role and does not call onConfirmed', async () => {
    mockConfirm.mockResolvedValue({ success: false, error: 'Notification not found' });
    const onConfirmed = vi.fn();

    render(<PaymentConfirmationCard notification={buildNotification()} onConfirmed={onConfirmed} />);

    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Notification not found');
    });
    expect(onConfirmed).not.toHaveBeenCalled();
  });

  it('handles missing metadata gracefully', () => {
    render(
      <PaymentConfirmationCard
        notification={buildNotification({ metadata: null })}
        onConfirmed={vi.fn()}
      />,
    );

    expect(screen.getByText('Pending payment reminder')).toBeInTheDocument();
    // None of the optional fields should render
    expect(screen.queryByText('Month:')).not.toBeInTheDocument();
  });

  // Avoid unused import warning for `act` while keeping it available for future expansion
  it('exports act from testing-library (sanity)', () => {
    expect(typeof act).toBe('function');
  });
});
