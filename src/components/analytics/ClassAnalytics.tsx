import { useTranslation } from 'react-i18next';
import { label } from '../../lib/i18nUtils';
import type { Class, Attendance } from '../../types';

interface ClassAnalyticsProps {
  classes: Class[];
  attendance: Attendance[];
}

export default function ClassAnalytics({ classes, attendance }: ClassAnalyticsProps) {
  const { t } = useTranslation();

  // Calculate class metrics
  const classMetrics = classes.map(cls => {
    const classAttendance = attendance.filter(a => a.class_id === cls.id);
    const totalSessions = classAttendance.length;
    const attendedSessions = classAttendance.filter(a => a.attended === 1).length;
    const attendanceRate = totalSessions > 0 ? (attendedSessions / totalSessions * 100) : 0;
    const uniqueStudents = new Set(classAttendance.map(a => a.student_id)).size;

    return {
      ...cls,
      totalSessions,
      attendedSessions,
      attendanceRate,
      uniqueStudents
    };
  });

  const totalClasses = classes.length;
  const averageAttendance = classMetrics.reduce((sum, cls) => sum + cls.attendanceRate, 0) / totalClasses || 0;
  const totalCapacity = classMetrics.reduce((sum, cls) => sum + cls.max_students, 0);
  const averageCapacity = totalCapacity / totalClasses || 0;

  return (
    <div className="space-y-8">
      {/* Class Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">{label(t, 'analytics.classes.totalClasses', 'Total classes')}</p>
              <p className="text-2xl font-bold text-gray-100">{totalClasses}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">{label(t, 'analytics.classes.averageAttendance', 'Average attendance')}</p>
              <p className="text-2xl font-bold text-gray-100">{averageAttendance.toFixed(1)}%</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">{label(t, 'analytics.classes.averageCapacity', 'Average capacity')}</p>
              <p className="text-2xl font-bold text-gray-100">{averageCapacity.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Class Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Attendance Rates */}
        <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-xl font-bold text-gray-100">{label(t, 'analytics.classes.attendanceRates', 'Attendance rates')}</h3>
            <p className="text-sm text-gray-400 mt-1">{label(t, 'analytics.classes.attendanceRatesSubtitle', 'Percentage of sessions attended per class')}</p>
          </div>
          <div className="p-6 space-y-4">
            {classMetrics.map((cls, idx) => (
              <div key={idx} className="group">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors">
                    {cls.name}
                  </span>
                  <span className="text-sm font-bold text-gray-100">
                    {cls.attendanceRate.toFixed(1)}%
                  </span>
                </div>
                <div className="relative w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all duration-700 ease-out shadow-lg ${
                      cls.attendanceRate >= 80 ? 'bg-gradient-to-r from-green-600 to-green-500' :
                      cls.attendanceRate >= 60 ? 'bg-gradient-to-r from-yellow-600 to-yellow-500' :
                      'bg-gradient-to-r from-red-600 to-red-500'
                    }`}
                    style={{ width: `${cls.attendanceRate}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  {cls.uniqueStudents} {label(t, 'analytics.classes.studentsAttended', 'students attended')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Class Capacity Utilization */}
        <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-xl font-bold text-gray-100">{label(t, 'analytics.classes.capacityUtilization', 'Capacity utilization')}</h3>
            <p className="text-sm text-gray-400 mt-1">{label(t, 'analytics.classes.capacityUtilizationSubtitle', 'How well class capacity is being used')}</p>
          </div>
          <div className="p-6 space-y-4">
            {classMetrics.map((cls, idx) => {
              const utilization = cls.max_students > 0 ? (cls.uniqueStudents / cls.max_students * 100) : 0;
              return (
                <div key={idx} className="group">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors">
                      {cls.name}
                    </span>
                    <span className="text-sm font-bold text-gray-100">
                      {utilization.toFixed(1)}%
                    </span>
                  </div>
                  <div className="relative w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-700 ease-out shadow-lg ${
                        utilization >= 80 ? 'bg-gradient-to-r from-blue-600 to-blue-500' :
                        utilization >= 60 ? 'bg-gradient-to-r from-purple-600 to-purple-500' :
                        'bg-gradient-to-r from-gray-600 to-gray-500'
                      }`}
                      style={{ width: `${utilization}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {cls.uniqueStudents} / {cls.max_students} {label(t, 'analytics.classes.capacity', 'capacity')}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Discipline Performance */}
      <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-xl font-bold text-gray-100">{label(t, 'analytics.classes.disciplinePerformance', 'Discipline performance')}</h3>
          <p className="text-sm text-gray-400 mt-1">{label(t, 'analytics.classes.disciplinePerformanceSubtitle', 'Performance metrics grouped by discipline')}</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(() => {
              const disciplineStats: Record<string, { classes: number; avgAttendance: number; totalStudents: number }> =
                classMetrics.reduce((acc, cls) => {
                  if (!acc[cls.discipline]) {
                    acc[cls.discipline] = { classes: 0, avgAttendance: 0, totalStudents: 0 };
                  }
                  acc[cls.discipline].classes += 1;
                  acc[cls.discipline].avgAttendance += cls.attendanceRate;
                  acc[cls.discipline].totalStudents += cls.uniqueStudents;
                  return acc;
                }, {} as Record<string, { classes: number; avgAttendance: number; totalStudents: number }>);

              return Object.entries(disciplineStats).map(([discipline, stats]) => {
                const avgAttendance = stats.avgAttendance / stats.classes;
                return (
                  <div key={discipline} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-200">{discipline}</span>
                      <span className="text-sm font-bold text-gray-100">{stats.classes} {label(t, 'analytics.classes.classes', 'classes')}</span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>{label(t, 'analytics.classes.avgAttendance', 'Avg. attendance')}</span>
                          <span>{avgAttendance.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-green-600 to-green-500 h-2 rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${avgAttendance}%` }}
                          ></div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">{stats.totalStudents} {label(t, 'analytics.classes.totalStudents', 'Total students')}</p>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}