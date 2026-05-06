/**
 * PaymentHistoryView
 * SRP: orchestrates the history tab — composes summary + list of month cards.
 */

import { useMemo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../ui/Button';
import { usePaymentHistory } from '../../../hooks/usePaymentHistory';
import PaymentHistorySummary from './PaymentHistorySummary';
import PaymentHistoryMonthCard from './PaymentHistoryMonthCard';
import PaymentHistoryEmptyState from './PaymentHistoryEmptyState';

function getLocale(language: string): string {
  if (language === 'pt') return 'pt-BR';
  if (language === 'en') return 'en-US';
  return 'es-MX';
}

export default function PaymentHistoryView() {
  const { t, i18n } = useTranslation();
  const { data, isLoading, error, refresh } = usePaymentHistory();

  const locale = getLocale(i18n.language);

  const formatCurrency = useMemo(
    () => (amount: number) =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'MXN',
        maximumFractionDigits: 0,
      }).format(amount),
    [locale],
  );

  const formatMonthLabel = useMemo(
    () => (monthKey: string) => {
      const match = monthKey.match(/^(\d{4})-(\d{2})$/);
      if (!match) return monthKey;
      const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
      return date.toLocaleDateString(locale, { year: 'numeric', month: 'long' });
    },
    [locale],
  );

  const formatDateTime = useMemo(
    () => (iso: string) => {
      if (!iso) return '—';
      try {
        return new Date(iso).toLocaleString(locale, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch {
        return iso;
      }
    },
    [locale],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-red-900/20 border border-red-500/30">
        <div className="card-body items-center text-center">
          <AlertCircle className="w-10 h-10 text-error" />
          <h3 className="card-title text-error">
            {t('payments.history.error.title', 'Could not load payment history')}
          </h3>
          <p className="text-error/80 text-sm">{error}</p>
          <Button variant="primary" size="md" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={() => void refresh()}>
            {t('common.retry', 'Retry')}
          </Button>
        </div>
      </div>
    );
  }

  if (!data || data.months.length === 0) {
    return <PaymentHistoryEmptyState />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {t('payments.history.title', 'Payment history')}
          </h2>
          <p className="text-gray-300">
            {t('payments.history.subtitle', 'Aggregated monthly view since the dojo started using the app.')}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className="w-4 h-4" />}
          onClick={() => void refresh()}
        >
          {t('common.refresh', 'Refresh')}
        </Button>
      </div>

      <PaymentHistorySummary totals={data.totals} formatCurrency={formatCurrency} />

      <div className="space-y-4">
        {data.months.map((month, index) => (
          <PaymentHistoryMonthCard
            key={month.monthKey}
            month={month}
            monthLabel={formatMonthLabel(month.monthKey)}
            formatCurrency={formatCurrency}
            formatDateTime={formatDateTime}
            defaultExpanded={index === 0}
          />
        ))}
      </div>
    </div>
  );
}
