import { AlertCircle, ArrowRight, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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

        {(user?.role === 'admin' || user?.role === 'instructor') && (
          <div className="card border border-primary/30 bg-gradient-to-br from-primary/10 to-base-300 shadow-lg">
            <div className="card-body p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl border border-primary/40 bg-primary/20 p-2.5">
                    <QrCode className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-base-content">
                      {t('qr.title', 'Attendance QR codes')}
                    </h3>
                    <p className="text-sm text-base-content/70">
                      {t('qr.manageInAttendance', 'Create and manage QR codes from Attendance section.')}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/attendance')}
                  className="btn btn-primary w-full sm:w-auto gap-2 rounded-xl px-5 min-h-0 h-11 transition-all duration-200 hover:-translate-y-0.5"
                >
                  {t('attendance.openAttendance', 'Open Attendance')}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
        
        <DashboardQuickActions quickActions={quickActions} />
        <DashboardSchedule todayClasses={todayClasses} isLoading={isLoading} />
        <DashboardActivity recentActivity={recentActivity} />
        <DashboardMetrics dashboardStats={dashboardStats} isLoading={isLoading} />
      </div>
    </div>
  );
}
