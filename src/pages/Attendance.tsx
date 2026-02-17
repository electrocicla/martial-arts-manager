import { useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, MapPin, User, Users, ArrowRight, QrCode } from 'lucide-react';
import { useClasses } from '../hooks/useClasses';
import { useAuth } from '../context/AuthContext';
import { QRCodeManager, QRScanner } from '../components/attendance';
import type { Class } from '../types';

export default function Attendance() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { classes } = useClasses();
  const { user } = useAuth();
  const isStudent = user?.role === 'student';

  const today = new Date().toISOString().split('T')[0];

  const visibleClasses = useMemo(() => {
    if (!user) return [] as Class[];
    if (user.role === 'admin') return classes;
    if (user.role === 'instructor') {
      return classes.filter((cls) => cls.instructor === user.name || cls.instructor === user.id);
    }
    return [] as Class[];
  }, [classes, user]);

  const todaysClasses = useMemo(() => {
    return visibleClasses
      .filter((cls) => cls.date === today)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [today, visibleClasses]);

  const upcomingClasses = useMemo(() => {
    return visibleClasses
      .filter((cls) => cls.date > today)
      .sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)));
  }, [today, visibleClasses]);

  const renderClassCard = (cls: Class) => (
    <div
      key={cls.id}
      className="card bg-gradient-to-br from-base-200 to-base-300 border-2 border-base-300 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 rounded-3xl overflow-hidden"
    >
      <div className="card-body p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-base-content mb-1 truncate">{cls.name}</h3>
            <div className="badge badge-primary badge-lg font-semibold shadow-md">{cls.discipline}</div>
          </div>
          <button
            className="btn btn-primary btn-lg gap-3 shadow-lg hover:shadow-xl rounded-2xl"
            onClick={() => navigate(`/attendance/${cls.id}`)}
          >
            <Users className="w-6 h-6" />
            <span className="hidden sm:inline">{t('attendance.take', 'Take attendance')}</span>
            <ArrowRight className="w-5 h-5 sm:hidden" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-3 p-3 bg-base-300 rounded-2xl">
            <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="text-sm font-medium text-base-content truncate">
              {new Date(cls.date).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-base-300 rounded-2xl">
            <Clock className="w-5 h-5 text-success flex-shrink-0" />
            <span className="text-sm font-medium text-base-content">{cls.time}</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-base-300 rounded-2xl">
            <MapPin className="w-5 h-5 text-accent flex-shrink-0" />
            <span className="text-sm font-medium text-base-content truncate">{cls.location}</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-base-300 rounded-2xl">
            <User className="w-5 h-5 text-warning flex-shrink-0" />
            <span className="text-sm font-medium text-base-content truncate">{cls.instructor}</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (isStudent) {
    return <Navigate to="/my-attendance" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 pb-24 md:pb-10">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 backdrop-blur-sm border-b-2 border-base-300">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-primary/50 shadow-lg">
                <Users className="w-10 h-10 text-primary-content" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-base-content bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {t('nav.attendance')}
                </h1>
                <p className="text-base text-base-content/70 mt-1">
                  {isStudent
                    ? t('attendance.scanQR', 'Scan QR code to record your attendance')
                    : t('attendance.subtitle', 'Select a class to record attendance')}
                </p>
              </div>
            </div>
            <button
              className="btn btn-ghost btn-lg gap-3 shadow-md hover:shadow-lg rounded-2xl"
              onClick={() => navigate('/calendar')}
            >
              <Calendar className="w-6 h-6" />
              <span className="hidden sm:inline">{t('nav.calendar')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 max-w-7xl mx-auto">
        {isStudent ? (
          // Student View - QR Scanner
          <div className="space-y-8">
            {/* QR Scanner Section */}
            <div className="animate-fadeIn">
              <QRScanner />
            </div>

            {/* Info Card */}
            <div className="card bg-gradient-to-br from-info/10 to-info/5 border-2 border-info/30 shadow-xl rounded-3xl">
              <div className="card-body p-8">
                <div className="flex items-start gap-4">
                  <div className="p-4 rounded-2xl bg-info/20">
                    <QrCode className="w-8 h-8 text-info" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-base-content mb-3">
                      {t('attendance.howToScan', 'How to record attendance')}
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <div className="badge badge-info badge-lg mt-1">1</div>
                        <p className="text-base-content/80 flex-1">
                          {t('attendance.step1', 'Ask your instructor for the class QR code')}
                        </p>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="badge badge-info badge-lg mt-1">2</div>
                        <p className="text-base-content/80 flex-1">
                          {t('attendance.step2', 'Use your camera to scan the QR code or enter the code manually')}
                        </p>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="badge badge-info badge-lg mt-1">3</div>
                        <p className="text-base-content/80 flex-1">
                          {t('attendance.step3', 'Your attendance will be recorded automatically with date and time')}
                        </p>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Instructor/Admin View
          <div className="space-y-8">
            {/* QR Code Manager for Instructors/Admins */}
            <div className="animate-fadeIn">
              <QRCodeManager />
            </div>

            {/* Today's Classes */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-success/20">
                    <Calendar className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-base-content">
                      {t('attendance.today', 'Today classes')}
                    </h2>
                    <p className="text-sm text-base-content/70">
                      {new Date().toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="stats shadow-lg bg-base-200 border border-base-300 rounded-2xl">
                  <div className="stat py-4 px-6">
                    <div className="stat-value text-success text-3xl">{todaysClasses.length}</div>
                    <div className="stat-desc font-medium">
                      {t('attendance.classesToday', 'Classes today')}
                    </div>
                  </div>
                </div>
              </div>

              {todaysClasses.length > 0 ? (
                <div className="grid gap-6">
                  {todaysClasses.map(renderClassCard)}
                </div>
              ) : (
                <div className="card bg-base-200 border-2 border-base-300 shadow-xl rounded-3xl">
                  <div className="card-body items-center text-center py-16">
                    <Calendar className="w-20 h-20 text-base-content/20 mb-4" />
                    <h3 className="text-xl font-bold text-base-content mb-2">
                      {t('attendance.noClassesToday', 'No classes scheduled for today')}
                    </h3>
                    <p className="text-base-content/70">
                      {t('attendance.checkUpcoming', 'Check upcoming classes below')}
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Upcoming Classes */}
            {upcomingClasses.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/20">
                    <ArrowRight className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-base-content">
                      {t('attendance.upcoming', 'Upcoming classes')}
                    </h2>
                    <p className="text-sm text-base-content/70">
                      {upcomingClasses.length} {t('attendance.classesScheduled', 'classes scheduled')}
                    </p>
                  </div>
                </div>

                <div className="grid gap-6">
                  {upcomingClasses.slice(0, 5).map(renderClassCard)}
                </div>

                {upcomingClasses.length > 5 && (
                  <div className="text-center">
                    <button
                      className="btn btn-outline btn-lg gap-3 shadow-md hover:shadow-lg rounded-2xl"
                      onClick={() => navigate('/calendar')}
                    >
                      <Calendar className="w-6 h-6" />
                      {t('attendance.viewAllClasses', 'View all classes in calendar')}
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
