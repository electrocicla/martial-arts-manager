/**
 * PaymentHistoryEmptyState
 * SRP: render an empty state when no historical payments exist.
 */

import { History } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PaymentHistoryEmptyState() {
  const { t } = useTranslation();
  return (
    <div className="text-center py-16 bg-gray-900/40 rounded-xl border border-gray-800">
      <History className="w-12 h-12 mx-auto text-gray-500 mb-4" />
      <p className="text-gray-300 text-lg font-medium">
        {t('payments.history.empty.title', 'No payment history yet')}
      </p>
      <p className="text-gray-500 text-sm mt-2">
        {t(
          'payments.history.empty.description',
          'Once payments are recorded they will appear here grouped by month.',
        )}
      </p>
    </div>
  );
}
