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

  if (diffHours < 0) return { status: 'completed', labelKey: 'completed', color: 'badge-ghost' };
  if (diffHours < 1) return { status: 'ongoing', labelKey: 'inProgress', color: 'badge-success' };
  if (diffHours < 24) return { status: 'upcoming', labelKey: 'today', color: 'badge-warning' };
  return { status: 'scheduled', labelKey: 'scheduled', color: 'badge-info' };
};

/**
 * Calculate class statistics from real data
 */
export const calculateClassStats = (classes: Class[]) => {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7); // End of week
  
  // Calculate real stats
  const totalClasses = classes.length;
  const totalCapacity = classes.reduce((acc: number, c: Class) => acc + (c.max_students || 0), 0);
  
  // Classes this week
  const thisWeek = classes.filter(c => {
    const classDate = new Date(c.date);
    return classDate >= startOfWeek && classDate < endOfWeek;
  }).length;
  
  // Calculate average attendance from enrolled_count
  const classesWithStudents = classes.filter(c => c.max_students > 0);
  const avgAttendanceValue = classesWithStudents.length > 0
    ? Math.round(
        (classesWithStudents.reduce((acc, c) => acc + ((c.enrolled_count || 0) / c.max_students), 0) / classesWithStudents.length) * 100
      )
    : 0;
  const avgAttendance = `${avgAttendanceValue}%`;

  return [
    { labelKey: 'totalClasses', value: totalClasses, iconName: 'BookOpen', color: 'text-primary' },
    { labelKey: 'thisWeek', value: thisWeek, iconName: 'Calendar', color: 'text-info' },
    { labelKey: 'totalCapacity', value: totalCapacity, iconName: 'Users', color: 'text-success' },
    { labelKey: 'avgAttendance', value: avgAttendance, iconName: 'TrendingUp', color: 'text-warning' },
  ];
};