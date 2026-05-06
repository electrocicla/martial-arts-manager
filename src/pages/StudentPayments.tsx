/**
 * StudentPayments page (`/my-payments`).
 *
 * Student-facing dashboard for tracking the current month's payment status,
 * paying online via MercadoPago (when the admin has activated it), or
 * coordinating a manual cash/transfer payment with their instructor. Also
 * shows the full payment history.
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock,
  CreditCard,
  HandCoins,
  History,
  RefreshCw,
  ShieldAlert,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  useStudentPayments,
  type StudentPaymentStatus,
} from '../hooks/useStudentPayments';
import useMercadoPagoStatus from '../hooks/useMercadoPagoStatus';
import MercadoPagoPayButton from '../components/payments/MercadoPagoPayButton';
import type { Payment } from '../types';

function getLocale(language: string): string {
  if (language === 'pt') return 'pt-BR';
  if (language === 'en') return 'en-US';
  return 'es-MX';
}

function formatMonthLabel(monthKey: string, locale: string): string {
  if (!monthKey || monthKey.length < 7) return monthKey;
  const [year, month] = monthKey.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

function statusBadgeClasses(status: StudentPaymentStatus): string {
  switch (status) {
    case 'paid':
      return 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/40';
    case 'pending':
      return 'bg-yellow-500/15 text-yellow-200 ring-yellow-500/40';
    case 'overdue':
      return 'bg-red-500/15 text-red-200 ring-red-500/40';
    case 'due_soon':
      return 'bg-amber-500/15 text-amber-200 ring-amber-500/40';
    case 'upcoming':
      return 'bg-sky-500/15 text-sky-200 ring-sky-500/40';
    default:
      return 'bg-gray-500/20 text-gray-300 ring-gray-500/40';
  }
}

function rowStatusClasses(rawStatus: string): string {
  const s = rawStatus.toLowerCase();
  if (s === 'completed' || s === 'approved') {
    return 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/40';
  }
  if (s === 'pending') {
    return 'bg-yellow-500/15 text-yellow-200 ring-yellow-500/40';
  }
  if (s === 'failed' || s === 'cancelled' || s === 'refunded') {
    return 'bg-red-500/15 text-red-200 ring-red-500/40';
  }
  return 'bg-gray-500/20 text-gray-300 ring-gray-500/40';
}

export default function StudentPayments() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    payments,
    isLoading,
    error,
    refresh,
    currentMonth,
    currentMonthStatus,
    currentMonthPayment,
    daysDelta,
    dueDay,
    lastCompletedPayment,
  } = useStudentPayments();

  const { status: mpStatus, isLoading: mpLoading } = useMercadoPagoStatus();

  const locale = getLocale(i18n.language);
  const currency = mpStatus?.currency ?? 'CLP';
  const expectedAmount = mpStatus?.defaultAmount ?? 35000;

  const formatCurrency = useMemo(
    () => (amount: number) =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(amount),
    [locale, currency],
  );

  const formatDate = useMemo(
    () => (iso: string) => {
      if (!iso) return '\u2014';
      const isoDateMatch = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      const date = isoDateMatch
        ? new Date(Number(isoDateMatch[1]), Number(isoDateMatch[2]) - 1, Number(isoDateMatch[3]))
        : new Date(iso);
      return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
    },
    [locale],
  );

  const monthLabel = formatMonthLabel(currentMonth, locale);

  const statusLabel: Record<StudentPaymentStatus, string> = {
    paid: t('studentPayments.status.paid', 'Paid'),
    pending: t('studentPayments.status.pending', 'Pending confirmation'),
    overdue: t('studentPayments.status.overdue', 'Overdue'),
    due_soon: t('studentPayments.status.dueSoon', 'Due soon'),
    upcoming: t('studentPayments.status.upcoming', 'Upcoming'),
    unknown: t('studentPayments.status.unknown', 'Unknown'),
  };

  const statusDescription = (() => {
    switch (currentMonthStatus) {
      case 'paid':
        return t(
          'studentPayments.status.paidDescription',
          'Your payment for this month is confirmed. Thank you!',
        );
      case 'pending':
        return t(
          'studentPayments.status.pendingDescription',
          'A payment has been registered but is still pending confirmation.',
        );
      case 'overdue':
        return t(
          'studentPayments.status.overdueDescription',
          'Your payment for this month is {{days}} day(s) past due. Please pay as soon as possible.',
          { days: daysDelta },
        );
      case 'due_soon':
        return t(
          'studentPayments.status.dueSoonDescription',
          'Your payment is due in {{days}} day(s). Pay early to avoid late charges.',
          { days: daysDelta },
        );
      case 'upcoming':
        return t(
          'studentPayments.status.upcomingDescription',
          'Your next payment is due in {{days}} day(s).',
          { days: daysDelta },
        );
      default:
        return t('studentPayments.status.unknownDescription', 'Status unavailable.');
    }
  })();

  const StatusIcon = (() => {
    switch (currentMonthStatus) {
      case 'paid':
        return CheckCircle2;
      case 'pending':
        return Clock;
      case 'overdue':
        return AlertTriangle;
      case 'due_soon':
        return CalendarClock;
      case 'upcoming':
        return Wallet;
      default:
        return ShieldAlert;
    }
  })();

  const showPayActions =
    currentMonthStatus === 'overdue' ||
    currentMonthStatus === 'pending' ||
    currentMonthStatus === 'due_soon' ||
    currentMonthStatus === 'upcoming';

  const studentId = user?.student_id;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <Card className="max-w-md w-full border border-red-500/30 bg-red-900/20">
          <CardContent className="p-6 text-center space-y-3">
            <ShieldAlert className="w-10 h-10 text-red-300 mx-auto" />
            <h2 className="text-xl font-bold text-white">
              {t('studentPayments.error.title', 'Could not load your payments')}
            </h2>
            <p className="text-sm text-red-200">{error}</p>
            <Button
              variant="primary"
              size="md"
              leftIcon={<RefreshCw className="w-4 h-4" />}
              onClick={() => void refresh()}
            >
              {t('common.retry', 'Retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-24 md:pb-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors md:hidden"
              aria-label={t('common.back', 'Back')}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3 truncate">
                <CreditCard className="w-7 h-7 text-emerald-400 shrink-0" />
                <span className="truncate">{t('studentPayments.title', 'My payments')}</span>
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                {t(
                  'studentPayments.subtitle',
                  'Track your monthly status, pay online or in person, and review your full history.',
                )}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={() => void refresh()}
            className="self-start"
          >
            {t('common.refresh', 'Refresh')}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Status hero card */}
          <Card className="lg:col-span-2 border border-gray-800 bg-gray-900/60">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <StatusIcon className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white capitalize">{monthLabel}</h2>
                    <p className="text-xs text-gray-400">
                      {t('studentPayments.dueDayHint', 'Due on day {{day}} every month', { day: dueDay })}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ring-1 ${statusBadgeClasses(
                    currentMonthStatus,
                  )}`}
                >
                  {statusLabel[currentMonthStatus]}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-200">{statusDescription}</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg border border-gray-800 bg-gray-800/40 p-3">
                  <div className="text-xs text-gray-400">
                    {t('studentPayments.expectedAmount', 'Expected amount')}
                  </div>
                  <div className="font-bold text-white text-lg">{formatCurrency(expectedAmount)}</div>
                </div>
                <div className="rounded-lg border border-gray-800 bg-gray-800/40 p-3">
                  <div className="text-xs text-gray-400">
                    {t('studentPayments.thisMonthLabel', 'This month payment')}
                  </div>
                  <div className="font-medium text-white">
                    {currentMonthPayment
                      ? formatCurrency(Number(currentMonthPayment.amount) || 0)
                      : '\u2014'}
                  </div>
                  {currentMonthPayment && (
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      {formatDate(currentMonthPayment.date)}
                    </div>
                  )}
                </div>
                <div className="rounded-lg border border-gray-800 bg-gray-800/40 p-3 col-span-2 sm:col-span-1">
                  <div className="text-xs text-gray-400">
                    {t('studentPayments.lastPaid', 'Last completed payment')}
                  </div>
                  <div className="font-medium text-white">
                    {lastCompletedPayment
                      ? formatCurrency(Number(lastCompletedPayment.amount) || 0)
                      : '\u2014'}
                  </div>
                  {lastCompletedPayment && (
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      {formatDate(lastCompletedPayment.date)}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pay actions card */}
          <Card className="border border-gray-800 bg-gray-900/60">
            <CardHeader>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                {t('studentPayments.payActions.title', 'Pay your monthly fee')}
              </h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {!showPayActions ? (
                <p className="text-sm text-gray-400">
                  {t(
                    'studentPayments.payActions.notNeeded',
                    'No payment is needed right now. We\u2019ll show pay options here when your next month is due.',
                  )}
                </p>
              ) : (
                <>
                  <p className="text-sm text-gray-300">
                    {t(
                      'studentPayments.payActions.intro',
                      'You can pay online with MercadoPago or coordinate a cash/transfer payment with your instructor.',
                    )}
                  </p>

                  {!mpLoading && mpStatus?.active && studentId && (
                    <MercadoPagoPayButton
                      studentId={studentId}
                      amount={expectedAmount}
                      type="monthly"
                      size="md"
                      variant="primary"
                      fullWidth
                      label={t('studentPayments.payActions.payOnline', 'Pay online with MercadoPago')}
                    />
                  )}

                  <div className="rounded-lg border border-gray-800 bg-gray-800/40 p-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-200 font-semibold mb-1">
                      <HandCoins className="w-4 h-4 text-emerald-300" />
                      {t('studentPayments.payActions.manualTitle', 'Pay in person')}
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {t(
                        'studentPayments.payActions.manualHint',
                        'Bring cash to your next class or transfer the amount and let your instructor know. They will register the payment from the admin panel.',
                      )}
                    </p>
                  </div>

                  {!mpStatus?.active && !mpLoading && (
                    <p className="text-[11px] text-gray-500 italic">
                      {t(
                        'studentPayments.payActions.mpInactive',
                        'Online payments are currently disabled by your dojo. Please pay in person.',
                      )}
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* History */}
        <Card className="mt-4 lg:mt-6 border border-gray-800 bg-gray-900/60">
          <CardHeader>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-gray-300" />
              {t('studentPayments.history.title', 'Payment history')}
              <span className="ml-2 text-xs text-gray-400 font-normal">
                {t('studentPayments.history.count', '({{count}})', { count: payments.length })}
              </span>
            </h2>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">
                {t('studentPayments.history.empty', 'You don\u2019t have any payments registered yet.')}
              </p>
            ) : (
              <PaymentHistoryList
                payments={payments}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                t={t}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface HistoryProps {
  payments: Payment[];
  formatCurrency: (n: number) => string;
  formatDate: (iso: string) => string;
  t: ReturnType<typeof useTranslation>['t'];
}

function PaymentHistoryList({ payments, formatCurrency, formatDate, t }: HistoryProps) {
  return (
    <>
      {/* Mobile: stacked cards. */}
      <div className="md:hidden space-y-2">
        {payments.map((payment) => {
          const status = (payment.status ?? 'unknown').toLowerCase();
          return (
            <div
              key={payment.id}
              className="rounded-lg border border-gray-800 bg-gray-800/40 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white capitalize">
                    {payment.type}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{formatDate(payment.date)}</div>
                </div>
                <div className="text-base font-bold text-white whitespace-nowrap">
                  {formatCurrency(Number(payment.amount) || 0)}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md font-semibold ring-1 ${rowStatusClasses(
                    status,
                  )}`}
                >
                  {t(`payments.status.${status}`, status)}
                </span>
                {payment.payment_method && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-700/60 text-gray-200 capitalize">
                    {payment.payment_method}
                  </span>
                )}
                {payment.payment_source && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-700/60 text-gray-200 capitalize">
                    {payment.payment_source}
                  </span>
                )}
              </div>
              {payment.notes && (
                <p className="text-xs text-gray-400 mt-2 break-words">{payment.notes}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Tablet / desktop: table. */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-xs uppercase text-gray-400 border-b border-gray-700">
            <tr>
              <th className="py-2 pr-4">{t('studentPayments.history.date', 'Date')}</th>
              <th className="py-2 pr-4">{t('studentPayments.history.amount', 'Amount')}</th>
              <th className="py-2 pr-4">{t('studentPayments.history.type', 'Type')}</th>
              <th className="py-2 pr-4">{t('studentPayments.history.status', 'Status')}</th>
              <th className="py-2 pr-4">{t('studentPayments.history.method', 'Method')}</th>
              <th className="py-2">{t('studentPayments.history.notes', 'Notes')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 text-gray-200">
            {payments.map((payment) => {
              const status = (payment.status ?? 'unknown').toLowerCase();
              return (
                <tr key={payment.id} className="hover:bg-gray-800/40">
                  <td className="py-2 pr-4 whitespace-nowrap text-gray-300">
                    {formatDate(payment.date)}
                  </td>
                  <td className="py-2 pr-4 font-semibold text-white whitespace-nowrap">
                    {formatCurrency(Number(payment.amount) || 0)}
                  </td>
                  <td className="py-2 pr-4 capitalize">{payment.type}</td>
                  <td className="py-2 pr-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ring-1 ${rowStatusClasses(
                        status,
                      )}`}
                    >
                      {t(`payments.status.${status}`, status)}
                    </span>
                  </td>
                  <td className="py-2 pr-4 capitalize">{payment.payment_method ?? '\u2014'}</td>
                  <td
                    className="py-2 text-gray-400 max-w-[20rem] truncate"
                    title={payment.notes ?? ''}
                  >
                    {payment.notes ?? '\u2014'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
