import { useMemo } from 'react';
import type { Class } from '../types/index';
import { calculateClassStats } from '../lib/classUtils';
import { useTranslation } from 'react-i18next';

/**
 * Custom hook for calculating class statistics
 */
export const useClassStats = (classes: Class[]) => {
  const { t } = useTranslation();
  const stats = useMemo(() => calculateClassStats(classes), [classes]);

  return stats.map(stat => ({
    ...stat,
    label: t(`classes.stats.${stat.labelKey}`)
  }));
};