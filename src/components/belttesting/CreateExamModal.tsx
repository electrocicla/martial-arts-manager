import { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, User, Award, Users, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { label } from '../../lib/i18nUtils';

interface BeltExam {
  id: string;
  belt_level: string;
  exam_date: string;
  exam_time: string;
  location: string;
  examiner_id: string;
  examiner_name?: string;
  discipline: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  max_candidates: number;
  assigned_count: number;
  passed_count: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface CreateExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (exam: Omit<BeltExam, 'id' | 'created_at' | 'updated_at' | 'assigned_count' | 'passed_count'>) => Promise<void>;
  editingExam?: BeltExam | null;
}

const BELT_LEVELS = [
  'White',
  'Yellow',
  'Orange',
  'Green',
  'Blue',
  'Purple',
  'Brown',
  'Red',
  'Black 1st Dan',
  'Black 2nd Dan',
  'Black 3rd Dan',
];

const DISCIPLINES = [
  'Karate',
  'Taekwondo',
  'Judo',
  'Jiu-Jitsu',
  'Muay Thai',
  'Boxing',
  'MMA',
];

export default function CreateExamModal({
  isOpen,
  onClose,
  onSubmit,
  editingExam,
}: CreateExamModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    belt_level: '',
    exam_date: '',
    exam_time: '',
    location: '',
    examiner_id: '',
    examiner_name: '',
    discipline: '',
    status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled',
    max_candidates: 10,
    notes: '',
  });

  useEffect(() => {
    if (editingExam) {
      setFormData({
        belt_level: editingExam.belt_level,
        exam_date: editingExam.exam_date,
        exam_time: editingExam.exam_time,
        location: editingExam.location,
        examiner_id: editingExam.examiner_id,
        examiner_name: editingExam.examiner_name || '',
        discipline: editingExam.discipline,
        status: editingExam.status,
        max_candidates: editingExam.max_candidates,
        notes: editingExam.notes || '',
      });
    } else {
      setFormData({
        belt_level: '',
        exam_date: '',
        exam_time: '',
        location: '',
        examiner_id: '',
        examiner_name: '',
        discipline: '',
        status: 'scheduled',
        max_candidates: 10,
        notes: '',
      });
    }
  }, [editingExam, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save exam:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-3xl bg-base-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Award className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-base-content">
              {editingExam
                ? label(t, 'beltTesting.modal.editTitle', 'Edit Belt Exam')
                : label(t, 'beltTesting.modal.createTitle', 'Create New Belt Exam')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Belt Level & Discipline Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" />
                  {label(t, 'beltTesting.modal.beltLevel', 'Belt Level')}
                  <span className="text-error">*</span>
                </span>
              </label>
              <select
                className="select select-bordered w-full bg-base-300 focus:border-primary"
                value={formData.belt_level}
                onChange={(e) => setFormData({ ...formData, belt_level: e.target.value })}
                required
              >
                <option value="">
                  {label(t, 'beltTesting.modal.selectBelt', 'Select belt level')}
                </option>
                {BELT_LEVELS.map((belt) => (
                  <option key={belt} value={belt}>
                    {belt}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">
                  {label(t, 'beltTesting.modal.discipline', 'Discipline')}
                  <span className="text-error">*</span>
                </span>
              </label>
              <select
                className="select select-bordered w-full bg-base-300 focus:border-primary"
                value={formData.discipline}
                onChange={(e) => setFormData({ ...formData, discipline: e.target.value })}
                required
              >
                <option value="">
                  {label(t, 'beltTesting.modal.selectDiscipline', 'Select discipline')}
                </option>
                {DISCIPLINES.map((discipline) => (
                  <option key={discipline} value={discipline}>
                    {discipline}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-secondary" />
                  {label(t, 'beltTesting.modal.examDate', 'Exam Date')}
                  <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="date"
                className="input input-bordered w-full bg-base-300 focus:border-primary"
                value={formData.exam_date}
                onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-accent" />
                  {label(t, 'beltTesting.modal.examTime', 'Exam Time')}
                  <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="time"
                className="input input-bordered w-full bg-base-300 focus:border-primary"
                value={formData.exam_time}
                onChange={(e) => setFormData({ ...formData, exam_time: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Location */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-info" />
                {label(t, 'beltTesting.modal.location', 'Location')}
                <span className="text-error">*</span>
              </span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full bg-base-300 focus:border-primary"
              placeholder={label(t, 'beltTesting.modal.locationPlaceholder', 'Enter exam location')}
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />
          </div>

          {/* Examiner Name */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-warning" />
                {label(t, 'beltTesting.modal.examiner', 'Examiner Name')}
              </span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full bg-base-300 focus:border-primary"
              placeholder={label(t, 'beltTesting.modal.examinerPlaceholder', 'Enter examiner name')}
              value={formData.examiner_name}
              onChange={(e) => setFormData({ 
                ...formData, 
                examiner_name: e.target.value,
                examiner_id: e.target.value || 'default'
              })}
            />
          </div>

          {/* Max Candidates & Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-success" />
                  {label(t, 'beltTesting.modal.maxCandidates', 'Maximum Candidates')}
                </span>
              </label>
              <input
                type="number"
                min="1"
                max="50"
                className="input input-bordered w-full bg-base-300 focus:border-primary"
                value={formData.max_candidates}
                onChange={(e) => setFormData({ ...formData, max_candidates: parseInt(e.target.value) })}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">
                  {label(t, 'beltTesting.modal.status', 'Status')}
                </span>
              </label>
              <select
                className="select select-bordered w-full bg-base-300 focus:border-primary"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'scheduled' | 'completed' | 'cancelled' })}
              >
                <option value="scheduled">{label(t, 'beltTesting.status.scheduled', 'Scheduled')}</option>
                <option value="completed">{label(t, 'beltTesting.status.completed', 'Completed')}</option>
                <option value="cancelled">{label(t, 'beltTesting.status.cancelled', 'Cancelled')}</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-base-content/70" />
                {label(t, 'beltTesting.modal.notes', 'Notes (Optional)')}
              </span>
            </label>
            <textarea
              className="textarea textarea-bordered h-24 bg-base-300 focus:border-primary resize-none"
              placeholder={label(t, 'beltTesting.modal.notesPlaceholder', 'Add any additional notes about this exam...')}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-base-300">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={loading}
            >
              {label(t, 'common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  {label(t, 'common.saving', 'Saving...')}
                </>
              ) : (
                <>
                  <Award className="w-5 h-5" />
                  {editingExam
                    ? label(t, 'common.update', 'Update Exam')
                    : label(t, 'common.create', 'Create Exam')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose}>
        <button>close</button>
      </div>
    </div>
  );
}
