import { useState } from 'react';
import React from 'react';
import { BookOpen, Plus, Calendar, Users, Copy, List, Clock, MapPin, User, Edit, TrendingUp, UserPlus } from 'lucide-react';
import { useClasses } from '../hooks/useClasses';
import { useClassMetadata } from '../hooks/useClassMetadata';
import { useNavigate } from 'react-router-dom';
import { useClassFilters } from '../hooks/useClassFilters';
import { useClassStats } from '../hooks/useClassStats';
import { getDisciplineColor, getClassStatus } from '../lib/classUtils';
import { ClassFormModal, EnrollStudentsModal } from './classes';
import type { Class } from '../types';
import { useTranslation } from 'react-i18next';

export default function ClassManager() {
  const { t } = useTranslation();
  const {
    classes,
    createClass,
  } = useClasses();
  const { disciplines } = useClassMetadata();
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [filterDiscipline, setFilterDiscipline] = useState('all');
  const [filterDay, setFilterDay] = useState('all');
  const [viewMode, setViewMode] = useState<'schedule' | 'list'>('schedule');

  const { filteredClasses, groupedByDay } = useClassFilters(classes, filterDiscipline, filterDay);
  const stats = useClassStats(classes);

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const iconMap = {
    BookOpen,
    Calendar,
    Users,
    TrendingUp,
  };

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-black to-red-900/20 px-4 sm:px-6 py-6 md:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-4 md:gap-6">
            {/* Title Section */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2.5 sm:p-3 rounded-lg bg-red-600/30 shrink-0">
                  <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-base-content truncate">
                    {t('classes.title')}
                  </h1>
                  <p className="text-xs sm:text-sm text-base-content/70 mt-0.5">
                    {classes.length} {t('classes.subtitle')}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  className="btn btn-ghost btn-sm sm:btn-md gap-2 hover:bg-gray-700/50 transition-all border border-gray-700/50 hover:border-gray-600"
                  title={t('classes.actions.duplicateWeek')}
                >
                  <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden lg:inline">{t('classes.actions.duplicateWeek')}</span>
                </button>
                <button 
                  className="btn btn-primary btn-sm sm:btn-md gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 border-none shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transition-all"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">{t('classes.actions.addClass')}</span>
                  <span className="sm:hidden">Agregar</span>
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {stats.map((stat, idx) => (
                <div 
                  key={idx} 
                  className="bg-gray-800/90 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-700/50 hover:border-red-500/50 transition-all group"
                >
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className={`p-1.5 sm:p-2 rounded-lg ${stat.color.replace('text-', 'bg-')}/10 group-hover:scale-110 transition-transform shrink-0`}>
                      {React.createElement(iconMap[stat.iconName as keyof typeof iconMap], { 
                        className: `w-4 h-4 sm:w-5 sm:h-5 ${stat.color}` 
                      })}
                    </div>
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wide leading-tight">
                    {stat.label}
                  </div>
                  <div className="text-xl sm:text-2xl md:text-3xl font-black text-white mt-1">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 sm:py-6 max-w-7xl mx-auto">
        {/* Filters and View Toggle */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1">
            <select 
              className="select select-bordered bg-gray-800 border-gray-700 hover:border-gray-600 focus:border-red-500 transition-colors w-full sm:flex-1 text-sm sm:text-base"
              value={filterDiscipline}
              onChange={(e) => setFilterDiscipline(e.target.value)}
            >
              <option value="all">{t('classes.filters.allDisciplines')}</option>
              {disciplines.map(disc => (
                <option key={disc} value={disc}>{disc}</option>
              ))}
            </select>

            <select 
              className="select select-bordered bg-gray-800 border-gray-700 hover:border-gray-600 focus:border-red-500 transition-colors w-full sm:flex-1 text-sm sm:text-base"
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
            >
              <option value="all">{t('classes.filters.allDays')}</option>
              {daysOfWeek.map((day, idx) => (
                <option key={day} value={idx}>{day}</option>
              ))}
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-stretch rounded-lg overflow-hidden border border-gray-700 shadow-lg">
            <button 
              className={`
                flex items-center justify-center gap-2 px-3 sm:px-4 py-2 transition-all flex-1 sm:flex-none
                ${viewMode === 'schedule' 
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }
              `}
              onClick={() => setViewMode('schedule')}
            >
              <Calendar className="w-4 h-4" />
              <span className="text-xs sm:text-sm font-medium">{t('classes.viewModes.schedule')}</span>
            </button>
            <button 
              className={`
                flex items-center justify-center gap-2 px-3 sm:px-4 py-2 transition-all flex-1 sm:flex-none
                ${viewMode === 'list' 
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }
              `}
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
              <span className="text-xs sm:text-sm font-medium">{t('classes.viewModes.list')}</span>
            </button>
          </div>
        </div>

        {/* Classes View */}
        {viewMode === 'schedule' ? (
          <div className="space-y-4 sm:space-y-6">
            {Object.entries(groupedByDay).map(([day, dayClasses]) => (
              <div key={day} className="space-y-3">
                {/* Day Header */}
                <div className="flex items-center justify-between mb-3 sm:mb-4 pb-2 border-b border-gray-700/50">
                  <h3 className="font-black text-base sm:text-lg md:text-xl text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 shrink-0" />
                    <span className="truncate">
                      {new Date(day).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </h3>
                  <span className="badge badge-ghost bg-gray-800 border-gray-700 font-semibold text-xs sm:text-sm shrink-0">
                    {dayClasses.length} {dayClasses.length === 1 ? 'clase' : 'clases'}
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
                            {/* Content */}
                            <div className="flex-1 min-w-0 w-full">
                              {/* Title and Badges */}
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
                              
                              {/* Info Grid */}
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
                            </div>

                            {/* Actions */}
                            <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0">
                              <button 
                                className="
                                  flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg
                                  bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 
                                  border-none shadow-md hover:shadow-lg transition-all duration-200
                                  text-white font-medium text-xs sm:text-sm flex-1 sm:flex-none
                                "
                                onClick={() => {
                                  setSelectedClass(cls);
                                  setShowEnrollModal(true);
                                }}
                                title="Gestionar estudiantes"
                              >
                                <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                                <span className="hidden sm:inline">Estudiantes</span>
                              </button>
                              <button 
                                className="
                                  flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg
                                  bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800
                                  border-none shadow-md hover:shadow-lg transition-all duration-200
                                  text-white font-medium text-xs sm:text-sm flex-1 sm:flex-none
                                "
                                onClick={() => navigate(`/attendance/${cls.id}`)}
                              >
                                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                                <span className="hidden sm:inline">{t('classes.actions.attendance')}</span>
                              </button>
                              <button 
                                className="
                                  flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg
                                  bg-gray-700 hover:bg-gray-600 border border-gray-600 hover:border-gray-500
                                  transition-all duration-200 text-white text-xs sm:text-sm flex-1 sm:flex-none
                                "
                                title={t('classes.actions.edit')}
                              >
                                <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Empty State */}
            {Object.keys(groupedByDay).length === 0 && (
              <div className="text-center py-12 sm:py-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700/50">
                <div className="max-w-md mx-auto px-4">
                  <div className="p-3 sm:p-4 bg-red-500/10 rounded-full w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 flex items-center justify-center">
                    <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-red-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{t('classes.empty.noClassesScheduled')}</h3>
                  <p className="text-sm sm:text-base text-base-content/60 mb-6">Comienza a crear tu horario de clases</p>
                  <button 
                    className="
                      btn btn-primary gap-2 bg-gradient-to-r from-red-600 to-red-700 
                      hover:from-red-700 hover:to-red-800 border-none shadow-lg
                      text-sm sm:text-base
                    "
                    onClick={() => setShowAddModal(true)}
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    {t('classes.actions.scheduleFirstClass')}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* List View - Modern Grid Cards Layout */
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {filteredClasses.map((cls) => {
              const status = getClassStatus(cls.date, cls.time);
              return (
                <div 
                  key={cls.id} 
                  className="card bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-750 hover:to-gray-850 transition-all duration-200 border border-gray-700/50 hover:border-red-500/30 shadow-lg hover:shadow-red-500/10"
                >
                  <div className="card-body p-3 sm:p-4 md:p-5">
                    {/* Header Row - Class Name & Status */}
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
                        <button 
                          className="
                            flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg flex-1 sm:flex-none
                            bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 
                            border-none shadow-md hover:shadow-lg transition-all duration-200
                            text-white font-medium text-xs sm:text-sm
                          "
                          onClick={() => {
                            setSelectedClass(cls);
                            setShowEnrollModal(true);
                          }}
                        >
                          <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                          <span>Estudiantes</span>
                        </button>
                        <button 
                          className="
                            flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg flex-1 sm:flex-none
                            bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 
                            border-none shadow-md hover:shadow-lg transition-all duration-200
                            text-white font-medium text-xs sm:text-sm
                          "
                          onClick={() => navigate(`/attendance/${cls.id}`)}
                        >
                          <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                          <span className="hidden sm:inline">{t('classes.actions.attendance')}</span>
                          <span className="sm:hidden">Asistencia</span>
                        </button>
                        <button 
                          className="
                            flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg
                            bg-gray-700 hover:bg-gray-600 border border-gray-600 hover:border-gray-500
                            transition-all duration-200 text-white text-xs sm:text-sm
                          "
                          title={t('classes.actions.edit')}
                        >
                          <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Info Grid - Responsive Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                      {/* Date */}
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
                      
                      {/* Time */}
                      <div className="flex items-center gap-2 p-2 sm:p-3 bg-gray-800/60 rounded-lg border border-gray-700/50">
                        <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-500/10 shrink-0">
                          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-medium tracking-wide">Hora</div>
                          <div className="text-xs sm:text-sm font-semibold text-white">{cls.time}</div>
                        </div>
                      </div>
                      
                      {/* Location */}
                      <div className="flex items-center gap-2 p-2 sm:p-3 bg-gray-800/60 rounded-lg border border-gray-700/50">
                        <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-500/10 shrink-0">
                          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-medium tracking-wide">Ubicación</div>
                          <div className="text-xs sm:text-sm font-semibold text-white truncate">{cls.location}</div>
                        </div>
                      </div>
                      
                      {/* Students */}
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
                        <span className="text-gray-400">Instructor:</span>
                        <span className="font-semibold text-white truncate">{cls.instructor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Empty State for List View */}
            {filteredClasses.length === 0 && (
              <div className="text-center py-12 sm:py-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700/50">
                <div className="max-w-md mx-auto px-4">
                  <div className="p-3 sm:p-4 bg-red-500/10 rounded-full w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 flex items-center justify-center">
                    <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-red-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">No se encontraron clases</h3>
                  <p className="text-sm sm:text-base text-base-content/60 mb-6">Intenta cambiar los filtros</p>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      <ClassFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={createClass}
      />
      
      {selectedClass && (
        <EnrollStudentsModal
          isOpen={showEnrollModal}
          onClose={() => {
            setShowEnrollModal(false);
            setSelectedClass(null);
          }}
          classId={parseInt(selectedClass.id)}
          className={selectedClass.name}
          maxStudents={selectedClass.max_students}
          currentEnrollment={(selectedClass as any).enrolled_count ?? 0}
        />
      )}
    </div>
  );
}
