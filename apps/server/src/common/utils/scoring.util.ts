import { LearningGoal, TutorType, TutorTypePref, VerificationStatus } from '@tutorpair/shared';
import { BadRequestError } from '../errors/http-errors.js';

/**
 * Stage 1 — hard filters (PROJECT_CONTEXT §3.3). Pure strict-boolean gate, no I/O.
 * The Online/Onsite mode gate is intentionally absent: the schema has no mode column and
 * API_SPEC states all sessions are online by default.
 */

// Docs only say "at least 1 overlapping slot"; 60 min keeps every survivor able to book one lesson.
export const MIN_OVERLAP_MINUTES = 60;

export interface TimeSlot {
  day_of_week: string;
  start_time: string; // 'HH:mm' (input) or 'HH:MM:SS' (Postgres time)
  end_time: string;
}

export interface HardFilterTutor {
  verification_status: string;
  /** The variant this candidate row teaches (tutor_subjects.variant_id). */
  variant_id: string;
  grade_levels: string[] | null;
  availabilities: TimeSlot[];
}

export interface HardFilterStudent {
  grade_level: string;
  availabilities: TimeSlot[];
}

export interface HardFilterVariant {
  id: string;
  learning_goal: string;
}

function toSeconds(time: string): number {
  const [h, m, s] = time.split(':').map(Number);
  return h * 3600 + m * 60 + (s ?? 0);
}

/** True when any student/tutor slot pair shares a day and overlaps by >= MIN_OVERLAP_MINUTES. */
export function hasAvailabilityOverlap(studentSlots: TimeSlot[], tutorSlots: TimeSlot[]): boolean {
  const minSeconds = MIN_OVERLAP_MINUTES * 60;
  return studentSlots.some((a) =>
    tutorSlots.some(
      (b) =>
        a.day_of_week === b.day_of_week &&
        Math.min(toSeconds(a.end_time), toSeconds(b.end_time)) -
          Math.max(toSeconds(a.start_time), toSeconds(b.start_time)) >=
          minSeconds
    )
  );
}

/** A tutor survives only if ALL gates hold: approved, teaches the variant, grade (curriculum only), availability. */
export function passesHardFilters(
  tutor: HardFilterTutor,
  student: HardFilterStudent,
  variant: HardFilterVariant
): boolean {
  if (tutor.verification_status !== VerificationStatus.APPROVED) return false;
  if (tutor.variant_id !== variant.id) return false;
  if (
    variant.learning_goal === LearningGoal.SCHOOL_CURRICULUM &&
    !tutor.grade_levels?.includes(student.grade_level)
  ) {
    return false;
  }
  return hasAvailabilityOverlap(student.availabilities, tutor.availabilities);
}

/**
 * Stage 2 — weighted compatibility score (PROJECT_CONTEXT §3.2-3.3). Pure and deterministic:
 * same input, same output; no clock, randomness or locale involved.
 *
 * score = 100 * (0.45 * style + 0.35 * personality + 0.20 * budget) - tutor-type mismatch penalty
 * Style/personality use Manhattan distance, normalised by the maximum possible distance.
 * Gender preference is not scored: the schema has no gender column.
 */

const STYLE_SLIDER_COUNT = 5;
const PERSONALITY_SLIDER_COUNT = 4;
const MAX_SLIDER_DIFF = 4; // |5 - 1|

const STYLE_WEIGHT = 0.45;
const PERSONALITY_WEIGHT = 0.35;
const BUDGET_WEIGHT = 0.2;

// Docs do not define the magnitude. Applied only when the student asked for a specific
// tutor type and the tutor is a different one; ANY and an exact match are never penalized.
export const TUTOR_TYPE_MISMATCH_PENALTY = 10;

function assertSliders(values: number[], expectedLength: number, label: string): void {
  if (
    !Array.isArray(values) ||
    values.length !== expectedLength ||
    !values.every((v) => Number.isInteger(v) && v >= 1 && v <= 5)
  ) {
    throw new BadRequestError(
      `${label} must contain exactly ${expectedLength} integer ratings between 1 and 5`
    );
  }
}

function similarity(student: number[], tutor: number[]): number {
  const diff = student.reduce((sum, v, i) => sum + Math.abs(v - tutor[i]), 0);
  return 1 - diff / (student.length * MAX_SLIDER_DIFF);
}

export function calculateCompatibilityScore({
  studentStyle,
  tutorStyle,
  studentPersonality,
  tutorPersonality,
  studentBudget,
  tutorRate,
  tutorTypePref,
  tutorType,
}: {
  studentStyle: number[];
  tutorStyle: number[];
  studentPersonality: number[];
  tutorPersonality: number[];
  studentBudget: number;
  tutorRate: number;
  tutorTypePref: TutorTypePref;
  tutorType: TutorType;
}): number {
  assertSliders(studentStyle, STYLE_SLIDER_COUNT, 'Student style profile');
  assertSliders(tutorStyle, STYLE_SLIDER_COUNT, 'Tutor style profile');
  assertSliders(studentPersonality, PERSONALITY_SLIDER_COUNT, 'Student personality profile');
  assertSliders(tutorPersonality, PERSONALITY_SLIDER_COUNT, 'Tutor personality profile');

  const styleScore = similarity(studentStyle, tutorStyle);
  const personalityScore = similarity(studentPersonality, tutorPersonality);

  // Over budget -> 0. Within budget -> 0.5 at the budget line up to 1.0 for a free tutor.
  let budgetScore = 1.0;
  if (tutorRate > studentBudget) {
    budgetScore = 0.0;
  } else if (studentBudget > 0) {
    budgetScore = 0.5 + 0.5 * (1 - tutorRate / studentBudget);
  }

  const base =
    (styleScore * STYLE_WEIGHT +
      personalityScore * PERSONALITY_WEIGHT +
      budgetScore * BUDGET_WEIGHT) *
    100;

  const penalty =
    tutorTypePref !== TutorTypePref.ANY && (tutorTypePref as string) !== (tutorType as string)
      ? TUTOR_TYPE_MISMATCH_PENALTY
      : 0;

  const finalScore = Math.min(100, Math.max(0, base - penalty));
  return Math.round(finalScore * 100) / 100;
}
