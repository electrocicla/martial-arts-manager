import { useTranslation } from 'react-i18next';
import { label } from '../../lib/i18nUtils';
import type { RevenueByClass, MonthlyTrend, RevenueByDiscipline } from '../../lib/analyticsUtils';
import DisciplineRevenue from './DisciplineRevenue';

interface RevenueAnalyticsProps {
  revenueByClass: RevenueByClass[];
  monthlyTrends: MonthlyTrend[];
  revenueByDiscipline?: RevenueByDiscipline[];
}

export default function RevenueAnalytics({ revenueByClass, monthlyTrends, revenueByDiscipline }: RevenueAnalyticsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      {/* Revenue Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">{label(t, 'analytics.revenue.totalRevenue', 'Total Revenue')}</p>
              <p className="text-2xl font-bold text-gray-100">${revenueByClass.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">{label(t, 'analytics.revenue.averagePerClass', 'Average per class')}</p>
              <p className="text-2xl font-bold text-gray-100">${revenueByClass.length > 0 ? Math.round(revenueByClass.reduce((sum, item) => sum + item.revenue, 0) / revenueByClass.length).toLocaleString() : 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">{label(t, 'analytics.revenue.growthRate', 'Growth rate')}</p>
              <p className="text-2xl font-bold text-gray-100">
                {monthlyTrends.length > 1 ?
                  `${((monthlyTrends[monthlyTrends.length - 1].revenue - monthlyTrends[monthlyTrends.length - 2].revenue) / monthlyTrends[monthlyTrends.length - 2].revenue * 100).toFixed(1)}%` :
                  'N/A'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue by Class */}
        <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-xl font-bold text-gray-100">{label(t, 'analytics.revenue.byClass', 'By class')}</h3>
            <p className="text-sm text-gray-400 mt-1">{label(t, 'analytics.revenue.byClassSubtitle', 'Income distribution across disciplines')}</p>
          </div>
          <div className="p-6 space-y-4">
            {revenueByClass.map((item, idx) => {
              const maxRevenue = Math.max(...revenueByClass.map(i => i.revenue));
              return (
                <div key={idx} className="group">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors">
                      {item.class}
                    </span>
                    <span className="text-sm font-bold text-gray-100">
                      ${item.revenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="relative w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-600 to-green-500 h-3 rounded-full transition-all duration-700 ease-out shadow-lg"
                      style={{ width: `${maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    {item.students} {label(t, 'analytics.revenue.studentsEnrolled', 'students enrolled')}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Discipline Revenue */}
        <div>
          <DisciplineRevenue data={revenueByDiscipline || []} />
        </div>

        {/* Monthly Revenue Trend */}
        <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-xl font-bold text-gray-100">{t('analytics.revenue.monthlyTrend')}</h3>
            <p className="text-sm text-gray-400 mt-1">{t('analytics.revenue.monthlyTrendSubtitle')}</p>
          </div>
          <div className="p-6">
            <div className="h-64 flex items-end justify-between gap-2">
              {monthlyTrends.map((month, idx) => {
                const maxRevenue = Math.max(...monthlyTrends.map(m => m.revenue));
                const height = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group">
                    <div className="w-full flex justify-center mb-2">
                      <div
                        className="bg-gradient-to-t from-green-600 to-green-500 rounded-t-lg transition-all duration-700 hover:from-green-500 hover:to-green-400 shadow-lg group-hover:shadow-green-900/50 cursor-pointer min-h-[10px]"
                        style={{ height: `${height}%`, width: '80%' }}
                        title={`$${month.revenue.toLocaleString()}`}
                      ></div>
                    </div>
                    <span className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors">
                      {month.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}