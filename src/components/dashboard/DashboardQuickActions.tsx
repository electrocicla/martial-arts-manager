import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';

interface QuickAction {
  title: string;
  icon: React.ComponentType<any>;
  color: string;
  subtitle: string;
  path: string;
}

interface DashboardQuickActionsProps {
  quickActions: QuickAction[];
}

export default function DashboardQuickActions({ quickActions }: DashboardQuickActionsProps) {
  const navigate = useNavigate();

  return (
    <section className="dashboard-section">
      <h2 className="text-lg sm:text-xl font-bold text-base-content mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-primary" />
        Quick Actions
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {quickActions.map((action, idx) => (
          <button
            key={idx}
            onClick={() => navigate(action.path)}
            className={`btn ${action.color} btn-block h-auto py-6 px-4 flex-col gap-3 hover:scale-[1.02] transition-all duration-200 shadow-md hover:shadow-lg rounded-xl`}
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
  );
}