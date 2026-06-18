import {
  BookOpen,
  CheckCircle2,
  DollarSign,
  MapPin,
  Pencil,
  Users,
} from 'lucide-react';
import type { BranchSummary } from '../../types';
import { Button } from '../ui/Button';
import MoneyValue from '../ui/MoneyValue';

interface BranchCardProps {
  branch: BranchSummary;
  isActive: boolean;
  onEdit: (branchId: string) => void;
  onSelect: (branchId: string) => void;
}

export function BranchCard({
  branch,
  isActive,
  onEdit,
  onSelect,
}: BranchCardProps) {
  return (
    <article
      className={`w-[min(88vw,22rem)] shrink-0 snap-center rounded-2xl border p-4 sm:p-5 md:w-auto ${
        isActive
          ? 'border-red-500/60 bg-red-950/20'
          : 'border-gray-700 bg-gray-900'
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-3 sm:mb-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-bold text-white">{branch.name}</h2>
            {branch.is_main === 1 && (
              <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-300">
                Principal
              </span>
            )}
          </div>
          <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{branch.address || 'Dirección no registrada'}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => onEdit(branch.id)}
          className="grid min-h-11 min-w-11 place-items-center rounded-xl text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          aria-label={`Editar ${branch.name}`}
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        <Metric icon={Users} color="text-blue-400" value={branch.student_count} label="Alumnos activos" />
        <Metric icon={BookOpen} color="text-purple-400" value={branch.active_class_count} label="Clases activas" />
        <div className="min-w-0 rounded-xl bg-black/30 p-3">
          <DollarSign className="mb-2 h-4 w-4 text-emerald-400" />
          <p className="truncate text-base font-bold text-white sm:text-lg">
            <MoneyValue amount={branch.monthly_revenue} />
          </p>
          <p className="text-xs text-gray-400">Ingresos del mes</p>
        </div>
        <Metric icon={CheckCircle2} color="text-amber-400" value={branch.attendance_count} label="Asistencias" />
      </div>

      <Button
        variant={isActive ? 'secondary' : 'outline'}
        size="sm"
        className="mt-4 min-h-11 w-full"
        onClick={() => onSelect(branch.id)}
      >
        {isActive ? 'Sede activa' : 'Abrir esta sede'}
      </Button>
    </article>
  );
}

interface MetricProps {
  icon: typeof Users;
  color: string;
  value: number;
  label: string;
}

function Metric({ icon: Icon, color, value, label }: MetricProps) {
  return (
    <div className="rounded-xl bg-black/30 p-3">
      <Icon className={`mb-2 h-4 w-4 ${color}`} />
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}
