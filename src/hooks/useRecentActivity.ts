import { useMemo } from 'react';
import { generateRecentActivity } from '../lib/dashboardUtils';

/**
 * Custom hook for generating recent activity from payments and classes
 */
export const useRecentActivity = (recentPayments: any[], todayClasses: any[]) => {
  const recentActivity = useMemo(() =>
    generateRecentActivity(recentPayments, todayClasses),
    [recentPayments, todayClasses]
  );

  return recentActivity;
};