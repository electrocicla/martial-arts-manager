import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { StudentBeltTesting, AdminBeltTesting } from '../components/belttesting';
import { useStudents } from '../hooks/useStudents';
import { useAttendance } from '../hooks/useAttendance';
import { calculateEligibleStudents, getNextBelt, getRequiredClasses } from '../lib/beltTestingUtils';
import { apiClient } from '../lib/api-client';

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

export default function BeltTesting() {
  const { user } = useAuth();
  const { students } = useStudents();
  const { attendance } = useAttendance();
  
  const [exams, setExams] = useState<BeltExam[]>([]);
  const [assignments, setAssignments] = useState<ExamAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Load belt exams
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

  // Load exam assignments
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
        setExams([...exams, response.data]);
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
        setExams(exams.map(e => e.id === id ? response.data! : e));
      }
    } catch (error) {
      console.error('Failed to update exam:', error);
      throw error;
    }
  };

  const handleDeleteExam = async (id: string) => {
    try {
      await apiClient.delete(`/api/belt-exams?id=${id}`);
      setExams(exams.filter(e => e.id !== id));
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
        setAssignments([...assignments, response.data]);
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

  // Student View
  if (user?.role === 'student') {
    // Find current student's data
    const currentStudent = students.find(s => s.id === user.student_id);
    
    if (!currentStudent) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="alert alert-warning">
            <span>Student profile not found</span>
          </div>
        </div>
      );
    }

    // Calculate student progress
    const studentAttendance = attendance.filter(a => a.student_id === currentStudent.id && a.attended === 1);
    const classesAttended = studentAttendance.length;
    const requiredClasses = getRequiredClasses(currentStudent.belt);
    const nextBelt = getNextBelt(currentStudent.belt, currentStudent.discipline);

    const studentProgress = {
      currentBelt: currentStudent.belt,
      classesAttended,
      requiredClasses,
      nextBelt,
    };

    return (
      <StudentBeltTesting
        assignments={assignments}
        studentProgress={studentProgress}
      />
    );
  }

  // Admin/Instructor View
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
