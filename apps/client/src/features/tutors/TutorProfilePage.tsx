import React from 'react';
import { useTutorProfile, useTutorVerification, useTutorSubjects, useTutorAvailability } from './hooks/useTutors';
import { TutorProfileForm } from './components/TutorProfileForm';
import { SubjectSelector } from './components/SubjectSelector';
import { AvailabilityGrid } from './components/AvailabilityGrid';
import { VerificationSection } from './components/VerificationSection';
import { Card, Button, PageHeader } from '../../components/ui';
import { Link, useSearchParams } from 'react-router-dom';
import {
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  Clock,
  XCircle,
  User,
  BookOpen,
  Calendar,
  FileCheck,
  Sliders,
  CheckCircle2,
  Lock,
  Bell,
  Target,
  Phone,
  MessageSquare,
} from 'lucide-react';
import { VerificationStatus } from '@tutorpair/shared';

export const TutorProfilePage: React.FC = () => {
  const { data: profile, isLoading: loadingProfile } = useTutorProfile();
  const { data: verification } = useTutorVerification();
  const { data: subjects = [] } = useTutorSubjects();
  const { data: availability = [] } = useTutorAvailability();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryTab = searchParams.get('tab');
  const isProfileView = Boolean(
    queryTab && ['profile', 'subjects', 'availability', 'documents'].includes(queryTab)
  );
  const activeProfileTab = (isProfileView ? queryTab : 'profile') as
    | 'profile'
    | 'subjects'
    | 'availability'
    | 'documents';

  if (loadingProfile) {
    return (
      <Card style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <p style={{ fontWeight: 700, fontSize: '1.125rem', color: '#6b7280' }}>
          Loading your tutor dashboard...
        </p>
      </Card>
    );
  }

  // If tutor does not have a profile yet (404), display onboarding journey roadmap
  if (!profile) {
    return (
      <div style={{ maxWidth: '920px', margin: '1rem auto 3rem auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Header Hero */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.375rem 0.75rem',
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
            <GraduationCap size={15} strokeWidth={2.4} />
            <span>Tutor Pathway</span>
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--fg-main)', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
            Welcome to TutorPair!
          </h1>
          <p style={{ color: '#4b5563', fontSize: '1rem', maxWidth: '560px', margin: '0 auto', lineHeight: 1.5, fontWeight: 500 }}>
            Follow these 3 simple steps to get verified and start receiving student bookings:
          </p>
        </div>

        {/* Vertical Connected Timeline (1 | 2 | 3) */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Step 1 Item */}
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            {/* Left Track (Node 1 + Spine) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '3rem', flexShrink: 0 }}>
              <span
                style={{
                  width: '3rem',
                  height: '3rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.25rem',
                }}
              >
                1
              </span>
              <div
                style={{
                  width: '3px',
                  flex: 1,
                  backgroundColor: 'var(--color-border)',
                  margin: '0.5rem 0',
                }}
              />
            </div>

            {/* Step 1 Card Content */}
            <div style={{ flex: 1, paddingBottom: '2rem' }}>
              <Card
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  border: '2px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-main)', margin: 0 }}>
                    Fill Application & Credentials
                  </h2>
                  <span
                    style={{
                      padding: '0.25rem 0.625rem',
                      backgroundColor: 'var(--color-primary-tint)',
                      color: 'var(--color-primary)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                    }}
                  >
                    ⏱️ Takes ~5 mins
                  </span>
                </div>

                <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0 }}>
                  Complete the 5 guided wizard sections to establish your profile and set your rates:
                </p>

                {/* 5 wizard parts (Vertical, concise 1-phrase items) */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.625rem',
                    backgroundColor: 'var(--color-muted)',
                    padding: '0.875rem 1rem',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <span style={{ color: 'var(--color-primary)', display: 'inline-flex' }}>
                      <User size={16} strokeWidth={2.4} />
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--fg-main)' }}>
                      1. Profile & Bio
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <span style={{ color: 'var(--color-primary)', display: 'inline-flex' }}>
                      <Sliders size={16} strokeWidth={2.4} />
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--fg-main)' }}>
                      2. Teaching Style & Personality (1–5 Sliders)
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <span style={{ color: 'var(--color-primary)', display: 'inline-flex' }}>
                      <BookOpen size={16} strokeWidth={2.4} />
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--fg-main)' }}>
                      3. Subjects & Hourly Rates
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <span style={{ color: 'var(--color-primary)', display: 'inline-flex' }}>
                      <Calendar size={16} strokeWidth={2.4} />
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--fg-main)' }}>
                      4. Weekly Availability Schedule
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                    <span style={{ color: 'var(--color-primary)', display: 'inline-flex', marginTop: '0.125rem' }}>
                      <FileCheck size={16} strokeWidth={2.4} />
                    </span>
                    <div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--fg-main)' }}>
                        5. Verification Documents Upload
                      </span>
                      <span style={{ fontSize: '0.8125rem', color: '#6b7280', marginLeft: '0.375rem' }}>
                        (Degree / Transcript, CV, Supporting Documents, and Subject-Specific Proofs)
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Step 2 Item */}
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            {/* Left Track (Node 2 + Spine) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '3rem', flexShrink: 0 }}>
              <span
                style={{
                  width: '3rem',
                  height: '3rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-accent)',
                  color: 'white',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.25rem',
                }}
              >
                2
              </span>
              <div
                style={{
                  width: '3px',
                  flex: 1,
                  backgroundColor: 'var(--color-border)',
                  margin: '0.5rem 0',
                }}
              />
            </div>

            {/* Step 2 Card Content */}
            <div style={{ flex: 1, paddingBottom: '2rem' }}>
              <Card
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  border: '2px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.875rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-main)', margin: 0 }}>
                    Administrator Review & Verification
                  </h2>
                  <span
                    style={{
                      padding: '0.25rem 0.625rem',
                      backgroundColor: 'var(--color-accent-tint)',
                      color: 'var(--color-accent)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                    }}
                  >
                    🛡️ 24–48 Hours
                  </span>
                </div>

                <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0 }}>
                  Our administration team reviews your uploaded academic transcripts and certificates to verify your identity and qualifications.
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.8125rem', color: '#4b5563', paddingTop: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Lock size={15} color="var(--color-accent)" />
                    <span>Documents remain strictly confidential & secure</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Bell size={15} color="var(--color-accent)" />
                    <span>Instant alerts via email & dashboard once approved</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Step 3 Item (Terminal Node) */}
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            {/* Left Track (Node 3 without spine below) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '3rem', flexShrink: 0 }}>
              <span
                style={{
                  width: '3rem',
                  height: '3rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-secondary)',
                  color: 'white',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.25rem',
                }}
              >
                3
              </span>
            </div>

            {/* Step 3 Card Content */}
            <div style={{ flex: 1, paddingBottom: '0.5rem' }}>
              <Card
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  border: '2px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  display: 'flex',

                  flexDirection: 'column',
                  gap: '0.875rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-main)', margin: 0 }}>
                    Match with Students & Start Teaching
                  </h2>
                  <span
                    style={{
                      padding: '0.25rem 0.625rem',
                      backgroundColor: 'var(--color-secondary-tint)',
                      color: 'var(--color-secondary)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                    }}
                  >
                    🎉 Ready to Earn
                  </span>
                </div>

                <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0 }}>
                  Your verified profile goes live! Students find you via intelligent matchmaking and book lessons directly into your schedule.
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.8125rem', color: '#4b5563', paddingTop: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Target size={15} color="var(--color-secondary)" />
                    <span>Algorithmic matching based on style & subject fit</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={15} color="var(--color-secondary)" />
                    <span>Students view your CV and contact you</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Action Callout Card */}
        <div
          style={{
            backgroundColor: 'var(--bg-canvas)',
            border: '2px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem 1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-main)', marginBottom: '0.25rem' }}>
              Ready to start your tutor journey?
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Takes only ~5 minutes to complete your application.
            </p>
          </div>

          <Link to="/tutor/onboarding" style={{ textDecoration: 'none' }}>
            <Button
              variant="primary"
              style={{
                height: '3.25rem',
                padding: '0 2.25rem',
                fontSize: '1rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              Start Tutor Application
              <ArrowRight size={18} strokeWidth={2.4} />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const status = verification?.verification_status ?? VerificationStatus.PENDING;
  const rejectionReason = verification?.rejection_reason;
  const docs = verification?.documents ?? [];

  const isSubmittedOrReviewed =
    status === VerificationStatus.APPROVED ||
    status === VerificationStatus.REJECTED ||
    (status === VerificationStatus.PENDING && docs.length >= 2);

  // If tutor has started onboarding (profile created) but not yet submitted verification documents
  if (!isSubmittedOrReviewed) {
    const step3Done = subjects.length > 0;
    const step4Done = availability.length > 0;

    let completedCount = 2; // Steps 1 and 2 are saved when profile exists
    if (step3Done) completedCount++;
    if (step4Done) completedCount++;

    let nextStep = 3;
    let nextStepTitle = 'Subjects & Rates';

    if (step3Done && !step4Done) {
      nextStep = 4;
      nextStepTitle = 'Weekly Availability';
    } else if (step3Done && step4Done) {
      nextStep = 5;
      nextStepTitle = 'Verification Documents';
    }

    const progressPercent = Math.round((completedCount / 5) * 100);

    return (
      <div style={{ maxWidth: '920px', margin: '1rem auto 3rem auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Welcome Back & Hero Progress Card */}
        <div
          style={{
            backgroundColor: 'var(--bg-canvas)',
            border: '2px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.35rem 0.75rem',
                  backgroundColor: 'var(--color-primary-tint)',
                  color: 'var(--color-primary)',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.5rem',
                }}
              >
                <Clock size={14} strokeWidth={2.4} />
                <span>Application In Progress</span>
              </div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--fg-main)', letterSpacing: '-0.02em', margin: 0 }}>
                Welcome back, {profile.first_name}!
              </h1>
              <p style={{ color: '#4b5563', fontSize: '0.9375rem', marginTop: '0.375rem', maxWidth: '600px' }}>
                You have completed <strong>{completedCount} of 5</strong> sections. Your previous entries are securely saved. Pick up where you left off or review your details below.
              </p>
            </div>

            <Link to={`/tutor/onboarding?step=${nextStep}`} style={{ textDecoration: 'none' }}>
              <Button
                variant="primary"
                style={{
                  height: '3.25rem',
                  padding: '0 1.75rem',
                  fontSize: '1rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                Continue Application (Step {nextStep}: {nextStepTitle})
                <ArrowRight size={18} strokeWidth={2.4} />
              </Button>
            </Link>
          </div>

          {/* Progress Bar Container */}
          <div style={{ marginTop: '0.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--fg-main)' }}>
              <span>Overall Application Progress</span>
              <span style={{ color: 'var(--color-secondary)' }}>{progressPercent}% Complete</span>
            </div>
            <div
              style={{
                width: '100%',
                height: '0.75rem',
                backgroundColor: 'var(--color-muted)',
                borderRadius: 'var(--radius-full)',
                border: '2px solid var(--color-border)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  backgroundColor: 'var(--color-secondary)',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        </div>

        {/* 5-Step Breakdown Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-main)', margin: '0.5rem 0 0.25rem 0' }}>
            Application Checklist
          </h2>

          {/* Step 1 Item */}
          <Card
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              backgroundColor: 'var(--bg-canvas)',
              border: '2px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-secondary)',
                  color: 'white',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <CheckCircle2 size={18} strokeWidth={2.4} />
              </span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--fg-main)' }}>
                    1. Personal Info &amp; Bio
                  </h3>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--color-secondary-tint)',
                      color: 'var(--color-secondary)',
                    }}
                  >
                    Completed
                  </span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0.2rem 0 0 0' }}>
                  {profile.first_name} {profile.last_name} • {profile.phone_number} • {profile.tutor_type}
                </p>
              </div>
            </div>

            <Link
              to="/tutor/onboarding?step=1"
              style={{
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'var(--color-secondary)',
                textDecoration: 'none',
              }}
            >
              Review / Edit
            </Link>
          </Card>

          {/* Step 2 Item */}
          <Card
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              backgroundColor: 'var(--bg-canvas)',
              border: '2px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-secondary)',
                  color: 'white',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <CheckCircle2 size={18} strokeWidth={2.4} />
              </span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--fg-main)' }}>
                    2. Teaching Style &amp; Personality Sliders
                  </h3>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--color-secondary-tint)',
                      color: 'var(--color-secondary)',
                    }}
                  >
                    Completed
                  </span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0.2rem 0 0 0' }}>
                  5 Matchmaking Style &amp; 4 Personality traits configured
                </p>
              </div>
            </div>

            <Link
              to="/tutor/onboarding?step=2"
              style={{
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'var(--color-secondary)',
                textDecoration: 'none',
              }}
            >
              Review / Edit
            </Link>
          </Card>

          {/* Step 3 Item */}
          <Card
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              backgroundColor: 'var(--bg-canvas)',
              border: nextStep === 3 ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: step3Done ? 'var(--color-secondary)' : nextStep === 3 ? 'var(--color-primary)' : 'var(--color-border)',
                  color: 'white',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {step3Done ? <CheckCircle2 size={18} strokeWidth={2.4} /> : <BookOpen size={18} strokeWidth={2.4} />}
              </span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--fg-main)' }}>
                    3. Teaching Subjects &amp; Rates
                  </h3>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: step3Done ? 'var(--color-secondary-tint)' : 'var(--color-primary-tint)',
                      color: step3Done ? 'var(--color-secondary)' : 'var(--color-primary)',
                    }}
                  >
                    {step3Done ? `${subjects.length} Subject(s) Saved` : 'Next Up'}
                  </span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0.2rem 0 0 0' }}>
                  {step3Done
                    ? subjects.map((s) => s.subject_name).join(', ')
                    : 'Target curriculum, grade levels (G1–G12), and hourly pricing.'}
                </p>
              </div>
            </div>

            <Link
              to="/tutor/onboarding?step=3"
              style={{
                fontSize: '0.875rem',
                fontWeight: 700,
                color: step3Done ? 'var(--color-secondary)' : 'var(--color-primary)',
                textDecoration: 'none',
              }}
            >
              {step3Done ? 'Review / Edit' : 'Configure →'}
            </Link>
          </Card>

          {/* Step 4 Item */}
          <Card
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              backgroundColor: 'var(--bg-canvas)',
              border: nextStep === 4 ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: step4Done ? 'var(--color-secondary)' : nextStep === 4 ? 'var(--color-primary)' : 'var(--color-border)',
                  color: 'white',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {step4Done ? <CheckCircle2 size={18} strokeWidth={2.4} /> : nextStep === 4 ? <Calendar size={18} strokeWidth={2.4} /> : <Lock size={16} strokeWidth={2.4} />}
              </span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--fg-main)' }}>
                    4. Weekly Availability Schedule
                  </h3>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: step4Done
                        ? 'var(--color-secondary-tint)'
                        : nextStep === 4
                          ? 'var(--color-primary-tint)'
                          : 'var(--color-muted)',
                      color: step4Done
                        ? 'var(--color-secondary)'
                        : nextStep === 4
                          ? 'var(--color-primary)'
                          : '#6b7280',
                    }}
                  >
                    {step4Done ? `${availability.length} Slots Saved` : nextStep === 4 ? 'Next Up' : 'Locked'}
                  </span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0.2rem 0 0 0' }}>
                  {step4Done
                    ? `${availability.length} active weekly teaching time slots configured`
                    : 'Interactive weekly grid to mark available teaching slots.'}
                </p>
              </div>
            </div>

            {step4Done || nextStep === 4 ? (
              <Link
                to="/tutor/onboarding?step=4"
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: step4Done ? 'var(--color-secondary)' : 'var(--color-primary)',
                  textDecoration: 'none',
                }}
              >
                {step4Done ? 'Review / Edit' : 'Set Hours →'}
              </Link>
            ) : (
              <span style={{ fontSize: '0.8125rem', color: '#9ca3af', fontWeight: 600 }}>Follows Step 3</span>
            )}
          </Card>

          {/* Step 5 Item */}
          <Card
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              backgroundColor: 'var(--bg-canvas)',
              border: nextStep === 5 ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: nextStep === 5 ? 'var(--color-primary)' : 'var(--color-border)',
                  color: 'white',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {nextStep === 5 ? <FileCheck size={18} strokeWidth={2.4} /> : <Lock size={16} strokeWidth={2.4} />}
              </span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--fg-main)' }}>
                    5. Verification Documents Upload
                  </h3>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: nextStep === 5 ? 'var(--color-primary-tint)' : 'var(--color-muted)',
                      color: nextStep === 5 ? 'var(--color-primary)' : '#6b7280',
                    }}
                  >
                    {nextStep === 5 ? 'Ready to Upload' : 'Final Step'}
                  </span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0.2rem 0 0 0' }}>
                  Degree transcript, CV / resume, and subject certificates for administrator review.
                </p>
              </div>
            </div>

            {nextStep === 5 ? (
              <Link
                to="/tutor/onboarding?step=5"
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  textDecoration: 'none',
                }}
              >
                Upload &amp; Submit →
              </Link>
            ) : (
              <span style={{ fontSize: '0.8125rem', color: '#9ca3af', fontWeight: 600 }}>Follows Step 4</span>
            )}
          </Card>
        </div>

        {/* Post-Submit Roadmap Explainer */}
        <Card
          style={{
            backgroundColor: 'var(--color-muted)',
            border: '2px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
          }}
        >
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--fg-main)', margin: '0 0 0.5rem 0' }}>
            What happens after you submit?
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0, lineHeight: 1.5 }}>
            Once you submit in Step 5, your application enters the <strong>Administrator Review Queue (24–48 hours)</strong>. All navbar sections (Teaching Subjects, Availability, Verification &amp; Docs) unlock immediately so you can view your profile and refine rates or schedules anytime while awaiting approval.
          </p>
        </Card>
      </div>
    );
  }

  // View 1: My Profile & Application Management Hub (Tabs: Profile, Subjects, Availability, Documents)
  if (isProfileView) {
    return (
      <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Header */}
        <PageHeader
          title="My Profile & Teaching Hub"
          description="Review and update your personal details, teaching subjects, availability schedule, and verification credentials."
        />

        {/* 4-Tab Management Navigation Bar */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            backgroundColor: 'var(--bg-canvas)',
            padding: '0.5rem',
            borderRadius: 'var(--radius-lg)',
            border: '2px solid var(--color-border)',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'profile', label: 'Profile & Style', icon: User },
            { id: 'subjects', label: 'Subjects & Rates', icon: BookOpen },
            { id: 'availability', label: 'Weekly Schedule', icon: Calendar },
            { id: 'documents', label: 'Verification Docs', icon: FileCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeProfileTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSearchParams({ tab: tab.id })}
                style={{
                  flex: 1,
                  minWidth: '170px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.875rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  backgroundColor: isActive ? 'var(--color-secondary)' : 'transparent',
                  color: isActive ? 'var(--color-white)' : 'var(--fg-main)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={18} strokeWidth={2.4} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        {activeProfileTab === 'profile' && (
          <TutorProfileForm initialData={profile} mode="edit" />
        )}

        {activeProfileTab === 'subjects' && (
          <SubjectSelector showSaveButton={true} />
        )}

        {activeProfileTab === 'availability' && (
          <AvailabilityGrid showSaveButton={true} />
        )}

        {activeProfileTab === 'documents' && (
          <VerificationSection />
        )}
      </div>
    );
  }

  // View 2: State-Based Dashboard Overview (Clean: Hero Banner + Quick Metrics + Matched Students)
  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Status Hero Card */}
      {status === VerificationStatus.PENDING && (
        <div
          style={{
            backgroundColor: 'var(--color-accent-tint)',
            border: '2px solid var(--color-accent)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.75rem 2rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1.25rem',
          }}
        >
          <span
            style={{
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-white)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Clock size={28} strokeWidth={2.4} />
          </span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--fg-main)', margin: 0 }}>
                Application Under Admin Review
              </h2>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '0.2rem 0.625rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-accent)',
                  color: 'var(--color-white)',
                }}
              >
                Status: Pending
              </span>
            </div>
            <p style={{ fontSize: '0.9375rem', color: '#4b5563', marginTop: '0.5rem', lineHeight: 1.5, margin: 0 }}>
              Your application and verification documents are queued for review (typically 24–48 hours). You will receive email and in-app notification once your application is approved or if any additional information is required.
            </p>
          </div>
        </div>
      )}

      {status === VerificationStatus.APPROVED && (
        <div
          style={{
            backgroundColor: 'var(--color-secondary)',
            color: 'var(--color-white)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.75rem 2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
          }}
        >
          <span
            style={{
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'var(--color-white)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={28} strokeWidth={2.4} />
          </span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 800, margin: 0 }}>
                Verified Tutor Profile
              </h2>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '0.2rem 0.625rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                }}
              >
                Status: Active
              </span>
            </div>
            <p style={{ opacity: 0.95, fontSize: '0.9375rem', marginTop: '0.375rem', margin: 0 }}>
              Your profile is active in the student matchmaking algorithm!
            </p>
          </div>
        </div>
      )}

      {status === VerificationStatus.REJECTED && (
        <div
          style={{
            backgroundColor: 'var(--color-danger-tint)',
            border: '2px solid var(--color-danger)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.75rem 2rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1.25rem',
          }}
        >
          <span
            style={{
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-danger)',
              color: 'var(--color-white)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <XCircle size={28} strokeWidth={2.4} />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-danger)', margin: 0 }}>
                Verification Incomplete — Action Needed
              </h2>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '0.2rem 0.625rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-danger)',
                  color: 'var(--color-white)',
                }}
              >
                Status: Needs Changes
              </span>
            </div>
            {rejectionReason && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.875rem 1rem',
                  backgroundColor: 'var(--bg-canvas)',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  color: 'var(--fg-main)',
                  borderLeft: '4px solid var(--color-danger)',
                }}
              >
                <strong>Admin Feedback:</strong> {rejectionReason}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0 }}>
                Please update your certificates or transcripts to satisfy verification requirements.
              </p>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setSearchParams({ tab: 'documents' })}
              >
                Update Verification Docs →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Metrics & Contact Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
        }}
      >
        <Card style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>
            Teaching Subjects
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--fg-main)', marginTop: '0.25rem' }}>
            {subjects.length}
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.25rem', margin: 0 }}>
            {subjects.length > 0
              ? subjects.map((s) => s.subject_name).join(', ')
              : 'No subjects configured yet'}
          </p>
        </Card>

        <Card style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>
            Weekly Availability
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--fg-main)', marginTop: '0.25rem' }}>
            {availability.length} Slots
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.25rem', margin: 0 }}>
            Available teaching time slots per week
          </p>
        </Card>

        <Card style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>
            Your Contact Info
          </div>
          <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--fg-main)', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Phone size={15} color="var(--color-primary)" />
              <span>{profile.phone_number}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={15} color="var(--color-secondary)" />
              <span>
                LINE ID: <strong>{profile.line_id ? profile.line_id : 'Not set'}</strong>
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Matched Students Section (For APPROVED status) */}
      {status === VerificationStatus.APPROVED && (
        <Card style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-main)', margin: 0 }}>
                Matched Students &amp; Trial Inquiries
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                Students matched to your profile via learning style compatibility and subject requirements.
              </p>
            </div>
            <span
              style={{
                padding: '0.25rem 0.625rem',
                backgroundColor: 'var(--color-secondary-tint)',
                color: 'var(--color-secondary)',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 800,
              }}
            >
              Algorithmic Matchmaking Active
            </span>
          </div>

          {/* Matched Student Card Preview */}
          <div
            style={{
              border: '2px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              backgroundColor: 'var(--bg-canvas)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div
                style={{
                  width: '3rem',
                  height: '3rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-primary-tint)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.125rem',
                }}
              >
                NW
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                  <h4 style={{ fontSize: '1.0625rem', fontWeight: 800, margin: 0, color: 'var(--fg-main)' }}>
                    Napasorn W.
                  </h4>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.15rem 0.5rem',
                      backgroundColor: 'var(--color-muted)',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 700,
                      color: '#4b5563',
                    }}
                  >
                    Grade 10 • High School
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.15rem 0.5rem',
                      backgroundColor: 'var(--color-secondary-tint)',
                      color: 'var(--color-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 800,
                    }}
                  >
                    94% Compatibility
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.5rem', flexWrap: 'wrap', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--fg-main)', fontWeight: 600 }}>
                    Subject: <strong>Mathematics (IGCSE)</strong>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#4b5563' }}>
                    <Phone size={14} color="var(--color-primary)" />
                    +66 81 234 5678
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#4b5563' }}>
                    <MessageSquare size={14} color="var(--color-secondary)" />
                    LINE ID: <strong>@napasorn_w</strong>
                  </span>
                </div>
              </div>
            </div>

          </div>
        </Card>
      )}

    </div>
  );
};
