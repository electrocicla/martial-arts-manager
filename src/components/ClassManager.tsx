import { useState } from 'react';
import React from 'react';
import { BookOpen, Plus, Calendar, Users, Copy, List, TrendingUp } from 'lucide-react';
import { useClasses } from '../hooks/useClasses';
import { useClassMetadata } from '../hooks/useClassMetadata';
import { useNavigate } from 'react-router-dom';
import { useClassFilters } from '../hooks/useClassFilters';
import { useClassStats } from '../hooks/useClassStats';
import { ClassFormModal, EnrollStudentsModal, ClassDetailsModal } from './classes';
import ClassScheduleView from './classes/ClassScheduleView';
import ClassListView from './classes/ClassListView';
import ConfirmModal from './ui/ConfirmModal';
import { useToast } from '../hooks/useToast';
import type { Class } from '../types';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/Button';

export default function ClassManager() {
  const { t } = useTranslation();
  const {
    classes,
    createClass,
    refresh,
    updateClass,
    deleteClass,
  } = useClasses();
  const { disciplines } = useClassMetadata();
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);
  const [deleteProcessing, setDeleteProcessing] = useState(false);
  const toast = useToast();
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
                <Button
                  variant="ghost"
                  size="sm"
                  title={t('classes.actions.duplicateWeek')}
                  leftIcon={<Copy className="w-4 h-4 sm:w-5 sm:h-5" />}
                >
                  <span className="hidden lg:inline">{t('classes.actions.duplicateWeek')}</span>
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowAddModal(true)}
                  leftIcon={<Plus className="w-4 h-4 sm:w-5 sm:h-5" />}
                >
                  <span className="hidden sm:inline">{t('classes.actions.addClass')}</span>
                  <span className="sm:hidden">Agregar</span>
                </Button>
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
          <ClassScheduleView
            groupedByDay={groupedByDay}
            onViewDetails={(cls) => { setSelectedClass(cls); setShowDetailsModal(true); }}
            onEnroll={(cls) => { setSelectedClass(cls); setShowEnrollModal(true); }}
            onAttendance={(cls) => navigate(`/attendance/${cls.id}`)}
            onEdit={(cls) => { setEditingClass(cls); setShowAddModal(true); }}
            onDelete={async (cls) => {
              const enrolled = cls.enrolled_count || 0;
              if (enrolled === 0) {
                const success = await deleteClass(cls.id);
                if (success) {
                  toast.success(t('classes.deleteSuccess') || 'Curso eliminado correctamente');
                  await refresh();
                } else {
                  toast.error(t('classes.deleteError') || 'Error al eliminar');
                }
                return;
              }
              setDeletingClassId(cls.id);
              setShowDeleteConfirm(true);
            }}
            onAddClass={() => setShowAddModal(true)}
          />
        ) : (
          <ClassListView
            classes={filteredClasses}
            onEnroll={(cls) => { setSelectedClass(cls); setShowEnrollModal(true); }}
            onAttendance={(cls) => navigate(`/attendance/${cls.id}`)}
            onEdit={(cls) => { setEditingClass(cls); setShowAddModal(true); }}
          />
        )}

      </div>

      <ClassFormModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setEditingClass(null); }}
        onSubmit={createClass}
        initialData={editingClass ? {
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
        } : null}
        onUpdate={async (id, data) => {
          const updated = await updateClass(id, data);
          await refresh();
          return updated;
        }}
      />
      
      {selectedClass && (
        <EnrollStudentsModal
          isOpen={showEnrollModal}
          onClose={() => {
            setShowEnrollModal(false);
            setSelectedClass(null);
          }}
          // API expects classId as string
          classId={selectedClass.id}
          className={selectedClass.name}
          maxStudents={selectedClass.max_students}
          onEnrollmentUpdated={async () => {
            // refresh class list so enrolled_count updates
            await refresh();
          }}
        />
      )}
      {/* Details Modal */}
      {selectedClass && (
        <ClassDetailsModal
          isOpen={showDetailsModal}
          onClose={() => { setShowDetailsModal(false); setSelectedClass(null); }}
          cls={selectedClass}
        />
      )}

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title={t('classes.deleteConfirmTitle') || 'Eliminar curso?'}
        message={t('classes.deleteConfirmMessage') || 'Esta acción eliminará el curso. ¿Deseas continuar?'}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        isProcessing={deleteProcessing}
        requireTyping={[ 'delete', 'borrar', 'DELETE', 'BORRAR' ]}
        onCancel={() => { setShowDeleteConfirm(false); setDeletingClassId(null); }}
        onConfirm={async () => {
          if (!deletingClassId) return;
          try {
            setDeleteProcessing(true);
            const success = await deleteClass(deletingClassId);
            if (success) {
              toast.success(t('classes.deleteSuccess') || 'Curso eliminado');
              await refresh();
              setShowDeleteConfirm(false);
              setDeletingClassId(null);
            } else {
              toast.error(t('classes.deleteError') || 'Error al eliminar');
            }
          } catch {
            toast.error(t('classes.deleteError') || 'Error al eliminar');
          } finally {
            setDeleteProcessing(false);
          }
        }}
      />
    </div>
  );
}
