import { useMemo } from 'react';
import type { Student } from '../types/index';

/**
 * useStudentFilters Hook
 * Single Responsibility: Handle student filtering and searching logic
 * Follows SRP by focusing only on data filtering operations
 */
export const useStudentFilters = (
  students: Student[],
  searchQuery: string,
  filterBelt: string,
  filterStatus: string
) => {
  const filteredStudents = useMemo(() => {
    return students.filter((student: Student) => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           student.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBelt = filterBelt === 'all' || student.belt === filterBelt;
      const matchesStatus = filterStatus === 'all' ||
                           (filterStatus === 'active' && student.is_active) ||
                           (filterStatus === 'inactive' && !student.is_active);

      return matchesSearch && matchesBelt && matchesStatus;
    });
  }, [students, searchQuery, filterBelt, filterStatus]);

  return filteredStudents;
};