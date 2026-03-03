import { BarChart3, Calendar, Filter, RefreshCw, Download, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { label } from '../../lib/i18nUtils';
import { Button } from '../ui/Button';

interface AnalyticsHeaderProps {
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

export default function AnalyticsHeader({ timeRange, onTimeRangeChange }: AnalyticsHeaderProps) {
  const { t } = useTranslation();
  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-black border-b border-gray-800 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Title Section */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-700 rounded-xl blur-md opacity-75 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative p-4 bg-gradient-to-br from-red-600 to-red-700 rounded-xl shadow-xl">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-300">
                {label(t, 'analytics.dashboardTitle', 'Analytics Dashboard')}
              </h1>
              <p className="text-sm text-gray-400 mt-1 font-medium">
                {label(t, 'analytics.dashboardSubtitle', 'Track performance and growth metrics')}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Time Range Dropdown */}
            <div className="dropdown dropdown-end">
              <label 
                tabIndex={0} 
                className="btn btn-sm bg-gray-800 hover:bg-gray-700 border-gray-700 hover:border-gray-600 text-gray-200 gap-2 shadow-lg"
                aria-label={label(t, 'analytics.timeRange', 'Time Range')}
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {timeRange === 'week' && label(t, 'analytics.timeOptions.week', 'This Week')}
                  {timeRange === 'month' && label(t, 'analytics.timeOptions.month', 'This Month')}
                  {timeRange === 'year' && label(t, 'analytics.timeOptions.year', 'This Year')}
                </span>
                <ChevronDown className="w-4 h-4" />
              </label>
              <ul 
                tabIndex={0} 
                className="dropdown-content menu p-2 shadow-2xl bg-gray-800 border border-gray-700 rounded-xl w-52 mt-2"
              >
                <li>
                  <a 
                    onClick={() => onTimeRangeChange('week')}
                    className="text-gray-200 hover:bg-gray-700 hover:text-white rounded-lg"
                  >
                    {label(t, 'analytics.timeOptions.week', 'This Week')}
                  </a>
                </li>
                <li>
                  <a 
                    onClick={() => onTimeRangeChange('month')}
                    className="text-gray-200 hover:bg-gray-700 hover:text-white rounded-lg"
                  >
                    {label(t, 'analytics.timeOptions.month', 'This Month')}
                  </a>
                </li>
                <li>
                  <a 
                    onClick={() => onTimeRangeChange('year')}
                    className="text-gray-200 hover:bg-gray-700 hover:text-white rounded-lg"
                  >
                    {label(t, 'analytics.timeOptions.year', 'This Year')}
                  </a>
                </li>
              </ul>
            </div>

            {/* Filter Button */}
            <Button variant="secondary" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
              <span className="hidden sm:inline">{label(t, 'analytics.filter', 'Filter')}</span>
            </Button>

            {/* Refresh Button */}
            <Button variant="secondary" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} />

            {/* Export Button */}
            <Button variant="primary" size="sm" leftIcon={<Download className="w-4 h-4" />}>
              <span className="hidden sm:inline">{label(t, 'analytics.export', 'Export')}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}