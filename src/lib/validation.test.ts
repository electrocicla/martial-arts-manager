import { describe, expect, it } from 'vitest';
import { registerSchema, registerSchemaForOrganization } from './validation';

const student = {
  name: 'Student Example',
  email: 'student@example.org',
  password: 'Str0ngPass123!',
  confirmPassword: 'Str0ngPass123!',
  role: 'student' as const,
};

describe('per-academy public registration validation', () => {
  it('requires active instructor selection for HAMARR students', () => {
    const result = registerSchemaForOrganization('hamarr').safeParse(student);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(issue => issue.path.includes('instructorId'))).toBe(true);
    }
    expect(registerSchema.safeParse(student).success).toBe(false);
    expect(registerSchemaForOrganization('hamarr').safeParse({
      ...student, instructorId: 'diego',
    }).success).toBe(true);
  });

  it('accepts a Manzur pending student registration when no instructor exists yet', () => {
    expect(registerSchemaForOrganization('manzur').safeParse(student).success).toBe(true);
    expect(registerSchemaForOrganization('manzur').safeParse({
      ...student, instructorId: 'gaston',
    }).success).toBe(true);
  });

  it('still enforces password confirmation, identity and email for both academies', () => {
    for (const organizationId of ['hamarr', 'manzur'] as const) {
      const schema = registerSchemaForOrganization(organizationId);
      const result = schema.safeParse({
        ...student, name: 'A', email: 'invalid', confirmPassword: 'not-matching',
        instructorId: 'diego',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.map(issue => issue.path[0])).toEqual(
          expect.arrayContaining(['name', 'email', 'confirmPassword']),
        );
      }
    }
  });
});
