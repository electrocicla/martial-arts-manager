/**
 * OverdueEmptyState
 * SRP: empty state when there are no overdue students.
 */

import { ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function OverdueEmptyState() {
  const { t } = useTranslation();
  return (
    <div className="text-center py-16 bg-emerald-950/20 rounded-xl border border-emerald-700/40">
      <ShieldCheck className="w-12 h-12 mx-auto text-emerald-400 mb-4" />
      <p className="text-emerald-200 text-lg font-semibold">
        {t('payments.overdue.empty.title', 'All payments are up to date')}
      </p>
      <p className="text-emerald-300/80 text-sm mt-2">
        {t(
          'payments.overdue.empty.description',
          'No students have a pending monthly payment past the due date.',
        )}
      </p>
    </div>
  );
}
