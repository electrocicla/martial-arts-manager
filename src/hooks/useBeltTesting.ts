import { useMemo } from 'react';
import { useStudents } from './useStudents';
import { useAttendance } from './useAttendance';
import { useClasses } from './useClasses';
import {
  calculateUpcomingTests,
  calculateEligibleStudents,
  type UpcomingTest,
  type EligibleStudent
} from '../lib/beltTestingUtils';

export function useUpcomingTests(): UpcomingTest[] {
  const { students } = useStudents();
  const { classes } = useClasses();

  return useMemo(() => {
    return calculateUpcomingTests(students, classes);
  }, [students, classes]);
}

export function useEligibleStudents(): EligibleStudent[] {
  const { students } = useStudents();
  const { attendance } = useAttendance();

  return useMemo(() => {
    return calculateEligibleStudents(students, attendance);
  }, [students, attendance]);
}