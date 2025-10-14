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
        card bg-gradient-to-br transition-all cursor-pointer
        ${isPresent 
          ? 'from-green-500/10 to-green-600/5 border-green-500/30 hover:border-green-500/50' 
          : 'from-gray-800 to-gray-900 border-gray-700/50 hover:border-gray-600/50'
        }
        border shadow-lg hover:shadow-xl
      `}
      onClick={onToggle}
    >
      <div className="card-body p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Avatar */}
            <div className="avatar placeholder">
              <div className={`
                w-12 h-12 rounded-full
                ${isPresent ? 'bg-green-500/20' : 'bg-gray-700'}
              `}>
                {student.avatar_url ? (
                  <img src={student.avatar_url} alt={student.name} />
                ) : (
                  <User className={`w-6 h-6 ${isPresent ? 'text-green-400' : 'text-gray-400'}`} />
                )}
              </div>
            </div>

            {/* Student Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base-content truncate">{student.name}</h3>
              <div className="flex items-center gap-2 text-sm text-base-content/60">
                <span className="truncate">{student.email}</span>
                <span className={`badge badge-sm ${student.belt === 'Black' ? 'badge-primary' : 'badge-ghost'}`}>
                  {student.belt}
                </span>
              </div>
            </div>
          </div>

          {/* Attendance Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`
                btn btn-circle btn-sm border-2
                ${isPresent 
                  ? 'bg-green-500/20 border-green-500 hover:bg-green-500/30' 
                  : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                }
              `}
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
            >
              {isPresent ? (
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
