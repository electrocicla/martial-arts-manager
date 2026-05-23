/**
 * OverdueStudentRow
 * SRP: visual representation of one overdue student plus the reminder action.
 */

import { AlertTriangle, CalendarDays, CheckCircle, Mail, Phone, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { OverdueStudent } from '../../../services';
import { Button } from '../../ui/Button';
import SendPaymentReminderButton from './SendPaymentReminderButton';

interface OverdueStudentRowProps {
  student: OverdueStudent;
  isSending: boolean;
  onSend: (student: OverdueStudent) => void;
  onAddPayment?: (student: OverdueStudent) => void;
  onDeleteStudent?: (student: OverdueStudent) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (iso: string) => string;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelected?: (student: OverdueStudent, next: boolean) => void;
}

function severityClass(daysOverdue: number): string {
  if (daysOverdue >= 15) {
    return 'border-red-600/60 bg-red-950/40 ring-2 ring-red-600/40';
  }
  if (daysOverdue >= 7) {
    return 'border-orange-500/60 bg-orange-950/30 ring-1 ring-orange-500/30';
  }
  return 'border-amber-500/40 bg-amber-950/20';
}

export default function OverdueStudentRow({
  student,
  isSending,
  onSend,
  onAddPayment,
  onDeleteStudent,
  formatCurrency,
  formatDate,
  selectable = false,
  selected = false,
  onToggleSelected,
}: OverdueStudentRowProps) {
  const { t } = useTranslation();
  const noUserAccount = !student.userId;
  const canSelect = selectable && !noUserAccount;

  return (
    <article
      className={`rounded-xl p-4 border ${severityClass(student.daysOverdue)} transition-colors ${
        selected ? 'ring-2 ring-red-400' : ''
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          {selectable && (
            <label
              className={`flex items-center pt-1 ${
                canSelect ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'
              }`}
              title={
                canSelect
                  ? t('payments.overdue.selectStudent', 'Select student for bulk reminder')
                  : t(
                      'payments.overdue.noUserAccount',
                      'This student does not have a linked user account to receive notifications.',
                    )
              }
            >
              <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-error"
                checked={selected}
                disabled={!canSelect}
                onChange={(e) => onToggleSelected?.(student, e.target.checked)}
              />
              <span className="sr-only">
                {t('payments.overdue.selectStudent', 'Select student for bulk reminder')}
              </span>
            </label>
          )}
          <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/30">
            <AlertTriangle className="w-5 h-5 text-red-300" />
          </div>
          <div className="min-w-0">
            <h4 className="text-white font-semibold text-lg truncate">{student.studentName}</h4>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-300 mt-1">
              <span className="inline-flex items-center gap-1 min-w-0 max-w-full">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{student.studentEmail}</span>
              </span>
              {student.studentPhone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{student.studentPhone}</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                {t('payments.overdue.dueOn', 'Due on')} {formatDate(student.dueDate)}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <div className="text-xs text-gray-400">
                  {t('payments.overdue.daysOverdue', 'Days overdue')}
                </div>
                <div className="font-bold text-red-200">{student.daysOverdue}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">
                  {t('payments.overdue.expectedAmount', 'Expected amount')}
                </div>
                <div className="font-bold text-white">{formatCurrency(student.expectedAmount)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">
                  {t('payments.overdue.lastPayment', 'Last payment')}
                </div>
                <div className="font-medium text-gray-200">
                  {student.lastPaymentDate ? formatDate(student.lastPaymentDate) : '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400">
                  {t('payments.overdue.discipline', 'Discipline')}
                </div>
                <div className="font-medium text-gray-200 capitalize">
                  {student.discipline}{' '}
                  <span className="text-xs text-gray-400">({student.belt})</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-2 lg:items-end">
          <SendPaymentReminderButton
            isSending={isSending}
            onSend={() => onSend(student)}
            disabled={noUserAccount}
            disabledReason={
              noUserAccount
                ? t(
                    'payments.overdue.noUserAccount',
                    'This student does not have a linked user account to receive notifications.',
                  )
                : undefined
            }
          />
          {onAddPayment && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<CheckCircle className="w-4 h-4" />}
              onClick={() => onAddPayment(student)}
              title={t(
                'payments.overdue.addPaymentTooltip',
                'Record a payment for this student. Removes them from the overdue list.',
              )}
              className="w-full lg:w-auto"
            >
              {t('payments.overdue.addPayment', 'Add payment')}
            </Button>
          )}
          {onDeleteStudent && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={() => onDeleteStudent(student)}
              title={t(
                'payments.overdue.deleteStudentTooltip',
                'Delete this student account from the system while preserving historical payment records.',
              )}
              className="w-full lg:w-auto"
            >
              {t('payments.overdue.deleteStudent', 'Delete student')}
            </Button>
          )}
          {noUserAccount && (
            <p className="text-xs text-amber-300 max-w-xs lg:text-right">
              {t(
                'payments.overdue.noUserAccount',
                'This student does not have a linked user account to receive notifications.',
              )}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
