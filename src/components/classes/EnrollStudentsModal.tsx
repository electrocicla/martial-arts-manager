import { useState, useEffect, useCallback } from 'react';
import { X, UserPlus, Search, Check, Loader2, Users, AlertCircle } from 'lucide-react';
import { useStudents } from '../../hooks/useStudents';
import { apiClient } from '../../lib/api-client';
import type { Student } from '../../types';

interface EnrollStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: number;
  className: string;
  maxStudents: number;
  currentEnrollment: number;
}

export function EnrollStudentsModal({
  isOpen,
  onClose,
  classId,
  className,
  maxStudents,
}: EnrollStudentsModalProps) {
  const { students } = useStudents();
  const [searchTerm, setSearchTerm] = useState('');
  const [enrolledStudents, setEnrolledStudents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchEnrolledStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<{ students: Student[] }>(`/classes/${classId}/students`);
      if (response.data?.students) {
        const enrolledIds = new Set(response.data.students.map((s: Student) => s.id));
        setEnrolledStudents(enrolledIds);
      }
    } catch (err) {
      console.error('Error fetching enrolled students:', err);
      setError('Error al cargar estudiantes inscritos');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  // Fetch enrolled students when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchEnrolledStudents();
    }
  }, [isOpen, fetchEnrolledStudents]);

  const handleEnroll = async (studentId: string) => {
    if (enrolledStudents.size >= maxStudents) {
      setError('La clase ha alcanzado su capacidad máxima');
      return;
    }

    setActionLoading(studentId);
    setError(null);
    try {
      await apiClient.post(`/classes/${classId}/students`, { student_id: studentId });
      setEnrolledStudents(prev => new Set([...prev, studentId]));
    } catch (err: unknown) {
      console.error('Error enrolling student:', err);
      setError(err instanceof Error ? err.message : 'Error al inscribir estudiante');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnenroll = async (studentId: string) => {
    setActionLoading(studentId);
    setError(null);
    try {
      await apiClient.delete(`/classes/${classId}/students/${studentId}`);
      setEnrolledStudents(prev => {
        const newSet = new Set(prev);
        newSet.delete(studentId);
        return newSet;
      });
    } catch (err: unknown) {
      console.error('Error unenrolling student:', err);
      setError(err instanceof Error ? err.message : 'Error al desinscribir estudiante');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableSlots = maxStudents - enrolledStudents.size;

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl w-full mx-4 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 border border-gray-700/50 shadow-2xl p-0 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700/50 backdrop-blur-xl p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 sm:p-2.5 rounded-lg bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/20 shrink-0">
                  <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Gestionar Estudiantes
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 mb-3 ml-0 sm:ml-11 truncate">{className}</p>
              
              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 ml-0 sm:ml-11">
                <div className="flex items-center gap-2 bg-gray-800/60 px-3 py-1.5 rounded-lg border border-gray-700/50">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-400">Inscritos:</span>
                  <span className="text-xs sm:text-sm font-bold text-white">{enrolledStudents.size}/{maxStudents}</span>
                </div>
                {availableSlots > 0 ? (
                  <div className={`badge ${availableSlots <= 3 ? 'badge-warning' : 'badge-success'} badge-sm sm:badge-md font-semibold`}>
                    {availableSlots} {availableSlots === 1 ? 'cupo' : 'cupos'}
                  </div>
                ) : (
                  <div className="badge badge-error badge-sm sm:badge-md font-semibold">
                    Clase llena
                  </div>
                )}
              </div>
            </div>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="
                btn btn-ghost btn-sm btn-circle shrink-0
                hover:bg-gray-700/50 hover:rotate-90 transition-all duration-200
              "
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Error Message */}
          {error && (
            <div className="alert alert-error mb-4 shadow-lg">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">{error}</span>
              <button 
                onClick={() => setError(null)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Search Bar */}
          <div className="form-control mb-4">
            <div className="relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar estudiante por nombre o email..."
                className="
                  input input-bordered w-full pl-10 sm:pl-12 pr-4 
                  bg-gray-800/50 border-gray-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/20
                  transition-all text-sm sm:text-base
                "
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Students List */}
          <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1 sm:pr-2 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-red-500 mb-3" />
                <p className="text-sm text-gray-400">Cargando estudiantes...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-16 bg-gray-800/30 rounded-xl border border-gray-700/50">
                <div className="p-4 bg-gray-700/30 rounded-full w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-8 h-8 sm:w-10 sm:h-10 text-gray-500" />
                </div>
                <p className="text-sm sm:text-base text-gray-400 mb-1">No se encontraron estudiantes</p>
                <p className="text-xs text-gray-500">
                  {searchTerm ? 'Intenta con otro término de búsqueda' : 'No hay estudiantes registrados'}
                </p>
              </div>
            ) : (
              filteredStudents.map((student) => {
                const isEnrolled = enrolledStudents.has(student.id);
                const isProcessing = actionLoading === student.id;

                return (
                  <div
                    key={student.id}
                    className={`
                      flex items-center gap-3 p-3 sm:p-4 rounded-xl border transition-all duration-200
                      ${isEnrolled 
                        ? 'bg-gradient-to-r from-green-500/10 to-green-600/5 border-green-500/30 shadow-lg shadow-green-500/5' 
                        : 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600 hover:bg-gray-800/70'
                      }
                    `}
                  >
                    {/* Avatar */}
                    <div className="avatar shrink-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-sm sm:text-base">
                          {student.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Student Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm sm:text-base text-white truncate mb-0.5">
                        {student.name}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-400 truncate">
                        {student.email}
                      </div>
                    </div>

                    {/* Belt Badge */}
                    <div className="badge badge-outline badge-sm shrink-0 hidden sm:flex">
                      {student.belt || 'Sin grado'}
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => isEnrolled ? handleUnenroll(student.id) : handleEnroll(student.id)}
                      disabled={isProcessing || (!isEnrolled && availableSlots === 0)}
                      className={`
                        btn btn-sm shrink-0 gap-1.5 sm:gap-2 transition-all duration-200
                        ${isEnrolled 
                          ? 'btn-error hover:btn-error shadow-lg shadow-red-500/20' 
                          : 'btn-success hover:btn-success shadow-lg shadow-green-500/20'
                        }
                        ${isProcessing ? 'loading' : ''}
                        ${(!isEnrolled && availableSlots === 0) ? 'btn-disabled opacity-50' : ''}
                      `}
                    >
                      {isProcessing ? (
                        <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                      ) : isEnrolled ? (
                        <>
                          <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="text-xs sm:text-sm">Inscrito</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="text-xs sm:text-sm">Inscribir</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gradient-to-t from-gray-900 via-gray-900 to-transparent border-t border-gray-700/50 backdrop-blur-xl p-4 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="text-xs sm:text-sm text-gray-400">
              {filteredStudents.length} estudiante{filteredStudents.length !== 1 ? 's' : ''} 
              {searchTerm && ' encontrado(s)'}
            </div>
            <button 
              onClick={onClose} 
              className="
                btn btn-ghost gap-2 hover:bg-gray-700/50 transition-all
                text-sm sm:text-base
              "
            >
              <X className="w-4 h-4" />
              Cerrar
            </button>
          </div>
        </div>
      </div>
      
      {/* Backdrop */}
      <div className="modal-backdrop bg-black/60 backdrop-blur-sm" onClick={onClose} />
    </div>
  );
}
