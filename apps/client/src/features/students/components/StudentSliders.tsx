import React from 'react';
import { SliderInput } from '../../../components/forms/SliderInput';
import { Compass, Smile } from 'lucide-react';

interface StudentSlidersProps {
  styleProfile: number[];
  personalityProfile: number[];
  onStyleChange: (index: number, val: number) => void;
  onPersonalityChange: (index: number, val: number) => void;
  errors?: {
    style_profile?: string;
    personality_profile?: string;
  };
}

export const LEARNING_STYLE_QUESTIONS = [
  {
    title: 'Learning Pace & Structure',
    prompt: 'I prefer learning...',
    left: 'Step-by-step carefully',
    right: 'Focus on key points & move fast',
  },
  {
    title: 'Learning Method',
    prompt: 'I prefer...',
    left: 'Doing a lot of practice exercises',
    right: 'Understanding the concept first',
  },
  {
    title: 'Class Interaction',
    prompt: 'During class I like to...',
    left: 'Chat & discuss with the tutor',
    right: 'Quiet sessions focused on listening',
  },
  {
    title: 'Guidance Approach',
    prompt: 'I like tutors who...',
    left: 'Guide me step-by-step',
    right: 'Let me explore independently',
  },
  {
    title: 'Lesson Atmosphere',
    prompt: 'I prefer...',
    left: 'A fun & relaxed atmosphere',
    right: 'Calm & highly focused',
  },
];

export const PERSONALITY_PREF_QUESTIONS = [
  {
    title: 'Communication Style',
    prompt: 'I prefer a tutor who is...',
    left: 'Formal & polite',
    right: 'Casual & friendly',
  },
  {
    title: 'Schedule Management',
    prompt: 'I want a tutor who is...',
    left: 'Strictly on schedule / Always on time',
    right: 'Flexible & adaptable to situation',
  },
  {
    title: 'Tutor Energy Level',
    prompt: 'I like tutors who are...',
    left: 'Calm, gentle & composed',
    right: 'Energetic & expressive',
  },
  {
    title: 'Motivation Strategy',
    prompt: 'I prefer tutors who...',
    left: 'Focus on discipline & challenge',
    right: 'Encourage & relaxed atmosphere',
  },
];

export const StudentSliders: React.FC<StudentSlidersProps> = ({
  styleProfile,
  personalityProfile,
  onStyleChange,
  onPersonalityChange,
  errors,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* 5 Learning Style Sliders */}
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
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Compass size={20} strokeWidth={2.4} />
          </span>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-main)', margin: 0 }}>
              Learning Style Preferences
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#4b5563', fontWeight: 500, margin: '0.25rem 0 0 0' }}>
              Used by our matching engine to calculate your learning & teaching style compatibility with verified tutors (1–5 scale).
            </p>
          </div>
        </div>

        {LEARNING_STYLE_QUESTIONS.map((q, idx) => (
          <SliderInput
            key={`student-style-${idx}`}
            label={`${idx + 1}. ${q.title} — ${q.prompt}`}
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

      {/* 4 Personality Preference Sliders */}
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
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Smile size={20} strokeWidth={2.4} />
          </span>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-main)', margin: 0 }}>
              Personality Fit Preferences
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#4b5563', fontWeight: 500, margin: '0.25rem 0 0 0' }}>
              Defines the tutor personality traits and environment you learn best with.
            </p>
          </div>
        </div>

        {PERSONALITY_PREF_QUESTIONS.map((q, idx) => (
          <SliderInput
            key={`student-personality-${idx}`}
            label={`${idx + 1}. ${q.title} — ${q.prompt}`}
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
