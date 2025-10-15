import { useEffect, useState, useCallback } from 'react';
import { DollarSign, Calendar, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../lib/api-client';

interface Payment {
  id: string;
  student_id: string;
  amount: number;
  date: string;
  type: string;
  notes?: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  payment_method?: string;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
}

interface PaymentStats {
  total: number;
  completed: number;
  pending: number;
  totalAmount: number;
  completedAmount: number;
  pendingAmount: number;
  lastPaymentDate: string | null;
  nextPaymentDue: string | null;
}

export default function StudentPaymentHistory({ studentId }: { studentId: string }) {
  const { t } = useTranslation();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ payments: Payment[]; stats: PaymentStats }>(`/api/students/${studentId}/payments`);
      
      if (response.success && response.data) {
        setPayments(response.data.payments || []);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const filteredPayments = payments.filter(payment => {
    if (filter === 'all') return true;
    return payment.status === filter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'refunded':
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
      default:
        return <DollarSign className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-green-500/20 text-green-300 ring-green-500/50',
      pending: 'bg-yellow-500/20 text-yellow-300 ring-yellow-500/50',
      failed: 'bg-red-500/20 text-red-300 ring-red-500/50',
      refunded: 'bg-gray-500/20 text-gray-300 ring-gray-500/50',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold ring-1 ${styles[status as keyof typeof styles] || styles.completed}`}>
        {t(`payments.status.${status}`)}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Invested */}
          <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-xl p-4 border border-blue-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-2xl font-bold text-white">
                {formatCurrency(stats.totalAmount)}
              </span>
            </div>
            <div className="text-sm text-blue-300 font-medium">
              {t('payments.stats.totalInvested')}
            </div>
            <div className="text-xs text-blue-400 mt-1">
              {stats.total} {t('payments.stats.totalPayments')}
            </div>
          </div>

          {/* Completed Payments */}
          <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-xl p-4 border border-green-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-2xl font-bold text-white">
                {formatCurrency(stats.completedAmount)}
              </span>
            </div>
            <div className="text-sm text-green-300 font-medium">
              {t('payments.stats.completed')}
            </div>
            <div className="text-xs text-green-400 mt-1">
              {stats.completed} {t('payments.stats.payments')}
            </div>
          </div>

          {/* Pending Payments */}
          <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/30 rounded-xl p-4 border border-yellow-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <span className="text-2xl font-bold text-white">
                {formatCurrency(stats.pendingAmount)}
              </span>
            </div>
            <div className="text-sm text-yellow-300 font-medium">
              {t('payments.stats.pending')}
            </div>
            <div className="text-xs text-yellow-400 mt-1">
              {stats.pending} {t('payments.stats.payments')}
            </div>
          </div>

          {/* Last/Next Payment */}
          <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 rounded-xl p-4 border border-purple-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <div className="text-sm text-purple-300 font-medium">
              {stats.lastPaymentDate ? t('payments.stats.lastPayment') : t('payments.stats.nextPayment')}
            </div>
            <div className="text-xs text-purple-400 mt-1">
              {stats.lastPaymentDate 
                ? formatDate(stats.lastPaymentDate)
                : stats.nextPaymentDue 
                  ? formatDate(stats.nextPaymentDue)
                  : t('payments.stats.noPayments')}
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'all'
              ? 'bg-red-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          {t('payments.filters.all')} ({payments.length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'completed'
              ? 'bg-green-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          {t('payments.filters.completed')} ({payments.filter(p => p.status === 'completed').length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'pending'
              ? 'bg-yellow-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          {t('payments.filters.pending')} ({payments.filter(p => p.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('failed')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'failed'
              ? 'bg-red-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          {t('payments.filters.failed')} ({payments.filter(p => p.status === 'failed').length})
        </button>
      </div>

      {/* Payment List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 payment-scrollbar">
        {filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg font-medium">
              {t('payments.noPayments')}
            </p>
            <p className="text-gray-500 text-sm mt-2">
              {t('payments.noPaymentsDescription')}
            </p>
          </div>
        ) : (
          filteredPayments.map((payment) => (
            <div
              key={payment.id}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700 hover:border-red-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-red-500/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-gray-700/50 rounded-lg">
                    {getStatusIcon(payment.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-white font-semibold truncate">
                        {payment.type}
                      </h4>
                      {getStatusBadge(payment.status)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(payment.date)}
                      </span>
                      {payment.payment_method && (
                        <span className="text-gray-500">
                          • {payment.payment_method}
                        </span>
                      )}
                    </div>
                    
                    {payment.notes && (
                      <p className="text-sm text-gray-500 italic">
                        {payment.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className={`text-xl font-bold ${
                    payment.status === 'completed' ? 'text-green-400' :
                    payment.status === 'pending' ? 'text-yellow-400' :
                    payment.status === 'refunded' ? 'text-gray-400' :
                    'text-red-400'
                  }`}>
                    {formatCurrency(payment.amount)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
