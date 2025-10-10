import type { Class } from '../types/index';

/**
 * Get the color class for a discipline badge
 */
export const getDisciplineColor = (discipline: string): string => {
  const colors: Record<string, string> = {
    'Brazilian Jiu-Jitsu': 'badge-primary',
    'Kickboxing': 'badge-secondary',
    'Muay Thai': 'badge-accent',
    'MMA': 'badge-info',
    'Karate': 'badge-warning',
  };
  return colors[discipline] || 'badge-ghost';
};

/**
 * Get the status information for a class based on its date and time
 */
export const getClassStatus = (date: string, time: string) => {
  const classDateTime = new Date(`${date}T${time}`);
  const now = new Date();
  const diffHours = (classDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffHours < 0) return { status: 'completed', label: 'Completed', color: 'badge-ghost' };
  if (diffHours < 1) return { status: 'ongoing', label: 'In Progress', color: 'badge-success' };
  if (diffHours < 24) return { status: 'upcoming', label: 'Today', color: 'badge-warning' };
  return { status: 'scheduled', label: 'Scheduled', color: 'badge-info' };
};

/**
 * Calculate class statistics
 */
export const calculateClassStats = (classes: Class[]) => {
  const totalClasses = classes.length;
  const totalCapacity = classes.reduce((acc: number, c: Class) => acc + c.max_students, 0);
  const thisWeek = 24; // This would be calculated based on current week
  const avgAttendance = '89%'; // This would be calculated from attendance data

  return [
    { label: 'Total Classes', value: totalClasses, iconName: 'BookOpen', color: 'text-primary' },
    { label: 'This Week', value: thisWeek, iconName: 'Calendar', color: 'text-info' },
    { label: 'Total Capacity', value: totalCapacity, iconName: 'Users', color: 'text-success' },
    { label: 'Avg. Attendance', value: avgAttendance, iconName: 'TrendingUp', color: 'text-warning' },
  ];
};