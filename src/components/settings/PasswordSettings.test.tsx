import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '../../test/test-utils';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import PasswordSettings from './PasswordSettings';
import { settingsService } from '../../services/settings.service';

// Mock settingsService
vi.mock('../../services/settings.service', () => ({
  settingsService: {
    changePassword: vi.fn(),
  },
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, def?: string) => def || key,
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
}));

describe('PasswordSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form inputs and requirements', () => {
    render(<PasswordSettings />);

    expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
    expect(screen.getByText('Password requirements')).toBeInTheDocument();
  });

  it('validates password requirements interactively', () => {
    render(<PasswordSettings />);

    const newPasswordInput = screen.getByLabelText('New Password');

    // Initially all requirements should not be marked as valid/met (handled by cross or X icon/class)
    // When we type a simple lowercase password "abc"
    fireEvent.change(newPasswordInput, { target: { value: 'abc' } });

    // The criteria "One lowercase letter (a-z)" should match, but others won't
    expect(screen.getByText('One lowercase letter (a-z)')).toBeInTheDocument();
    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();

    // Type a strong password meeting all criteria: "StrongP@ss1"
    fireEvent.change(newPasswordInput, { target: { value: 'StrongP@ss1' } });
    
    // Check that we can see the strength labels
    expect(screen.getByText('Very Strong')).toBeInTheDocument();
  });

  it('shows error if new password and confirm password do not match', () => {
    render(<PasswordSettings />);

    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

    fireEvent.change(newPasswordInput, { target: { value: 'StrongP@ss1' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentP@ss1' } });

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });

  it('submits successfully when form is valid', async () => {
    vi.mocked(settingsService.changePassword).mockResolvedValueOnce({
      success: true,
      message: 'Password changed successfully',
    });

    render(<PasswordSettings />);

    const currentPasswordInput = screen.getByLabelText('Current Password');
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    const submitButton = screen.getByRole('button', { name: 'Update password' });

    // Fill the form with valid information
    fireEvent.change(currentPasswordInput, { target: { value: 'oldPassword123!' } });
    fireEvent.change(newPasswordInput, { target: { value: 'StrongP@ss1' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'StrongP@ss1' } });

    // Button should be enabled
    expect(submitButton).not.toBeDisabled();

    // Click submit
    fireEvent.click(submitButton);

    // Verify changePassword was called with correct data
    expect(settingsService.changePassword).toHaveBeenCalledWith({
      currentPassword: 'oldPassword123!',
      newPassword: 'StrongP@ss1',
    });

    // Verify success message is rendered and fields are cleared
    await waitFor(() => {
      expect(
        screen.getByText('Password changed successfully! All other active sessions have been signed out.')
      ).toBeInTheDocument();
      expect(currentPasswordInput).toHaveValue('');
      expect(newPasswordInput).toHaveValue('');
      expect(confirmPasswordInput).toHaveValue('');
    });
  });
});
