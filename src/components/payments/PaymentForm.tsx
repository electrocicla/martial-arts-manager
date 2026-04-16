import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Plus } from 'lucide-react';
import { paymentSchema } from '../../lib/validation';
import type { PaymentFormData, Student } from '../../types/index';

interface PaymentFormProps {
  students: Student[];
  studentsLoading: boolean;
  onSubmit: (data: PaymentFormData) => Promise<boolean | undefined>;
}

export default function PaymentForm({ students, studentsLoading, onSubmit }: PaymentFormProps) {
  const { t } = useTranslation();
  const [studentAutocompleteValue, setStudentAutocompleteValue] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting }
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      studentId: '',
      amount: 0,
      type: 'monthly' as const,
      notes: '',
      date: (() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      })(),
      status: 'completed' as const
    }
  });

  const autocompleteStudents = useMemo(() => {
    const normalizedSearch = studentAutocompleteValue.trim().toLowerCase();
    if (!normalizedSearch) return students;
    return students.filter((student: Student) =>
      student.name.toLowerCase().includes(normalizedSearch) ||
      student.email.toLowerCase().includes(normalizedSearch)
    );
  }, [students, studentAutocompleteValue]);

  const formatStudentAutocompleteOption = (student: Student) => `${student.name} (${student.email})`;

  const handleStudentAutocompleteChange = (value: string) => {
    setStudentAutocompleteValue(value);

    const normalizedValue = value.trim().toLowerCase();
    if (!normalizedValue) {
      setValue('studentId', '', { shouldDirty: true, shouldValidate: false });
      return;
    }

    const exactLabelMatch = students.find(
      (student: Student) => formatStudentAutocompleteOption(student).toLowerCase() === normalizedValue
    );
    const exactEmailMatch = students.find(
      (student: Student) => student.email.toLowerCase() === normalizedValue
    );
    const exactNameMatches = students.filter(
      (student: Student) => student.name.toLowerCase() === normalizedValue
    );

    const matchedStudent = exactLabelMatch
      ?? exactEmailMatch
      ?? (exactNameMatches.length === 1 ? exactNameMatches[0] : undefined);

    if (matchedStudent) {
      setValue('studentId', matchedStudent.id, { shouldDirty: true, shouldValidate: true });
      clearErrors('studentId');
      return;
    }

    setValue('studentId', '', { shouldDirty: true, shouldValidate: false });
  };

  const handleFormSubmit = async (data: PaymentFormData) => {
    const result = await onSubmit(data);
    if (result) {
      reset();
      setStudentAutocompleteValue('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Plus className="h-5 w-5" />
          {t('payments.form.title')}
        </h3>
      </CardHeader>
      <CardContent>
        {studentsLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <span className="loading loading-spinner loading-xs text-primary" />
            <span>{t('payments.labels.loadingStudents')}</span>
          </div>
        )}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('payments.form.student')}
              </label>
              <Input
                id="payment-student-autocomplete"
                type="text"
                list="payment-student-options"
                value={studentAutocompleteValue}
                onChange={(e) => handleStudentAutocompleteChange(e.target.value)}
                onBlur={(e) => handleStudentAutocompleteChange(e.target.value)}
                placeholder={t('payments.form.studentAutocompletePlaceholder')}
                autoComplete="off"
              />
              <datalist id="payment-student-options">
                {autocompleteStudents.map((student: Student) => (
                  <option key={student.id} value={formatStudentAutocompleteOption(student)} />
                ))}
              </datalist>
              <input type="hidden" {...register('studentId')} />
              <p className="text-xs text-gray-500 mt-1">{t('payments.form.studentAutocompleteHint')}</p>
              {errors.studentId && (
                <p className="text-sm text-red-600 mt-1">{errors.studentId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('payments.form.amount')}
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register('amount', { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="text-sm text-red-600 mt-1">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('payments.form.paymentType')}
              </label>
              <Select
                {...register('type')}
                options={[
                  { value: 'monthly', label: t('payments.filters.type.monthly') },
                  { value: 'drop-in', label: t('payments.filters.type.dropIn') },
                  { value: 'private', label: t('payments.filters.type.private') },
                  { value: 'equipment', label: t('payments.filters.type.equipment') },
                  { value: 'other', label: t('payments.filters.type.other') }
                ]}
              />
              {errors.type && (
                <p className="text-sm text-red-600 mt-1">{errors.type.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('payments.form.paymentDate')}
              </label>
              <Input type="date" {...register('date')} />
              {errors.date && (
                <p className="text-sm text-red-600 mt-1">{errors.date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('payments.form.status')}
              </label>
              <Select
                {...register('status')}
                options={[
                  { value: 'completed', label: t('payments.filters.status.completed') },
                  { value: 'pending', label: t('payments.filters.status.pending') },
                  { value: 'failed', label: t('payments.filters.status.failed') },
                  { value: 'refunded', label: t('payments.filters.status.refunded') }
                ]}
              />
              {errors.status && (
                <p className="text-sm text-red-600 mt-1">{errors.status.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('payments.form.notes')}
              </label>
              <Input
                {...register('notes')}
                placeholder={t('payments.form.notesPlaceholder')}
              />
              {errors.notes && (
                <p className="text-sm text-red-600 mt-1">{errors.notes.message}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full md:w-auto"
          >
            {isSubmitting ? t('payments.form.submitting') : t('payments.form.submit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
