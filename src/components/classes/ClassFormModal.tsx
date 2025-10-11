import { useState } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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

const disciplines = ['Brazilian Jiu-Jitsu', 'Kickboxing', 'Muay Thai', 'MMA', 'Karate'];
const locations = ['Main Dojo', 'Training Hall', 'Outdoor Area', 'Gym Floor'];
const instructors = ['Sensei Yamamoto', 'Coach Johnson', 'Master Chen', 'Instructor Davis'];

export default function ClassFormModal({ isOpen, onClose, onSubmit }: ClassFormModalProps) {
  const { t } = useTranslation();
  const [newClass, setNewClass] = useState<NewClassState>({
    name: '',
    discipline: 'Brazilian Jiu-Jitsu',
    date: new Date().toISOString().split('T')[0],
    time: '18:00',
    location: 'Main Dojo',
    instructor: 'Sensei Yamamoto',
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
        discipline: 'Brazilian Jiu-Jitsu',
        date: new Date().toISOString().split('T')[0],
        time: '18:00',
        location: 'Main Dojo',
        instructor: 'Sensei Yamamoto',
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
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-lg mb-4">{t('classForm.title')}</h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">{t('classForm.className')} *</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                placeholder={t('classForm.classNamePlaceholder')}
                value={newClass.name}
                onChange={(e) => setNewClass({...newClass, name: e.target.value})}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">{t('classForm.discipline')} *</span>
              </label>
              <select
                className="select select-bordered"
                value={newClass.discipline}
                onChange={(e) => setNewClass({...newClass, discipline: e.target.value})}
              >
                {disciplines.map(disc => (
                  <option key={disc} value={disc}>{disc}</option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">{t('classForm.date')} *</span>
              </label>
              <input
                type="date"
                className="input input-bordered"
                value={newClass.date}
                onChange={(e) => setNewClass({...newClass, date: e.target.value})}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">{t('classForm.time')} *</span>
              </label>
              <input
                type="time"
                className="input input-bordered"
                value={newClass.time}
                onChange={(e) => setNewClass({...newClass, time: e.target.value})}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">{t('classForm.location')}</span>
              </label>
              <select
                className="select select-bordered"
                value={newClass.location}
                onChange={(e) => setNewClass({...newClass, location: e.target.value})}
              >
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">{t('classForm.instructor')}</span>
              </label>
              <select
                className="select select-bordered"
                value={newClass.instructor}
                onChange={(e) => setNewClass({...newClass, instructor: e.target.value})}
              >
                {instructors.map(inst => (
                  <option key={inst} value={inst}>{inst}</option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">{t('classForm.maxStudents')}</span>
              </label>
              <input
                type="number"
                className="input input-bordered"
                value={newClass.max_students}
                onChange={(e) => setNewClass({...newClass, max_students: parseInt(e.target.value)})}
              />
            </div>

            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">{t('classForm.recurringClass')}</span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={newClass.is_recurring}
                  onChange={(e) => setNewClass({...newClass, is_recurring: e.target.checked})}
                />
              </label>
            </div>
          </div>

          {newClass.is_recurring && (
            <div className="alert alert-info">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{t('classForm.recurringSetupMessage')}</span>
            </div>
          )}

          <div className="form-control">
            <label className="label">
              <span className="label-text">{t('classForm.description')}</span>
            </label>
            <textarea
              className="textarea textarea-bordered h-24"
              placeholder={t('classForm.descriptionPlaceholder')}
              value={newClass.description}
              onChange={(e) => setNewClass({...newClass, description: e.target.value})}
            ></textarea>
          </div>
        </div>

        <div className="modal-action">
          <button className="btn btn-ghost rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200" onClick={onClose}>
            {t('classForm.cancel')}
          </button>
          <button className="btn btn-primary rounded-lg shadow-md hover:shadow-lg transition-all duration-200" onClick={handleSubmit}>
            <Plus className="w-4 h-4" />
            {t('classForm.scheduleClass')}
          </button>
        </div>
      </div>
    </div>
  );
}