import React, { useState, useEffect } from 'react';
import { Card, Button } from '../../components/ui';
import { Link } from 'react-router-dom';
import { useStudentProfile } from '../students/hooks/useStudents';
import { useAuthStore } from '../../store/auth.store';
import {
  Sparkles,
  CheckCircle2,
  Calendar,
  User,
  Compass,
  ShieldCheck,
  Target,
  ArrowRight,
  DollarSign,
  ChevronUp,
  ChevronDown,
  HelpCircle,
  UserCheck,
  BookOpen,
} from 'lucide-react';

const FAQS = [
  {
    q: 'How does TutorPair find the right tutor for me?',
    a: 'We match you based on how you learn best, your available study hours, and your comfortable budget. Instead of scrolling through dozens of random profiles, our system connects you directly with top verified tutors in Thailand whose teaching style fits your needs.',
  },
  {
    q: 'How do I contact my tutor after matching?',
    a: 'Once you choose a tutor from your top recommendations, both you and your tutor unlock each other’s phone number and LINE ID. You can easily message or call them directly to schedule lessons, ask questions, or arrange a trial class.',
  },
  {
    q: 'Are tutor prices transparent?',
    a: 'Yes, 100%! Every tutor sets their own hourly rate with complete transparency. You pay exactly the listed rate with zero hidden platform cuts, booking fees, or surprise charges.',
  },
  {
    q: 'What if a tutor isn’t the right fit for me?',
    a: 'You can easily request a new tutor match at any time or update your learning style sliders in your profile. Plus, after each lesson you can leave an honest review on teaching quality, punctuality, and materials so you always get the best experience.',
  },
];

