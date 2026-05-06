/**
 * PaymentTabs
 * SRP: Tab navigation only — no data fetching, no view-specific logic.
 */

import { History, ListChecks, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type PaymentTabId = 'manage' | 'history' | 'overdue';

interface PaymentTabsProps {
  activeTab: PaymentTabId;
  onChange: (next: PaymentTabId) => void;
  overdueCount?: number;
}

export default function PaymentTabs({ activeTab, onChange, overdueCount = 0 }: PaymentTabsProps) {
  const { t } = useTranslation();

  const tabs: ReadonlyArray<{
    id: PaymentTabId;
    label: string;
    icon: typeof History;
    badge?: number;
  }> = [
    { id: 'manage', label: t('payments.tabs.manage', 'Manage'), icon: ListChecks },
    { id: 'history', label: t('payments.tabs.history', 'History'), icon: History },
    {
      id: 'overdue',
      label: t('payments.tabs.overdue', 'Overdue'),
      icon: AlertTriangle,
      badge: overdueCount,
    },
  ];

  return (
    <div role="tablist" className="flex flex-wrap gap-2 border-b border-gray-700 pb-3">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 active:scale-[0.97] border ${
              isActive
                ? 'bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg shadow-red-900/40 border-red-600'
                : 'text-gray-300 hover:text-white hover:bg-gray-700/80 border-gray-700/50'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{tab.label}</span>
            {typeof tab.badge === 'number' && tab.badge > 0 && (
              <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-amber-500 text-black text-xs font-bold">
                {tab.badge > 99 ? '99+' : tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
