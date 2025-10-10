import { Activity, ChevronRight } from 'lucide-react';

interface ActivityItem {
  icon: string;
  text: string;
  time: string;
  type: 'info' | 'warning';
}

interface DashboardActivityProps {
  recentActivity: ActivityItem[];
}

export default function DashboardActivity({ recentActivity }: DashboardActivityProps) {
  return (
    <section className="dashboard-section">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-base-content flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Recent Activity
        </h2>
        <button className="btn btn-ghost btn-sm text-xs sm:text-sm rounded-lg hover:bg-primary/10 transition-all duration-200">
          View All <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="card bg-base-200/50 backdrop-blur-sm border border-base-300/20 rounded-xl shadow-lg">
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
                  {activity.type === 'info' ? 'ℹ' : '⚠'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}