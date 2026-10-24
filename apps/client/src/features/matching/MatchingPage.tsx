import React, { useState, useEffect, useRef } from 'react';
import { Card, Button } from '../../components/ui';
import { Link } from 'react-router-dom';
import { useStudentProfile } from '../students/hooks/useStudents';
import { useAuthStore } from '../../store/auth.store';
import { StudentRoadmap } from '../students/components/StudentRoadmap';
import { StudentSubjectSelector } from '../students/components/StudentSubjectSelector';
import { DayOfWeek, type StudentSubjectItemDto } from '@tutorpair/shared';
import {
  Sparkles,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Video,
  User,
  ShieldCheck,
  Zap,
  ChevronDown,
  X,
  Clock,
  Plus,
  Trash2,
} from 'lucide-react';

export interface MatchTimeSlot {
  id: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
}

const PRESETS = [
  { label: 'Morning (09:00 - 12:00)', start: '09:00', end: '12:00' },
  { label: 'Afternoon (13:00 - 17:00)', start: '13:00', end: '17:00' },
  { label: 'Evening (18:00 - 21:00)', start: '18:00', end: '21:00' },
];

const DAYS_ORDER: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];

export const MatchingPage: React.FC = () => {
  const { user } = useAuthStore();
  const { data: profile, isLoading } = useStudentProfile();
  const formRef = useRef<HTMLDivElement>(null);

  // Ensure page starts at the top
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  // Local Storage flags for step completion
  const step1Saved = localStorage.getItem(`tutorpair_student_step_1_${user?.id || 'guest'}`) === 'true';
  const step2Saved = localStorage.getItem(`tutorpair_student_step_2_${user?.id || 'guest'}`) === 'true';
  const step2ExplicitlyNotSaved = localStorage.getItem(`tutorpair_student_step_2_${user?.id || 'guest'}`) === 'false';

  // 2-step profile check (Step 1: Personal & Contact Channels, Step 2: 9 Learning Sliders)
  const isStep1Done =
    step1Saved ||
    Boolean(
      profile &&
      profile.first_name &&
      profile.last_name &&
      profile.phone_number &&
      profile.grade_level
    );

  const isStep2Done =
    isStep1Done &&
    Boolean(
      step2Saved ||
      (!step2ExplicitlyNotSaved &&
        profile &&
        profile.style_profile &&
        profile.style_profile.length === 5 &&
        profile.personality_profile &&
        profile.personality_profile.length === 4 &&
        localStorage.getItem(`tutorpair_student_step_1_${user?.id || 'guest'}`) === null)
    );

  const isProfileReady = isStep1Done && isStep2Done;

  // Toggle state: Matching Form is hidden by default for a clean homepage feel
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);

  // Match request states (single subject selection per matching request)
  const [selectedSubject, setSelectedSubject] = useState<StudentSubjectItemDto | null>(null);
  const [matchBudget, setMatchBudget] = useState<number | ''>('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Preferred schedule: Multiple time slots support (consistent with Tutor Availability)
  const [matchSlots, setMatchSlots] = useState<MatchTimeSlot[]>([
    { id: 'default-1', day: DayOfWeek.MONDAY, startTime: '17:00', endTime: '19:00' },
  ]);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(DayOfWeek.MONDAY);
  const [slotStartTime, setSlotStartTime] = useState<string>('17:00');
  const [slotEndTime, setSlotEndTime] = useState<string>('19:00');
  const [slotError, setSlotError] = useState<string | null>(null);

  // Pre-populate budget once from saved student profile on load
  const hasInitializedBudget = useRef(false);
  useEffect(() => {
    if (profile?.budget_max && !hasInitializedBudget.current) {
      setMatchBudget(Number(profile.budget_max));
      hasInitializedBudget.current = true;
    }
  }, [profile?.budget_max]);

  const handleApplyPreset = (start: string, end: string) => {
    setSlotStartTime(start);
    setSlotEndTime(end);
    setSlotError(null);
  };

  const handleAddSlot = () => {
    setSlotError(null);
    if (!slotStartTime || !slotEndTime) {
      setSlotError('Please choose both start time and end time.');
      return;
    }
    if (slotStartTime >= slotEndTime) {
      setSlotError('Start time must be earlier than end time.');
      return;
    }

    const isDuplicate = matchSlots.some(
      (s) => s.day === selectedDay && s.startTime === slotStartTime && s.endTime === slotEndTime
    );
    if (isDuplicate) {
      setSlotError(`This exact time slot on ${selectedDay.slice(0, 3)} (${slotStartTime} - ${slotEndTime}) is already added.`);
      return;
    }

    // Check overlap on the same day
    const daySlots = matchSlots.filter((s) => s.day === selectedDay);
    const hasOverlap = daySlots.some(
      (s) =>
        (slotStartTime >= s.startTime && slotStartTime < s.endTime) ||
        (slotEndTime > s.startTime && slotEndTime <= s.endTime) ||
        (slotStartTime <= s.startTime && slotEndTime >= s.endTime)
    );

    if (hasOverlap) {
      setSlotError(`This slot overlaps with an existing slot on ${selectedDay.slice(0, 3)}.`);
      return;
    }

    setMatchSlots((prev) => [
      ...prev,
      {
        id: `slot-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        day: selectedDay,
        startTime: slotStartTime,
        endTime: slotEndTime,
      },
    ]);
  };

  const handleRemoveSlot = (id: string) => {
    setMatchSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const handleOpenForm = () => {
    setIsFormOpen(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleToggleForm = () => {
    if (!isFormOpen) {
      handleOpenForm();
    } else {
      setIsFormOpen(false);
    }
  };

  const handleFindTutors = () => {
    setSubmitError(null);
    if (!selectedSubject) {
      setSubmitError('Please select 1 subject and learning goal variant using the 3-step selector below.');
      return;
    }
    if (!matchBudget || Number(matchBudget) < 100) {
      setSubmitError('Please enter a valid hourly budget (minimum ฿100/hr, cannot be left blank or 0).');
      return;
    }
    if (matchSlots.length === 0) {
      setSubmitError('Please add at least one preferred time slot in Step 3 for your lesson schedule.');
      return;
    }

    const formattedSchedule = matchSlots
      .map((s) => `  • ${s.day.slice(0, 3)}: ${s.startTime} – ${s.endTime}`)
      .join('\n');

    alert(
      `🎯 Match Request Submitted!\n\n` +
      `• Subject: ${selectedSubject.subject_name}\n` +
      `• Variant: ${selectedSubject.variant_name}\n` +
      `• Budget: ${matchBudget} THB/hr\n` +
      `• Tutoring Mode: Online (Live Video Session)\n` +
      `• Preferred Schedule (${matchSlots.length} slot${matchSlots.length > 1 ? 's' : ''}):\n${formattedSchedule}\n` +
      `• Student Grade: ${profile?.grade_level}\n\n` +
      `Module 6 Matchmaking Engine will calculate Top 3 recommendations using your 9 learning & personality sliders!`
    );
  };

  if (isLoading) {
    return (
      <div style={{ maxWidth: '960px', margin: '3rem auto', textAlign: 'center' }}>
        <Card style={{ padding: '3rem' }}>
          <p style={{ fontWeight: 700, color: '#6b7280' }}>Loading student portal...</p>
        </Card>
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: FIRST-TIME USER / INCOMPLETE SETUP
  // Unified onboarding view: Clean greeting & instructions with 3-column roadmap
  // (Zero redundant top buttons; Card 1 serves as the primary actionable CTA)
  // =========================================================================
  if (!isProfileReady) {
    return (
      <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Unified Welcome & Instructions Header */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '1rem auto 0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.35rem 0.85rem',
              backgroundColor: 'var(--color-primary-tint)',
              color: 'var(--color-primary)',
              borderRadius: 'var(--radius-full)',
              fontWeight: 800,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.75rem',
            }}
          >
            <Sparkles size={14} strokeWidth={2.4} />
            <span>Welcome to TutorPair • Student Pathway Guide</span>
          </div>

          <h1
            style={{
              fontSize: '2.25rem',
              fontWeight: 800,
              color: 'var(--fg-main)',
              letterSpacing: '-0.02em',
              margin: '0 0 0.75rem 0',
              lineHeight: 1.2,
            }}
          >
            Welcome to TutorPair
          </h1>

          <p
            style={{
              fontSize: '1rem',
              color: '#4b5563',
              lineHeight: 1.55,
              margin: 0,
              fontWeight: 500,
            }}
          >
            Follow these <strong>3 simple steps</strong> to find and match with your ideal verified tutor. Complete <strong>Step 1</strong> below to unlock intelligent matching:
          </p>
        </div>

        {/* The Vertical Guided Pathway acts as the primary interactive driver */}
        <StudentRoadmap
          layout="vertical"
          isProfileComplete={false}
          showHeader={false}
          ctaText={!isStep1Done ? 'Start Setup: Step 1 →' : 'Continue Setup: Step 2 →'}
          ctaLink={!isStep1Done ? '/student/profile?tab=profile&returnTo=/student/matching' : '/student/profile?tab=sliders&returnTo=/student/matching'}
        />
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: PROFILE READY — STUDENT HOMEPAGE
  // Shows homepage hero with "Matching Tutor" button, expandable form, and horizontal roadmap
  // =========================================================================
  const studentFirstName = profile?.first_name || '';
  const studentLastName = profile?.last_name || '';
  const studentFullName = (studentFirstName || studentLastName)
    ? `${studentFirstName} ${studentLastName}`.trim()
    : (user?.email ? user.email.split('@')[0] : 'Student');

  const initials = (
    (studentFirstName ? studentFirstName[0] : (user?.email ? user.email[0] : 'S')) +
    (studentLastName ? studentLastName[0] : '')
  ).toUpperCase();

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* 1. Student Identity & Status Card (Modern EdTech Header) */}
      <Card
        style={{
          padding: '1.25rem 1.75rem',
          backgroundColor: '#ffffff',
          border: '2px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}
      >
        {/* Left: Avatar + Identity + Status Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
          {/* Student Avatar with Active Status Dot */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              style={{
                width: '3.25rem',
                height: '3.25rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-primary)',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.125rem',
                letterSpacing: '0.04em',
                border: '2px solid var(--color-primary-tint)',
              }}
            >
              {initials}
            </div>
            {/* Green Online / Match-Ready Ping Dot */}
            <span
              title="Profile Active & Match Ready"
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '0.875rem',
                height: '0.875rem',
                backgroundColor: '#10b981',
                borderRadius: 'var(--radius-full)',
                border: '2px solid #ffffff',
                display: 'inline-block',
              }}
            />
          </div>

          {/* Student Name & Meta Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
              <h2
                style={{
                  fontSize: '1.1875rem',
                  fontWeight: 800,
                  color: 'var(--fg-main)',
                  margin: 0,
                  textTransform: 'capitalize',
                  lineHeight: 1.2,
                }}
              >
                {studentFullName}
              </h2>

              {/* Grade Badge */}
              {profile?.grade_level && (
                <span
                  style={{
                    padding: '0.2rem 0.55rem',
                    backgroundColor: 'var(--color-primary-tint)',
                    color: 'var(--color-primary)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    letterSpacing: '0.02em',
                  }}
                >
                  {profile.grade_level.replace('G', 'Grade ')}
                </span>
              )}

              {/* Match Ready Status Pill */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.2rem 0.55rem',
                  backgroundColor: '#ecfdf5',
                  color: '#047857',
                  border: '1px solid #a7f3d0',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                  }}
                />
                Match Ready
              </span>
            </div>

            {/* Quick Profile Verification Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.8125rem', color: '#4b5563' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                <CheckCircle2 size={14} color="#059669" strokeWidth={2.5} /> 9 Learning Sliders
              </span>
              <span style={{ color: '#d1d5db' }}>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                <CheckCircle2 size={14} color="#059669" strokeWidth={2.5} /> Contact Channels Set
              </span>
              {profile?.budget_max && (
                <>
                  <span style={{ color: '#d1d5db' }}>•</span>
                  <span style={{ fontWeight: 600, color: 'var(--fg-main)' }}>
                    Default Budget: <strong>฿{Number(profile.budget_max)}/hr</strong>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Action Button */}
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
          <Link to="/student/profile?returnTo=/student/matching" style={{ textDecoration: 'none' }}>
            <Button
              variant="secondary"
              style={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                height: '2.5rem',
                padding: '0 1.125rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <User size={14} strokeWidth={2.2} /> Edit Profile & Preferences
            </Button>
          </Link>
        </div>
      </Card>

      {/* 2. Attractive Student Homepage Hero Banner (Middle of the Page) */}
      <Card
        style={{
          padding: '3rem 2rem',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          border: '2px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
        }}
      >
        {/* Pill Tag */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.35rem 0.85rem',
            backgroundColor: 'var(--color-primary-tint)',
            color: 'var(--color-primary)',
            borderRadius: 'var(--radius-full)',
            fontWeight: 800,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          <Sparkles size={14} strokeWidth={2.4} />
          <span>Personalized Tutor Matchmaking • Grades 1–12</span>
        </div>

        {/* Main Headline */}
        <div style={{ maxWidth: '680px' }}>
          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              color: 'var(--fg-main)',
              letterSpacing: '-0.03em',
              margin: '0 0 0.75rem 0',
              lineHeight: 1.15,
            }}
          >
            Find Your Ideal Verified Tutor in Thailand
          </h1>
          <p
            style={{
              fontSize: '1.0625rem',
              color: '#4b5563',
              lineHeight: 1.55,
              margin: 0,
              fontWeight: 500,
            }}
          >
            Tired of gambling on random tutors from social media? TutorPair uses smart learning-style matching across 9 key habits—like study pace, practice depth, and communication vibe—to pair you with top verified tutors who teach the way you learn best, within your budget and schedule.
          </p>
        </div>

        {/* 3 Key Value Highlights */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            width: '100%',
            maxWidth: '780px',
            marginTop: '0.25rem',
          }}
        >
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--color-muted)',
              borderRadius: 'var(--radius-md)',
              border: '2px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-primary-tint)',
                color: 'var(--color-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Zap size={18} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--fg-main)' }}>
                9 Study Style Sliders
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                Matches study pace, question style & learning vibe
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--color-muted)',
              borderRadius: 'var(--radius-md)',
              border: '2px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-secondary-tint)',
                color: 'var(--color-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={18} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--fg-main)' }}>
                Verified Credentials
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                Degrees & test proof vetted by Admin
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--color-muted)',
              borderRadius: 'var(--radius-md)',
              border: '2px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-accent-tint)',
                color: 'var(--color-accent)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Video size={18} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--fg-main)' }}>
                100% Online Lessons
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                Interactive live 1-on-1 video sessions
              </div>
            </div>
          </div>
        </div>

        {/* Center Primary Action CTA */}
        <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.625rem' }}>
          <Button
            type="button"
            variant="primary"
            onClick={handleToggleForm}
            style={{
              height: '3.75rem',
              padding: '0 3rem',
              fontSize: '1.125rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Sparkles size={20} strokeWidth={2.5} />
            <span>{isFormOpen ? 'Close Matching Form' : 'Matching Tutor'}</span>
            {isFormOpen ? <X size={18} /> : <ChevronDown size={18} />}
          </Button>
          <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: 0, fontWeight: 500 }}>
            {isFormOpen
              ? 'Fill in your subject and schedule in the form below'
              : 'Click "Matching Tutor" to choose your subject & find top 3 tutors instantly'}
          </p>
        </div>
      </Card>

      {/* 3. The Match Request Form (Revealed when isFormOpen = true) */}
      {isFormOpen && (
        <div ref={formRef} id="match-request-form">
          <Card
            style={{
              padding: '2.5rem 2rem',
              border: '2px solid var(--color-primary)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#ffffff',
            }}
          >
            {/* Form Header with Close Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.2rem 0.6rem', backgroundColor: 'var(--color-primary-tint)', color: 'var(--color-primary)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                  <Sparkles size={14} strokeWidth={2.5} /> Match Request Form
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--fg-main)', margin: '0 0 0.25rem 0' }}>
                  Submit Your Tutor Matching Request
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                  Select the specific subject variant, target budget, and your convenient schedule slots:
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                style={{
                  padding: '0.4rem 0.75rem',
                  border: '2px solid var(--color-border)',
                  backgroundColor: 'var(--color-muted)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  color: '#4b5563',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <X size={15} /> Close
              </button>
            </div>

            {/* Error Alert */}
            {submitError && (
              <Card style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', backgroundColor: '#fef2f2', border: '2px solid #ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b91c1c' }}>
                <AlertCircle size={18} />
                <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{submitError}</span>
              </Card>
            )}

            {/* Step 1: Single Subject Selection */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.2rem 0.6rem', backgroundColor: 'var(--color-primary-tint)', color: 'var(--color-primary)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                <Sparkles size={14} strokeWidth={2.5} /> Step 1: Select Subject for Match
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-main)', margin: '0 0 0.25rem 0' }}>
                What do you want to learn today?
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 1rem 0' }}>
                Choose the specific subject or exam preparation you need for this lesson (1 subject per matching request):
              </p>

              {/* 3-Step Cascading Subject Selector (Single Subject Mode) */}
              <StudentSubjectSelector
                selectedSubject={selectedSubject}
                onChange={(updated) => {
                  setSelectedSubject(updated);
                  setSubmitError(null);
                }}
              />
            </div>

            {/* Step 2: Budget & Online Tutoring Mode (Consistent with Tutor Rate Input) */}
            <div style={{ borderTop: '2px solid var(--color-border)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.2rem 0.6rem', backgroundColor: 'var(--color-primary-tint)', color: 'var(--color-primary)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.875rem', lineHeight: 1 }}>฿</span> Step 2: Lesson Budget
              </div>
              <h4 style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--fg-main)', margin: '0 0 0.25rem 0' }}>
                Budget & Delivery Mode
              </h4>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0 0 1rem 0' }}>
                Set your target hourly budget for this specific subject (THB / hr):
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', alignItems: 'flex-start' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#4b5563', marginBottom: '0.375rem' }}>
                    Max Hourly Budget (THB / hr) *
                  </label>

                  {/* Quick Budget Presets */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280' }}>Quick Tiers:</span>
                    {[
                      { label: '฿350 (Entry)', val: 350 },
                      { label: '฿500 (Popular)', val: 500 },
                      { label: '฿750 (Experienced)', val: 750 },
                      { label: '฿1,000 (Expert)', val: 1000 },
                    ].map((tier) => (
                      <button
                        key={tier.val}
                        type="button"
                        onClick={() => {
                          setMatchBudget(tier.val);
                          setSubmitError(null);
                        }}
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.25rem 0.5rem',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: matchBudget === tier.val ? 'var(--color-primary)' : 'var(--bg-canvas)',
                          color: matchBudget === tier.val ? '#ffffff' : 'var(--fg-main)',
                          border: matchBudget === tier.val ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {tier.label}
                      </button>
                    ))}
                  </div>

                  {/* Number Input with ฿ Currency Prefix matching Tutor SubjectSelector */}
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: '1rem',
                        fontWeight: 800,
                        color: (matchBudget === '' || Number(matchBudget) < 100) ? '#dc2626' : '#6b7280',
                        fontSize: '1rem',
                      }}
                    >
                      ฿
                    </span>
                    <input
                      type="number"
                      min="100"
                      max="10000"
                      step="50"
                      value={matchBudget}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === '') {
                          setMatchBudget('');
                        } else {
                          const parsed = parseInt(raw, 10);
                          setMatchBudget(isNaN(parsed) ? '' : Math.max(0, parsed));
                        }
                        setSubmitError(null);
                      }}
                      className="flat-input"
                      style={{
                        paddingLeft: '2.5rem',
                        fontWeight: 700,
                        borderColor: (matchBudget === '' || Number(matchBudget) < 100) ? '#dc2626' : undefined,
                      }}
                      placeholder="e.g. 500"
                    />
                  </div>

                  {/* Inline budget validation error */}
                  {matchBudget === '' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.375rem', color: '#dc2626', fontSize: '0.75rem', fontWeight: 700 }}>
                      <AlertCircle size={14} />
                      <span>Budget cannot be left blank. Please enter your preferred hourly rate (minimum ฿100/hr).</span>
                    </div>
                  ) : Number(matchBudget) === 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.375rem', color: '#dc2626', fontSize: '0.75rem', fontWeight: 700 }}>
                      <AlertCircle size={14} />
                      <span>Budget cannot be ฿0. Minimum hourly budget is ฿100/hr.</span>
                    </div>
                  ) : Number(matchBudget) < 100 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.375rem', color: '#dc2626', fontSize: '0.75rem', fontWeight: 700 }}>
                      <AlertCircle size={14} />
                      <span>Minimum hourly budget is ฿100/hr.</span>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.375rem 0 0 0' }}>
                      Pre-filled with your profile default. Adjust freely or tap a quick tier above.
                    </p>
                  )}
                </div>

                <div
                  style={{
                    padding: '1rem 1.25rem',
                    backgroundColor: 'var(--color-muted)',
                    borderRadius: 'var(--radius-md)',
                    border: '2px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.375rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.5rem',
                        backgroundColor: 'var(--color-secondary-tint)',
                        color: 'var(--color-secondary)',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <Video size={12} strokeWidth={2.5} /> 100% Online
                    </span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--fg-main)' }}>
                      Interactive Online Lessons
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, lineHeight: 1.4 }}>
                    All TutorPair lessons are conducted remotely via live video session with interactive whiteboard and screen sharing.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3: Preferred Lesson Schedule (Consistent with Tutor Availability Grid) */}
            <div style={{ borderTop: '2px solid var(--color-border)', paddingTop: '1.5rem', marginBottom: '1.75rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.2rem 0.6rem', backgroundColor: 'var(--color-primary-tint)', color: 'var(--color-primary)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                <Calendar size={14} strokeWidth={2.5} /> Step 3: Preferred Schedule
              </div>
              <h4 style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--fg-main)', margin: '0 0 0.25rem 0' }}>
                When are you free to study?
              </h4>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0 0 1rem 0' }}>
                Pick your preferred day and hours below. You can choose a quick preset or customize your exact times, then click <strong>Add Slot</strong> to build your schedule:
              </p>

              {/* Add Time Block Section - Matches Tutor AvailabilityGrid */}
              <div style={{ backgroundColor: 'var(--color-muted)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                <h5 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--fg-main)', margin: '0 0 0.75rem 0' }}>
                  Add Time Slot
                </h5>

                {/* Day of Week Selector - 7 Day Pills (MON - SUN) */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                  {DAYS_ORDER.map((day) => {
                    const isSelected = selectedDay === day;
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          setSelectedDay(day);
                          setSlotError(null);
                        }}
                        style={{
                          padding: '0.625rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--bg-canvas)',
                          color: isSelected ? 'var(--color-white)' : 'var(--fg-main)',
                          border: isSelected ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>

                {/* Quick Presets */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#4b5563' }}>Quick Presets:</span>
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleApplyPreset(p.start, p.end)}
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '0.3rem 0.625rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-canvas)',
                        border: '1px solid var(--color-border)',
                        cursor: 'pointer',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Time Picker Inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.375rem', color: 'var(--fg-main)' }}>
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={slotStartTime}
                      onChange={(e) => {
                        setSlotStartTime(e.target.value);
                        setSlotError(null);
                      }}
                      className="flat-input"
                      style={{ fontWeight: 700 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.375rem', color: 'var(--fg-main)' }}>
                      End Time
                    </label>
                    <input
                      type="time"
                      value={slotEndTime}
                      onChange={(e) => {
                        setSlotEndTime(e.target.value);
                        setSlotError(null);
                      }}
                      className="flat-input"
                      style={{ fontWeight: 700 }}
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={handleAddSlot}
                    variant="primary"
                    style={{ height: '3rem' }}
                  >
                    <Plus size={18} strokeWidth={2.4} />
                    Add {selectedDay.slice(0, 3)} Slot
                  </Button>
                </div>

                {slotError && (
                  <div style={{ fontSize: '0.8125rem', color: '#b91c1c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '1rem' }}>
                    <AlertCircle size={14} /> {slotError}
                  </div>
                )}
              </div>

              {/* Weekly Schedule Breakdown (7-Day Overview) — Matches Tutor AvailabilityGrid */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h5 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--fg-main)', margin: 0 }}>
                  Weekly Schedule Breakdown (7-Day Overview)
                </h5>
                {matchSlots.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setMatchSlots([])}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#6b7280',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Clear all slots
                  </button>
                )}
              </div>

              <div style={{ overflowX: 'auto', width: '100%', paddingBottom: '0.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(115px, 1fr))', gap: '0.75rem', minWidth: '720px' }}>
                  {DAYS_ORDER.map((day) => {
                    const daySlots = matchSlots
                      .filter((s) => s.day === day)
                      .sort((a, b) => a.startTime.localeCompare(b.startTime));

                    return (
                      <div
                        key={day}
                        style={{
                          backgroundColor: 'var(--color-muted)',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.875rem 0.625rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                          border: daySlots.length > 0 ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: '0.8125rem', textTransform: 'uppercase', color: 'var(--fg-main)', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.375rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{day.slice(0, 3)}</span>
                          {daySlots.length > 0 && (
                            <span style={{ fontSize: '0.6875rem', backgroundColor: 'var(--color-primary)', color: '#ffffff', borderRadius: 'var(--radius-full)', padding: '0.05rem 0.35rem', fontWeight: 800 }}>
                              {daySlots.length}
                            </span>
                          )}
                        </div>

                        {daySlots.length === 0 ? (
                          <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontStyle: 'italic', padding: '0.5rem 0', textAlign: 'center' }}>
                            Off day
                          </span>
                        ) : (
                          daySlots.map((slot) => (
                            <div
                              key={slot.id}
                              style={{
                                backgroundColor: 'var(--bg-canvas)',
                                padding: '0.45rem',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: 'var(--fg-main)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '0.25rem',
                                border: '1px solid var(--color-border)',
                              }}
                            >
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Clock size={12} strokeWidth={2.4} color="var(--color-primary)" />
                                {slot.startTime} - {slot.endTime}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSlot(slot.id)}
                                style={{ color: 'var(--color-danger)', cursor: 'pointer', padding: '0.1rem', background: 'none', border: 'none', display: 'inline-flex', alignItems: 'center' }}
                                title="Delete slot"
                              >
                                <Trash2 size={12} strokeWidth={2.4} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Search Summary & Action */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                backgroundColor: 'var(--color-muted)',
                borderRadius: 'var(--radius-md)',
                border: '2px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--fg-main)' }}>
                  Ready to Match:
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#4b5563', marginTop: '0.2rem' }}>
                  {selectedSubject ? (
                    <span>
                      Subject: <strong>{selectedSubject.subject_name} ({selectedSubject.variant_name})</strong> • Budget: <strong>{matchBudget ? `฿${matchBudget}/hr` : 'Not set'}</strong> • <strong>{matchSlots.length} schedule slot(s)</strong>
                    </span>
                  ) : (
                    <span style={{ color: '#9ca3af' }}>Select 1 subject above to calculate top tutor matches</span>
                  )}
                </div>
              </div>

              <Button
                type="button"
                variant="primary"
                onClick={handleFindTutors}
                style={{ height: '3.25rem', padding: '0 2rem', fontSize: '0.9375rem', fontWeight: 800 }}
              >
                <Sparkles size={16} style={{ marginRight: '0.375rem' }} /> Find Matched Tutors
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 4. Horizontal 3-Column Student Roadmap (Compact at the Bottom of Page) */}
      <div style={{ borderTop: '2px solid var(--color-border)', paddingTop: '2rem' }}>
        <StudentRoadmap
          layout="horizontal"
          isProfileComplete={isProfileReady}
          onOpenMatchForm={handleOpenForm}
          showHeader={true}
          title="How TutorPair Works: Your Step-by-Step Pathway"
          subtitle="From setting up your learning sliders to finding and confirming your verified tutor in Thailand."
          ctaText={!isStep1Done ? 'Start Setup: Step 1 →' : 'Continue Setup: Step 2 →'}
          ctaLink={!isStep1Done ? '/student/profile?tab=profile&returnTo=/student/matching' : '/student/profile?tab=sliders&returnTo=/student/matching'}
        />
      </div>
    </div>
  );
};

export const MatchHistoryPage: React.FC = () => {
  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Your Matching History</h2>
      <Card style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--color-muted)' }}>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: 600 }}>
          Matching history list (Module 6)
        </p>
      </Card>
    </div>
  );
};
