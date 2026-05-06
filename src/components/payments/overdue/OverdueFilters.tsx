/**
 * OverdueFilters
 *
 * Search input + premium-styled discipline chip filters for the Overdue tab.
 * Pure presentation; the parent owns the state.
 */

import { useTranslation } from 'react-i18next';
import { Search, X, Filter } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface OverdueFiltersProps {
  searchQuery: string;
  onSearchChange: (next: string) => void;
  availableDisciplines: string[];
  selectedDisciplines: Set<string>;
  onToggleDiscipline: (discipline: string) => void;
  onClearDisciplines: () => void;
  filteredCount: number;
  totalCount: number;
}

export default function OverdueFilters({
  searchQuery,
  onSearchChange,
  availableDisciplines,
  selectedDisciplines,
  onToggleDiscipline,
  onClearDisciplines,
  filteredCount,
  totalCount,
}: OverdueFiltersProps) {
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isDropdownOpen]);

  const hasActiveFilters = searchQuery.length > 0 || selectedDisciplines.size > 0;

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-3 space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t(
              'payments.overdue.searchPlaceholder',
              'Search overdue students by name, email or phone',
            )}
            className="w-full pl-10 pr-9 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/60 transition-colors"
            aria-label={t('payments.overdue.searchAria', 'Search overdue students')}
          />
          {searchQuery.length > 0 && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label={t('common.clear', 'Clear')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-800/80 border border-gray-700 text-gray-200">
            {t('payments.overdue.filteredCount', '{{filtered}} of {{total}}', {
              filtered: filteredCount,
              total: totalCount,
            })}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                onSearchChange('');
                onClearDisciplines();
              }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-gray-300 hover:text-white hover:bg-gray-700 border border-transparent hover:border-gray-600 transition-colors"
            >
              <X className="w-3 h-3" />
              {t('payments.overdue.clearFilters', 'Clear filters')}
            </button>
          )}
        </div>
      </div>

      {availableDisciplines.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
            {t('payments.overdue.disciplineFilter', 'Discipline')}:
          </span>

          {/* Quick chip toggle buttons (visible from sm up). */}
          <div className="hidden sm:flex flex-wrap items-center gap-2">
            {availableDisciplines.map((discipline) => {
              const isActive = selectedDisciplines.has(discipline);
              return (
                <button
                  key={discipline}
                  type="button"
                  onClick={() => onToggleDiscipline(discipline)}
                  aria-pressed={isActive}
                  className={[
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 active:scale-[0.97]',
                    isActive
                      ? 'bg-gradient-to-br from-red-600 to-red-700 text-white border-red-500 shadow-lg shadow-red-900/40'
                      : 'bg-gray-800 text-gray-300 border-gray-700 hover:border-red-500/60 hover:text-white hover:bg-gray-700',
                  ].join(' ')}
                  title={
                    isActive
                      ? t('payments.overdue.disciplineRemoveTooltip', 'Hide students of {{discipline}}', { discipline })
                      : t('payments.overdue.disciplineAddTooltip', 'Show only students of {{discipline}}', { discipline })
                  }
                >
                  {isActive && <span aria-hidden>\u2713</span>}
                  <span className="capitalize">{discipline}</span>
                </button>
              );
            })}
            {selectedDisciplines.size > 0 && (
              <button
                type="button"
                onClick={onClearDisciplines}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              >
                <X className="w-3 h-3" />
                {t('payments.overdue.resetDisciplines', 'Reset')}
              </button>
            )}
          </div>

          {/* Compact dropdown alternative (visible on mobile, also as alt access). */}
          <div className="relative sm:hidden" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((open) => !open)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-800 border border-gray-700 text-gray-200 hover:border-red-500/60 hover:bg-gray-700 transition-colors"
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
            >
              <Filter className="w-3.5 h-3.5" />
              {t('payments.overdue.disciplineDropdown', 'Filter by discipline')}
              {selectedDisciplines.size > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-200 text-[10px]">
                  {selectedDisciplines.size}
                </span>
              )}
            </button>

            {isDropdownOpen && (
              <div
                role="listbox"
                className="absolute left-0 mt-2 w-56 max-h-64 overflow-y-auto rounded-xl bg-gray-800 border border-gray-700 shadow-2xl z-30 p-1"
              >
                {availableDisciplines.map((discipline) => {
                  const isActive = selectedDisciplines.has(discipline);
                  return (
                    <button
                      key={discipline}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onClick={() => onToggleDiscipline(discipline)}
                      className={[
                        'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm capitalize transition-colors',
                        isActive
                          ? 'bg-red-500/15 text-white'
                          : 'text-gray-200 hover:bg-gray-700',
                      ].join(' ')}
                    >
                      <span>{discipline}</span>
                      {isActive && <span aria-hidden className="text-red-300">\u2713</span>}
                    </button>
                  );
                })}
                {selectedDisciplines.size > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      onClearDisciplines();
                      setIsDropdownOpen(false);
                    }}
                    className="w-full mt-1 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                  >
                    {t('payments.overdue.resetDisciplines', 'Reset')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
