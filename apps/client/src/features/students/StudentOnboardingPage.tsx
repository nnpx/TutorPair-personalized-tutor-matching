import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TutorTypePref, type StudentAvailabilitySlotDto } from '@tutorpair/shared';
import {
  useStudentProfile,
  useCreateStudentProfile,
  useUpdateStudentProfile,
  useStudentAvailability,
  useSetStudentAvailability,
} from './hooks/useStudents';
import { StudentSliders } from './components/StudentSliders';
import { StudentAvailabilityGrid } from './components/StudentAvailabilityGrid';
import { Card, Button, Alert } from '../../components/ui';
import { InputField, SelectField } from '../../components/forms';
import {
  User,
  Sliders,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  GraduationCap,
  Coins,
  Compass,
  Calendar,
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Profile & Contact' },
  { id: 2, title: 'Sliders & Schedule' },
  { id: 3, title: 'Ready to Match' },
];

const GRADE_OPTIONS = [
  { value: '', label: 'Select Grade Level' },
  { value: 'G1', label: 'Grade 1 (Primary 1)' },
  { value: 'G2', label: 'Grade 2 (Primary 2)' },
  { value: 'G3', label: 'Grade 3 (Primary 3)' },
  { value: 'G4', label: 'Grade 4 (Primary 4)' },
  { value: 'G5', label: 'Grade 5 (Primary 5)' },
  { value: 'G6', label: 'Grade 6 (Primary 6)' },
  { value: 'G7', label: 'Grade 7 (Lower Secondary 1)' },
  { value: 'G8', label: 'Grade 8 (Lower Secondary 2)' },
  { value: 'G9', label: 'Grade 9 (Lower Secondary 3)' },
  { value: 'G10', label: 'Grade 10 (Upper Secondary 4)' },
  { value: 'G11', label: 'Grade 11 (Upper Secondary 5)' },
  { value: 'G12', label: 'Grade 12 (Upper Secondary 6)' },
];

const TUTOR_TYPE_PREF_OPTIONS = [
  { value: TutorTypePref.ANY, label: 'Any Tutor Type (No Preference)' },
  { value: TutorTypePref.UNDERGRADUATE, label: 'Undergraduate Student Tutor' },
  { value: TutorTypePref.FREELANCE, label: 'Full-time / Freelance Tutor' },
  { value: TutorTypePref.INSTITUTIONAL, label: 'School / Institution Teacher' },
];

