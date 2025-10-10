import { Award, CheckCircle, Clock } from 'lucide-react';
import { getBeltColor } from '../../lib/beltTestingUtils';
import type { EligibleStudent } from '../../lib/beltTestingUtils';

interface EligibleStudentsProps {
  students: EligibleStudent[];
}

export default function EligibleStudents({ students }: EligibleStudentsProps) {
  const readyStudents = students.filter(s => s.readyStatus === 'ready');
  const needsPracticeStudents = students.filter(s => s.readyStatus === 'needs-more-practice');

  return (
    <div className="space-y-6">
      {/* Ready Students */}
      <div className="card bg-base-200">
        <div className="card-body">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-success" />
            <h3 className="card-title text-success">Ready for Testing ({readyStudents.length})</h3>
          </div>

          {readyStudents.length === 0 ? (
            <p className="text-base-content/70">No students are currently ready for belt testing.</p>
          ) : (
            <div className="space-y-3">
              {readyStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/20">
                  <div className="flex items-center gap-3">
                    <div className={`badge ${getBeltColor(student.currentBelt)} badge-sm`}>
                      {student.currentBelt}
                    </div>
                    <div>
                      <p className="font-semibold text-base-content">{student.name}</p>
                      <p className="text-sm text-base-content/70">
                        {student.classesAttended}/{student.requiredClasses} classes completed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-warning" />
                    <span className="text-sm font-medium">{student.targetBelt}</span>
                    <button className="btn btn-success btn-xs">
                      Schedule Test
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Needs More Practice */}
      <div className="card bg-base-200">
        <div className="card-body">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-warning" />
            <h3 className="card-title text-warning">Needs More Practice ({needsPracticeStudents.length})</h3>
          </div>

          {needsPracticeStudents.length === 0 ? (
            <p className="text-base-content/70">All students are ready for testing!</p>
          ) : (
            <div className="space-y-3">
              {needsPracticeStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-warning/10 rounded-lg border border-warning/20">
                  <div className="flex items-center gap-3">
                    <div className={`badge ${getBeltColor(student.currentBelt)} badge-sm`}>
                      {student.currentBelt}
                    </div>
                    <div>
                      <p className="font-semibold text-base-content">{student.name}</p>
                      <p className="text-sm text-base-content/70">
                        {student.classesAttended}/{student.requiredClasses} classes completed
                        ({student.requiredClasses - student.classesAttended} more needed)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-warning" />
                    <span className="text-sm font-medium">{student.targetBelt}</span>
                    <div className="w-20 bg-base-300 rounded-full h-2">
                      <div
                        className="bg-warning h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(student.classesAttended / student.requiredClasses) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}