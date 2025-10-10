import type { Student, Payment, Class, Attendance } from '../types';

export interface KPIMetric {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: any;
  color: string;
  bgColor: string;
}

export interface RevenueByClass {
  class: string;
  revenue: number;
  students: number;
  color: string;
}

export interface StudentProgress {
  belt: string;
  count: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: string;
  revenue: number;
  students: number;
  attendance: number;
}

export function calculateKPIs(
  students: Student[],
  payments: Payment[],
  classes: Class[]
): KPIMetric[] {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const thisMonthPayments = payments.filter(p => new Date(p.date) >= monthStart);
  const lastMonthPayments = payments.filter(p =>
    new Date(p.date) >= lastMonthStart && new Date(p.date) <= lastMonthEnd
  );

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const thisMonthRevenue = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0);
  const lastMonthRevenue = lastMonthPayments.reduce((sum, p) => sum + p.amount, 0);
  const revenueChange = lastMonthRevenue > 0 ?
    ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1) : '0';

  const activeStudents = students.filter(s => s.is_active === 1).length;
  const thisMonthStudents = students.filter(s =>
    new Date(s.join_date) >= monthStart
  ).length;

  return [
    {
      title: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString()}`,
      change: lastMonthRevenue > 0 ? `${revenueChange}%` : 'No data',
      trend: thisMonthRevenue >= lastMonthRevenue ? 'up' : 'down',
      icon: DollarSign,
      color: 'text-success',
      bgColor: 'bg-success/20'
    },
    {
      title: 'Active Students',
      value: activeStudents.toString(),
      change: `+${thisMonthStudents} this month`,
      trend: 'up',
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/20'
    },
    {
      title: 'Total Classes',
      value: classes.length.toString(),
      change: 'Scheduled',
      trend: 'neutral',
      icon: Calendar,
      color: 'text-info',
      bgColor: 'bg-info/20'
    },
    {
      title: 'This Month Revenue',
      value: `$${thisMonthRevenue.toLocaleString()}`,
      change: 'Current month',
      trend: 'neutral',
      icon: TrendingUp,
      color: 'text-warning',
      bgColor: 'bg-warning/20'
    },
  ];
}

export function calculateRevenueByClass(
  classes: Class[],
  payments: Payment[],
  attendance: Attendance[]
): RevenueByClass[] {
  const colors = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-info', 'bg-success', 'bg-warning', 'bg-error'];

  return classes.map((cls: Class, index: number) => {
    // Count unique students who attended this class
    const classAttendance = attendance.filter(a => a.class_id === cls.id);
    const uniqueStudents = new Set(classAttendance.map(a => a.student_id)).size;

    // Calculate revenue for this class (distribute total revenue based on attendance)
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalAttendance = attendance.length;
    const revenue = totalAttendance > 0 ? (classAttendance.length / totalAttendance) * totalRevenue : 0;

    return {
      class: cls.name,
      revenue: Math.round(revenue),
      students: uniqueStudents,
      color: colors[index % colors.length]
    };
  });
}

export function calculateStudentProgress(students: Student[]): StudentProgress[] {
  const beltCounts = students.reduce((acc, student) => {
    acc[student.belt] = (acc[student.belt] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalStudents = students.length;

  return Object.entries(beltCounts).map(([belt, count]) => ({
    belt,
    count,
    percentage: totalStudents > 0 ? (count / totalStudents * 100) : 0
  })).sort((a, b) => {
    const beltOrder = ['White', 'Yellow', 'Orange', 'Green', 'Blue', 'Brown', 'Black'];
    return beltOrder.indexOf(a.belt) - beltOrder.indexOf(b.belt);
  });
}

export function calculateMonthlyTrends(
  payments: Payment[],
  students: Student[],
  attendance: Attendance[]
): MonthlyTrend[] {
  const trends: MonthlyTrend[] = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const monthPayments = payments.filter(p => {
      const paymentDate = new Date(p.date);
      return paymentDate >= monthStart && paymentDate <= monthEnd;
    });

    const monthStudents = students.filter(s => {
      const joinDate = new Date(s.join_date);
      return joinDate >= monthStart && joinDate <= monthEnd;
    });

    const monthAttendance = attendance.filter(a => {
      const attendanceDate = new Date(a.created_at);
      return attendanceDate >= monthStart && attendanceDate <= monthEnd;
    });

    const attendanceRate = monthAttendance.length > 0 ?
      (monthAttendance.filter(a => a.attended === 1).length / monthAttendance.length * 100) : 0;

    const revenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);

    trends.push({
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      revenue,
      students: monthStudents.length,
      attendance: Math.round(attendanceRate)
    });
  }

  return trends;
}

// Import icons that are used in the analytics
import { DollarSign, Users, Calendar, TrendingUp } from 'lucide-react';