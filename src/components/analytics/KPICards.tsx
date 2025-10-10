import type { KPIMetric } from '../../lib/analyticsUtils';

interface KPICardsProps {
  kpis: KPIMetric[];
}

export default function KPICards({ kpis }: KPICardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map((kpi, idx) => (
        <div key={idx} className="card bg-base-200 hover:bg-base-300 transition-all">
          <div className="card-body p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className={`inline-flex p-2 rounded-lg ${kpi.bgColor} mb-2`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <h3 className="text-2xl font-black text-base-content">
                  {kpi.value}
                </h3>
                <p className="text-xs text-base-content/60 mt-1">{kpi.title}</p>
                <div className={`text-xs mt-2 font-bold ${
                  kpi.trend === 'up' ? 'text-success' : 'text-error'
                }`}>
                  {kpi.change}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}