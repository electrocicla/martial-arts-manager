import { AlertCircle } from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import { useGreeting } from '../hooks/useGreeting';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useQuickActions } from '../hooks/useQuickActions';
import { useRecentActivity } from '../hooks/useRecentActivity';
import { useAuth } from '../context/AuthContext';
import DashboardHeader from './dashboard/DashboardHeader';
import DashboardStats from './dashboard/DashboardStats';
import DashboardQuickActions from './dashboard/DashboardQuickActions';
import DashboardSchedule from './dashboard/DashboardSchedule';
import DashboardActivity from './dashboard/DashboardActivity';
import DashboardMetrics from './dashboard/DashboardMetrics';
import StudentDashboard from './dashboard/StudentDashboard';
import { PendingApprovals } from './admin/PendingApprovals';
import { QRCodeManager, QRScanner } from './attendance';

export default function Dashboard() {
  const { user } = useAuth();
  const { stats: dashboardStats, todayClasses, recentPayments, isLoading, error } = useDashboardData();

  const { greeting } = useGreeting();
  const stats = useDashboardStats(dashboardStats, isLoading);
  const quickActions = useQuickActions();
  const recentActivity = useRecentActivity(recentPayments, todayClasses);

  if (user?.role === 'student') {
    return <StudentDashboard />;
  }

  // Show error state if data fetching failed
  if (error) {
    return (
      <div className="min-h-screen bg-black pb-24 md:pb-4 flex items-center justify-center">
        <div className="card bg-red-900/20 border border-red-500/30 max-w-md">
          <div className="card-body text-center">
            <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
            <h2 className="card-title text-error justify-center mb-2">Dashboard Error</h2>
            <p className="text-error/80 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-error"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black mobile-dashboard md:pb-4 md:pt-4">
      <DashboardHeader greeting={greeting} />

      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-8 mobile-dashboard-content dashboard-content">
        <DashboardStats stats={stats} />
        
        {/* Pending Approvals section for admin/instructor */}
        {(user?.role === 'admin' || user?.role === 'instructor') && (
          <PendingApprovals />
        )}

        {/* QR management section for admin/instructor */}
        {(user?.role === 'admin' || user?.role === 'instructor') && (
          <QRCodeManager />
        )}
        
        <DashboardQuickActions quickActions={quickActions} />
        <DashboardSchedule todayClasses={todayClasses} isLoading={isLoading} />
        <DashboardActivity recentActivity={recentActivity} />
        <DashboardMetrics dashboardStats={dashboardStats} isLoading={isLoading} />
      </div>
    </div>
  );
}
