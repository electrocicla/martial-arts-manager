import { useStudentDashboardData } from '../../hooks/useStudentDashboardData';
import { useGreeting } from '../../hooks/useGreeting';
import { parseLocalDate } from '../../lib/utils';
import DashboardHeader from './DashboardHeader';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Calendar, CreditCard, User, QrCode, ArrowRight, Clock, MapPin, BookOpen, ChevronDown, ChevronUp, GraduationCap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function StudentDashboard() {
  const { profile, classes, payments, isLoading, error } = useStudentDashboardData();
  const { greeting } = useGreeting();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);

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
            <Button variant="danger" size="md" onClick={() => window.location.reload()}>
              {t('common.retry') || 'Retry'}
            </Button>
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
                onClick={() => navigate('/attendance')}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-lg shadow-red-900/40"
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
                  {parseLocalDate(payments[0].date).toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Classes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-bold text-white">{t('dashboard.student.myClasses')}</h3>
              </div>
              {classes.length > 5 && (
                <span className="text-xs text-gray-500">{classes.length} {t('classes.plural', 'clases')}</span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {classes.length === 0 ? (
              <div className="text-center py-8">
                <div className="p-3 rounded-full bg-gray-700/40 w-14 h-14 mx-auto mb-3 flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-gray-500" />
                </div>
                <p className="text-gray-500 text-sm">{t('dashboard.student.noClassesEnrolled')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {classes.slice(0, 6).map(cls => {
                  const isExpanded = expandedClassId === cls.id;
                  const hasDescription = cls.description && cls.description.trim().length > 0;
                  return (
                    <div
                      key={cls.id}
                      className="rounded-xl border border-gray-700/50 bg-gray-800/40 overflow-hidden transition-all duration-200 hover:border-gray-600/60"
                    >
                      {/* Class Header Row */}
                      <div className="flex items-start gap-3 p-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-white text-sm leading-tight">{cls.name}</p>
                            <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
                              {cls.discipline}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Calendar className="w-3 h-3 text-gray-500" />
                              {new Date(cls.date).toLocaleDateString('es-ES', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Clock className="w-3 h-3 text-gray-500" />
                              {cls.time}
                            </span>
                            {cls.location && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <MapPin className="w-3 h-3 text-gray-500" />
                                {cls.location}
                              </span>
                            )}
                            {cls.instructor && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <GraduationCap className="w-3 h-3 text-gray-500" />
                                <span className="truncate max-w-[12rem]">{cls.instructor}</span>
                              </span>
                            )}
                          </div>
                          {/* Inline description preview (collapsed) */}
                          {hasDescription && !isExpanded && (
                            <p className="text-xs text-gray-400 mt-2 line-clamp-2 italic">
                              {cls.description}
                            </p>
                          )}
                        </div>
                        {hasDescription && (
                          <button
                            onClick={() => setExpandedClassId(isExpanded ? null : cls.id)}
                            className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all"
                            title={isExpanded ? t('dashboard.student.hideDescription') : t('dashboard.student.showDescription')}
                            aria-label={isExpanded ? t('dashboard.student.hideDescription') : t('dashboard.student.showDescription')}
                            aria-expanded={isExpanded}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        )}
                      </div>

                      {/* Description / Objective (expandable) */}
                      {hasDescription && isExpanded && (
                        <div className="px-3 pb-3 pt-0">
                          <div className="rounded-lg bg-blue-900/20 border border-blue-500/20 p-3">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">
                                {t('dashboard.student.classObjective')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{cls.description}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {classes.length > 6 && (
                  <button
                    onClick={() => navigate('/calendar')}
                    className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-700/50 bg-gray-800/30 text-sm text-gray-300 hover:text-white hover:bg-gray-700/40 hover:border-gray-600/60 transition-all"
                  >
                    {t('dashboard.student.viewAllClasses')}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
