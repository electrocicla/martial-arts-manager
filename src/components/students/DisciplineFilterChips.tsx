/**
 * DisciplineFilterChips
 * Horizontal scroll-snap chip bar for quickly filtering students by discipline.
 * Multi-select. Shows live counts per chip.
 */
import { Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { QUICK_DISCIPLINE_FILTERS, DISCIPLINES } from '../../lib/constants';

interface DisciplineFilterChipsProps {
  /** Selected raw discipline values (canonical names from constants). Empty = "All". */
  selected: string[];
  /** Counts per discipline value, for badge labels. */
  counts: Record<string, number>;
  onChange: (next: string[]) => void;
  /** When true, render every discipline chip (admin filter view). Defaults to quick filters + most common. */
  showAll?: boolean;
}

export function DisciplineFilterChips({
  selected,
  counts,
  onChange,
  showAll,
}: DisciplineFilterChipsProps) {
  const { t } = useTranslation();
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const isAllSelected = selected.length === 0;

  const toggleQuick = (group: { matches: string[] }) => {
    const allOn = group.matches.every((m) => selected.includes(m));
    if (allOn) {
      onChange(selected.filter((s) => !group.matches.includes(s)));
    } else {
      onChange(Array.from(new Set([...selected, ...group.matches])));
    }
  };

  const toggleSingle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const countFor = (matches: string[]) =>
    matches.reduce((acc, m) => acc + (counts[m] ?? 0), 0);

  // Discipline chips beyond the quick filters
  const quickMatches = new Set(QUICK_DISCIPLINE_FILTERS.flatMap((g) => g.matches));
  const otherDisciplines = DISCIPLINES.filter((d) => !quickMatches.has(d));

  return (
    <div
      className="flex items-center gap-2 overflow-x-auto pb-2 scroll-snap-x scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent"
      role="toolbar"
      aria-label={t('students.disciplineFilter', 'Filter by discipline')}
    >
      <div className="flex items-center gap-1.5 text-xs text-base-content/60 shrink-0 pr-1">
        <Filter className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{t('students.filter', 'Filter')}</span>
      </div>

      {/* "All" chip */}
      <button
        type="button"
        onClick={() => onChange([])}
        className={`shrink-0 snap-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition border ${
          isAllSelected
            ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-500/30'
            : 'bg-base-200 text-base-content border-base-300 hover:bg-base-300'
        }`}
      >
        {t('common.all', 'All')}
        <span className={`text-xs ${isAllSelected ? 'text-white/80' : 'text-base-content/50'}`}>{total}</span>
      </button>

      {/* Quick-filter chips (BJJ Gi / No-Gi / Kids / All BJJ / MMA) */}
      {QUICK_DISCIPLINE_FILTERS.map((group) => {
        const active = group.matches.every((m) => selected.includes(m)) && group.matches.length > 0;
        const count = countFor(group.matches);
        return (
          <button
            key={group.id}
            type="button"
            onClick={() => toggleQuick(group)}
            className={`shrink-0 snap-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition border ${
              active
                ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-500/30'
                : 'bg-base-200 text-base-content border-base-300 hover:bg-base-300'
            }`}
          >
            {group.label}
            <span className={`text-xs ${active ? 'text-white/80' : 'text-base-content/50'}`}>{count}</span>
          </button>
        );
      })}

      {/* Divider */}
      <span className="shrink-0 h-6 w-px bg-base-300 mx-1" aria-hidden="true" />

      {/* Other disciplines */}
      {(showAll ? otherDisciplines : otherDisciplines.slice(0, 6)).map((d) => {
        const active = selected.includes(d);
        const count = counts[d] ?? 0;
        if (!showAll && count === 0) return null;
        return (
          <button
            key={d}
            type="button"
            onClick={() => toggleSingle(d)}
            className={`shrink-0 snap-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition border ${
              active
                ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-500/30'
                : 'bg-base-200 text-base-content border-base-300 hover:bg-base-300'
            }`}
          >
            {d}
            <span className={`text-xs ${active ? 'text-white/80' : 'text-base-content/50'}`}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}

export default DisciplineFilterChips;
