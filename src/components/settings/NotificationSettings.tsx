import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useSettings from '../../hooks/useSettings';
import { Button } from '../ui/Button';
import SettingsToggle from './SettingsToggle';

type DigestFrequency = 'instant' | 'daily' | 'weekly';

interface NotificationPreferences {
  emailAlerts: boolean;
  smsAlerts: boolean;
  paymentReminders: boolean;
  classReminders: boolean;
  promotionAlerts: boolean;
  systemUpdates: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  digestFrequency: DigestFrequency;
}

type ToggleKey = 'emailAlerts' | 'smsAlerts' | 'paymentReminders' | 'classReminders' | 'promotionAlerts' | 'systemUpdates';

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  emailAlerts: true,
  smsAlerts: false,
  paymentReminders: true,
  classReminders: true,
  promotionAlerts: true,
  systemUpdates: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  digestFrequency: 'instant',
};

const TOGGLE_OPTIONS: Array<{ id: ToggleKey; labelKey: string; descriptionKey: string }> = [
  {
    id: 'emailAlerts',
    labelKey: 'settingsHub.notifications.toggles.emailAlerts.label',
    descriptionKey: 'settingsHub.notifications.toggles.emailAlerts.description',
  },
  {
    id: 'smsAlerts',
    labelKey: 'settingsHub.notifications.toggles.smsAlerts.label',
    descriptionKey: 'settingsHub.notifications.toggles.smsAlerts.description',
  },
  {
    id: 'paymentReminders',
    labelKey: 'settingsHub.notifications.toggles.paymentReminders.label',
    descriptionKey: 'settingsHub.notifications.toggles.paymentReminders.description',
  },
  {
    id: 'classReminders',
    labelKey: 'settingsHub.notifications.toggles.classReminders.label',
    descriptionKey: 'settingsHub.notifications.toggles.classReminders.description',
  },
  {
    id: 'promotionAlerts',
    labelKey: 'settingsHub.notifications.toggles.promotionAlerts.label',
    descriptionKey: 'settingsHub.notifications.toggles.promotionAlerts.description',
  },
  {
    id: 'systemUpdates',
    labelKey: 'settingsHub.notifications.toggles.systemUpdates.label',
    descriptionKey: 'settingsHub.notifications.toggles.systemUpdates.description',
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseDigestFrequency(value: unknown): DigestFrequency | undefined {
  return value === 'instant' || value === 'daily' || value === 'weekly' ? value : undefined;
}

function parseNotifications(value: unknown): NotificationPreferences {
  if (!isRecord(value)) return DEFAULT_NOTIFICATIONS;

  return {
    ...DEFAULT_NOTIFICATIONS,
    emailAlerts: typeof value.emailAlerts === 'boolean' ? value.emailAlerts : DEFAULT_NOTIFICATIONS.emailAlerts,
    smsAlerts: typeof value.smsAlerts === 'boolean' ? value.smsAlerts : DEFAULT_NOTIFICATIONS.smsAlerts,
    paymentReminders: typeof value.paymentReminders === 'boolean' ? value.paymentReminders : DEFAULT_NOTIFICATIONS.paymentReminders,
    classReminders: typeof value.classReminders === 'boolean' ? value.classReminders : DEFAULT_NOTIFICATIONS.classReminders,
    promotionAlerts: typeof value.promotionAlerts === 'boolean' ? value.promotionAlerts : DEFAULT_NOTIFICATIONS.promotionAlerts,
    systemUpdates: typeof value.systemUpdates === 'boolean' ? value.systemUpdates : DEFAULT_NOTIFICATIONS.systemUpdates,
    quietHoursStart: typeof value.quietHoursStart === 'string' ? value.quietHoursStart : DEFAULT_NOTIFICATIONS.quietHoursStart,
    quietHoursEnd: typeof value.quietHoursEnd === 'string' ? value.quietHoursEnd : DEFAULT_NOTIFICATIONS.quietHoursEnd,
    digestFrequency: parseDigestFrequency(value.digestFrequency) ?? DEFAULT_NOTIFICATIONS.digestFrequency,
  };
}

export default function NotificationSettings() {
  const { t } = useTranslation();
  const { settings, saveSection } = useSettings();
  const [notifications, setNotifications] = useState<NotificationPreferences>(DEFAULT_NOTIFICATIONS);

  useEffect(() => {
    setNotifications(parseNotifications(settings?.notifications));
  }, [settings]);

  const updateToggle = (key: ToggleKey, checked: boolean) => {
    setNotifications((current) => ({ ...current, [key]: checked }));
  };

  const handleSave = async () => {
    await saveSection('notifications', notifications);
  };

  return (
    <section className="rounded-lg border border-gray-700 bg-gray-800/50 p-4 shadow-sm sm:p-6">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">{t('settingsHub.notifications.title', 'Notification preferences')}</h2>
          <p className="text-sm text-gray-400">{t('settingsHub.notifications.subtitle', 'Choose which operational messages can interrupt you and when.')}</p>
        </div>
        <Button type="button" variant="primary" size="sm" leftIcon={<Save className="h-4 w-4" />} onClick={handleSave}>
          {t('settingsHub.notifications.save', 'Save notifications')}
        </Button>
      </header>

      <div className="space-y-3">
        {TOGGLE_OPTIONS.map((option) => (
          <SettingsToggle
            key={option.id}
            id={`settings-${option.id}`}
            label={t(option.labelKey)}
            description={t(option.descriptionKey)}
            checked={notifications[option.id]}
            onChange={(checked) => updateToggle(option.id, checked)}
          />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div>
          <label htmlFor="settings-digest-frequency" className="mb-2 block text-sm font-medium text-gray-300">
            {t('settingsHub.notifications.digestFrequency', 'Digest frequency')}
          </label>
          <select
            id="settings-digest-frequency"
            value={notifications.digestFrequency}
            onChange={(event) => setNotifications((current) => ({ ...current, digestFrequency: event.target.value as DigestFrequency }))}
            className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/40"
          >
            <option value="instant">{t('settingsHub.notifications.digestOptions.instant', 'Instant')}</option>
            <option value="daily">{t('settingsHub.notifications.digestOptions.daily', 'Daily summary')}</option>
            <option value="weekly">{t('settingsHub.notifications.digestOptions.weekly', 'Weekly summary')}</option>
          </select>
        </div>

        <div>
          <label htmlFor="settings-quiet-start" className="mb-2 block text-sm font-medium text-gray-300">
            {t('settingsHub.notifications.quietHoursStart', 'Quiet hours start')}
          </label>
          <input
            id="settings-quiet-start"
            value={notifications.quietHoursStart}
            onChange={(event) => setNotifications((current) => ({ ...current, quietHoursStart: event.target.value }))}
            type="time"
            className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/40"
          />
        </div>

        <div>
          <label htmlFor="settings-quiet-end" className="mb-2 block text-sm font-medium text-gray-300">
            {t('settingsHub.notifications.quietHoursEnd', 'Quiet hours end')}
          </label>
          <input
            id="settings-quiet-end"
            value={notifications.quietHoursEnd}
            onChange={(event) => setNotifications((current) => ({ ...current, quietHoursEnd: event.target.value }))}
            type="time"
            className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/40"
          />
        </div>
      </div>
    </section>
  );
}