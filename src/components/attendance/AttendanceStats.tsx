import { CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AttendanceStatsProps {
  presentCount: number;
  totalCount: number;
  attendanceRate: number;
}

/**
 * AttendanceStats Component
 * Responsibility: Display attendance statistics
 * SRP: Only handles stat display, no business logic
 */
export function AttendanceStats({ presentCount, totalCount, attendanceRate }: AttendanceStatsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
          </div>
        </div>
        <div className="text-sm text-gray-400 font-medium uppercase tracking-wide">
          {t('attendance.present')}
        </div>
        <div className="text-3xl font-black text-white mt-1">{presentCount}</div>
      </div>

      <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <XCircle className="w-6 h-6 text-red-400" />
          </div>
        </div>
        <div className="text-sm text-gray-400 font-medium uppercase tracking-wide">
          {t('attendance.absent')}
        </div>
        <div className="text-3xl font-black text-white mt-1">{totalCount - presentCount}</div>
      </div>

      <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <TrendingUp className="w-6 h-6 text-blue-400" />
          </div>
        </div>
        <div className="text-sm text-gray-400 font-medium uppercase tracking-wide">
          {t('attendance.rate')}
        </div>
        <div className="text-3xl font-black text-white mt-1">{attendanceRate}%</div>
      </div>
    </div>
  );
}
