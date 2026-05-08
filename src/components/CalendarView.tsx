import { useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useTranslation } from 'react-i18next';
import { ArrowRight, BookOpen, CalendarDays, Clock, Eye, MapPin, Sparkles, User } from 'lucide-react';
import { useClasses } from '../hooks/useClasses';
import { useAuth } from '../context/AuthContext';
import type { Class } from '../types';
import ClassDetailsModal from './classes/ClassDetailsModal';
import ClassFormModal from './classes/ClassFormModal';
import { Button } from './ui/Button';

const CALENDAR_LOCALE = 'es-CL';

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fromDateKey(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isSessionRow(classItem: Class): boolean {
  return (classItem.parent_course_id !== undefined && classItem.parent_course_id !== null) || classItem.is_recurring === 0;
}

function toClassDateTime(classItem: Pick<Class, 'date' | 'time'>): Date {
  return new Date(`${classItem.date}T${classItem.time}`);
}

function formatMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat(CALENDAR_LOCALE, { month: 'long', year: 'numeric' }).format(date);
}

function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat(CALENDAR_LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatCompactDate(value: string): string {
  return new Intl.DateTimeFormat(CALENDAR_LOCALE, { day: 'numeric', month: 'short' })
    .format(fromDateKey(value))
    .replace('.', '');
}

function formatShortWeekday(_: string | undefined, date: Date): string {
  return new Intl.DateTimeFormat(CALENDAR_LOCALE, { weekday: 'short' })
    .format(date)
    .replace('.', '')
    .slice(0, 3)
    .toUpperCase();
}

export default function CalendarView() {
  const { t } = useTranslation();
  const { classes, updateClass, refresh, deleteClass, error, isLoading } = useClasses();
  const { user } = useAuth();
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => toDateKey(today), [today]);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => startOfMonth(today));
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const canManageClasses = user?.role === 'admin' || user?.role === 'instructor';

  const visibleClasses = classes.filter((classItem: Class) => {
    if (!user) return false;
    if (user.role === 'admin') return true;

    if (user.role === 'instructor') {
      return classItem.instructor_id === user.id || classItem.created_by === user.id || classItem.instructor === user.name;
    }

    if (user.role === 'student') {
      const enrolledIds = classItem.enrolled_student_ids;
      const studentId = user.student_id ?? user.id;
      return Array.isArray(enrolledIds) ? enrolledIds.includes(studentId) : true;
    }

    return false;
  });

  const scheduledClasses = useMemo(
    () => visibleClasses.filter(isSessionRow).sort((left, right) => left.date.localeCompare(right.date) || left.time.localeCompare(right.time)),
    [visibleClasses],
  );

  const classesByDate = useMemo(() => {
    const grouped = new Map<string, Class[]>();

    for (const classItem of scheduledClasses) {
      const existing = grouped.get(classItem.date) ?? [];
      existing.push(classItem);
      existing.sort((left, right) => left.time.localeCompare(right.time));
      grouped.set(classItem.date, existing);
    }

    return grouped;
  }, [scheduledClasses]);

  const selectedDateKey = useMemo(() => toDateKey(selectedDate), [selectedDate]);
  const classesOnDate = useMemo(() => classesByDate.get(selectedDateKey) ?? [], [classesByDate, selectedDateKey]);

  const monthClasses = useMemo(
    () => scheduledClasses.filter((classItem) => {
      const classDate = fromDateKey(classItem.date);
      return classDate.getFullYear() === visibleMonth.getFullYear() && classDate.getMonth() === visibleMonth.getMonth();
    }),
    [scheduledClasses, visibleMonth],
  );

  const activeDaysThisMonth = useMemo(() => new Set(monthClasses.map((classItem) => classItem.date)).size, [monthClasses]);

  const nextScheduledClass = useMemo(
    () => scheduledClasses.find((classItem) => toClassDateTime(classItem).getTime() >= Date.now()) ?? null,
    [scheduledClasses],
  );

  const nextClassFromSelectedDate = useMemo(
    () => scheduledClasses.find((classItem) => classItem.date >= selectedDateKey) ?? null,
    [scheduledClasses, selectedDateKey],
  );

  const selectedCount = useMemo(() => Object.values(selectedIds).filter(Boolean).length, [selectedIds]);

  const jumpToDate = (dateKey: string): void => {
    const nextDate = fromDateKey(dateKey);
    setSelectedDate(nextDate);
    setVisibleMonth(startOfMonth(nextDate));
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.28em] text-red-200">
            <Sparkles className="h-3.5 w-3.5" />
            Agenda operativa
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-gray-50 sm:text-4xl">{t('nav.calendar')}</h2>
            <p className="max-w-2xl text-sm leading-6 text-gray-400 sm:text-base">
              {t('calendar.subtitle', 'Explora tus clases, detecta dias activos y salta rapido a la siguiente sesion del dojo.')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[26rem]">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.9)] supports-[backdrop-filter]:bg-white/4 supports-[backdrop-filter]:backdrop-blur-sm">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-gray-500">Sesiones del mes</p>
            <p className="mt-2 text-2xl font-black text-gray-50">{monthClasses.length}</p>
            <p className="mt-1 text-xs text-gray-400">Programadas en {formatMonthLabel(visibleMonth)}</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.9)] supports-[backdrop-filter]:bg-white/4 supports-[backdrop-filter]:backdrop-blur-sm">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-gray-500">Dias activos</p>
            <p className="mt-2 text-2xl font-black text-gray-50">{activeDaysThisMonth}</p>
            <p className="mt-1 text-xs text-gray-400">Fechas con al menos una clase</p>
          </div>
          <div className="col-span-2 rounded-[24px] border border-red-500/20 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent p-4 shadow-[0_18px_40px_-28px_rgba(220,38,38,0.55)] sm:col-span-1">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-red-200/80">Proxima clase</p>
            <p className="mt-2 text-lg font-black text-gray-50">{nextScheduledClass ? formatCompactDate(nextScheduledClass.date) : 'Sin agenda'}</p>
            <p className="mt-1 line-clamp-2 text-xs text-gray-300">
              {nextScheduledClass ? `${nextScheduledClass.time} · ${nextScheduledClass.name}` : 'No hay sesiones futuras publicadas.'}
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-[24px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.95fr)]">
          <div className="h-[30rem] animate-pulse rounded-[28px] border border-white/10 bg-white/5" />
          <div className="h-[30rem] animate-pulse rounded-[28px] border border-white/10 bg-white/5" />
        </div>
      ) : null}

      {!isLoading ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.95fr)]">
          <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.14),transparent_34%),linear-gradient(180deg,rgba(17,24,39,0.96),rgba(10,15,27,0.98))] p-4 shadow-[0_28px_64px_-38px_rgba(0,0,0,0.95)] ring-1 ring-white/5 supports-[backdrop-filter]:backdrop-blur-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-gray-400">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Vista mensual
                </div>
                <div>
                  <h3 className="text-xl font-black capitalize tracking-tight text-gray-50 sm:text-2xl">{formatMonthLabel(visibleMonth)}</h3>
                  <p className="mt-1 text-sm leading-6 text-gray-400">Los dias con sesiones muestran un contador para que ubiques rapido la actividad del dojo.</p>
                </div>
              </div>

              <Button className="max-sm:w-full" leftIcon={<Sparkles className="h-4 w-4" />} onClick={() => jumpToDate(todayKey)} size="sm" variant="secondary">
                Volver a hoy
              </Button>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-100">
                {monthClasses.length} sesiones publicadas
              </span>
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-gray-300">
                {activeDaysThisMonth} dias con actividad
              </span>
              <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                {classesByDate.get(todayKey)?.length ?? 0} sesiones hoy
              </span>
            </div>

            <Calendar
              activeStartDate={visibleMonth}
              calendarType="iso8601"
              className="custom-calendar w-full"
              formatShortWeekday={formatShortWeekday}
              locale={CALENDAR_LOCALE}
              navigationLabel={({ label }) => (
                <span className="block px-2 py-1 text-center text-sm font-semibold capitalize leading-tight text-gray-100 sm:text-base">{label}</span>
              )}
              next2AriaLabel="Ir al proximo anio"
              next2Label="»"
              nextAriaLabel="Ir al proximo mes"
              onActiveStartDateChange={({ activeStartDate }) => {
                if (activeStartDate) {
                  setVisibleMonth(activeStartDate);
                  if (
                    selectedDate.getFullYear() !== activeStartDate.getFullYear()
                    || selectedDate.getMonth() !== activeStartDate.getMonth()
                  ) {
                    setSelectedDate(activeStartDate);
                  }
                }
              }}
              onChange={(value) => {
                if (Array.isArray(value) || !value) {
                  return;
                }
                setSelectedDate(value);
              }}
              prev2AriaLabel="Ir al anio anterior"
              prev2Label="«"
              prevAriaLabel="Ir al mes anterior"
              selectRange={false}
              showFixedNumberOfWeeks
              tileClassName={({ date, view }) => (view === 'month' && classesByDate.has(toDateKey(date)) ? 'calendar-has-session' : undefined)}
              tileContent={({ date, view }) => {
                if (view !== 'month') {
                  return null;
                }

                const sessionCount = classesByDate.get(toDateKey(date))?.length ?? 0;
                if (sessionCount === 0) {
                  return null;
                }

                return (
                  <span className="calendar-tile-meta" aria-hidden="true">
                    <span className="calendar-session-count">{sessionCount}</span>
                  </span>
                );
              }}
              value={selectedDate}
            />
          </section>

          <aside className="space-y-5">
            <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.96),rgba(10,15,27,0.98))] p-5 shadow-[0_28px_64px_-38px_rgba(0,0,0,0.95)] ring-1 ring-white/5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between xl:flex-col xl:items-stretch">
                <div className="space-y-2">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-gray-500">Dia seleccionado</p>
                  <h3 className="text-xl font-black capitalize text-gray-50">{formatLongDate(selectedDate)}</h3>
                  <p className="text-sm leading-6 text-gray-400">
                    {classesOnDate.length > 0
                      ? `${classesOnDate.length} ${classesOnDate.length === 1 ? 'sesion programada' : 'sesiones programadas'} para esta fecha.`
                      : 'No hay sesiones programadas para esta fecha.'}
                  </p>
                </div>

                <Button className="max-sm:w-full" onClick={() => jumpToDate(todayKey)} size="sm" variant="ghost">
                  Ir a hoy
                </Button>
              </div>

              {classesOnDate.length > 0 ? (
                <ul className="mt-5 space-y-3">
                  {classesOnDate.map((classItem) => (
                    <li key={classItem.id} className="group rounded-[24px] border border-white/8 bg-white/[0.03] p-4 transition duration-200 hover:border-red-500/35 hover:bg-red-500/[0.06]">
                      <div className="flex flex-col gap-4">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-red-100">
                              {classItem.discipline}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-gray-300">
                              <Clock className="h-3.5 w-3.5" />
                              {classItem.time}
                            </span>
                          </div>

                          <div>
                            <h4 className="text-lg font-black text-gray-50">{classItem.name}</h4>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-400 sm:text-sm">
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {classItem.location}
                              </span>
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                                <User className="h-3.5 w-3.5" />
                                {classItem.instructor}
                              </span>
                            </div>
                          </div>

                          {classItem.description ? (
                            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3">
                              <div className="mb-1.5 flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-blue-200">
                                <BookOpen className="h-3.5 w-3.5" />
                                Objetivo de la clase
                              </div>
                              <p className="line-clamp-4 whitespace-pre-line text-sm leading-relaxed text-gray-300">{classItem.description}</p>
                            </div>
                          ) : null}
                        </div>

                        <div className="flex flex-col gap-2 border-t border-white/8 pt-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              leftIcon={<Eye className="h-4 w-4" />}
                              onClick={() => {
                                setSelectedClass(classItem);
                                setShowDetails(true);
                              }}
                              size="sm"
                              variant="secondary"
                            >
                              Ver detalle
                            </Button>

                            {canManageClasses ? (
                              <Button
                                onClick={() => {
                                  setEditingClass(classItem);
                                  setShowEditModal(true);
                                }}
                                size="sm"
                                variant="ghost"
                              >
                                Editar
                              </Button>
                            ) : null}
                          </div>

                          {canManageClasses ? (
                            <label className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-300">
                              <input
                                aria-label={t('common.select')}
                                checked={!!selectedIds[classItem.id]}
                                className="checkbox checkbox-xs border-white/20 bg-transparent"
                                onChange={(event) => {
                                  setSelectedIds((previous) => ({ ...previous, [classItem.id]: !!event.target.checked }));
                                }}
                                type="checkbox"
                              />
                              Seleccionar
                            </label>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.03] p-5 text-sm text-gray-300">
                  <p className="text-base font-semibold text-gray-100">No hay clases ese dia</p>
                  <p className="mt-2 leading-6 text-gray-400">Usa la vista mensual para buscar actividad o salta directamente a la siguiente fecha disponible.</p>

                  {nextClassFromSelectedDate ? (
                    <div className="mt-4 rounded-2xl border border-red-500/15 bg-red-500/10 p-4">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-red-200/80">Siguiente fecha activa</p>
                      <p className="mt-2 text-sm font-semibold text-gray-50">{formatCompactDate(nextClassFromSelectedDate.date)} · {nextClassFromSelectedDate.time}</p>
                      <p className="mt-1 text-sm text-gray-300">{nextClassFromSelectedDate.name}</p>
                      <Button className="mt-4 max-sm:w-full" onClick={() => jumpToDate(nextClassFromSelectedDate.date)} rightIcon={<ArrowRight className="h-4 w-4" />} size="sm" variant="secondary">
                        Ir a esa fecha
                      </Button>
                    </div>
                  ) : null}
                </div>
              )}

              {canManageClasses && selectedCount > 0 ? (
                <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-gray-200">{selectedCount} {selectedCount === 1 ? 'clase seleccionada' : 'clases seleccionadas'}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => {
                          const ids = Object.keys(selectedIds).filter((id) => selectedIds[id]);
                          const first = scheduledClasses.find((entry) => entry.id === ids[0]);
                          if (!first) {
                            return;
                          }
                          setEditingClass(first);
                          setShowEditModal(true);
                        }}
                        size="sm"
                        variant="primary"
                      >
                        Edicion rapida
                      </Button>
                      <Button
                        onClick={async () => {
                          const ids = Object.keys(selectedIds).filter((id) => selectedIds[id]);
                          for (const id of ids) {
                            await deleteClass(id);
                          }
                          setSelectedIds({});
                          await refresh();
                        }}
                        size="sm"
                        variant="ghost"
                      >
                        Eliminar
                      </Button>
                      <Button onClick={() => setSelectedIds({})} size="sm" variant="ghost">
                        Limpiar
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </section>

            <section className="rounded-[28px] border border-white/10 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent p-5 shadow-[0_28px_64px_-38px_rgba(0,0,0,0.95)] ring-1 ring-white/5 sm:p-6">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-emerald-200/80">Proxima sesion</p>
              {nextScheduledClass ? (
                <>
                  <h3 className="mt-3 text-xl font-black text-gray-50">{nextScheduledClass.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-300">{formatCompactDate(nextScheduledClass.date)} · {nextScheduledClass.time} · {nextScheduledClass.location}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-400">
                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1">{nextScheduledClass.discipline}</span>
                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1">{nextScheduledClass.instructor}</span>
                  </div>
                  <Button className="mt-5 max-sm:w-full" onClick={() => jumpToDate(nextScheduledClass.date)} rightIcon={<ArrowRight className="h-4 w-4" />} size="sm" variant="secondary">
                    Abrir en calendario
                  </Button>
                </>
              ) : (
                <p className="mt-3 text-sm leading-6 text-gray-400">No hay clases futuras para mostrar en este momento.</p>
              )}
            </section>
          </aside>
        </div>
      ) : null}

      {selectedClass ? (
        <ClassDetailsModal isOpen={showDetails} onClose={() => { setShowDetails(false); setSelectedClass(null); }} cls={selectedClass} />
      ) : null}

      {editingClass ? (
        <ClassFormModal
          initialData={{
            id: editingClass.id,
            name: editingClass.name,
            discipline: editingClass.discipline as unknown as string,
            date: editingClass.date,
            time: editingClass.time,
            location: editingClass.location,
            instructor: editingClass.instructor,
            maxStudents: editingClass.max_students,
            description: editingClass.description || undefined,
            isRecurring: !!editingClass.is_recurring,
            recurrencePattern: editingClass.recurrence_pattern ? JSON.parse(editingClass.recurrence_pattern) : undefined,
          }}
          isOpen={showEditModal}
          onClose={() => { setShowEditModal(false); setEditingClass(null); }}
          onSubmit={async () => null}
          onUpdate={async (id, data) => {
            const updated = await updateClass(id, data);
            await refresh();
            return updated;
          }}
        />
      ) : null}
    </div>
  );
}
