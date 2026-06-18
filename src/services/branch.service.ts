import { apiClient, type ApiResponse } from '../lib/api-client';
import type { BranchSummary } from '../types';

export interface BranchWriteInput {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  notes?: string;
  isActive?: boolean;
  instructorIds?: string[];
}

export interface BranchTransferInput {
  targetBranchId: string;
  studentIds?: string[];
  classIds?: string[];
  disciplines?: string[];
  reason?: string;
}

interface BranchListResponse {
  branches: BranchSummary[];
}

interface BranchMutationResponse {
  success: boolean;
  branchId?: string;
}

interface BranchTransferResponse {
  success: boolean;
  transferred: number;
  sourceBranchId: string;
  targetBranchId: string;
  startedAt: string;
}

export class BranchService {
  private readonly endpoint = '/api/branches';

  async getAll(options?: { signal?: AbortSignal }): Promise<ApiResponse<BranchListResponse>> {
    return apiClient.get<BranchListResponse>(this.endpoint, { signal: options?.signal });
  }

  async create(input: BranchWriteInput): Promise<ApiResponse<BranchMutationResponse>> {
    return apiClient.post<BranchMutationResponse>(this.endpoint, input);
  }

  async update(id: string, input: Partial<BranchWriteInput>): Promise<ApiResponse<BranchMutationResponse>> {
    return apiClient.put<BranchMutationResponse>(this.endpoint, { id, ...input });
  }

  async transferStudents(input: BranchTransferInput): Promise<ApiResponse<BranchTransferResponse>> {
    return apiClient.post<BranchTransferResponse>(`${this.endpoint}/transfer`, input);
  }
}

export const branchService = new BranchService();
