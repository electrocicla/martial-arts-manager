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
    <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 pb-24 md:pb-10">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 backdrop-blur-sm border-b-2 border-base-300">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <button 
            onClick={() => navigate('/classes')}
            className="btn btn-ghost btn-lg gap-3 mb-6 shadow-md hover:shadow-lg rounded-2xl"
          >
            <ArrowLeft className="w-6 h-6" />
            {t('common.back')}
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-primary/50 shadow-lg">
              <Users className="w-10 h-10 text-primary-content" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-base-content bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {t('attendance.title')}
              </h1>
              {classInfo && (
                <p className="text-base text-base-content/70 mt-1">{classInfo.name}</p>
              )}
            </div>
          </div>

          {/* Class Info */}
          {classInfo && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="flex items-center gap-3 p-4 bg-base-200 rounded-2xl border border-base-300 shadow-md">
                <Calendar className="w-6 h-6 text-primary flex-shrink-0" />
                <span className="text-sm font-medium text-base-content">{new Date(classInfo.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-base-200 rounded-2xl border border-base-300 shadow-md">
                <Clock className="w-6 h-6 text-success flex-shrink-0" />
                <span className="text-sm font-medium text-base-content">{classInfo.time}</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-base-200 rounded-2xl border border-base-300 shadow-md">
                <MapPin className="w-6 h-6 text-accent flex-shrink-0" />
                <span className="text-sm font-medium text-base-content truncate">{classInfo.location}</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-base-200 rounded-2xl border border-base-300 shadow-md">
                <User className="w-6 h-6 text-warning flex-shrink-0" />
                <span className="text-sm font-medium text-base-content truncate">{classInfo.instructor}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-8 max-w-7xl mx-auto space-y-8">
        {/* Stats */}
        <AttendanceStats 
          presentCount={presentCount}
          totalCount={totalCount}
          attendanceRate={attendanceRate}
        />

        {/* Search */}
        <div className="form-control">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-base-content/50" />
            <input
              type="text"
              placeholder={t('attendance.searchStudents')}
              className="input input-bordered input-lg w-full pl-14 bg-base-200 border-base-300 focus:border-primary rounded-2xl shadow-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Attendance List */}
        {enrolledStudents.length === 0 ? (
          <div className="card bg-base-200 border-2 border-base-300 shadow-2xl rounded-3xl">
            <div className="card-body items-center text-center py-20">
              <div className="p-6 rounded-full bg-primary/10 w-28 h-28 mx-auto mb-6 flex items-center justify-center">
                <Users className="w-16 h-16 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-base-content mb-3">{t('attendance.noStudentsEnrolled')}</h3>
              <p className="text-base-content/70 mb-8 max-w-md">{t('attendance.enrollStudentsFirst')}</p>
              <button 
                className="btn btn-primary btn-lg gap-3 shadow-lg hover:shadow-xl rounded-2xl"
                onClick={() => navigate(`/classes/${classId}/enroll`)}
              >
                <Users className="w-6 h-6" />
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