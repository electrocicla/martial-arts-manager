/**
 * Admin Settings Hub page (`/settings`).
 *
 * Tabbed UI surfacing every admin-only configuration section. Currently:
 *   - MercadoPago payments
 *
 * Routed in `App.tsx` and protected against non-admin users.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings as SettingsIcon, CreditCard } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MercadoPagoSettings } from '../components/settings';

type SettingsTab = 'mercadopago';

interface TabDef {
  id: SettingsTab;
  label: string;
  icon: typeof CreditCard;
}

export default function Settings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('mercadopago');

  if (user && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const tabs: TabDef[] = [
    { id: 'mercadopago', label: t('mercadopago.title'), icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-gray-900 pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-red-400" />
            {t('nav.settings', 'Settings')}
          </h1>
          <p className="text-gray-400">{t('settings.subtitle')}</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <nav className="lg:col-span-1">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-2">
              <ul className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <li key={tab.id}>
                      <button
                        type="button"
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                          isActive
                            ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                            : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                        }`}
                        onClick={() => setActiveTab(tab.id)}
                      >
                        <Icon className="w-5 h-5" />
                        {tab.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>

          <section className="lg:col-span-3">
            {activeTab === 'mercadopago' && <MercadoPagoSettings />}
          </section>
        </div>
      </div>
    </div>
  );
}
