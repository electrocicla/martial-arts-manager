import { Award, Calendar, Users, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { label } from '../../lib/i18nUtils';

interface BeltTestingHeaderProps {
  selectedTab: string;
  onTabChange: (tab: string) => void;
}

export default function BeltTestingHeader({ selectedTab, onTabChange }: BeltTestingHeaderProps) {
  const { t } = useTranslation();
  return (
    <div className="bg-gradient-to-br from-base-200 to-base-300 px-4 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/20">
              <Award className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-base-content">
                {label(t, 'beltTesting.title', 'Belt Testing Management')}
              </h1>
              <p className="text-sm text-base-content/70">
                {label(t, 'beltTesting.subtitle', 'Track student progress and manage belt examinations')}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-boxed mt-6">
          <button
            className={`tab ${selectedTab === 'upcoming' ? 'tab-active' : ''}`}
            onClick={() => onTabChange('upcoming')}
          >
            <Calendar className="w-4 h-4 mr-2" />
            {label(t, 'beltTesting.tabs.upcoming', 'Upcoming Tests')}
          </button>
          <button
            className={`tab ${selectedTab === 'eligible' ? 'tab-active' : ''}`}
            onClick={() => onTabChange('eligible')}
          >
            <Users className="w-4 h-4 mr-2" />
            {label(t, 'beltTesting.tabs.eligible', 'Eligible Students')}
          </button>
          <button
            className={`tab ${selectedTab === 'history' ? 'tab-active' : ''}`}
            onClick={() => onTabChange('history')}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            {label(t, 'beltTesting.tabs.history', 'Test History')}
          </button>
        </div>
      </div>
    </div>
  );
}