import { Users, BookOpen, DollarSign, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LocalDashboardStats {
  totalStudents: number;
  activeStudents: number;
  classesThisWeek: number;
  revenueThisMonth: number;
  newEnrollments: number;
  upcomingClasses: number;
}

/**
 * Custom hook for configuring dashboard statistics
 */
export const useDashboardStats = (dashboardStats: LocalDashboardStats, isLoading: boolean) => {
  const { t } = useTranslation();

  const stats = [
    {
      title: t('dashboard.stats.activeStudents'),
      value: isLoading ? '...' : dashboardStats.activeStudents.toString(),
      change: dashboardStats.activeStudents === 0 ? t('common.noData') : `${dashboardStats.activeStudents} ${t('dashboard.stats.active')}`,
      trend: dashboardStats.activeStudents === 0 ? 'neutral' : 'up',
      icon: Users,
      description: t('dashboard.stats.registeredMembers'),
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: t('dashboard.stats.classesThisWeek'),
      value: isLoading ? '...' : dashboardStats.classesThisWeek.toString(),
      change: dashboardStats.classesThisWeek === 0 ? t('dashboard.stats.noClasses') : `${dashboardStats.classesThisWeek} ${t('dashboard.stats.scheduled')}`,
      trend: dashboardStats.classesThisWeek === 0 ? 'neutral' : 'up',
      icon: BookOpen,
      description: t('dashboard.stats.sessionsThisWeek'),
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      title: t('dashboard.stats.revenueThisMonth'),
      value: isLoading ? '...' : `$${dashboardStats.revenueThisMonth.toLocaleString()}`,
      change: dashboardStats.revenueThisMonth === 0 ? t('dashboard.stats.noRevenue') : t('dashboard.stats.monthlyTotal'),
      trend: dashboardStats.revenueThisMonth === 0 ? 'neutral' : 'up',
      icon: DollarSign,
      description: t('dashboard.stats.totalEarnings'),
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: t('dashboard.stats.newEnrollments'),
      value: isLoading ? '...' : dashboardStats.newEnrollments.toString(),
      change: dashboardStats.newEnrollments === 0 ? t('dashboard.stats.getStarted') : t('dashboard.stats.thisMonth'),
      trend: dashboardStats.newEnrollments === 0 ? 'neutral' : 'up',
      icon: Award,
      description: t('dashboard.stats.newStudents'),
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
  ];

  return stats;
};