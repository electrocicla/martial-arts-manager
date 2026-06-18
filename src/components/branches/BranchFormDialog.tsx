import { useEffect, useState } from 'react';
import type { BranchSummary } from '../../types';
import { useBreakpoint } from '../../lib/useBreakpoint';
import { branchService } from '../../services/branch.service';
import { useToast } from '../../hooks/useToast';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Sheet } from '../ui/Sheet';

interface BranchFormState {
  name: string;
  address: string;
  phone: string;
  email: string;
  notes: string;
}

interface BranchFormDialogProps {
  open: boolean;
  branch: BranchSummary | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

const EMPTY_FORM: BranchFormState = {
  name: '',
  address: '',
  phone: '',
  email: '',
  notes: '',
};

export function BranchFormDialog({
  open,
  branch,
  onClose,
  onSaved,
}: BranchFormDialogProps) {
  const isDesktop = useBreakpoint('md');
  const { success, error } = useToast();
  const [form, setForm] = useState<BranchFormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(branch ? {
      name: branch.name,
      address: branch.address ?? '',
      phone: branch.phone ?? '',
      email: branch.email ?? '',
      notes: branch.notes ?? '',
    } : EMPTY_FORM);
  }, [branch, open]);

  const save = async () => {
    if (!form.name.trim()) {
      error('El nombre de la sede es obligatorio');
      return;
    }

    setIsSaving(true);
    const response = branch
      ? await branchService.update(branch.id, form)
      : await branchService.create(form);
    setIsSaving(false);

    if (!response.success) {
      error(response.error || 'No se pudo guardar la sede');
      return;
    }

    await onSaved();
    onClose();
    success(branch ? 'Sede actualizada' : 'Sede creada');
  };

  const title = branch ? 'Editar sede' : 'Crear nueva sede';
  const content = (
    <BranchForm
      form={form}
      isSaving={isSaving}
      submitLabel={branch ? 'Guardar cambios' : 'Crear sede'}
      onChange={setForm}
      onCancel={onClose}
      onSubmit={save}
    />
  );

  if (!isDesktop) {
    return (
      <Sheet open={open} onClose={onClose} title={title} className="max-h-[92vh]">
        {content}
      </Sheet>
    );
  }

  return (
    <Modal isOpen={open} onClose={onClose} title={title} size="lg">
      {content}
    </Modal>
  );
}

interface BranchFormProps {
  form: BranchFormState;
  isSaving: boolean;
  submitLabel: string;
  onChange: React.Dispatch<React.SetStateAction<BranchFormState>>;
  onCancel: () => void;
  onSubmit: () => void;
}

function BranchForm({
  form,
  isSaving,
  submitLabel,
  onChange,
  onCancel,
  onSubmit,
}: BranchFormProps) {
  return (
    <div className="space-y-4 pb-2">
      <Input
        label="Nombre"
        required
        value={form.name}
        onChange={(event) => onChange((current) => ({ ...current, name: event.target.value }))}
        placeholder="Ej: Sede Centro"
      />
      <Input
        label="Dirección"
        value={form.address}
        onChange={(event) => onChange((current) => ({ ...current, address: event.target.value }))}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Teléfono"
          value={form.phone}
          onChange={(event) => onChange((current) => ({ ...current, phone: event.target.value }))}
        />
        <Input
          label="Correo"
          type="email"
          value={form.email}
          onChange={(event) => onChange((current) => ({ ...current, email: event.target.value }))}
        />
      </div>
      <label>
        <span className="mb-2 block text-sm font-semibold text-gray-300">Notas administrativas</span>
        <textarea
          value={form.notes}
          onChange={(event) => onChange((current) => ({ ...current, notes: event.target.value }))}
          className="min-h-24 w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-3 text-white outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
        />
      </label>
      <div className="sticky bottom-0 flex gap-3 border-t border-gray-700 bg-gray-900/95 pt-4 backdrop-blur sm:justify-end">
        <Button className="min-h-11 flex-1 sm:flex-none" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button className="min-h-11 flex-1 sm:flex-none" variant="primary" isLoading={isSaving} onClick={onSubmit}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
