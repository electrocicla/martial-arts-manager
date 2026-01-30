import { CheckCircle2, XCircle, User } from 'lucide-react';
import type { Student } from '../../types/index';

interface AttendanceRowProps {
  student: Student;
  isPresent: boolean;
  onToggle: () => void;
}

/**
 * AttendanceRow Component
 * Responsibility: Render individual student attendance row
 * SRP: Only handles single row UI and user interaction
 */
export function AttendanceRow({ student, isPresent, onToggle }: AttendanceRowProps) {
  return (
    <div 
      className={`
        card transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl rounded-3xl border-2
        ${isPresent 
          ? 'bg-gradient-to-br from-success/10 to-base-200 border-success/30 hover:border-success/50' 
          : 'bg-base-200 border-base-300 hover:border-base-content/20'
        }
      `}
      onClick={onToggle}
    >
      <div className="card-body p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Avatar */}
            <div className="avatar placeholder flex-shrink-0">
              <div className={`
                w-14 h-14 rounded-2xl shadow-lg
                ${isPresent ? 'bg-success text-success-content' : 'bg-primary text-primary-content'}
              `}>
                {student.avatar_url ? (
                  <img src={student.avatar_url} alt={student.name} className="rounded-2xl" />
                ) : (
                  <User className="w-7 h-7" />
                )}
              </div>
            </div>

            {/* Student Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-base-content truncate">{student.name}</h3>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-sm text-base-content/60 truncate">{student.email}</span>
                <span className={`badge badge-lg rounded-xl shadow-sm ${student.belt === 'Black' ? 'badge-primary' : 'badge-secondary'}`}>
                  {student.belt}
                </span>
              </div>
            </div>
          </div>

          {/* Attendance Toggle */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              type="button"
              className={`
                btn btn-circle btn-lg border-2 shadow-lg hover:shadow-xl transition-all
                ${isPresent 
                  ? 'bg-success border-success hover:bg-success/80' 
                  : 'bg-base-300 border-base-content/20 hover:bg-base-content/10'
                }
              `}
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
            >
              {isPresent ? (
                <CheckCircle2 className="w-7 h-7 text-success-content" />
              ) : (
                <XCircle className="w-7 h-7 text-base-content/50" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
