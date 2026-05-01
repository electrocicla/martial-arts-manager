import { BookOpen, Calendar, Clock, Eye, MapPin, User, Users, Edit, UserPlus } from 'lucide-react';
import { getDisciplineColor, getClassStatus } from '../../lib/classUtils';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import type { Class } from '../../types';

interface ClassListViewProps {
  classes: Class[];
  onEnroll: (cls: Class) => void;
  onAttendance: (cls: Class) => void;
  onEdit: (cls: Class) => void;
  onViewDetails: (cls: Class) => void;
}

export default function ClassListView({ classes, onEnroll, onAttendance, onEdit, onViewDetails }: ClassListViewProps) {
  const { t } = useTranslation();

  if (classes.length === 0) {
    return (
      <div className="text-center py-12 sm:py-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700/50">
        <div className="max-w-md mx-auto px-4">
          <div className="p-3 sm:p-4 bg-red-500/10 rounded-full w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 flex items-center justify-center">
            <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-red-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{t('classes.empty.noClassesFound')}</h3>
          <p className="text-sm sm:text-base text-base-content/60 mb-6">Intenta cambiar los filtros</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4">
      {classes.map((cls) => {
        const status = getClassStatus(cls.date, cls.time);
        return (
          <div
            key={cls.id}
            className="card bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-750 hover:to-gray-850 transition-all duration-200 border border-gray-700/50 hover:border-red-500/30 shadow-lg hover:shadow-red-500/10"
          >
            <div className="card-body p-3 sm:p-4 md:p-5">
              {/* Header Row */}
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="flex-1 min-w-0 w-full">
                  <h3 className="font-bold text-base sm:text-lg text-white mb-2 truncate">{cls.name}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className={`badge ${getDisciplineColor(cls.discipline)} badge-sm sm:badge-md font-semibold`}>
                      {cls.discipline}
                    </div>
                    <div className={`badge ${status.color} badge-sm sm:badge-md`}>
                      {t(`classes.status.${status.labelKey}`)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 w-full sm:w-auto shrink-0">
                  <Button
                    variant="success"
                    size="sm"
                    className="flex-1 sm:flex-none"
                    onClick={() => onEnroll(cls)}
                    leftIcon={<UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />}
                  >
                    {t('classes.actions.students')}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1 sm:flex-none"
                    onClick={() => onAttendance(cls)}
                    leftIcon={<Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />}
                  >
                    <span className="hidden sm:inline">{t('classes.actions.attendance')}</span>
                    <span className="sm:hidden">{t('classes.actions.attendanceShort')}</span>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    title={t('common.details')}
                    onClick={() => onViewDetails(cls)}
                    leftIcon={<Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    title={t('classes.actions.edit')}
                    onClick={() => onEdit(cls)}
                    leftIcon={<Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  />
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <div className="flex items-center gap-2 p-2 sm:p-3 bg-gray-800/60 rounded-lg border border-gray-700/50">
                  <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500/10 shrink-0">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-medium tracking-wide">Fecha</div>
                    <div className="text-xs sm:text-sm font-semibold text-white truncate">
                      {new Date(cls.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 sm:p-3 bg-gray-800/60 rounded-lg border border-gray-700/50">
                  <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-500/10 shrink-0">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-medium tracking-wide">Hora</div>
                    <div className="text-xs sm:text-sm font-semibold text-white">{cls.time}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 sm:p-3 bg-gray-800/60 rounded-lg border border-gray-700/50">
                  <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-500/10 shrink-0">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-medium tracking-wide">Ubicación</div>
                    <div className="text-xs sm:text-sm font-semibold text-white truncate">{cls.location}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 sm:p-3 bg-gray-800/60 rounded-lg border border-gray-700/50">
                  <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-yellow-500/10 shrink-0">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-medium tracking-wide">Estudiantes</div>
                    <div className="text-xs sm:text-sm font-semibold text-white">
                      {cls.enrolled_count || 0}/{cls.max_students}
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructor */}
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-700/50">
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 shrink-0" />
                  <span className="text-gray-400">{t('classes.labels.instructor')}</span>
                  <span className="font-semibold text-white truncate">{cls.instructor}</span>
                </div>
                {cls.description && (
                  <button
                    type="button"
                    onClick={() => onViewDetails(cls)}
                    className="mt-3 flex w-full items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-950/20 p-3 text-left transition-colors hover:border-blue-400/40 hover:bg-blue-950/30"
                  >
                    <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold uppercase text-blue-300">
                        {t('dashboard.student.classObjective')}
                      </span>
                      <span className="mt-1 block line-clamp-2 text-sm leading-relaxed text-gray-300">
                        {cls.description}
                      </span>
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
