import { Users, BookOpen, DollarSign, Award } from 'lucide-react';

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
  const stats = [
    {
      title: 'Active Students',
      value: isLoading ? '...' : dashboardStats.activeStudents.toString(),
      change: dashboardStats.activeStudents === 0 ? 'No data' : `${dashboardStats.activeStudents} active`,
      trend: dashboardStats.activeStudents === 0 ? 'neutral' : 'up',
      icon: Users,
      description: 'registered members',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Classes This Week',
      value: isLoading ? '...' : dashboardStats.classesThisWeek.toString(),
      change: dashboardStats.classesThisWeek === 0 ? 'No classes' : `${dashboardStats.classesThisWeek} scheduled`,
      trend: dashboardStats.classesThisWeek === 0 ? 'neutral' : 'up',
      icon: BookOpen,
      description: 'sessions this week',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      title: 'Revenue This Month',
      value: isLoading ? '...' : `$${dashboardStats.revenueThisMonth.toLocaleString()}`,
      change: dashboardStats.revenueThisMonth === 0 ? 'No revenue' : 'Monthly total',
      trend: dashboardStats.revenueThisMonth === 0 ? 'neutral' : 'up',
      icon: DollarSign,
      description: 'total earnings',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'New Enrollments',
      value: isLoading ? '...' : dashboardStats.newEnrollments.toString(),
      change: dashboardStats.newEnrollments === 0 ? 'Get started' : 'This month',
      trend: dashboardStats.newEnrollments === 0 ? 'neutral' : 'up',
      icon: Award,
      description: 'new students',
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
  ];

  return stats;
};