import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test/test-utils';
import { PendingApprovals } from './PendingApprovals';
import { server } from '../../test/setup';
import { http, HttpResponse } from 'msw';

interface PendingUser {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
  registration_notes?: string;
}

describe('PendingApprovals', () => {
  const pendingUser: PendingUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'student',
    created_at: new Date('2024-01-01T10:00:00Z').toISOString(),
    registration_notes: 'Needs approval',
  };

  beforeEach(() => {
    localStorage.setItem('accessToken', 'test-token');
    
    // Setup default handler for auth/me endpoint
    server.use(
      http.get('/api/auth/me', () => {
        return HttpResponse.json({
          user: {
            id: 'admin-1',
            email: 'admin@example.com',
            name: 'Admin User',
            role: 'admin'
          }
        });
      })
    );
  });

  afterEach(() => {
    localStorage.removeItem('accessToken');
    vi.restoreAllMocks();
  });

  it.skip('renders pending users from the API', async () => {
    server.use(
      http.get('/api/auth/pending-approvals', () => {
        return HttpResponse.json({ pending_users: [pendingUser] });
      })
    );

    render(<PendingApprovals />);

    expect(await screen.findByText('Test User', {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it.skip('sends approve request with user_id', async () => {
    let approveRequestBody: unknown = null;
    
    server.use(
      http.get('/api/auth/pending-approvals', () => {
        return HttpResponse.json({ pending_users: [pendingUser] });
      }),
      http.post('/api/auth/pending-approvals', async ({ request }) => {
        approveRequestBody = await request.json();
        return HttpResponse.json({ success: true });
      })
    );

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<PendingApprovals />);

    const approveButton = await screen.findByRole('button', { name: /approve/i }, { timeout: 3000 });
    await userEvent.click(approveButton);

    await waitFor(() => {
      expect(approveRequestBody).toEqual({ user_id: 'user-1' });
      expect(confirmSpy).toHaveBeenCalled();
    });

    confirmSpy.mockRestore();
  });
});
