import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  TutorProfileSchema,
  type TutorProfileInput,
  TutorType,
  type TutorProfileDto,
} from '@tutorpair/shared';
import { useCreateTutorProfile, useUpdateTutorProfile } from '../hooks/useTutors';
import { TutorSliders } from './TutorSliders';
import { Card, Alert, SaveButton } from '../../../components/ui';
import { User, Lock } from 'lucide-react';

interface TutorProfileFormProps {
  initialData?: TutorProfileDto | null;
  mode: 'create' | 'edit';
  onSuccess?: () => void;
}

export const TutorProfileForm: React.FC<TutorProfileFormProps> = ({
  initialData,
  mode,
  onSuccess,
}) => {
  const createMutation = useCreateTutorProfile();
  const updateMutation = useUpdateTutorProfile();

  const [styleProfile, setStyleProfile] = useState<number[]>(
    initialData?.style_profile ?? [3, 3, 3, 3, 3]
  );
  const [personalityProfile, setPersonalityProfile] = useState<number[]>(
    initialData?.personality_profile ?? [3, 3, 3, 3]
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TutorProfileInput>({
    resolver: zodResolver(TutorProfileSchema),
    defaultValues: {
      first_name: initialData?.first_name ?? '',
      last_name: initialData?.last_name ?? '',
      phone_number: initialData?.phone_number ?? '',
      line_id: initialData?.line_id ?? '',
      description: initialData?.description ?? '',
      tutor_type: initialData?.tutor_type ?? TutorType.UNDERGRADUATE,
      style_profile: initialData?.style_profile ?? [3, 3, 3, 3, 3],
      personality_profile: initialData?.personality_profile ?? [3, 3, 3, 3],
    },
  });

  // Keep form values in sync when initialData loads
  useEffect(() => {
    if (initialData) {
      reset({
        first_name: initialData.first_name,
        last_name: initialData.last_name,
        phone_number: initialData.phone_number,
        line_id: initialData.line_id ?? '',
        description: initialData.description ?? '',
        tutor_type: initialData.tutor_type,
        style_profile: initialData.style_profile,
        personality_profile: initialData.personality_profile,
      });
      setStyleProfile(initialData.style_profile);
      setPersonalityProfile(initialData.personality_profile);
    }
  }, [initialData, reset]);

  const handleStyleChange = (index: number, val: number) => {
    const updated = [...styleProfile];
    updated[index] = val;
    setStyleProfile(updated);
    setValue('style_profile', updated);
  };

  const handlePersonalityChange = (index: number, val: number) => {
    const updated = [...personalityProfile];
    updated[index] = val;
    setPersonalityProfile(updated);
    setValue('personality_profile', updated);
  };

  const onSubmit = async (data: TutorProfileInput) => {
    setFormError(null);
    setSaveSuccess(false);

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(data);
        setSaveSuccess(true);
        if (onSuccess) onSuccess();
      } else {
        await updateMutation.mutateAsync({
          phone_number: data.phone_number,
          line_id: data.line_id || null,
          description: data.description,
          style_profile: data.style_profile,
          personality_profile: data.personality_profile,
        });
        setSaveSuccess(true);
        if (onSuccess) onSuccess();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save profile';
      setFormError(message);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* 1. Personal Information Card */}
      <Card style={{ backgroundColor: 'var(--bg-canvas)', border: '2px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <span
            style={{
              width: '2.75rem',
              height: '2.75rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-white)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <User size={22} strokeWidth={2.4} />
          </span>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--fg-main)' }}>
              {mode === 'create' ? 'Tutor Personal Details' : 'Tutor Profile'}
            </h2>
            <p style={{ fontSize: '0.9375rem', color: '#4b5563', fontWeight: 500 }}>
              {mode === 'create'
                ? 'Provide your verified identity, educational qualification tier, and contact info.'
                : 'Manage your public tutor bio, contact phone, and teaching style preferences.'}
            </p>
          </div>
        </div>

        {/* Profile Visibility Disclosure */}
        <div
          style={{
            marginBottom: '1.25rem',
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--color-secondary-tint)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            fontSize: '0.8125rem',
            color: 'var(--fg-main)',
            fontWeight: 600,
            lineHeight: 1.5,
          }}
        >
          💬 <strong>Profile Visibility:</strong> All information in this Tutor Profile form (including your name, tutor qualification type, bio, phone number, and LINE ID) will be shown to students so they can learn about your background and contact you if they match with you.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
          {/* First Name */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.375rem' }}>
              First Name *
              {mode === 'edit' && <Lock size={12} color="#6b7280" />}
            </label>
            {mode === 'edit' ? (
              <input
                type="text"
                value={initialData?.first_name ?? ''}
                disabled
                className="flat-input"
                style={{ backgroundColor: 'var(--color-muted)', cursor: 'not-allowed', color: '#6b7280', fontWeight: 600 }}
              />
            ) : (
              <input
                type="text"
                {...register('first_name')}
                placeholder="e.g. John"
                className="flat-input"
              />
            )}
            {errors.first_name && (
              <span style={{ color: 'var(--color-danger)', fontSize: '0.8125rem', fontWeight: 600 }}>
                {errors.first_name.message}
              </span>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.375rem' }}>
              Last Name *
              {mode === 'edit' && <Lock size={12} color="#6b7280" />}
            </label>
            {mode === 'edit' ? (
              <input
                type="text"
                value={initialData?.last_name ?? ''}
                disabled
                className="flat-input"
                style={{ backgroundColor: 'var(--color-muted)', cursor: 'not-allowed', color: '#6b7280', fontWeight: 600 }}
              />
            ) : (
              <input
                type="text"
                {...register('last_name')}
                placeholder="e.g. Smith"
                className="flat-input"
              />
            )}
            {errors.last_name && (
              <span style={{ color: 'var(--color-danger)', fontSize: '0.8125rem', fontWeight: 600 }}>
                {errors.last_name.message}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '0.75rem' }}>
          {/* Phone Number */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.375rem' }}>
              Phone Number *
            </label>
            <input
              type="tel"
              {...register('phone_number')}
              placeholder="e.g. +66 81 234 5678"
              className="flat-input"
            />
            {errors.phone_number && (
              <span style={{ color: 'var(--color-danger)', fontSize: '0.8125rem', fontWeight: 600 }}>
                {errors.phone_number.message}
              </span>
            )}
          </div>

          {/* LINE ID */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.375rem' }}>
              LINE ID <span style={{ fontWeight: 500, color: '#6b7280' }}>(Optional)</span>
            </label>
            <input
              type="text"
              {...register('line_id')}
              placeholder="e.g. @tutor_lineid"
              className="flat-input"
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          {/* Tutor Type */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.375rem' }}>
              Tutor Qualification Type *
              {mode === 'edit' && <Lock size={12} color="#6b7280" />}
            </label>
            {mode === 'edit' ? (
              <input
                type="text"
                value={
                  initialData?.tutor_type === TutorType.UNDERGRADUATE
                    ? 'Undergraduate Student'
                    : initialData?.tutor_type === TutorType.FREELANCE
                      ? 'Freelance / Professional Tutor'
                      : 'School / Institutional Teacher'
                }
                disabled
                className="flat-input"
                style={{ backgroundColor: 'var(--color-muted)', cursor: 'not-allowed', color: '#6b7280', fontWeight: 600 }}
              />
            ) : (
              <select
                {...register('tutor_type')}
                className="flat-input"
                style={{ fontWeight: 600 }}
              >
                <option value={TutorType.UNDERGRADUATE}>Undergraduate Student</option>
                <option value={TutorType.FREELANCE}>Freelance / Professional Tutor</option>
                <option value={TutorType.INSTITUTIONAL}>School / Institutional Teacher</option>
              </select>
            )}
            {errors.tutor_type && (
              <span style={{ color: 'var(--color-danger)', fontSize: '0.8125rem', fontWeight: 600 }}>
                {errors.tutor_type.message}
              </span>
            )}
          </div>
        </div>

        {/* Bio / Description */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.375rem' }}>
            Bio / Introduction (Shown to Students & Matchmaking)
          </label>
          <textarea
            {...register('description')}
            rows={4}
            placeholder="Introduce your educational background, teaching approach, and student achievements..."
            className="flat-input"
            style={{ resize: 'vertical' }}
            maxLength={2000}
          />
          {errors.description && (
            <span style={{ color: 'var(--color-danger)', fontSize: '0.8125rem', fontWeight: 600 }}>
              {errors.description.message}
            </span>
          )}
        </div>
      </Card>

      {/* 2. Teaching Style & Personality Sliders */}
      <TutorSliders
        styleProfile={styleProfile}
        personalityProfile={personalityProfile}
        onStyleChange={handleStyleChange}
        onPersonalityChange={handlePersonalityChange}
        errors={{
          style_profile: errors.style_profile?.message,
          personality_profile: errors.personality_profile?.message,
        }}
      />

      {/* Feedback Messages */}
      {formError && (
        <Alert variant="error">{formError}</Alert>
      )}

      {saveSuccess && (
        <Alert variant="success">
          {mode === 'create'
            ? 'Profile created successfully!'
            : 'Tutor profile updated successfully!'}
        </Alert>
      )}

      {/* Submit Button */}
      <SaveButton
        isLoading={isPending}
        disabled={isPending}
        label={mode === 'create' ? 'Save Personal Info & Continue' : 'Save Profile Changes'}
      />
    </form>
  );
};
