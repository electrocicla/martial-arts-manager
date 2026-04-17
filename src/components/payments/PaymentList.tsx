import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { DollarSign, Calendar, User, Pencil, Trash2, X, Check } from 'lucide-react';
import { parseLocalDate } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import type { Payment, PaymentFormData, Student } from '../../types/index';

interface PaymentListProps {
  payments: Payment[];
  studentsById: Map<string, Student>;
  onEdit?: (id: string, data: Partial<PaymentFormData>) => Promise<Payment | null>;
  onDelete?: (id: string) => Promise<boolean>;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'completed': return 'success';
    case 'pending': return 'warning';
    case 'failed': return 'danger';
    case 'refunded': return 'secondary';
    default: return 'default';
  }
}

function getTypeBadgeVariant(type: string) {
  switch (type) {
    case 'monthly': return 'default';
    case 'drop-in': return 'secondary';
    case 'private': return 'primary';
    case 'equipment': return 'info';
    default: return 'default';
  }
}

export default function PaymentList({ payments, studentsById, onEdit, onDelete, isUpdating, isDeleting }: PaymentListProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const unknownStudentLabel = t('payments.labels.unknownStudent');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<PaymentFormData>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const startEdit = (payment: Payment) => {
    setEditingId(payment.id);
    setEditData({
      amount: payment.amount,
      date: payment.date,
      type: payment.type,
      status: payment.status,
      notes: payment.notes || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async () => {
    if (!editingId || !onEdit) return;
    const result = await onEdit(editingId, editData);
    if (result) {
      setEditingId(null);
      setEditData({});
    }
  };

  const confirmDelete = async (id: string) => {
    if (!onDelete) return;
    const result = await onDelete(id);
    if (result) {
      setDeletingId(null);
    }
  };

  if (payments.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">{t('payments.empty.title')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {payments.map((payment: Payment) => {
        const studentName = studentsById.get(payment.student_id)?.name ?? payment.student_name ?? unknownStudentLabel;
        const paymentAmount = typeof payment.amount === 'number' ? payment.amount : 0;
        const paymentStatus = payment.status || 'completed';
        const paymentType = payment.type || 'other';
        const isEditing = editingId === payment.id;
        const isConfirmingDelete = deletingId === payment.id;

        return (
          <Card key={payment.id}>
            <CardContent className="p-6">
              {isEditing ? (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">{t('payments.actions.editTitle')} — {studentName}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('payments.form.amount')}</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editData.amount ?? 0}
                        onChange={(e) => setEditData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('payments.form.paymentDate')}</label>
                      <Input
                        type="date"
                        value={editData.date ?? ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('payments.form.paymentType')}</label>
                      <Select
                        value={editData.type ?? ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, type: e.target.value }))}
                        options={[
                          { value: 'monthly', label: t('payments.filters.type.monthly') },
                          { value: 'drop-in', label: t('payments.filters.type.dropIn') },
                          { value: 'private', label: t('payments.filters.type.private') },
                          { value: 'equipment', label: t('payments.filters.type.equipment') },
                          { value: 'other', label: t('payments.filters.type.other') },
                        ]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('payments.form.status')}</label>
                      <Select
                        value={editData.status ?? ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                        options={[
                          { value: 'completed', label: t('payments.filters.status.completed') },
                          { value: 'pending', label: t('payments.filters.status.pending') },
                          { value: 'failed', label: t('payments.filters.status.failed') },
                          { value: 'refunded', label: t('payments.filters.status.refunded') },
                        ]}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('payments.form.notes')}</label>
                      <Input
                        value={editData.notes ?? ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder={t('payments.form.notesPlaceholder')}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={cancelEdit} disabled={isUpdating}>
                      <X className="h-4 w-4 mr-1" />
                      {t('payments.actions.cancel')}
                    </Button>
                    <Button onClick={saveEdit} disabled={isUpdating}>
                      <Check className="h-4 w-4 mr-1" />
                      {isUpdating ? t('payments.actions.saving') : t('payments.actions.save')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <User className="h-5 w-5 text-gray-400" />
                      <span className="font-medium text-gray-900">{studentName}</span>
                      <Badge variant={getTypeBadgeVariant(paymentType)}>
                        {t(`payments.type.${paymentType.replace('-', '')}`)}
                      </Badge>
                      <Badge variant={getStatusBadgeVariant(paymentStatus)}>
                        {t(`payments.status.${paymentStatus}`)}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-semibold text-lg text-gray-900">
                          ${paymentAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {payment.date ? parseLocalDate(payment.date).toLocaleDateString('es-ES') : 'Sin fecha'}
                        </span>
                      </div>
                    </div>

                    {payment.notes && (
                      <p className="text-sm text-gray-600 mt-2">{payment.notes}</p>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="flex gap-2 ml-4 shrink-0">
                      {isConfirmingDelete ? (
                        <div className="flex flex-col items-end gap-2">
                          <p className="text-sm text-red-600 font-medium">{t('payments.actions.confirmDelete')}</p>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setDeletingId(null)} disabled={isDeleting}>
                              {t('payments.actions.cancel')}
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => confirmDelete(payment.id)} disabled={isDeleting}>
                              {isDeleting ? t('payments.actions.deleting') : t('payments.actions.delete')}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Button variant="outline" size="sm" onClick={() => startEdit(payment)} title={t('payments.actions.edit')}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setDeletingId(payment.id)} title={t('payments.actions.delete')}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
