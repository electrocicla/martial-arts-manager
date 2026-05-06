import { describe, it, expect } from 'vitest';
import {
  BASE_CLASSES_REQUIRED,
  BASE_SPARRING_REQUIRED,
  evaluateProgression,
  getBeltTierIndex,
  getNextBeltInLadder,
  getRequirementsForBelt,
  getRequirementsForTier,
} from '../lib/beltProgression';

describe('beltProgression', () => {
  describe('getBeltTierIndex', () => {
    it('returns 0 for the first belt in BJJ', () => {
      expect(getBeltTierIndex('White', 'Brazilian Jiu-Jitsu')).toBe(0);
    });

    it('is case-insensitive', () => {
      expect(getBeltTierIndex('blue', 'Brazilian Jiu-Jitsu')).toBe(1);
    });

    it('returns the index for higher tiers', () => {
      expect(getBeltTierIndex('Purple', 'Brazilian Jiu-Jitsu')).toBe(2);
      expect(getBeltTierIndex('Brown', 'Brazilian Jiu-Jitsu')).toBe(3);
      expect(getBeltTierIndex('Black', 'Brazilian Jiu-Jitsu')).toBe(4);
    });

    it('falls back to 0 for unknown belts', () => {
      expect(getBeltTierIndex('Magenta', 'Brazilian Jiu-Jitsu')).toBe(0);
    });

    it('falls back to the default ladder for unknown disciplines', () => {
      expect(getBeltTierIndex('Yellow', 'Made-Up-Art')).toBe(1);
    });
  });

  describe('getRequirementsForTier', () => {
    it('returns the base values for tier 0', () => {
      expect(getRequirementsForTier(0)).toEqual({
        classes: BASE_CLASSES_REQUIRED,
        sparrings: BASE_SPARRING_REQUIRED,
        tournaments: 1,
        tournamentsOptional: true,
      });
    });

    it('doubles requirements at every subsequent tier', () => {
      expect(getRequirementsForTier(1).classes).toBe(BASE_CLASSES_REQUIRED * 2);
      expect(getRequirementsForTier(2).classes).toBe(BASE_CLASSES_REQUIRED * 4);
      expect(getRequirementsForTier(3).sparrings).toBe(BASE_SPARRING_REQUIRED * 8);
    });

    it('treats negative tiers as tier 0', () => {
      expect(getRequirementsForTier(-3)).toEqual(getRequirementsForTier(0));
    });
  });

  describe('getRequirementsForBelt', () => {
    it('matches the tier-based requirements', () => {
      expect(getRequirementsForBelt('Blue', 'Brazilian Jiu-Jitsu')).toEqual(
        getRequirementsForTier(1)
      );
    });
  });

  describe('getNextBeltInLadder', () => {
    it('returns the next belt for non-final tiers', () => {
      expect(getNextBeltInLadder('White', 'Brazilian Jiu-Jitsu')).toBe('Blue');
    });

    it('returns null when there is no further rank in the ladder', () => {
      expect(getNextBeltInLadder('Black/Red', 'Brazilian Jiu-Jitsu')).toBeNull();
    });
  });

  describe('evaluateProgression', () => {
    const baseInput = {
      currentBelt: 'White',
      discipline: 'Brazilian Jiu-Jitsu',
      classesAttended: 0,
      sparringSessions: 0,
      tournamentsAttended: 0,
    } as const;

    it('reports on-track when student is just starting', () => {
      const result = evaluateProgression(baseInput);
      expect(result.status).toBe('on-track');
      expect(result.readyForExam).toBe(false);
      expect(result.percent.overall).toBe(0);
      expect(result.remaining.classes).toBe(BASE_CLASSES_REQUIRED);
      expect(result.remaining.sparrings).toBe(BASE_SPARRING_REQUIRED);
    });

    it('flags ready-for-exam when both required counts are reached', () => {
      const result = evaluateProgression({
        ...baseInput,
        classesAttended: 100,
        sparringSessions: 50,
      });
      expect(result.readyForExam).toBe(true);
      expect(result.status).toBe('ready-for-exam');
      expect(result.remaining.classes).toBe(0);
      expect(result.remaining.sparrings).toBe(0);
    });

    it('does not flag ready when only one requirement is met', () => {
      const result = evaluateProgression({
        ...baseInput,
        classesAttended: 250,
        sparringSessions: 10,
      });
      expect(result.readyForExam).toBe(false);
    });

    it('returns "almost-there" when overall progress is >= 80%', () => {
      const result = evaluateProgression({
        ...baseInput,
        classesAttended: 90,
        sparringSessions: 30,
      });
      expect(result.status).toBe('almost-there');
    });

    it('uses the doubled requirements for higher belts', () => {
      const result = evaluateProgression({
        ...baseInput,
        currentBelt: 'Blue',
        classesAttended: 200,
        sparringSessions: 100,
      });
      expect(result.requirements.classes).toBe(200);
      expect(result.requirements.sparrings).toBe(100);
      expect(result.readyForExam).toBe(true);
    });

    it('returns "final-belt" status when no next belt exists', () => {
      const result = evaluateProgression({
        ...baseInput,
        currentBelt: 'Black/Red',
        classesAttended: 9999,
        sparringSessions: 9999,
      });
      expect(result.status).toBe('final-belt');
      expect(result.nextBelt).toBeNull();
      expect(result.readyForExam).toBe(false);
    });

    it('clamps percent to 100', () => {
      const result = evaluateProgression({
        ...baseInput,
        classesAttended: 1000,
        sparringSessions: 1000,
      });
      expect(result.percent.classes).toBe(100);
      expect(result.percent.sparrings).toBe(100);
      expect(result.percent.overall).toBe(100);
    });
  });
});
