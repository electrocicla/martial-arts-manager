import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, Calendar, DollarSign, Award, Clock, AlertCircle, ChevronRight, Activity, Target, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const greeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const stats = [
    {
      title: 'Active Students',
      value: '156',
      change: '+12%',
      trend: 'up',
      icon: Users,
      bgGradient: 'from-primary to-secondary',
      iconBg: 'bg-primary/20',
    },
    {
      title: 'Classes This Week',
      value: '24',
      change: '+5%',
      trend: 'up',
      icon: BookOpen,
      bgGradient: 'from-secondary to-accent',
      iconBg: 'bg-secondary/20',
    },
    {
      title: 'Pending Payments',
      value: '8',
      change: '3 overdue',
      trend: 'warning',
      icon: DollarSign,
      bgGradient: 'from-warning to-error',
      iconBg: 'bg-warning/20',
    },
    {
      title: 'Upcoming Tests',
      value: '12',
      change: 'Next: Jan 15',
      trend: 'neutral',
      icon: Award,
      bgGradient: 'from-info to-primary',
      iconBg: 'bg-info/20',
    },
  ];

  const quickActions = [
    { 
      title: 'Mark Attendance', 
      icon: Clock, 
      color: 'btn-primary',
      subtitle: 'Check in/out students',
      path: '/attendance'
    },
    { 
      title: 'Schedule Class', 
      icon: Calendar, 
      color: 'btn-secondary',
      subtitle: 'Add new session',
      path: '/classes'
    },
    { 
      title: 'Add Student', 
      icon: Users, 
      color: 'btn-accent',
      subtitle: 'Register member',
      path: '/students'
    },
    { 
      title: 'Record Payment', 
      icon: DollarSign, 
      color: 'btn-info',
      subtitle: 'Process transaction',
      path: '/payments'
    },
  ];

  const todayClasses = [
    {
      id: 1,
      name: 'Adult BJJ',
      time: '4:00 PM - 5:30 PM',
      instructor: 'Sensei Yamamoto',
      students: '15/20',
      status: 'upcoming',
      level: 'Advanced',
    },
    {
      id: 2,
      name: 'Teen Kickboxing',
      time: '6:00 PM - 7:00 PM',
      instructor: 'Coach Miller',
      students: '18/20',
      status: 'upcoming',
      level: 'Intermediate',
    },
    {
      id: 3,
      name: 'Kids Karate',
      time: '7:30 PM - 8:30 PM',
      instructor: 'Sensei Johnson',
      students: '12/15',
      status: 'upcoming',
      level: 'Beginner',
    },
  ];

  const recentActivity = [
    { icon: '🥋', text: 'John Doe promoted to Yellow Belt', time: '2 hours ago', type: 'success' },
    { icon: '💰', text: 'Payment received from Sarah Smith', time: '3 hours ago', type: 'info' },
    { icon: '📅', text: 'New class scheduled for tomorrow', time: '5 hours ago', type: 'warning' },
    { icon: '👥', text: 'New student enrolled: Mike Johnson', time: '1 day ago', type: 'primary' },
  ];

  return (
    <div className="min-h-screen bg-base-100 pb-24 md:pb-4">
      {/* Mobile-First Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-base-200/50 to-base-300/30 px-4 sm:px-6 pt-4 pb-6">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 bg-primary/10 rounded-full filter blur-2xl" />
        <div className="absolute bottom-0 left-0 w-40 sm:w-64 h-40 sm:h-64 bg-secondary/10 rounded-full filter blur-2xl" />
        
        <div className="relative max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-base-content leading-tight">
              {greeting()}, <span className="text-primary font-black">Sensei {user?.name?.split(' ')[0] || 'Master'}!</span>
            </h1>
            <p className="text-base-content/70 text-sm sm:text-base">
              Here's what's happening at your dojo today
            </p>
          </div>

          {/* Mobile-Optimized Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {stats.map((stat, idx) => (
              <div key={idx} className="card bg-base-100/80 backdrop-blur-sm border border-base-300/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <div className="card-body p-3 sm:p-4">
                  <div className="flex flex-col">
                    <div className={`inline-flex p-2 rounded-xl ${stat.iconBg} mb-3 w-fit`}>
                      <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-base-content" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-base-content mb-1">
                      {stat.value}
                    </h3>
                    <p className="text-xs text-base-content/60 font-medium leading-tight">{stat.title}</p>
                    <div className={`text-xs mt-2 font-bold ${
                      stat.trend === 'up' ? 'text-success' : 
                      stat.trend === 'warning' ? 'text-warning' : 
                      'text-base-content/50'
                    }`}>
                      {stat.change}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-8">
        {/* Mobile-Optimized Quick Actions */}
        <section>
          <h2 className="text-lg sm:text-xl font-bold text-base-content mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => navigate(action.path)}
                className={`btn ${action.color} btn-block h-auto py-6 px-4 flex-col gap-3 hover:scale-[1.02] transition-all duration-200 shadow-sm rounded-2xl`}
              >
                <action.icon className="w-7 h-7 sm:w-8 sm:h-8" />
                <div className="text-center w-full">
                  <div className="font-bold text-sm sm:text-base">{action.title}</div>
                  <div className="text-xs opacity-80 mt-1 leading-tight">{action.subtitle}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Today's Schedule - Mobile Optimized */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-base-content flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Today's Schedule
            </h2>
            <button className="btn btn-ghost btn-sm text-xs sm:text-sm hover:bg-primary/10" onClick={() => navigate('/calendar')}>
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {todayClasses.map((cls) => (
              <div key={cls.id} className="card bg-base-200/50 backdrop-blur-sm border border-base-300/20 hover:bg-base-300/60 hover:border-primary/30 transition-all duration-300 active:scale-[0.98]">
                <div className="card-body p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-bold text-base sm:text-lg text-base-content truncate">{cls.name}</h3>
                        <div className={`badge badge-sm sm:badge-md ${
                          cls.level === 'Advanced' ? 'badge-error' :
                          cls.level === 'Intermediate' ? 'badge-warning' :
                          'badge-success'
                        }`}>
                          {cls.level}
                        </div>
                      </div>
                      <p className="text-sm sm:text-base text-base-content/70 mb-3 font-medium">{cls.time}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                        <span className="flex items-center gap-1.5 text-base-content/60">
                          <Users className="w-3.5 h-3.5 text-primary" />
                          <span className="font-medium">{cls.students}</span> students
                        </span>
                        <span className="text-base-content/50 font-medium">
                          👨‍🏫 {cls.instructor}
                        </span>
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end gap-2">
                      <div className={`badge badge-lg sm:badge-md ${
                        cls.status === 'ongoing' ? 'badge-success' :
                        cls.status === 'upcoming' ? 'badge-warning' :
                        'badge-ghost'
                      }`}>
                        {cls.status === 'ongoing' ? '🔴 Live' :
                         cls.status === 'upcoming' ? '⏰ Soon' : cls.status}
                      </div>
                      <button className="btn btn-ghost btn-xs sm:btn-sm text-primary hover:bg-primary/10">
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Add Class Button */}
            <div className="pt-2">
              <button className="btn btn-outline btn-primary w-full sm:w-auto">
                <Calendar className="w-4 h-4" />
                Schedule New Class
              </button>
            </div>
          </div>
        </section>

        {/* Recent Activity - Mobile Optimized */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-base-content flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Recent Activity
            </h2>
            <button className="btn btn-ghost btn-sm text-xs sm:text-sm">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="card bg-base-200/50 backdrop-blur-sm border border-base-300/20">
            <div className="card-body p-0">
              {recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-start sm:items-center gap-3 p-3 sm:p-4 hover:bg-base-300/50 transition-all duration-200 border-b border-base-300/30 last:border-0 active:scale-[0.98]">
                  <div className="text-xl sm:text-2xl flex-shrink-0 mt-0.5 sm:mt-0">{activity.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-medium text-base-content leading-tight mb-1">
                      {activity.text}
                    </p>
                    <p className="text-xs text-base-content/60">{activity.time}</p>
                  </div>
                  <div className={`badge badge-sm sm:badge-md badge-${activity.type} flex-shrink-0`}>
                    <span className="hidden sm:inline">{activity.type}</span>
                    <span className="sm:hidden">
                      {activity.type === 'success' ? '✓' : 
                       activity.type === 'info' ? 'ℹ' : 
                       activity.type === 'warning' ? '⚠' : '●'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Performance Metrics - Mobile Enhanced */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="card bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/30 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="card-body p-4 sm:p-6">
              <h3 className="card-title text-base sm:text-lg text-base-content flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-primary" />
                Monthly Goal Progress
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center text-sm sm:text-base mb-2">
                    <span className="font-medium">New Enrollments</span>
                    <span className="font-bold text-primary">18/25</span>
                  </div>
                  <div className="relative">
                    <progress className="progress progress-primary w-full h-3" value="72" max="100"></progress>
                    <span className="absolute right-1 top-0 text-xs font-bold text-primary-content">72%</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center text-sm sm:text-base mb-2">
                    <span className="font-medium">Revenue Target</span>
                    <span className="font-bold text-secondary">$8,200/$10,000</span>
                  </div>
                  <div className="relative">
                    <progress className="progress progress-secondary w-full h-3" value="82" max="100"></progress>
                    <span className="absolute right-1 top-0 text-xs font-bold text-secondary-content">82%</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center text-sm sm:text-base mb-2">
                    <span className="font-medium">Class Attendance</span>
                    <span className="font-bold text-success">89%</span>
                  </div>
                  <div className="relative">
                    <progress className="progress progress-success w-full h-3" value="89" max="100"></progress>
                    <span className="absolute right-1 top-0 text-xs font-bold text-success-content">89%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-warning/10 to-error/10 border border-warning/30 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="card-body p-4 sm:p-6">
              <h3 className="card-title text-base sm:text-lg text-base-content flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-warning" />
                Needs Attention
              </h3>
              <div className="space-y-3">
                <div className="alert alert-warning py-3 px-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💸</span>
                    <span className="text-sm sm:text-base font-medium">3 overdue payments</span>
                  </div>
                </div>
                <div className="alert alert-info py-3 px-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📊</span>
                    <span className="text-sm sm:text-base font-medium">5 students missing 2+ classes</span>
                  </div>
                </div>
                <div className="alert alert-error py-3 px-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔧</span>
                    <span className="text-sm sm:text-base font-medium">Equipment inspection due</span>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <button className="btn btn-outline btn-warning btn-sm w-full sm:w-auto">
                  View Details
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
