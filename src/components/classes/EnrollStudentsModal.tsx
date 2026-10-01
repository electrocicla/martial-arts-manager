import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  X,
  UserPlus,
  Search,
  Check,
  Loader2,
  Users,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Filter,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStudents } from '../../hooks/useStudents';
import { apiClient } from '../../lib/api-client';
import { classService } from '../../services/class.service';
import type { Student } from '../../types';
import { useToast } from '../../hooks/useToast';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Modal } from '../ui/Modal';

interface DisciplineGroup {
  discipline: string;
  students: Student[];
}

interface EnrollStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className: string;
  maxStudents: number;
  onEnrollmentUpdated?: () => void;
}

export function EnrollStudentsModal({
  isOpen,
  onClose,
  classId,
  className,
  maxStudents,
  onEnrollmentUpdated,
}: EnrollStudentsModalProps) {
  const { t } = useTranslation();
  const { students } = useStudents();
  const { success: toastSuccess, error: toastError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('all');
  const [enrolledStudents, setEnrolledStudents] = useState<Set<string>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toastErrorRef = useRef(toastError);

  useEffect(() => {
    toastErrorRef.current = toastError;
  }, [toastError]);

  const fetchEnrolledStudents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<Student[] | { students: Student[] }>(
        `/api/classes/${classId}/students`,
      );
      const responseData: unknown = response.data;
      let payload: Student[] | undefined;

      if (Array.isArray(responseData)) {
        payload = responseData as Student[];
      } else if (responseData && typeof responseData === 'object') {
        const maybeResponse = responseData as { students?: unknown };
        if (Array.isArray(maybeResponse.students)) {
          payload = maybeResponse.students as Student[];
        }
      }

      if (payload) {
        setEnrolledStudents(new Set(payload.map((student) => student.id)));
      }
    } catch (fetchError) {
      console.error('Error fetching enrolled students:', fetchError);
      const message = t('classes.enrollModal.fetchError');
      setError(message);
      toastErrorRef.current?.(t('classes.enrollModal.fetchLoadError'));
    } finally {
      setLoading(false);
    }
  }, [classId, t]);

  useEffect(() => {
    if (isOpen) {
      void fetchEnrolledStudents();
    }
  }, [isOpen, fetchEnrolledStudents]);

  const availableSlots = Math.max(0, maxStudents - enrolledStudents.size);

  const handleEnroll = async (studentId: string) => {
    if (availableSlots === 0) {
      setError(t('classes.enrollModal.maxCapacity'));
      return;
    }

    setActionLoading(studentId);
    setError(null);

    try {
      const response = await apiClient.post(`/api/classes/${classId}/students`, { studentId });
      if (!response.success) {
        throw new Error(response.error || 'Failed to enroll');
      }

      setEnrolledStudents((previous) => new Set([...previous, studentId]));
      onEnrollmentUpdated?.();
      toastSuccess(t('classes.enrollModal.enrolledSuccess'));
    } catch (enrollError: unknown) {
      console.error('Error enrolling student:', enrollError);
      const message = enrollError instanceof Error
        ? enrollError.message
        : t('classes.enrollModal.enrollError');
      setError(message);
      toastError(message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnenroll = async (studentId: string) => {
    setActionLoading(studentId);
    setError(null);

    try {
      const response = await apiClient.delete(`/api/classes/${classId}/students/${studentId}`);
      if (!response.success) {
        throw new Error(response.error || 'Failed to unenroll');
      }

      setEnrolledStudents((previous) => {
        const next = new Set(previous);
        next.delete(studentId);
        return next;
      });
      onEnrollmentUpdated?.();
      toastSuccess(t('classes.enrollModal.unenrolledSuccess'));
    } catch (unenrollError: unknown) {
      console.error('Error unenrolling student:', unenrollError);
      const message = unenrollError instanceof Error
        ? unenrollError.message
        : t('classes.enrollModal.unenrollError');
      setError(message);
      toastError(message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredStudents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch = normalizedSearch.length === 0
        || student.name.toLowerCase().includes(normalizedSearch)
        || student.email.toLowerCase().includes(normalizedSearch);
      const studentDiscipline = student.discipline || 'Sin disciplina';
      const matchesDiscipline = disciplineFilter === 'all'
        || studentDiscipline === disciplineFilter;

      return matchesSearch && matchesDiscipline;
    });
  }, [students, searchTerm, disciplineFilter]);

  const allDisciplines = useMemo((): Array<{ name: string; total: number; enrolled: number }> => {
    const disciplines = new Map<string, { total: number; enrolled: number }>();

    for (const student of students) {
      const discipline = student.discipline || 'Sin disciplina';
      const counts = disciplines.get(discipline) ?? { total: 0, enrolled: 0 };
      counts.total += 1;
      if (enrolledStudents.has(student.id)) counts.enrolled += 1;
      disciplines.set(discipline, counts);
    }

    return Array.from(disciplines.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, counts]) => ({ name, ...counts }));
  }, [students, enrolledStudents]);

  const disciplineGroups = useMemo((): DisciplineGroup[] => {
    const groups = new Map<string, Student[]>();

    for (const student of filteredStudents) {
      const discipline = student.discipline || 'Sin disciplina';
      const group = groups.get(discipline);
      if (group) {
        group.push(student);
      } else {
        groups.set(discipline, [student]);
      }
    }

    return Array.from(groups.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([discipline, groupStudents]) => ({ discipline, students: groupStudents }));
  }, [filteredStudents]);

  const toggleGroupCollapse = useCallback((discipline: string) => {
    setCollapsedGroups((previous) => {
      const next = new Set(previous);
      if (next.has(discipline)) {
        next.delete(discipline);
      } else {
        next.add(discipline);
      }
      return next;
    });
  }, []);

  const handleSelectAllInGroup = useCallback(async (
    groupStudents: Student[],
    discipline: string,
  ) => {
    const unenrolledStudents = groupStudents.filter(
      (student) => !enrolledStudents.has(student.id),
    );

    if (unenrolledStudents.length === 0) return;
    if (availableSlots === 0) {
      setError(t('classes.enrollModal.maxCapacity'));
      return;
    }

    // Select every eligible student in one logical action. The only bound is
    // the class's configured capacity; the backend chunks D1 work internally.
    const idsToEnroll = unenrolledStudents
      .slice(0, availableSlots)
      .map((student) => student.id);

    const batchActionId = `batch:${discipline}`;
    setActionLoading(batchActionId);
    setError(null);

    try {
      const response = await classService.batchEnroll(classId, idsToEnroll);
      if (!response.success) {
        throw new Error(response.error || 'Failed to batch enroll');
      }

      setEnrolledStudents((previous) => new Set([...previous, ...idsToEnroll]));
      onEnrollmentUpdated?.();
      toastSuccess(t('classes.enrollModal.enrolledSuccess'));
    } catch (batchError: unknown) {
      console.error('Error batch enrolling students:', batchError);
      const message = batchError instanceof Error
        ? batchError.message
        : t('classes.enrollModal.enrollError');
      setError(message);
      toastError(message);
    } finally {
      setActionLoading(null);
    }
  }, [
    enrolledStudents,
    availableSlots,
    classId,
    onEnrollmentUpdated,
    toastSuccess,
    toastError,
    t,
  ]);

  const isGroupFullyEnrolled = useCallback((groupStudents: Student[]): boolean =>
    groupStudents.every((student) => enrolledStudents.has(student.id)), [enrolledStudents]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      showCloseButton={false}
      className="!mx-0 !h-[100dvh] !max-h-[100dvh] !max-w-none !rounded-none !border-0 sm:!mx-4 sm:!h-auto sm:!max-h-[92vh] sm:!max-w-4xl sm:!rounded-2xl sm:!border"
    >
      <div className="-mx-6 -my-4 flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-base-100 text-base-content sm:h-auto sm:max-h-[90vh]">
        <header className="flex-none border-b border-base-300 bg-base-100/95 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-xl sm:px-6 sm:py-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 shadow-sm">
              <UserPlus className="h-5 w-5 text-red-500" />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-black leading-tight text-base-content sm:text-2xl">
                {t('classes.enrollModal.title')}
              </h3>
              <p className="mt-1 truncate text-sm text-base-content/60">{className}</p>
            </div>

            <IconButton
              onClick={onClose}
              aria-label={t('common.close')}
              variant="ghost"
              size="sm"
              shape="circle"
              className="min-h-11 min-w-11 shrink-0"
            >
              <X className="h-5 w-5" />
            </IconButton>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <div className="flex min-h-11 items-center gap-2 rounded-xl border border-base-300 bg-base-200/70 px-3 py-2">
              <Users className="h-4 w-4 shrink-0 text-blue-500" />
              <span className="text-xs text-base-content/60 sm:text-sm">
                {t('classes.enrollModal.inscribed')}
              </span>
              <strong className="ml-auto text-sm text-base-content">
                {enrolledStudents.size}/{maxStudents}
              </strong>
            </div>

            <div
              className={`flex min-h-11 items-center justify-center rounded-xl border px-3 py-2 text-sm font-bold ${
                availableSlots === 0
                  ? 'border-error/30 bg-error/10 text-error'
                  : availableSlots <= 3
                    ? 'border-warning/30 bg-warning/10 text-warning'
                    : 'border-success/30 bg-success/10 text-success'
              }`}
            >
              {availableSlots === 0
                ? t('classes.enrollModal.fullClass')
                : `${availableSlots} ${availableSlots === 1 ? t('classes.enrollModal.slot') : t('classes.enrollModal.slots')}`}
            </div>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-4 py-4 sm:px-6">
          {allDisciplines.length > 0 && (
            <section className="flex-none" aria-label={t('classes.enrollModal.filterByDiscipline')}>
              <div className="mb-2 flex items-center gap-2 px-1">
                <Filter className="h-4 w-4 shrink-0 text-base-content/50" />
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-base-content/60">
                  {t('classes.enrollModal.filterByDiscipline')}
                </span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
                <button
                  type="button"
                  onClick={() => setDisciplineFilter('all')}
                  aria-pressed={disciplineFilter === 'all'}
                  className={`min-h-11 shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition-all ${
                    disciplineFilter === 'all'
                      ? 'border-red-500 bg-red-600 text-white shadow-md shadow-red-900/20'
                      : 'border-base-300 bg-base-200 text-base-content/80 hover:border-red-500/40 hover:bg-base-300'
                  }`}
                >
                  {t('classes.enrollModal.allDisciplines')}
                  <span className="ml-2 opacity-70">{students.length}</span>
                </button>

                {allDisciplines.map((discipline) => {
                  const isActive = disciplineFilter === discipline.name;
                  return (
                    <button
                      key={discipline.name}
                      type="button"
                      onClick={() => setDisciplineFilter(isActive ? 'all' : discipline.name)}
                      aria-pressed={isActive}
                      className={`min-h-11 shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition-all ${
                        isActive
                          ? 'border-red-500 bg-red-600 text-white shadow-md shadow-red-900/20'
                          : 'border-base-300 bg-base-200 text-base-content/80 hover:border-red-500/40 hover:bg-base-300'
                      }`}
                    >
                      {discipline.name}
                      <span className="ml-2 opacity-70">
                        {discipline.enrolled}/{discipline.total}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {error && (
            <div
              role="alert"
              className="flex flex-none items-start gap-3 rounded-xl border border-error/30 bg-error/10 px-3 py-3 text-error shadow-sm"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <span className="min-w-0 flex-1 text-sm font-medium leading-5">{error}</span>
              <IconButton
                onClick={() => setError(null)}
                variant="ghost"
                size="sm"
                shape="circle"
                aria-label={t('common.close')}
                className="-mr-1 -mt-1 min-h-9 min-w-9 shrink-0"
              >
                <X className="h-4 w-4" />
              </IconButton>
            </div>
          )}

          <div className="relative flex-none">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-base-content/40" />
            <input
              type="search"
              placeholder={t('classes.enrollModal.searchPlaceholder')}
              className="input input-bordered min-h-12 w-full rounded-xl border-base-300 bg-base-200/60 pl-12 pr-4 text-base text-base-content outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/15"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-0.5 custom-scrollbar">
            {loading ? (
              <div className="flex min-h-64 flex-col items-center justify-center">
                <Loader2 className="mb-3 h-10 w-10 animate-spin text-red-500" />
                <p className="text-sm text-base-content/60">
                  {t('classes.enrollModal.loadingStudents')}
                </p>
              </div>
            ) : disciplineGroups.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-200/40 px-6 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-base-300/70">
                  <Users className="h-8 w-8 text-base-content/35" />
                </div>
                <p className="font-semibold text-base-content/70">
                  {t('classes.enrollModal.noStudentsFound')}
                </p>
                <p className="mt-1 text-sm text-base-content/45">
                  {searchTerm
                    ? t('classes.enrollModal.tryDifferentSearch')
                    : t('classes.enrollModal.noStudentsRegistered')}
                </p>
              </div>
            ) : (
              <div className="space-y-3 pb-2">
                {disciplineGroups.map((group) => {
                  const isCollapsed = collapsedGroups.has(group.discipline);
                  const enrolledCount = group.students.filter((student) =>
                    enrolledStudents.has(student.id)).length;
                  const allEnrolled = isGroupFullyEnrolled(group.students);
                  const batchActionId = `batch:${group.discipline}`;
                  const isBatchLoading = actionLoading === batchActionId;
                  const remainingInGroup = group.students.length - enrolledCount;

                  return (
                    <section
                      key={group.discipline}
                      className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm"
                    >
                      <div className="flex flex-col gap-3 bg-base-200/75 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                        <button
                          type="button"
                          onClick={() => toggleGroupCollapse(group.discipline)}
                          className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl px-2 text-left transition hover:bg-base-300/60"
                          aria-expanded={!isCollapsed}
                        >
                          {isCollapsed
                            ? <ChevronRight className="h-4 w-4 shrink-0 text-base-content/45" />
                            : <ChevronDown className="h-4 w-4 shrink-0 text-base-content/45" />}
                          <span className="min-w-0 flex-1 truncate text-base font-bold text-base-content">
                            {group.discipline}
                          </span>
                          <span className="shrink-0 rounded-full bg-base-300 px-2.5 py-1 text-xs font-bold text-base-content/65">
                            {enrolledCount}/{group.students.length}
                          </span>
                        </button>

                        <Button
                          type="button"
                          size="sm"
                          variant={allEnrolled ? 'secondary' : 'success'}
                          onClick={() => void handleSelectAllInGroup(group.students, group.discipline)}
                          disabled={allEnrolled || availableSlots === 0 || (actionLoading !== null && !isBatchLoading)}
                          isLoading={isBatchLoading}
                          leftIcon={allEnrolled
                            ? <Check className="h-4 w-4" />
                            : <CheckSquare className="h-4 w-4" />}
                          className="min-h-11 w-full shrink-0 rounded-xl px-4 text-sm shadow-sm sm:w-auto"
                        >
                          {allEnrolled
                            ? t('classes.enrollModal.allInscribed')
                            : `${t('classes.enrollModal.selectAll')} (${Math.min(remainingInGroup, availableSlots)})`}
                        </Button>
                      </div>

                      {!isCollapsed && (
                        <div className="space-y-2 p-2 sm:p-3">
                          {group.students.map((student) => {
                            const isEnrolled = enrolledStudents.has(student.id);
                            const isProcessing = actionLoading === student.id;
                            const actionsBusy = actionLoading !== null && !isProcessing;

                            return (
                              <article
                                key={student.id}
                                className={`grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-3 rounded-2xl border p-3 transition sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:items-center sm:p-4 ${
                                  isEnrolled
                                    ? 'border-success/25 bg-success/5'
                                    : 'border-base-300 bg-base-200/35 hover:bg-base-200/70'
                                }`}
                              >
                                <div className="row-span-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-sm sm:h-12 sm:w-12">
                                  <span className="text-base font-black text-white">
                                    {student.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>

                                <div className="min-w-0 self-center">
                                  <div className="truncate text-sm font-bold text-base-content sm:text-base">
                                    {student.name}
                                  </div>
                                  <div className="mt-0.5 truncate text-xs text-base-content/55 sm:text-sm">
                                    {student.email}
                                  </div>
                                </div>

                                <div className="hidden shrink-0 rounded-full border border-base-300 bg-base-100 px-3 py-1 text-xs font-semibold text-base-content/65 sm:block">
                                  {student.belt || 'Sin grado'}
                                </div>

                                <Button
                                  type="button"
                                  size="sm"
                                  variant={isEnrolled ? 'secondary' : 'success'}
                                  onClick={() => void (isEnrolled
                                    ? handleUnenroll(student.id)
                                    : handleEnroll(student.id))}
                                  disabled={isProcessing || actionsBusy || (!isEnrolled && availableSlots === 0)}
                                  isLoading={isProcessing}
                                  leftIcon={isEnrolled
                                    ? <Check className="h-4 w-4" />
                                    : <UserPlus className="h-4 w-4" />}
                                  className="col-span-2 min-h-11 w-full rounded-xl px-4 text-sm shadow-sm sm:col-span-1 sm:w-auto"
                                >
                                  {isEnrolled
                                    ? t('classes.enrollModal.inscribed')
                                    : t('classes.enrollModal.enroll')}
                                </Button>
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        <footer className="flex flex-none items-center gap-3 border-t border-base-300 bg-base-100/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:justify-between sm:px-6 sm:py-4">
          <span className="hidden text-sm text-base-content/55 sm:block">
            {t('classes.enrollModal.searchResults', { count: filteredStudents.length })}
          </span>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            leftIcon={<X className="h-4 w-4" />}
            className="min-h-11 w-full rounded-xl sm:w-auto"
          >
            {t('common.close')}
          </Button>
        </footer>
      </div>
    </Modal>
  );
}
