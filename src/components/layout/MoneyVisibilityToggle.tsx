/**
 * MoneyVisibilityToggle — Eye / EyeOff icon button that toggles whether
 * monetary values across the app are visible or masked.
 */
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePrivacy } from '../../context/PrivacyContext';

interface Props {
  className?: string;
  variant?: 'desktop' | 'mobile';
}

export default function MoneyVisibilityToggle({ className, variant = 'desktop' }: Props) {
  const { t } = useTranslation();
  const { hidden, canToggle, toggle } = usePrivacy();

  if (!canToggle) return null;

  const labelShow = t('privacy.showAmounts', 'Show amounts');
  const labelHide = t('privacy.hideAmounts', 'Hide amounts');
  const aria = hidden ? labelShow : labelHide;

  if (variant === 'mobile') {
    return (
      <button
        type="button"
        onClick={toggle}
        className={
          className ??
          'w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2 transition-colors'
        }
        aria-label={aria}
        aria-pressed={!hidden}
      >
        {hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        {aria}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={
        className ??
        'p-2 text-gray-300 hover:text-white hover:bg-gray-700/60 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50'
      }
      aria-label={aria}
      aria-pressed={!hidden}
      title={aria}
    >
      {hidden ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
    </button>
  );
}