export const MatchingPage: React.FC = () => {
  const { user } = useAuthStore();
  const { data: profile, isLoading } = useStudentProfile();

  // Ensure page starts at the top
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  // Derive profile completion directly from server profile state
  const isStep1Done = Boolean(
    profile &&
    profile.first_name &&
    profile.last_name &&
    profile.phone_number &&
    profile.grade_level
  );

  const isStep2Done = Boolean(
    isStep1Done &&
    profile &&
    profile.style_profile &&
    profile.style_profile.length === 5 &&
    profile.personality_profile &&
    profile.personality_profile.length === 4
  );

  const isProfileReady = isStep1Done && isStep2Done;

  // FAQ accordion state
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

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
  // Dedicated Student Pathway Guide matching TutorProfilePage style
  // (Zero locked tasks, zero disabled padlocks — purely an educational guide with single CTA)
  // =========================================================================
  if (!isProfileReady) {
    return (
      <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Welcome Header */}
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
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
            <Sparkles size={14} strokeWidth={2.4} />
            <span>Student Pathway</span>
          </div>
          <h1
            style={{
              fontSize: '2.25rem',
              fontWeight: 800,
              color: 'var(--fg-main)',
              letterSpacing: '-0.02em',
              marginBottom: '0.5rem',
            }}
          >
            Welcome to TutorPair!
          </h1>
          <p
            style={{
              color: '#4b5563',
              fontSize: '1rem',
              maxWidth: '620px',
              margin: '0 auto',
              lineHeight: 1.5,
              fontWeight: 500,
            }}
          >
            Follow these 3 simple steps to find, match, and learn with your ideal verified tutor in Thailand:
          </p>
        </div>

        {/* Vertical Connected Timeline (1 | 2 | 3) as an Educational Guide */}
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
                    1. Set Up Profile &amp; Study Style
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
                    ⏱️ Takes ~3 mins
                  </span>
                </div>

                <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0, lineHeight: 1.5 }}>
                  Tell us your grade, contact details, and how you learn best so we can pair you with the right tutors:
                </p>

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
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                    <span style={{ color: 'var(--color-primary)', display: 'inline-flex', marginTop: '0.125rem' }}>
                      <User size={16} strokeWidth={2.4} />
                    </span>
                    <div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--fg-main)' }}>
                        Grade Level &amp; Contact Info
                      </span>
                      <span style={{ fontSize: '0.8125rem', color: '#6b7280', marginLeft: '0.375rem' }}>
                        (Grade G1–G12, phone number, and optional LINE ID)
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                    <span style={{ color: 'var(--color-primary)', display: 'inline-flex', marginTop: '0.125rem' }}>
                      <Compass size={16} strokeWidth={2.4} />
                    </span>
                    <div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--fg-main)' }}>
                        Learning Style Preferences
                      </span>
                      <span style={{ fontSize: '0.8125rem', color: '#6b7280', marginLeft: '0.375rem' }}>
                        (Fast-paced vs step-by-step, concepts vs practice exercises, and tutor vibe)
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                    <span style={{ color: 'var(--color-primary)', display: 'inline-flex', marginTop: '0.125rem' }}>
                      <Calendar size={16} strokeWidth={2.4} />
                    </span>
                    <div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--fg-main)' }}>
                        Your Weekly Free Hours
                      </span>
                      <span style={{ fontSize: '0.8125rem', color: '#6b7280', marginLeft: '0.375rem' }}>
                        (The days and times you are free to study during the week)
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
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-main)', margin: 0 }}>
                    2. Choose Subject &amp; Request a Match
                  </h2>
                  <span
                    style={{
                      padding: '0.25rem 0.625rem',
                      backgroundColor: '#eff6ff',
                      color: 'var(--color-accent)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                    }}
                  >
                    🎯 Instant Matching
                  </span>
                </div>

                <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0, lineHeight: 1.5 }}>
                  Tell us what subject or exam you need help with and set your budget:
                </p>

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
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                    <span style={{ color: 'var(--color-accent)', display: 'inline-flex', marginTop: '0.125rem' }}>
                      <BookOpen size={16} strokeWidth={2.4} />
                    </span>
                    <div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--fg-main)' }}>
                        Select Subject &amp; Learning Goal
                      </span>
                      <span style={{ fontSize: '0.8125rem', color: '#6b7280', marginLeft: '0.375rem' }}>
                        (School curriculum, English &amp; foreign languages, or entrance exams)
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                    <span style={{ color: 'var(--color-accent)', display: 'inline-flex', marginTop: '0.125rem' }}>
                      <DollarSign size={16} strokeWidth={2.4} />
                    </span>
                    <div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--fg-main)' }}>
                        Set Hourly Budget &amp; Free Time
                      </span>
                      <span style={{ fontSize: '0.8125rem', color: '#6b7280', marginLeft: '0.375rem' }}>
                        (Comfortable rate per hour and times you prefer to study)
                      </span>
                    </div>
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
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-main)', margin: 0 }}>
                    3. Connect with Matched Tutors &amp; Start Learning
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
                    🎉 100% Online
                  </span>
                </div>

                <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0, lineHeight: 1.5 }}>
                  Receive your top verified tutor recommendations tailored specifically to you:
                </p>

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
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                    <span style={{ color: 'var(--color-secondary)', display: 'inline-flex', marginTop: '0.125rem' }}>
                      <ShieldCheck size={16} strokeWidth={2.4} />
                    </span>
                    <div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--fg-main)' }}>
                        100% Verified Tutors
                      </span>
                      <span style={{ fontSize: '0.8125rem', color: '#6b7280', marginLeft: '0.375rem' }}>
                        (Degrees and identity checked and approved by our team)
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                    <span style={{ color: 'var(--color-secondary)', display: 'inline-flex', marginTop: '0.125rem' }}>
                      <CheckCircle2 size={16} strokeWidth={2.4} />
                    </span>
                    <div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--fg-main)' }}>
                        Direct Communication
                      </span>
                      <span style={{ fontSize: '0.8125rem', color: '#6b7280', marginLeft: '0.375rem' }}>
                        (Chat and call directly on Phone or LINE to plan your lessons)
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                    <span style={{ color: 'var(--color-secondary)', display: 'inline-flex', marginTop: '0.125rem' }}>
                      <Target size={16} strokeWidth={2.4} />
                    </span>
                    <div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--fg-main)' }}>
                        ⭐ Honest Student Reviews
                      </span>
                      <span style={{ fontSize: '0.8125rem', color: '#6b7280', marginLeft: '0.375rem' }}>
                        (Rate lessons on teaching quality, punctuality, and materials)
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Action Callout Card at Bottom (Exact match to TutorProfilePage) */}
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
              Ready to find your ideal tutor?
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
              Takes only ~3 minutes to complete your profile &amp; learning style sliders.
            </p>
          </div>

          <Link to="/student/onboarding" style={{ textDecoration: 'none' }}>
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
              Start Student Onboarding <ArrowRight size={18} strokeWidth={2.4} />
            </Button>
          </Link>
        </div>
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
          <Link to="/student/profile" style={{ textDecoration: 'none' }}>
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

      {/* 2. Hero Action Card (Student Landing Hub CTA) */}
      <Card
        style={{
          padding: '2rem 2.25rem',
          backgroundColor: 'var(--color-primary-tint)',
          border: '2px solid var(--color-primary)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div style={{ maxWidth: '620px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.25rem 0.625rem',
              backgroundColor: '#ffffff',
              color: 'var(--color-primary)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 800,
              marginBottom: '0.625rem',
              border: '1px solid var(--color-primary)',
            }}
          >
            <Sparkles size={13} strokeWidth={2.5} /> PERSONALIZED MATCHING
          </div>
          <h2
            style={{
              fontSize: '1.625rem',
              fontWeight: 900,
              color: 'var(--fg-main)',
              margin: '0 0 0.5rem 0',
              lineHeight: 1.25,
            }}
          >
            Find Your Ideal Verified Tutor in Thailand
          </h2>
          <p
            style={{
              fontSize: '0.9375rem',
              color: '#4b5563',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Get tutor recommendations tailored to how you learn best, your schedule, and your budget. Tell us what you want to learn to get started.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link to="/student/matching/request" style={{ textDecoration: 'none' }}>
            <Button
              variant="primary"
              style={{
                fontSize: '1rem',
                fontWeight: 800,
                height: '3.25rem',
                padding: '0 1.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: 'none',
              }}
            >
              <Sparkles size={18} strokeWidth={2.5} /> Start Match Request ✨
            </Button>
          </Link>
          <Link to="/student/matches" style={{ textDecoration: 'none' }}>
            <Button
              variant="outline"
              style={{
                fontSize: '0.875rem',
                fontWeight: 700,
                height: '3.25rem',
                padding: '0 1.25rem',
                backgroundColor: '#ffffff',
              }}
            >
              View Match History →
            </Button>
          </Link>
        </div>
      </Card>

      {/* 3. Your Chosen Tutors & Connected Lessons */}
      <Card
        style={{
          padding: '2rem',
          backgroundColor: '#ffffff',
          border: '2px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.2rem 0.6rem',
                backgroundColor: 'var(--color-secondary-tint)',
                color: 'var(--color-secondary)',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 800,
                marginBottom: '0.375rem',
              }}
            >
              <UserCheck size={14} strokeWidth={2.5} /> MY CHOSEN TUTORS
            </div>
            <h3 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--fg-main)', margin: '0 0 0.25rem 0' }}>
              Your Chosen Tutors &amp; Direct Contacts
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
              When you select a tutor from your match results, their contact channels (Phone &amp; LINE) will appear here so you can message them directly.
            </p>
          </div>

          <Link to="/student/matches" style={{ textDecoration: 'none' }}>
            <Button
              variant="outline"
              style={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                height: '2.5rem',
                padding: '0 1.125rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
              }}
            >
              View Match History &amp; Results →
            </Button>
          </Link>
        </div>

        {/* Empty / Prompt State Box for Chosen Tutors */}
        <div
          style={{
            padding: '1.5rem',
            backgroundColor: 'var(--color-muted)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span
              style={{
                width: '3rem',
                height: '3rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: '#ffffff',
                border: '2px solid var(--color-border)',
                color: '#6b7280',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <UserCheck size={22} strokeWidth={2.2} />
            </span>
            <div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--fg-main)' }}>
                No Chosen Tutors Yet
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.2rem', lineHeight: 1.45 }}>
                Submit a match request to receive your top tutor recommendations. Once you pick a tutor, their direct contact channels will appear here.
              </div>
            </div>
          </div>

          <Link to="/student/matching/request" style={{ textDecoration: 'none' }}>
            <Button
              variant="primary"
              style={{
                fontSize: '0.8125rem',
                fontWeight: 800,
                height: '2.5rem',
                padding: '0 1.25rem',
                whiteSpace: 'nowrap',
              }}
            >
              <Sparkles size={14} style={{ marginRight: '0.375rem' }} /> Start Match Request
            </Button>
          </Link>
        </div>
      </Card>

      {/* 5. Frequently Asked Questions (FAQ) Accordion */}
      <Card
        style={{
          padding: '2rem',
          border: '2px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: '#ffffff',
        }}
      >
        <div style={{ marginBottom: '1.25rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.2rem 0.6rem',
              backgroundColor: 'var(--color-muted)',
              color: 'var(--fg-main)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 800,
              marginBottom: '0.375rem',
            }}
          >
            <HelpCircle size={14} strokeWidth={2.5} /> STUDENT FAQ
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-main)', margin: '0 0 0.25rem 0' }}>
            Frequently Asked Questions
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
            Everything you need to know about tutor matchmaking, lesson coordination, and quality standards:
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {FAQS.map((faq, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <div
                key={idx}
                style={{
                  border: isExpanded ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isExpanded ? '#fafafa' : '#ffffff',
                  overflow: 'hidden',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--fg-main)' }}>
                    {faq.q}
                  </span>
                  <span style={{ color: isExpanded ? 'var(--color-primary)' : '#9ca3af', display: 'inline-flex' }}>
                    {isExpanded ? <ChevronUp size={18} strokeWidth={2.5} /> : <ChevronDown size={18} strokeWidth={2.5} />}
                  </span>
                </button>

                {isExpanded && (
                  <div
                    style={{
                      padding: '0 1.25rem 1.125rem 1.25rem',
                      fontSize: '0.875rem',
                      color: '#4b5563',
                      lineHeight: 1.55,
                      borderTop: '1px solid var(--color-border)',
                      paddingTop: '0.875rem',
                    }}
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* 6. TutorPair Student Protections & Guarantees */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem',
          paddingTop: '0.5rem',
        }}
      >
        <Card
          style={{
            padding: '1.5rem',
            border: '2px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
          }}
        >
          <div
            style={{
              padding: '0.625rem',
              backgroundColor: 'var(--color-secondary-tint)',
              color: 'var(--color-secondary)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={22} strokeWidth={2.4} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--fg-main)', margin: '0 0 0.25rem 0' }}>
              100% Verified Tutors
            </h4>
            <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: 0, lineHeight: 1.45 }}>
              Degrees, national IDs, and credentials individually checked by our team so you can learn with confidence.
            </p>
          </div>
        </Card>

        <Card
          style={{
            padding: '1.5rem',
            border: '2px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
          }}
        >
          <div
            style={{
              padding: '0.625rem',
              backgroundColor: 'var(--color-primary-tint)',
              color: 'var(--color-primary)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <DollarSign size={22} strokeWidth={2.4} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--fg-main)', margin: '0 0 0.25rem 0' }}>
              Transparent Hourly Rates
            </h4>
            <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: 0, lineHeight: 1.45 }}>
              Zero hidden platform fees or surprise booking charges. What you see is exactly what your tutor receives.
            </p>
          </div>
        </Card>

        <Card
          style={{
            padding: '1.5rem',
            border: '2px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
          }}
        >
          <div
            style={{
              padding: '0.625rem',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Target size={22} strokeWidth={2.4} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--fg-main)', margin: '0 0 0.25rem 0' }}>
              Trusted Student Reviews
            </h4>
            <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: 0, lineHeight: 1.45 }}>
              Real feedback from students on teaching clarity, punctuality, helpfulness, and lesson vibe.
            </p>
          </div>
        </Card>
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
