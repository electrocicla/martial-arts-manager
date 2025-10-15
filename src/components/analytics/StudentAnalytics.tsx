import { useTranslation } from 'react-i18next';
import type { StudentProgress, MonthlyTrend } from '../../lib/analyticsUtils';
import type { Student } from '../../types';

interface StudentAnalyticsProps {
  studentProgress: StudentProgress[];
  monthlyTrends: MonthlyTrend[];
  students: Student[];
}

export default function StudentAnalytics({ studentProgress, monthlyTrends, students }: StudentAnalyticsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      {/* Student Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">{t('analytics.students.totalStudents')}</p>
              <p className="text-2xl font-bold text-gray-100">{students.length}</p>
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
              <p className="text-sm text-gray-400">{t('analytics.students.activeStudents')}</p>
              <p className="text-2xl font-bold text-gray-100">{students.filter((s: Student) => s.is_active).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-yellow-500/10 rounded-lg">
              <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">{t('analytics.students.newThisMonth')}</p>
              <p className="text-2xl font-bold text-gray-100">
                {students.filter((s: Student) => {
                  const joinDate = new Date(s.join_date);
                  const now = new Date();
                  return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Student Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Belt Distribution */}
        <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-xl font-bold text-gray-100">{t('analytics.students.beltDistribution')}</h3>
            <p className="text-sm text-gray-400 mt-1">{t('analytics.students.beltDistributionSubtitle')}</p>
          </div>
          <div className="p-6 space-y-4">
            {studentProgress.map((belt, idx) => (
              <div key={idx} className="flex items-center gap-4 group">
                <div className={`badge ${
                  belt.belt === 'White' ? 'bg-gray-200 text-gray-900 border-gray-300' :
                  belt.belt === 'Yellow' ? 'bg-yellow-400 text-yellow-900 border-yellow-500' :
                  belt.belt === 'Orange' ? 'bg-orange-500 text-white border-orange-600' :
                  belt.belt === 'Green' ? 'bg-green-500 text-white border-green-600' :
                  belt.belt === 'Blue' ? 'bg-blue-500 text-white border-blue-600' :
                  belt.belt === 'Brown' ? 'bg-amber-700 text-white border-amber-800' :
                  belt.belt === 'Black' ? 'bg-gray-900 text-white border-gray-700' :
                  'bg-gray-600 text-white border-gray-700'
                } badge-lg font-bold shadow-md px-4`}>
                  {belt.belt}
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-blue-500 h-3 rounded-full transition-all duration-700 ease-out shadow-md"
                      style={{ width: `${belt.percentage}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-100 w-16 text-right">
                  {belt.count} ({belt.percentage.toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Student Growth Trend */}
        <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-xl font-bold text-gray-100">{t('analytics.students.growthTrend')}</h3>
            <p className="text-sm text-gray-400 mt-1">{t('analytics.students.growthTrendSubtitle')}</p>
          </div>
          <div className="p-6">
            <div className="h-64 flex items-end justify-between gap-2">
              {monthlyTrends.map((month, idx) => {
                const maxStudents = Math.max(...monthlyTrends.map(m => m.students));
                const height = maxStudents > 0 ? (month.students / maxStudents) * 100 : 0;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group">
                    <div className="w-full flex justify-center mb-2">
                      <div
                        className="bg-gradient-to-t from-blue-600 to-blue-500 rounded-t-lg transition-all duration-700 hover:from-blue-500 hover:to-blue-400 shadow-lg group-hover:shadow-blue-900/50 cursor-pointer min-h-[10px]"
                        style={{ height: `${height}%`, width: '80%' }}
                        title={`${month.students} students`}
                      ></div>
                    </div>
                    <span className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors">
                      {month.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Discipline Distribution */}
      <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-xl font-bold text-gray-100">{t('analytics.students.disciplineDistribution')}</h3>
          <p className="text-sm text-gray-400 mt-1">{t('analytics.students.disciplineDistributionSubtitle')}</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(() => {
              const disciplineCounts: Record<string, number> = students.reduce((acc: Record<string, number>, student: Student) => {
                acc[student.discipline] = (acc[student.discipline] || 0) + 1;
                return acc;
              }, {});
              const total = students.length;
              return Object.entries(disciplineCounts).map(([discipline, count]) => {
                const percentage = total > 0 ? (count / total * 100) : 0;
                return (
                  <div key={discipline} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-200">{discipline}</span>
                      <span className="text-sm font-bold text-gray-100">{count}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-purple-500 h-2 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{percentage.toFixed(1)}% of students</p>
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