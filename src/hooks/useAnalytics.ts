import { useMemo } from 'react';
import { useStudents } from './useStudents';
import { usePayments } from './usePayments';
import { useClasses } from './useClasses';
import { useAttendance } from './useAttendance';
import {
  calculateKPIs,
  calculateRevenueByClass,
  calculateRevenueByDiscipline,
  calculateStudentProgress,
  calculateMonthlyTrends,
  type KPIMetric,
  type RevenueByClass,
  type StudentProgress,
  type MonthlyTrend
} from '../lib/analyticsUtils';

export function useAnalyticsKPIs(): {
  kpis: KPIMetric[];
  isLoading: boolean;
} {
  const { students, isLoading: studentsLoading } = useStudents();
  const { payments, isLoading: paymentsLoading } = usePayments();
  const { classes, isLoading: classesLoading } = useClasses();

  const isLoading = studentsLoading || paymentsLoading || classesLoading;

  const kpis = useMemo(() => {
    if (isLoading) return [];
    return calculateKPIs(students, payments, classes);
  }, [students, payments, classes, isLoading]);

  return { kpis, isLoading };
}

export function useRevenueAnalytics(): {
  revenueByClass: RevenueByClass[];
  revenueByDiscipline: import('../lib/analyticsUtils').RevenueByDiscipline[];
  isLoading: boolean;
} {
  const { classes, isLoading: classesLoading } = useClasses();
  const { payments, isLoading: paymentsLoading } = usePayments();
  const { attendance, isLoading: attendanceLoading } = useAttendance();

  const isLoading = classesLoading || paymentsLoading || attendanceLoading;

  const revenueByClass = useMemo(() => {
    if (isLoading) return [];
    return calculateRevenueByClass(classes, payments, attendance);
  }, [classes, payments, attendance, isLoading]);

  const revenueByDiscipline = useMemo(() => {
    if (isLoading) return [];
    return calculateRevenueByDiscipline(classes, payments, attendance);
  }, [classes, payments, attendance, isLoading]);

  return { revenueByClass, revenueByDiscipline, isLoading };
}

export function useStudentProgressAnalytics(): {
  studentProgress: StudentProgress[];
  isLoading: boolean;
} {
  const { students, isLoading } = useStudents();

  const studentProgress = useMemo(() => {
    if (isLoading) return [];
    return calculateStudentProgress(students);
  }, [students, isLoading]);

  return { studentProgress, isLoading };
}

export function useMonthlyTrendsAnalytics(): {
  monthlyTrends: MonthlyTrend[];
  isLoading: boolean;
} {
  const { payments, isLoading: paymentsLoading } = usePayments();
  const { students, isLoading: studentsLoading } = useStudents();
  const { attendance, isLoading: attendanceLoading } = useAttendance();

  const isLoading = paymentsLoading || studentsLoading || attendanceLoading;

  const monthlyTrends = useMemo(() => {
    if (isLoading) return [];
    return calculateMonthlyTrends(payments, students, attendance);
  }, [payments, students, attendance, isLoading]);

  return { monthlyTrends, isLoading };
}