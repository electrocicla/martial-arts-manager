import { useState } from 'react';
import {
  Settings as SettingsIcon, User, Bell, Shield, Palette, Database, CreditCard,
  Mail, Building
} from 'lucide-react';
import {
  ProfileSettings,
  DojoSettings,
  NotificationSettings,
  AppearanceSettings,
  PaymentSettings,
  DataBackupSettings
} from '../components/settings';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'dojo', label: 'Dojo Info', icon: Building },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'email', label: 'Email/SMS', icon: Mail },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'data', label: 'Data & Backup', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-black to-red-900/20 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-red-600/30">
              <SettingsIcon className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-base-content">
                Settings
              </h1>
              <p className="text-sm text-base-content/70">
                Manage your dojo configuration and preferences
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-64">
            <ul className="menu bg-base-200 rounded-lg p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <li key={tab.id}>
                    <a
                      className={activeTab === tab.id ? 'active' : ''}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            {/* Profile Settings */}
            {activeTab === 'profile' && <ProfileSettings />}

            {/* Dojo Information */}
            {activeTab === 'dojo' && <DojoSettings />}

            {/* Notifications */}
            {activeTab === 'notifications' && <NotificationSettings />}

            {/* Appearance */}
            {activeTab === 'appearance' && <AppearanceSettings />}

            {/* Payment Settings */}
            {activeTab === 'payment' && <PaymentSettings />}            {/* Data & Backup */}
            {activeTab === 'data' && <DataBackupSettings />}
          </div>
        </div>
      </div>
    </div>
  );
}
