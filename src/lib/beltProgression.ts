/**
 * Belt Progression System
 *
 * Pure, framework-agnostic logic that powers:
 *   - the revamped Belt Testing student view
 *   - the Sparring Tracker quick-add flow
 *   - the dashboard belt progression widgets
 *   - the backend endpoint that decides whether the student is "ready"
 *
 * Rules:
 *   - The first belt-up requires 100 classes attended + 50 sparring sessions
 *     and an OPTIONAL tournament participation in the current belt rank.
 *   - Every time the student ranks up, the requirements double:
 *       tier 0 (white) → 100 / 50 / 1 (optional)
 *       tier 1         → 200 / 100 / 2 (optional)
 *       tier 2         → 400 / 200 / 4 (optional)
 *       …
 *
 * The library is deliberately framework-free so it can be reused inside the
 * Cloudflare Worker (no React imports allowed).
 */

import { BELT_RANKINGS } from './constants';

export const BASE_CLASSES_REQUIRED = 100;
export const BASE_SPARRING_REQUIRED = 50;
export const BASE_TOURNAMENTS_OPTIONAL = 1;

export const DEFAULT_BELT_PROGRESSION: readonly string[] = [
  'White',
  'Yellow',
  'Orange',
  'Green',
  'Blue',
  'Purple',
  'Brown',
  'Black',
];

export interface ProgressionRequirements {
  classes: number;
  sparrings: number;
  tournaments: number;
  tournamentsOptional: true;
}

export interface ProgressionProgress {
  currentBelt: string;
  /** Optional override; if omitted, derived from the belt ladder. */
  nextBelt?: string | null;
  discipline: string;
  classesAttended: number;
  sparringSessions: number;
  tournamentsAttended: number;
}

export type ProgressionStatus =
  | 'on-track'
  | 'almost-there'
  | 'ready-for-exam'
  | 'final-belt';

export interface ProgressionEvaluation {
  tierIndex: number;
  currentBelt: string;
  nextBelt: string | null;
  requirements: ProgressionRequirements;
  attended: {
    classes: number;
    sparrings: number;
    tournaments: number;
  };
  remaining: {
    classes: number;
    sparrings: number;
    tournaments: number;
  };
  percent: {
    classes: number;
    sparrings: number;
    overall: number;
  };
  /** True when both required counts (classes + sparrings) are reached. */
  readyForExam: boolean;
  status: ProgressionStatus;
}

/**
 * Find the progression list for a discipline, falling back to a generic ladder.
 */
export function getProgressionLadder(discipline: string): readonly string[] {
  const fromConstants = BELT_RANKINGS[discipline as keyof typeof BELT_RANKINGS];
  if (Array.isArray(fromConstants) && fromConstants.length > 0) {
    return fromConstants;
  }
  return DEFAULT_BELT_PROGRESSION;
}

export function getBeltTierIndex(currentBelt: string, discipline: string): number {
  const ladder = getProgressionLadder(discipline);
  const idx = ladder.findIndex(
    (belt) => belt.toLowerCase() === currentBelt.trim().toLowerCase()
  );
  return idx === -1 ? 0 : idx;
}

export function getNextBeltInLadder(
  currentBelt: string,
  discipline: string
): string | null {
  const ladder = getProgressionLadder(discipline);
  const idx = getBeltTierIndex(currentBelt, discipline);
  if (idx >= ladder.length - 1) return null;
  return ladder[idx + 1];
}

/**
 * Returns the requirements to rank up FROM the given tier index.
 * Doubling rule: requirements * 2^tierIndex.
 */
export function getRequirementsForTier(tierIndex: number): ProgressionRequirements {
  const safeTier = Math.max(0, Math.floor(tierIndex));
  const multiplier = 2 ** safeTier;
  return {
    classes: BASE_CLASSES_REQUIRED * multiplier,
    sparrings: BASE_SPARRING_REQUIRED * multiplier,
    tournaments: BASE_TOURNAMENTS_OPTIONAL * multiplier,
    tournamentsOptional: true,
  };
}

export function getRequirementsForBelt(
  currentBelt: string,
  discipline: string
): ProgressionRequirements {
  return getRequirementsForTier(getBeltTierIndex(currentBelt, discipline));
}

function clampPercent(value: number): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

export function evaluateProgression(progress: ProgressionProgress): ProgressionEvaluation {
  const tierIndex = getBeltTierIndex(progress.currentBelt, progress.discipline);
  const nextBelt = getNextBeltInLadder(progress.currentBelt, progress.discipline);
  const requirements = getRequirementsForTier(tierIndex);

  const attended = {
    classes: Math.max(0, Math.floor(progress.classesAttended)),
    sparrings: Math.max(0, Math.floor(progress.sparringSessions)),
    tournaments: Math.max(0, Math.floor(progress.tournamentsAttended)),
  };

  const remaining = {
    classes: Math.max(0, requirements.classes - attended.classes),
    sparrings: Math.max(0, requirements.sparrings - attended.sparrings),
    tournaments: Math.max(0, requirements.tournaments - attended.tournaments),
  };

  const percent = {
    classes: clampPercent((attended.classes / requirements.classes) * 100),
    sparrings: clampPercent((attended.sparrings / requirements.sparrings) * 100),
    overall: clampPercent(
      ((attended.classes + attended.sparrings) /
        (requirements.classes + requirements.sparrings)) *
        100
    ),
  };

  const isFinalBelt = nextBelt === null;
  const readyForExam =
    !isFinalBelt &&
    attended.classes >= requirements.classes &&
    attended.sparrings >= requirements.sparrings;

  let status: ProgressionStatus;
  if (isFinalBelt) {
    status = 'final-belt';
  } else if (readyForExam) {
    status = 'ready-for-exam';
  } else if (percent.overall >= 80) {
    status = 'almost-there';
  } else {
    status = 'on-track';
  }

  return {
    tierIndex,
    currentBelt: progress.currentBelt,
    nextBelt,
    requirements,
    attended,
    remaining,
    percent,
    readyForExam,
    status,
  };
}
