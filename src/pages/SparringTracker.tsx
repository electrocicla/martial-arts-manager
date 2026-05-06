/**
 * Sparring Tracker — instructor view.
 *
 * Pick a class (or "all my students"), search by name, and quickly add 1/3/5
 * sparring rounds to each student. Calls /api/sparring/quick-add and shows
 * an updated total without a full reload.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Plus, Swords, Users, Calendar, Loader2, BookOpen, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStudents } from '../hooks/useStudents';
import { useClasses } from '../hooks/useClasses';
import { useToast } from '../hooks/useToast';
import { sparringService } from '../services/progression.service';
import { Surface } from '../components/ui/Surface';
import { Section } from '../components/ui/Section';
import { Stat } from '../components/ui/Stat';
import { EmptyState } from '../components/ui/EmptyState';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { FadeUp, Stagger } from '../components/ui/effects/Motion';
import { label } from '../lib/i18nUtils';
import type { Student } from '../types/index';

const QUICK_INCREMENTS: ReadonlyArray<number> = [1, 3, 5];

interface StudentTotals {
  [studentId: string]: number;
}

const TODAY = (): string => new Date().toISOString().slice(0, 10);

interface ClassRowSummary {
  id: string;
  name: string;
  date: string;
  time: string;
  enrolled_student_ids?: string[];
}

export default function SparringTracker() {
  const { t } = useTranslation();
  const toast = useToast();
  const today = useMemo(() => TODAY(), []);

  const { students, isLoading: studentsLoading } = useStudents();
  const { classes, isLoading: classesLoading } = useClasses({ date: today });

  const [search, setSearch] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [totals, setTotals] = useState<StudentTotals>({});
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [todaySessionsCount, setTodaySessionsCount] = useState(0);
  const [loadingTotals, setLoadingTotals] = useState(false);

  // Filter students based on selected class enrollment.
  const visibleStudents: Student[] = useMemo(() => {
    let pool: Student[] = [...students];
    if (selectedClassId) {
      const cls = (classes as ClassRowSummary[]).find(c => c.id === selectedClassId);
      const ids = new Set<string>(cls?.enrolled_student_ids ?? []);
      pool = pool.filter(s => ids.has(s.id));
    }
    if (search.trim().length > 0) {
      const q = search.trim().toLowerCase();
      pool = pool.filter(s => s.name.toLowerCase().includes(q));
    }
    return pool.sort((a, b) => a.name.localeCompare(b.name));
  }, [students, classes, selectedClassId, search]);

  /** Refresh totals for the visible students by fetching aggregated sparring sessions. */
  const refreshTotals = useCallback(async () => {
    if (visibleStudents.length === 0) {
      setTotals({});
      return;
    }
    setLoadingTotals(true);
    try {
      const next: StudentTotals = {};
      const results = await Promise.all(
        visibleStudents.map(s =>
          sparringService.list({ studentId: s.id }).then(res => ({ id: s.id, res }))
        )
      );
      for (const { id, res } of results) {
        if (res.success && res.data) {
          next[id] = res.data.sessions.reduce((sum, ss) => sum + (ss.sessions_count ?? 0), 0);
        }
      }
      setTotals(next);
    } finally {
      setLoadingTotals(false);
    }
  }, [visibleStudents]);

  /** Day-level metric: total sparring sessions logged today across all instructors. */
  const refreshTodayCount = useCallback(async () => {
    const res = await sparringService.list({ date: selectedDate });
    if (res.success && res.data) {
      const total = res.data.sessions.reduce((sum, ss) => sum + (ss.sessions_count ?? 0), 0);
      setTodaySessionsCount(total);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (!studentsLoading) {
      void refreshTotals();
    }
  }, [studentsLoading, refreshTotals]);

  useEffect(() => {
    void refreshTodayCount();
  }, [refreshTodayCount]);

  const handleQuickAdd = useCallback(
    async (student: Student, increment: number) => {
      setPending(prev => ({ ...prev, [student.id]: true }));
      try {
        const res = await sparringService.quickAdd({
          student_id: student.id,
          increment,
          class_id: selectedClassId || null,
        });
        if (res.success && res.data) {
          setTotals(prev => ({ ...prev, [student.id]: res.data!.sparring_total }));
          toast.success(`+${increment} ${label(t, 'sparringTracker.added', 'sparring sessions added')}`, student.name);
          if (res.data.progression?.readyForExam && res.data.progression.nextBelt) {
            toast.info(
              `${student.name} ${label(t, 'sparringTracker.readyForExam', 'is ready for the next belt exam')}`,
              `${student.belt} → ${res.data.progression.nextBelt}`
            );
          }
          void refreshTodayCount();
        } else {
          toast.error(res.error || label(t, 'sparringTracker.failed', 'Failed to add sparring session'));
        }
      } catch (error) {
        toast.error((error as Error).message);
      } finally {
        setPending(prev => ({ ...prev, [student.id]: false }));
      }
    },
    [selectedClassId, t, toast, refreshTodayCount]
  );

  const classOptions = useMemo(
    () => [
      { value: '', label: label(t, 'sparringTracker.allStudents', 'All my students') },
      ...(classes as ClassRowSummary[]).map(c => ({
        value: c.id,
        label: `${c.name} · ${c.time}`,
      })),
    ],
    [classes, t]
  );

  const isInitialLoading = studentsLoading || classesLoading;

  return (
    <div className="min-h-screen bg-base-100 pb-24 md:pb-10">
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-base-300">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-br from-amber-600/15 via-transparent to-red-600/10" />
        <div aria-hidden="true" className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <FadeUp>
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-red-700 flex items-center justify-center shadow-lg shadow-amber-600/30 ring-1 ring-amber-500/30">
                <Swords className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-4xl font-black tracking-tight text-base-content">
                  {label(t, 'sparringTracker.title', 'Sparring Tracker')}
                </h1>
                <p className="text-sm md:text-base text-base-content/60 mt-1">
                  {label(t, 'sparringTracker.subtitle', 'Track sparring sessions in real time during class.')}
                </p>
              </div>
            </div>

            <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6">
              <Stat
                label={label(t, 'sparringTracker.activeStudents', 'Active students')}
                value={visibleStudents.length}
                icon={<Users className="w-5 h-5" />}
                staticValue
              />
              <Stat
                label={label(t, 'sparringTracker.todaySessions', "Today's sparring sessions")}
                value={todaySessionsCount}
                icon={<Swords className="w-5 h-5" />}
              />
              <Stat
                label={label(t, 'sparringTracker.classesToday', 'Classes today')}
                value={classes.length}
                icon={<BookOpen className="w-5 h-5" />}
                staticValue
              />
              <Stat
                label={label(t, 'sparringTracker.date', 'Date')}
                value={new Date(selectedDate).toLocaleDateString()}
                icon={<Calendar className="w-5 h-5" />}
                staticValue
              />
            </Stagger>
          </FadeUp>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-8 max-w-7xl mx-auto space-y-8">
        {/* Filters */}
        <Surface variant="raised" radius="lg" className="p-4 md:p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 items-end">
            <div>
              <label htmlFor="sparring-search" className="block text-xs font-semibold uppercase tracking-wider text-base-content/60 mb-2">
                {label(t, 'sparringTracker.search', 'Search students')}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-base-content/40 pointer-events-none">
                  <Search className="w-4 h-4" />
                </span>
                <Input
                  id="sparring-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={label(t, 'sparringTracker.searchPlaceholder', 'Type a name…')}
                  className="pl-10"
                  aria-label={label(t, 'sparringTracker.search', 'Search students')}
                />
                {search.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute inset-y-0 right-2 flex items-center text-base-content/40 hover:text-base-content"
                    aria-label={label(t, 'sparringTracker.clearSearch', 'Clear search')}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="sparring-class" className="block text-xs font-semibold uppercase tracking-wider text-base-content/60 mb-2">
                {label(t, 'sparringTracker.filterClass', 'Filter by class')}
              </label>
              <Select
                id="sparring-class"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                options={classOptions}
                aria-label={label(t, 'sparringTracker.filterClass', 'Filter by class')}
              />
            </div>
            <div>
              <label htmlFor="sparring-date" className="block text-xs font-semibold uppercase tracking-wider text-base-content/60 mb-2">
                {label(t, 'sparringTracker.date', 'Date')}
              </label>
              <Input
                id="sparring-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                aria-label={label(t, 'sparringTracker.date', 'Date')}
              />
            </div>
          </div>
        </Surface>

        {/* Students list */}
        <Section
          title={label(t, 'sparringTracker.studentsTitle', 'Students')}
          description={label(t, 'sparringTracker.studentsDesc', 'Tap a quick-add button to log sparring rounds for that student.')}
          icon={<Users className="w-5 h-5" />}
          actions={
            loadingTotals ? (
              <span className="inline-flex items-center gap-2 text-xs text-base-content/60">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {label(t, 'sparringTracker.refreshing', 'Refreshing totals…')}
              </span>
            ) : null
          }
        >
          {isInitialLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            </div>
          ) : visibleStudents.length === 0 ? (
            <EmptyState
              icon={<Users className="w-8 h-8" />}
              title={label(t, 'sparringTracker.noStudents', 'No students match')}
              description={label(t, 'sparringTracker.noStudentsDesc', 'Try clearing the search or selecting a different class.')}
            />
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {visibleStudents.map((student) => {
                const total = totals[student.id] ?? 0;
                const isPending = pending[student.id] === true;
                return (
                  <li key={student.id}>
                    <Surface variant="raised" radius="md" className="p-4 h-full flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={student.avatar_url} alt={student.name} fallback={(student.name?.[0] ?? '?').toUpperCase()} size="md" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-base-content truncate">{student.name}</p>
                          <div className="flex items-center gap-2 text-xs text-base-content/60">
                            <Badge variant="warning" size="sm">{student.belt}</Badge>
                            <span className="truncate">{student.discipline}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-amber-400 tabular-nums leading-none">{total}</p>
                          <p className="text-[10px] uppercase tracking-wider text-base-content/50 mt-1">
                            {label(t, 'sparringTracker.total', 'Total')}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-auto">
                        {QUICK_INCREMENTS.map((inc) => (
                          <Button
                            key={inc}
                            size="sm"
                            variant="primary"
                            onClick={() => handleQuickAdd(student, inc)}
                            disabled={isPending}
                            aria-label={`${label(t, 'sparringTracker.add', 'Add')} ${inc} ${label(t, 'sparringTracker.sessions', 'sessions')} ${label(t, 'sparringTracker.for', 'for')} ${student.name}`}
                          >
                            {isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <span className="inline-flex items-center gap-1 font-bold">
                                <Plus className="w-3.5 h-3.5" />
                                {inc}
                              </span>
                            )}
                          </Button>
                        ))}
                      </div>
                    </Surface>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      </main>
    </div>
  );
}
