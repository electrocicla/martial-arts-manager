/**
 * StudentAttendance - Personal attendance page for students
 *
 * This page now uses the shared QRScanner component to avoid duplicated
 * QR camera logic and keep one stable scanner flow for mobile/desktop.
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  QrCode,
  Calendar,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  MapPin,
  History,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../lib/api-client';
import { QRScanner } from '../components/attendance';

interface AttendanceRecord {
  id: string;
  class_id: string;
  class_name: string;
  class_date: string;
  class_time: string;
  discipline: string;
  location: string;
  attended: number;
  check_in_time: string | null;
  check_in_method: 'manual' | 'qr' | 'geofence';
  created_at: string;
}

interface AttendanceStats {
  total_classes: number;
  attended: number;
  missed: number;
  attendance_rate: number;
  current_streak: number;
  best_streak: number;
}

export default function StudentAttendance() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = useCallback(async () => {
    if (!user?.student_id) return;

    try {
      setLoading(true);
      const response = await apiClient.get<{
        records: AttendanceRecord[];
        stats: AttendanceStats;
      }>('/api/student/attendance');

      if (response.success && response.data) {
        setRecords(response.data.records || []);
        setStats(response.data.stats || null);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.student_id]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!user || user.role !== 'student') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            {t('attendance.studentOnly', 'Students only')}
          </h2>
          <p className="text-gray-400">
            {t('attendance.studentOnlyMessage', 'This section is only available to students.')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-black to-red-900/20 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-600/30 to-red-800/30 border border-red-500/20">
              <History className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white">
                {t('attendance.myAttendance', 'My attendance')}
              </h1>
              <p className="text-sm text-gray-400">
                {t('attendance.trackYourProgress', 'Check in and review your attendance history')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-4xl mx-auto space-y-6">
        <div className="rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-900/20 to-transparent p-4 sm:p-5">
          <p className="text-sm text-red-100/90 leading-relaxed">
            {t('attendance.quickTip', 'Tip: You can scan with camera or type the QR code manually if your device camera is restricted.')}
          </p>
        </div>

        {/* Single scanner system */}
        <QRScanner />

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-green-900/30 to-green-900/10 rounded-xl border border-green-500/20 p-4">
              <div className="flex items-center gap-2 text-green-400 mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-medium">{t('attendance.attended', 'Attended')}</span>
              </div>
              <div className="text-2xl font-black text-white">{stats.attended}</div>
            </div>

            <div className="bg-gradient-to-br from-red-900/30 to-red-900/10 rounded-xl border border-red-500/20 p-4">
              <div className="flex items-center gap-2 text-red-400 mb-1">
                <XCircle className="w-4 h-4" />
                <span className="text-xs font-medium">{t('attendance.missed', 'Missed')}</span>
              </div>
              <div className="text-2xl font-black text-white">{stats.missed}</div>
            </div>

            <div className="bg-gradient-to-br from-blue-900/30 to-blue-900/10 rounded-xl border border-blue-500/20 p-4">
              <div className="flex items-center gap-2 text-blue-400 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium">{t('attendance.rate', 'Rate')}</span>
              </div>
              <div className="text-2xl font-black text-white">{stats.attendance_rate}%</div>
            </div>

            <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-900/10 rounded-xl border border-yellow-500/20 p-4">
              <div className="flex items-center gap-2 text-yellow-400 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-medium">{t('attendance.streak', 'Streak')}</span>
              </div>
              <div className="text-2xl font-black text-white">{stats.current_streak}</div>
            </div>
          </div>
        )}

        {/* History */}
        <div className="bg-gradient-to-br from-gray-800/60 to-gray-900 rounded-2xl border border-gray-700/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700/50 flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              {t('attendance.history', 'Attendance history')}
            </h3>
            <span className="text-xs text-gray-500">
              {records.length} {t('attendance.records', 'records')}
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto" />
              <p className="text-gray-400 mt-2">{t('common.loading', 'Loading...')}</p>
            </div>
          ) : records.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">
                {t('attendance.noRecords', 'You do not have any attendance records yet')}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800/50">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="px-4 py-3 hover:bg-gray-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      record.attended ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {record.attended ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white truncate">{record.class_name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                          {record.discipline}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(record.class_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {record.class_time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {record.location}
                        </span>
                      </div>
                    </div>

                    {record.check_in_method === 'qr' && (
                      <div className="flex-shrink-0" title="QR Check-in">
                        <QrCode className="w-4 h-4 text-blue-400" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
