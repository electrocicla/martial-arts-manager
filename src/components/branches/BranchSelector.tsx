import { Building2, ChevronDown } from 'lucide-react';
import { useBranch } from '../../hooks/useBranch';
import { cn } from '../../lib/utils';

interface BranchSelectorProps {
  compact?: boolean;
  className?: string;
}
export function BranchSelector({ compact = false, className }: BranchSelectorProps) {
  const { branches, activeBranchId, selectBranch, isLoading } = useBranch();

  if (branches.length === 0) return null;

  return (
    <label
      className={cn(
        'relative flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-900/70 text-gray-200',
        compact ? 'px-2 py-1.5' : 'px-3 py-2',
        className,
      )}
    >
      <Building2 className="h-4 w-4 shrink-0 text-red-400" />
      <select
        aria-label="Sede activa"
        value={activeBranchId}
        disabled={isLoading}
        onChange={(event) => selectBranch(event.target.value)}
        className={cn(
          'min-w-0 flex-1 appearance-none bg-transparent pr-5 font-semibold text-white outline-none',
          compact ? 'max-w-32 text-xs' : 'max-w-48 text-sm',
        )}
      >
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id} className="bg-gray-900">
            {branch.name}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-gray-400" />
    </label>
  );
}
