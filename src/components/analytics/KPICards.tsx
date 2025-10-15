import type { KPIMetric } from '../../lib/analyticsUtils';

interface KPICardsProps {
  kpis: KPIMetric[];
}

export default function KPICards({ kpis }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {kpis.map((kpi, idx) => (
        <div 
          key={idx} 
          className="group relative bg-gray-900 rounded-xl shadow-xl border border-gray-800 hover:border-gray-700 transition-all duration-300 motion-safe:transition-all overflow-hidden"
        >
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <div className="relative p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${kpi.bgColor} shadow-lg`}>
                <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                kpi.trend === 'up' 
                  ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                  : 'bg-red-500/10 text-red-500 border border-red-500/20'
              }`}>
                {kpi.change}
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-3xl lg:text-4xl font-black text-gray-100 group-hover:text-white motion-safe:transition-colors">
                {kpi.value}
              </h3>
              <p className="text-sm font-medium text-gray-400 group-hover:text-gray-300 motion-safe:transition-colors">
                {kpi.title}
              </p>
            </div>

            {/* Decorative bottom accent */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-red-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          </div>
        </div>
      ))}
    </div>
  );
}