/**
 * Notification Service
 * Thin wrapper around `/api/notifications/*` endpoints. Following SRP, this
 * module is the single place that knows the HTTP shape of notifications.
 */

import { apiClient, type ApiResponse } from '../lib/api-client';

export interface ConfirmNotificationResponse {
  success: boolean;
  alreadyConfirmed?: boolean;
  confirmedAt?: string;
}

export class NotificationService {
  private readonly endpoint = '/api/notifications';

  async confirm(id: string): Promise<ApiResponse<ConfirmNotificationResponse>> {
    return apiClient.post<ConfirmNotificationResponse>(`${this.endpoint}/confirm`, { id });
  }
}

export const notificationService = new NotificationService();
