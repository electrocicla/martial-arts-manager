import { Clock, Calendar, Users, DollarSign } from 'lucide-react';

/**
 * Custom hook for configuring quick actions
 */
export const useQuickActions = () => {
  const quickActions = [
    {
      title: 'Mark Attendance',
      icon: Clock,
      color: 'btn-primary',
      subtitle: 'Check in/out students',
      path: '/attendance'
    },
    {
      title: 'Schedule Class',
      icon: Calendar,
      color: 'btn-secondary',
      subtitle: 'Add new session',
      path: '/classes'
    },
    {
      title: 'Add Student',
      icon: Users,
      color: 'btn-accent',
      subtitle: 'Register member',
      path: '/students'
    },
    {
      title: 'Record Payment',
      icon: DollarSign,
      color: 'btn-info',
      subtitle: 'Process transaction',
      path: '/payments'
    },
  ];

  return quickActions;
};