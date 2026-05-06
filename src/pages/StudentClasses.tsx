/**
 * StudentClasses page (`/my-classes`).
 *
 * Student-facing "Mis Clases" dashboard combining enrolled classes with
 * attendance records. Surfaces a hero stats grid (attended / missed / rate /
 * streaks), filter chips (all / past / upcoming / missed / attended), and a
 * responsive list with rich per-class detail cards.
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  AlertOctagon,
  ArrowLeft,
  Award,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  Flame,
  GraduationCap,
  Info,
  MapPin,
  Percent,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  User as UserIcon,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  useStudentClassHistory,
  type ClassHistoryStatus,
  type StudentClassEntry,
} from '../hooks/useStudentClassHistory';

type FilterKey = 'all' | 'upcoming' | 'past' | 'attended' | 'missed';

const STATUS_BADGE_CLASSES: Record<ClassHistoryStatus, string> = {
  attended: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/40',
  missed: 'bg-red-500/15 text-red-200 ring-red-500/40',
  no_record: 'bg-orange-500/15 text-orange-200 ring-orange-500/40',
  today: 'bg-fuchsia-500/15 text-fuchsia-200 ring-fuchsia-500/40',
  upcoming: 'bg-sky-500/15 text-sky-200 ring-sky-500/40',
};

const STATUS_BORDER: Record<ClassHistoryStatus, string> = {
  attended: 'border-emerald-500/30',
  missed: 'border-red-500/40',
  no_record: 'border-orange-500/30',
  today: 'border-fuchsia-500/40',
  upcoming: 'border-sky-500/30',
};

function getLocale(language: string): string {
  if (language === 'pt') return 'pt-BR';
  if (language === 'en') return 'en-US';
  return 'es-MX';
}

function formatDate(iso: string, locale: string): string {
  if (!iso) return '\u2014';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const date = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(iso);
  return date.toLocaleDateString(locale, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(time: string | null | undefined): string {
  if (!time) return '\u2014';
  const m = time.match(/^(\d{2}):(\d{2})/);
  if (!m) return time;
  return `${m[1]}:${m[2]}`;
}

export default function StudentClasses() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const locale = getLocale(i18n.language);
  const { classes, stats, isLoading, error, refresh } = useStudentClassHistory();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');

  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const filteredClasses = useMemo(() => {
    const q = search.trim().toLowerCase();
    return classes.filter((c) => {
      if (q) {
        const haystack = [
          c.name,
          c.discipline ?? '',
          c.location ?? '',
          c.instructor ?? '',
          c.description ?? '',
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      switch (filter) {
        case 'all':
          return true;
        case 'upcoming':
          return c.status === 'upcoming' || c.status === 'today';
        case 'past':
          return c.date < today;
        case 'attended':
          return c.status === 'attended';
        case 'missed':
          return c.status === 'missed' || c.status === 'no_record';
        default:
          return true;
      }
    });
  }, [classes, filter, search, today]);

  const filterOptions: Array<{
    key: FilterKey;
    label: string;
    count: number;
    activeBadge: string;
  }> = [
    {
      key: 'all',
      label: t('studentClasses.filters.all', 'All'),
      count: classes.length,
      activeBadge:
        'bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-indigo-500 shadow-lg shadow-indigo-900/40',
    },
    {
      key: 'upcoming',
      label: t('studentClasses.filters.upcoming', 'Upcoming'),
      count: stats.upcoming,
      activeBadge:
        'bg-gradient-to-br from-sky-600 to-blue-700 text-white border-sky-500 shadow-lg shadow-sky-900/40',
    },
    {
      key: 'past',
      label: t('studentClasses.filters.past', 'Past'),
      count: stats.totalPast,
      activeBadge:
        'bg-gradient-to-br from-slate-600 to-slate-700 text-white border-slate-500 shadow-lg shadow-slate-900/40',
    },
    {
      key: 'attended',
      label: t('studentClasses.filters.attended', 'Attended'),
      count: stats.attended,
      activeBadge:
        'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border-emerald-500 shadow-lg shadow-emerald-900/40',
    },
    {
      key: 'missed',
      label: t('studentClasses.filters.missed', 'Missed'),
      count: stats.missed,
      activeBadge:
        'bg-gradient-to-br from-red-600 to-red-700 text-white border-red-500 shadow-lg shadow-red-900/40',
    },
  ];

  const statusLabel: Record<ClassHistoryStatus, string> = {
    attended: t('studentClasses.status.attended', 'Attended'),
    missed: t('studentClasses.status.missed', 'Missed'),
    no_record: t('studentClasses.status.noRecord', 'No record'),
    today: t('studentClasses.status.today', 'Today'),
    upcoming: t('studentClasses.status.upcoming', 'Upcoming'),
  };

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
              {t('studentClasses.error.title', 'Could not load your classes')}
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

  const missedAlert = stats.missed > 0;

  return (
    <div className="min-h-screen bg-gray-900 pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-6">
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
                <GraduationCap className="w-7 h-7 text-indigo-400 shrink-0" />
                <span className="truncate">{t('studentClasses.title', 'My classes')}</span>
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                {t(
                  'studentClasses.subtitle',
                  'Your full class history with attendance, instructor info and missed-class alerts.',
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

        {/* Stats hero */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4 mb-4 lg:mb-6">
          <StatCard
            icon={CheckCircle2}
            iconClass="text-emerald-300 bg-emerald-500/10 border-emerald-500/30"
            valueClass="text-emerald-300"
            label={t('studentClasses.stats.attended', 'Attended')}
            value={stats.attended}
          />
          <StatCard
            icon={XCircle}
            iconClass="text-red-300 bg-red-500/10 border-red-500/40"
            valueClass="text-red-300"
            label={t('studentClasses.stats.missed', 'Missed')}
            value={stats.missed}
          />
          <StatCard
            icon={Percent}
            iconClass="text-sky-300 bg-sky-500/10 border-sky-500/30"
            valueClass="text-sky-300"
            label={t('studentClasses.stats.rate', 'Attendance rate')}
            value={`${stats.attendanceRate}%`}
          />
          <StatCard
            icon={Flame}
            iconClass="text-orange-300 bg-orange-500/10 border-orange-500/30"
            valueClass="text-orange-300"
            label={t('studentClasses.stats.currentStreak', 'Current streak')}
            value={stats.currentStreak}
          />
          <StatCard
            icon={TrendingUp}
            iconClass="text-amber-300 bg-amber-500/10 border-amber-500/30"
            valueClass="text-amber-300"
            label={t('studentClasses.stats.bestStreak', 'Best streak')}
            value={stats.bestStreak}
          />
        </div>

        {/* Missed-class alert banner */}
        {missedAlert && (
          <div className="mb-4 lg:mb-6 rounded-xl border border-red-500/40 bg-gradient-to-r from-red-950/60 via-red-900/40 to-orange-950/40 p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-red-500/20 ring-1 ring-red-500/40 shrink-0">
              <AlertOctagon className="w-5 h-5 text-red-300" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-red-200">
                {t('studentClasses.alert.title', 'You have missed {{count}} class(es)', {
                  count: stats.missed,
                })}
              </h3>
              <p className="text-xs text-red-200/80 mt-0.5 leading-relaxed">
                {t(
                  'studentClasses.alert.description',
                  'Review the details below and reach out to your instructor if you believe a class was marked incorrectly.',
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFilter('missed')}
              className="ml-auto self-center text-xs font-semibold text-red-200 hover:text-white px-3 py-1.5 rounded-lg border border-red-500/40 hover:bg-red-500/20 transition-colors whitespace-nowrap"
            >
              {t('studentClasses.alert.viewAction', 'View missed')}
            </button>
          </div>
        )}

        {/* Filters + search */}
        <Card className="mb-4 lg:mb-6 border border-gray-800 bg-gray-900/60">
          <CardContent className="p-4 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t(
                  'studentClasses.searchPlaceholder',
                  'Search by class, discipline, instructor, or location...',
                )}
                className="w-full bg-gray-800/60 border border-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-gray-500 transition-colors"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((opt) => {
                const isActive = filter === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setFilter(opt.key)}
                    className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                      isActive
                        ? opt.activeBadge
                        : 'bg-gray-800/50 text-gray-300 border-gray-700 hover:border-gray-500 hover:text-white'
                    }`}
                    aria-pressed={isActive}
                  >
                    <span>{opt.label}</span>
                    <span
                      className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-gray-700/70 text-gray-300'
                      }`}
                    >
                      {opt.count}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="text-xs text-gray-500">
              {t('studentClasses.showingCount', 'Showing {{count}} of {{total}}', {
                count: filteredClasses.length,
                total: classes.length,
              })}
            </div>
          </CardContent>
        </Card>

        {/* List */}
        {filteredClasses.length === 0 ? (
          <Card className="border border-gray-800 bg-gray-900/60">
            <CardContent className="py-12 text-center">
              <ClipboardList className="w-10 h-10 text-gray-500 mx-auto mb-2" />
              <p className="text-sm text-gray-400">
                {classes.length === 0
                  ? t('studentClasses.empty', 'You are not enrolled in any classes yet.')
                  : t(
                      'studentClasses.emptyFiltered',
                      'No classes match your filters. Try clearing the search or switching tabs.',
                    )}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
            {filteredClasses.map((c) => (
              <ClassCard
                key={`${c.classId}-${c.date}`}
                entry={c}
                statusLabel={statusLabel[c.status]}
                locale={locale}
                t={t}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  valueClass: string;
  label: string;
  value: number | string;
}

function StatCard({ icon: Icon, iconClass, valueClass, label, value }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-3 lg:p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg border ${iconClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold leading-tight">
          {label}
        </div>
        <div className={`text-xl lg:text-2xl font-extrabold leading-tight ${valueClass}`}>
          {value}
        </div>
      </div>
    </div>
  );
}

interface ClassCardProps {
  entry: StudentClassEntry;
  statusLabel: string;
  locale: string;
  t: ReturnType<typeof useTranslation>['t'];
}

function ClassCard({ entry, statusLabel, locale, t }: ClassCardProps) {
  const StatusIcon = (() => {
    switch (entry.status) {
      case 'attended':
        return CheckCircle2;
      case 'missed':
      case 'no_record':
        return XCircle;
      case 'today':
        return Sparkles;
      case 'upcoming':
        return CalendarDays;
      default:
        return Info;
    }
  })();

  return (
    <Card
      className={`border bg-gray-900/60 hover:bg-gray-900/80 transition-colors ${STATUS_BORDER[entry.status]}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white truncate">{entry.name}</h3>
            {entry.discipline && (
              <p className="text-xs text-indigo-300 capitalize mt-0.5 truncate">{entry.discipline}</p>
            )}
          </div>
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 whitespace-nowrap ${STATUS_BADGE_CLASSES[entry.status]}`}
          >
            <StatusIcon className="w-3 h-3" />
            {statusLabel}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="text-xs space-y-1.5 text-gray-300">
          <li className="flex items-start gap-2">
            <CalendarDays className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
            <span className="capitalize">{formatDate(entry.date, locale)}</span>
            <span className="text-gray-500">\u00b7</span>
            <Clock className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
            <span>{formatTime(entry.time)}</span>
          </li>
          {entry.instructor && (
            <li className="flex items-center gap-2">
              <UserIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate">{entry.instructor}</span>
            </li>
          )}
          {entry.location && (
            <li className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate">{entry.location}</span>
            </li>
          )}
          {entry.checkInTime && entry.status === 'attended' && (
            <li className="flex items-center gap-2 text-emerald-300">
              <Award className="w-3.5 h-3.5 shrink-0" />
              <span>
                {t('studentClasses.checkedInAt', 'Checked in at {{time}}', {
                  time: new Date(entry.checkInTime).toLocaleTimeString(locale, {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                })}
                {entry.checkInMethod ? (
                  <span className="text-emerald-400/70 ml-1.5 capitalize">
                    ({entry.checkInMethod})
                  </span>
                ) : null}
              </span>
            </li>
          )}
          {entry.description && (
            <li className="flex items-start gap-2 text-gray-400">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span className="line-clamp-2">{entry.description}</span>
            </li>
          )}
          {(entry.status === 'missed' || entry.status === 'no_record') && (
            <li className="flex items-start gap-2 text-red-300/90 bg-red-500/10 border border-red-500/30 rounded-md px-2 py-1.5 mt-2">
              <AlertOctagon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span className="leading-snug">
                {entry.status === 'missed'
                  ? t(
                      'studentClasses.missedHint',
                      'You were enrolled in this class but did not attend.',
                    )
                  : t(
                      'studentClasses.noRecordHint',
                      'No attendance record was found for this past class.',
                    )}
              </span>
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
