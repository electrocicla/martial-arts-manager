import { describe, expect, it } from 'vitest';
import { buildAvatarStudentAccessQuery } from './avatar';

describe('student avatar access query', () => {
  it('allows admins to access any student in the active branch', () => {
    const access = buildAvatarStudentAccessQuery('student-1', 'branch-1', {
      id: 'admin-1',
      role: 'admin',
    });

    expect(access.query).toContain('branch_id = ?');
    expect(access.query).not.toContain('created_by = ?');
    expect(access.params).toEqual(['student-1', 'branch-1']);
  });

  it('restricts instructors to students they created, are assigned to, or that are unassigned in the active branch', () => {
    const access = buildAvatarStudentAccessQuery('student-1', 'branch-1', {
      id: 'coach-1',
      role: 'instructor',
    });

    expect(access.query).toContain('(created_by = ? OR instructor_id = ? OR instructor_id IS NULL)');
    expect(access.params).toEqual(['student-1', 'branch-1', 'coach-1', 'coach-1']);
  });

  it('restricts students to their own linked profile in the active branch', () => {
    const access = buildAvatarStudentAccessQuery('student-1', 'branch-1', {
      id: 'user-1',
      role: 'student',
      student_id: 'student-1',
    });

    expect(access.query).toContain('AND id = ?');
    expect(access.params).toEqual(['student-1', 'branch-1', 'student-1']);
  });
});
