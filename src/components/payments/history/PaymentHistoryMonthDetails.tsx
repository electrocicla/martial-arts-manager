/**
 * PaymentHistoryMonthDetails
 * SRP: render the expanded payments table for a single month.
 */

import { useTranslation } from 'react-i18next';
import type { PaymentHistoryRow } from '../../../services';

interface PaymentHistoryMonthDetailsProps {
  payments: PaymentHistoryRow[];
  formatCurrency: (amount: number) => string;
  formatDateTime: (iso: string) => string;
}

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-green-500/20 text-green-200 ring-green-500/40',
  pending: 'bg-yellow-500/20 text-yellow-200 ring-yellow-500/40',
  failed: 'bg-red-500/20 text-red-200 ring-red-500/40',
  refunded: 'bg-gray-500/20 text-gray-200 ring-gray-500/40',
};

export default function PaymentHistoryMonthDetails({
  payments,
  formatCurrency,
  formatDateTime,
}: PaymentHistoryMonthDetailsProps) {
  const { t } = useTranslation();

  if (payments.length === 0) {
    return (
      <p className="text-sm text-gray-400 px-2 py-4">
        {t('payments.history.noPaymentsInMonth', 'No payments registered for this month yet.')}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="text-left text-xs uppercase text-gray-400 border-b border-gray-700">
          <tr>
            <th className="py-2 pr-4">{t('payments.history.table.student', 'Student')}</th>
            <th className="py-2 pr-4">{t('payments.history.table.amount', 'Amount')}</th>
            <th className="py-2 pr-4">{t('payments.history.table.type', 'Type')}</th>
            <th className="py-2 pr-4">{t('payments.history.table.status', 'Status')}</th>
            <th className="py-2 pr-4">{t('payments.history.table.method', 'Method')}</th>
            <th className="py-2 pr-4">{t('payments.history.table.dateTime', 'Date &amp; time')}</th>
            <th className="py-2">{t('payments.history.table.notes', 'Notes')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800 text-gray-200">
          {payments.map((payment) => (
            <tr key={payment.id} className="hover:bg-gray-800/40">
              <td className="py-2 pr-4 font-medium text-white">
                <div className="flex flex-col">
                  <span>{payment.student_name}</span>
                  <span className="text-xs text-gray-400">{payment.student_email}</span>
                </div>
              </td>
              <td className="py-2 pr-4 font-semibold text-white whitespace-nowrap">
                {formatCurrency(Number(payment.amount) || 0)}
              </td>
              <td className="py-2 pr-4 capitalize">{payment.type}</td>
              <td className="py-2 pr-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ring-1 ${
                    STATUS_STYLES[payment.status] ?? STATUS_STYLES.completed
                  }`}
                >
                  {t(`payments.status.${payment.status}`, payment.status)}
                </span>
              </td>
              <td className="py-2 pr-4">{payment.payment_method ?? '—'}</td>
              <td className="py-2 pr-4 whitespace-nowrap text-gray-300">
                {formatDateTime(payment.created_at || payment.date)}
              </td>
              <td className="py-2 text-gray-400 max-w-[20rem] truncate" title={payment.notes ?? ''}>
                {payment.notes ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
