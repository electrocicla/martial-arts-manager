import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { useToast } from '../hooks/useToast';
import { useDebounce } from '../hooks/useDebounce';
import { paymentSchema } from '../lib/validation';
import { useApp } from '../context/AppContext';
import { Search, Plus, DollarSign, Calendar, User } from 'lucide-react';

export default function PaymentManager() {
  const { payments, setPayments, students } = useApp();
  const { toast } = useToast();

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      studentId: '',
      amount: 0,
      type: 'monthly' as const,
      notes: '',
      date: new Date().toISOString().split('T')[0],
      status: 'completed' as const
    }
  });

  useEffect(() => {
    fetch('/api/payments')
      .then(r => r.json())
      .then(data => setPayments(data))
      .catch(console.error);
  }, [setPayments]);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const student = students.find(s => s.id === payment.studentId);
      const matchesSearch = !debouncedSearchTerm ||
        student?.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        payment.type.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        payment.notes?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
      const matchesType = typeFilter === 'all' || payment.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [payments, students, debouncedSearchTerm, statusFilter, typeFilter]);

  const addPayment = async (data: any) => {
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Failed to add payment');

      const newPayment = await response.json();
      setPayments([...payments, newPayment]);
      reset();
      toast.success('Payment added successfully', {
        description: 'The payment has been recorded in the system.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add payment',
        type: 'error'
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'danger';
      case 'refunded': return 'secondary';
      default: return 'default';
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'monthly': return 'default';
      case 'drop-in': return 'secondary';
      case 'private': return 'primary';
      case 'equipment': return 'info';
      case 'other': return 'default';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Management</h2>
          <p className="text-gray-600">Track and manage student payments</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Search & Filters</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by student name, type, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'completed', label: 'Completed' },
                { value: 'pending', label: 'Pending' },
                { value: 'failed', label: 'Failed' },
                { value: 'refunded', label: 'Refunded' }
              ]}
            />
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'drop-in', label: 'Drop-in' },
                { value: 'private', label: 'Private' },
                { value: 'equipment', label: 'Equipment' },
                { value: 'other', label: 'Other' }
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Add Payment Form */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Payment
          </h3>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(addPayment)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student
                </label>
                <Select
                  {...register('studentId')}
                  options={[
                    { value: '', label: 'Select a student' },
                    ...students.map(student => ({ value: student.id, label: student.name }))
                  ]}
                />
                {errors.studentId && (
                  <p className="text-sm text-red-600 mt-1">{errors.studentId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount ($)
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
                  Payment Type
                </label>
                <Select
                  {...register('type')}
                  options={[
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'drop-in', label: 'Drop-in' },
                    { value: 'private', label: 'Private' },
                    { value: 'equipment', label: 'Equipment' },
                    { value: 'other', label: 'Other' }
                  ]}
                />
                {errors.type && (
                  <p className="text-sm text-red-600 mt-1">{errors.type.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Date
                </label>
                <Input
                  type="date"
                  {...register('date')}
                />
                {errors.date && (
                  <p className="text-sm text-red-600 mt-1">{errors.date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <Select
                  {...register('status')}
                  options={[
                    { value: 'completed', label: 'Completed' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'failed', label: 'Failed' },
                    { value: 'refunded', label: 'Refunded' }
                  ]}
                />
                {errors.status && (
                  <p className="text-sm text-red-600 mt-1">{errors.status.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <Input
                  {...register('notes')}
                  placeholder="Additional notes about the payment"
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
              {isSubmitting ? 'Adding...' : 'Add Payment'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Payments List */}
      <div className="space-y-4">
        {filteredPayments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No payments found matching your criteria</p>
            </CardContent>
          </Card>
        ) : (
          filteredPayments.map(payment => {
            const student = students.find(s => s.id === payment.studentId);
            return (
              <Card key={payment.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="h-5 w-5 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {student?.name || 'Unknown Student'}
                        </span>
                        <Badge variant={getTypeBadgeVariant(payment.type)}>
                          {payment.type}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(payment.status || 'completed')}>
                          {payment.status || 'completed'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-semibold text-lg text-gray-900">
                            ${payment.amount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(payment.date).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {payment.notes && (
                        <p className="text-sm text-gray-600 mt-2">{payment.notes}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}