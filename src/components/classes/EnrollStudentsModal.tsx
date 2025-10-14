import { useState, useEffect } from 'react';
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

  // Fetch enrolled students when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchEnrolledStudents();
    }
  }, [isOpen, classId]);

  const fetchEnrolledStudents = async () => {
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
  };

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
    } catch (err: any) {
      console.error('Error enrolling student:', err);
      setError(err.message || 'Error al inscribir estudiante');
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
    } catch (err: any) {
      console.error('Error unenrolling student:', err);
      setError(err.message || 'Error al desinscribir estudiante');
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
      <div className="modal-box max-w-3xl bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-700/50">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-red-500/10">
                <UserPlus className="w-6 h-6 text-red-400" />
              </div>
              Gestionar Estudiantes
            </h3>
            <p className="text-gray-400 text-sm ml-14">{className}</p>
            <div className="mt-3 ml-14 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-gray-400">Inscritos:</span>
                <span className="font-bold text-white">{enrolledStudents.size}/{maxStudents}</span>
              </div>
              {availableSlots > 0 ? (
                <div className={`badge ${availableSlots <= 3 ? 'badge-warning' : 'badge-success'} badge-sm`}>
                  {availableSlots} cupos disponibles
                </div>
              ) : (
                <div className="badge badge-error badge-sm">
                  Clase llena
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-error mb-4">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Search Bar */}
        <div className="form-control mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar estudiante por nombre o email..."
              className="input input-bordered w-full pl-10 bg-gray-800/50 border-gray-700 focus:border-red-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Students List */}
        <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No se encontraron estudiantes</p>
            </div>
          ) : (
            filteredStudents.map((student) => {
              const isEnrolled = enrolledStudents.has(student.id);
              const isProcessing = actionLoading === student.id;

              return (
                <div
                  key={student.id}
                  className={`
                    flex items-center justify-between p-4 rounded-lg border transition-all
                    ${isEnrolled 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600'
                    }
                  `}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="avatar">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {student.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Student Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white truncate">{student.name}</div>
                      <div className="text-sm text-gray-400 truncate">{student.email}</div>
                    </div>

                    {/* Belt Badge */}
                    <div className="badge badge-outline badge-sm shrink-0">
                      {student.belt || 'Sin grado'}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => isEnrolled ? handleUnenroll(student.id) : handleEnroll(student.id)}
                    disabled={isProcessing || (!isEnrolled && availableSlots === 0)}
                    className={`
                      btn btn-sm ml-3 shrink-0
                      ${isEnrolled 
                        ? 'btn-error' 
                        : 'btn-success'
                      }
                    `}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isEnrolled ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span className="hidden sm:inline">Inscrito</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span className="hidden sm:inline">Inscribir</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="modal-action">
          <button onClick={onClose} className="btn btn-ghost">
            Cerrar
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
