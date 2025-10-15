import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnalyticsHeader, KPICards, AnalyticsOverview } from '../components/analytics';
import { useAnalyticsKPIs, useRevenueAnalytics, useStudentProgressAnalytics, useMonthlyTrendsAnalytics } from '../hooks/useAnalytics';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const { t } = useTranslation();

  const { kpis, isLoading: kpisLoading } = useAnalyticsKPIs();
  const { revenueByClass, isLoading: revenueLoading } = useRevenueAnalytics();
  const { studentProgress, isLoading: progressLoading } = useStudentProgressAnalytics();
  const { monthlyTrends, isLoading: trendsLoading } = useMonthlyTrendsAnalytics();

  const isLoading = kpisLoading || revenueLoading || progressLoading || trendsLoading;

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-8">
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-800 border-t-red-600 mx-auto mb-4 motion-safe:animate-spin"></div>
              <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-red-500 animate-pulse mx-auto"></div>
            </div>
            <p className="text-gray-400 font-medium animate-pulse">{t('analytics.loading')}</p>
          </div>
        </div>
      ) : (
        <>
          <AnalyticsHeader timeRange={timeRange} onTimeRangeChange={setTimeRange} />

          <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto space-y-8">
            <KPICards kpis={kpis} />

            {/* Enhanced Tabs */}
            <div className="bg-gray-900 rounded-xl p-1.5 shadow-xl border border-gray-800" role="tablist" aria-label={t('analytics.dashboardTitle')}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  role="tab"
                  aria-pressed={selectedMetric === 'overview'}
                  className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 motion-safe:transition-all ${
                    selectedMetric === 'overview'
                      ? 'bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg shadow-red-900/50'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`}
                  onClick={() => setSelectedMetric('overview')}
                >
                  {t('analytics.tabs.overview')}
                </button>
                <button
                  role="tab"
                  aria-pressed={selectedMetric === 'revenue'}
                  className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 motion-safe:transition-all ${
                    selectedMetric === 'revenue'
                      ? 'bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg shadow-red-900/50'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`}
                  onClick={() => setSelectedMetric('revenue')}
                >
                  {t('analytics.tabs.revenue')}
                </button>
                <button
                  role="tab"
                  aria-pressed={selectedMetric === 'students'}
                  className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 motion-safe:transition-all ${
                    selectedMetric === 'students'
                      ? 'bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg shadow-red-900/50'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`}
                  onClick={() => setSelectedMetric('students')}
                >
                  {t('analytics.tabs.students')}
                </button>
                <button
                  role="tab"
                  aria-pressed={selectedMetric === 'classes'}
                  className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 motion-safe:transition-all ${
                    selectedMetric === 'classes'
                      ? 'bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg shadow-red-900/50'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`}
                  onClick={() => setSelectedMetric('classes')}
                >
                  {t('analytics.tabs.classes')}
                </button>
              </div>
            </div>

            {/* Content with fade-in animation */}
            <div className="motion-safe:transition-opacity motion-safe:duration-300">
              {selectedMetric === 'overview' && (
                <AnalyticsOverview
                  revenueByClass={revenueByClass}
                  studentProgress={studentProgress}
                  monthlyTrends={monthlyTrends}
                />
              )}

              {selectedMetric === 'revenue' && (
                <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 overflow-hidden motion-safe:animate-slide-up">
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-green-500/10 rounded-lg">
                        <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-100">{t('analytics.revenue.title')}</h3>
                        <p className="text-gray-400 text-sm">{t('analytics.revenue.subtitle')}</p>
                      </div>
                    </div>
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                      <p className="text-gray-400">{t('analytics.revenue.comingSoon')}</p>
                      <p className="text-gray-500 text-sm mt-2">{t('analytics.revenue.description')}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedMetric === 'students' && (
                <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 overflow-hidden motion-safe:animate-slide-up">
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-blue-500/10 rounded-lg">
                        <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-100">{t('analytics.students.title')}</h3>
                        <p className="text-gray-400 text-sm">{t('analytics.students.subtitle')}</p>
                      </div>
                    </div>
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                      <p className="text-gray-400">{t('analytics.students.comingSoon')}</p>
                      <p className="text-gray-500 text-sm mt-2">{t('analytics.students.description')}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedMetric === 'classes' && (
                <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 overflow-hidden motion-safe:animate-slide-up">
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-purple-500/10 rounded-lg">
                        <svg className="w-8 h-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-100">{t('analytics.classes.title')}</h3>
                        <p className="text-gray-400 text-sm">{t('analytics.classes.subtitle')}</p>
                      </div>
                    </div>
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                      <p className="text-gray-400">{t('analytics.classes.comingSoon')}</p>
                      <p className="text-gray-500 text-sm mt-2">{t('analytics.classes.description')}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
