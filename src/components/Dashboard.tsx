import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardContent, Badge } from './ui';

export default function Dashboard() {
  const { students, classes, payments } = useApp();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalPayments: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    // Calculate stats
    const totalStudents = students.length;
    const totalClasses = classes.length;
    const totalPayments = payments.length;
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    setStats({ totalStudents, totalClasses, totalPayments, totalRevenue });
  }, [students, classes, payments]);

  const statsCards = [
    {
      title: 'Students',
      value: stats.totalStudents,
      icon: '👥',
      variant: 'primary' as const,
      trend: '+12%',
      description: 'Active students'
    },
    {
      title: 'Classes',
      value: stats.totalClasses,
      icon: '🥋',
      variant: 'success' as const,
      trend: '+5%',
      description: 'Total classes'
    },
    {
      title: 'Payments',
      value: stats.totalPayments,
      icon: '💳',
      variant: 'warning' as const,
      trend: '+8%',
      description: 'This month'
    },
    {
      title: 'Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: '💰',
      variant: 'info' as const,
      trend: '+15%',
      description: 'Total revenue'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-2 sm:mb-3">
            Dashboard
          </h1>
          <p className="text-sm sm:text-base md:text-lg font-medium bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            Welcome back! Here's an overview of your martial arts academy.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
          {statsCards.map((stat, index) => (
            <Card key={index} className="backdrop-blur-xl bg-white/10 border-white/20 hover:bg-white/15 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-4 sm:p-5 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <p className="text-xs sm:text-sm font-bold bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent">
                        {stat.title}
                      </p>
                      <span className="text-xl sm:text-2xl filter drop-shadow-lg">{stat.icon}</span>
                    </div>
                    <p className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-300 bg-clip-text text-transparent">
                      {stat.value}
                    </p>
                    <div className="mt-2 sm:mt-3 flex items-center justify-between">
                      <p className="text-xs sm:text-sm font-medium text-slate-300">
                        {stat.description}
                      </p>
                      <Badge variant={stat.variant} size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold">
                        {stat.trend}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card variant="default">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      New student enrolled
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      2 minutes ago
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Payment received
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      1 hour ago
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Class scheduled
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      3 hours ago
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="default">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Upcoming Classes
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Beginner Karate
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Today at 5:00 PM
                    </p>
                  </div>
                  <Badge variant="success" size="sm">
                    12 students
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Advanced Sparring
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Tomorrow at 7:00 PM
                    </p>
                  </div>
                  <Badge variant="warning" size="sm">
                    8 students
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Forms Practice
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Friday at 6:00 PM
                    </p>
                  </div>
                  <Badge variant="info" size="sm">
                    15 students
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}