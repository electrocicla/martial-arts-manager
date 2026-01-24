import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { customRenderWithoutAuth as render } from '../../test/test-utils';
import { PendingApprovals } from './PendingApprovals';

interface PendingUser {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
  registration_notes?: string;
}

type FetchResponse = Pick<Response, 'ok' | 'json'>;

const createFetchResponse = (body: unknown, ok = true): FetchResponse => {
  return {
    ok,
    json: async () => body,
  };
};

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
  });

  afterEach(() => {
    localStorage.removeItem('accessToken');
    vi.restoreAllMocks();
  });

  it('renders pending users from the API', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      createFetchResponse({ pending_users: [pendingUser] })
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<PendingApprovals />);

    expect(await screen.findByText('Pending approvals')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('sends approve request with user_id', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(createFetchResponse({ pending_users: [pendingUser] }))
      .mockResolvedValueOnce(createFetchResponse({ success: true }));

    vi.stubGlobal('fetch', fetchMock);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<PendingApprovals />);

    const approveButton = await screen.findByRole('button', { name: 'Approve account' });
    await userEvent.click(approveButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        '/api/auth/pending-approvals',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ user_id: 'user-1' }),
        })
      );
    });

    confirmSpy.mockRestore();
  });
});
