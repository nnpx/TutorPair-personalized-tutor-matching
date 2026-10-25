import React from 'react';
import { Card, Button } from '../../../components/ui';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  User,
  Compass,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  DollarSign,
  Lock,
} from 'lucide-react';

interface StudentRoadmapProps {
  onStartClick?: () => void;
  ctaText?: string;
  ctaLink?: string;
  isProfileComplete?: boolean;
  onOpenMatchForm?: () => void;
  showHeader?: boolean;
  title?: string;
  subtitle?: string;
  layout?: 'horizontal' | 'vertical';
}

export const StudentRoadmap: React.FC<StudentRoadmapProps> = ({
  onStartClick,
  ctaText = 'Start Setup: Step 1 →',
  ctaLink = '/student/profile?tab=profile&returnTo=/student/matching',
  isProfileComplete = false,
  onOpenMatchForm,
  showHeader = true,
  title = 'How TutorPair Works: Your 3-Step Pathway',
  subtitle = 'Follow these 3 simple steps to find, match, and learn with your ideal verified tutor in Thailand:',
  layout = 'horizontal',
}) => {
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Hero (if showHeader = true) */}
      {showHeader && (
        <div style={{ textAlign: 'center', marginBottom: '0.25rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--fg-main)', letterSpacing: '-0.02em', margin: '0 0 0.5rem 0' }}>
            {title}
          </h2>
          <p style={{ color: '#4b5563', fontSize: '0.9375rem', maxWidth: '640px', margin: '0 auto', lineHeight: 1.5, fontWeight: 500 }}>
            {subtitle}
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VERTICAL CONNECTED TIMELINE LAYOUT (Guided step-by-step pathway like tutor) */}
      {/* ========================================================================= */}
      {layout === 'vertical' ? (
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
                  backgroundColor: isProfileComplete ? 'var(--color-secondary)' : 'var(--color-primary)',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.25rem',
                }}
              >
                {isProfileComplete ? '✓' : '1'}
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
                  border: isProfileComplete ? '2px solid var(--color-secondary)' : '2px solid var(--color-primary)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-main)', margin: 0 }}>
                    1. Profile & Preferences
                  </h2>
                  <span
                    style={{
                      padding: '0.25rem 0.625rem',
                      backgroundColor: isProfileComplete ? 'var(--color-secondary-tint)' : 'var(--color-primary-tint)',
                      color: isProfileComplete ? 'var(--color-secondary)' : 'var(--color-primary)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                    }}
                  >
                    {isProfileComplete ? 'Completed ✅' : '⏱️ Step 1 (~3 mins)'}
                  </span>
                </div>

                <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0, lineHeight: 1.5 }}>
                  Set up your contact info and answer 9 quick sliders so our matching engine understands how you learn best (pace, practice style, and tutor vibe).
                </p>

                {/* Checklist (Vertical, concise guided items) */}
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
                        Grade Level & Contact Channels
                      </span>
                      <span style={{ fontSize: '0.8125rem', color: '#6b7280', marginLeft: '0.375rem' }}>
                        (Grade Level G1–G12, Phone number, and optional LINE ID)
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                    <span style={{ color: 'var(--color-primary)', display: 'inline-flex', marginTop: '0.125rem' }}>
                      <Compass size={16} strokeWidth={2.4} />
                    </span>
                    <div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--fg-main)' }}>
                        9 Learning & Personality Sliders
                      </span>
                      <span style={{ fontSize: '0.8125rem', color: '#6b7280', marginLeft: '0.375rem' }}>
                        (Interactive 1–5 scale matching your learning speed, practice style, and preferred vibe)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Step 1 Action Button */}
                <div style={{ paddingTop: '0.25rem' }}>
                  {!isProfileComplete ? (
                    onStartClick ? (
                      <Button
                        type="button"
                        variant="primary"
                        onClick={onStartClick}
                        style={{
                          height: '3rem',
                          padding: '0 1.75rem',
                          fontSize: '0.9375rem',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        {ctaText}
                      </Button>
                    ) : (
                      <Link to={ctaLink} style={{ textDecoration: 'none', display: 'inline-block' }}>
                        <Button
                          type="button"
                          variant="primary"
                          style={{
                            height: '3rem',
                            padding: '0 1.75rem',
                            fontSize: '0.9375rem',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          {ctaText}
                        </Button>
                      </Link>
                    )
                  ) : (
                    <Link to="/student/profile?tab=sliders&returnTo=/student/matching" style={{ textDecoration: 'none', display: 'inline-block' }}>
                      <Button variant="secondary" style={{ height: '2.5rem', padding: '0 1.25rem', fontSize: '0.8125rem', fontWeight: 700 }}>
                        Adjust Sliders / Info
                      </Button>
                    </Link>
                  )}
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
                  backgroundColor: isProfileComplete ? 'var(--color-primary)' : 'var(--color-border)',
                  color: isProfileComplete ? '#ffffff' : '#6b7280',
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
                  border: isProfileComplete ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-main)', margin: 0 }}>
                    2. Select Subject & Match
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
                    Subject Selection
                  </span>
                </div>

                <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0, lineHeight: 1.5 }}>
                  Select 1 specific subject/test variant from the 3-step catalog, your lesson budget (THB/hr), and preferred day.
                </p>

                {/* Checklist (Vertical, concise guided items) */}
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
                    <span style={{ color: isProfileComplete ? 'var(--color-primary)' : '#6b7280', display: 'inline-flex', marginTop: '0.125rem' }}>
                      <BookOpen size={16} strokeWidth={2.4} />
                    </span>
                    <div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--fg-main)' }}>
                        3-Step Cascading Subject Picker
                      </span>
                      <span style={{ fontSize: '0.8125rem', color: '#6b7280', marginLeft: '0.375rem' }}>
                        (Level/Track → Subject → Variant from Thailand standardized curricula)
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                    <span style={{ color: isProfileComplete ? 'var(--color-primary)' : '#6b7280', display: 'inline-flex', marginTop: '0.125rem' }}>
                      <DollarSign size={16} strokeWidth={2.4} />
                    </span>
                    <div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--fg-main)' }}>
                        Hourly Budget & Schedule Time Windows
                      </span>
                      <span style={{ fontSize: '0.8125rem', color: '#6b7280', marginLeft: '0.375rem' }}>
                        (Max THB/hr budget & weekly slots matching your free study hours)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Step 2 Action / Lock Status */}
                <div style={{ paddingTop: '0.25rem' }}>
                  {isProfileComplete && onOpenMatchForm ? (
                    <Button
                      type="button"
                      variant="primary"
                      onClick={onOpenMatchForm}
                      style={{
                        height: '3rem',
                        padding: '0 1.75rem',
                        fontSize: '0.9375rem',
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <Sparkles size={16} /> Matching Tutor →
                    </Button>
                  ) : (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.875rem',
                        backgroundColor: 'var(--color-muted)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        color: '#6b7280',
                      }}
                    >
                      <Lock size={15} /> Unlocks immediately after completing Step 1
                    </div>
                  )}
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
                  backgroundColor: 'var(--color-border)',
                  color: '#6b7280',
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
                    3. Top 3 Match & Confirm
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
                    Instant Scoring
                  </span>
                </div>

                <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0, lineHeight: 1.5 }}>
                  Our intelligent matchmaking engine calculates Top 3 matches using hard filters and 9 weighted sliders. Review CVs, degrees, and confirm 1 tutor.
                </p>

                {/* Checklist (Vertical, concise guided items) */}
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
                        Admin-Verified Tutors & Credentials
                      </span>
                      <span style={{ fontSize: '0.8125rem', color: '#6b7280', marginLeft: '0.375rem' }}>
                        (Degrees, transcripts, and ID verified by platform administrators)
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                    <span style={{ color: 'var(--color-secondary)', display: 'inline-flex', marginTop: '0.125rem' }}>
                      <CheckCircle2 size={16} strokeWidth={2.4} />
                    </span>
                    <div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--fg-main)' }}>
                        Confirm 1 Tutor for Lesson
                      </span>
                      <span style={{ fontSize: '0.8125rem', color: '#6b7280', marginLeft: '0.375rem' }}>
                        (Lock in lesson and coordinate directly via phone/LINE)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer review banner */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.8125rem',
                    color: '#4b5563',
                    padding: '0.625rem 0.875rem',
                    backgroundColor: 'var(--color-muted)',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 600,
                  }}
                >
                  <span>⭐ 4-category student review after session (Punctuality, Teaching Style, Materials, Engagement)</span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* HORIZONTAL 3 COLUMNS GRID (Kept identical for other pages / bottom cards) */
        /* ========================================================================= */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
            gap: '1.25rem',
            alignItems: 'stretch',
          }}
        >
          {/* ===================== Column 1: Step 1 ===================== */}
          <Card
            style={{
              backgroundColor: '#ffffff',
              border: isProfileComplete ? '2px solid var(--color-secondary)' : '2px solid var(--color-primary)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1.25rem',
            }}
          >
            <div>
              {/* Step Top Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: isProfileComplete ? 'var(--color-secondary)' : 'var(--color-primary)',
                    color: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.125rem',
                  }}
                >
                  {isProfileComplete ? '✓' : '1'}
                </span>
                <span
                  style={{
                    padding: '0.25rem 0.625rem',
                    backgroundColor: isProfileComplete ? 'var(--color-secondary-tint)' : 'var(--color-primary-tint)',
                    color: isProfileComplete ? 'var(--color-secondary)' : 'var(--color-primary)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                  }}
                >
                  {isProfileComplete ? 'Completed ✅' : 'Step 1 (~3 mins)'}
                </span>
              </div>

              <h3 style={{ fontSize: '1.1875rem', fontWeight: 800, color: 'var(--fg-main)', margin: '0 0 0.5rem 0' }}>
                1. Profile & Preferences
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#4b5563', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
                Set up your contact info and answer 9 quick sliders so our matching engine understands how you learn best (pace, practice style, and tutor vibe).
              </p>

              {/* Checklist Pills */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: 'var(--color-muted)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--fg-main)' }}>
                  <User size={14} color="var(--color-primary)" />
                  <span>Grade Level & Contact Channels</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--fg-main)' }}>
                  <Compass size={14} color="var(--color-primary)" />
                  <span>9 Learning & Personality Sliders</span>
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <div>
              {!isProfileComplete ? (
                onStartClick ? (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={onStartClick}
                    style={{
                      width: '100%',
                      minHeight: '2.875rem',
                      height: 'auto',
                      padding: '0.625rem 0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: 800,
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                      textAlign: 'center',
                      lineHeight: 1.3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {ctaText}
                  </Button>
                ) : (
                  <Link to={ctaLink} style={{ textDecoration: 'none', display: 'block', width: '100%' }}>
                    <Button
                      type="button"
                      variant="primary"
                      style={{
                        width: '100%',
                        minHeight: '2.875rem',
                        height: 'auto',
                        padding: '0.625rem 0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: 800,
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                        textAlign: 'center',
                        lineHeight: 1.3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {ctaText}
                    </Button>
                  </Link>
                )
              ) : (
                <Link to="/student/profile" style={{ textDecoration: 'none' }}>
                  <Button variant="secondary" style={{ width: '100%', height: '2.5rem', fontSize: '0.8125rem', fontWeight: 700 }}>
                    Adjust Sliders / Info
                  </Button>
                </Link>
              )}
            </div>
          </Card>

          {/* ===================== Column 2: Step 2 ===================== */}
          <Card
            style={{
              backgroundColor: '#ffffff',
              border: isProfileComplete ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1.25rem',
            }}
          >
            <div>
              {/* Step Top Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: isProfileComplete ? 'var(--color-primary)' : '#9ca3af',
                    color: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.125rem',
                  }}
                >
                  2
                </span>
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
                  Subject Selection
                </span>
              </div>

              <h3 style={{ fontSize: '1.1875rem', fontWeight: 800, color: 'var(--fg-main)', margin: '0 0 0.5rem 0' }}>
                2. Select Subject & Match
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#4b5563', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
                Select 1 specific subject/test variant from the 3-step catalog, your lesson budget (THB/hr), and preferred day.
              </p>

              {/* Checklist Pills */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: 'var(--color-muted)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--fg-main)' }}>
                  <BookOpen size={14} color="var(--color-primary)" />
                  <span>Category → Subject → Variant</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--fg-main)' }}>
                  <DollarSign size={14} color="var(--color-primary)" />
                  <span>Hourly Budget & Online Video</span>
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <div>
              {isProfileComplete && onOpenMatchForm ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={onOpenMatchForm}
                  style={{ width: '100%', height: '2.75rem', fontSize: '0.875rem', fontWeight: 800 }}
                >
                  <Sparkles size={15} style={{ marginRight: '0.375rem' }} /> Matching Tutor →
                </Button>
              ) : (
                <div
                  style={{
                    padding: '0.625rem',
                    backgroundColor: 'var(--color-muted)',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.375rem',
                  }}
                >
                  <Lock size={13} /> Unlocks after Step 1
                </div>
              )}
            </div>
          </Card>

          {/* ===================== Column 3: Step 3 ===================== */}
          <Card
            style={{
              backgroundColor: '#ffffff',
              border: '2px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1.25rem',
            }}
          >
            <div>
              {/* Step Top Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: '#9ca3af',
                    color: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.125rem',
                  }}
                >
                  3
                </span>
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
                  Instant Scoring
                </span>
              </div>

              <h3 style={{ fontSize: '1.1875rem', fontWeight: 800, color: 'var(--fg-main)', margin: '0 0 0.5rem 0' }}>
                3. Top 3 Match & Confirm
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#4b5563', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
                Module 6 calculates Top 3 matches using hard filters and 9 weighted sliders. Review CVs, degrees, and confirm 1 tutor.
              </p>

              {/* Checklist Pills */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: 'var(--color-muted)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--fg-main)' }}>
                  <ShieldCheck size={14} color="var(--color-secondary)" />
                  <span>Admin-Verified Tutors & CVs</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--fg-main)' }}>
                  <CheckCircle2 size={14} color="var(--color-secondary)" />
                  <span>Confirm 1 Tutor for Lesson</span>
                </div>
              </div>
            </div>

            {/* Action Note */}
            <div
              style={{
                padding: '0.625rem',
                backgroundColor: 'var(--color-muted)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#6b7280',
              }}
            >
              ⭐ 4-category review after session
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
