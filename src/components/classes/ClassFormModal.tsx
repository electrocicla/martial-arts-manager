import { useState } from 'react';
import { Plus, AlertCircle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useClassMetadata } from '../../hooks/useClassMetadata';
import type { ClassFormData, Discipline, Class } from '../../types/index';

interface ClassFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (classData: ClassFormData) => Promise<Class | null>;
}

interface NewClassState {
  name: string;
  discipline: string;
  date: string;
  time: string;
  location: string;
  instructor: string;
  max_students: number;
  description: string;
  is_recurring: boolean;
  recurrence_pattern: {
    frequency: string;
    days: number[];
    endDate: string;
  };
}

export default function ClassFormModal({ isOpen, onClose, onSubmit }: ClassFormModalProps) {
  const { t } = useTranslation();
  const { disciplines, locations, instructors } = useClassMetadata();
  
  const [newClass, setNewClass] = useState<NewClassState>({
    name: '',
    discipline: disciplines[0] || 'Brazilian Jiu-Jitsu',
    date: new Date().toISOString().split('T')[0],
    time: '18:00',
    location: locations[0] || 'Main Dojo',
    instructor: instructors[0] || 'Sensei Yamamoto',
    max_students: 20,
    description: '',
    is_recurring: false,
    recurrence_pattern: {
      frequency: 'weekly',
      days: [1, 3, 5],
      endDate: '',
    },
  });

  const handleSubmit = async () => {
    if (!newClass.name || !newClass.date || !newClass.time) {
      alert(t('classForm.requiredField'));
      return;
    }

    const classData: ClassFormData = {
      name: newClass.name,
      discipline: newClass.discipline as Discipline,
      date: newClass.date,
      time: newClass.time,
      location: newClass.location,
      instructor: newClass.instructor,
      maxStudents: newClass.max_students,
      description: newClass.description || undefined,
      isRecurring: newClass.is_recurring,
      recurrencePattern: newClass.is_recurring ? {
        frequency: newClass.recurrence_pattern.frequency as 'daily' | 'weekly' | 'monthly',
        days: newClass.recurrence_pattern.days,
        endDate: newClass.recurrence_pattern.endDate || undefined,
      } : undefined,
    };

    const result = await onSubmit(classData);
    if (result) {
      onClose();
      // Reset form
      setNewClass({
        name: '',
        discipline: disciplines[0] || 'Brazilian Jiu-Jitsu',
        date: new Date().toISOString().split('T')[0],
        time: '18:00',
        location: locations[0] || 'Main Dojo',
        instructor: instructors[0] || 'Sensei Yamamoto',
        max_students: 20,
        description: '',
        is_recurring: false,
        recurrence_pattern: {
          frequency: 'weekly',
          days: [1, 3, 5],
          endDate: '',
        },
      });
    } else {
      alert(t('classForm.addFailed'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      {/* Modal Container */}
      <div className="relative bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto border border-gray-700/50">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200 z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-400 hover:text-white" />
        </button>

        <div className="p-6">
          <h3 className="font-bold text-xl mb-6 text-white">{t('classForm.title')}</h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-300 font-medium">{t('classForm.className')} *</span>
              </label>
              <input
                type="text"
                className="input input-bordered bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                placeholder={t('classForm.classNamePlaceholder')}
                value={newClass.name}
                onChange={(e) => setNewClass({...newClass, name: e.target.value})}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-300 font-medium">{t('classForm.discipline')} *</span>
              </label>
              <select
                className="select select-bordered bg-gray-800 border-gray-700 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500"
                value={newClass.discipline}
                onChange={(e) => setNewClass({...newClass, discipline: e.target.value})}
                disabled={disciplines.length === 0}
              >
                {disciplines.length > 0 ? (
                  disciplines.map(disc => (
                    <option key={disc} value={disc}>{disc}</option>
                  ))
                ) : (
                  <option value="">Loading...</option>
                )}
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-300 font-medium">{t('classForm.date')} *</span>
              </label>
              <input
                type="date"
                className="input input-bordered bg-gray-800 border-gray-700 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500"
                value={newClass.date}
                onChange={(e) => setNewClass({...newClass, date: e.target.value})}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-300 font-medium">{t('classForm.time')} *</span>
              </label>
              <input
                type="time"
                className="input input-bordered bg-gray-800 border-gray-700 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500"
                value={newClass.time}
                onChange={(e) => setNewClass({...newClass, time: e.target.value})}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-300 font-medium">{t('classForm.location')}</span>
              </label>
              <select
                className="select select-bordered bg-gray-800 border-gray-700 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500"
                value={newClass.location}
                onChange={(e) => setNewClass({...newClass, location: e.target.value})}
                disabled={locations.length === 0}
              >
                {locations.length > 0 ? (
                  locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))
                ) : (
                  <option value="">Loading...</option>
                )}
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-300 font-medium">{t('classForm.instructor')}</span>
              </label>
              <select
                className="select select-bordered bg-gray-800 border-gray-700 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500"
                value={newClass.instructor}
                onChange={(e) => setNewClass({...newClass, instructor: e.target.value})}
                disabled={instructors.length === 0}
              >
                {instructors.length > 0 ? (
                  instructors.map(inst => (
                    <option key={inst} value={inst}>{inst}</option>
                  ))
                ) : (
                  <option value="">Loading...</option>
                )}
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-300 font-medium">{t('classForm.maxStudents')}</span>
              </label>
              <input
                type="number"
                className="input input-bordered bg-gray-800 border-gray-700 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500"
                value={newClass.max_students}
                onChange={(e) => setNewClass({...newClass, max_students: parseInt(e.target.value)})}
              />
            </div>

            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="toggle toggle-error"
                  checked={newClass.is_recurring}
                  onChange={(e) => setNewClass({...newClass, is_recurring: e.target.checked})}
                />
                <span className="label-text text-gray-300 font-medium">{t('classForm.recurringClass')}</span>
              </label>
            </div>
          </div>

          {newClass.is_recurring && (
            <div className="alert bg-blue-900/30 border border-blue-700/50 text-blue-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{t('classForm.recurringSetupMessage')}</span>
            </div>
          )}

          <div className="form-control">
            <label className="label">
              <span className="label-text text-gray-300 font-medium">{t('classForm.description')}</span>
            </label>
            <textarea
              className="textarea textarea-bordered bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 h-24 resize-none"
              placeholder={t('classForm.descriptionPlaceholder')}
              value={newClass.description}
              onChange={(e) => setNewClass({...newClass, description: e.target.value})}
            ></textarea>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
            <button 
              className="btn bg-gray-800 hover:bg-gray-700 text-white border-gray-700 rounded-lg transition-all duration-200" 
              onClick={onClose}
            >
              {t('classForm.cancel')}
            </button>
            <button 
              className="btn bg-red-600 hover:bg-red-700 text-white border-none rounded-lg shadow-md hover:shadow-lg transition-all duration-200 gap-2" 
              onClick={handleSubmit}
            >
              <Plus className="w-5 h-5" />
              {t('classForm.scheduleClass')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}