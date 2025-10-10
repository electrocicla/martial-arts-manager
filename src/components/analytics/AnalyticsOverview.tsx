import type { RevenueByClass, StudentProgress, MonthlyTrend } from '../../lib/analyticsUtils';
import { TrendingUp, Activity, Target } from 'lucide-react';

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
  return (
    <>
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
    </>
  );
}