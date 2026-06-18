import { useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  BookOpen,
  Search,
} from 'lucide-react';
import type { BranchSummary, Class, Student } from '../../types';
import { branchService } from '../../services/branch.service';
import { useToast } from '../../hooks/useToast';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

type SelectionTab = 'disciplines' | 'classes' | 'students';

interface BranchTransferPanelProps {
  activeBranch: BranchSummary | null;
  branches: BranchSummary[];
  classes: Class[];
  students: Student[];
  onTransferred: () => Promise<void>;
}

const TABS: Array<{ id: SelectionTab; label: string }> = [
  { id: 'disciplines', label: 'Disciplinas' },
  { id: 'classes', label: 'Cursos' },
  { id: 'students', label: 'Alumnos' },
];

export function BranchTransferPanel({
  activeBranch,
  branches,
  classes,
  students,
  onTransferred,
}: BranchTransferPanelProps) {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<SelectionTab>('disciplines');
  const [query, setQuery] = useState('');
  const [targetBranchId, setTargetBranchId] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  const [selectedDisciplines, setSelectedDisciplines] = useState<Set<string>>(new Set());
  const [transferReason, setTransferReason] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  const disciplines = useMemo(
    () => Array.from(new Set(students.map((student) => student.discipline).filter(Boolean))).sort(),
    [students],
  );
  const targetBranches = useMemo(
    () => branches.filter((branch) => branch.id !== activeBranch?.id),
    [activeBranch?.id, branches],
  );
  const normalizedQuery = query.trim().toLocaleLowerCase('es');
  const visibleDisciplines = useMemo(
    () => disciplines.filter((discipline) => discipline.toLocaleLowerCase('es').includes(normalizedQuery)),
    [disciplines, normalizedQuery],
  );
  const visibleClasses = useMemo(
    () => classes.filter((item) => `${item.name} ${item.discipline}`.toLocaleLowerCase('es').includes(normalizedQuery)),
    [classes, normalizedQuery],
  );
  const visibleStudents = useMemo(
    () => students.filter((student) => `${student.name} ${student.discipline} ${student.belt}`.toLocaleLowerCase('es').includes(normalizedQuery)),
    [students, normalizedQuery],
  );
  const selectedFilterCount = selectedStudents.size + selectedClasses.size + selectedDisciplines.size;

  const toggleSetItem = (
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    value: string,
  ) => {
    setter((current) => {
      const next = new Set(current);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const resetSelection = () => {
    setSelectedStudents(new Set());
    setSelectedClasses(new Set());
    setSelectedDisciplines(new Set());
    setTransferReason('');
    setQuery('');
  };

  const transferStudents = async () => {
    if (!targetBranchId) {
      error('Selecciona una sede de destino');
      return;
    }
    if (selectedFilterCount === 0) {
      error('Selecciona alumnos, cursos o disciplinas');
      return;
    }

    setIsTransferring(true);
    const response = await branchService.transferStudents({
      targetBranchId,
      studentIds: Array.from(selectedStudents),
      classIds: Array.from(selectedClasses),
      disciplines: Array.from(selectedDisciplines),
      reason: transferReason,
    });
    setIsTransferring(false);

    if (!response.success || !response.data) {
      error(response.error || 'No se pudo completar el traslado');
      return;
    }

    resetSelection();
    await onTransferred();
    success(`${response.data.transferred} alumno(s) trasladado(s) correctamente`);
  };

  return (
    <section className="rounded-2xl border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-950 p-4 sm:p-6">
      <div className="mb-5 flex items-start gap-3 sm:mb-6">
        <span className="rounded-xl bg-amber-500/15 p-2.5 text-amber-400">
          <ArrowRightLeft className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-white">Trasladar alumnos</h2>
          <p className="mt-1 text-sm leading-5 text-gray-400">
            Origen: <strong className="text-gray-200">{activeBranch?.name ?? 'Sede activa'}</strong>.
            El historial financiero permanecerá en esta sede.
          </p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-1 rounded-xl bg-black/30 p-1 md:hidden" role="tablist" aria-label="Método de selección">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setQuery('');
            }}
            className={`min-h-11 rounded-lg px-2 text-xs font-bold transition-colors ${
              activeTab === tab.id
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            }`}
          >
            {tab.label}
            <span className="ml-1 text-[10px] opacity-80">
              {tab.id === 'disciplines' && selectedDisciplines.size > 0 ? selectedDisciplines.size : ''}
              {tab.id === 'classes' && selectedClasses.size > 0 ? selectedClasses.size : ''}
              {tab.id === 'students' && selectedStudents.size > 0 ? selectedStudents.size : ''}
            </span>
          </button>
        ))}
      </div>

      <div className="mb-4 md:hidden">
        <Input
          aria-label="Buscar opciones de traslado"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Buscar ${TABS.find((tab) => tab.id === activeTab)?.label.toLowerCase()}...`}
          leftIcon={<Search />}
          inputSize="sm"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <SelectionColumn title="Por disciplina" visible={activeTab === 'disciplines'}>
          {visibleDisciplines.map((discipline) => (
            <SelectionRow
              key={discipline}
              checked={selectedDisciplines.has(discipline)}
              label={discipline}
              onChange={() => toggleSetItem(setSelectedDisciplines, discipline)}
            />
          ))}
          {visibleDisciplines.length === 0 && <EmptySelection label="No hay disciplinas disponibles" />}
        </SelectionColumn>

        <SelectionColumn title="Por curso o clase" visible={activeTab === 'classes'}>
          {visibleClasses.map((classItem) => (
            <SelectionRow
              key={classItem.id}
              checked={selectedClasses.has(classItem.id)}
              label={classItem.name}
              detail={classItem.discipline}
              onChange={() => toggleSetItem(setSelectedClasses, classItem.id)}
            />
          ))}
          {visibleClasses.length === 0 && <EmptySelection label="No hay clases disponibles" />}
        </SelectionColumn>

        <SelectionColumn
          title="Alumnos específicos"
          visible={activeTab === 'students'}
          action={(
            <button
              type="button"
              onClick={() => setSelectedStudents(
                selectedStudents.size === students.length
                  ? new Set()
                  : new Set(students.map((student) => student.id)),
              )}
              className="min-h-11 rounded-lg px-2 text-xs font-semibold text-red-300 hover:bg-red-500/10 hover:text-red-200"
            >
              {selectedStudents.size === students.length ? 'Quitar todos' : 'Seleccionar todos'}
            </button>
          )}
        >
          {visibleStudents.map((student) => (
            <SelectionRow
              key={student.id}
              checked={selectedStudents.has(student.id)}
              label={student.name}
              detail={`${student.discipline} · ${student.belt}`}
              onChange={() => toggleSetItem(setSelectedStudents, student.id)}
            />
          ))}
          {visibleStudents.length === 0 && <EmptySelection label="No hay alumnos disponibles" />}
        </SelectionColumn>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Select
          label="Sede de destino"
          value={targetBranchId}
          onChange={(event) => setTargetBranchId(event.target.value)}
          placeholder="Seleccionar sede"
          options={targetBranches.map((branch) => ({ value: branch.id, label: branch.name }))}
        />
        <Input
          label="Motivo del traslado"
          value={transferReason}
          onChange={(event) => setTransferReason(event.target.value)}
          placeholder="Ej: cambio de domicilio, nuevo horario..."
        />
      </div>

      <div className="sticky bottom-[4.65rem] z-20 -mx-4 mt-6 border-y border-amber-500/20 bg-gray-950/95 p-4 shadow-[0_-18px_36px_-24px_rgba(0,0,0,0.95)] backdrop-blur sm:static sm:mx-0 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:rounded-xl sm:border sm:bg-amber-500/5 sm:shadow-none">
        <div className="mb-3 flex items-center justify-between gap-3 sm:mb-0">
          <p className="text-sm text-amber-100/80">
            Perfil y graduación se conservan; pagos anteriores no se moverán.
          </p>
          {selectedFilterCount > 0 && (
            <span className="shrink-0 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-200">
              {selectedFilterCount} selecciones
            </span>
          )}
        </div>
        <Button
          variant="primary"
          className="min-h-12 w-full shrink-0 sm:w-auto"
          disabled={isTransferring || selectedFilterCount === 0 || !targetBranchId}
          isLoading={isTransferring}
          leftIcon={<ArrowRightLeft className="h-4 w-4" />}
          onClick={transferStudents}
        >
          Confirmar traslado
        </Button>
      </div>
    </section>
  );
}

interface SelectionColumnProps {
  title: string;
  visible: boolean;
  action?: React.ReactNode;
  children: React.ReactNode;
}

function SelectionColumn({ title, visible, action, children }: SelectionColumnProps) {
  return (
    <div className={`${visible ? 'block' : 'hidden'} md:block`}>
      <div className="mb-3 flex min-h-11 items-center justify-between gap-2">
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-300">{title}</h3>
        {action}
      </div>
      <div className="max-h-[21rem] space-y-2 overflow-y-auto pr-1 md:max-h-72">
        {children}
      </div>
    </div>
  );
}

interface SelectionRowProps {
  checked: boolean;
  label: string;
  detail?: string;
  onChange: () => void;
}

function SelectionRow({ checked, label, detail, onChange }: SelectionRowProps) {
  return (
    <label className={`flex min-h-12 items-center gap-3 rounded-xl border p-3 text-sm transition-colors ${
      checked
        ? 'border-red-500/40 bg-red-500/10 text-white'
        : 'border-transparent bg-black/20 text-gray-200 hover:bg-black/30'
    }`}>
      <input
        type="checkbox"
        className="checkbox checkbox-sm checkbox-error shrink-0"
        checked={checked}
        onChange={onChange}
      />
      <span className="min-w-0">
        <span className="block truncate font-semibold">{label}</span>
        {detail && <span className="block truncate text-xs text-gray-500">{detail}</span>}
      </span>
    </label>
  );
}

function EmptySelection({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-700 p-5 text-center text-sm text-gray-500">
      <BookOpen className="mx-auto mb-2 h-5 w-5 opacity-60" />
      {label}
    </div>
  );
}
