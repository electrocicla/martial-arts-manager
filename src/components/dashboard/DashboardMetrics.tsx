import { useNavigate } from 'react-router-dom';
import { Target, Activity, Users, Calendar, DollarSign, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import type { DashboardStats } from '../../hooks/useDashboardData';

interface DashboardMetricsProps {
  dashboardStats: DashboardStats;
  isLoading: boolean;
}

export default function DashboardMetrics({ dashboardStats, isLoading }: DashboardMetricsProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 dashboard-section">
      <div className="card bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/30 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
        <div className="card-body p-4 sm:p-6">
          <h3 className="card-title text-base sm:text-lg text-base-content flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary" />
            {t('dashboard.metrics.monthlyProgress')}
          </h3>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-sm">Loading progress...</span>
            </div>
          ) : dashboardStats.totalStudents === 0 ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">{t('dashboard.metrics.noDataAvailableYet')}</p>
                <p className="text-sm text-gray-400 mt-1">{t('dashboard.metrics.startByAddingStudentsAndClasses')}</p>
              </div>
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/students')}
              >
                {t('dashboard.metrics.addFirstStudent')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center text-sm sm:text-base mb-2">
                  <span className="font-medium">{t('dashboard.metrics.totalStudents')}</span>
                  <span className="font-bold text-primary">{dashboardStats.totalStudents}</span>
                </div>
                <div className="relative">
                  <progress className="progress progress-primary w-full h-3" value="100" max="100"></progress>
                  <span className="absolute right-1 top-0 text-xs font-bold text-primary-content">Active</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center text-sm sm:text-base mb-2">
                  <span className="font-medium">{t('dashboard.metrics.monthlyRevenue')}</span>
                  <span className="font-bold text-secondary">${dashboardStats.revenueThisMonth.toLocaleString()}</span>
                </div>
                <div className="relative">
                  <progress className="progress progress-secondary w-full h-3" value={dashboardStats.revenueThisMonth > 0 ? "100" : "0"} max="100"></progress>
                  <span className="absolute right-1 top-0 text-xs font-bold text-secondary-content">
                    {dashboardStats.revenueThisMonth > 0 ? t('dashboard.metrics.earning') : t('dashboard.stats.noRevenue')}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center text-sm sm:text-base mb-2">
                  <span className="font-medium">{t('dashboard.metrics.totalClasses')}</span>
                  <span className="font-bold text-success">{dashboardStats.classesThisWeek}</span>
                </div>
                <div className="relative">
                  <progress className="progress progress-success w-full h-3" value={dashboardStats.classesThisWeek > 0 ? "100" : "0"} max="100"></progress>
                  <span className="absolute right-1 top-0 text-xs font-bold text-success-content">
                    {dashboardStats.classesThisWeek > 0 ? t('dashboard.metrics.scheduled') : t('dashboard.stats.noClasses')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card bg-gradient-to-br from-info/10 to-success/10 border border-info/30 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
        <div className="card-body p-4 sm:p-6">
          <h3 className="card-title text-base sm:text-lg text-base-content flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-info" />
            {t('dashboard.quickActions.title')}
          </h3>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-info" />
              <span className="ml-2 text-sm">Loading actions...</span>
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                leftIcon={<Users className="w-6 h-6" />}
                onClick={() => navigate('/students')}
              >
                {t('dashboard.metrics.manageStudents')}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                leftIcon={<Calendar className="w-6 h-6" />}
                onClick={() => navigate('/classes')}
              >
                {t('dashboard.metrics.scheduleClasses')}
              </Button>
              <Button
                variant="outline"
                size="lg"
                fullWidth
                leftIcon={<DollarSign className="w-6 h-6" />}
                onClick={() => navigate('/payments')}
              >
                {t('dashboard.metrics.recordPayments')}
              </Button>
            </div>
          )}
          {dashboardStats.totalStudents === 0 && !isLoading && (
            <div className="mt-4 p-4 bg-base-200 rounded-lg">
              <p className="text-sm text-gray-600">
                {t('dashboard.metrics.welcomeMessage')}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}