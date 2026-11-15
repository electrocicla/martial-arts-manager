import { describe, expect, it } from 'vitest';
import { avatarObjectOwnedByStudent, buildAvatarStudentAccessQuery } from './avatar';

describe('shared R2 deletion ownership', () => {
  const student = 'student-1';
  const organization = 'manzur';
  const branch = 'branch-1';

  it('accepts exact new and legacy metadata for the owning student', () => {
    expect(avatarObjectOwnedByStudent({ studentId: student, organizationId: organization, branchId: branch },
      student, organization, branch)).toBe(true);
    expect(avatarObjectOwnedByStudent({ studentId: student }, student, organization, branch)).toBe(true);
  });

  it('never deletes an object with foreign tenant, branch or student metadata', () => {
    for (const metadata of [
      undefined,
      {},
      { studentId: 'other-student' },
      { studentId: student, organizationId: 'hamarr', branchId: branch },
      { studentId: student, organizationId: organization, branchId: 'other-branch' },
    ]) {
      expect(avatarObjectOwnedByStudent(metadata, student, organization, branch)).toBe(false);
    }
  });
});

describe('student avatar access query', () => {
  it('allows admins to access any student in the active branch', () => {
    const access = buildAvatarStudentAccessQuery('student-1', 'branch-1', {
      id: 'admin-1',
      role: 'admin',
      organization_id: 'manzur',
    });

    expect(access.query).toContain('branch_id = ?');
    expect(access.query).not.toContain('created_by = ?');
    expect(access.params).toEqual(['student-1', 'branch-1', 'manzur']);
  });

  it('restricts instructors to students they created, are assigned to, or that are unassigned in the active branch', () => {
    const access = buildAvatarStudentAccessQuery('student-1', 'branch-1', {
      id: 'coach-1',
      role: 'instructor',
      organization_id: 'manzur',
    });

    expect(access.query).toContain('(created_by = ? OR instructor_id = ? OR instructor_id IS NULL)');
    expect(access.params).toEqual(['student-1', 'branch-1', 'manzur', 'coach-1', 'coach-1']);
  });

  it('restricts students to their own linked profile in the active branch', () => {
    const access = buildAvatarStudentAccessQuery('student-1', 'branch-1', {
      id: 'user-1',
      role: 'student',
      organization_id: 'manzur',
      student_id: 'student-1',
    });

    expect(access.query).toContain('AND id = ?');
    expect(access.params).toEqual(['student-1', 'branch-1', 'manzur', 'student-1']);
  });
});
