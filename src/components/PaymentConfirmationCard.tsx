/**
 * PaymentConfirmationCard
 *
 * SRP: render a forced-confirmation notification for `payment_pending`
 * action_type. The user MUST press "Confirm" before they can dismiss or
 * mark the notification as read. On success the admin who issued the
 * reminder receives a back-notification (handled server-side).
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertOctagon, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { notificationService } from '../services';
import type { Notification } from '../context/PollingContext';

interface PaymentConfirmationCardProps {
  notification: Notification;
  onConfirmed: (notificationId: string) => void;
}

interface PaymentReminderMetadata {
  kind?: string;
  studentId?: string;
  monthLabel?: string;
  daysOverdue?: number;
  expectedAmount?: number;
  issuedBy?: string;
  issuedAt?: string;
}

function parseMetadata(raw: string | null | undefined): PaymentReminderMetadata {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as PaymentReminderMetadata;
    }
    return {};
  } catch {
    return {};
  }
}

export default function PaymentConfirmationCard({
  notification,
  onConfirmed,
}: PaymentConfirmationCardProps) {
  const { t, i18n } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const meta = useMemo(() => parseMetadata(notification.metadata), [notification.metadata]);

  const locale = i18n.language === 'pt' ? 'pt-BR' : i18n.language === 'en' ? 'en-US' : 'es-MX';
  const formattedAmount =
    typeof meta.expectedAmount === 'number'
      ? new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: 'MXN',
          maximumFractionDigits: 0,
        }).format(meta.expectedAmount)
      : null;

  const handleConfirm = async (): Promise<void> => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await notificationService.confirm(notification.id);
      if (result.success) {
        onConfirmed(notification.id);
      } else {
        setErrorMessage(
          result.error ??
            t('notifications.payment.confirmFailed', 'Could not confirm. Please try again.'),
        );
      }
    } catch (error) {
      console.error('Error confirming payment notification:', error);
      setErrorMessage(
        t('notifications.payment.confirmFailed', 'Could not confirm. Please try again.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-amber-500/60 bg-amber-950/30 p-3">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40">
          <AlertOctagon className="w-5 h-5 text-amber-300" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-amber-100">
            {t('notifications.payment.title', 'Pending payment reminder')}
          </h4>
          <p className="text-sm text-amber-50 mt-1">{notification.message}</p>

          <ul className="mt-2 space-y-1 text-xs text-amber-200">
            {meta.monthLabel && (
              <li>
                <strong>{t('notifications.payment.month', 'Month')}:</strong> {meta.monthLabel}
              </li>
            )}
            {typeof meta.daysOverdue === 'number' && (
              <li>
                <strong>{t('notifications.payment.daysOverdue', 'Days overdue')}:</strong>{' '}
                {meta.daysOverdue}
              </li>
            )}
            {formattedAmount && (
              <li>
                <strong>{t('notifications.payment.amount', 'Amount')}:</strong> {formattedAmount}
              </li>
            )}
          </ul>

          <p className="text-xs text-amber-300 mt-2">
            {t(
              'notifications.payment.confirmRequired',
              'You must press Confirm to acknowledge this reminder.',
            )}
          </p>

          {errorMessage && (
            <p className="text-xs text-red-300 mt-2" role="alert">
              {errorMessage}
            </p>
          )}

          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => void handleConfirm()}
              disabled={isSubmitting}
              leftIcon={
                isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )
              }
            >
              {isSubmitting
                ? t('notifications.payment.confirming', 'Confirming…')
                : t('notifications.payment.confirm', 'Confirm')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
