import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  type TutorAvailabilitySlotDto,
} from '@tutorpair/shared';
import {
  useTutorProfile,
  useTutorSubjects,
  useSetTutorSubjects,
  useTutorAvailability,
  useSetTutorAvailability,
} from './hooks/useTutors';
import { TutorProfileForm } from './components/TutorProfileForm';
import { SubjectSelector, type ConfiguredSubjectItem } from './components/SubjectSelector';
import { AvailabilityGrid } from './components/AvailabilityGrid';
import { VerificationSection, type VerificationSectionRef } from './components/VerificationSection';
import { Card, Button, Alert } from '../../components/ui';
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Profile & Style' },
  { id: 2, title: 'Subjects & Rates' },
  { id: 3, title: 'Weekly Schedule' },
  { id: 4, title: 'Verification Docs' },
];


export const TutorOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: profile, isLoading: loadingProfile } = useTutorProfile();
  const { data: serverSubjects } = useTutorSubjects();
  const { data: serverAvailability } = useTutorAvailability();

  const setSubjectsMutation = useSetTutorSubjects();
  const setAvailabilityMutation = useSetTutorAvailability();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmittingFinal, setIsSubmittingFinal] = useState<boolean>(false);
  const verificationRef = useRef<VerificationSectionRef>(null);

  // Step 2 state: Configured Subjects
  const [configuredSubjects, setConfiguredSubjects] = useState<ConfiguredSubjectItem[]>([]);

  // Step 3 state: Availability Slots
  const [availabilitySlots, setAvailabilitySlots] = useState<TutorAvailabilitySlotDto[]>([]);

  // Local state to track immediate Step 1 completion before React Query refetches profile
  const [step1Saved, setStep1Saved] = useState<boolean>(false);

  // Step completion criteria derived from actual server and client state
  const isStep1Done = Boolean(profile) || step1Saved;
  const isStep2Done = (serverSubjects && serverSubjects.length > 0) || configuredSubjects.length > 0;
  const isStep3Done = (serverAvailability && serverAvailability.length > 0) || availabilitySlots.length > 0;

  // Gated Progression: Maximum step unlocked
  const maxReachableStep = isStep3Done
    ? 4
    : isStep2Done
      ? 3
      : isStep1Done
        ? 2
        : 1;

  const initialStepParam = parseInt(searchParams.get('step') || '1', 10);
  const validInitialStep = initialStepParam >= 1 && initialStepParam <= 4 ? initialStepParam : 1;
  const [currentStep, setCurrentStep] = useState<number>(Math.min(validInitialStep, maxReachableStep));

  // Helper to change step and keep query param in sync
  const setStep = (step: number) => {
    setErrorMsg(null);
    const reachable = isStep3Done ? 4 : isStep2Done ? 3 : isStep1Done ? 2 : 1;
    const clampedStep = Math.min(step, reachable);
    setCurrentStep(clampedStep);
    setSearchParams({ step: String(clampedStep) });
  };

  const handleProfileSuccess = () => {
    setErrorMsg(null);
    setStep1Saved(true);
    setCurrentStep(2);
    setSearchParams({ step: '2' });
  };

  // Guard against direct URL tampering (?step=4 when only step 1 is done)
  useEffect(() => {
    if (!loadingProfile && currentStep > maxReachableStep) {
      setCurrentStep(maxReachableStep);
      setSearchParams({ step: String(maxReachableStep) });
    }
  }, [loadingProfile, currentStep, maxReachableStep, setSearchParams]);

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

  // Handle Step 2: Save Subjects & Continue to Step 3
  const handleSaveSubjectsAndContinue = async () => {
    setErrorMsg(null);
    if (configuredSubjects.length === 0) {
      setErrorMsg('Please add at least one subject offering before proceeding.');
      return;
    }

    setIsSubmitting(true);
    try {
      await setSubjectsMutation.mutateAsync({
        subjects: configuredSubjects.map((s) => ({
          variant_id: s.variant_id,
          hourly_rate: s.hourly_rate,
          grade_levels: s.grade_levels.length > 0 ? s.grade_levels : null,
          teaching_focus: s.teaching_focus ? s.teaching_focus : null,
        })),
      });
      setStep(3);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save subjects.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Step 3: Save Availability & Continue to Step 4
  const handleSaveAvailabilityAndContinue = async () => {
    setErrorMsg(null);
    if (availabilitySlots.length === 0) {
      setErrorMsg('Please configure at least one available teaching time slot.');
      return;
    }

    setIsSubmitting(true);
    try {
      await setAvailabilityMutation.mutateAsync({
        availability: availabilitySlots,
      });
      setStep(4);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save availability schedule.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 4: Final Application Submission
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

    // Success -> redirect to Tutor Profile Dashboard
    navigate('/tutor/profile');
  };

  const handleBack = () => {
    setErrorMsg(null);
    if (currentStep > 1) {
      setStep(currentStep - 1);
    }
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
          Tutor Application &amp; Onboarding
        </h1>
        <p style={{ color: '#4b5563', fontSize: '1rem', fontWeight: 500, maxWidth: '800px', margin: '0 auto' }}>
          Complete all 4 sections to register your credentials, set your rates, and submit for verification.
        </p>
      </div>

      {/* Stepper Header (Connected 1 --- 2 --- 3 --- 4 Track with Labels Below) */}
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
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.25rem',
          }}
        >
          {STEPS.map((step, idx) => {
            const isCurrent = currentStep === step.id;
            const isDone =
              (step.id === 1 && isStep1Done) ||
              (step.id === 2 && isStep2Done) ||
              (step.id === 3 && isStep3Done);

            // Gated Progression: can only click steps that are already reached/unlocked
            const isClickable = step.id <= maxReachableStep;

            // Connector lines: left from previous, right to next
            const prevDone =
              idx > 0 &&
              ((idx === 1 && isStep1Done) ||
                (idx === 2 && isStep2Done) ||
                (idx === 3 && isStep3Done));

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
                  opacity: !isClickable && !isCurrent ? 0.45 : 1,
                  transition: 'all 0.15s ease',
                  textAlign: 'center',
                }}
              >
                {/* 1 --- 2 --- 3 --- 4 Track Row */}
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

                  {/* Number Circle Node: Current step ALWAYS displays the step.id number, NEVER a checkmark! */}
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
                    {isDone && !isCurrent ? (
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
                      backgroundColor: idx === 3 ? 'transparent' : rightLineColor,
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
                    }}
                  >
                    {step.title}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>


      {/* Step 1: Profile & Style (Identity, Bio, and 5+4 Matchmaking Sliders) */}
      {currentStep === 1 && (
        <TutorProfileForm
          initialData={profile}
          mode={profile ? 'edit' : 'create'}
          onSuccess={handleProfileSuccess}
          submitLabel="Save Profile & Continue →"
          showSuccessMessage={false}
        />
      )}

      {/* Step 2: Teaching Subjects & Rates */}
      {currentStep === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <SubjectSelector
            value={configuredSubjects}
            onChange={(newSubs) => setConfiguredSubjects(newSubs)}
            showSaveButton={false}
          />

          {errorMsg && (
            <Alert variant="error">
              {errorMsg}
            </Alert>
          )}

          {/* Step 2 Bottom Navigation */}
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
              disabled={isSubmitting}
              variant="outline"
              style={{ height: '3.25rem', padding: '0 1.5rem', fontWeight: 700 }}
            >
              <ArrowLeft size={18} strokeWidth={2.4} />
              Previous Step
            </Button>

            <Button
              type="button"
              onClick={handleSaveSubjectsAndContinue}
              isLoading={isSubmitting}
              variant="primary"
              style={{ height: '3.25rem', padding: '0 2rem', fontWeight: 800 }}
            >
              Save Subjects &amp; Continue
              <ArrowRight size={18} strokeWidth={2.4} />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Weekly Schedule & Availability */}
      {currentStep === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <AvailabilityGrid
            value={availabilitySlots}
            onChange={(newSlots) => setAvailabilitySlots(newSlots)}
            showSaveButton={false}
          />

          {errorMsg && (
            <Alert variant="error">
              {errorMsg}
            </Alert>
          )}

          {/* Step 3 Bottom Navigation */}
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
              disabled={isSubmitting}
              variant="outline"
              style={{ height: '3.25rem', padding: '0 1.5rem', fontWeight: 700 }}
            >
              <ArrowLeft size={18} strokeWidth={2.4} />
              Previous Step
            </Button>

            <Button
              type="button"
              onClick={handleSaveAvailabilityAndContinue}
              isLoading={isSubmitting}
              variant="primary"
              style={{ height: '3.25rem', padding: '0 2rem', fontWeight: 800 }}
            >
              Save Schedule &amp; Continue
              <ArrowRight size={18} strokeWidth={2.4} />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Verification Documents & Final Submit */}
      {currentStep === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <VerificationSection
            ref={verificationRef}
            inOnboarding={true}
            configuredSubjects={configuredSubjects}
          />

          {/* Step 4 Error Banner placed right above the submit bar */}
          {errorMsg && (
            <Alert variant="error">
              {errorMsg}
            </Alert>
          )}

          {/* Step 4 Bottom Navigation */}
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
              disabled={isSubmittingFinal}
              variant="outline"
              style={{ height: '3.25rem', padding: '0 1.5rem', fontWeight: 700 }}
            >
              <ArrowLeft size={18} strokeWidth={2.4} />
              Previous Step
            </Button>

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
          </div>
        </div>
      )}
    </div>
  );
};
