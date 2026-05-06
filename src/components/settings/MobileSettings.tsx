import { Save, Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useSettings from '../../hooks/useSettings';
import { APP_PREFERENCE_KEYS, readBooleanPreference, writeBooleanPreference } from '../../lib/preferences';
import { Button } from '../ui/Button';
import SettingsToggle from './SettingsToggle';

interface MobileSettingsValue {
  pullToRefresh?: boolean;
  androidInstallPrompt?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseMobileSettings(value: unknown): MobileSettingsValue {
  if (!isRecord(value)) return {};
  return {
    pullToRefresh: typeof value.pullToRefresh === 'boolean' ? value.pullToRefresh : undefined,
    androidInstallPrompt: typeof value.androidInstallPrompt === 'boolean' ? value.androidInstallPrompt : undefined,
  };
}

export default function MobileSettings() {
  const { t } = useTranslation();
  const { settings, saveSection } = useSettings();
  const [pullToRefresh, setPullToRefresh] = useState(() => readBooleanPreference(APP_PREFERENCE_KEYS.pullToRefresh, true));
  const [androidInstallPrompt, setAndroidInstallPrompt] = useState(() => readBooleanPreference(APP_PREFERENCE_KEYS.androidInstallPrompt, true));

  useEffect(() => {
    const parsed = parseMobileSettings(settings?.mobile);
    if (typeof parsed.pullToRefresh === 'boolean') {
      setPullToRefresh(parsed.pullToRefresh);
      writeBooleanPreference(APP_PREFERENCE_KEYS.pullToRefresh, parsed.pullToRefresh);
    }
    if (typeof parsed.androidInstallPrompt === 'boolean') {
      setAndroidInstallPrompt(parsed.androidInstallPrompt);
      writeBooleanPreference(APP_PREFERENCE_KEYS.androidInstallPrompt, parsed.androidInstallPrompt);
    }
  }, [settings]);

  const handlePullToRefreshChange = (checked: boolean) => {
    setPullToRefresh(checked);
    writeBooleanPreference(APP_PREFERENCE_KEYS.pullToRefresh, checked);
  };

  const handleAndroidPromptChange = (checked: boolean) => {
    setAndroidInstallPrompt(checked);
    writeBooleanPreference(APP_PREFERENCE_KEYS.androidInstallPrompt, checked);
  };

  const handleSave = async () => {
    await saveSection('mobile', { pullToRefresh, androidInstallPrompt });
  };

  return (
    <section className="rounded-lg border border-gray-700 bg-gray-800/50 p-4 shadow-sm sm:p-6">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Smartphone className="mt-0.5 h-5 w-5 text-red-400" />
          <div>
            <h2 className="text-lg font-semibold text-white">{t('settingsHub.mobile.title', 'Mobile app behavior')}</h2>
            <p className="text-sm text-gray-400">{t('settingsHub.mobile.subtitle', 'Tune mobile-only actions for the PWA and Android build.')}</p>
          </div>
        </div>
        <Button type="button" variant="primary" size="sm" leftIcon={<Save className="h-4 w-4" />} onClick={handleSave}>
          {t('settingsHub.mobile.save', 'Save mobile settings')}
        </Button>
      </header>

      <div className="space-y-3">
        <SettingsToggle
          id="settings-pull-to-refresh"
          label={t('settingsHub.mobile.pullToRefresh', 'Enable pull to refresh')}
          description={t('settingsHub.mobile.pullToRefreshDescription', 'Refresh students, classes, payments, attendance, and notifications with one mobile gesture.')}
          checked={pullToRefresh}
          onChange={handlePullToRefreshChange}
        />
        <SettingsToggle
          id="settings-android-install-prompt"
          label={t('settingsHub.mobile.androidInstallPrompt', 'Show Android install reminders')}
          description={t('settingsHub.mobile.androidInstallPromptDescription', 'Offer the APK install prompt on supported Android devices when it adds value.')}
          checked={androidInstallPrompt}
          onChange={handleAndroidPromptChange}
        />
      </div>
    </section>
  );
}