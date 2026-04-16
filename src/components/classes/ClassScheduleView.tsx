import { Calendar, Clock, MapPin, User, Users, Edit, UserPlus, Plus } from 'lucide-react';
import { getDisciplineColor, getClassStatus } from '../../lib/classUtils';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import type { Class } from '../../types';

interface ClassScheduleViewProps {
  groupedByDay: Record<string, Class[]>;
  onViewDetails: (cls: Class) => void;
  onEnroll: (cls: Class) => void;
  onAttendance: (cls: Class) => void;
  onEdit: (cls: Class) => void;
  onDelete: (cls: Class) => void;
  onAddClass: () => void;
}

export default function ClassScheduleView({
  groupedByDay,
  onViewDetails,
  onEnroll,
  onAttendance,
  onEdit,
  onDelete,
  onAddClass,
}: ClassScheduleViewProps) {
  const { t } = useTranslation();

  if (Object.keys(groupedByDay).length === 0) {
    return (
      <div className="text-center py-12 sm:py-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700/50">
        <div className="max-w-md mx-auto px-4">
          <div className="p-3 sm:p-4 bg-red-500/10 rounded-full w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 flex items-center justify-center">
            <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-red-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{t('classes.empty.noClassesScheduled')}</h3>
          <p className="text-sm sm:text-base text-base-content/60 mb-6">{t('classes.empty.startCreateSchedule')}</p>
          <Button
            variant="primary"
            onClick={onAddClass}
            leftIcon={<Plus className="w-4 h-4 sm:w-5 sm:h-5" />}
          >
            {t('classes.actions.scheduleFirstClass')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {Object.entries(groupedByDay).map(([day, dayClasses]) => (
        <div key={day} className="space-y-3">
          {/* Day Header */}
          <div className="flex items-center justify-between mb-3 sm:mb-4 pb-2 border-b border-gray-700/50">
            <h3 className="font-black text-base sm:text-lg md:text-xl text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 shrink-0" />
              <span className="truncate">
                {new Date(`${day}T00:00:00`).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </h3>
            <span className="badge badge-ghost bg-gray-800 border-gray-700 font-semibold text-xs sm:text-sm shrink-0">
              {dayClasses.length} {dayClasses.length === 1 ? t('classes.singular') : t('classes.plural')}
            </span>
          </div>

          {/* Classes Grid */}
          <div className="grid gap-3 sm:gap-4">
            {dayClasses.sort((a, b) => a.time.localeCompare(b.time)).map((cls) => {
              const status = getClassStatus(cls.date, cls.time);
              return (
                <div
                  key={cls.id}
                  className="card bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-750 hover:to-gray-850 transition-all duration-200 border border-gray-700/50 hover:border-red-500/30 shadow-lg hover:shadow-red-500/10"
                >
                  <div className="card-body p-3 sm:p-4 md:p-5">
                    <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex items-start gap-2 mb-3">
                          <h4 className="font-bold text-white text-base sm:text-lg flex-1 min-w-0 truncate">
                            {cls.name}
                          </h4>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <div className={`badge ${getDisciplineColor(cls.discipline)} badge-sm font-medium`}>
                            {cls.discipline}
                          </div>
                          <div className={`badge ${status.color} badge-sm font-medium`}>
                            {t(`classes.status.${status.labelKey}`)}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm text-base-content/70">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 shrink-0" />
                            <span className="font-medium truncate">{cls.time}</span>
                          </div>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 shrink-0" />
                            <span className="truncate">{cls.location}</span>
                          </div>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 shrink-0" />
                            <span className="truncate">{cls.instructor}</span>
                          </div>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 shrink-0" />
                            <span className="font-medium">{cls.enrolled_count || 0}/{cls.max_students}</span>
                          </div>
                        </div>

                        {cls.description && (
                          <p className="text-xs text-base-content/60 mt-3 line-clamp-2">{cls.description}</p>
                        )}
                        <div className="mt-2">
                          <button className="text-xs text-gray-400 underline" onClick={() => onViewDetails(cls)}>
                            Ver Detalles
                          </button>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0">
                        <Button
                          variant="success"
                          size="sm"
                          className="flex-1 sm:flex-none"
                          onClick={() => onEnroll(cls)}
                          title="Gestionar estudiantes"
                          leftIcon={<UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />}
                        >
                          <span className="hidden sm:inline">{t('classes.actions.students')}</span>
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1 sm:flex-none"
                          onClick={() => onAttendance(cls)}
                          leftIcon={<Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />}
                        >
                          <span className="hidden sm:inline">{t('classes.actions.attendance')}</span>
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1 sm:flex-none"
                          title={t('classes.actions.edit')}
                          onClick={() => onEdit(cls)}
                          leftIcon={<Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => onDelete(cls)}
                          title={t('common.delete')}
                        >
                          {t('common.delete')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
