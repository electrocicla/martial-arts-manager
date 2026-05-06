import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { StudentBeltTesting, AdminBeltTesting } from '../components/belttesting';
import { useStudents } from '../hooks/useStudents';
import { useAttendance } from '../hooks/useAttendance';
import { calculateEligibleStudents } from '../lib/beltTestingUtils';
import { apiClient } from '../lib/api-client';
import { progressionService } from '../services/progression.service';
import type { ProgressionEvaluation } from '../lib/beltProgression';
import type { Student } from '../types/index';

interface BeltExam {
  id: string;
  belt_level: string;
  exam_date: string;
  exam_time: string;
  location: string;
  examiner_id: string;
  examiner_name?: string;
  discipline: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  max_candidates: number;
  assigned_count: number;
  passed_count: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

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

// Separate component for student view — never calls useStudents (which is admin-only)
function StudentBeltTestingView({ studentId }: { studentId: string }) {
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [assignments, setAssignments] = useState<ExamAssignment[]>([]);
  const [progression, setProgression] = useState<ProgressionEvaluation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, assignmentsRes, progressionRes] = await Promise.all([
          apiClient.get<{ student: Student }>(`/api/students/${studentId}`),
          apiClient.get<ExamAssignment[]>('/api/belt-exams/assignments'),
          progressionService.getMyProgression(),
        ]);
        if (profileRes.success && profileRes.data) {
          setCurrentStudent(profileRes.data.student);
        }
        if (assignmentsRes.success && assignmentsRes.data) {
          setAssignments(assignmentsRes.data);
        }
        if (progressionRes.success && progressionRes.data) {
          setProgression(progressionRes.data.progression);
        }
      } catch (error) {
        console.error('Failed to load student belt testing data:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  if (!currentStudent) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="alert alert-warning">
          <span>Student profile not found</span>
        </div>
      </div>
    );
  }

  return (
    <StudentBeltTesting
      studentName={currentStudent.name}
      discipline={currentStudent.discipline}
      assignments={assignments}
      progression={progression}
    />
  );
}

// Separate component for admin/instructor view
function AdminBeltTestingView() {
  const { students } = useStudents();
  const { attendance } = useAttendance();

  const [exams, setExams] = useState<BeltExam[]>([]);
  const [, setAssignments] = useState<ExamAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadExams = async () => {
      try {
        const response = await apiClient.get<BeltExam[]>('/api/belt-exams');
        if (response.success && response.data) {
          setExams(response.data);
        }
      } catch (error) {
        console.error('Failed to load belt exams:', error);
      } finally {
        setLoading(false);
      }
    };
    loadExams();
  }, []);

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const response = await apiClient.get<ExamAssignment[]>('/api/belt-exams/assignments');
        if (response.success && response.data) {
          setAssignments(response.data);
        }
      } catch (error) {
        console.error('Failed to load exam assignments:', error);
      }
    };
    loadAssignments();
  }, []);

  const handleCreateExam = async (examData: Omit<BeltExam, 'id' | 'created_at' | 'updated_at' | 'assigned_count' | 'passed_count'>) => {
    try {
      const response = await apiClient.post<BeltExam>('/api/belt-exams', examData);
      if (response.success && response.data) {
        setExams(prev => [...prev, response.data!]);
      }
    } catch (error) {
      console.error('Failed to create exam:', error);
      throw error;
    }
  };

  const handleUpdateExam = async (id: string, updates: Partial<BeltExam>) => {
    try {
      const response = await apiClient.put<BeltExam>('/api/belt-exams', { id, ...updates });
      if (response.success && response.data) {
        setExams(prev => prev.map(e => e.id === id ? response.data! : e));
      }
    } catch (error) {
      console.error('Failed to update exam:', error);
      throw error;
    }
  };

  const handleDeleteExam = async (id: string) => {
    try {
      await apiClient.delete(`/api/belt-exams?id=${id}`);
      setExams(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error('Failed to delete exam:', error);
      throw error;
    }
  };

  const handleAssignStudent = async (examId: string, studentId: string) => {
    try {
      const response = await apiClient.post<ExamAssignment>('/api/belt-exams/assignments', {
        exam_id: examId,
        student_id: studentId,
      });
      if (response.success && response.data) {
        setAssignments(prev => [...prev, response.data!]);
      }
    } catch (error) {
      console.error('Failed to assign student:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  const eligibleStudents = calculateEligibleStudents(students, attendance);

  return (
    <AdminBeltTesting
      exams={exams}
      eligibleStudents={eligibleStudents}
      onCreateExam={handleCreateExam}
      onUpdateExam={handleUpdateExam}
      onDeleteExam={handleDeleteExam}
      onAssignStudent={handleAssignStudent}
    />
  );
}

export default function BeltTesting() {
  const { user } = useAuth();

  if (user?.role === 'student') {
    return <StudentBeltTestingView studentId={user.student_id ?? ''} />;
  }

  return <AdminBeltTestingView />;
}
