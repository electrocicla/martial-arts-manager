import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { DollarSign, Calendar, User } from 'lucide-react';
import { parseLocalDate } from '../../lib/utils';
import type { Payment, Student } from '../../types/index';

interface PaymentListProps {
  payments: Payment[];
  studentsById: Map<string, Student>;
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

export default function PaymentList({ payments, studentsById }: PaymentListProps) {
  const { t } = useTranslation();
  const unknownStudentLabel = t('payments.labels.unknownStudent');

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

        return (
          <Card key={payment.id}>
            <CardContent className="p-6">
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
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
