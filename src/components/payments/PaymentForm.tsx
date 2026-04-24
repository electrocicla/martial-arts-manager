import { useState, useMemo, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Plus, ChevronDown, X } from 'lucide-react';
import { paymentSchema } from '../../lib/validation';
import type { PaymentFormData, Student } from '../../types/index';

interface PaymentFormProps {
  students: Student[];
  studentsLoading: boolean;
  onSubmit: (data: PaymentFormData) => Promise<boolean | undefined>;
}

export default function PaymentForm({ students, studentsLoading, onSubmit }: PaymentFormProps) {
  const { t } = useTranslation();
  const [studentSearch, setStudentSearch] = useState('');
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const filteredStudents = useMemo(() => {
    const normalizedSearch = studentSearch.trim().toLowerCase();
    if (!normalizedSearch) return students;
    return students.filter((student: Student) =>
      student.name.toLowerCase().includes(normalizedSearch) ||
      student.email.toLowerCase().includes(normalizedSearch)
    );
  }, [students, studentSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsStudentDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setValue('studentId', student.id, { shouldDirty: true, shouldValidate: true });
    clearErrors('studentId');
    setStudentSearch('');
    setIsStudentDropdownOpen(false);
  };

  const handleClearStudent = () => {
    setSelectedStudent(null);
    setValue('studentId', '', { shouldDirty: true, shouldValidate: false });
    setStudentSearch('');
  };

  const handleFormSubmit = async (data: PaymentFormData) => {
    const result = await onSubmit(data);
    if (result) {
      reset();
      setSelectedStudent(null);
      setStudentSearch('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
          <Plus className="h-5 w-5 text-indigo-400" />
          {t('payments.form.title')}
        </h3>
      </CardHeader>
      <CardContent>
        {studentsLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-300 mb-4">
            <span className="loading loading-spinner loading-xs text-primary" />
            <span>{t('payments.labels.loadingStudents')}</span>
          </div>
        )}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-1.5">
                {t('payments.form.student')}
              </label>
              <div className="relative" ref={dropdownRef}>
                {selectedStudent ? (
                  <div className="flex items-center justify-between w-full px-4 py-2.5 border border-gray-600 rounded-lg bg-gray-800 text-white">
                    <div className="min-w-0">
                      <span className="block truncate font-medium text-white">{selectedStudent.name}</span>
                      <span className="block truncate text-xs text-gray-300">{selectedStudent.email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearStudent}
                      className="ml-2 p-1 rounded-full hover:bg-gray-700 shrink-0"
                      aria-label={t('common.clear', 'Clear')}
                    >
                      <X className="h-4 w-4 text-gray-300" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div
                      className="flex items-center w-full px-4 py-2.5 border border-gray-600 rounded-lg bg-gray-800 cursor-pointer hover:border-indigo-400 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/40 transition-colors"
                      onClick={() => setIsStudentDropdownOpen(!isStudentDropdownOpen)}
                    >
                      <input
                        type="text"
                        value={studentSearch}
                        onChange={(e) => {
                          setStudentSearch(e.target.value);
                          if (!isStudentDropdownOpen) setIsStudentDropdownOpen(true);
                        }}
                        onFocus={() => setIsStudentDropdownOpen(true)}
                        placeholder={t('payments.form.studentAutocompletePlaceholder')}
                        className="flex-1 bg-transparent outline-none text-white placeholder-gray-400 min-w-0"
                        autoComplete="off"
                      />
                      <ChevronDown className={`h-4 w-4 text-gray-300 shrink-0 ml-2 transition-transform ${isStudentDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {isStudentDropdownOpen && (
                      <div className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-xl shadow-black/40 max-h-60 overflow-y-auto">
                        {filteredStudents.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-300 text-center">
                            {studentsLoading ? t('payments.labels.loadingStudents') : t('payments.empty.title')}
                          </div>
                        ) : (
                          filteredStudents.map((student: Student) => (
                            <button
                              key={student.id}
                              type="button"
                              className="w-full text-left px-4 py-3 hover:bg-indigo-500/20 focus:bg-indigo-500/20 focus:outline-none border-b border-gray-700 last:border-b-0"
                              onClick={() => handleSelectStudent(student)}
                            >
                              <span className="block font-medium text-white truncate">{student.name}</span>
                              <span className="block text-xs text-gray-300 truncate">{student.email}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
                <input type="hidden" {...register('studentId')} />
              </div>
              {errors.studentId && (
                <p className="text-sm text-red-400 mt-1 font-medium">{errors.studentId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-1.5">
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
                <p className="text-sm text-red-400 mt-1 font-medium">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-1.5">
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
                <p className="text-sm text-red-400 mt-1 font-medium">{errors.type.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-1.5">
                {t('payments.form.paymentDate')}
              </label>
              <Input type="date" {...register('date')} />
              {errors.date && (
                <p className="text-sm text-red-400 mt-1 font-medium">{errors.date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-1.5">
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
                <p className="text-sm text-red-400 mt-1 font-medium">{errors.status.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-200 mb-1.5">
                {t('payments.form.notes')}
              </label>
              <Input
                {...register('notes')}
                placeholder={t('payments.form.notesPlaceholder')}
              />
              {errors.notes && (
                <p className="text-sm text-red-400 mt-1 font-medium">{errors.notes.message}</p>
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
