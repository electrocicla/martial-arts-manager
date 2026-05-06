/**
 * SendPaymentReminderButton
 * SRP: triggers the "send pending payment notification" action with toast
 * feedback. Owns no business state of its own — receives loading/result via
 * callbacks.
 */

import { Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../ui/Button';

interface SendPaymentReminderButtonProps {
  isSending: boolean;
  onSend: () => void;
  disabled?: boolean;
  disabledReason?: string;
}

export default function SendPaymentReminderButton({
  isSending,
  onSend,
  disabled,
  disabledReason,
}: SendPaymentReminderButtonProps) {
  const { t } = useTranslation();
  const isDisabled = Boolean(disabled || isSending);

  return (
    <Button
      type="button"
      variant="primary"
      size="sm"
      leftIcon={<Send className="w-4 h-4" />}
      onClick={onSend}
      disabled={isDisabled}
      title={isDisabled ? disabledReason : undefined}
    >
      {isSending
        ? t('payments.overdue.sending', 'Sending…')
        : t('payments.overdue.sendReminder', 'Enviar notificación de pago pendiente')}
    </Button>
  );
}
