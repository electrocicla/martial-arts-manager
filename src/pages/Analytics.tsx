import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TabButton } from '../components/ui/TabButton';
import { AnalyticsHeader, KPICards, AnalyticsOverview } from '../components/analytics';
import RevenueAnalytics from '../components/analytics/RevenueAnalytics';
import StudentAnalytics from '../components/analytics/StudentAnalytics';
import ClassAnalytics from '../components/analytics/ClassAnalytics';
import { useAnalyticsKPIs, useRevenueAnalytics, useStudentProgressAnalytics, useMonthlyTrendsAnalytics } from '../hooks/useAnalytics';
import { useStudents } from '../hooks/useStudents';
import { useClasses } from '../hooks/useClasses';
import { useAttendance } from '../hooks/useAttendance';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const { t } = useTranslation();

  const { students } = useStudents();
  const { classes } = useClasses();
  const { attendance } = useAttendance();
  const { kpis, isLoading: kpisLoading } = useAnalyticsKPIs();
  const { revenueByClass, revenueByDiscipline, isLoading: revenueLoading } = useRevenueAnalytics();
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
                <TabButton
                  isActive={selectedMetric === 'overview'}
                  onClick={() => setSelectedMetric('overview')}
                  accent="red"
                >
                  {t('analytics.tabs.overview')}
                </TabButton>
                <TabButton
                  isActive={selectedMetric === 'revenue'}
                  onClick={() => setSelectedMetric('revenue')}
                  accent="red"
                >
                  {t('analytics.tabs.revenue')}
                </TabButton>
                <TabButton
                  isActive={selectedMetric === 'students'}
                  onClick={() => setSelectedMetric('students')}
                  accent="red"
                >
                  {t('analytics.tabs.students')}
                </TabButton>
                <TabButton
                  isActive={selectedMetric === 'classes'}
                  onClick={() => setSelectedMetric('classes')}
                  accent="red"
                >
                  {t('analytics.tabs.classes')}
                </TabButton>
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
                <RevenueAnalytics revenueByClass={revenueByClass} monthlyTrends={monthlyTrends} revenueByDiscipline={revenueByDiscipline} />
              )}

              {selectedMetric === 'students' && (
                <StudentAnalytics studentProgress={studentProgress} monthlyTrends={monthlyTrends} students={students} />
              )}

              {selectedMetric === 'classes' && (
                <ClassAnalytics classes={classes} attendance={attendance} />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
