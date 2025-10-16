import type { RevenueByClass, StudentProgress, MonthlyTrend } from '../../lib/analyticsUtils';
import { TrendingUp, TrendingDown, Activity, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { label } from '../../lib/i18nUtils';

interface AnalyticsOverviewProps {
  revenueByClass: RevenueByClass[];
  studentProgress: StudentProgress[];
  monthlyTrends: MonthlyTrend[];
}

export default function AnalyticsOverview({
  revenueByClass,
  studentProgress,
  monthlyTrends
}: AnalyticsOverviewProps) {
  const { t } = useTranslation();
  // Calculate dynamic max values for charts
  const maxRevenue = Math.max(...revenueByClass.map(item => item.revenue), 1);
  const maxMonthlyRevenue = Math.max(...monthlyTrends.map(item => item.revenue), 1);
  const maxMonthlyStudents = Math.max(...monthlyTrends.map(item => item.students), 1);

  // Calculate real insights
  const currentMonth = monthlyTrends[monthlyTrends.length - 1];
  const previousMonth = monthlyTrends[monthlyTrends.length - 2];
  const revenueChange = previousMonth ? ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue * 100) : 0;
  const studentChange = previousMonth ? ((currentMonth.students - previousMonth.students) / previousMonth.students * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Class */}
        <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-xl font-bold text-gray-100">{label(t, 'analytics.revenue.title', 'Revenue Analytics')}</h3>
            <p className="text-sm text-gray-400 mt-1">{label(t, 'analytics.revenue.byClassSubtitle', 'Income distribution across disciplines')}</p>
          </div>
          <div className="p-6 space-y-5">
            {revenueByClass.map((item, idx) => (
              <div key={idx} className="group">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors">
                    {item.class}
                  </span>
                  <span className="text-sm font-bold text-gray-100">
                    ${item.revenue.toLocaleString()}
                  </span>
                </div>
                <div className="relative w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                  <div
                    className={`${item.color} h-3 rounded-full transition-all duration-700 ease-out shadow-lg`}
                    style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  {item.students} students enrolled
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Belt Distribution */}
        <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-xl font-bold text-gray-100">Belt Distribution</h3>
            <p className="text-sm text-gray-400 mt-1">Student ranking across belt levels</p>
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
                      className="bg-gradient-to-r from-red-600 to-red-500 h-3 rounded-full transition-all duration-700 ease-out shadow-md"
                      style={{ width: `${belt.percentage}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-100 w-16 text-right">
                  {belt.count} ({belt.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-100">Monthly Trends</h3>
              <p className="text-sm text-gray-400 mt-1">Performance metrics over time</p>
            </div>
            <div className="flex flex-wrap gap-4 text-xs font-medium">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-r from-red-600 to-red-500 rounded shadow-md"></div>
                <span className="text-gray-300">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-r from-blue-600 to-blue-500 rounded shadow-md"></div>
                <span className="text-gray-300">Students</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-r from-purple-600 to-purple-500 rounded shadow-md"></div>
                <span className="text-gray-300">Attendance</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="p-6">
          <div className="overflow-x-auto">
            <div className="flex gap-3 sm:gap-4 min-w-[600px] pb-2">
              {monthlyTrends.map((month, idx) => (
                <div key={idx} className="flex-1 text-center group">
                  <div className="flex items-end justify-center gap-1.5 h-40 mb-3 bg-gray-800/30 rounded-lg p-2">
                    <div className="relative flex-1 flex flex-col justify-end">
                      <div
                        className="bg-gradient-to-t from-red-700 to-red-500 rounded-t-lg transition-all duration-700 hover:from-red-600 hover:to-red-400 shadow-lg group-hover:shadow-red-900/50 cursor-pointer"
                        style={{ height: `${(month.revenue / maxMonthlyRevenue) * 100}%` }}
                        title={`Revenue: $${month.revenue}`}
                      ></div>
                    </div>
                    <div className="relative flex-1 flex flex-col justify-end">
                      <div
                        className="bg-gradient-to-t from-blue-700 to-blue-500 rounded-t-lg transition-all duration-700 hover:from-blue-600 hover:to-blue-400 shadow-lg group-hover:shadow-blue-900/50 cursor-pointer"
                        style={{ height: `${(month.students / maxMonthlyStudents) * 100}%` }}
                        title={`Students: ${month.students}`}
                      ></div>
                    </div>
                    <div className="relative flex-1 flex flex-col justify-end">
                      <div
                        className="bg-gradient-to-t from-purple-700 to-purple-500 rounded-t-lg transition-all duration-700 hover:from-purple-600 hover:to-purple-400 shadow-lg group-hover:shadow-purple-900/50 cursor-pointer"
                        style={{ height: `${month.attendance}%` }}
                        title={`Attendance: ${month.attendance}%`}
                      ></div>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors">
                    {month.month}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`rounded-xl p-5 border-2 ${
          revenueChange >= 0 
            ? 'bg-green-500/10 border-green-500/30' 
            : 'bg-red-500/10 border-red-500/30'
        } shadow-lg`}>
          <div className="flex items-center gap-3">
            {revenueChange >= 0 ? (
              <TrendingUp className="w-6 h-6 text-green-500" />
            ) : (
              <TrendingDown className="w-6 h-6 text-red-500" />
            )}
            <div>
              <p className={`text-sm font-bold ${revenueChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                Revenue {revenueChange >= 0 ? 'up' : 'down'} {Math.abs(revenueChange).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-400 mt-0.5">vs. last month</p>
            </div>
          </div>
        </div>

        <div className={`rounded-xl p-5 border-2 ${
          studentChange >= 0 
            ? 'bg-blue-500/10 border-blue-500/30' 
            : 'bg-orange-500/10 border-orange-500/30'
        } shadow-lg`}>
          <div className="flex items-center gap-3">
            <Activity className={`w-6 h-6 ${studentChange >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />
            <div>
              <p className={`text-sm font-bold ${studentChange >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
                {studentChange >= 0 ? 'Gained' : 'Lost'} {Math.abs(studentChange).toFixed(1)}% students
              </p>
              <p className="text-xs text-gray-400 mt-0.5">this month</p>
            </div>
          </div>
        </div>

        <div className={`rounded-xl p-5 border-2 ${
          currentMonth.attendance >= 80 
            ? 'bg-green-500/10 border-green-500/30' 
            : currentMonth.attendance >= 60 
              ? 'bg-yellow-500/10 border-yellow-500/30' 
              : 'bg-red-500/10 border-red-500/30'
        } shadow-lg`}>
          <div className="flex items-center gap-3">
            <Target className={`w-6 h-6 ${
              currentMonth.attendance >= 80 
                ? 'text-green-500' 
                : currentMonth.attendance >= 60 
                  ? 'text-yellow-500' 
                  : 'text-red-500'
            }`} />
            <div>
              <p className={`text-sm font-bold ${
                currentMonth.attendance >= 80 
                  ? 'text-green-400' 
                  : currentMonth.attendance >= 60 
                    ? 'text-yellow-400' 
                    : 'text-red-400'
              }`}>
                {currentMonth.attendance}% attendance rate
              </p>
              <p className="text-xs text-gray-400 mt-0.5">average this month</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}