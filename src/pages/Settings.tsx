import { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Bell, CreditCard, Palette, Settings as SettingsIcon, Shield, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  AccountPreferencesSettings,
  AppearanceSettings,
  MercadoPagoSettings,
  MobileSettings,
  NotificationSettings,
} from '../components/settings';
import type { Role } from '../lib/mobileMenuConfig';

type SettingsTab = 'account' | 'notifications' | 'appearance' | 'mobile' | 'mercadopago';

interface SettingsTabDefinition {
  id: SettingsTab;
  label: string;
  description: string;
  icon: LucideIcon;
  roles: Role[];
}

const SETTINGS_TABS: SettingsTabDefinition[] = [
  {
    id: 'account',
    label: 'Account',
    description: 'Language, role, and privacy defaults',
    icon: Shield,
    roles: ['admin', 'instructor', 'student'],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Channels, reminders, and quiet hours',
    icon: Bell,
    roles: ['admin', 'instructor', 'student'],
  },
  {
    id: 'appearance',
    label: 'Appearance',
    description: 'Theme, density, contrast, and motion',
    icon: Palette,
    roles: ['admin', 'instructor', 'student'],
  },
  {
    id: 'mobile',
    label: 'Mobile',
    description: 'PWA and Android behavior',
    icon: Smartphone,
    roles: ['admin', 'instructor', 'student'],
  },
  {
    id: 'mercadopago',
    label: 'MercadoPago',
    description: 'Online payment gateway configuration',
    icon: CreditCard,
    roles: ['admin'],
  },
];

function renderSettingsPanel(activeTab: SettingsTab) {
  switch (activeTab) {
    case 'account':
      return <AccountPreferencesSettings />;
    case 'notifications':
      return <NotificationSettings />;
    case 'appearance':
      return <AppearanceSettings />;
    case 'mobile':
      return <MobileSettings />;
    case 'mercadopago':
      return <MercadoPagoSettings />;
    default:
      return <AccountPreferencesSettings />;
  }
}

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');

  const visibleTabs = useMemo(
    () => SETTINGS_TABS.filter((tab) => (user?.role ? tab.roles.includes(user.role) : false)),
    [user?.role]
  );

  useEffect(() => {
    if (visibleTabs.length === 0) return;
    const activeTabIsVisible = visibleTabs.some((tab) => tab.id === activeTab);
    if (!activeTabIsVisible) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [activeTab, visibleTabs]);

  return (
    <div className="min-h-screen bg-gray-900 pb-24 md:pb-8">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="mb-6 sm:mb-8">
          <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold text-white">
            <SettingsIcon className="h-8 w-8 text-red-400" />
            Settings
          </h1>
          <p className="text-gray-400">Configure app behavior, notifications, privacy, and role-specific tools.</p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-8">
          <nav className="lg:col-span-1" aria-label="Settings sections">
            <div className="hidden rounded-lg border border-gray-700 bg-gray-800/50 p-2 lg:block">
              <ul className="space-y-1">
                {visibleTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <li key={tab.id}>
                      <button
                        type="button"
                        className={`w-full rounded-lg px-4 py-3 text-left transition-colors ${
                          isActive
                            ? 'border border-red-500/30 bg-red-600/20 text-red-300'
                            : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                        }`}
                        onClick={() => setActiveTab(tab.id)}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="h-5 w-5" />
                          <span className="font-medium">{tab.label}</span>
                        </span>
                        <span className="mt-1 block pl-8 text-xs text-gray-400">{tab.description}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-2 lg:hidden">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`flex min-h-20 flex-col items-start justify-between rounded-lg border p-3 text-left transition-colors ${
                      isActive
                        ? 'border-red-500/50 bg-red-600/20 text-red-200'
                        : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-800'
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-semibold">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          <section className="lg:col-span-3">{renderSettingsPanel(activeTab)}</section>
        </div>
      </div>
    </div>
  );
}