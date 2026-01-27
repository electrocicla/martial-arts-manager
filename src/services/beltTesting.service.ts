/**
 * Belt Testing Service
 * Handles API calls for belt examination management
 */

import { apiClient } from './api.client';
import type { ApiResponse } from './api.client';

export interface BeltExam {
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

export interface ExamAssignment {
  id: string;
  exam_id: string;
  student_id: string;
  status: string;
  result?: string;
  score?: number;
  feedback?: string;
  assigned_at: string;
  completed_at?: string;
}

export interface CreateExamData {
  belt_level: string;
  exam_date: string;
  exam_time: string;
  location: string;
  examiner_id: string;
  discipline: string;
  max_candidates?: number;
  notes?: string;
}

export interface UpdateExamData {
  id: string;
  belt_level?: string;
  exam_date?: string;
  exam_time?: string;
  location?: string;
  examiner_id?: string;
  status?: 'scheduled' | 'completed' | 'cancelled';
  max_candidates?: number;
  notes?: string;
}

export interface AssignStudentData {
  exam_id: string;
  student_id: string;
}

export interface UpdateAssignmentData {
  id: string;
  status?: string;
  result?: string;
  score?: number;
  feedback?: string;
}

export class BeltTestingService {
  private endpoint = '/api/belt-exams';

  async getExams(status?: string): Promise<ApiResponse<BeltExam[]>> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    const query = params.toString();
    const url = query ? `${this.endpoint}?${query}` : this.endpoint;
    return apiClient.get<BeltExam[]>(url);
  }

  async createExam(data: CreateExamData): Promise<ApiResponse<BeltExam>> {
    return apiClient.post<BeltExam>(this.endpoint, data);
  }

  async updateExam(data: UpdateExamData): Promise<ApiResponse<BeltExam>> {
    return apiClient.put<BeltExam>(this.endpoint, data);
  }

  async deleteExam(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`${this.endpoint}?id=${id}`);
  }

  async getAssignments(examId?: string, studentId?: string): Promise<ApiResponse<ExamAssignment[]>> {
    const params = new URLSearchParams();
    if (examId) params.append('exam_id', examId);
    if (studentId) params.append('student_id', studentId);
    const query = params.toString();
    const url = query ? `${this.endpoint}/assignments?${query}` : `${this.endpoint}/assignments`;
    return apiClient.get<ExamAssignment[]>(url);
  }

  async assignStudent(data: AssignStudentData): Promise<ApiResponse<ExamAssignment>> {
    return apiClient.post<ExamAssignment>(`${this.endpoint}/assignments`, data);
  }

  async updateAssignment(data: UpdateAssignmentData): Promise<ApiResponse<ExamAssignment>> {
    return apiClient.put<ExamAssignment>(`${this.endpoint}/assignments`, data);
  }

  async removeAssignment(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`${this.endpoint}/assignments?id=${id}`);
  }
}

export const beltTestingService = new BeltTestingService();
