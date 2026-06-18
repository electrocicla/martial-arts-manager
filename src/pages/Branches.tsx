import { useMemo, useState } from 'react';
import { Building2, Plus } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../hooks/useBranch';
import { useStudents } from '../hooks/useStudents';
import { useClasses } from '../hooks/useClasses';
import { Button } from '../components/ui/Button';
import { BranchCard } from '../components/branches/BranchCard';
import { BranchFormDialog } from '../components/branches/BranchFormDialog';
import { BranchTransferPanel } from '../components/branches/BranchTransferPanel';

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
  const [formOpen, setFormOpen] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);

  const editingBranch = useMemo(
    () => branches.find((branch) => branch.id === editingBranchId) ?? null,
    [branches, editingBranchId],
  );

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const openCreate = () => {
    setEditingBranchId(null);
    setFormOpen(true);
  };

  const openEdit = (branchId: string) => {
    setEditingBranchId(branchId);
    setFormOpen(true);
  };

  const refreshBranchData = async () => {
    await Promise.all([refreshBranches(), refreshStudents(), refreshClasses()]);
  };

  return (
    <div className="min-h-screen bg-black px-3 py-4 pb-32 sm:px-6 sm:py-6 md:pb-8">
      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
        <header className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-black p-4 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:p-6">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-3">
              <span className="rounded-xl bg-red-500/15 p-2.5 text-red-400">
                <Building2 className="h-5 w-5 sm:h-6 sm:w-6" />
              </span>
              <h1 className="text-2xl font-black text-white sm:text-3xl">Gestión de sedes</h1>
            </div>
            <p className="max-w-2xl text-sm leading-5 text-gray-400">
              Cursos, matrículas, pagos, ingresos y configuración permanecen separados por sede.
            </p>
          </div>
          <Button
            variant="primary"
            className="mt-4 min-h-12 w-full sm:mt-0 sm:w-auto"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={openCreate}
          >
            Nueva sede
          </Button>
        </header>

        <section
          className="-mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-2 scrollbar-hide sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-3"
          aria-label="Sedes disponibles"
        >
          {branches.map((branch) => (
            <BranchCard
              key={branch.id}
              branch={branch}
              isActive={branch.id === activeBranchId}
              onEdit={openEdit}
              onSelect={selectBranch}
            />
          ))}
        </section>

        <BranchTransferPanel
          activeBranch={activeBranch}
          branches={branches}
          classes={classes}
          students={students}
          onTransferred={refreshBranchData}
        />
      </div>

      <BranchFormDialog
        open={formOpen}
        branch={editingBranch}
        onClose={() => setFormOpen(false)}
        onSaved={refreshBranches}
      />
    </div>
  );
}
