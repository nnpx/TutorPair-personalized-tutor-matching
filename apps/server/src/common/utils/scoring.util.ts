import { LearningGoal, VerificationStatus } from '@tutorpair/shared';

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
 * NOTE: This is an initial draft / baseline scoring formula.
 * It should be reviewed, tested, and fine-tuned by the matching system developer.
 */

/**
 * Calculates compatibility score between student preferences and tutor profile.
 * Both profiles have:
 * - style_profile: 5 sliders (1 to 5)
 * - personality_profile: 4 sliders (1 to 5)
 */
export function calculateCompatibilityScore({
  studentStyle,
  tutorStyle,
  studentPersonality,
  tutorPersonality,
  studentBudget,
  tutorRate,
}: {
  studentStyle: number[];
  tutorStyle: number[];
  studentPersonality: number[];
  tutorPersonality: number[];
  studentBudget: number;
  tutorRate: number;
}): number {
  // Max possible difference per question is |5 - 1| = 4

  // 1. Style similarity (weight: 45%)
  let styleDiff = 0;
  for (let i = 0; i < 5; i++) {
    styleDiff += Math.abs((studentStyle[i] ?? 3) - (tutorStyle[i] ?? 3));
  }
  const maxStyleDiff = 5 * 4; // 20
  const styleScore = Math.max(0, 1 - styleDiff / maxStyleDiff);

  // 2. Personality similarity (weight: 35%)
  let personalityDiff = 0;
  for (let i = 0; i < 4; i++) {
    personalityDiff += Math.abs((studentPersonality[i] ?? 3) - (tutorPersonality[i] ?? 3));
  }
  const maxPersonalityDiff = 4 * 4; // 16
  const personalityScore = Math.max(0, 1 - personalityDiff / maxPersonalityDiff);

  // 3. Budget favorability (weight: 20%)
  // If tutor is under budget, score is 1.0; if tutor is at budget, 0.8; etc.
  let budgetScore = 1.0;
  if (tutorRate > studentBudget) {
    budgetScore = 0.0;
  } else if (studentBudget > 0) {
    budgetScore = 0.5 + 0.5 * (1 - tutorRate / studentBudget);
  }

  const finalScore = (styleScore * 0.45 + personalityScore * 0.35 + budgetScore * 0.20) * 100;
  return Math.round(finalScore * 100) / 100;
}
