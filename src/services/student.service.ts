/**
 * Student Service
 * Handles all student-related operations following SRP
 */

import { apiClient, type ApiResponse } from '../lib/api-client';
import type { Student, StudentFormData } from '../types/index';

export interface StudentFilters {
  belt?: string;
  discipline?: string;
  isActive?: boolean;
  search?: string;
}

export interface StudentStats {
  total: number;
  active: number;
  byBelt: Record<string, number>;
  byDiscipline: Record<string, number>;
}

export class StudentService {
  private readonly endpoint = '/api/students';

  async getAll(filters?: StudentFilters): Promise<ApiResponse<Student[]>> {
    const params = new URLSearchParams();

    if (filters?.belt) params.append('belt', filters.belt);
    if (filters?.discipline) params.append('discipline', filters.discipline);
    if (filters?.isActive !== undefined) params.append('is_active', filters.isActive.toString());
    if (filters?.search) params.append('search', filters.search);

    const query = params.toString();
    const endpoint = query ? `${this.endpoint}?${query}` : this.endpoint;

    return apiClient.get<Student[]>(endpoint);
  }

  async getById(id: string): Promise<ApiResponse<Student>> {
    return apiClient.get<Student>(`${this.endpoint}/${id}`);
  }

  async create(data: StudentFormData): Promise<ApiResponse<Student>> {
    const payload = {
      id: crypto.randomUUID(),
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      belt: data.belt,
      discipline: data.discipline,
      join_date: new Date().toISOString().split('T')[0],
      date_of_birth: data.dateOfBirth || undefined,
      emergency_contact_name: data.emergencyContactName || undefined,
      emergency_contact_phone: data.emergencyContactPhone || undefined,
      notes: data.notes || undefined,
    };

    return apiClient.post<Student>(this.endpoint, payload);
  }

  async update(id: string, data: Partial<StudentFormData>): Promise<ApiResponse<Student>> {
    return apiClient.put<Student>(`${this.endpoint}/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.endpoint}/${id}`);
  }

  async getStats(): Promise<ApiResponse<StudentStats>> {
    const response = await this.getAll();
    if (!response.success || !response.data) {
      return { success: false, error: response.error };
    }

    const students = response.data;
    const stats: StudentStats = {
      total: students.length,
      active: students.filter((s: Student) => s.is_active).length,
      byBelt: {},
      byDiscipline: {},
    };

    students.forEach((student: Student) => {
      // Count by belt
      stats.byBelt[student.belt] = (stats.byBelt[student.belt] || 0) + 1;

      // Count by discipline
      stats.byDiscipline[student.discipline] = (stats.byDiscipline[student.discipline] || 0) + 1;
    });

    return { data: stats, success: true };
  }
}

// Create singleton instance
export const studentService = new StudentService();