/**
 * Student Belt Testing View
 * Shows belt testing information for students (read-only)
 */

import { Award, Calendar, Clock, MapPin, User, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { label } from '../../lib/i18nUtils';

interface ExamAssignment {
  id: string;
  exam_id: string;
  student_id: string;
  status: string;
  result?: string;
  score?: number;
  feedback?: string;
  assigned_at: string;
  completed_at?: string;
  target_belt: string;
  exam_date: string;
  exam_time: string;
  location: string;
  current_belt: string;
}

interface StudentBeltTestingProps {
  assignments: ExamAssignment[];
  studentProgress: {
    currentBelt: string;
    classesAttended: number;
    requiredClasses: number;
    nextBelt: string;
  };
}

export default function StudentBeltTesting({ assignments, studentProgress }: StudentBeltTestingProps) {
  const { t } = useTranslation();

  const upcomingExams = assignments.filter(a => a.status === 'assigned' && new Date(a.exam_date) >= new Date());
  const completedExams = assignments.filter(a => a.status === 'completed' || a.result);
  const progressPercentage = (studentProgress.classesAttended / studentProgress.requiredClasses) * 100;

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-base-200 to-base-300 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/20">
              <Award className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-base-content">
                {label(t, 'beltTesting.student.title', 'My Belt Progress')}
              </h1>
              <p className="text-sm text-base-content/70">
                {label(t, 'beltTesting.student.subtitle', 'Track your journey to the next belt')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-7xl mx-auto space-y-6">
        {/* Current Progress Card */}
        <div className="card bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-base-content">
                  {label(t, 'beltTesting.student.currentBelt', 'Current Belt')}
                </h2>
                <p className="text-4xl font-black text-primary mt-2">{studentProgress.currentBelt}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-base-content/70 mb-1">
                  {label(t, 'beltTesting.student.nextGoal', 'Next Goal')}
                </p>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-success" />
                  <p className="text-2xl font-bold text-success">{studentProgress.nextBelt}</p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-base-content/70">
                  {label(t, 'beltTesting.student.classesCompleted', 'Classes completed')}
                </span>
                <span className="font-semibold text-base-content">
                  {studentProgress.classesAttended} / {studentProgress.requiredClasses}
                </span>
              </div>
              <div className="w-full bg-base-300 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary to-secondary h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                >
                  {progressPercentage >= 20 && (
                    <span className="text-xs font-bold text-white">{Math.round(progressPercentage)}%</span>
                  )}
                </div>
              </div>
              {progressPercentage >= 100 && (
                <div className="alert alert-success">
                  <Award className="w-5 h-5" />
                  <span>{label(t, 'beltTesting.student.readyForTesting', 'You are ready for belt testing!')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Exams */}
        {upcomingExams.length > 0 && (
          <div className="card bg-base-200">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">
                <Calendar className="w-6 h-6 text-primary" />
                {label(t, 'beltTesting.student.upcomingExams', 'Upcoming Exams')}
              </h2>
              <div className="space-y-4">
                {upcomingExams.map((exam) => (
                  <div key={exam.id} className="p-4 bg-primary/10 rounded-lg border border-primary/30">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-primary" />
                          <span className="text-lg font-bold text-base-content">
                            {exam.target_belt} {label(t, 'beltTesting.student.examination', 'Examination')}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-base-content/70">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(exam.exam_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{exam.exam_time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{exam.location}</span>
                          </div>
                        </div>
                      </div>
                      <div className="badge badge-primary badge-lg">
                        {label(t, 'beltTesting.student.scheduled', 'Scheduled')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* No Upcoming Exams Message */}
        {upcomingExams.length === 0 && (
          <div className="card bg-base-200">
            <div className="card-body text-center py-12">
              <Calendar className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-base-content mb-2">
                {label(t, 'beltTesting.student.noUpcoming', 'No Upcoming Exams')}
              </h3>
              <p className="text-base-content/70">
                {progressPercentage >= 100
                  ? label(t, 'beltTesting.student.waitingAssignment', 'You are ready! Wait for your instructor to assign you to an exam.')
                  : label(t, 'beltTesting.student.keepTraining', 'Keep training! You need') + ` ${studentProgress.requiredClasses - studentProgress.classesAttended} ` + label(t, 'beltTesting.student.moreClasses', 'more classes.')}
              </p>
            </div>
          </div>
        )}

        {/* Exam History */}
        {completedExams.length > 0 && (
          <div className="card bg-base-200">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">
                <User className="w-6 h-6 text-secondary" />
                {label(t, 'beltTesting.student.examHistory', 'Exam History')}
              </h2>
              <div className="space-y-3">
                {completedExams.map((exam) => (
                  <div key={exam.id} className={`p-4 rounded-lg border ${
                    exam.result === 'pass' 
                      ? 'bg-success/10 border-success/30' 
                      : 'bg-error/10 border-error/30'
                  }`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Award className={`w-5 h-5 ${exam.result === 'pass' ? 'text-success' : 'text-error'}`} />
                          <span className="font-bold text-base-content">
                            {exam.current_belt} → {exam.target_belt}
                          </span>
                        </div>
                        <div className="text-sm text-base-content/70">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          {new Date(exam.exam_date).toLocaleDateString()}
                        </div>
                        {exam.feedback && (
                          <p className="mt-2 text-sm text-base-content/70 italic">
                            "{exam.feedback}"
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={`badge badge-lg ${
                          exam.result === 'pass' ? 'badge-success' : 'badge-error'
                        }`}>
                          {exam.result === 'pass' 
                            ? label(t, 'beltTesting.student.passed', 'Passed') 
                            : label(t, 'beltTesting.student.failed', 'Failed')}
                        </div>
                        {exam.score !== undefined && (
                          <span className="text-lg font-bold text-base-content">
                            {label(t, 'beltTesting.student.score', 'Score')}: {exam.score}/100
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
