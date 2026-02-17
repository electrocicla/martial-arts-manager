import { useStudentDashboardData } from '../../hooks/useStudentDashboardData';
import { useGreeting } from '../../hooks/useGreeting';
import DashboardHeader from './DashboardHeader';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Calendar, CreditCard, User, QrCode, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function StudentDashboard() {
  const { profile, classes, payments, isLoading, error } = useStudentDashboardData();
  const { greeting } = useGreeting();
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-white font-medium">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 flex items-center justify-center">
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
    <div className="bg-gray-900 mobile-dashboard md:pb-4 md:pt-4">
      <DashboardHeader greeting={greeting} />

      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-8 mobile-dashboard-content dashboard-content">

        {/* Attendance quick access (replaces redundant dashboard QR scanner) */}
        <Card className="border border-red-500/20 bg-gradient-to-br from-red-900/20 to-gray-900">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/30">
                  <QrCode className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {t('attendance.qrCheckIn', 'QR check-in')}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {t('attendance.scanQrInstruction', 'Scan the QR code at your training location')}
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate('/my-attendance')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-red-900/40"
              >
                {t('attendance.scanQr', 'Scan QR')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>

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
