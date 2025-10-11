import { useState } from 'react';
import { AnalyticsHeader, KPICards, AnalyticsOverview } from '../components/analytics';
import { useAnalyticsKPIs, useRevenueAnalytics, useStudentProgressAnalytics, useMonthlyTrendsAnalytics } from '../hooks/useAnalytics';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('overview');

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
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-800 border-t-red-600 mx-auto mb-4"></div>
              <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-red-500 animate-pulse mx-auto"></div>
            </div>
            <p className="text-gray-400 font-medium animate-pulse">Loading analytics data...</p>
          </div>
        </div>
      ) : (
        <>
          <AnalyticsHeader timeRange={timeRange} onTimeRangeChange={setTimeRange} />

          <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto space-y-8">
            <KPICards kpis={kpis} />

            {/* Enhanced Tabs */}
            <div className="bg-gray-900 rounded-xl p-1.5 shadow-xl border border-gray-800">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                    selectedMetric === 'overview'
                      ? 'bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg shadow-red-900/50'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`}
                  onClick={() => setSelectedMetric('overview')}
                >
                  Overview
                </button>
                <button
                  className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                    selectedMetric === 'revenue'
                      ? 'bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg shadow-red-900/50'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`}
                  onClick={() => setSelectedMetric('revenue')}
                >
                  Revenue
                </button>
                <button
                  className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                    selectedMetric === 'students'
                      ? 'bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg shadow-red-900/50'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`}
                  onClick={() => setSelectedMetric('students')}
                >
                  Students
                </button>
                <button
                  className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                    selectedMetric === 'classes'
                      ? 'bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg shadow-red-900/50'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`}
                  onClick={() => setSelectedMetric('classes')}
                >
                  Classes
                </button>
              </div>
            </div>

            {/* Content with fade-in animation */}
            <div className="animate-fade-in">
              {selectedMetric === 'overview' && (
                <AnalyticsOverview
                  revenueByClass={revenueByClass}
                  studentProgress={studentProgress}
                  monthlyTrends={monthlyTrends}
                />
              )}

              {selectedMetric === 'revenue' && (
                <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 overflow-hidden animate-slide-up">
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-green-500/10 rounded-lg">
                        <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-100">Revenue Analytics</h3>
                        <p className="text-gray-400 text-sm">Comprehensive revenue breakdown and insights</p>
                      </div>
                    </div>
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                      <p className="text-gray-400">📊 Detailed revenue breakdown coming soon...</p>
                      <p className="text-gray-500 text-sm mt-2">Track your revenue streams, payment trends, and financial growth over time.</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedMetric === 'students' && (
                <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 overflow-hidden animate-slide-up">
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-blue-500/10 rounded-lg">
                        <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-100">Student Analytics</h3>
                        <p className="text-gray-400 text-sm">Performance metrics and engagement insights</p>
                      </div>
                    </div>
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                      <p className="text-gray-400">👥 Student performance metrics coming soon...</p>
                      <p className="text-gray-500 text-sm mt-2">Monitor student progress, attendance patterns, and achievement milestones.</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedMetric === 'classes' && (
                <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 overflow-hidden animate-slide-up">
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-purple-500/10 rounded-lg">
                        <svg className="w-8 h-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-100">Class Analytics</h3>
                        <p className="text-gray-400 text-sm">Class performance and optimization data</p>
                      </div>
                    </div>
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                      <p className="text-gray-400">🥋 Class performance analytics coming soon...</p>
                      <p className="text-gray-500 text-sm mt-2">Analyze class capacity, popular time slots, and instructor effectiveness.</p>
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
