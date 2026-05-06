/**
 * MercadoPagoPayButton
 *
 * Renders a "Pay with MercadoPago" action for a single student. Hidden when
 * MercadoPago is not active. On click, asks the API to create a Checkout Pro
 * preference and opens the hosted checkout in a new tab.
 *
 * SRP: this component only orchestrates the click → service call → redirect
 * flow and renders user-facing feedback. Configuration lives in the admin
 * Settings page; reusable wherever a student row is shown.
 */
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { useToast } from '../../hooks/useToast';
import useMercadoPagoStatus from '../../hooks/useMercadoPagoStatus';
import mercadoPagoService from '../../services/mercadopago.service';

interface Props {
  studentId: string;
  amount?: number;
  type?: 'monthly' | 'drop-in' | 'private' | 'equipment' | 'other';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  className?: string;
  fullWidth?: boolean;
  label?: string;
}

export default function MercadoPagoPayButton({
  studentId,
  amount,
  type = 'monthly',
  size = 'sm',
  variant = 'primary',
  className,
  fullWidth = false,
  label,
}: Props) {
  const { t } = useTranslation();
  const { status, isLoading: statusLoading } = useMercadoPagoStatus();
  const { success, error } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const handleClick = useCallback(async () => {
    if (!studentId || isCreating) return;
    setIsCreating(true);
    try {
      const res = await mercadoPagoService.createPreference({ studentId, amount, type });
      if (!res.success || !res.data) {
        error(t('mercadopago.messages.checkoutFailed'), { description: res.error });
        return;
      }
      success(t('mercadopago.messages.checkoutOpened'));
      const opened = window.open(res.data.initPoint, '_blank', 'noopener,noreferrer');
      if (!opened) {
        // Popup blocked → fallback to same-tab navigation.
        window.location.href = res.data.initPoint;
      }
    } catch (err) {
      error(t('mercadopago.messages.checkoutFailed'), {
        description: (err as Error).message,
      });
    } finally {
      setIsCreating(false);
    }
  }, [studentId, amount, type, isCreating, success, error, t]);

  if (statusLoading) return null;
  if (!status?.active) return null;

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={isCreating}
      size={size}
      variant={variant}
      className={`${fullWidth ? 'w-full' : ''} ${className ?? ''}`}
      leftIcon={
        isCreating
          ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          : <CreditCard className="h-4 w-4" aria-hidden="true" />
      }
      title={t('mercadopago.actions.pay')}
    >
      {isCreating ? t('mercadopago.actions.creating') : (label ?? t('mercadopago.actions.pay'))}
    </Button>
  );
}
