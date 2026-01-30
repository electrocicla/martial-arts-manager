import { Award, CheckCircle, Clock, TrendingUp, Target } from 'lucide-react';
import { getBeltColor } from '../../lib/beltTestingUtils';
import { useTranslation } from 'react-i18next';
import { label } from '../../lib/i18nUtils';
import type { EligibleStudent } from '../../lib/beltTestingUtils';

interface EligibleStudentsProps {
  students: EligibleStudent[];
}

export default function EligibleStudents({ students }: EligibleStudentsProps) {
  const { t } = useTranslation();
  const readyStudents = students.filter(s => s.readyStatus === 'ready');
  const needsPracticeStudents = students.filter(s => s.readyStatus === 'needs-more-practice');

  return (
    <div className="space-y-8">
      {/* Ready Students */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-success/20">
            <CheckCircle className="w-7 h-7 text-success" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-success">
              {label(t, 'beltTesting.ready.title', 'Ready for Testing')}
            </h3>
            <p className="text-sm text-base-content/70">
              {readyStudents.length} {label(t, 'beltTesting.ready.studentsEligible', 'students eligible for belt testing')}
            </p>
          </div>
        </div>

        {readyStudents.length === 0 ? (
          <div className="card bg-base-200 border border-base-300 shadow-lg">
            <div className="card-body items-center text-center py-12">
              <CheckCircle className="w-16 h-16 text-base-content/20 mb-4" />
              <p className="text-base-content/70">
                {label(t, 'beltTesting.ready.empty', 'No students are currently ready for belt testing.')}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-5">
            {readyStudents.map((student) => {
              const progress = (student.classesAttended / student.requiredClasses) * 100;
              
              return (
                <div 
                  key={student.id} 
                  className="card bg-gradient-to-br from-success/10 to-success/5 border-2 border-success/30 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden"
                >
                  <div className="card-body p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                      {/* Student Info */}
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className={`badge badge-lg px-4 py-4 ${getBeltColor(student.currentBelt)} text-base font-bold shadow-md`}>
                            <Award className="w-4 h-4 mr-2" />
                            {student.currentBelt}
                          </div>
                          <h4 className="text-xl font-bold text-base-content">{student.name}</h4>
                          <span className="text-base-content/50">•</span>
                          <span className="badge badge-outline badge-lg">{student.discipline}</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-base-content/70 font-medium">
                              {label(t, 'beltTesting.classProgress', 'Class Progress')}
                            </span>
                            <span className="font-bold text-success">
                              {student.classesAttended}/{student.requiredClasses} {label(t, 'beltTesting.classesCompleted', 'classes completed')}
                            </span>
                          </div>
                          <div className="w-full bg-base-300 rounded-full h-3 overflow-hidden shadow-inner">
                            <div
                              className="bg-gradient-to-r from-success to-success/70 h-3 rounded-full transition-all duration-700 ease-out shadow-md"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Last Promotion */}
                        {student.lastPromotion && (
                          <div className="flex items-center gap-2 text-sm text-base-content/70">
                            <TrendingUp className="w-4 h-4" />
                            <span>
                              {label(t, 'beltTesting.lastPromotion', 'Last promotion')}: {new Date(student.lastPromotion).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Target Belt Card */}
                      <div className="flex items-center gap-4">
                        <div className="text-center p-6 bg-base-200 rounded-2xl border-2 border-success/30 shadow-lg min-w-[140px]">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Target className="w-5 h-5 text-warning" />
                            <div className="text-xs text-base-content/70 font-semibold uppercase tracking-wide">
                              {label(t, 'beltTesting.nextBelt', 'Next Belt')}
                            </div>
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <Award className="w-6 h-6 text-warning" />
                            <div className="text-xl font-black text-success">{student.targetBelt}</div>
                          </div>
                        </div>

                        <button className="btn btn-success gap-2 shadow-lg hover:shadow-xl btn-lg">
                          <CheckCircle className="w-5 h-5" />
                          {label(t, 'beltTesting.actions.schedule', 'Schedule Test')}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Success indicator strip */}
                  <div className="h-2 bg-gradient-to-r from-success via-success/70 to-success" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Needs More Practice */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-warning/20">
            <Clock className="w-7 h-7 text-warning" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-warning">
              {label(t, 'beltTesting.needsPractice.title', 'Needs More Practice')}
            </h3>
            <p className="text-sm text-base-content/70">
              {needsPracticeStudents.length} {label(t, 'beltTesting.needsPractice.studentsInProgress', 'students in progress')}
            </p>
          </div>
        </div>

        {needsPracticeStudents.length === 0 ? (
          <div className="card bg-base-200 border border-base-300 shadow-lg">
            <div className="card-body items-center text-center py-12">
              <CheckCircle className="w-16 h-16 text-success/50 mb-4" />
              <p className="text-success font-semibold text-lg">
                {label(t, 'beltTesting.needsPractice.empty', 'All students are ready for testing!')}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {needsPracticeStudents.map((student) => {
              const progress = (student.classesAttended / student.requiredClasses) * 100;
              const classesNeeded = student.requiredClasses - student.classesAttended;
              
              return (
                <div 
                  key={student.id} 
                  className="card bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/30 shadow-md hover:shadow-lg transition-all"
                >
                  <div className="card-body p-5">
                    <div className="flex flex-col md:flex-row md:items-center gap-5">
                      {/* Student Info */}
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className={`badge ${getBeltColor(student.currentBelt)} badge-md px-3 py-3 font-semibold`}>
                            {student.currentBelt}
                          </div>
                          <h4 className="font-bold text-lg text-base-content">{student.name}</h4>
                          <span className="text-sm text-base-content/70">{student.discipline}</span>
                        </div>

                        {/* Progress with classes needed */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-base-content/70">
                              {student.classesAttended}/{student.requiredClasses} {label(t, 'beltTesting.classesCompletedShort', 'classes completed')}
                            </span>
                            <span className="font-bold text-warning">
                              {classesNeeded} {label(t, 'beltTesting.moreNeeded', 'more needed')}
                            </span>
                          </div>
                          <div className="w-full bg-base-300 rounded-full h-2.5 overflow-hidden shadow-inner">
                            <div
                              className="bg-gradient-to-r from-warning to-warning/70 h-2.5 rounded-full transition-all duration-700 ease-out"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Target Info */}
                      <div className="flex items-center gap-3">
                        <div className="text-center p-4 bg-base-200 rounded-xl border border-warning/20 min-w-[120px]">
                          <div className="text-xs text-base-content/70 mb-1 font-medium">
                            {label(t, 'beltTesting.targetBelt', 'Target')}
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <Award className="w-5 h-5 text-warning" />
                            <span className="text-lg font-bold text-warning">{student.targetBelt}</span>
                          </div>
                          <div className="text-xs text-base-content/60 mt-1">
                            {Math.round(progress)}% {label(t, 'beltTesting.ready', 'ready')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
