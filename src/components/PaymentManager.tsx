import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Badge } from './ui/Badge';
import { useToast } from '../hooks/useToast';
import { useDebounce } from '../hooks/useDebounce';
import { usePayments } from '../hooks/usePayments';
import { useStudents } from '../hooks/useStudents';
import { Search } from 'lucide-react';
import PaymentForm from './payments/PaymentForm';
import PaymentList from './payments/PaymentList';
import type { Payment, PaymentFormData, Student } from '../types/index';

export default function PaymentManager() {
  const {
    payments,
    createPayment,
    updatePayment,
    deletePayment,
    isUpdating,
    isDeleting,
  } = usePayments();

  const { students, isLoading: studentsLoading } = useStudents();

  const { t } = useTranslation();
  const unknownStudentLabel = t('payments.labels.unknownStudent');
  void unknownStudentLabel; // used by PaymentList

  const { success: showSuccess, error: showError } = useToast();

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const studentsById = useMemo(() => {
    return new Map(students.map((student: Student) => [student.id, student]));
  }, [students]);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    const normalizedSearch = debouncedSearchTerm.toLowerCase();
    return payments.filter((payment: Payment) => {
      const studentName = (studentsById.get(payment.student_id)?.name ?? payment.student_name ?? '').toLowerCase();
      const notesMatch = (payment.notes?.toLowerCase().includes(normalizedSearch)) ?? false;
      const matchesSearch = !debouncedSearchTerm ||
        studentName.includes(normalizedSearch) ||
        payment.type.toLowerCase().includes(normalizedSearch) ||
        notesMatch;

      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
      const matchesType = typeFilter === 'all' || payment.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [payments, studentsById, debouncedSearchTerm, statusFilter, typeFilter]);

  const addPayment = async (data: PaymentFormData): Promise<boolean | undefined> => {
    try {
      const result = await createPayment(data);
      if (result) {
        showSuccess('Pago agregado exitosamente', {
          description: 'El pago ha sido registrado en el sistema.'
        });
        return true;
      } else {
        showError('Error al agregar pago', {
          description: 'Por favor intenta nuevamente.'
        });
        return false;
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      showError('Error al agregar pago', {
        description: 'Ocurrió un error inesperado.'
      });
      return false;
    }
  };

  const editPayment = async (id: string, data: Partial<PaymentFormData>): Promise<Payment | null> => {
    try {
      const result = await updatePayment(id, data);
      if (result) {
        showSuccess(t('payments.actions.editSuccess'));
        return result;
      } else {
        showError(t('payments.actions.editError'));
        return null;
      }
    } catch (error) {
      console.error('Error editing payment:', error);
      showError(t('payments.actions.editError'));
      return null;
    }
  };

  const removePayment = async (id: string): Promise<boolean> => {
    try {
      const result = await deletePayment(id);
      if (result) {
        showSuccess(t('payments.actions.deleteSuccess'));
        return true;
      } else {
        showError(t('payments.actions.deleteError'));
        return false;
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      showError(t('payments.actions.deleteError'));
      return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('payments.title')}</h2>
          <p className="text-gray-300">{t('payments.subtitle')}</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          {filteredPayments.length} {t('payments.totalPayments')}
        </Badge>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-white">{t('payments.search.filters')}</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300 h-4 w-4" />
              <Input
                placeholder={t('payments.search.placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: t('payments.filters.allStatuses') },
                { value: 'completed', label: t('payments.filters.status.completed') },
                { value: 'pending', label: t('payments.filters.status.pending') },
                { value: 'failed', label: t('payments.filters.status.failed') },
                { value: 'refunded', label: t('payments.filters.status.refunded') }
              ]}
            />
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: 'all', label: t('payments.filters.allTypes') },
                { value: 'monthly', label: t('payments.filters.type.monthly') },
                { value: 'drop-in', label: t('payments.filters.type.dropIn') },
                { value: 'private', label: t('payments.filters.type.private') },
                { value: 'equipment', label: t('payments.filters.type.equipment') },
                { value: 'other', label: t('payments.filters.type.other') }
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Add Payment Form */}
      <PaymentForm
        students={students}
        studentsLoading={studentsLoading}
        onSubmit={addPayment}
      />

      {/* Payments List */}
      <PaymentList
        payments={filteredPayments}
        studentsById={studentsById}
        onEdit={editPayment}
        onDelete={removePayment}
        isUpdating={isUpdating}
        isDeleting={isDeleting}
      />
    </div>
  );
}