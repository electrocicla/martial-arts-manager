import { useMemo } from 'react';
import { generateRecentActivity } from '../lib/dashboardUtils';
import type { Payment, Class } from '../types';

/**
 * Custom hook for generating recent activity from payments and classes
 */
export const useRecentActivity = (recentPayments: Payment[], todayClasses: Class[]) => {
  const recentActivity = useMemo(() =>
    generateRecentActivity(recentPayments, todayClasses),
    [recentPayments, todayClasses]
  );

  return recentActivity;
};