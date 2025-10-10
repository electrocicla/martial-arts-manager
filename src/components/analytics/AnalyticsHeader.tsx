import { BarChart3, Calendar, Filter, RefreshCw, Download, ChevronDown } from 'lucide-react';

interface AnalyticsHeaderProps {
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

export default function AnalyticsHeader({ timeRange, onTimeRangeChange }: AnalyticsHeaderProps) {
  return (
    <div className="bg-gradient-to-br from-base-200 to-base-300 px-4 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/20">
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-base-content">
                Analytics Dashboard
              </h1>
              <p className="text-sm text-base-content/70">
                Track performance and growth metrics
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-sm btn-ghost gap-2">
                <Calendar className="w-4 h-4" />
                {timeRange === 'week' && 'This Week'}
                {timeRange === 'month' && 'This Month'}
                {timeRange === 'year' && 'This Year'}
                <ChevronDown className="w-4 h-4" />
              </label>
              <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-200 rounded-box w-52">
                <li><a onClick={() => onTimeRangeChange('week')}>This Week</a></li>
                <li><a onClick={() => onTimeRangeChange('month')}>This Month</a></li>
                <li><a onClick={() => onTimeRangeChange('year')}>This Year</a></li>
              </ul>
            </div>

            <button className="btn btn-sm btn-ghost">
              <Filter className="w-4 h-4" />
            </button>

            <button className="btn btn-sm btn-ghost">
              <RefreshCw className="w-4 h-4" />
            </button>

            <button className="btn btn-sm btn-primary">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}