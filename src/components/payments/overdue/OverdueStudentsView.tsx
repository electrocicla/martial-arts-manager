/**
 * OverdueStudentsView
 * SRP: orchestrates the "Overdue" tab — fetches, formats and dispatches
 * notification actions.
 */

import { useCallback, useEffect, useMemo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../ui/Button';
import { useOverdueStudents } from '../../../hooks/useOverdueStudents';
import { useToast } from '../../../hooks/useToast';
import OverdueStudentRow from './OverdueStudentRow';
import OverdueEmptyState from './OverdueEmptyState';
import type { OverdueStudent } from '../../../services';

interface OverdueStudentsViewProps {
  onCountChange?: (count: number) => void;
}

function getLocale(language: string): string {
  if (language === 'pt') return 'pt-BR';
  if (language === 'en') return 'en-US';
  return 'es-MX';
}

export default function OverdueStudentsView({ onCountChange }: OverdueStudentsViewProps) {
  const { t, i18n } = useTranslation();
  const { data, isLoading, error, refresh, notifyStudent, pendingNotifications } =
    useOverdueStudents();
  const { success: showSuccess, error: showError } = useToast();

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

  const formatDate = useMemo(
    () => (iso: string) => {
      if (!iso) return '—';
      const isoDateMatch = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      const date = isoDateMatch
        ? new Date(Number(isoDateMatch[1]), Number(isoDateMatch[2]) - 1, Number(isoDateMatch[3]))
        : new Date(iso);
      return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
    },
    [locale],
  );

  // Hoist count notification to parent (e.g. tab badge).
  const overdueCount = data?.students.length ?? 0;
  useEffect(() => {
    onCountChange?.(overdueCount);
  }, [onCountChange, overdueCount]);

  const handleSend = useCallback(
    async (student: OverdueStudent) => {
      const monthLabel = data?.meta?.dueDate
        ? data.meta.dueDate.slice(0, 7)
        : new Date().toISOString().slice(0, 7);
      const result = await notifyStudent({
        studentId: student.studentId,
        daysOverdue: student.daysOverdue,
        expectedAmount: student.expectedAmount,
        monthLabel,
      });
      if (result.success) {
        showSuccess(
          t('payments.overdue.sentSuccess', 'Reminder sent to {{name}}', { name: student.studentName }),
          {
            description: t(
              'payments.overdue.sentSuccessDescription',
              'The student must press confirm in the app to acknowledge it.',
            ),
          },
        );
      } else {
        showError(t('payments.overdue.sentError', 'Could not send reminder'), {
          description: result.error ?? t('payments.actions.tryAgain', 'Please try again.'),
        });
      }
    },
    [data?.meta?.dueDate, notifyStudent, showError, showSuccess, t],
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
            {t('payments.overdue.error.title', 'Could not load overdue students')}
          </h3>
          <p className="text-error/80 text-sm">{error}</p>
          <Button
            variant="primary"
            size="md"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={() => void refresh()}
          >
            {t('common.retry', 'Retry')}
          </Button>
        </div>
      </div>
    );
  }

  if (!data || data.students.length === 0) {
    return <OverdueEmptyState />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {t('payments.overdue.title', 'Overdue students')}
          </h2>
          <p className="text-gray-300">
            {t('payments.overdue.subtitle', 'Students who have not paid the current month past the due date.')}
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

      <div className="space-y-3">
        {data.students.map((student) => (
          <OverdueStudentRow
            key={student.studentId}
            student={student}
            isSending={pendingNotifications.has(student.studentId)}
            onSend={handleSend}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />
        ))}
      </div>
    </div>
  );
}
