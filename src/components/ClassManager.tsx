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
  const [selectedClass, setSelectedClass] = useState<any>(null);
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
      <div className="bg-gradient-to-br from-black to-red-900/20 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-red-600/30">
                <BookOpen className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-base-content">
                  {t('classes.title')}
                </h1>
                <p className="text-sm text-base-content/70">
                  {classes.length} {t('classes.subtitle')}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="btn btn-ghost btn-sm gap-2 hover:bg-gray-700/50 transition-all">
                <Copy className="w-4 h-4" />
                <span className="hidden md:inline">{t('classes.actions.duplicateWeek')}</span>
              </button>
              <button 
                className="btn btn-primary btn-sm gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 border-none shadow-lg shadow-red-500/20"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="w-4 h-4" />
                {t('classes.actions.addClass')}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-gray-800/90 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 hover:border-red-500/50 transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${stat.color.replace('text-', 'bg-')}/10 group-hover:scale-110 transition-transform`}>
                    {React.createElement(iconMap[stat.iconName as keyof typeof iconMap], { className: `w-5 h-5 ${stat.color}` })}
                  </div>
                </div>
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">{stat.label}</div>
                <div className="text-2xl md:text-3xl font-black text-white mt-1">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-7xl mx-auto">
        {/* Filters and View Toggle */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="flex-1 flex flex-col sm:flex-row gap-2">
            <select 
              className="select select-bordered bg-gray-800 border-gray-700 hover:border-gray-600 focus:border-red-500 flex-1"
              value={filterDiscipline}
              onChange={(e) => setFilterDiscipline(e.target.value)}
            >
              <option value="all">{t('classes.filters.allDisciplines')}</option>
              {disciplines.map(disc => (
                <option key={disc} value={disc}>{disc}</option>
              ))}
            </select>

            <select 
              className="select select-bordered bg-gray-800 border-gray-700 hover:border-gray-600 focus:border-red-500 flex-1"
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
            >
              <option value="all">{t('classes.filters.allDays')}</option>
              {daysOfWeek.map((day, idx) => (
                <option key={day} value={idx}>{day}</option>
              ))}
            </select>
          </div>

          <div className="btn-group shadow-lg">
            <button 
              className={`btn btn-sm ${viewMode === 'schedule' ? 'btn-primary bg-red-600 border-red-600' : 'bg-gray-800 border-gray-700'}`}
              onClick={() => setViewMode('schedule')}
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">{t('classes.viewModes.schedule')}</span>
            </button>
            <button 
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary bg-red-600 border-red-600' : 'bg-gray-800 border-gray-700'}`}
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">{t('classes.viewModes.list')}</span>
            </button>
          </div>
        </div>

        {/* Classes View */}
        {viewMode === 'schedule' ? (
          <div className="space-y-6">
            {Object.entries(groupedByDay).map(([day, dayClasses]) => (
              <div key={day} className="space-y-3">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-700/50">
                  <h3 className="font-black text-xl text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-red-400" />
                    {new Date(day).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </h3>
                  <span className="badge badge-ghost bg-gray-800 border-gray-700 font-semibold">
                    {dayClasses.length} {dayClasses.length === 1 ? 'class' : 'classes'}
                  </span>
                </div>
                
                <div className="grid gap-3">
                  {dayClasses.sort((a, b) => a.time.localeCompare(b.time)).map((cls) => {
                    const status = getClassStatus(cls.date, cls.time);
                    return (
                      <div key={cls.id} className="card bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-750 hover:to-gray-850 transition-all border border-gray-700/50 hover:border-red-500/30 shadow-lg hover:shadow-red-500/10">
                        <div className="card-body p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h4 className="font-bold text-base-content text-lg">{cls.name}</h4>
                                <div className={`badge ${getDisciplineColor(cls.discipline)} badge-sm font-medium`}>
                                  {cls.discipline}
                                </div>
                                <div className={`badge ${status.color} badge-sm font-medium`}>
                                  {t(`classes.status.${status.labelKey}`)}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-base-content/70">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-4 h-4 text-blue-400" />
                                  <span className="font-medium">{cls.time}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-4 h-4 text-green-400" />
                                  <span className="truncate">{cls.location}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <User className="w-4 h-4 text-purple-400" />
                                  <span className="truncate">{cls.instructor}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Users className="w-4 h-4 text-yellow-400" />
                                  <span className="font-medium">{cls.enrolled_count || 0}/{cls.max_students}</span>
                                </div>
                              </div>

                              {cls.description && (
                                <p className="text-xs text-base-content/60 mt-3 line-clamp-2">{cls.description}</p>
                              )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                              <button 
                                className="btn btn-success btn-sm gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 border-none shadow-md hover:shadow-lg transition-all"
                                onClick={() => {
                                  setSelectedClass(cls);
                                  setShowEnrollModal(true);
                                }}
                                title="Gestionar estudiantes"
                              >
                                <UserPlus className="w-4 h-4" />
                              </button>
                              <button 
                                className="btn btn-primary btn-sm gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 border-none shadow-md hover:shadow-lg transition-all"
                                onClick={() => navigate(`/attendance/${cls.id}`)}
                              >
                                <Users className="w-4 h-4" />
                                <span>{t('classes.actions.attendance')}</span>
                              </button>
                              <button 
                                className="btn btn-ghost btn-sm gap-2 border border-gray-600 hover:border-gray-500 hover:bg-gray-700/50 transition-all"
                                title={t('classes.actions.edit')}
                              >
                                <Edit className="w-4 h-4" />
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

            {Object.keys(groupedByDay).length === 0 && (
              <div className="text-center py-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700/50">
                <div className="max-w-md mx-auto px-4">
                  <div className="p-4 bg-red-500/10 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Calendar className="w-10 h-10 text-red-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{t('classes.empty.noClassesScheduled')}</h3>
                  <p className="text-base-content/60 mb-6">Start building your martial arts schedule</p>
                  <button 
                    className="btn btn-primary gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 border-none shadow-lg"
                    onClick={() => setShowAddModal(true)}
                  >
                    <Plus className="w-5 h-5" />
                    {t('classes.actions.scheduleFirstClass')}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* List View - Modern Grid Cards Layout */
          <div className="grid grid-cols-1 gap-4">
            {filteredClasses.map((cls) => {
              const status = getClassStatus(cls.date, cls.time);
              return (
                <div 
                  key={cls.id} 
                  className="card bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-750 hover:to-gray-850 transition-all border border-gray-700/50 hover:border-red-500/30 shadow-lg hover:shadow-red-500/10"
                >
                  <div className="card-body p-5">
                    {/* Header Row - Class Name & Status */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-white mb-2">{cls.name}</h3>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className={`badge ${getDisciplineColor(cls.discipline)} badge-md font-semibold`}>
                            {cls.discipline}
                          </div>
                          <div className={`badge ${status.color} badge-md`}>
                            {t(`classes.status.${status.labelKey}`)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                        <button 
                          className="btn btn-success btn-sm gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 border-none"
                          onClick={() => {
                            setSelectedClass(cls);
                            setShowEnrollModal(true);
                          }}
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Estudiantes</span>
                        </button>
                        <button 
                          className="btn btn-primary btn-sm gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 border-none"
                          onClick={() => navigate(`/attendance/${cls.id}`)}
                        >
                          <Users className="w-4 h-4" />
                          <span>{t('classes.actions.attendance')}</span>
                        </button>
                        <button className="btn btn-ghost btn-sm gap-2 border border-gray-600 hover:border-gray-500">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Info Grid - Responsive 2x2 Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Date & Time */}
                      <div className="flex items-center gap-2.5 p-3 bg-gray-800/60 rounded-lg border border-gray-700/50">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10">
                          <Calendar className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] text-gray-400 uppercase font-medium tracking-wide">Fecha</div>
                          <div className="text-sm font-semibold text-white truncate">
                            {new Date(cls.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      </div>
                      
                      {/* Time */}
                      <div className="flex items-center gap-2.5 p-3 bg-gray-800/60 rounded-lg border border-gray-700/50">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/10">
                          <Clock className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] text-gray-400 uppercase font-medium tracking-wide">Hora</div>
                          <div className="text-sm font-semibold text-white">{cls.time}</div>
                        </div>
                      </div>
                      
                      {/* Location */}
                      <div className="flex items-center gap-2.5 p-3 bg-gray-800/60 rounded-lg border border-gray-700/50">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500/10">
                          <MapPin className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] text-gray-400 uppercase font-medium tracking-wide">Ubicación</div>
                          <div className="text-sm font-semibold text-white truncate">{cls.location}</div>
                        </div>
                      </div>
                      
                      {/* Students */}
                      <div className="flex items-center gap-2.5 p-3 bg-gray-800/60 rounded-lg border border-gray-700/50">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-500/10">
                          <Users className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] text-gray-400 uppercase font-medium tracking-wide">Estudiantes</div>
                          <div className="text-sm font-semibold text-white">
                            {cls.enrolled_count || 0}/{cls.max_students}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Instructor */}
                    <div className="mt-4 pt-4 border-t border-gray-700/50">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400">Instructor:</span>
                        <span className="font-semibold text-white">{cls.instructor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Empty State for List View */}
            {filteredClasses.length === 0 && (
              <div className="text-center py-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700/50">
                <div className="max-w-md mx-auto px-4">
                  <div className="p-4 bg-red-500/10 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Calendar className="w-10 h-10 text-red-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No se encontraron clases</h3>
                  <p className="text-base-content/60 mb-6">Intenta cambiar los filtros</p>
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
          classId={selectedClass.id}
          className={selectedClass.name}
          maxStudents={selectedClass.max_students}
          currentEnrollment={selectedClass.enrolled_count || 0}
        />
      )}
    </div>
  );
}
