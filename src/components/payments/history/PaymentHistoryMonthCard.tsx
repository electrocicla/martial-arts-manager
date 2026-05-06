/**
 * PaymentHistoryMonthCard
 * SRP: render one month entry (collapsed quick view + expandable details).
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PaymentHistoryMonth } from '../../../services';
import PaymentHistoryMonthDetails from './PaymentHistoryMonthDetails';

interface PaymentHistoryMonthCardProps {
  month: PaymentHistoryMonth;
  monthLabel: string;
  formatCurrency: (amount: number) => string;
  formatDateTime: (iso: string) => string;
  defaultExpanded?: boolean;
}

export default function PaymentHistoryMonthCard({
  month,
  monthLabel,
  formatCurrency,
  formatDateTime,
  defaultExpanded = false,
}: PaymentHistoryMonthCardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<boolean>(defaultExpanded);

  return (
    <section className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-xl border border-gray-800 shadow-lg">
      <header className="flex flex-col gap-3 p-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-white capitalize truncate">{monthLabel}</h3>
            <p className="text-xs text-gray-400">{month.monthKey}</p>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            className="xl:hidden inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-700 hover:border-gray-500 hover:bg-gray-800 text-sm text-gray-200 shrink-0"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span className="sr-only">
              {expanded
                ? t('payments.history.month.collapse', 'Collapse')
                : t('payments.history.month.expand', 'Show details')}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
          <div>
            <div className="text-xs text-gray-400">
              {t('payments.history.month.netAmount', 'Net')}
            </div>
            <div className="font-bold text-white">{formatCurrency(month.totalAmount)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">
              {t('payments.history.month.totalPayments', 'Total')}
            </div>
            <div className="font-bold text-white">{month.totalCount}</div>
          </div>
          <div>
            <div className="text-xs text-green-300">
              {t('payments.status.completed', 'Completed')}
            </div>
            <div className="font-bold text-green-200">{month.completedCount}</div>
          </div>
          <div>
            <div className="text-xs text-yellow-300">
              {t('payments.status.pending', 'Pending')}
            </div>
            <div className="font-bold text-yellow-200">{month.pendingCount}</div>
          </div>
          <div>
            <div className="text-xs text-red-300">
              {t('payments.status.failed', 'Failed')}
            </div>
            <div className="font-bold text-red-200">{month.failedCount}</div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="hidden xl:inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-700 hover:border-gray-500 hover:bg-gray-800 text-sm text-gray-200 self-center shrink-0"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              {t('payments.history.month.collapse', 'Collapse')}
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              {t('payments.history.month.expand', 'Show details')}
            </>
          )}
        </button>
      </header>

      {expanded && (
        <div className="border-t border-gray-800 p-4">
          <PaymentHistoryMonthDetails
            payments={month.payments}
            formatCurrency={formatCurrency}
            formatDateTime={formatDateTime}
          />
        </div>
      )}
    </section>
  );
}
