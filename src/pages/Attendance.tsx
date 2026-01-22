import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, MapPin, User, Users, ArrowRight } from 'lucide-react';
import { useClasses } from '../hooks/useClasses';
import { useAuth } from '../context/AuthContext';
import { QRCodeManager } from '../components/attendance';
import type { Class } from '../types';

export default function Attendance() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { classes } = useClasses();
  const { user } = useAuth();

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
      className="card bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 shadow-lg"
    >
      <div className="card-body p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-white truncate">{cls.name}</h3>
            <div className="mt-1 text-xs text-red-400 font-semibold">{cls.discipline}</div>
          </div>
          <button
            className="btn btn-primary btn-sm gap-2"
            onClick={() => navigate(`/attendance/${cls.id}`)}
          >
            <Users className="w-4 h-4" />
            {t('attendance.take', 'Tomar asistencia')}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs sm:text-sm text-base-content/70">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>{new Date(cls.date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-green-400" />
            <span>{cls.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-purple-400" />
            <span className="truncate">{cls.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-yellow-400" />
            <span className="truncate">{cls.instructor}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-8">
      <div className="bg-gradient-to-br from-black to-red-900/20 px-4 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-red-600/30">
              <Users className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-base-content">
                {t('nav.attendance')}
              </h1>
              <p className="text-sm text-base-content/70">
                {t('attendance.subtitle', 'Selecciona una clase para registrar asistencia')}
              </p>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm gap-2"
            onClick={() => navigate('/calendar')}
          >
            <Calendar className="w-4 h-4" />
            {t('nav.calendar')}
          </button>
        </div>
      </div>

      <div className="px-4 py-6 max-w-6xl mx-auto">
        {user?.role === 'student' ? (
          <div className="text-center py-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700/50">
            <div className="max-w-md mx-auto px-4">
              <div className="p-4 bg-red-500/10 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Users className="w-10 h-10 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {t('attendance.onlyStaff', 'Solo instructores y administradores')}
              </h3>
              <p className="text-base-content/60 mb-6">
                {t('attendance.onlyStaffMessage', 'La asistencia se registra por el instructor de la clase.')}
              </p>
              <button
                className="btn btn-primary gap-2"
                onClick={() => navigate('/calendar')}
              >
                <Calendar className="w-5 h-5" />
                {t('nav.calendar')}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">
                  {t('attendance.today', 'Clases de hoy')}
                </h2>
                <span className="text-xs text-gray-400">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
              {todaysClasses.length > 0 ? (
                <div className="grid gap-3">
                  {todaysClasses.map(renderClassCard)}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-800/50 rounded-lg border border-gray-700/50 text-gray-400">
                  {t('attendance.noClassesToday', 'No hay clases programadas para hoy.')}
                </div>
              )}
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">
                  {t('attendance.upcoming', 'Próximas clases')}
                </h2>
                <button
                  className="btn btn-ghost btn-xs gap-1"
                  onClick={() => navigate('/calendar')}
                >
                  {t('attendance.viewCalendar', 'Ver calendario')}
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              {upcomingClasses.length > 0 ? (
                <div className="grid gap-3">
                  {upcomingClasses.map(renderClassCard)}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-800/50 rounded-lg border border-gray-700/50 text-gray-400">
                  {t('attendance.noUpcoming', 'No hay clases próximas registradas.')}
                </div>
              )}
            </section>

            {/* QR Code Management Section */}
            <section className="space-y-4">
              <QRCodeManager />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
