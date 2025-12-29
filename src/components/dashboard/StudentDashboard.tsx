import { useStudentDashboardData } from '../../hooks/useStudentDashboardData';
import { useGreeting } from '../../hooks/useGreeting';
import DashboardHeader from './DashboardHeader';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Calendar, CreditCard, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function StudentDashboard() {
  const { profile, classes, payments, isLoading, error } = useStudentDashboardData();
  const { greeting } = useGreeting();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-white font-medium">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="card bg-red-900/20 border border-red-500/30 max-w-md">
          <div className="card-body text-center">
            <h2 className="card-title text-error justify-center">{t('common.error')}</h2>
            <p className="text-error/80">{error}</p>
            <button onClick={() => window.location.reload()} className="btn btn-error mt-4">
              {t('common.retry') || 'Retry'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const nextClass = classes.find(c => new Date(c.date + ' ' + c.time) > new Date());

  return (
    <div className="min-h-screen bg-black mobile-dashboard md:pb-4 md:pt-4">
      <DashboardHeader greeting={greeting} />

      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-8 mobile-dashboard-content dashboard-content">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <h3 className="text-sm font-medium text-gray-400">{t('dashboard.student.currentBelt')}</h3>
              <User className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{profile?.belt || 'White'}</div>
              <p className="text-xs text-gray-500">{profile?.discipline}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <h3 className="text-sm font-medium text-gray-400">{t('dashboard.student.nextClass')}</h3>
              <Calendar className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {nextClass ? nextClass.name : t('dashboard.student.noUpcomingClasses')}
              </div>
              {nextClass && (
                <p className="text-xs text-gray-500">
                  {new Date(nextClass.date).toLocaleDateString()} at {nextClass.time}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <h3 className="text-sm font-medium text-gray-400">{t('dashboard.student.payments')}</h3>
              <CreditCard className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {payments.length > 0 ? `$${payments[0].amount}` : t('dashboard.student.pending')}
              </div>
              {payments.length > 0 && (
                <p className="text-xs text-gray-500">
                  {new Date(payments[0].date).toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Classes */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-bold text-white">{t('dashboard.student.myClasses')}</h3>
          </CardHeader>
          <CardContent>
            {classes.length === 0 ? (
              <p className="text-gray-500">{t('dashboard.student.noClassesEnrolled')}</p>
            ) : (
              <div className="space-y-4">
                {classes.slice(0, 5).map(cls => (
                  <div key={cls.id} className="flex items-center justify-between border-b border-gray-800 pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-white">{cls.name}</p>
                      <p className="text-sm text-gray-500">{cls.discipline}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white">{new Date(cls.date).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-500">{cls.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
