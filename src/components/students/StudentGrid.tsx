import { Eye, Edit, Mail, Phone, Calendar } from 'lucide-react';
import { getBeltColor } from '../../lib/studentUtils';
import { Button } from '../ui/Button';
import type { Student } from '../../types/index';

interface StudentGridProps {
  students: Student[];
  onViewStudent: (student: Student) => void;
  onEditStudent: (student: Student) => void;
}

export default function StudentGrid({ students, onViewStudent, onEditStudent }: StudentGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {students.map((student: Student) => (
        <div
          key={student.id}
          className="group relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 hover:border-red-500/50 shadow-xl hover:shadow-red-500/20 transition-all duration-300 hover:scale-105"
        >
          {/* Avatar y Badge de Estado */}
          <div className="relative mb-4">
            <div className="flex items-start justify-between">
              {/* Avatar */}
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg ring-4 ring-gray-800 group-hover:ring-red-500/30 transition-all duration-300">
                  {student.avatar_url ? (
                    <img
                      src={student.avatar_url}
                      alt={student.name}
                      className="w-full h-full rounded-2xl object-cover"
                    />
                  ) : (
                    student.name?.charAt(0)?.toUpperCase() || '?'
                  )}
                </div>
                {/* Status Indicator */}
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-gray-800 ${
                  student.is_active ? 'bg-green-500' : 'bg-red-500'
                } shadow-lg`} />
              </div>

              {/* Belt Badge */}
              <div className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg ${getBeltColor(student.belt)}`}>
                {student.belt || 'N/A'}
              </div>
            </div>
          </div>

          {/* Student Info */}
          <div className="space-y-3 mb-5">
            <div>
              <h3 className="text-xl font-bold text-white mb-1 truncate group-hover:text-red-400 transition-colors">
                {student.name || 'N/A'}
              </h3>
              <p className="text-sm text-gray-400 font-medium truncate">
                {student.discipline || 'N/A'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-blue-400" />
                </div>
                <span className="truncate">{student.email || 'N/A'}</span>
              </div>

              {student.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-green-400" />
                  </div>
                  <span>{student.phone}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-300">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-purple-400" />
                </div>
                <span>{new Date(student.join_date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Eye className="w-4 h-4" />}
              onClick={() => onViewStudent(student)}
            >
              Ver
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Edit className="w-4 h-4" />}
              onClick={() => onEditStudent(student)}
            >
              Editar
            </Button>
          </div>

          {/* Hover Overlay Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 to-purple-500/0 group-hover:from-red-500/5 group-hover:to-purple-500/5 rounded-2xl pointer-events-none transition-all duration-300" />
        </div>
      ))}
    </div>
  );
}
