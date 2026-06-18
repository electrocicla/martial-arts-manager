import { useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  BookOpen,
  Building2,
  CheckCircle2,
  DollarSign,
  MapPin,
  Pencil,
  Plus,
  Users,
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { branchService } from '../services/branch.service';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../hooks/useBranch';
import { useStudents } from '../hooks/useStudents';
import { useClasses } from '../hooks/useClasses';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import MoneyValue from '../components/ui/MoneyValue';

interface BranchFormState {
  name: string;
  address: string;
  phone: string;
  email: string;
  notes: string;
}

const EMPTY_FORM: BranchFormState = {
  name: '',
  address: '',
  phone: '',
  email: '',
  notes: '',
};

export default function Branches() {
  const { user } = useAuth();
  const {
    branches,
    activeBranch,
    activeBranchId,
    selectBranch,
    refreshBranches,
  } = useBranch();
  const { students, refresh: refreshStudents } = useStudents();
  const { classes, refresh: refreshClasses } = useClasses();
  const { success, error } = useToast();

  const [showCreate, setShowCreate] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [form, setForm] = useState<BranchFormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
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
    () => branches.filter((branch) => branch.id !== activeBranchId),
    [activeBranchId, branches],
  );
  const selectedCount = selectedStudents.size + selectedClasses.size + selectedDisciplines.size;

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const openCreate = () => {
    setEditingBranchId(null);
    setForm(EMPTY_FORM);
    setShowCreate(true);
  };

  const openEdit = (branchId: string) => {
    const branch = branches.find((item) => item.id === branchId);
    if (!branch) return;
    setEditingBranchId(branchId);
    setForm({
      name: branch.name,
      address: branch.address ?? '',
      phone: branch.phone ?? '',
      email: branch.email ?? '',
      notes: branch.notes ?? '',
    });
    setShowCreate(true);
  };

  const saveBranch = async () => {
    if (!form.name.trim()) {
      error('El nombre de la sede es obligatorio');
      return;
    }

    setIsSaving(true);
    const response = editingBranchId
      ? await branchService.update(editingBranchId, form)
      : await branchService.create(form);
    setIsSaving(false);

    if (!response.success) {
      error(response.error || 'No se pudo guardar la sede');
      return;
    }

    await refreshBranches();
    setShowCreate(false);
    setForm(EMPTY_FORM);
    success(editingBranchId ? 'Sede actualizada' : 'Sede creada');
  };

  const transferStudents = async () => {
    if (!targetBranchId) {
      error('Selecciona una sede de destino');
      return;
    }
    if (selectedCount === 0) {
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

    setSelectedStudents(new Set());
    setSelectedClasses(new Set());
    setSelectedDisciplines(new Set());
    setTransferReason('');
    await Promise.all([refreshBranches(), refreshStudents(), refreshClasses()]);
    success(`${response.data.transferred} alumno(s) trasladado(s) correctamente`);
  };

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

  return (
    <div className="min-h-screen bg-black px-4 py-6 pb-28 sm:px-6 md:pb-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-black p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <span className="rounded-xl bg-red-500/15 p-2.5 text-red-400">
                <Building2 className="h-6 w-6" />
              </span>
              <h1 className="text-3xl font-black text-white">Gestión de sedes</h1>
            </div>
            <p className="max-w-2xl text-sm text-gray-400">
              Cada sede mantiene cursos, matrículas, pagos, ingresos y configuración separados.
            </p>
          </div>
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            Nueva sede
          </Button>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {branches.map((branch) => (
            <article
              key={branch.id}
              className={`rounded-2xl border p-5 ${
                branch.id === activeBranchId
                  ? 'border-red-500/60 bg-red-950/20'
                  : 'border-gray-700 bg-gray-900'
              }`}
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">{branch.name}</h2>
                    {branch.is_main === 1 && (
                      <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-300">
                        Principal
                      </span>
                    )}
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                    <MapPin className="h-3.5 w-3.5" />
                    {branch.address || 'Dirección no registrada'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openEdit(branch.id)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
                  aria-label={`Editar ${branch.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-black/30 p-3">
                  <Users className="mb-2 h-4 w-4 text-blue-400" />
                  <p className="text-xl font-bold text-white">{branch.student_count}</p>
                  <p className="text-xs text-gray-400">Alumnos activos</p>
                </div>
                <div className="rounded-xl bg-black/30 p-3">
                  <BookOpen className="mb-2 h-4 w-4 text-purple-400" />
                  <p className="text-xl font-bold text-white">{branch.active_class_count}</p>
                  <p className="text-xs text-gray-400">Clases activas</p>
                </div>
                <div className="rounded-xl bg-black/30 p-3">
                  <DollarSign className="mb-2 h-4 w-4 text-emerald-400" />
                  <p className="truncate text-lg font-bold text-white">
                    <MoneyValue amount={branch.monthly_revenue} />
                  </p>
                  <p className="text-xs text-gray-400">Ingresos del mes</p>
                </div>
                <div className="rounded-xl bg-black/30 p-3">
                  <CheckCircle2 className="mb-2 h-4 w-4 text-amber-400" />
                  <p className="text-xl font-bold text-white">{branch.attendance_count}</p>
                  <p className="text-xs text-gray-400">Asistencias</p>
                </div>
              </div>

              <Button
                variant={branch.id === activeBranchId ? 'secondary' : 'outline'}
                size="sm"
                className="mt-4 w-full"
                onClick={() => selectBranch(branch.id)}
              >
                {branch.id === activeBranchId ? 'Sede activa' : 'Abrir esta sede'}
              </Button>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-950 p-5 sm:p-6">
          <div className="mb-6 flex items-start gap-3">
            <span className="rounded-xl bg-amber-500/15 p-2.5 text-amber-400">
              <ArrowRightLeft className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-white">Trasladar alumnos</h2>
              <p className="text-sm text-gray-400">
                Origen: <strong className="text-gray-200">{activeBranch?.name ?? 'Sede activa'}</strong>.
                El historial financiero permanecerá en esta sede.
              </p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr_1.2fr]">
            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-300">Por disciplina</h3>
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {disciplines.map((discipline) => (
                  <label key={discipline} className="flex items-center gap-3 rounded-lg bg-black/20 p-3 text-sm text-gray-200">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm checkbox-error"
                      checked={selectedDisciplines.has(discipline)}
                      onChange={() => toggleSetItem(setSelectedDisciplines, discipline)}
                    />
                    <span>{discipline}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-300">Por curso o clase</h3>
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {classes.map((classItem) => (
                  <label key={classItem.id} className="flex items-center gap-3 rounded-lg bg-black/20 p-3 text-sm text-gray-200">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm checkbox-error"
                      checked={selectedClasses.has(classItem.id)}
                      onChange={() => toggleSetItem(setSelectedClasses, classItem.id)}
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{classItem.name}</span>
                      <span className="block text-xs text-gray-500">{classItem.discipline}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-300">Alumnos específicos</h3>
                <button
                  type="button"
                  onClick={() => setSelectedStudents(
                    selectedStudents.size === students.length
                      ? new Set()
                      : new Set(students.map((student) => student.id)),
                  )}
                  className="text-xs font-semibold text-red-300 hover:text-red-200"
                >
                  {selectedStudents.size === students.length ? 'Quitar todos' : 'Seleccionar todos'}
                </button>
              </div>
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {students.map((student) => (
                  <label key={student.id} className="flex items-center gap-3 rounded-lg bg-black/20 p-3 text-sm text-gray-200">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm checkbox-error"
                      checked={selectedStudents.has(student.id)}
                      onChange={() => toggleSetItem(setSelectedStudents, student.id)}
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{student.name}</span>
                      <span className="block truncate text-xs text-gray-500">
                        {student.discipline} · {student.belt}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-semibold text-gray-300">Sede de destino</span>
              <select
                value={targetBranchId}
                onChange={(event) => setTargetBranchId(event.target.value)}
                className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-3 text-white outline-none focus:border-red-500"
              >
                <option value="">Seleccionar sede</option>
                {targetBranches.map((branch) => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </label>
            <Input
              label="Motivo del traslado"
              value={transferReason}
              onChange={(event) => setTransferReason(event.target.value)}
              placeholder="Ej: cambio de domicilio, nuevo horario..."
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-amber-100/80">
              Se conservarán grado, cinturón, disciplinas y perfil. Pagos y matrículas previas no se moverán.
            </p>
            <Button
              variant="primary"
              disabled={isTransferring || selectedCount === 0 || !targetBranchId}
              isLoading={isTransferring}
              leftIcon={<ArrowRightLeft className="h-4 w-4" />}
              onClick={transferStudents}
            >
              Confirmar traslado
            </Button>
          </div>
        </section>
      </div>

      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title={editingBranchId ? 'Editar sede' : 'Crear nueva sede'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Nombre"
            required
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Ej: Sede Centro"
          />
          <Input
            label="Dirección"
            value={form.address}
            onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Teléfono"
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            />
            <Input
              label="Correo"
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </div>
          <label>
            <span className="mb-2 block text-sm font-semibold text-gray-300">Notas administrativas</span>
            <textarea
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              className="min-h-24 w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-3 text-white outline-none focus:border-red-500"
            />
          </label>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button variant="primary" isLoading={isSaving} onClick={saveBranch}>
              {editingBranchId ? 'Guardar cambios' : 'Crear sede'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
