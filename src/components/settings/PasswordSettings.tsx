import React, { useState, useMemo } from 'react';
import { Eye, EyeOff, KeyRound, Check, X, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { settingsService } from '../../services/settings.service';

interface ValidationRule {
  id: string;
  labelKey: string;
  defaultLabel: string;
  test: (pw: string) => boolean;
}

export default function PasswordSettings() {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Visibility states
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Form submit state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // SOTA Password rules
  const rules = useMemo<ValidationRule[]>(() => [
    {
      id: 'length',
      labelKey: 'settingsHub.password.rules.length',
      defaultLabel: 'At least 8 characters',
      test: (pw) => pw.length >= 8,
    },
    {
      id: 'uppercase',
      labelKey: 'settingsHub.password.rules.uppercase',
      defaultLabel: 'One uppercase letter (A-Z)',
      test: (pw) => /[A-Z]/.test(pw),
    },
    {
      id: 'lowercase',
      labelKey: 'settingsHub.password.rules.lowercase',
      defaultLabel: 'One lowercase letter (a-z)',
      test: (pw) => /[a-z]/.test(pw),
    },
    {
      id: 'number',
      labelKey: 'settingsHub.password.rules.number',
      defaultLabel: 'One number (0-9)',
      test: (pw) => /[0-9]/.test(pw),
    },
    {
      id: 'special',
      labelKey: 'settingsHub.password.rules.special',
      defaultLabel: 'One special character (e.g. !@#$%)',
      test: (pw) => /[^A-Za-z0-9]/.test(pw),
    },
  ], []);

  // Compute validation results
  const validationResults = useMemo(() => {
    return rules.map((rule) => ({
      ...rule,
      isValid: rule.test(newPassword),
    }));
  }, [newPassword, rules]);

  // Compute strength score (0 to 5)
  const strengthScore = useMemo(() => {
    if (!newPassword) return 0;
    return validationResults.filter((r) => r.isValid).length;
  }, [newPassword, validationResults]);

  // Determine strength label and color class
  const strengthDetails = useMemo(() => {
    if (!newPassword) return { label: '', color: 'bg-gray-700', text: 'text-gray-400', width: 'w-0' };
    switch (strengthScore) {
      case 1:
        return {
          label: t('settingsHub.password.strength.weak', 'Weak'),
          color: 'bg-red-500',
          text: 'text-red-400',
          width: 'w-1/5',
        };
      case 2:
      case 3:
        return {
          label: t('settingsHub.password.strength.medium', 'Medium'),
          color: 'bg-orange-500',
          text: 'text-orange-400',
          width: 'w-3/5',
        };
      case 4:
        return {
          label: t('settingsHub.password.strength.strong', 'Strong'),
          color: 'bg-yellow-500',
          text: 'text-yellow-400',
          width: 'w-4/5',
        };
      case 5:
        return {
          label: t('settingsHub.password.strength.excellent', 'Very Strong'),
          color: 'bg-green-500',
          text: 'text-green-400',
          width: 'w-full',
        };
      default:
        return { label: '', color: 'bg-gray-700', text: 'text-gray-400', width: 'w-0' };
    }
  }, [newPassword, strengthScore, t]);

  const passwordsMatch = newPassword === confirmPassword;
  const isFormValid =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    strengthScore === 5 &&
    passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await settingsService.changePassword({
        currentPassword,
        newPassword,
      });

      if (response.success) {
        setSuccess(
          t(
            'settingsHub.password.success',
            'Password changed successfully! All other active sessions have been signed out.'
          )
        );
        // Reset form fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(response.error || t('settingsHub.password.errorDefault', 'Failed to change password.'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settingsHub.password.errorDefault', 'Failed to change password.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="mt-6 rounded-lg border border-gray-700 bg-gray-800/50 p-4 shadow-sm sm:p-6">
      <header className="mb-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <KeyRound className="h-5 w-5 text-red-400" />
          {t('settingsHub.password.title', 'Change password')}
        </h2>
        <p className="text-sm text-gray-400">
          {t(
            'settingsHub.password.subtitle',
            'Update your security credentials. For security, changing your password terminates other sessions.'
          )}
        </p>
      </header>

      {success && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current Password */}
        <div>
          <label htmlFor="current-password" className="mb-2 block text-sm font-medium text-gray-300">
            {t('settingsHub.password.currentLabel', 'Current Password')}
          </label>
          <div className="relative">
            <input
              id="current-password"
              name="current-password"
              type={showCurrent ? 'text' : 'password'}
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={isLoading}
              required
              className="w-full rounded-lg border border-gray-600 bg-gray-900/50 px-4 py-2.5 pr-10 font-medium text-gray-100 placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 disabled:opacity-50"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-200"
              tabIndex={-1}
            >
              {showCurrent ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* New Password & Strength Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="space-y-4">
            <div>
              <label htmlFor="new-password" className="mb-2 block text-sm font-medium text-gray-300">
                {t('settingsHub.password.newLabel', 'New Password')}
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  name="new-password"
                  type={showNew ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="w-full rounded-lg border border-gray-600 bg-gray-900/50 px-4 py-2.5 pr-10 font-medium text-gray-100 placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 disabled:opacity-50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-200"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-gray-300">
                {t('settingsHub.password.confirmLabel', 'Confirm New Password')}
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="w-full rounded-lg border border-gray-600 bg-gray-900/50 px-4 py-2.5 pr-10 font-medium text-gray-100 placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 disabled:opacity-50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-200"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {newPassword && confirmPassword && !passwordsMatch && (
                <span className="mt-1.5 block text-xs text-red-400">
                  {t('settingsHub.password.matchError', 'Passwords do not match')}
                </span>
              )}
            </div>
          </div>

          {/* Interactive SOTA Strength Panel */}
          <div className="rounded-lg border border-gray-700 bg-gray-900/30 p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-300">
              {t('settingsHub.password.strength.title', 'Password requirements')}
            </h3>

            {/* Strength Meter Bar */}
            <div className="mb-4">
              <div className="mb-1.5 flex justify-between text-xs font-medium">
                <span className="text-gray-400">{t('settingsHub.password.strength.label', 'Strength:')}</span>
                <span className={strengthDetails.text}>{strengthDetails.label || t('settingsHub.password.strength.empty', 'None')}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
                <div className={`h-full transition-all duration-300 ${strengthDetails.color} ${strengthDetails.width}`} />
              </div>
            </div>

            {/* Requirements list */}
            <ul className="space-y-2">
              {validationResults.map((result) => (
                <li key={result.id} className="flex items-center gap-2 text-xs">
                  {result.isValid ? (
                    <Check className="h-4 w-4 text-green-400 shrink-0" />
                  ) : (
                    <X className="h-4 w-4 text-gray-500 shrink-0" />
                  )}
                  <span className={result.isValid ? 'text-green-300' : 'text-gray-400'}>
                    {t(result.labelKey, result.defaultLabel)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Form Action */}
        <div className="flex justify-end border-t border-gray-700/50 pt-4">
          <Button
            type="submit"
            variant="primary"
            disabled={!isFormValid || isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                {t('settingsHub.password.saving', 'Changing Password...')}
              </span>
            ) : (
              t('settingsHub.password.button', 'Update password')
            )}
          </Button>
        </div>
      </form>
    </section>
  );
}
