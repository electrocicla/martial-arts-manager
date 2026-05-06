/**
 * Sparring + Tournaments + Progression API client.
 * Thin wrapper over apiClient that the React layer should use.
 */

import { apiClient, type ApiResponse } from '../lib/api-client';
import type { ProgressionEvaluation } from '../lib/beltProgression';

export interface SparringSession {
  id: string;
  student_id: string;
  class_id: string | null;
  instructor_id: string | null;
  sessions_count: number;
  session_date: string;
  intensity: string | null;
  partner_name: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  student_name?: string;
  class_name?: string;
}

export interface TournamentParticipation {
  id: string;
  student_id: string;
  tournament_name: string;
  tournament_date: string;
  belt_at_time: string | null;
  placement: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  student_name?: string;
}

export interface SparringFilters {
  studentId?: string;
  classId?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface QuickAddPayload {
  student_id: string;
  increment?: number;
  class_id?: string | null;
  intensity?: string | null;
  notes?: string | null;
}

export interface QuickAddResponse {
  success: boolean;
  sparring_total: number;
  progression: ProgressionEvaluation | null;
}

export interface ProgressionPayload {
  student: { id: string; name: string; belt: string; discipline: string };
  progression: ProgressionEvaluation;
}

const SPARRING = '/api/sparring';
const TOURNAMENTS = '/api/tournaments';

export const sparringService = {
  async list(filters: SparringFilters = {}): Promise<ApiResponse<{ sessions: SparringSession[] }>> {
    const params = new URLSearchParams();
    if (filters.studentId) params.append('student_id', filters.studentId);
    if (filters.classId)   params.append('class_id', filters.classId);
    if (filters.date)      params.append('date', filters.date);
    if (filters.dateFrom)  params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo)    params.append('dateTo', filters.dateTo);
    const q = params.toString();
    return apiClient.get<{ sessions: SparringSession[] }>(q ? `${SPARRING}?${q}` : SPARRING);
  },

  async create(payload: Omit<SparringSession, 'id' | 'created_at' | 'updated_at' | 'instructor_id' | 'created_by'> & { sessions_count?: number }): Promise<ApiResponse<{ id: string; success: boolean }>> {
    return apiClient.post<{ id: string; success: boolean }>(SPARRING, payload);
  },

  async update(payload: { id: string } & Partial<Pick<SparringSession, 'sessions_count' | 'session_date' | 'intensity' | 'partner_name' | 'notes'>>): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.put<{ success: boolean }>(SPARRING, payload);
  },

  async remove(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.delete<{ success: boolean }>(`${SPARRING}?id=${encodeURIComponent(id)}`);
  },

  async quickAdd(payload: QuickAddPayload): Promise<ApiResponse<QuickAddResponse>> {
    return apiClient.post<QuickAddResponse>(`${SPARRING}/quick-add`, payload);
  },
};

export const tournamentService = {
  async list(studentId?: string): Promise<ApiResponse<{ tournaments: TournamentParticipation[] }>> {
    const url = studentId ? `${TOURNAMENTS}?student_id=${encodeURIComponent(studentId)}` : TOURNAMENTS;
    return apiClient.get<{ tournaments: TournamentParticipation[] }>(url);
  },

  async create(payload: Omit<TournamentParticipation, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<{ id: string; success: boolean }>> {
    return apiClient.post<{ id: string; success: boolean }>(TOURNAMENTS, payload);
  },

  async remove(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.delete<{ success: boolean }>(`${TOURNAMENTS}?id=${encodeURIComponent(id)}`);
  },
};

export const progressionService = {
  async getMyProgression(): Promise<ApiResponse<ProgressionPayload>> {
    return apiClient.get<ProgressionPayload>('/api/student/progression');
  },

  async getStudentProgression(studentId: string): Promise<ApiResponse<ProgressionPayload>> {
    return apiClient.get<ProgressionPayload>(`/api/students/${encodeURIComponent(studentId)}/progression`);
  },
};
