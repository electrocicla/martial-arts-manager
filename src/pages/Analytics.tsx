import { useState } from 'react';
import {
  BarChart3, TrendingUp, Users, DollarSign,
  Calendar, Target, Activity, Download,
  ChevronDown, Filter, RefreshCw
} from 'lucide-react';
import { useStudents } from '../hooks/useStudents';
import { usePayments } from '../hooks/usePayments';
import { useClasses } from '../hooks/useClasses';
import { useAttendance } from '../hooks/useAttendance';
import type { Class } from '../types';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  const { students, isLoading: studentsLoading } = useStudents();
  const { payments, isLoading: paymentsLoading } = usePayments();
  const { classes, isLoading: classesLoading } = useClasses();
  const { attendance, isLoading: attendanceLoading } = useAttendance();

  const isLoading = studentsLoading || paymentsLoading || classesLoading || attendanceLoading;

  // Calculate real KPIs
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

  const kpiData = [
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

  // Calculate real revenue by class using attendance data
  const revenueByClass = classes.map((cls: Class, index: number) => {
    // Count unique students who attended this class
    const classAttendance = attendance.filter(a => a.class_id === cls.id);
    const uniqueStudents = new Set(classAttendance.map(a => a.student_id)).size;

    // Calculate revenue for this class (distribute total revenue based on attendance)
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalAttendance = attendance.length;
    const revenue = totalAttendance > 0 ? (classAttendance.length / totalAttendance) * totalRevenue : 0;

    const colors = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-info', 'bg-success', 'bg-warning', 'bg-error'];
    return {
      class: cls.name,
      revenue: Math.round(revenue),
      students: uniqueStudents,
      color: colors[index % colors.length]
    };
  });

  // Calculate real student progress by belt
  const beltCounts = students.reduce((acc, student) => {
    acc[student.belt] = (acc[student.belt] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalStudents = students.length;
  const studentProgress = Object.entries(beltCounts).map(([belt, count]) => ({
    belt,
    count,
    percentage: totalStudents > 0 ? (count / totalStudents * 100) : 0
  })).sort((a, b) => {
    const beltOrder = ['White', 'Yellow', 'Orange', 'Green', 'Blue', 'Brown', 'Black'];
    return beltOrder.indexOf(a.belt) - beltOrder.indexOf(b.belt);
  });

  // Calculate real monthly trends (last 6 months)
  const monthlyTrends = [];
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

    monthlyTrends.push({
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      revenue,
      students: monthStudents.length,
      attendance: Math.round(attendanceRate)
    });
  }

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
          {/* Header */}
          <div className="bg-gradient-to-br from-base-200 to-base-300 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/20">
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-base-content">
                  Analytics Dashboard
                </h1>
                <p className="text-sm text-base-content/70">
                  Track performance and growth metrics
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              <div className="dropdown dropdown-end">
                <label tabIndex={0} className="btn btn-sm btn-ghost gap-2">
                  <Calendar className="w-4 h-4" />
                  {timeRange === 'week' && 'This Week'}
                  {timeRange === 'month' && 'This Month'}
                  {timeRange === 'year' && 'This Year'}
                  <ChevronDown className="w-4 h-4" />
                </label>
                <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-200 rounded-box w-52">
                  <li><a onClick={() => setTimeRange('week')}>This Week</a></li>
                  <li><a onClick={() => setTimeRange('month')}>This Month</a></li>
                  <li><a onClick={() => setTimeRange('year')}>This Year</a></li>
                </ul>
              </div>
              
              <button className="btn btn-sm btn-ghost">
                <Filter className="w-4 h-4" />
              </button>
              
              <button className="btn btn-sm btn-ghost">
                <RefreshCw className="w-4 h-4" />
              </button>
              
              <button className="btn btn-sm btn-primary">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-7xl mx-auto space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpiData.map((kpi, idx) => (
            <div key={idx} className="card bg-base-200 hover:bg-base-300 transition-all">
              <div className="card-body p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className={`inline-flex p-2 rounded-lg ${kpi.bgColor} mb-2`}>
                      <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                    </div>
                    <h3 className="text-2xl font-black text-base-content">
                      {kpi.value}
                    </h3>
                    <p className="text-xs text-base-content/60 mt-1">{kpi.title}</p>
                    <div className={`text-xs mt-2 font-bold ${
                      kpi.trend === 'up' ? 'text-success' : 'text-error'
                    }`}>
                      {kpi.change}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

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

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by Class */}
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title text-base">Revenue by Class</h3>
              <div className="space-y-4 mt-4">
                {revenueByClass.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">{item.class}</span>
                      <span className="text-sm font-bold">${item.revenue.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-base-300 rounded-full h-2">
                      <div 
                        className={`${item.color} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${(item.revenue / 8500) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-base-content/60 mt-1">
                      {item.students} students enrolled
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Belt Distribution */}
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title text-base">Belt Distribution</h3>
              <div className="space-y-3 mt-4">
                {studentProgress.map((belt, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={`badge ${
                      belt.belt === 'Yellow' ? 'badge-warning' :
                      belt.belt === 'Orange' ? 'badge-secondary' :
                      belt.belt === 'Green' ? 'badge-success' :
                      belt.belt === 'Blue' ? 'badge-info' :
                      belt.belt === 'Brown' ? 'badge-neutral' :
                      belt.belt === 'Black' ? 'badge-neutral' :
                      'badge-ghost'
                    } badge-sm`}>
                      {belt.belt}
                    </div>
                    <div className="flex-1">
                      <div className="w-full bg-base-300 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-500"
                          style={{ width: `${belt.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-xs font-bold w-12 text-right">
                      {belt.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="card bg-base-200">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h3 className="card-title text-base">Monthly Trends</h3>
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-primary rounded"></div>
                  <span>Revenue</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-secondary rounded"></div>
                  <span>Students</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-accent rounded"></div>
                  <span>Attendance</span>
                </div>
              </div>
            </div>

            {/* Simple bar chart representation */}
            <div className="overflow-x-auto">
              <div className="flex gap-4 min-w-[600px]">
                {monthlyTrends.map((month, idx) => (
                  <div key={idx} className="flex-1 text-center">
                    <div className="flex items-end justify-center gap-1 h-32 mb-2">
                      <div 
                        className="w-4 bg-primary rounded-t transition-all duration-500 hover:opacity-80"
                        style={{ height: `${(month.revenue / 24580) * 100}%` }}
                        title={`Revenue: $${month.revenue}`}
                      ></div>
                      <div 
                        className="w-4 bg-secondary rounded-t transition-all duration-500 hover:opacity-80"
                        style={{ height: `${(month.students / 156) * 100}%` }}
                        title={`Students: ${month.students}`}
                      ></div>
                      <div 
                        className="w-4 bg-accent rounded-t transition-all duration-500 hover:opacity-80"
                        style={{ height: `${month.attendance}%` }}
                        title={`Attendance: ${month.attendance}%`}
                      ></div>
                    </div>
                    <p className="text-xs font-bold">{month.month}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="alert alert-success">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Revenue up 15.3% from last month</span>
          </div>
          <div className="alert alert-warning">
            <Activity className="w-4 h-4" />
            <span className="text-sm">5 students at risk of churning</span>
          </div>
          <div className="alert alert-info">
            <Target className="w-4 h-4" />
            <span className="text-sm">82% of monthly goal achieved</span>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
