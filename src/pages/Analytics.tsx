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
    <div className="min-h-screen bg-gray-900 pb-20 md:pb-8">
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-base-content/70">Loading analytics...</p>
          </div>
        </div>
      ) : (
        <>
          <AnalyticsHeader timeRange={timeRange} onTimeRangeChange={setTimeRange} />

          <div className="px-4 py-6 max-w-7xl mx-auto space-y-6">
            <KPICards kpis={kpis} />

            {/* Tabs */}
            <div className="tabs tabs-boxed">
              <button
                className={`tab ${selectedMetric === 'overview' ? 'tab-active' : ''}`}
                onClick={() => setSelectedMetric('overview')}
              >
                Overview
              </button>
              <button
                className={`tab ${selectedMetric === 'revenue' ? 'tab-active' : ''}`}
                onClick={() => setSelectedMetric('revenue')}
              >
                Revenue
              </button>
              <button
                className={`tab ${selectedMetric === 'students' ? 'tab-active' : ''}`}
                onClick={() => setSelectedMetric('students')}
              >
                Students
              </button>
              <button
                className={`tab ${selectedMetric === 'classes' ? 'tab-active' : ''}`}
                onClick={() => setSelectedMetric('classes')}
              >
                Classes
              </button>
            </div>

            {selectedMetric === 'overview' && (
              <AnalyticsOverview
                revenueByClass={revenueByClass}
                studentProgress={studentProgress}
                monthlyTrends={monthlyTrends}
              />
            )}

            {selectedMetric === 'revenue' && (
              <div className="card bg-base-200">
                <div className="card-body">
                  <h3 className="card-title">Revenue Analytics</h3>
                  <p className="text-base-content/70">Detailed revenue breakdown coming soon...</p>
                </div>
              </div>
            )}

            {selectedMetric === 'students' && (
              <div className="card bg-base-200">
                <div className="card-body">
                  <h3 className="card-title">Student Analytics</h3>
                  <p className="text-base-content/70">Student performance metrics coming soon...</p>
                </div>
              </div>
            )}

            {selectedMetric === 'classes' && (
              <div className="card bg-base-200">
                <div className="card-body">
                  <h3 className="card-title">Class Analytics</h3>
                  <p className="text-base-content/70">Class performance analytics coming soon...</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
