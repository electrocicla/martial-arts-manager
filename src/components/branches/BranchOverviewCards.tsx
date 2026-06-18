import { ArrowRight, BookOpen, Building2, DollarSign, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBranch } from '../../hooks/useBranch';
import MoneyValue from '../ui/MoneyValue';

export function BranchOverviewCards() {
  const navigate = useNavigate();
  const { branches, activeBranchId, selectBranch } = useBranch();

  if (branches.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-white">Resumen por sede</h2>
          <p className="hidden text-sm text-gray-400 sm:block">Acceso inmediato a cada entorno administrativo.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/branches')}
          className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/20"
        >
          <span className="hidden sm:inline">Gestionar sedes</span>
          <span className="sm:hidden">Gestionar</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 xl:grid-cols-3">
        {branches.map((branch) => {
          const isActive = branch.id === activeBranchId;
          return (
            <button
              key={branch.id}
              type="button"
              onClick={() => selectBranch(branch.id)}
              className={`w-[min(84vw,21rem)] shrink-0 snap-center rounded-2xl border p-4 text-left transition sm:w-auto sm:p-5 ${
                isActive
                  ? 'border-red-500/70 bg-gradient-to-br from-red-950/60 to-gray-900 shadow-lg shadow-red-950/30'
                  : 'border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 hover:border-gray-600'
              }`}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-red-500/15 p-2.5 text-red-400">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-white">{branch.name}</h3>
                    <p className="text-xs text-gray-400">
                      {branch.is_main ? 'Sede principal' : branch.address || 'Sede de entrenamiento'}
                    </p>
                  </div>
                </div>
                {isActive && (
                  <span className="rounded-full bg-red-500/20 px-2 py-1 text-[10px] font-bold uppercase text-red-300">
                    Activa
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-black/20 p-2">
                  <Users className="mx-auto mb-1 h-4 w-4 text-blue-400" />
                  <div className="text-lg font-bold text-white">{branch.student_count}</div>
                  <div className="text-[10px] text-gray-400">Alumnos</div>
                </div>
                <div className="rounded-lg bg-black/20 p-2">
                  <BookOpen className="mx-auto mb-1 h-4 w-4 text-purple-400" />
                  <div className="text-lg font-bold text-white">{branch.active_class_count}</div>
                  <div className="text-[10px] text-gray-400">Clases</div>
                </div>
                <div className="rounded-lg bg-black/20 p-2">
                  <DollarSign className="mx-auto mb-1 h-4 w-4 text-emerald-400" />
                  <div className="truncate text-sm font-bold text-white">
                    <MoneyValue amount={branch.monthly_revenue} />
                  </div>
                  <div className="text-[10px] text-gray-400">Mes</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
