import { useState, useEffect } from 'react';
import { Plus, AlertCircle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useClassMetadata } from '../../hooks/useClassMetadata';
import type { ClassFormData, Discipline, Class } from '../../types/index';

interface ClassFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (classData: ClassFormData) => Promise<Class | null>;
  // initialData may come from DB and can include strings; use unknown-safe mapping
  initialData?: (Partial<Record<keyof ClassFormData, unknown>> & { id?: string }) | null;
  onUpdate?: (id: string, data: Partial<ClassFormData>) => Promise<Class | null>;
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

const DAYS_OF_WEEK = [
  { id: 1, label: 'Lun', fullLabel: 'Lunes' },
  { id: 2, label: 'Mar', fullLabel: 'Martes' },
  { id: 3, label: 'Mié', fullLabel: 'Miércoles' },
  { id: 4, label: 'Jue', fullLabel: 'Jueves' },
  { id: 5, label: 'Vie', fullLabel: 'Viernes' },
  { id: 6, label: 'Sáb', fullLabel: 'Sábado' },
  { id: 0, label: 'Dom', fullLabel: 'Domingo' },
];

export default function ClassFormModal({ isOpen, onClose, onSubmit, initialData, onUpdate }: ClassFormModalProps) {
  const { t } = useTranslation();
  const { disciplines, locations, instructors } = useClassMetadata();
  
  const [newClass, setNewClass] = useState<NewClassState>({
    name: '',
    discipline: disciplines[0] || 'Brazilian Jiu-Jitsu',
    date: new Date().toISOString().split('T')[0],
    time: '18:00',
    location: locations[0] || 'Main Dojo',
    instructor: instructors[0] || '',
    max_students: 20,
    description: '',
    is_recurring: false,
    recurrence_pattern: {
      frequency: 'weekly',
      days: [1, 3, 5],
      endDate: '',
    },
  });

  const [customLocation, setCustomLocation] = useState('');
  const [customInstructor, setCustomInstructor] = useState('');
  const [showCustomLocation, setShowCustomLocation] = useState(false);
  const [showCustomInstructor, setShowCustomInstructor] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
type RecurrencePattern = { frequency?: 'daily' | 'weekly' | 'monthly'; days?: number[]; endDate?: string };

  // prefill when initialData is provided (edit mode)
  useEffect(() => {
    if (!isOpen || !initialData) return;
    setNewClass(prev => {
      // Safely extract recurrence pattern from initialData and ensure days is number[]
      const incoming = (initialData.recurrencePattern && typeof initialData.recurrencePattern === 'object') ? (initialData.recurrencePattern as RecurrencePattern) : undefined;
      const days: number[] = Array.isArray(incoming?.days) ? incoming!.days as number[] : prev.recurrence_pattern.days;

      return {
        ...prev,
        name: typeof initialData.name === 'string' ? initialData.name : prev.name,
        discipline: typeof initialData.discipline === 'string' ? (initialData.discipline as string) : prev.discipline,
        date: typeof initialData.date === 'string' ? initialData.date : prev.date,
        time: typeof initialData.time === 'string' ? initialData.time : prev.time,
        location: typeof initialData.location === 'string' ? initialData.location : prev.location,
        instructor: typeof initialData.instructor === 'string' ? initialData.instructor : prev.instructor,
        max_students: typeof initialData.maxStudents === 'number' ? initialData.maxStudents : prev.max_students,
        description: typeof initialData.description === 'string' ? initialData.description : prev.description,
        is_recurring: typeof initialData.isRecurring === 'boolean' ? initialData.isRecurring : prev.is_recurring,
        recurrence_pattern: incoming ? {
          frequency: incoming.frequency || prev.recurrence_pattern.frequency,
          days,
          endDate: incoming.endDate || prev.recurrence_pattern.endDate,
        } : prev.recurrence_pattern,
      };
    });
  }, [isOpen, initialData]);

  // When metadata loads, ensure form has sensible defaults if not in edit mode
  useEffect(() => {
    if (!isOpen || initialData) return;
    setNewClass(prev => ({
      ...prev,
      discipline: prev.discipline || (disciplines[0] || 'Brazilian Jiu-Jitsu'),
      location: prev.location || (locations[0] || 'Main Dojo'),
      instructor: prev.instructor || (instructors[0] || ''),
    }));
  }, [isOpen, disciplines, locations, instructors, initialData]);

  const toggleDay = (dayId: number) => {
    setNewClass(prev => {
      const currentDays = prev.recurrence_pattern.days;
      const newDays = currentDays.includes(dayId)
        ? currentDays.filter(d => d !== dayId)
        : [...currentDays, dayId].sort((a, b) => a - b);
      
      return {
        ...prev,
        recurrence_pattern: {
          ...prev.recurrence_pattern,
          days: newDays,
        },
      };
    });
  };

  const handleSubmit = async () => {
    if (!newClass.name || !newClass.date || !newClass.time) {
      alert(t('classForm.requiredField'));
      return;
    }

    const finalLocation = showCustomLocation && customLocation 
      ? customLocation 
      : newClass.location;
    
    const finalInstructor = showCustomInstructor && customInstructor 
      ? customInstructor 
      : newClass.instructor;

    const classData: ClassFormData = {
      name: newClass.name,
      discipline: newClass.discipline as Discipline,
      date: newClass.date,
      time: newClass.time,
      location: finalLocation,
      instructor: finalInstructor,
      maxStudents: newClass.max_students,
      description: newClass.description || undefined,
      isRecurring: newClass.is_recurring,
      recurrencePattern: newClass.is_recurring ? {
        frequency: newClass.recurrence_pattern.frequency as 'daily' | 'weekly' | 'monthly',
        days: newClass.recurrence_pattern.days,
        endDate: newClass.recurrence_pattern.endDate || undefined,
      } : undefined,
    };

    if (isSubmitting) return; // guard double submit
    setIsSubmitting(true);
    try {
      let result: Class | null = null;
      if (initialData && initialData.id && onUpdate) {
        result = await onUpdate(initialData.id, classData);
      } else {
        result = await onSubmit(classData);
      }

      if (result) {
        onClose();
        // Reset form
        setNewClass({
          name: '',
          discipline: disciplines[0] || 'Brazilian Jiu-Jitsu',
          date: new Date().toISOString().split('T')[0],
          time: '18:00',
          location: locations[0] || 'Main Dojo',
          instructor: instructors[0] || '',
          max_students: 20,
          description: '',
          is_recurring: false,
          recurrence_pattern: {
            frequency: 'weekly',
            days: [1, 3, 5],
            endDate: '',
          },
        });
        setCustomLocation('');
        setCustomInstructor('');
        setShowCustomLocation(false);
        setShowCustomInstructor(false);
      } else {
        alert(t('classForm.addFailed'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-inter">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ease-out"
        onClick={onClose}
      ></div>
      
      {/* Modal Container */}
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-gray-700/50 animate-scale-in transform transition-all duration-300 ease-out">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between transition-all duration-300 hover:from-red-700 hover:to-red-800">
          <h3 className="font-bold text-2xl text-white flex items-center gap-3 tracking-tight">
            <Plus className="w-7 h-7 transition-transform duration-300 hover:rotate-90" />
            {t('classForm.title')}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-all duration-300 ease-out transform hover:scale-110 hover:rotate-90"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Form Content - Scrollable */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] scrollbar-thin">
          <div className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4 animate-fade-in">
              <h4 className="text-sm font-semibold text-red-400 uppercase tracking-wider">
                Información Básica
              </h4>
              
              {/* Class Name - Full Width */}
              <div className="form-control transform transition-all duration-300 hover:translate-x-1">
                <label className="label">
                  <span className="label-text text-gray-300 font-medium tracking-wide">
                    {t('classForm.className')} *
                  </span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/50 transition-all duration-300 ease-out focus:scale-[1.01] focus:shadow-lg focus:shadow-red-500/20"
                  placeholder={t('classForm.classNamePlaceholder')}
                  value={newClass.name}
                  onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                />
              </div>

              {/* Discipline - Full Width */}
              <div className="form-control transform transition-all duration-300 hover:translate-x-1">
                <label className="label">
                  <span className="label-text text-gray-300 font-medium tracking-wide">
                    {t('classForm.discipline')} *
                  </span>
                </label>
                <select
                  className="select select-bordered w-full bg-gray-800 border-gray-700 text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/50 transition-all duration-300 ease-out focus:scale-[1.01] focus:shadow-lg focus:shadow-red-500/20 cursor-pointer"
                  value={newClass.discipline}
                  onChange={(e) => setNewClass({...newClass, discipline: e.target.value})}
                  disabled={disciplines.length === 0}
                >
                  {disciplines.length > 0 ? (
                    disciplines.map(disc => (
                      <option key={disc} value={disc}>{disc}</option>
                    ))
                  ) : (
                    <option value="">Cargando disciplinas...</option>
                  )}
                </select>
              </div>
            </div>

            {/* Schedule Section */}
            <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <h4 className="text-sm font-semibold text-red-400 uppercase tracking-wider">
                Horario
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control transform transition-all duration-300 hover:translate-x-1">
                  <label className="label">
                    <span className="label-text text-gray-300 font-medium tracking-wide">
                      {t('classForm.date')} *
                    </span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered bg-gray-800 border-gray-700 text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/50 transition-all duration-300 ease-out focus:scale-[1.01] focus:shadow-lg focus:shadow-red-500/20 cursor-pointer"
                    value={newClass.date}
                    onChange={(e) => setNewClass({...newClass, date: e.target.value})}
                  />
                </div>

                <div className="form-control transform transition-all duration-300 hover:translate-x-1">
                  <label className="label">
                    <span className="label-text text-gray-300 font-medium tracking-wide">
                      {t('classForm.time')} *
                    </span>
                  </label>
                  <input
                    type="time"
                    className="input input-bordered bg-gray-800 border-gray-700 text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/50 transition-all duration-300 ease-out focus:scale-[1.01] focus:shadow-lg focus:shadow-red-500/20 cursor-pointer"
                    value={newClass.time}
                    onChange={(e) => setNewClass({...newClass, time: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Location & Instructor Section */}
            <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <h4 className="text-sm font-semibold text-red-400 uppercase tracking-wider">
                Ubicación e Instructor
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Location Input/Select Combo */}
                <div className="form-control transform transition-all duration-300 hover:translate-x-1">
                  <label className="label">
                    <span className="label-text text-gray-300 font-medium tracking-wide">
                      {t('classForm.location')}
                    </span>
                  </label>
                  <div className="space-y-2">
                    {!showCustomLocation ? (
                      <div className="flex gap-2">
                        <select
                          className="select select-bordered flex-1 bg-gray-800 border-gray-700 text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/50 transition-all duration-300 ease-out focus:scale-[1.01] focus:shadow-lg focus:shadow-red-500/20 cursor-pointer"
                          value={newClass.location}
                          onChange={(e) => setNewClass({...newClass, location: e.target.value})}
                          disabled={locations.length === 0}
                        >
                          {locations.length > 0 ? (
                            locations.map(loc => (
                              <option key={loc} value={loc}>{loc}</option>
                            ))
                          ) : (
                            <option value="">Cargando ubicaciones...</option>
                          )}
                        </select>
                        <button
                          type="button"
                          onClick={() => setShowCustomLocation(true)}
                          className="btn btn-sm bg-gray-700 hover:bg-gray-600 border-gray-600 text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="input input-bordered flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/50 transition-all duration-300 ease-out focus:scale-[1.01] focus:shadow-lg focus:shadow-red-500/20"
                          placeholder="Nueva ubicación..."
                          value={customLocation}
                          onChange={(e) => setCustomLocation(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomLocation(false);
                            setCustomLocation('');
                          }}
                          className="btn btn-sm bg-gray-700 hover:bg-gray-600 border-gray-600 text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Instructor Input/Select Combo */}
                <div className="form-control transform transition-all duration-300 hover:translate-x-1">
                  <label className="label">
                    <span className="label-text text-gray-300 font-medium tracking-wide">
                      {t('classForm.instructor')}
                    </span>
                  </label>
                  <div className="space-y-2">
                    {!showCustomInstructor ? (
                      <div className="flex gap-2">
                        <select
                          className="select select-bordered flex-1 bg-gray-800 border-gray-700 text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/50 transition-all duration-300 ease-out focus:scale-[1.01] focus:shadow-lg focus:shadow-red-500/20 cursor-pointer"
                          value={newClass.instructor}
                          onChange={(e) => setNewClass({...newClass, instructor: e.target.value})}
                          disabled={instructors.length === 0}
                        >
                          {instructors.length > 0 ? (
                            instructors.map(inst => (
                              <option key={inst} value={inst}>{inst}</option>
                            ))
                          ) : (
                            <option value="">Cargando instructores...</option>
                          )}
                        </select>
                        <button
                          type="button"
                          onClick={() => setShowCustomInstructor(true)}
                          className="btn btn-sm bg-gray-700 hover:bg-gray-600 border-gray-600 text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="input input-bordered flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/50 transition-all duration-300 ease-out focus:scale-[1.01] focus:shadow-lg focus:shadow-red-500/20"
                          placeholder="Nuevo instructor..."
                          value={customInstructor}
                          onChange={(e) => setCustomInstructor(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomInstructor(false);
                            setCustomInstructor('');
                          }}
                          className="btn btn-sm bg-gray-700 hover:bg-gray-600 border-gray-600 text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Capacity & Recurrence Section */}
            <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <h4 className="text-sm font-semibold text-red-400 uppercase tracking-wider">
                Capacidad y Configuración
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control transform transition-all duration-300 hover:translate-x-1">
                  <label className="label">
                    <span className="label-text text-gray-300 font-medium tracking-wide">
                      {t('classForm.maxStudents')}
                    </span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="input input-bordered bg-gray-800 border-gray-700 text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/50 transition-all duration-300 ease-out focus:scale-[1.01] focus:shadow-lg focus:shadow-red-500/20"
                    value={newClass.max_students}
                    onChange={(e) => setNewClass({...newClass, max_students: parseInt(e.target.value) || 1})}
                  />
                </div>

                <div className="form-control flex items-end pb-2">
                  <label className="label cursor-pointer justify-start gap-3 p-3 hover:bg-gray-800/50 rounded-lg transition-all duration-300 transform hover:scale-[1.02]">
                    <input
                      type="checkbox"
                      className="toggle toggle-error transition-all duration-300"
                      checked={newClass.is_recurring}
                      onChange={(e) => setNewClass({...newClass, is_recurring: e.target.checked})}
                    />
                    <span className="label-text text-gray-300 font-medium tracking-wide">
                      {t('classForm.recurringClass')}
                    </span>
                  </label>
                </div>
              </div>

              {newClass.is_recurring && (
                <div className="space-y-4 animate-slide-down">
                  <div className="alert bg-blue-900/30 border border-blue-700/50 text-blue-300 flex items-start gap-3 transition-all duration-300 hover:bg-blue-900/40 hover:border-blue-600/50">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{t('classForm.recurringSetupMessage')}</span>
                  </div>

                  {/* Day Selector */}
                  <div className="space-y-3">
                    <label className="label">
                      <span className="label-text text-gray-300 font-medium tracking-wide">
                        Días de la Semana
                      </span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => toggleDay(day.id)}
                          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 transform hover:scale-110 hover:shadow-lg ${
                            newClass.recurrence_pattern.days.includes(day.id)
                              ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-500/50 hover:from-red-700 hover:to-red-800'
                              : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-gray-300 hover:border-gray-600'
                          }`}
                          title={day.fullLabel}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* End Date */}
                  <div className="form-control transform transition-all duration-300 hover:translate-x-1">
                    <label className="label">
                      <span className="label-text text-gray-300 font-medium tracking-wide">
                        Fecha de Finalización (Opcional)
                      </span>
                    </label>
                    <input
                      type="date"
                      className="input input-bordered bg-gray-800 border-gray-700 text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/50 transition-all duration-300 ease-out focus:scale-[1.01] focus:shadow-lg focus:shadow-red-500/20 cursor-pointer"
                      value={newClass.recurrence_pattern.endDate}
                      onChange={(e) => setNewClass({
                        ...newClass,
                        recurrence_pattern: {
                          ...newClass.recurrence_pattern,
                          endDate: e.target.value,
                        },
                      })}
                      min={newClass.date}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Description Section */}
            <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <h4 className="text-sm font-semibold text-red-400 uppercase tracking-wider">
                Descripción
              </h4>
              
              <div className="form-control transform transition-all duration-300 hover:translate-x-1">
                <textarea
                  className="textarea textarea-bordered bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/50 transition-all duration-300 ease-out focus:scale-[1.01] focus:shadow-lg focus:shadow-red-500/20 resize-none min-h-[120px] md:min-h-[150px] lg:min-h-[180px]"
                  placeholder={t('classForm.descriptionPlaceholder')}
                  value={newClass.description}
                  onChange={(e) => setNewClass({...newClass, description: e.target.value})}
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-900 px-6 py-4 border-t border-gray-700 flex justify-end gap-3">
          <button 
            className="btn bg-gray-800 hover:bg-gray-700 text-white border-gray-700 rounded-lg transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-lg px-6" 
            onClick={onClose}
          >
            {t('classForm.cancel')}
          </button>
          <button 
            className={`btn bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-none rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ease-out transform hover:scale-105 gap-2 px-6 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            <Plus className="w-5 h-5 transition-transform duration-300 hover:rotate-90" />
            {isSubmitting ? (initialData ? t('classForm.updating') : t('classForm.scheduling')) : (initialData ? t('classForm.updateClass') : t('classForm.scheduleClass'))}
          </button>
        </div>
      </div>
    </div>
  );
}
