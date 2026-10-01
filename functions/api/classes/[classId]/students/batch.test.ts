import { describe, expect, it } from 'vitest';
import { selectStudentIdsForEnrollment } from './batch';

const createIds = (count: number): string[] =>
  Array.from({ length: count }, (_, index) => `student-${index + 1}`);

describe('selectStudentIdsForEnrollment', () => {
  it('does not impose an arbitrary 100-student batch limit', () => {
    const requested = createIds(132);
    const eligible = new Set(requested);

    expect(
      selectStudentIdsForEnrollment(requested, eligible, new Set(), 135),
    ).toEqual(requested);
  });

  it('respects the real class capacity when fewer slots remain', () => {
    const requested = createIds(132);
    const eligible = new Set(requested);

    expect(
      selectStudentIdsForEnrollment(requested, eligible, new Set(), 25),
    ).toEqual(requested.slice(0, 25));
  });

  it('enrolls nobody when capacity is zero or negative', () => {
    const requested = createIds(3);
    const eligible = new Set(requested);

    expect(selectStudentIdsForEnrollment(requested, eligible, new Set(), 0)).toEqual([]);
    expect(selectStudentIdsForEnrollment(requested, eligible, new Set(), -4)).toEqual([]);
  });

  it('deduplicates requests and skips ineligible or already enrolled students', () => {
    const requested = ['student-1', 'student-1', 'student-2', 'student-3', 'student-4'];
    const eligible = new Set(['student-1', 'student-2', 'student-3']);
    const alreadyEnrolled = new Set(['student-2']);

    expect(
      selectStudentIdsForEnrollment(requested, eligible, alreadyEnrolled, 10),
    ).toEqual(['student-1', 'student-3']);
  });
});
