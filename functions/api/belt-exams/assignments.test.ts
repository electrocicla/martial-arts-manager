import { describe, expect, it } from 'vitest';
import { hasExamCapacity } from './assignments';

describe('exam candidate capacity guard', () => {
  it('allows assignments only below the configured capacity', () => {
    expect(hasExamCapacity(140, 0)).toBe(true);
    expect(hasExamCapacity(140, 139)).toBe(true);
    expect(hasExamCapacity(140, 140)).toBe(false);
    expect(hasExamCapacity(140, 141)).toBe(false);
  });
  it('fails closed on invalid limits', () => {
    expect(hasExamCapacity(0, 0)).toBe(false);
    expect(hasExamCapacity(-1, 0)).toBe(false);
    expect(hasExamCapacity(Number.NaN, 0)).toBe(false);
  });
});
