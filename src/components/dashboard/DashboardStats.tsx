import React from 'react';

interface StatItem {
  title: string;
  value: string;
  change: string;
  trend: string;
  icon: React.ComponentType<any>;
  description: string;
  color: string;
  bgColor: string;
}

interface DashboardStatsProps {
  stats: StatItem[];
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, idx) => (
        <div key={idx} className="card bg-gray-800/90 backdrop-blur-sm border border-gray-700/50 hover:shadow-lg hover:shadow-gray-900/25 transition-all duration-300 hover:scale-[1.02] rounded-xl">
          <div className="card-body p-3 sm:p-4">
            <div className="flex flex-col">
              <div className={`inline-flex p-2 rounded-xl ${stat.bgColor} mb-3 w-fit`}>
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
  );
}