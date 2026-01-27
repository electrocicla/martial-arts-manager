/**
 * Admin Belt Testing Management
 * Full administrative interface for managing belt exams
 */

import { useState } from 'react';
import { Award, Calendar, Users, Plus, Edit, Trash2, UserPlus, CheckCircle } from 'lucide-react';
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

interface AdminBeltTestingProps {
  exams: BeltExam[];
  eligibleStudents: EligibleStudent[];
  onCreateExam: (exam: Omit<BeltExam, 'id' | 'created_at' | 'updated_at' | 'assigned_count' | 'passed_count'>) => Promise<void>;
  onUpdateExam: (id: string, updates: Partial<BeltExam>) => Promise<void>;
  onDeleteExam: (id: string) => Promise<void>;
  onAssignStudent: (examId: string, studentId: string) => Promise<void>;
}

export default function AdminBeltTesting({
  exams,
  eligibleStudents,
  onDeleteExam,
}: AdminBeltTestingProps) {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState<'exams' | 'students'>('exams');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingExam, setEditingExam] = useState<BeltExam | null>(null);

  const scheduledExams = exams.filter(e => e.status === 'scheduled');
  const completedExams = exams.filter(e => e.status === 'completed');
  const readyStudents = eligibleStudents.filter(s => s.readyStatus === 'ready');

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-base-200 to-base-300 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/20">
                <Award className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-base-content">
                  {label(t, 'beltTesting.admin.title', 'Belt Testing Management')}
                </h1>
                <p className="text-sm text-base-content/70">
                  {label(t, 'beltTesting.admin.subtitle', 'Manage belt examinations and student progress')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary gap-2"
            >
              <Plus className="w-5 h-5" />
              {label(t, 'beltTesting.admin.createExam', 'Create Exam')}
            </button>
          </div>

          {/* Tabs */}
          <div className="tabs tabs-boxed mt-6">
            <button
              className={`tab ${selectedTab === 'exams' ? 'tab-active' : ''}`}
              onClick={() => setSelectedTab('exams')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              {label(t, 'beltTesting.admin.exams', 'Exams')}
            </button>
            <button
              className={`tab ${selectedTab === 'students' ? 'tab-active' : ''}`}
              onClick={() => setSelectedTab('students')}
            >
              <Users className="w-4 h-4 mr-2" />
              {label(t, 'beltTesting.admin.eligibleStudents', 'Eligible Students')}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-7xl mx-auto space-y-6">
        {/* Exams Tab */}
        {selectedTab === 'exams' && (
          <>
            {/* Scheduled Exams */}
            <div className="card bg-base-200">
              <div className="card-body">
                <h2 className="card-title text-xl mb-4">
                  {label(t, 'beltTesting.admin.scheduledExams', 'Scheduled Exams')} ({scheduledExams.length})
                </h2>
                {scheduledExams.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
                    <p className="text-base-content/70">
                      {label(t, 'beltTesting.admin.noScheduledExams', 'No scheduled exams')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {scheduledExams.map((exam) => (
                      <div key={exam.id} className="p-4 bg-base-300 rounded-lg">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="badge badge-primary badge-lg">
                                {exam.belt_level}
                              </div>
                              <span className="font-bold text-base-content">{exam.discipline}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-base-content/70">
                              <div>
                                <Calendar className="w-4 h-4 inline mr-1" />
                                {new Date(exam.exam_date).toLocaleDateString()} {exam.exam_time}
                              </div>
                              <div>
                                <Users className="w-4 h-4 inline mr-1" />
                                {exam.assigned_count}/{exam.max_candidates} {label(t, 'beltTesting.admin.candidates', 'candidates')}
                              </div>
                              <div>{exam.location}</div>
                            </div>
                            {exam.examiner_name && (
                              <div className="text-sm text-base-content/70 mt-1">
                                {label(t, 'beltTesting.admin.examiner', 'Examiner')}: {exam.examiner_name}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingExam(exam)}
                              className="btn btn-sm btn-ghost"
                            >
                              <UserPlus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingExam(exam)}
                              className="btn btn-sm btn-ghost"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteExam(exam.id)}
                              className="btn btn-sm btn-ghost text-error"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Completed Exams */}
            {completedExams.length > 0 && (
              <div className="card bg-base-200">
                <div className="card-body">
                  <h2 className="card-title text-xl mb-4">
                    {label(t, 'beltTesting.admin.completedExams', 'Completed Exams')} ({completedExams.length})
                  </h2>
                  <div className="space-y-3">
                    {completedExams.map((exam) => (
                      <div key={exam.id} className="p-4 bg-success/10 rounded-lg border border-success/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <CheckCircle className="w-5 h-5 text-success" />
                              <span className="font-bold text-base-content">{exam.belt_level} - {exam.discipline}</span>
                            </div>
                            <div className="text-sm text-base-content/70">
                              {new Date(exam.exam_date).toLocaleDateString()} • {exam.passed_count}/{exam.assigned_count} {label(t, 'beltTesting.admin.passed', 'passed')}
                            </div>
                          </div>
                          <div className="badge badge-success">{label(t, 'beltTesting.admin.completed', 'Completed')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Eligible Students Tab */}
        {selectedTab === 'students' && (
          <div className="card bg-base-200">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">
                <CheckCircle className="w-6 h-6 text-success" />
                {label(t, 'beltTesting.admin.readyForTesting', 'Ready for Testing')} ({readyStudents.length})
              </h2>
              {readyStudents.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
                  <p className="text-base-content/70">
                    {label(t, 'beltTesting.admin.noReadyStudents', 'No students ready for testing')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {readyStudents.map((student) => (
                    <div key={student.id} className="p-4 bg-success/10 rounded-lg border border-success/20">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <div className="badge badge-primary badge-sm">{student.currentBelt}</div>
                            <span className="font-bold text-base-content">{student.name}</span>
                          </div>
                          <div className="text-sm text-base-content/70">
                            {student.discipline} • {student.classesAttended}/{student.requiredClasses} {label(t, 'beltTesting.admin.classesCompleted', 'classes completed')}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm text-base-content/70">{label(t, 'beltTesting.admin.nextBelt', 'Next belt')}</div>
                            <div className="font-bold text-success">{student.targetBelt}</div>
                          </div>
                          <button
                            className="btn btn-success btn-sm gap-2"
                            onClick={() => {/* Show assignment modal */}}
                          >
                            <UserPlus className="w-4 h-4" />
                            {label(t, 'beltTesting.admin.assignToExam', 'Assign')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal - Simplified, would need full implementation */}
      {(showCreateModal || editingExam) && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">
              {editingExam 
                ? label(t, 'beltTesting.admin.editExam', 'Edit Exam')
                : label(t, 'beltTesting.admin.createNewExam', 'Create New Exam')}
            </h3>
            <p className="text-sm text-base-content/70">
              {label(t, 'beltTesting.admin.modalPlaceholder', 'Form fields would go here...')}
            </p>
            <div className="modal-action">
              <button
                className="btn"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingExam(null);
                }}
              >
                {label(t, 'common.cancel', 'Cancel')}
              </button>
              <button className="btn btn-primary">
                {label(t, 'common.save', 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
