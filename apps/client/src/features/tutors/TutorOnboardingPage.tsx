import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  TutorType,
  type TutorProfileInput,
  type TutorAvailabilitySlotDto,
} from '@tutorpair/shared';
import {
  useTutorProfile,
  useCreateTutorProfile,
  useUpdateTutorProfile,
  useTutorSubjects,
  useSetTutorSubjects,
  useTutorAvailability,
  useSetTutorAvailability,
} from './hooks/useTutors';
import { TutorSliders } from './components/TutorSliders';
import { SubjectSelector, type ConfiguredSubjectItem } from './components/SubjectSelector';
import { AvailabilityGrid } from './components/AvailabilityGrid';
import { VerificationSection, type VerificationSectionRef } from './components/VerificationSection';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  User,
  Sliders,
  BookOpen,
  Calendar,
  FileCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Personal Info', desc: 'Identity & Bio', icon: User },
  { id: 2, title: 'Teaching Style', desc: 'Matchmaking Sliders', icon: Sliders },
  { id: 3, title: 'Subjects & Rates', desc: 'Curriculum & Pricing', icon: BookOpen },
  { id: 4, title: 'Availability', desc: 'Weekly Hours', icon: Calendar },
  { id: 5, title: 'Verification', desc: 'Required Documents', icon: FileCheck },
];

