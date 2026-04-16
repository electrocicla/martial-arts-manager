import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, TrendingUp, Calendar, UserX } from 'lucide-react';
import type { Student } from '../types/index';
import type { ComponentType } from 'react';

interface StudentStatsItem {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  color: string;
}

/**
 * useStudentStats Hook
 * Single Responsibility: Calculate and provide student statistics
 * Follows SRP by focusing only on statistics calculation logic
 */
export const useStudentStats = (students: Student[], studentStats?: { total?: number; active?: number }): StudentStatsItem[] => {
  const { t } = useTranslation();
  const stats = useMemo(() => {
    const totalStudents = studentStats?.total || students.length;
    const activeStudents = studentStats?.active || students.filter((s: Student) => s.is_active).length;

    const thisMonthStudents = students.filter((s: Student) => {
      try {
        const studentDate = new Date(s.join_date || Date.now());
        const currentDate = new Date();
        return studentDate.getMonth() === currentDate.getMonth() &&
               studentDate.getFullYear() === currentDate.getFullYear();
      } catch {
        return false;
      }
    }).length;

    const inactiveStudents = totalStudents - activeStudents;

    return [
      {
        label: t('studentStats.totalStudents'),
        value: totalStudents,
        icon: Users,
        color: 'text-primary'
      },
      {
        label: t('studentStats.active'),
        value: activeStudents,
        icon: TrendingUp,
        color: 'text-success'
      },
      {
        label: t('studentStats.thisMonth'),
        value: thisMonthStudents,
        icon: Calendar,
        color: 'text-info'
      },
      {
        label: t('studentStats.inactive'),
        value: inactiveStudents,
        icon: UserX,
        color: 'text-warning'
      },
    ];
  }, [students, studentStats, t]);

  return stats;
};