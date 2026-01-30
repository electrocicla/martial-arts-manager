import { useState } from 'react';
import { X, UserPlus, Search, Award, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { label } from '../../lib/i18nUtils';

interface EligibleStudent {
  id: string;
  name: string;
  discipline: string;
  currentBelt: string;
  targetBelt: string;
  classesAttended: number;
  requiredClasses: number;
  lastPromotion: string;
  readyStatus: 'ready' | 'needs-more-practice';
}

interface BeltExam {
  id: string;
  belt_level: string;
  exam_date: string;
  exam_time: string;
  location: string;
  discipline: string;
  max_candidates: number;
  assigned_count: number;
}

interface AssignStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: BeltExam | null;
  eligibleStudents: EligibleStudent[];
  onAssignStudent: (examId: string, studentId: string) => Promise<void>;
}

export default function AssignStudentModal({
  isOpen,
  onClose,
  exam,
  eligibleStudents,
  onAssignStudent,
}: AssignStudentModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  if (!isOpen || !exam) return null;

  // Filter students by exam discipline and belt level, and search term
  const filteredStudents = eligibleStudents.filter(
    (student) =>
      student.discipline === exam.discipline &&
      student.targetBelt === exam.belt_level &&
      student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const readyStudents = filteredStudents.filter((s) => s.readyStatus === 'ready');
  const needsPracticeStudents = filteredStudents.filter((s) => s.readyStatus === 'needs-more-practice');

  const handleAssign = async () => {
    if (!selectedStudent) return;

    setLoading(true);
    try {
      await onAssignStudent(exam.id, selectedStudent);
      setSelectedStudent(null);
      setSearchTerm('');
      onClose();
    } catch (error) {
      console.error('Failed to assign student:', error);
    } finally {
      setLoading(false);
    }
  };

  const availableSpots = exam.max_candidates - exam.assigned_count;
  const isFull = availableSpots <= 0;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl bg-base-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <UserPlus className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-base-content">
                {label(t, 'beltTesting.assignModal.title', 'Assign Students to Exam')}
              </h3>
              <p className="text-sm text-base-content/70 mt-1">
                {exam.belt_level} • {exam.discipline} • {new Date(exam.exam_date).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Capacity Info */}
        <div className={`alert ${isFull ? 'alert-error' : availableSpots <= 3 ? 'alert-warning' : 'alert-info'} mb-6`}>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            <div>
              <div className="font-semibold">
                {isFull 
                  ? label(t, 'beltTesting.assignModal.examFull', 'Exam is Full')
                  : `${availableSpots} ${label(t, 'beltTesting.assignModal.spotsAvailable', 'spots available')}`
                }
              </div>
              <div className="text-sm opacity-80">
                {exam.assigned_count} / {exam.max_candidates} {label(t, 'beltTesting.assignModal.candidates', 'candidates assigned')}
              </div>
            </div>
          </div>
          <div className="w-48 bg-base-300 rounded-full h-3 ml-auto">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                isFull ? 'bg-error' : availableSpots <= 3 ? 'bg-warning' : 'bg-success'
              }`}
              style={{ width: `${(exam.assigned_count / exam.max_candidates) * 100}%` }}
            />
          </div>
        </div>

        {/* Search */}
        <div className="form-control mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/50" />
            <input
              type="text"
              placeholder={label(t, 'beltTesting.assignModal.searchPlaceholder', 'Search students...')}
              className="input input-bordered w-full pl-12 bg-base-300 focus:border-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Student List */}
        <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
          {/* Ready Students */}
          {readyStudents.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5 text-success" />
                <h4 className="font-bold text-success text-lg">
                  {label(t, 'beltTesting.assignModal.readyStudents', 'Ready for Testing')} ({readyStudents.length})
                </h4>
              </div>
              <div className="space-y-2">
                {readyStudents.map((student) => (
                  <label
                    key={student.id}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all cursor-pointer hover:bg-success/5 ${
                      selectedStudent === student.id
                        ? 'border-success bg-success/10'
                        : 'border-success/20 bg-base-300'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <input
                        type="radio"
                        name="student"
                        className="radio radio-success"
                        checked={selectedStudent === student.id}
                        onChange={() => setSelectedStudent(student.id)}
                        disabled={isFull || loading}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-semibold text-base-content">{student.name}</span>
                          <div className="badge badge-success badge-sm">{student.currentBelt}</div>
                        </div>
                        <div className="text-sm text-base-content/70">
                          {student.classesAttended}/{student.requiredClasses} {label(t, 'beltTesting.assignModal.classesCompleted', 'classes completed')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-base-content/70">{label(t, 'beltTesting.assignModal.nextBelt', 'Next')}</div>
                        <div className="font-bold text-success">{student.targetBelt}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Needs More Practice Students */}
          {needsPracticeStudents.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-warning" />
                <h4 className="font-bold text-warning text-lg">
                  {label(t, 'beltTesting.assignModal.needsPractice', 'Needs More Practice')} ({needsPracticeStudents.length})
                </h4>
              </div>
              <div className="space-y-2">
                {needsPracticeStudents.map((student) => (
                  <label
                    key={student.id}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all cursor-pointer hover:bg-warning/5 ${
                      selectedStudent === student.id
                        ? 'border-warning bg-warning/10'
                        : 'border-warning/20 bg-base-300'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <input
                        type="radio"
                        name="student"
                        className="radio radio-warning"
                        checked={selectedStudent === student.id}
                        onChange={() => setSelectedStudent(student.id)}
                        disabled={isFull || loading}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-semibold text-base-content">{student.name}</span>
                          <div className="badge badge-warning badge-sm">{student.currentBelt}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-base-content/70">
                            {student.classesAttended}/{student.requiredClasses} {label(t, 'beltTesting.assignModal.classes', 'classes')}
                          </div>
                          <div className="w-24 bg-base-200 rounded-full h-2">
                            <div
                              className="bg-warning h-2 rounded-full transition-all duration-500"
                              style={{ width: `${(student.classesAttended / student.requiredClasses) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-base-content/70">{label(t, 'beltTesting.assignModal.target', 'Target')}</div>
                        <div className="font-bold text-warning">{student.targetBelt}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* No Students Found */}
          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
              <p className="text-base-content/70">
                {searchTerm
                  ? label(t, 'beltTesting.assignModal.noResults', 'No students found matching your search')
                  : label(t, 'beltTesting.assignModal.noEligible', 'No eligible students for this exam')}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-base-300">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={loading}
          >
            {label(t, 'common.cancel', 'Cancel')}
          </button>
          <button
            type="button"
            className="btn btn-primary gap-2"
            onClick={handleAssign}
            disabled={!selectedStudent || isFull || loading}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                {label(t, 'common.assigning', 'Assigning...')}
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                {label(t, 'beltTesting.assignModal.assignButton', 'Assign Student')}
              </>
            )}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}>
        <button>close</button>
      </div>
    </div>
  );
}
