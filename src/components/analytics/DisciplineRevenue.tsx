import { useTranslation } from 'react-i18next';
import { label } from '../../lib/i18nUtils';
import type { RevenueByDiscipline } from '../../lib/analyticsUtils';

interface Props {
  data: RevenueByDiscipline[];
}

export default function DisciplineRevenue({ data }: Props) {
  const { t } = useTranslation();

  if (!data || data.length === 0) return null;

  const max = Math.max(...data.map(d => d.revenue), 1);

  return (
    <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 overflow-hidden">
      <div className="p-6 border-b border-gray-800">
        <h3 className="text-xl font-bold text-gray-100">{label(t, 'analytics.revenue.byDiscipline', 'By discipline')}</h3>
        <p className="text-sm text-gray-400 mt-1">{label(t, 'analytics.revenue.byDisciplineSubtitle', 'Revenue aggregated by discipline')}</p>
      </div>
      <div className="p-6 space-y-4">
        {data.map((d, idx) => (
          <div key={idx} className="group">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors">{d.discipline}</span>
              <span className="text-sm font-bold text-gray-100">${d.revenue.toLocaleString()}</span>
            </div>
            <div className="relative w-full bg-gray-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-600 to-indigo-500 h-3 rounded-full transition-all duration-700 ease-out shadow-lg"
                style={{ width: `${max > 0 ? (d.revenue / max) * 100 : 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">{d.courses} {label(t, 'analytics.revenue.courses', 'courses')} • {d.students} {label(t, 'analytics.revenue.studentsEnrolled', 'students')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
