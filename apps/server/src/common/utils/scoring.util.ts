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
