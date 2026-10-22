import React from 'react';
import { SliderInput } from '../../../components/forms/SliderInput';
import { Compass, Smile } from 'lucide-react';

interface TutorSlidersProps {
  styleProfile: number[];
  personalityProfile: number[];
  onStyleChange: (index: number, val: number) => void;
  onPersonalityChange: (index: number, val: number) => void;
  errors?: {
    style_profile?: string;
    personality_profile?: string;
  };
}

export const TEACHING_STYLE_QUESTIONS = [
  {
    title: 'Teaching Pace & Structure',
    left: 'Step-by-step carefully',
    right: 'Focus on key points & move fast',
  },
  {
    title: 'Pedagogical Focus',
    left: 'Doing a lot of practice exercises',
    right: 'Understanding the concept first',
  },
  {
    title: 'Interaction Format',
    left: 'Chat & active discussion',
    right: 'Quiet & focused listening',
  },
  {
    title: 'Guidance Approach',
    left: 'Guide step-by-step directly',
    right: 'Encourage independent exploration',
  },
  {
    title: 'Lesson Atmosphere',
    left: 'Fun and relaxed atmosphere',
    right: 'Calm and highly focused',
  },
];

export const PERSONALITY_QUESTIONS = [
  {
    title: 'Communication Style',
    left: 'Formal & polite',
    right: 'Casual & friendly',
  },
  {
    title: 'Session Management',
    left: 'Strictly on schedule',
    right: 'Flexible & adaptable',
  },
  {
    title: 'Energy Level',
    left: 'Calm, gentle & composed',
    right: 'Energetic & expressive',
  },
  {
    title: 'Motivation Strategy',
    left: 'Discipline & challenge',
    right: 'Encouragement & praise',
  },
];

export const TutorSliders: React.FC<TutorSlidersProps> = ({
  styleProfile,
  personalityProfile,
  onStyleChange,
  onPersonalityChange,
  errors,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* 5 Teaching Style Sliders */}
      <div
        style={{
          backgroundColor: 'var(--color-primary-tint)',
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <span
            style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-white)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Compass size={20} strokeWidth={2.4} />
          </span>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-main)' }}>
              Teaching Style Profile (5 Dimensions)
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#4b5563', fontWeight: 500 }}>
              Defines your pedagogical style to match with students’ learning preferences on a 1–5 scale.
            </p>
          </div>
        </div>

        {TEACHING_STYLE_QUESTIONS.map((q, idx) => (
          <SliderInput
            key={`style-${idx}`}
            label={`${idx + 1}. ${q.title}`}
            leftLabel={q.left}
            rightLabel={q.right}
            value={styleProfile[idx] || 3}
            onChange={(val) => onStyleChange(idx, val)}
          />
        ))}

        {errors?.style_profile && (
          <p style={{ color: 'var(--color-danger)', fontSize: '0.875rem', fontWeight: 700, marginTop: '0.5rem' }}>
            {errors.style_profile}
          </p>
        )}
      </div>

      {/* 4 Personality Sliders */}
      <div
        style={{
          backgroundColor: 'var(--color-secondary-tint)',
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <span
            style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-secondary)',
              color: 'var(--color-white)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Smile size={20} strokeWidth={2.4} />
          </span>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-main)' }}>
              Tutor Personality Traits (4 Dimensions)
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#4b5563', fontWeight: 500 }}>
              Identifies your interpersonal traits for chemistry matching with student personality profiles.
            </p>
          </div>
        </div>

        {PERSONALITY_QUESTIONS.map((q, idx) => (
          <SliderInput
            key={`pers-${idx}`}
            label={`${idx + 1}. ${q.title}`}
            leftLabel={q.left}
            rightLabel={q.right}
            value={personalityProfile[idx] || 3}
            onChange={(val) => onPersonalityChange(idx, val)}
          />
        ))}

        {errors?.personality_profile && (
          <p style={{ color: 'var(--color-danger)', fontSize: '0.875rem', fontWeight: 700, marginTop: '0.5rem' }}>
            {errors.personality_profile}
          </p>
        )}
      </div>
    </div>
  );
};
