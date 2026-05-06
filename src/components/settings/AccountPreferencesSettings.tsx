import { Save, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { usePrivacy } from '../../hooks/usePrivacy';
import useSettings from '../../hooks/useSettings';
import { Button } from '../ui/Button';
import SettingsToggle from './SettingsToggle';

const LANGUAGE_OPTIONS = [
  { value: 'en', labelKey: 'settingsHub.account.languageOptions.en' },
  { value: 'es', labelKey: 'settingsHub.account.languageOptions.es' },
  { value: 'pt', labelKey: 'settingsHub.account.languageOptions.pt' },
] as const;

export default function AccountPreferencesSettings() {
  const { user } = useAuth();
  const { hidden, canToggle, setHidden } = usePrivacy();
  const { t, i18n } = useTranslation();
  const { saveSection } = useSettings();

  const currentLanguage = LANGUAGE_OPTIONS.some((option) => option.value === i18n.language) ? i18n.language : 'en';

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language).catch((error) => console.error('Failed to change language:', error));
  };

  const handleSave = async () => {
    await saveSection('account_preferences', {
      language: currentLanguage,
      moneyHidden: hidden,
    });
  };

  return (
    <section className="rounded-lg border border-gray-700 bg-gray-800/50 p-4 shadow-sm sm:p-6">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">{t('settingsHub.account.title', 'Account preferences')}</h2>
          <p className="text-sm text-gray-400">{t('settingsHub.account.subtitle', 'Control app language and privacy behavior.')}</p>
        </div>
        <Button type="button" variant="primary" size="sm" leftIcon={<Save className="h-4 w-4" />} onClick={handleSave}>
          {t('settingsHub.account.save', 'Save preferences')}
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <label htmlFor="settings-language" className="mb-2 block text-sm font-medium text-gray-300">
            {t('settingsHub.account.language', 'Language')}
          </label>
          <select
            id="settings-language"
            value={currentLanguage}
            onChange={(event) => handleLanguageChange(event.target.value)}
            className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/40"
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
            ))}
          </select>
        </div>

        <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-4">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-red-400" />
            <div>
              <div className="text-sm font-medium text-white">{t('settingsHub.account.signedInRole', 'Signed in role')}</div>
              <div className="text-sm capitalize text-gray-400">{t(`settingsHub.account.roles.${user?.role ?? 'member'}`, user?.role ?? 'member')}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        {canToggle ? (
          <SettingsToggle
            id="settings-money-visibility"
            label={t('settingsHub.account.hideFinancialValues', 'Hide financial values by default')}
            description={t('settingsHub.account.hideFinancialValuesDescription', 'Mask revenue and payment totals when showing the app around other people.')}
            checked={hidden}
            onChange={setHidden}
          />
        ) : (
          <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-4 text-sm text-gray-400">
            {t('settingsHub.account.financialPrivacyUnavailable', 'Financial privacy controls are available to administrator and instructor accounts.')}
          </div>
        )}
      </div>
    </section>
  );
}