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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="card bg-gradient-to-br from-success/20 to-success/5 border-2 border-success/30 shadow-xl hover:shadow-2xl transition-all rounded-3xl">
        <div className="card-body p-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-success rounded-2xl shadow-lg">
              <CheckCircle2 className="w-10 h-10 text-success-content" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-base-content/70 uppercase tracking-wider mb-1">
                {t('attendance.present')}
              </div>
              <div className="text-4xl font-black text-success">{presentCount}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-gradient-to-br from-error/20 to-error/5 border-2 border-error/30 shadow-xl hover:shadow-2xl transition-all rounded-3xl">
        <div className="card-body p-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-error rounded-2xl shadow-lg">
              <XCircle className="w-10 h-10 text-error-content" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-base-content/70 uppercase tracking-wider mb-1">
                {t('attendance.absent')}
              </div>
              <div className="text-4xl font-black text-error">{totalCount - presentCount}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-gradient-to-br from-info/20 to-info/5 border-2 border-info/30 shadow-xl hover:shadow-2xl transition-all rounded-3xl">
        <div className="card-body p-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-info rounded-2xl shadow-lg">
              <TrendingUp className="w-10 h-10 text-info-content" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-base-content/70 uppercase tracking-wider mb-1">
                {t('attendance.rate')}
              </div>
              <div className="text-4xl font-black text-info">{attendanceRate}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
