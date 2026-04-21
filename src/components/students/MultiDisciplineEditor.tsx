/**
 * MultiDisciplineEditor
 * Reusable multi-discipline + belt editor.
 * Lets users add/remove multiple discipline rows, each with an independent belt selector.
 *
 * Used by:
 *  - StudentFormModal (admin/instructor adds a new student)
 *  - StudentEditModal (admin/instructor edits a student)
 *  - StudentProfile (a student edits themselves)
 */
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BELT_RANKINGS, DISCIPLINES } from '../../lib/constants';

export interface DisciplineEntry {
  discipline: string;
  belt: string;
}

interface MultiDisciplineEditorProps {
  value: DisciplineEntry[];
  onChange: (entries: DisciplineEntry[]) => void;
  /** Disciplines surfaced first in dropdown (e.g. from API metadata). */
  preferred?: string[];
  /** Force compact two-column layout regardless of breakpoint. */
  compact?: boolean;
  /** Optional id prefix for inputs (a11y). */
  idPrefix?: string;
}

const DEFAULT_BELT = 'White';

export function MultiDisciplineEditor({
  value,
  onChange,
  preferred,
  compact,
  idPrefix = 'mde',
}: MultiDisciplineEditorProps) {
  const { t } = useTranslation();

  const allDisciplines = Array.from(
    new Set([...(preferred ?? []), ...DISCIPLINES]),
  );

  const beltsFor = (discipline: string): string[] =>
    BELT_RANKINGS[discipline] ?? ['White', 'Intermediate', 'Advanced'];

  const updateEntry = (idx: number, patch: Partial<DisciplineEntry>) => {
    const next = value.map((entry, i) =>
      i === idx ? { ...entry, ...patch } : entry,
    );
    // If discipline changed, reset belt to first valid option for the new discipline
    if (patch.discipline) {
      const valid = beltsFor(patch.discipline);
      if (!valid.includes(next[idx].belt)) {
        next[idx].belt = valid[0] ?? DEFAULT_BELT;
      }
    }
    onChange(next);
  };

  const removeEntry = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const addEntry = () => {
    const used = new Set(value.map(e => e.discipline));
    const next = allDisciplines.find(d => !used.has(d)) ?? allDisciplines[0];
    onChange([...value, { discipline: next, belt: beltsFor(next)[0] ?? DEFAULT_BELT }]);
  };

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-sm text-base-content/60 italic">
          {t('profile.noDisciplinesSet', 'No disciplines set')}
        </p>
      )}

      {value.map((entry, idx) => {
        const belts = beltsFor(entry.discipline);
        return (
          <div
            key={`${idPrefix}-${idx}`}
            className={`grid gap-2 items-end ${compact ? 'grid-cols-[1fr_1fr_auto]' : 'grid-cols-1 sm:grid-cols-[1fr_1fr_auto]'}`}
          >
            <div className="space-y-1">
              <label
                htmlFor={`${idPrefix}-disc-${idx}`}
                className="block text-xs font-medium text-base-content/70 uppercase tracking-wide"
              >
                {t('profile.discipline', 'Discipline')}
              </label>
              <select
                id={`${idPrefix}-disc-${idx}`}
                className="w-full px-3 py-2.5 bg-base-200 border border-base-300 rounded-lg text-base-content focus:ring-2 focus:ring-primary focus:border-transparent transition"
                value={entry.discipline}
                onChange={(e) => updateEntry(idx, { discipline: e.target.value })}
              >
                {allDisciplines.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor={`${idPrefix}-belt-${idx}`}
                className="block text-xs font-medium text-base-content/70 uppercase tracking-wide"
              >
                {t('profile.belt', 'Belt/Rank')}
              </label>
              <select
                id={`${idPrefix}-belt-${idx}`}
                className="w-full px-3 py-2.5 bg-base-200 border border-base-300 rounded-lg text-base-content focus:ring-2 focus:ring-primary focus:border-transparent transition"
                value={entry.belt}
                onChange={(e) => updateEntry(idx, { belt: e.target.value })}
              >
                {belts.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => removeEntry(idx)}
              className="px-3 py-2.5 rounded-lg bg-error/10 text-error hover:bg-error/20 transition border border-error/20"
              aria-label={t('profile.remove', 'Remove')}
              title={t('profile.remove', 'Remove')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      })}

      <button
        type="button"
        onClick={addEntry}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition font-medium text-sm border border-primary/20"
      >
        <Plus className="w-4 h-4" />
        {t('profile.addDiscipline', 'Add Discipline')}
      </button>
    </div>
  );
}

export default MultiDisciplineEditor;
