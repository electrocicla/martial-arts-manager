/**
 * QuickAddPaymentModal
 *
 * Lightweight modal that lets an admin/instructor record a payment for a
 * specific overdue student without leaving the Overdue tab. Pre-fills
 * student, today's date, the expected amount and "monthly" type.
 *
 * SRP: only renders the form and dispatches the mutation; success/error
 * notifications are handled by the parent through the optional `onSubmit`
 * return value.
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, X } from 'lucide-react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { usePayments } from '../../../hooks/usePayments';
import { useToast } from '../../../hooks/useToast';
import { dispatchDataEvent } from '../../../lib/dataEvents';
import type { OverdueStudent } from '../../../services';
import type { PaymentFormData } from '../../../types/index';

interface QuickAddPaymentModalProps {
  isOpen: boolean;
  student: OverdueStudent | null;
  onClose: () => void;
  onSuccess?: (student: OverdueStudent) => void;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function QuickAddPaymentModal({
  isOpen,
  student,
  onClose,
  onSuccess,
}: QuickAddPaymentModalProps) {
  const { t } = useTranslation();
  const { createPayment } = usePayments();
  const { success: showSuccess, error: showError } = useToast();

  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(todayIso);
  const [type, setType] = useState<PaymentFormData['type']>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Re-prime form whenever a different student is opened.
  useEffect(() => {
    if (!isOpen || !student) return;
    setAmount(student.expectedAmount > 0 ? String(student.expectedAmount) : '');
    setDate(todayIso());
    setType('monthly');
    setPaymentMethod('cash');
    setNotes('');
  }, [isOpen, student]);

  const expectedFormatted = useMemo(() => {
    if (!student) return null;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(student.expectedAmount);
  }, [student]);

  if (!student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      showError(
        t('payments.quickAdd.invalidAmount', 'Amount must be greater than zero'),
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createPayment({
        studentId: student.studentId,
        amount: numericAmount,
        date,
        type,
        status: 'completed',
        paymentMethod,
        notes: notes.trim() || undefined,
      });

      if (result) {
        showSuccess(
          t('payments.quickAdd.success', 'Payment recorded for {{name}}', {
            name: student.studentName,
          }),
          {
            description: t(
              'payments.quickAdd.successDescription',
              'The student will be removed from the overdue list once data refreshes.',
            ),
          },
        );
        dispatchDataEvent('payments');
        onSuccess?.(student);
        onClose();
      } else {
        showError(t('payments.quickAdd.error', 'Could not record payment'), {
          description: t('payments.actions.tryAgain', 'Please try again.'),
        });
      }
    } catch (err) {
      showError(t('payments.quickAdd.error', 'Could not record payment'), {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => undefined : onClose}
      title={t('payments.quickAdd.title', 'Record payment')}
      size="md"
      closeOnBackdrop={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        <div className="rounded-lg border border-gray-700 bg-gray-900/60 p-3">
          <div className="text-sm text-gray-400">
            {t('payments.quickAdd.forStudent', 'For student')}
          </div>
          <div className="text-white font-semibold">{student.studentName}</div>
          <div className="text-xs text-gray-400 truncate">{student.studentEmail}</div>
          {expectedFormatted && (
            <div className="text-xs text-amber-300 mt-1">
              {t('payments.overdue.expectedAmount', 'Expected amount')}: {expectedFormatted}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="quick-add-amount" className="block text-sm font-semibold text-gray-200 mb-1.5">
              {t('payments.form.amount', 'Amount')}
            </label>
            <Input
              id="quick-add-amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="quick-add-date" className="block text-sm font-semibold text-gray-200 mb-1.5">
              {t('payments.form.paymentDate', 'Payment date')}
            </label>
            <Input
              id="quick-add-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="quick-add-type" className="block text-sm font-semibold text-gray-200 mb-1.5">
              {t('payments.form.paymentType', 'Payment type')}
            </label>
            <Select
              id="quick-add-type"
              value={type}
              onChange={(e) => setType(e.target.value as PaymentFormData['type'])}
              options={[
                { value: 'monthly', label: t('payments.filters.type.monthly', 'Monthly') },
                { value: 'drop-in', label: t('payments.filters.type.dropIn', 'Drop-in') },
                { value: 'private', label: t('payments.filters.type.private', 'Private') },
                { value: 'equipment', label: t('payments.filters.type.equipment', 'Equipment') },
                { value: 'other', label: t('payments.filters.type.other', 'Other') },
              ]}
            />
          </div>
          <div>
            <label htmlFor="quick-add-method" className="block text-sm font-semibold text-gray-200 mb-1.5">
              {t('payments.form.paymentMethod', 'Payment method')}
            </label>
            <Select
              id="quick-add-method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              options={[
                { value: 'cash', label: t('payments.method.cash', 'Cash') },
                { value: 'transfer', label: t('payments.method.transfer', 'Transfer') },
                { value: 'card', label: t('payments.method.card', 'Card') },
                { value: 'other', label: t('payments.method.other', 'Other') },
              ]}
            />
          </div>
        </div>

        <div>
          <label htmlFor="quick-add-notes" className="block text-sm font-semibold text-gray-200 mb-1.5">
            {t('payments.form.notes', 'Notes')}
          </label>
          <Input
            id="quick-add-notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('payments.form.notesPlaceholder', 'Optional reference')}
          />
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
            leftIcon={<X className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSubmitting}
            leftIcon={<CheckCircle className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            {isSubmitting
              ? t('payments.quickAdd.saving', 'Saving\u2026')
              : t('payments.quickAdd.confirm', 'Record payment')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
