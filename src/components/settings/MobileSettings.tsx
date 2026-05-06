import { Save, Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';
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
            <h2 className="text-lg font-semibold text-white">Mobile app behavior</h2>
            <p className="text-sm text-gray-400">Tune mobile-only actions for the PWA and Android build.</p>
          </div>
        </div>
        <Button type="button" variant="primary" size="sm" leftIcon={<Save className="h-4 w-4" />} onClick={handleSave}>
          Save mobile settings
        </Button>
      </header>

      <div className="space-y-3">
        <SettingsToggle
          id="settings-pull-to-refresh"
          label="Enable pull to refresh"
          description="Refresh students, classes, payments, attendance, and notifications with one mobile gesture."
          checked={pullToRefresh}
          onChange={handlePullToRefreshChange}
        />
        <SettingsToggle
          id="settings-android-install-prompt"
          label="Show Android install reminders"
          description="Offer the APK install prompt on supported Android devices when it adds value."
          checked={androidInstallPrompt}
          onChange={handleAndroidPromptChange}
        />
      </div>
    </section>
  );
}