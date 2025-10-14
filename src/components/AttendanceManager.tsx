import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, Clock, MapPin, User, Search } from 'lucide-react';
import { useAttendance } from '../hooks/useAttendance';
import { useClasses } from '../hooks/useClasses';
import { AttendanceList } from './attendance/AttendanceList';
import { AttendanceStats } from './attendance/AttendanceStats';
import { apiClient } from '../lib/api-client';
import type { Student } from '../types/index';
import { useTranslation } from 'react-i18next';

interface EnrolledStudent extends Student {
  attended?: number;
  check_in_time?: string;
}

export default function AttendanceManager() {
  const { t } = useTranslation();
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { classes } = useClasses();
  const { markPresent, markAbsent } = useAttendance();
  
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});

  const classInfo = classes.find(c => c.id === classId);

  // Fetch enrolled students
  useEffect(() => {
    const fetchEnrolledStudents = async () => {
      if (!classId) return;
      
      setLoading(true);
      try {
        const response = await apiClient.get<EnrolledStudent[]>(`/api/classes/${classId}/students`);
        if (response.success && response.data) {
          setEnrolledStudents(response.data);
          // Initialize attendance state
          const attendanceState: Record<string, boolean> = {};
          response.data.forEach(student => {
            attendanceState[student.id] = student.attended === 1;
          });
          setAttendance(attendanceState);
        }
      } catch (error) {
        console.error('Error fetching enrolled students:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledStudents();
  }, [classId]);

  const toggleAttendance = async (studentId: string) => {
    if (!classId) return;

    const newAttended = !attendance[studentId];
    
    // Optimistic update
    setAttendance(prev => ({ ...prev, [studentId]: newAttended }));

    const result = newAttended
      ? await markPresent(studentId, classId)
      : await markAbsent(studentId, classId);

    if (!result) {
      // Revert on error
      setAttendance(prev => ({ ...prev, [studentId]: !newAttended }));
    }
  };

  const filteredStudents = enrolledStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const presentCount = Object.values(attendance).filter(Boolean).length;
  const totalCount = enrolledStudents.length;
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-base-content/60">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-black to-red-900/20 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <button 
            onClick={() => navigate('/classes')}
            className="btn btn-ghost btn-sm mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.back')}
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-red-600/30">
              <Users className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-base-content">
                {t('attendance.title')}
              </h1>
              {classInfo && (
                <p className="text-sm text-base-content/70">{classInfo.name}</p>
              )}
            </div>
          </div>

          {/* Class Info */}
          {classInfo && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div className="flex items-center gap-2 text-sm text-base-content/70">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>{new Date(classInfo.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-base-content/70">
                <Clock className="w-4 h-4 text-green-400" />
                <span>{classInfo.time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-base-content/70">
                <MapPin className="w-4 h-4 text-purple-400" />
                <span>{classInfo.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-base-content/70">
                <User className="w-4 h-4 text-yellow-400" />
                <span>{classInfo.instructor}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-6 max-w-7xl mx-auto">
        {/* Stats */}
        <AttendanceStats 
          presentCount={presentCount}
          totalCount={totalCount}
          attendanceRate={attendanceRate}
        />

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('attendance.searchStudents')}
            className="input input-bordered w-full pl-10 bg-gray-800 border-gray-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Attendance List */}
        {enrolledStudents.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700/50">
            <div className="max-w-md mx-auto px-4">
              <div className="p-4 bg-red-500/10 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Users className="w-10 h-10 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{t('attendance.noStudentsEnrolled')}</h3>
              <p className="text-base-content/60 mb-6">{t('attendance.enrollStudentsFirst')}</p>
              <button 
                className="btn btn-primary gap-2"
                onClick={() => navigate(`/classes/${classId}/enroll`)}
              >
                <Users className="w-5 h-5" />
                {t('attendance.enrollStudents')}
              </button>
            </div>
          </div>
        ) : (
          <AttendanceList 
            students={filteredStudents}
            attendance={attendance}
            onToggleAttendance={toggleAttendance}
          />
        )}
      </div>
    </div>
  );
}