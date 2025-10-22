import { useMemo } from 'react';
import type { Class } from '../types/index';

/**
 * Custom hook for filtering and grouping classes
 */
export const useClassFilters = (classes: Class[], filterDiscipline: string, filterDay: string) => {
  const filteredClasses = useMemo(() => {
    return classes.filter((cls: Class) => {
      const matchesDiscipline = filterDiscipline === 'all' || cls.discipline === filterDiscipline;
      const classDay = new Date(cls.date).getDay();
      const matchesDay = filterDay === 'all' || parseInt(filterDay) === classDay;

      return matchesDiscipline && matchesDay;
    });
  }, [classes, filterDiscipline, filterDay]);

  const groupedByDay = useMemo(() => {
    const grouped: Record<string, typeof classes> = {};
    filteredClasses.forEach((cls) => {
      // Use ISO date (YYYY-MM-DD) as the grouping key to ensure stable parsing
      const day = cls.date;
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(cls);
    });
    return grouped;
  }, [filteredClasses]);

  return {
    filteredClasses,
    groupedByDay,
  };
};