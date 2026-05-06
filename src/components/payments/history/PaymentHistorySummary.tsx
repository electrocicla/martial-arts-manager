/**
 * PaymentHistorySummary
 * SRP: pure presentation of aggregated KPIs.
 */

import { CheckCircle, Clock, Layers, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PaymentHistorySummaryProps {
  totals: {
    totalAmount: number;
    totalCount: number;
    completedAmount: number;
    pendingAmount: number;
    monthsTracked: number;
  };
  formatCurrency: (amount: number) => string;
}

export default function PaymentHistorySummary({ totals, formatCurrency }: PaymentHistorySummaryProps) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-xl p-4 border border-blue-700/50">
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <TrendingUp className="w-5 h-5 text-blue-300" />
          </div>
          <span className="text-2xl font-bold text-white">{formatCurrency(totals.totalAmount)}</span>
        </div>
        <div className="text-sm text-blue-200 font-medium">
          {t('payments.history.totals.netRevenue', 'Net revenue')}
        </div>
        <div className="text-xs text-blue-300 mt-1">
          {totals.totalCount} {t('payments.history.totals.paymentsRecorded', 'payments recorded')}
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-xl p-4 border border-green-700/50">
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-300" />
          </div>
          <span className="text-2xl font-bold text-white">
            {formatCurrency(totals.completedAmount)}
          </span>
        </div>
        <div className="text-sm text-green-200 font-medium">
          {t('payments.history.totals.completed', 'Completed')}
        </div>
      </div>

      <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/30 rounded-xl p-4 border border-yellow-700/50">
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 bg-yellow-500/20 rounded-lg">
            <Clock className="w-5 h-5 text-yellow-300" />
          </div>
          <span className="text-2xl font-bold text-white">
            {formatCurrency(totals.pendingAmount)}
          </span>
        </div>
        <div className="text-sm text-yellow-200 font-medium">
          {t('payments.history.totals.pending', 'Pending')}
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 rounded-xl p-4 border border-purple-700/50">
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Layers className="w-5 h-5 text-purple-300" />
          </div>
          <span className="text-2xl font-bold text-white">{totals.monthsTracked}</span>
        </div>
        <div className="text-sm text-purple-200 font-medium">
          {t('payments.history.totals.monthsTracked', 'Months tracked')}
        </div>
      </div>
    </div>
  );
}
