import { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, Users, DollarSign,
  Calendar, Target, Activity, Download,
  ChevronDown, Filter, RefreshCw
} from 'lucide-react';
import type { Student, Payment, Class } from '../types';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [studentsRes, paymentsRes, classesRes] = await Promise.all([
          fetch('/api/students'),
          fetch('/api/payments'),
          fetch('/api/classes'),
        ]);

        if (studentsRes.ok) {
          const studentsData = await studentsRes.json();
          setStudents(studentsData);
        }
        if (paymentsRes.ok) {
          const paymentsData = await paymentsRes.json();
          setPayments(paymentsData);
        }
        if (classesRes.ok) {
          const classesData = await classesRes.json();
          setClasses(classesData);
        }
      } catch (error) {
        console.error('Failed to load analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

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

  const revenueByClass = [
    { class: 'Adult BJJ', revenue: 8500, students: 45, color: 'bg-primary' },
    { class: 'Teen Kickboxing', revenue: 6200, students: 38, color: 'bg-secondary' },
    { class: 'Kids Karate', revenue: 5800, students: 42, color: 'bg-accent' },
    { class: 'MMA Training', revenue: 4080, students: 31, color: 'bg-info' },
  ];

  const studentProgress = [
    { belt: 'White', count: 45, percentage: 28.8 },
    { belt: 'Yellow', count: 32, percentage: 20.5 },
    { belt: 'Orange', count: 28, percentage: 17.9 },
    { belt: 'Green', count: 22, percentage: 14.1 },
    { belt: 'Blue', count: 15, percentage: 9.6 },
    { belt: 'Brown', count: 10, percentage: 6.4 },
    { belt: 'Black', count: 4, percentage: 2.6 },
  ];

  const monthlyTrends = [
    { month: 'Jan', revenue: 18500, students: 142, attendance: 85 },
    { month: 'Feb', revenue: 19200, students: 145, attendance: 87 },
    { month: 'Mar', revenue: 20100, students: 148, attendance: 86 },
    { month: 'Apr', revenue: 21500, students: 150, attendance: 88 },
    { month: 'May', revenue: 22800, students: 153, attendance: 89 },
    { month: 'Jun', revenue: 24580, students: 156, attendance: 89 },
  ];

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
