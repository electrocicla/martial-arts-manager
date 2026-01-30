/**
 * Admin Belt Testing Management
 * Full administrative interface for managing belt exams
 */

import { useState } from 'react';
import { Award, Calendar, Users, Plus, Edit, Trash2, UserPlus, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { label } from '../../lib/i18nUtils';
import CreateExamModal from './CreateExamModal';
import AssignStudentModal from './AssignStudentModal';

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
  onCreateExam,
  onUpdateExam,
  onDeleteExam,
  onAssignStudent,
}: AdminBeltTestingProps) {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState<'exams' | 'students'>('exams');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingExam, setEditingExam] = useState<BeltExam | null>(null);
  const [assigningExam, setAssigningExam] = useState<BeltExam | null>(null);

  const scheduledExams = exams.filter(e => e.status === 'scheduled');
  const completedExams = exams.filter(e => e.status === 'completed');
  const readyStudents = eligibleStudents.filter(s => s.readyStatus === 'ready');

  const handleCreateExam = async (examData: Omit<BeltExam, 'id' | 'created_at' | 'updated_at' | 'assigned_count' | 'passed_count'>) => {
    await onCreateExam(examData);
    setShowCreateModal(false);
  };

  const handleUpdateExam = async (examData: Omit<BeltExam, 'id' | 'created_at' | 'updated_at' | 'assigned_count' | 'passed_count'>) => {
    if (!editingExam) return;
    await onUpdateExam(editingExam.id, examData);
    setEditingExam(null);
  };

  const handleDeleteExam = async (id: string) => {
    if (window.confirm(label(t, 'beltTesting.admin.confirmDelete', 'Are you sure you want to delete this exam?'))) {
      await onDeleteExam(id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 pb-24 md:pb-10">
      {/* Modern Header with Glass Effect */}
      <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 backdrop-blur-sm border-b border-base-300">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-primary/50 shadow-lg">
                <Award className="w-10 h-10 text-primary-content" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-base-content bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {label(t, 'beltTesting.admin.title', 'Belt Testing Management')}
                </h1>
                <p className="text-base text-base-content/70 mt-1">
                  {label(t, 'beltTesting.admin.subtitle', 'Manage belt examinations and student progress')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary btn-lg gap-3 shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="w-6 h-6" />
              {label(t, 'beltTesting.admin.createExam', 'Create Exam')}
            </button>
          </div>

          {/* Modern Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="stats shadow-lg bg-base-200 border border-base-300">
              <div className="stat">
                <div className="stat-figure text-primary">
                  <Calendar className="w-8 h-8" />
                </div>
                <div className="stat-title">{label(t, 'beltTesting.admin.scheduledExams', 'Scheduled Exams')}</div>
                <div className="stat-value text-primary">{scheduledExams.length}</div>
                <div className="stat-desc">{label(t, 'beltTesting.admin.upcoming', 'Upcoming tests')}</div>
              </div>
            </div>
            
            <div className="stats shadow-lg bg-base-200 border border-base-300">
              <div className="stat">
                <div className="stat-figure text-success">
                  <Users className="w-8 h-8" />
                </div>
                <div className="stat-title">{label(t, 'beltTesting.admin.readyStudents', 'Ready Students')}</div>
                <div className="stat-value text-success">{readyStudents.length}</div>
                <div className="stat-desc">{label(t, 'beltTesting.admin.eligibleForTesting', 'Eligible for testing')}</div>
              </div>
            </div>
            
            <div className="stats shadow-lg bg-base-200 border border-base-300">
              <div className="stat">
                <div className="stat-figure text-secondary">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div className="stat-title">{label(t, 'beltTesting.admin.completedTests', 'Completed Tests')}</div>
                <div className="stat-value text-secondary">{completedExams.length}</div>
                <div className="stat-desc">{label(t, 'beltTesting.admin.thisMonth', 'This month')}</div>
              </div>
            </div>
          </div>

          {/* Modern Tabs */}
          <div className="flex gap-2 mt-8">
            <button
              className={`btn gap-2 flex-1 md:flex-none transition-all ${
                selectedTab === 'exams'
                  ? 'btn-primary shadow-lg'
                  : 'btn-ghost bg-base-200 hover:bg-base-300'
              }`}
              onClick={() => setSelectedTab('exams')}
            >
              <Calendar className="w-5 h-5" />
              {label(t, 'beltTesting.admin.exams', 'Exams')}
            </button>
            <button
              className={`btn gap-2 flex-1 md:flex-none transition-all ${
                selectedTab === 'students'
                  ? 'btn-primary shadow-lg'
                  : 'btn-ghost bg-base-200 hover:bg-base-300'
              }`}
              onClick={() => setSelectedTab('students')}
            >
              <Users className="w-5 h-5" />
              {label(t, 'beltTesting.admin.eligibleStudents', 'Eligible Students')}
              <div className="badge badge-success badge-sm">{readyStudents.length}</div>
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 max-w-7xl mx-auto">
        {/* Exams Tab */}
        {selectedTab === 'exams' && (
          <div className="space-y-8">
            {/* Scheduled Exams */}
            <div>
              <h2 className="text-2xl font-bold text-base-content mb-6 flex items-center gap-3">
                <Calendar className="w-7 h-7 text-primary" />
                {label(t, 'beltTesting.admin.scheduledExams', 'Scheduled Exams')}
                <span className="text-primary">({scheduledExams.length})</span>
              </h2>
              
              {scheduledExams.length === 0 ? (
                <div className="card bg-base-200 border border-base-300 shadow-xl">
                  <div className="card-body items-center text-center py-16">
                    <Calendar className="w-20 h-20 text-base-content/20 mb-4" />
                    <h3 className="text-xl font-bold text-base-content mb-2">
                      {label(t, 'beltTesting.admin.noScheduledExams', 'No scheduled exams')}
                    </h3>
                    <p className="text-base-content/70">
                      {label(t, 'beltTesting.admin.createFirstExam', 'Create your first exam to get started')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-6">
                  {scheduledExams.map((exam) => {
                    const availableSpots = exam.max_candidates - exam.assigned_count;
                    const fillPercentage = (exam.assigned_count / exam.max_candidates) * 100;
                    
                    return (
                      <div key={exam.id} className="card bg-base-200 border border-base-300 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
                        <div className="card-body p-6">
                          <div className="flex flex-col lg:flex-row gap-6">
                            {/* Left Section */}
                            <div className="flex-1 space-y-4">
                              <div className="flex flex-wrap items-center gap-3">
                                <div className="badge badge-primary badge-lg gap-2 px-4 py-4 text-base font-bold">
                                  <Award className="w-5 h-5" />
                                  {exam.belt_level}
                                </div>
                                <div className="badge badge-outline badge-lg px-4 py-4 text-base">
                                  {exam.discipline}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 text-base-content/80">
                                  <Calendar className="w-5 h-5 text-primary" />
                                  <span className="font-medium">
                                    {new Date(exam.exam_date).toLocaleDateString('es-ES', { 
                                      weekday: 'long', 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric' 
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-base-content/80">
                                  <Users className="w-5 h-5 text-secondary" />
                                  <span className="font-medium">
                                    {exam.assigned_count}/{exam.max_candidates} {label(t, 'beltTesting.admin.candidates', 'candidates')}
                                  </span>
                                </div>
                              </div>

                              {exam.examiner_name && (
                                <div className="flex items-center gap-3 text-base-content/80">
                                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                                    <Users className="w-3 h-3 text-accent" />
                                  </div>
                                  <span className="text-sm">
                                    {label(t, 'beltTesting.admin.examiner', 'Examiner')}: <span className="font-semibold">{exam.examiner_name}</span>
                                  </span>
                                </div>
                              )}

                              {/* Progress Bar */}
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="font-medium text-base-content/70">
                                    {label(t, 'beltTesting.admin.capacity', 'Capacity')}
                                  </span>
                                  <span className={`font-bold ${
                                    availableSpots === 0 ? 'text-error' : availableSpots <= 3 ? 'text-warning' : 'text-success'
                                  }`}>
                                    {availableSpots} {label(t, 'beltTesting.admin.spotsLeft', 'spots left')}
                                  </span>
                                </div>
                                <div className="w-full bg-base-300 rounded-full h-3 overflow-hidden">
                                  <div
                                    className={`h-3 rounded-full transition-all duration-500 ${
                                      availableSpots === 0 ? 'bg-error' : availableSpots <= 3 ? 'bg-warning' : 'bg-success'
                                    }`}
                                    style={{ width: `${fillPercentage}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Right Section - Actions */}
                            <div className="flex lg:flex-col gap-3 justify-end">
                              <button
                                onClick={() => setAssigningExam(exam)}
                                className="btn btn-success gap-2 flex-1 lg:flex-none shadow-md hover:shadow-lg"
                                disabled={availableSpots === 0}
                              >
                                <UserPlus className="w-5 h-5" />
                                {label(t, 'beltTesting.admin.assignStudents', 'Assign')}
                              </button>
                              <button
                                onClick={() => setEditingExam(exam)}
                                className="btn btn-info gap-2 flex-1 lg:flex-none shadow-md hover:shadow-lg"
                              >
                                <Edit className="w-5 h-5" />
                                {label(t, 'beltTesting.admin.edit', 'Edit')}
                              </button>
                              <button
                                onClick={() => handleDeleteExam(exam.id)}
                                className="btn btn-error gap-2 flex-1 lg:flex-none shadow-md hover:shadow-lg"
                              >
                                <Trash2 className="w-5 h-5" />
                                {label(t, 'beltTesting.admin.delete', 'Delete')}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Completed Exams */}
            {completedExams.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-base-content mb-6 flex items-center gap-3">
                  <CheckCircle className="w-7 h-7 text-success" />
                  {label(t, 'beltTesting.admin.completedExams', 'Completed Exams')}
                  <span className="text-success">({completedExams.length})</span>
                </h2>
                
                <div className="grid gap-4">
                  {completedExams.map((exam) => (
                    <div key={exam.id} className="card bg-success/5 border border-success/30 shadow-lg hover:shadow-xl transition-all">
                      <div className="card-body p-5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-success/20">
                              <CheckCircle className="w-7 h-7 text-success" />
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-bold text-lg text-base-content">{exam.belt_level}</span>
                                <span className="text-base-content/70">•</span>
                                <span className="text-base-content/70">{exam.discipline}</span>
                              </div>
                              <div className="text-sm text-base-content/70">
                                {new Date(exam.exam_date).toLocaleDateString()} • {exam.passed_count}/{exam.assigned_count} {label(t, 'beltTesting.admin.passed', 'passed')}
                              </div>
                            </div>
                          </div>
                          <div className="badge badge-success badge-lg px-4 py-3 shadow-md">
                            {label(t, 'beltTesting.admin.completed', 'Completed')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Eligible Students Tab */}
        {selectedTab === 'students' && (
          <div>
            <h2 className="text-2xl font-bold text-base-content mb-6 flex items-center gap-3">
              <CheckCircle className="w-7 h-7 text-success" />
              {label(t, 'beltTesting.admin.readyForTesting', 'Ready for Testing')}
              <span className="text-success">({readyStudents.length})</span>
            </h2>
            
            {readyStudents.length === 0 ? (
              <div className="card bg-base-200 border border-base-300 shadow-xl">
                <div className="card-body items-center text-center py-16">
                  <Users className="w-20 h-20 text-base-content/20 mb-4" />
                  <h3 className="text-xl font-bold text-base-content mb-2">
                    {label(t, 'beltTesting.admin.noReadyStudents', 'No students ready for testing')}
                  </h3>
                  <p className="text-base-content/70">
                    {label(t, 'beltTesting.admin.studentsNeedMoreClasses', 'Students need more classes to be eligible')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-5">
                {readyStudents.map((student) => {
                  const progress = (student.classesAttended / student.requiredClasses) * 100;
                  
                  return (
                    <div key={student.id} className="card bg-gradient-to-br from-success/10 to-success/5 border border-success/30 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                      <div className="card-body p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                          <div className="flex-1 space-y-4">
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="badge badge-success badge-lg px-4 py-4 text-base font-bold">
                                {student.currentBelt}
                              </div>
                              <h3 className="text-xl font-bold text-base-content">{student.name}</h3>
                              <span className="text-base-content/50">•</span>
                              <span className="text-base-content/70">{student.discipline}</span>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-base-content/70">
                                  {label(t, 'beltTesting.admin.progress', 'Progress')}
                                </span>
                                <span className="font-bold text-success">
                                  {student.classesAttended}/{student.requiredClasses} {label(t, 'beltTesting.admin.classesCompleted', 'classes completed')}
                                </span>
                              </div>
                              <div className="w-full bg-base-300 rounded-full h-3 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-success to-success/70 h-3 rounded-full transition-all duration-500"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="text-center p-4 bg-base-200 rounded-xl border border-success/20">
                              <div className="text-xs text-base-content/70 mb-1">
                                {label(t, 'beltTesting.admin.nextBelt', 'Next belt')}
                              </div>
                              <div className="flex items-center gap-2">
                                <Award className="w-5 h-5 text-warning" />
                                <span className="text-lg font-bold text-success">{student.targetBelt}</span>
                              </div>
                            </div>
                            <button
                              className="btn btn-success gap-2 shadow-lg hover:shadow-xl"
                              onClick={() => {
                                // Find a suitable exam for this student
                                const suitableExam = scheduledExams.find(
                                  e => e.belt_level === student.targetBelt && 
                                       e.discipline === student.discipline &&
                                       e.assigned_count < e.max_candidates
                                );
                                if (suitableExam) {
                                  setAssigningExam(suitableExam);
                                }
                              }}
                            >
                              <UserPlus className="w-5 h-5" />
                              {label(t, 'beltTesting.admin.assignToExam', 'Assign')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateExamModal
        isOpen={showCreateModal || editingExam !== null}
        onClose={() => {
          setShowCreateModal(false);
          setEditingExam(null);
        }}
        onSubmit={editingExam ? handleUpdateExam : handleCreateExam}
        editingExam={editingExam}
      />

      <AssignStudentModal
        isOpen={assigningExam !== null}
        onClose={() => setAssigningExam(null)}
        exam={assigningExam}
        eligibleStudents={eligibleStudents}
        onAssignStudent={onAssignStudent}
      />
    </div>
  );
}
