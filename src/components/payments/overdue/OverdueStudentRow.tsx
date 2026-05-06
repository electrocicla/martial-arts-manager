/**
 * OverdueStudentRow
 * SRP: visual representation of one overdue student plus the reminder action.
 */

import { AlertTriangle, CalendarDays, Mail, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { OverdueStudent } from '../../../services';
import SendPaymentReminderButton from './SendPaymentReminderButton';

interface OverdueStudentRowProps {
  student: OverdueStudent;
  isSending: boolean;
  onSend: (student: OverdueStudent) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (iso: string) => string;
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
  formatCurrency,
  formatDate,
}: OverdueStudentRowProps) {
  const { t } = useTranslation();
  const noUserAccount = !student.userId;

  return (
    <article
      className={`rounded-xl p-4 border ${severityClass(student.daysOverdue)} transition-colors`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/30">
            <AlertTriangle className="w-5 h-5 text-red-300" />
          </div>
          <div className="min-w-0">
            <h4 className="text-white font-semibold text-lg truncate">{student.studentName}</h4>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-300 mt-1">
              <span className="inline-flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                {student.studentEmail}
              </span>
              {student.studentPhone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {student.studentPhone}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
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