export const StudentOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: profile, isLoading: loadingProfile } = useStudentProfile();
  const createProfileMutation = useCreateStudentProfile();
  const updateProfileMutation = useUpdateStudentProfile();

  const { data: serverAvailability = [] } = useStudentAvailability();
  const setAvailabilityMutation = useSetStudentAvailability();
  const [availabilitySlots, setAvailabilitySlots] = useState<StudentAvailabilitySlotDto[]>([]);
  const hasInitSlots = useRef(false);

  useEffect(() => {
    if (serverAvailability && serverAvailability.length > 0 && !hasInitSlots.current) {
      setAvailabilitySlots(serverAvailability);
      hasInitSlots.current = true;
    }
  }, [serverAvailability]);

  const [step1Saved, setStep1Saved] = useState<boolean>(false);
  const [step2Saved, setStep2Saved] = useState<boolean>(false);

  // Form field states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [lineId, setLineId] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [tutorTypePref, setTutorTypePref] = useState<TutorTypePref>(TutorTypePref.ANY);
  const [budgetMax, setBudgetMax] = useState<number | ''>(500);

  // 1–5 Sliders
  const [styleProfile, setStyleProfile] = useState<number[]>([3, 3, 3, 3, 3]);
  const [personalityProfile, setPersonalityProfile] = useState<number[]>([3, 3, 3, 3]);

  // Status feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Derive step completion strictly from server state and in-session saves
  const isStep1Done = Boolean(profile?.first_name && profile?.grade_level) || step1Saved;
  const isStep2Done =
    Boolean(
      profile?.style_profile &&
      profile?.style_profile.length === 5 &&
      profile?.personality_profile &&
      profile?.personality_profile.length === 4
    ) || step2Saved;

  const maxReachableStep = isStep2Done ? 3 : isStep1Done ? 2 : 1;

  const initialStepParam = parseInt(searchParams.get('step') || '1', 10);
  const validInitialStep = initialStepParam >= 1 && initialStepParam <= 3 ? initialStepParam : 1;
  const [currentStep, setCurrentStep] = useState<number>(Math.min(validInitialStep, maxReachableStep));

  // Sync state from existing profile
  useEffect(() => {
    if (profile) {
      if (profile.first_name) setFirstName(profile.first_name);
      if (profile.last_name) setLastName(profile.last_name);
      if (profile.phone_number) setPhoneNumber(profile.phone_number);
      if (profile.line_id) setLineId(profile.line_id);
      if (profile.grade_level) setGradeLevel(profile.grade_level);
      if (profile.tutor_type_pref) setTutorTypePref(profile.tutor_type_pref as TutorTypePref);
      if (profile.budget_max) setBudgetMax(Number(profile.budget_max));
      if (profile.style_profile && profile.style_profile.length === 5) {
        setStyleProfile([...profile.style_profile]);
      }
      if (profile.personality_profile && profile.personality_profile.length === 4) {
        setPersonalityProfile([...profile.personality_profile]);
      }
    }
  }, [profile]);

  // Guard against direct URL tampering (?step=3 when step 1 is not done)
  useEffect(() => {
    if (!loadingProfile && currentStep > maxReachableStep) {
      setCurrentStep(maxReachableStep);
      setSearchParams({ step: String(maxReachableStep) });
    }
  }, [loadingProfile, currentStep, maxReachableStep, setSearchParams]);

  const setStep = (step: number) => {
    setErrorMsg(null);
    const reachable = isStep2Done ? 3 : isStep1Done ? 2 : 1;
    const clampedStep = Math.min(step, reachable);
    setCurrentStep(clampedStep);
    setSearchParams({ step: String(clampedStep) });
  };

  // Step 1: Save Profile & Contact Channels
  const handleSaveStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!firstName.trim()) {
      setErrorMsg('First name is required.');
      return;
    }
    if (!lastName.trim()) {
      setErrorMsg('Last name is required.');
      return;
    }
    if (!phoneNumber.trim()) {
      setErrorMsg('Phone number is required for tutor contact channels.');
      return;
    }
    if (!gradeLevel) {
      setErrorMsg('Grade level is required. Please select your current grade level (G1–G12).');
      return;
    }
    if (!budgetMax || Number(budgetMax) <= 0) {
      setErrorMsg('Please specify a positive hourly budget in THB.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (!profile) {
        // Initial creation
        await createProfileMutation.mutateAsync({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone_number: phoneNumber.trim(),
          line_id: lineId.trim() || undefined,
          grade_level: gradeLevel,
          tutor_type_pref: tutorTypePref,
          style_profile: styleProfile,
          personality_profile: personalityProfile,
          budget_max: Number(budgetMax),
        });
      } else {
        // Update existing profile
        await updateProfileMutation.mutateAsync({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone_number: phoneNumber.trim(),
          line_id: lineId.trim() || null,
          grade_level: gradeLevel,
          tutor_type_pref: tutorTypePref,
          budget_max: Number(budgetMax),
        });
      }

      setStep1Saved(true);
      setCurrentStep(2);
      setSearchParams({ step: '2' });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save student profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Save Learning Sliders
  const handleSaveStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (styleProfile.length !== 5) {
      setErrorMsg('Please answer all 5 learning style questions.');
      return;
    }
    if (personalityProfile.length !== 4) {
      setErrorMsg('Please answer all 4 personality preference questions.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfileMutation.mutateAsync({
        style_profile: styleProfile,
        personality_profile: personalityProfile,
      });

      if (availabilitySlots.length > 0) {
        await setAvailabilityMutation.mutateAsync({
          availability: availabilitySlots,
        });
      }

      setStep2Saved(true);
      setCurrentStep(3);
      setSearchParams({ step: '3' });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save learning sliders and schedule.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingProfile) {
    return (
      <Card style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <p style={{ fontWeight: 700, fontSize: '1.125rem', color: '#6b7280' }}>
          Loading student onboarding...
        </p>
      </Card>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header & Hero */}
      <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--fg-main)', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
          Student Application &amp; Onboarding
        </h1>
        <p style={{ color: '#4b5563', fontSize: '1rem', fontWeight: 500, maxWidth: '720px', margin: '0 auto' }}>
          Complete all 3 sections to set up your learning profile, calibrate your preferences, and start matching.
        </p>
      </div>

      {/* Stepper Header (Connected 1 --- 2 --- 3 Track with Labels Below) */}
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
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.5rem',
          }}
        >
          {STEPS.map((step, idx) => {
            const isCurrent = currentStep === step.id;
            const isDone = (step.id === 1 && isStep1Done) || (step.id === 2 && isStep2Done);
            const isClickable = step.id <= maxReachableStep;

            const prevDone = idx > 0 && ((idx === 1 && isStep1Done) || (idx === 2 && isStep2Done));
            const leftLineColor = prevDone ? 'var(--color-primary)' : 'var(--color-border)';
            const rightLineColor = isDone ? 'var(--color-primary)' : 'var(--color-border)';

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
                  position: 'relative',
                }}
              >
                {/* Connector Track */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  {/* Left segment */}
                  {idx > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: '50%',
                        height: '3px',
                        backgroundColor: leftLineColor,
                        zIndex: 0,
                      }}
                    />
                  )}
                  {/* Right segment */}
                  {idx < STEPS.length - 1 && (
                    <div
                      style={{
                        position: 'absolute',
                        left: '50%',
                        right: 0,
                        height: '3px',
                        backgroundColor: rightLineColor,
                        zIndex: 0,
                      }}
                    />
                  )}

                  {/* Step Pill */}
                  <div
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: isDone
                        ? 'var(--color-primary)'
                        : isCurrent
                        ? 'var(--color-primary)'
                        : 'var(--bg-canvas)',
                      border: isDone || isCurrent ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                      color: isDone || isCurrent ? '#ffffff' : '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.9375rem',
                    }}
                  >
                    {isDone ? <CheckCircle2 size={18} strokeWidth={2.6} /> : step.id}
                  </div>
                </div>

                {/* Step Title */}
                <span
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: isCurrent ? 800 : 600,
                    color: isCurrent ? 'var(--color-primary)' : 'var(--fg-main)',
                    textAlign: 'center',
                    lineHeight: 1.25,
                  }}
                >
                  {step.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMsg && (
        <Alert variant="error">
          <strong>Validation Error:</strong> {errorMsg}
        </Alert>
      )}

      {/* ================= STEP 1: Personal Details & Contact Info ================= */}
      {currentStep === 1 && (
        <form onSubmit={handleSaveStep1}>
          <Card
            style={{
              padding: '2rem',
              backgroundColor: 'var(--bg-canvas)',
              border: '2px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '1rem' }}>
              <span
                style={{
                  width: '2.75rem',
                  height: '2.75rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-primary)',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <User size={22} strokeWidth={2.4} />
              </span>
              <div>
                <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--fg-main)', margin: 0 }}>
                  Personal Details &amp; Contact Channels
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                  Enter your name, grade level, and contact channels. Tutors use these channels to reach you upon match confirmation.
                </p>
              </div>
            </div>

            {/* Contact Sharing Notice (matches Tutor Profile visibility pattern) */}
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
              💬 <strong>Contact Sharing Notice:</strong> Your personal contact details (phone number and LINE ID) and grade level will be shared with the matched tutor once you choose them, allowing both of you to contact each other directly to coordinate lesson schedules.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Name Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                <InputField
                  label="First Name *"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Pitchaya"
                  required
                />
                <InputField
                  label="Last Name *"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Siriwong"
                  required
                />
              </div>

              {/* Contact Channels Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                <InputField
                  label="Mobile Phone Number *"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 0812345678"
                  type="tel"
                  required
                />
                <InputField
                  label="LINE ID (Optional)"
                  id="lineId"
                  value={lineId}
                  onChange={(e) => setLineId(e.target.value)}
                  placeholder="e.g. pitchaya.s"
                />
              </div>

              {/* Grade Level & Tutor Type */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                <SelectField
                  label="Current Grade Level (G1–G12) *"
                  id="gradeLevel"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  options={GRADE_OPTIONS}
                  required
                />
                <SelectField
                  label="Preferred Tutor Type"
                  id="tutorTypePref"
                  value={tutorTypePref}
                  onChange={(e) => setTutorTypePref(e.target.value as TutorTypePref)}
                  options={TUTOR_TYPE_PREF_OPTIONS}
                />
              </div>

              {/* Target Hourly Budget */}
              <div style={{ maxWidth: '320px' }}>
                <InputField
                  label="Default Hourly Budget (THB / hr) *"
                  id="budgetMax"
                  type="number"
                  min="100"
                  max="10000"
                  step="50"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value ? Number(e.target.value) : '')}
                  placeholder="500"
                  required
                />
              </div>
            </div>

            {/* Action Bar */}
            <div
              style={{
                marginTop: '2.5rem',
                paddingTop: '1.5rem',
                borderTop: '2px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.875rem 2rem',
                  fontSize: '1rem',
                  fontWeight: 800,
                }}
              >
                {isSubmitting ? 'Saving...' : 'Save Profile & Continue →'}
                <ArrowRight size={18} strokeWidth={2.4} />
              </Button>
            </div>
          </Card>
        </form>
      )}

      {/* ================= STEP 2: 9 Learning Style & Personality Sliders ================= */}
      {currentStep === 2 && (
        <form onSubmit={handleSaveStep2}>
          <Card
            style={{
              padding: '2rem',
              backgroundColor: 'var(--bg-canvas)',
              border: '2px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '1rem' }}>
              <span
                style={{
                  width: '2.75rem',
                  height: '2.75rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-primary)',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sliders size={22} strokeWidth={2.4} />
              </span>
              <div>
                <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--fg-main)', margin: 0 }}>
                  9 Learning Preferences &amp; Habits Sliders
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                  Adjust each 1–5 slider to reflect how you study best. Our matchmaking algorithm uses these 9 dimensions to find the perfect tutor compatibility.
                </p>
              </div>
            </div>

            <StudentSliders
              styleProfile={styleProfile}
              personalityProfile={personalityProfile}
              onStyleChange={(idx, val) => {
                const updated = [...styleProfile];
                updated[idx] = val;
                setStyleProfile(updated);
              }}
              onPersonalityChange={(idx, val) => {
                const updated = [...personalityProfile];
                updated[idx] = val;
                setPersonalityProfile(updated);
              }}
            />

            {/* Weekly Availability Schedule Section */}
            <div
              style={{
                marginTop: '2.5rem',
                paddingTop: '2rem',
                borderTop: '2px solid var(--color-border)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1.25rem',
                }}
              >
                <span
                  style={{
                    width: '2.75rem',
                    height: '2.75rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-primary-tint)',
                    color: 'var(--color-primary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Calendar size={22} strokeWidth={2.4} />
                </span>
                <div>
                  <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--fg-main)', margin: 0 }}>
                    Preferred Weekly Availability Schedule
                  </h2>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                    Configure the days and times you are free for lessons. Our matching engine will smart pre-fill these into your matching requests.
                  </p>
                </div>
              </div>

              <StudentAvailabilityGrid
                value={availabilitySlots}
                onChange={setAvailabilitySlots}
                showSaveButton={false}
              />
            </div>

            {/* Action Bar */}
            <div
              style={{
                marginTop: '2.5rem',
                paddingTop: '1.5rem',
                borderTop: '2px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 700,
                }}
              >
                <ArrowLeft size={16} strokeWidth={2.4} />
                Back to Profile
              </Button>

              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.875rem 2rem',
                  fontSize: '1rem',
                  fontWeight: 800,
                }}
              >
                {isSubmitting ? 'Saving...' : 'Save Sliders & Schedule →'}
                <ArrowRight size={18} strokeWidth={2.4} />
              </Button>
            </div>
          </Card>
        </form>
      )}

      {/* ================= STEP 3: Ready to Match Overview ================= */}
      {currentStep === 3 && (
        <Card
          style={{
            padding: '2.5rem',
            backgroundColor: 'var(--bg-canvas)',
            border: '2px solid var(--color-primary)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '4rem',
              height: '4rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-secondary-tint)',
              color: '#059669',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
            }}
          >
            <CheckCircle2 size={36} strokeWidth={2.6} />
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--fg-main)', margin: '0 0 0.5rem 0' }}>
            Setup Complete! You're Ready to Match
          </h2>
          <p style={{ fontSize: '1rem', color: '#4b5563', maxWidth: '620px', margin: '0 auto 2rem auto', lineHeight: 1.55 }}>
            Congratulations, <strong>{firstName} {lastName}</strong>! Your learning profile and pedagogical preferences are saved. You can now select a subject and let our intelligent engine match you with top verified tutors in Thailand.
          </p>

          {/* Quick Summary Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              maxWidth: '720px',
              margin: '0 auto 2.5rem auto',
              textAlign: 'left',
            }}
          >
            <div style={{ padding: '1rem', backgroundColor: 'var(--color-muted)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#6b7280', marginBottom: '0.25rem' }}>
                <GraduationCap size={14} /> Grade Level
              </div>
              <div style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--fg-main)' }}>
                {gradeLevel}
              </div>
            </div>

            <div style={{ padding: '1rem', backgroundColor: 'var(--color-muted)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#6b7280', marginBottom: '0.25rem' }}>
                <Coins size={14} /> Default Budget
              </div>
              <div style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--fg-main)' }}>
                ฿{budgetMax} / hr
              </div>
            </div>

            <div style={{ padding: '1rem', backgroundColor: 'var(--color-muted)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#6b7280', marginBottom: '0.25rem' }}>
                <Compass size={14} /> Sliders Configured
              </div>
              <div style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--fg-main)' }}>
                9 / 9 Calibrated
              </div>
            </div>

            <div style={{ padding: '1rem', backgroundColor: 'var(--color-muted)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#6b7280', marginBottom: '0.25rem' }}>
                <Calendar size={14} /> Weekly Schedule
              </div>
              <div style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--fg-main)' }}>
                {availabilitySlots.length > 0 ? `${availabilitySlots.length} Slot(s) Saved` : 'Flexible / Any'}
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/student/profile')}
              style={{ fontWeight: 700, padding: '0.875rem 1.5rem' }}
            >
              View Profile Settings
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => navigate('/student/matching')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.875rem 2.25rem',
                fontSize: '1rem',
                fontWeight: 800,
              }}
            >
              <Sparkles size={18} strokeWidth={2.4} />
              Find Tutors Now →
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