export const TutorOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialStepParam = parseInt(searchParams.get('step') || '1', 10);
  const [currentStep, setCurrentStep] = useState<number>(
    initialStepParam >= 1 && initialStepParam <= 5 ? initialStepParam : 1
  );

  const { data: profile, isLoading: loadingProfile } = useTutorProfile();
  const { data: serverSubjects } = useTutorSubjects();
  const { data: serverAvailability } = useTutorAvailability();

  const createProfileMutation = useCreateTutorProfile();
  const updateProfileMutation = useUpdateTutorProfile();
  const setSubjectsMutation = useSetTutorSubjects();
  const setAvailabilityMutation = useSetTutorAvailability();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmittingFinal, setIsSubmittingFinal] = useState<boolean>(false);
  const verificationRef = useRef<VerificationSectionRef>(null);

  // Helper to switch step and update query param
  const setStep = (step: number) => {
    setCurrentStep(step);
    setSearchParams({ step: String(step) });
  };

  // Step 1: Personal Info
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [lineId, setLineId] = useState<string>('');
  const [tutorType, setTutorType] = useState<TutorType>(TutorType.UNDERGRADUATE);
  const [description, setDescription] = useState<string>('');

  // Step 2: Sliders
  const [styleProfile, setStyleProfile] = useState<number[]>([3, 3, 3, 3, 3]);
  const [personalityProfile, setPersonalityProfile] = useState<number[]>([3, 3, 3, 3]);

  // Step 3: Configured Subjects
  const [configuredSubjects, setConfiguredSubjects] = useState<ConfiguredSubjectItem[]>([]);

  // Step 4: Availability Slots
  const [availabilitySlots, setAvailabilitySlots] = useState<TutorAvailabilitySlotDto[]>([]);

  // Pre-fill profile data if user returns
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name);
      setLastName(profile.last_name);
      setPhoneNumber(profile.phone_number);
      setLineId(profile.line_id ?? '');
      setTutorType(profile.tutor_type as TutorType);
      setDescription(profile.description ?? '');
      setStyleProfile(profile.style_profile);
      setPersonalityProfile(profile.personality_profile);
    }
  }, [profile]);

  // Pre-fill previously configured subjects if user returns
  useEffect(() => {
    if (serverSubjects && serverSubjects.length > 0 && configuredSubjects.length === 0) {
      setConfiguredSubjects(
        serverSubjects.map((s) => ({
          variant_id: s.variant_id,
          subject_name: s.subject_name,
          variant_name: s.variant_name,
          category: s.category,
          learning_goal: s.learning_goal,
          requires_proof: s.requires_proof,
          hourly_rate: s.hourly_rate ?? 500,
          grade_levels: s.grade_levels ?? [],
          teaching_focus: s.teaching_focus ?? '',
        }))
      );
    }
  }, [serverSubjects, configuredSubjects.length]);

  // Pre-fill previously configured availability if user returns
  useEffect(() => {
    if (serverAvailability && serverAvailability.length > 0 && availabilitySlots.length === 0) {
      setAvailabilitySlots(serverAvailability);
    }
  }, [serverAvailability, availabilitySlots.length]);

  // Handle Step 1 & 2 save to backend
  const saveProfileData = async () => {
    if (!firstName.trim() || !lastName.trim() || !phoneNumber.trim()) {
      throw new Error('Please fill in your first name, last name, and phone number.');
    }

    const payload: TutorProfileInput = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone_number: phoneNumber.trim(),
      line_id: lineId.trim() ? lineId.trim() : null,
      tutor_type: tutorType,
      description: description.trim(),
      style_profile: styleProfile,
      personality_profile: personalityProfile,
    };

    if (profile) {
      await updateProfileMutation.mutateAsync({
        phone_number: payload.phone_number,
        line_id: payload.line_id,
        description: payload.description,
        style_profile: payload.style_profile,
        personality_profile: payload.personality_profile,
      });
    } else {
      await createProfileMutation.mutateAsync(payload);
    }
  };

  // Step Navigation Handlers
  const handleNext = async () => {
    setErrorMsg(null);

    try {
      if (currentStep === 1) {
        if (!firstName.trim() || !lastName.trim() || !phoneNumber.trim()) {
          setErrorMsg('First Name, Last Name, and Phone Number are required.');
          return;
        }
        setIsSubmitting(true);
        await saveProfileData();
        setIsSubmitting(false);
        setStep(2);
      } else if (currentStep === 2) {
        setIsSubmitting(true);
        await saveProfileData();
        setIsSubmitting(false);
        setStep(3);
      } else if (currentStep === 3) {
        if (configuredSubjects.length === 0) {
          setErrorMsg('Please add at least one subject offering before proceeding.');
          return;
        }
        setIsSubmitting(true);
        await setSubjectsMutation.mutateAsync({
          subjects: configuredSubjects.map((s) => ({
            variant_id: s.variant_id,
            hourly_rate: s.hourly_rate,
            grade_levels: s.grade_levels.length > 0 ? s.grade_levels : null,
            teaching_focus: s.teaching_focus ? s.teaching_focus : null,
          })),
        });
        setIsSubmitting(false);
        setStep(4);
      } else if (currentStep === 4) {
        if (availabilitySlots.length === 0) {
          setErrorMsg('Please configure at least one available teaching time slot.');
          return;
        }
        setIsSubmitting(true);
        await setAvailabilityMutation.mutateAsync({
          availability: availabilitySlots,
        });
        setIsSubmitting(false);
        setStep(5);
      }
    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : 'An error occurred while saving your data.';
      setErrorMsg(msg);
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    if (currentStep > 1) {
      setStep(currentStep - 1);
    }
  };

  // Final Application Submission (Consolidated Single Submit Button)
  const handleFinalSubmit = async () => {
    setErrorMsg(null);

    if (verificationRef.current) {
      setIsSubmittingFinal(true);
      try {
        const res = await verificationRef.current.submitAll();
        if (!res.success) {
          if (res.error) {
            setErrorMsg(res.error);
          }
          return;
        }
      } finally {
        setIsSubmittingFinal(false);
      }
    }

    // Success -> redirect to Profile & Application Hub
    navigate('/tutor/profile');
  };

  if (loadingProfile) {
    return (
      <Card style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <p style={{ fontWeight: 700, fontSize: '1.125rem', color: '#6b7280' }}>
          Loading application...
        </p>
      </Card>
    );
  }

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header & Hero */}
      <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--fg-main)', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
          Tutor Application & Onboarding
        </h1>
        <p style={{ color: '#4b5563', fontSize: '1rem', fontWeight: 500, maxWidth: '640px', margin: '0 auto' }}>
          Complete all 5 sections to register your credentials, set your rates, and submit for verification.
        </p>
      </div>

      {/* Stepper Header (Connected 1 --- 2 --- 3 --- 4 --- 5 Track with Labels Below) */}
      <div
        style={{
          backgroundColor: 'var(--bg-canvas)',
          padding: '1.5rem 1rem 1.25rem 1rem',
          borderRadius: 'var(--radius-lg)',
          border: '2px solid var(--color-border)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '0.25rem',
          }}
        >
          {STEPS.map((step, idx) => {
            const isCurrent = currentStep === step.id;
            const isDone =
              currentStep > step.id ||
              (step.id === 1 && Boolean(profile)) ||
              (step.id === 2 && Boolean(profile)) ||
              (step.id === 3 && ((serverSubjects?.length ?? 0) > 0 || configuredSubjects.length > 0)) ||
              (step.id === 4 && ((serverAvailability?.length ?? 0) > 0 || availabilitySlots.length > 0));

            const maxReachableStep =
              (serverAvailability && serverAvailability.length > 0) || availabilitySlots.length > 0
                ? 5
                : (serverSubjects && serverSubjects.length > 0) || configuredSubjects.length > 0
                  ? 4
                  : profile
                    ? 3
                    : 1;

            const isClickable = step.id <= Math.max(currentStep, maxReachableStep);

            // Connector line coloring: Left connector from previous step, right connector to next step
            const prevDone =
              idx > 0 &&
              (currentStep > idx ||
                (idx === 1 && Boolean(profile)) ||
                (idx === 2 && Boolean(profile)) ||
                (idx === 3 && ((serverSubjects?.length ?? 0) > 0 || configuredSubjects.length > 0)));

            const leftLineColor = prevDone ? 'var(--color-secondary)' : 'var(--color-border)';
            const rightLineColor = isDone ? 'var(--color-secondary)' : 'var(--color-border)';

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (isClickable) setStep(step.id);
                }}
                disabled={!isClickable}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: isCurrent ? 'var(--color-muted)' : 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.625rem 0.25rem',
                  cursor: isClickable ? 'pointer' : 'not-allowed',
                  opacity: !isClickable && !isCurrent ? 0.55 : 1,
                  transition: 'all 0.15s ease',
                  textAlign: 'center',
                }}
              >
                {/* 1 --- 2 --- 3 --- 4 --- 5 Track Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    marginBottom: '0.75rem',
                  }}
                >
                  {/* Left Connecting Line */}
                  <div
                    style={{
                      flex: 1,
                      height: '3px',
                      backgroundColor: idx === 0 ? 'transparent' : leftLineColor,
                    }}
                  />

                  {/* Number Circle Node */}
                  <span
                    style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: isCurrent
                        ? 'var(--color-primary)'
                        : isDone
                          ? 'var(--color-secondary)'
                          : 'var(--color-muted)',
                      color: isCurrent || isDone ? 'white' : 'var(--fg-main)',
                      border: isCurrent
                        ? '3px solid var(--color-primary)'
                        : isDone
                          ? '3px solid var(--color-secondary)'
                          : '2px solid var(--color-border)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1rem',
                      flexShrink: 0,
                      boxShadow: isCurrent ? '0 0 0 3px var(--color-primary-tint)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {isDone ? (
                      <CheckCircle2 size={18} strokeWidth={2.6} />
                    ) : (
                      step.id
                    )}
                  </span>

                  {/* Right Connecting Line */}
                  <div
                    style={{
                      flex: 1,
                      height: '3px',
                      backgroundColor: idx === 4 ? 'transparent' : rightLineColor,
                    }}
                  />
                </div>

                {/* Step Labels Below */}
                <div style={{ padding: '0 0.25rem' }}>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: '0.875rem',
                      lineHeight: 1.25,
                      color: isCurrent
                        ? 'var(--color-primary)'
                        : isDone
                          ? 'var(--fg-main)'
                          : '#4b5563',
                      marginBottom: '0.25rem',
                    }}
                  >
                    {step.title}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: isCurrent ? 'var(--color-primary)' : '#6b7280',
                      lineHeight: 1.3,
                      fontWeight: isCurrent ? 700 : 500,
                    }}
                  >
                    {step.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>



      {/* Step Contents */}
      {currentStep === 1 && (
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
                Step 1: Personal & Identity Information
              </h2>
              <p style={{ fontSize: '0.9375rem', color: '#4b5563', fontWeight: 500 }}>
                Please provide your real legal name and qualification level. These will be verified against your uploaded documents.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.375rem' }}>
                First Name *
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. John"
                className="flat-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.375rem' }}>
                Last Name *
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Smith"
                className="flat-input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.375rem' }}>
                Phone Number *
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. +66 81 234 5678"
                className="flat-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.375rem' }}>
                LINE ID <span style={{ fontWeight: 500, color: '#6b7280' }}>(Optional)</span>
              </label>
              <input
                type="text"
                value={lineId}
                onChange={(e) => setLineId(e.target.value)}
                placeholder="e.g. @tutor_lineid"
                className="flat-input"
              />
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
            💬 <strong>Profile Visibility:</strong> All information in this Tutor Profile form (including your name, qualification tier, bio, teaching style, phone number, and LINE ID) will be shown to students so they can learn about your background and contact you if they match with you.
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.375rem' }}>
              Tutor Qualification Type *
            </label>
            <select
              value={tutorType}
              onChange={(e) => setTutorType(e.target.value as TutorType)}
              className="flat-input"
              style={{ fontWeight: 600, width: '100%' }}
            >
              <option value={TutorType.UNDERGRADUATE}>Undergraduate Student</option>
              <option value={TutorType.FREELANCE}>Freelance / Professional Tutor</option>
              <option value={TutorType.INSTITUTIONAL}>School / Institutional Teacher</option>
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.375rem' }}>
              Bio / Introduction (Shown to Students)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Introduce your educational background, teaching approach, and student achievements..."
              className="flat-input"
              style={{ resize: 'vertical' }}
              maxLength={2000}
            />
          </div>
        </Card>
      )}

      {currentStep === 2 && (
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
              <Sliders size={22} strokeWidth={2.4} />
            </span>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--fg-main)' }}>
                Step 2: Teaching Style & Personality Sliders
              </h2>
              <p style={{ fontSize: '0.9375rem', color: '#4b5563', fontWeight: 500 }}>
                Our intelligent matchmaking engine compares these sliders directly with student preferences.
              </p>
            </div>
          </div>

          <TutorSliders
            styleProfile={styleProfile}
            personalityProfile={personalityProfile}
            onStyleChange={(idx, val) => {
              const u = [...styleProfile];
              u[idx] = val;
              setStyleProfile(u);
            }}
            onPersonalityChange={(idx, val) => {
              const u = [...personalityProfile];
              u[idx] = val;
              setPersonalityProfile(u);
            }}
          />
        </Card>
      )}

      {currentStep === 3 && (
        <div>
          <SubjectSelector
            value={configuredSubjects}
            onChange={(newSubs) => setConfiguredSubjects(newSubs)}
            showSaveButton={false}
          />
        </div>
      )}

      {currentStep === 4 && (
        <div>
          <AvailabilityGrid
            value={availabilitySlots}
            onChange={(newSlots) => setAvailabilitySlots(newSlots)}
            showSaveButton={false}
          />
        </div>
      )}

      {currentStep === 5 && (
        <div>
          <VerificationSection
            ref={verificationRef}
            inOnboarding={true}
            configuredSubjects={configuredSubjects}
          />
        </div>
      )}

      {/* Global & Step Error Banner (Placed right near the Submit button for high visibility) */}
      {errorMsg && (
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'var(--color-danger-tint)',
            color: 'var(--color-danger)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-danger)',
            fontWeight: 700,
            fontSize: '0.9375rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <AlertCircle size={20} strokeWidth={2.4} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Stepper Footer Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-canvas)',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '2px solid var(--color-border)',
        }}
      >
        <Button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 1 || isSubmitting || isSubmittingFinal}
          variant="outline"
          style={{ height: '3.25rem', padding: '0 1.5rem', fontWeight: 700 }}
        >
          <ArrowLeft size={18} strokeWidth={2.4} />
          Previous Step
        </Button>

        {currentStep < 5 ? (
          <Button
            type="button"
            onClick={handleNext}
            isLoading={isSubmitting}
            variant="primary"
            style={{ height: '3.25rem', padding: '0 2rem', fontWeight: 800 }}
          >
            Save & Continue to Next Step
            <ArrowRight size={18} strokeWidth={2.4} />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleFinalSubmit}
            isLoading={isSubmittingFinal}
            variant="secondary"
            style={{
              backgroundColor: 'var(--color-secondary)',
              color: 'white',
              height: '3.5rem',
              padding: '0 2.5rem',
              fontWeight: 800,
              fontSize: '1rem',
            }}
          >
            <Sparkles size={18} strokeWidth={2.4} />
            Submit Application for Verification
          </Button>
        )}
      </div>
    </div>
  );
};
