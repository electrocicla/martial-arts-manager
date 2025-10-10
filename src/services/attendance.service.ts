/**
 * Attendance Service
 * Handles all attendance-related operations following SRP
 */

import { apiClient, type ApiResponse } from '../lib/api-client';
import type { Attendance } from '../types/index';

export interface AttendanceFilters {
  classId?: string;
  studentId?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  attended?: boolean;
}

export interface AttendanceRecord {
  classId: string;
  studentId: string;
  attended: boolean;
  notes?: string;
}

export interface AttendanceStats {
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  attendanceRate: number;
  byClass: Record<string, { present: number; total: number; rate: number }>;
}

export class AttendanceService {
  private readonly endpoint = '/api/attendance';

  async getAll(filters?: AttendanceFilters): Promise<ApiResponse<Attendance[]>> {
    const params = new URLSearchParams();

    if (filters?.classId) params.append('classId', filters.classId);
    if (filters?.studentId) params.append('studentId', filters.studentId);
    if (filters?.date) params.append('date', filters.date);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.attended !== undefined) params.append('attended', filters.attended.toString());

    const query = params.toString();
    const endpoint = query ? `${this.endpoint}?${query}` : this.endpoint;

    return apiClient.get<Attendance[]>(endpoint);
  }

  async getById(id: string): Promise<ApiResponse<Attendance>> {
    return apiClient.get<Attendance>(`${this.endpoint}/${id}`);
  }

  async create(data: AttendanceRecord): Promise<ApiResponse<Attendance>> {
    const payload = {
      id: crypto.randomUUID(),
      class_id: data.classId,
      student_id: data.studentId,
      attended: data.attended ? 1 : 0,
      notes: data.notes || undefined,
      check_in_time: new Date().toISOString(),
    };

    return apiClient.post<Attendance>(this.endpoint, payload);
  }

  async update(id: string, data: Partial<AttendanceRecord>): Promise<ApiResponse<Attendance>> {
    const payload: Partial<Pick<Attendance, 'attended' | 'notes'>> = {};
    if (data.attended !== undefined) payload.attended = data.attended ? 1 : 0;
    if (data.notes !== undefined) payload.notes = data.notes;

    return apiClient.put<Attendance>(`${this.endpoint}/${id}`, payload);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.endpoint}/${id}`);
  }

  async getByClass(classId: string): Promise<ApiResponse<Attendance[]>> {
    return this.getAll({ classId });
  }

  async getByStudent(studentId: string): Promise<ApiResponse<Attendance[]>> {
    return this.getAll({ studentId });
  }

  async markAttendance(record: AttendanceRecord): Promise<ApiResponse<Attendance>> {
    return this.create(record);
  }

  async markPresent(studentId: string, classId: string): Promise<ApiResponse<Attendance>> {
    return this.create({ classId, studentId, attended: true });
  }

  async markAbsent(studentId: string, classId: string): Promise<ApiResponse<Attendance>> {
    return this.create({ classId, studentId, attended: false });
  }

  async getStats(classId?: string): Promise<ApiResponse<AttendanceStats>> {
    const endpoint = classId ? `${this.endpoint}?classId=${classId}` : '/api/attendance';
    const response = await apiClient.get<Attendance[]>(endpoint);

    if (!response.success || !response.data) {
      return { success: false, error: response.error };
    }

    const records = response.data;
    const stats: AttendanceStats = {
      totalRecords: records.length,
      presentCount: 0,
      absentCount: 0,
      attendanceRate: 0,
      byClass: {},
    };

    records.forEach((record: Attendance) => {
      if (record.attended) {
        stats.presentCount++;
      } else {
        stats.absentCount++;
      }

      // Group by class
      if (!stats.byClass[record.class_id]) {
        stats.byClass[record.class_id] = { present: 0, total: 0, rate: 0 };
      }

      stats.byClass[record.class_id].total++;
      if (record.attended) {
        stats.byClass[record.class_id].present++;
      }
    });

    // Calculate rates
    stats.attendanceRate = stats.totalRecords > 0 ? (stats.presentCount / stats.totalRecords) * 100 : 0;

    Object.keys(stats.byClass).forEach(classId => {
      const classStats = stats.byClass[classId];
      classStats.rate = classStats.total > 0 ? (classStats.present / classStats.total) * 100 : 0;
    });

    return { data: stats, success: true };
  }

  async getAttendanceRate(studentId: string): Promise<ApiResponse<number>> {
    const response = await this.getByStudent(studentId);
    if (!response.success || !response.data) {
      return { success: false, error: response.error };
    }

    const records = response.data;
    if (records.length === 0) return { data: 0, success: true };

    const presentCount = records.filter((record: Attendance) => record.attended).length;
    const rate = (presentCount / records.length) * 100;

    return { data: rate, success: true };
  }
}

// Create singleton instance
export const attendanceService = new AttendanceService();