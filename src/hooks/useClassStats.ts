import { useMemo } from 'react';
import type { Class } from '../types/index';
import { calculateClassStats } from '../lib/classUtils';

/**
 * Custom hook for calculating class statistics
 */
export const useClassStats = (classes: Class[]) => {
  const stats = useMemo(() => calculateClassStats(classes), [classes]);

  return stats;
};