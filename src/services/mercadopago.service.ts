/**
 * MercadoPago client-side service.
 *
 * Wraps the `/api/payments/mercadopago/*` endpoints. SRP: this module only
 * speaks HTTP — UI logic stays in components/hooks.
 */
import { apiClient, type ApiResponse } from '../lib/api-client';
import type {
  MercadoPagoConfigDTO,
  MercadoPagoPreferenceResult,
  MercadoPagoStatusDTO,
} from '../types/index';

export interface MercadoPagoTestResult {
  ok: boolean;
  mercadopago_user_id?: number;
  nickname?: string | null;
  email?: string | null;
  site_id?: string | null;
  error?: string;
  detail?: string;
}

export interface CreatePreferenceInput {
  studentId: string;
  amount?: number;
  type?: 'monthly' | 'drop-in' | 'private' | 'equipment' | 'other';
  notes?: string;
}

export interface MercadoPagoConfigInput {
  enabled?: boolean;
  accessToken?: string;
  publicKey?: string;
  webhookSecret?: string;
  accountEmail?: string;
  currency?: string;
  defaultAmount?: number;
  successUrl?: string;
  failureUrl?: string;
  pendingUrl?: string;
  notificationUrl?: string;
}

export const mercadoPagoService = {
  getConfig(reveal = false): Promise<ApiResponse<MercadoPagoConfigDTO>> {
    const path = reveal
      ? '/api/payments/mercadopago/config?reveal=1'
      : '/api/payments/mercadopago/config';
    return apiClient.get<MercadoPagoConfigDTO>(path);
  },

  saveConfig(input: MercadoPagoConfigInput): Promise<ApiResponse<MercadoPagoConfigDTO>> {
    return apiClient.put<MercadoPagoConfigDTO>('/api/payments/mercadopago/config', input);
  },

  getStatus(): Promise<ApiResponse<MercadoPagoStatusDTO>> {
    return apiClient.get<MercadoPagoStatusDTO>('/api/payments/mercadopago/status');
  },

  testCredentials(accessToken: string): Promise<ApiResponse<MercadoPagoTestResult>> {
    return apiClient.post<MercadoPagoTestResult>('/api/payments/mercadopago/test', { accessToken });
  },

  createPreference(input: CreatePreferenceInput): Promise<ApiResponse<MercadoPagoPreferenceResult>> {
    return apiClient.post<MercadoPagoPreferenceResult>('/api/payments/mercadopago/preference', input);
  },
};

export default mercadoPagoService;
