/**
 * Class Service
 * Handles all class-related operations following SRP
 */

import { apiClient, type ApiResponse } from '../lib/api-client';
import type { Class, ClassFormData } from '../types/index';

export interface ClassFilters {
  discipline?: string;
  instructor?: string;
  date?: string;
  isActive?: boolean;
}

export interface ClassStats {
  total: number;
  active: number;
  byDiscipline: Record<string, number>;
  byInstructor: Record<string, number>;
  upcoming: number;
}

export interface ClassMetadata {
  disciplines: string[];
  locations: string[];
  instructors: string[];
}

export class ClassService {
  private readonly endpoint = '/api/classes';

  async getAll(filters?: ClassFilters): Promise<ApiResponse<Class[]>> {
    const params = new URLSearchParams();

    if (filters?.discipline) params.append('discipline', filters.discipline);
    if (filters?.instructor) params.append('instructor', filters.instructor);
    if (filters?.date) params.append('date', filters.date);
    if (filters?.isActive !== undefined) params.append('is_active', filters.isActive.toString());

    const query = params.toString();
    const endpoint = query ? `${this.endpoint}?${query}` : this.endpoint;

    return apiClient.get<Class[]>(endpoint);
  }

  async getById(id: string): Promise<ApiResponse<Class>> {
    return apiClient.get<Class>(`${this.endpoint}/${id}`);
  }

  async create(data: ClassFormData): Promise<ApiResponse<Class>> {
    const payload = {
      id: crypto.randomUUID(),
      name: data.name,
      discipline: data.discipline,
      date: data.date,
      time: data.time,
      location: data.location,
      instructor: data.instructor,
      maxStudents: data.maxStudents,  // ✅ Keep camelCase as backend expects
      description: data.description || undefined,
      isRecurring: data.isRecurring || false,  // ✅ Keep camelCase as backend expects
      recurrencePattern: data.recurrencePattern ? JSON.stringify(data.recurrencePattern) : undefined,  // ✅ Keep camelCase as backend expects
      parentCourseId: (data as { parentCourseId?: string }).parentCourseId, // optional idempotency key
    };

    return apiClient.post<Class>(this.endpoint, payload);
  }

  async update(id: string, data: Partial<ClassFormData>): Promise<ApiResponse<Class | Class[]>> {
    // Serialize recurrencePattern if provided to match backend expectations
    const payload: Record<string, unknown> = { ...data };
    if (data.recurrencePattern) payload.recurrencePattern = JSON.stringify(data.recurrencePattern);
    return apiClient.put<Class | Class[]>(`${this.endpoint}/${id}`, payload);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.endpoint}/${id}`);
  }

  async getStats(): Promise<ApiResponse<ClassStats>> {
    const response = await this.getAll();
    if (!response.success || !response.data) {
      return { success: false, error: response.error };
    }

    const classes = response.data;
    const now = new Date();
    const stats: ClassStats = {
      total: classes.length,
      active: classes.filter((c: Class) => c.is_active).length,
      byDiscipline: {},
      byInstructor: {},
      upcoming: 0,
    };

    classes.forEach((cls: Class) => {
      // Count by discipline
      stats.byDiscipline[cls.discipline] = (stats.byDiscipline[cls.discipline] || 0) + 1;

      // Count by instructor
      stats.byInstructor[cls.instructor] = (stats.byInstructor[cls.instructor] || 0) + 1;

      // Count upcoming classes
      const classDateTime = new Date(`${cls.date}T${cls.time}`);
      if (classDateTime > now) {
        stats.upcoming++;
      }
    });

    return { data: stats, success: true };
  }

  async getUpcoming(limit = 10): Promise<ApiResponse<Class[]>> {
    const response = await this.getAll({ isActive: true });
    if (!response.success || !response.data) {
      return { success: false, error: response.error };
    }

    const now = new Date();
    const upcoming = response.data
      .filter((cls: Class) => new Date(`${cls.date}T${cls.time}`) > now)
      .sort((a: Class, b: Class) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, limit);

    return { data: upcoming, success: true };
  }

  async getMetadata(): Promise<ApiResponse<ClassMetadata>> {
    return apiClient.get<ClassMetadata>('/api/classes/metadata');
  }

  // Fetch comments for a specific class (generated session)
  async getComments(classId: string): Promise<ApiResponse<Array<{id:string;comment:string;author_id:string;created_at:string}>>> {
    return apiClient.get<Array<{id:string;comment:string;author_id:string;created_at:string}>>(`/api/classes/${classId}/comments`);
  }

  async addComment(classId: string, comment: string): Promise<ApiResponse<{id:string;comment:string;author_id:string;created_at:string}>> {
    return apiClient.post<{id:string;comment:string;author_id:string;created_at:string}>(`/api/classes/${classId}/comments`, { comment });
  }
}

// Create singleton instance
export const classService = new ClassService();