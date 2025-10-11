import { Clock, Calendar, Users, DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Custom hook for configuring quick actions
 */
export const useQuickActions = () => {
  const { t } = useTranslation();

  const quickActions = [
    {
      title: t('dashboard.quickActions.markAttendance'),
      icon: Clock,
      color: 'btn-primary',
      subtitle: t('dashboard.quickActions.checkInOut'),
      path: '/attendance'
    },
    {
      title: t('dashboard.quickActions.scheduleClass'),
      icon: Calendar,
      color: 'btn-secondary',
      subtitle: t('dashboard.quickActions.addNewSession'),
      path: '/classes'
    },
    {
      title: t('dashboard.quickActions.addStudent'),
      icon: Users,
      color: 'btn-accent',
      subtitle: t('dashboard.quickActions.registerMember'),
      path: '/students'
    },
    {
      title: t('dashboard.quickActions.recordPayment'),
      icon: DollarSign,
      color: 'btn-info',
      subtitle: t('dashboard.quickActions.processTransaction'),
      path: '/payments'
    },
  ];

  return quickActions;
};