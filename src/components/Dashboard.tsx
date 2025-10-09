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
    <div className="min-h-screen bg-base-100 pb-20 md:pb-4">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-base-200 via-base-300 to-base-200 px-4 pt-6 pb-8">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/20 rounded-full filter blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full filter blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-black mb-2 text-base-content">
              {greeting()}, <span className="text-primary">Sensei {user?.name || 'Master'}!</span>
            </h1>
            <p className="text-base-content/70 text-sm md:text-base">
              Here's what's happening at your dojo today
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((stat, idx) => (
              <div key={idx} className="card bg-base-200/50 backdrop-blur-xl border border-base-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="card-body p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className={`inline-flex p-2 rounded-lg ${stat.iconBg} mb-2`}>
                        <stat.icon className="w-5 h-5 text-base-content" />
                      </div>
                      <h3 className="text-2xl font-black bg-gradient-to-r text-transparent bg-clip-text ${stat.bgGradient}">
                        {stat.value}
                      </h3>
                      <p className="text-xs text-base-content/60 font-medium mt-1">{stat.title}</p>
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
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-7xl mx-auto space-y-6">
        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => navigate(action.path)}
                className={`btn ${action.color} btn-block h-auto py-4 px-3 flex-col gap-2 hover:scale-105 transition-transform`}
              >
                <action.icon className="w-6 h-6" />
                <div className="text-left w-full">
                  <div className="font-bold text-sm">{action.title}</div>
                  <div className="text-xs opacity-70">{action.subtitle}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Today's Schedule */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-base-content flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Today's Schedule
            </h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/calendar')}>
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {todayClasses.map((cls) => (
              <div key={cls.id} className="card bg-base-200 hover:bg-base-300 transition-colors">
                <div className="card-body p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-base-content">{cls.name}</h3>
                        <div className={`badge badge-sm ${
                          cls.level === 'Advanced' ? 'badge-error' :
                          cls.level === 'Intermediate' ? 'badge-warning' :
                          'badge-success'
                        }`}>
                          {cls.level}
                        </div>
                      </div>
                      <p className="text-sm text-base-content/70 mb-2">{cls.time}</p>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {cls.students} students
                        </span>
                        <span className="text-base-content/50">
                          {cls.instructor}
                        </span>
                      </div>
                    </div>
                    <div className={`badge ${
                      cls.status === 'ongoing' ? 'badge-success' :
                      cls.status === 'upcoming' ? 'badge-warning' :
                      'badge-ghost'
                    }`}>
                      {cls.status}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-base-content flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Recent Activity
            </h2>
            <button className="btn btn-ghost btn-sm">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="card bg-base-200">
            <div className="card-body p-0">
              {recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-center gap-3 p-4 hover:bg-base-300 transition-colors border-b border-base-300 last:border-0">
                  <div className="text-2xl">{activity.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-base-content truncate">
                      {activity.text}
                    </p>
                    <p className="text-xs text-base-content/50">{activity.time}</p>
                  </div>
                  <div className={`badge badge-sm badge-${activity.type}`}>
                    {activity.type}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Performance Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/20">
            <div className="card-body">
              <h3 className="card-title text-base-content flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Monthly Goal Progress
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>New Enrollments</span>
                    <span className="font-bold">18/25</span>
                  </div>
                  <progress className="progress progress-primary" value="72" max="100"></progress>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Revenue Target</span>
                    <span className="font-bold">$8,200/$10,000</span>
                  </div>
                  <progress className="progress progress-secondary" value="82" max="100"></progress>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Class Attendance</span>
                    <span className="font-bold">89%</span>
                  </div>
                  <progress className="progress progress-success" value="89" max="100"></progress>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-warning/10 to-error/10 border-2 border-warning/20">
            <div className="card-body">
              <h3 className="card-title text-base-content flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-warning" />
                Needs Attention
              </h3>
              <div className="space-y-2">
                <div className="alert alert-warning py-2">
                  <span className="text-sm">3 overdue payments</span>
                </div>
                <div className="alert alert-info py-2">
                  <span className="text-sm">5 students missing 2+ classes</span>
                </div>
                <div className="alert alert-error py-2">
                  <span className="text-sm">Equipment inspection due</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
