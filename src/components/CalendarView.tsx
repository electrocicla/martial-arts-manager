import { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useClasses } from '../hooks/useClasses';
import type { Class } from '../types';
import ClassDetailsModal from './classes/ClassDetailsModal';
import ClassFormModal from './classes/ClassFormModal';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

export default function CalendarView() {
  const { t } = useTranslation();
  const { classes, updateClass, refresh, deleteClass } = useClasses();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  // Role-based visibility: admins see all, instructors see classes they instruct, students see classes they're enrolled in (client-side best-effort)
  const visibleClasses = classes.filter((c: Class) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'instructor') return (c.instructor === user.name || c.instructor === user.id);
    if (user.role === 'student') {
      // prefer explicit enrolled ids if present, otherwise fall back to enrolled_count > 0 (best-effort)
      const enrolledIds = (c as any).enrolled_student_ids as string[] | undefined;
      if (Array.isArray(enrolledIds)) return enrolledIds.includes(user.id);
      return (c as any).enrolled_count > 0 ? true : false;
    }
    return false;
  });

  // Only show session rows (child occurrences). Parent course rows have parent_course_id === null and is_recurring === 1
  const classesOnDate = selectedDate ? visibleClasses
    .filter((c: Class) => c.date === selectedDate.toISOString().split('T')[0])
    .filter((c: Class) => (c as any).parent_course_id !== null || c.is_recurring === 0)
    .sort((a: Class, b: Class) => a.time.localeCompare(b.time))
    : [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-50">{t('nav.calendar')}</h2>
      
      {/* Calendar Container with Dark Theme */}
      <div className="bg-gray-800 rounded-xl shadow-2xl p-6 mb-6 border border-gray-700">
        <Calendar 
          onChange={(value) => setSelectedDate(value as Date)} 
          value={selectedDate} 
          selectRange={false} 
          className="custom-calendar w-full"
        />
      </div>

      {/* Selected Date Classes */}
      {selectedDate && (
        <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700 animate-slide-up">
          <h3 className="text-xl font-bold mb-4 text-gray-50">
            {t('classesOnDate', 'Classes on {{date}}').replace('{{date}}', selectedDate.toLocaleDateString(undefined, {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            }))}
          </h3>
          {classesOnDate.length > 0 ? (
            <ul className="space-y-3">
              {classesOnDate.map((c: Class) => (
                <li 
                  key={c.id} 
                  className="border border-gray-700 p-4 rounded-lg bg-gray-900 hover:bg-gray-750 hover:border-red-600 transition-all duration-200 cursor-pointer"
                  onClick={() => { setSelectedClass(c); setShowDetails(true); }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-lg text-gray-100">{c.name} - <span className="text-red-500">{c.discipline}</span></div>
                      <div className="text-sm text-gray-400 mt-1">🕐 {c.time} • 📍 {c.location} • 👤 {c.instructor}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={!!selectedIds[c.id]}
                        onChange={(e) => { e.stopPropagation(); setSelectedIds(prev => ({ ...prev, [c.id]: !!e.target.checked })); }}
                      />
                      {(user?.role === 'admin' || user?.role === 'instructor') && (
                        <button
                          className="btn btn-ghost btn-sm text-sm"
                          title="Edit"
                          onClick={(e) => { e.stopPropagation(); setEditingClass(c); setShowEditModal(true); }}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-center py-4">No classes scheduled for this day</p>
          )}

          {/* Bulk Actions Toolbar */}
          {Object.values(selectedIds).some(Boolean) && (
            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="text-sm text-gray-300">{Object.values(selectedIds).filter(Boolean).length} selected</div>
              <div className="flex items-center gap-2">
                {(user?.role === 'admin' || user?.role === 'instructor') && (
                  <>
                    <button className="btn btn-sm btn-primary" onClick={async () => {
                      const ids = Object.keys(selectedIds).filter(id => selectedIds[id]);
                      if (ids.length === 0) return;
                      const first = visibleClasses.find(v => v.id === ids[0]);
                      if (!first) return;
                      setEditingClass(first);
                      setShowEditModal(true);
                    }}>Bulk Edit</button>
                    <button className="btn btn-sm btn-ghost" onClick={async () => {
                      const ids = Object.keys(selectedIds).filter(id => selectedIds[id]);
                      for (const id of ids) {
                        await deleteClass(id);
                      }
                      setSelectedIds({});
                      await refresh();
                    }}>Delete Selected</button>
                  </>
                )}
                <button className="btn btn-sm btn-ghost" onClick={() => setSelectedIds({})}>Clear</button>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedClass && (
        <ClassDetailsModal isOpen={showDetails} onClose={() => { setShowDetails(false); setSelectedClass(null); }} cls={selectedClass} />
      )}

      {/* Edit modal for calendar sessions */}
      {editingClass && (
        <ClassFormModal
          isOpen={showEditModal}
          onClose={() => { setShowEditModal(false); setEditingClass(null); }}
          onSubmit={async () => null}
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
          onUpdate={async (id, data) => {
            // forward to hook update and refresh the calendar
            const updated = await updateClass(id, data);
            await refresh();
            return updated;
          }}
        />
      )}
    </div>
  );
}