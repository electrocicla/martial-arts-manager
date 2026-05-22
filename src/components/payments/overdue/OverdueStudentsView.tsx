/**
 * OverdueStudentsView
 * SRP: orchestrates the "Overdue" tab — fetches, formats and dispatches
 * notification actions.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, RefreshCw, Send, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../ui/Button';
import { useOverdueStudents } from '../../../hooks/useOverdueStudents';
import { useToast } from '../../../hooks/useToast';
import OverdueStudentRow from './OverdueStudentRow';
import OverdueEmptyState from './OverdueEmptyState';
import OverdueFilters from './OverdueFilters';
import QuickAddPaymentModal from './QuickAddPaymentModal';
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
  const {
    data,
    isLoading,
    error,
    refresh,
    notifyStudent,
    notifyBulk,
    pendingNotifications,
    isBulkSending,
  } = useOverdueStudents();
  const { success: showSuccess, error: showError } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDisciplines, setSelectedDisciplines] = useState<Set<string>>(() => new Set());
  const [paymentModalStudent, setPaymentModalStudent] = useState<OverdueStudent | null>(null);

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
      const monthLabel = student.dueDate
        ? student.dueDate.slice(0, 7)
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
    [notifyStudent, showError, showSuccess, t],
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

  const monthLabel = data.meta?.dueDate
    ? data.meta.dueDate.slice(0, 7)
    : new Date().toISOString().slice(0, 7);

  const availableDisciplines = Array.from(
    new Set(data.students.map((s) => s.discipline).filter((d): d is string => Boolean(d))),
  ).sort();

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredStudents = data.students.filter((s) => {
    if (selectedDisciplines.size > 0 && !selectedDisciplines.has(s.discipline)) return false;
    if (normalizedSearch.length === 0) return true;
    const haystack = [s.studentName, s.studentEmail, s.studentPhone ?? '']
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalizedSearch);
  });

  // Selectable students = filtered students with a linked user account; the only
  // ones the backend can actually notify, scoped to the current filter view.
  const selectableStudents = filteredStudents.filter((s) => Boolean(s.userId));
  const selectableCount = selectableStudents.length;
  const allSelectableSelected =
    selectableCount > 0 && selectableStudents.every((s) => selectedIds.has(s.studentId));

  const handleToggleOne = (student: OverdueStudent, next: boolean) => {
    setSelectedIds((prev) => {
      const updated = new Set(prev);
      if (next) updated.add(student.studentId);
      else updated.delete(student.studentId);
      return updated;
    });
  };

  const handleToggleAllSelectable = () => {
    setSelectedIds((prev) => {
      if (prev.size > 0 && allSelectableSelected) {
        return new Set();
      }
      return new Set(selectableStudents.map((s) => s.studentId));
    });
  };

  const presentBulkResult = (
    label: string,
    result: Awaited<ReturnType<typeof notifyBulk>>,
  ) => {
    if (!result.success || !result.data) {
      showError(label, {
        description: result.error ?? t('payments.actions.tryAgain', 'Please try again.'),
      });
      return;
    }
    const { sent, skipped, errors } = result.data;
    showSuccess(
      t('payments.overdue.bulkSentSummary', '{{sent}} sent, {{skipped}} skipped, {{errors}} errors', {
        sent,
        skipped,
        errors,
      }),
      {
        description: t(
          'payments.overdue.bulkSentDescription',
          'Students must press confirm in the app for each reminder to be acknowledged.',
        ),
      },
    );
    setSelectedIds(new Set());
  };

  const handleSendSelected = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const result = await notifyBulk({ studentIds: ids, monthLabel });
    presentBulkResult(t('payments.overdue.bulkSendSelectedTitle', 'Bulk reminder result'), result);
  };

  const handleSendAll = async () => {
    // Send to all overdue currently visible after filters when filters are active;
    // otherwise let the backend target every overdue student.
    const filtersActive = normalizedSearch.length > 0 || selectedDisciplines.size > 0;
    const result = filtersActive
      ? await notifyBulk({ studentIds: selectableStudents.map((s) => s.studentId), monthLabel })
      : await notifyBulk({ all: true, monthLabel });
    presentBulkResult(t('payments.overdue.bulkSendAllTitle', 'Bulk reminder result'), result);
  };

  const handleToggleDiscipline = (discipline: string) => {
    setSelectedDisciplines((prev) => {
      const updated = new Set(prev);
      if (updated.has(discipline)) updated.delete(discipline);
      else updated.add(discipline);
      return updated;
    });
    // Drop selections that are no longer visible after the discipline change.
    setSelectedIds(new Set());
  };

  const handleClearDisciplines = () => {
    setSelectedDisciplines(new Set());
    setSelectedIds(new Set());
  };

  const selectedCount = selectedIds.size;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {t('payments.overdue.title', 'Overdue students')}
          </h2>
          <p className="text-gray-300">
            {t('payments.overdue.subtitle', 'Students whose monthly payment cycle is past due.')}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className="w-4 h-4" />}
          onClick={() => void refresh()}
          className="self-start sm:self-auto"
        >
          {t('common.refresh', 'Refresh')}
        </Button>
      </div>

      <OverdueFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        availableDisciplines={availableDisciplines}
        selectedDisciplines={selectedDisciplines}
        onToggleDiscipline={handleToggleDiscipline}
        onClearDisciplines={handleClearDisciplines}
        filteredCount={filteredStudents.length}
        totalCount={data.students.length}
      />

      {/* Bulk action toolbar */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="checkbox checkbox-sm checkbox-error"
              checked={allSelectableSelected}
              disabled={selectableCount === 0}
              onChange={handleToggleAllSelectable}
            />
            <span>
              {t('payments.overdue.selectAllOnPage', 'Select all selectable on this page')}
            </span>
          </label>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-800/80 border border-gray-700 text-xs text-gray-200">
            {t('payments.overdue.selectedCount', '{{count}} selected', { count: selectedCount })}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-800/80 border border-gray-700 text-xs text-gray-400">
            {t('payments.overdue.totalOverdue', '{{count}} overdue', { count: data.students.length })}
          </span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="primary"
            size="sm"
            leftIcon={<Send className="w-4 h-4" />}
            onClick={() => void handleSendSelected()}
            disabled={isBulkSending || selectedCount === 0}
            title={
              selectedCount === 0
                ? t(
                    'payments.overdue.sendSelectedDisabledTooltip',
                    'Select one or more overdue students with linked user accounts first.',
                  )
                : t(
                    'payments.overdue.sendSelectedTooltip',
                    'Send a forced-confirmation pending-payment reminder to each selected student. Students already paid this month or with a pending unconfirmed reminder are skipped automatically.',
                  )
            }
            className="w-full sm:w-auto"
          >
            {isBulkSending
              ? t('payments.overdue.sending', 'Sending\u2026')
              : t('payments.overdue.sendToSelected', 'Send to selected ({{count}})', {
                  count: selectedCount,
                })}
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            leftIcon={<Users className="w-4 h-4" />}
            onClick={() => void handleSendAll()}
            disabled={isBulkSending || selectableCount === 0}
            title={t(
              'payments.overdue.sendAllTooltip',
              'Send a pending-payment reminder to every overdue student visible on the list. Only targets students with a linked account who have not yet paid this month and do not already have a pending unconfirmed reminder.',
            )}
            className="w-full sm:w-auto"
          >
            {isBulkSending
              ? t('payments.overdue.sending', 'Sending\u2026')
              : t('payments.overdue.sendToAll', 'Send to all overdue')}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredStudents.length === 0 ? (
          <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-6 text-center text-sm text-gray-400">
            {t(
              'payments.overdue.noFilterResults',
              'No overdue students match the current filters. Try clearing the search or discipline filters.',
            )}
          </div>
        ) : (
          filteredStudents.map((student) => (
            <OverdueStudentRow
              key={student.studentId}
              student={student}
              isSending={pendingNotifications.has(student.studentId)}
              onSend={handleSend}
              onAddPayment={setPaymentModalStudent}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              selectable
              selected={selectedIds.has(student.studentId)}
              onToggleSelected={handleToggleOne}
            />
          ))
        )}
      </div>

      <QuickAddPaymentModal
        isOpen={paymentModalStudent !== null}
        student={paymentModalStudent}
        onClose={() => setPaymentModalStudent(null)}
        onSuccess={() => {
          void refresh();
        }}
      />
    </div>
  );
}
