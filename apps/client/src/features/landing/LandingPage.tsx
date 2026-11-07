import { UserRole } from '@tutorpair/shared';
import {
  Award,
  BookOpen,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  FileCheck,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

const SAMPLE_STYLE_DIMENSIONS = [
  {
    num: 1,
    title: 'Learning Pace & Structure',
    left: 'Step-by-step foundation',
    right: 'Fast-paced & key shortcuts',
  },
  {
    num: 2,
    title: 'Learning Method',
    left: 'Heavy practice drills',
    right: 'Concept understanding first',
  },
  {
    num: 3,
    title: 'Class Interaction',
    left: 'Active Q&A & discussion',
    right: 'Quiet focused lecture',
  },
  {
    num: 4,
    title: 'Guidance Approach',
    left: 'Guided hand-in-hand',
    right: 'Independent exploration',
  },
  {
    num: 5,
    title: 'Lesson Atmosphere',
    left: 'Fun & relaxed atmosphere',
    right: 'Calm & highly focused',
  },
];

export const LandingPage: React.FC = () => {
  const { user } = useAuthStore();

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === UserRole.STUDENT) return '/student/matching';
    if (user.role === UserRole.TUTOR) return '/tutor/profile';
    if (user.role === UserRole.ADMIN) return '/admin/verifications';
    return '/';
  };

  // Interactive state for 3-Step Selection Demonstration
  const [activeCategory, setActiveCategory] = useState<
    'GENERAL' | 'LANGUAGE' | 'ENTRANCE'
  >('GENERAL');
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  // Interactive state for 5 Learning Style dimensions demo
  const [sampleSliders, setSampleSliders] = useState<number[]>([4, 2, 2, 3, 4]);

  const updateSampleSlider = (index: number, val: number) => {
    setSampleSliders((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-canvas)' }}>
      {/* ──────────────────────────────────────────────────────────── */}
      {/* 1. STICKY FLAT NAVIGATION BAR                                */}
      {/* ──────────────────────────────────────────────────────────── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: 'var(--bg-canvas)',
          borderBottom: '2px solid var(--color-border)',
          padding: '1.25rem 0',
        }}
      >
        <div
          className="container-flat"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Logo */}
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: '3rem',
                height: '3rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-white)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.5rem',
              }}
            >
              TP
            </div>
            <div>
              <span
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: 'var(--fg-main)',
                }}
              >
                Tutor<span style={{ color: 'var(--color-primary)' }}>Pair</span>
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--color-secondary)',
                }}
              >
                Thailand Verified Matchmaking
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <a
              href="#how-it-works"
              style={{
                fontWeight: 600,
                fontSize: '0.9375rem',
                color: 'var(--fg-main)',
                textDecoration: 'none',
              }}
            >
              How It Works
            </a>
            <a
              href="#matching-system"
              style={{
                fontWeight: 600,
                fontSize: '0.9375rem',
                color: 'var(--fg-main)',
                textDecoration: 'none',
              }}
            >
              Learning Style Fit
            </a>
            <a
              href="#subjects"
              style={{
                fontWeight: 600,
                fontSize: '0.9375rem',
                color: 'var(--fg-main)',
                textDecoration: 'none',
              }}
            >
              Subjects &amp; Exams
            </a>
            <a
              href="#verification"
              style={{
                fontWeight: 600,
                fontSize: '0.9375rem',
                color: 'var(--fg-main)',
                textDecoration: 'none',
              }}
            >
              Tutor Verification
            </a>
            <a
              href="#tutors"
              style={{
                fontWeight: 600,
                fontSize: '0.9375rem',
                color: 'var(--fg-main)',
                textDecoration: 'none',
              }}
            >
              Tutor Tiers
            </a>
            <a
              href="#faq"
              style={{
                fontWeight: 600,
                fontSize: '0.9375rem',
                color: 'var(--fg-main)',
                textDecoration: 'none',
              }}
            >
              FAQ
            </a>
          </nav>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {user ? (
              <Link
                to={getDashboardPath()}
                className="flat-btn flat-btn-primary flat-btn-sm"
                style={{
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none',
                }}
              >
                <span>Go to Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login?mode=signin"
                  className="flat-btn flat-btn-secondary flat-btn-sm"
                  style={{ fontWeight: 700, textDecoration: 'none' }}
                >
                  Sign In
                </Link>
                <Link
                  to="/login?mode=register&role=student"
                  className="flat-btn flat-btn-primary flat-btn-sm"
                  style={{ fontWeight: 700, textDecoration: 'none' }}
                >
                  Find a Tutor
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 2. HERO SECTION                                              */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section
        className="section-block section-blue"
        style={{ minHeight: '620px', display: 'flex', alignItems: 'center' }}
      >
        <div
          className="geo-shape geo-circle-lg"
          style={{ top: '-120px', right: '-80px' }}
        />
        <div
          className="geo-shape geo-square-rot"
          style={{ bottom: '-100px', left: '-50px' }}
        />

        <div
          className="container-flat"
          style={{ position: 'relative', zIndex: 1 }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 0.8fr',
              gap: '4rem',
              alignItems: 'center',
            }}
          >
            {/* Left Content */}
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  padding: '0.4rem 1rem',
                  borderRadius: 'var(--radius-full)',
                  marginBottom: '1.5rem',
                }}
              >
                <Sparkles size={18} color="#ffffff" strokeWidth={2.5} />
                <span
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  1-on-1 Private Tutoring • G1–G12 Thailand
                </span>
              </div>

              <h1
                style={{
                  fontSize: '3.5rem',
                  lineHeight: 1.15,
                  marginBottom: '1.5rem',
                  color: '#ffffff',
                }}
              >
                Find Your Ideal 1-on-1 Private Tutor.{' '}
                <span style={{ color: 'var(--color-accent)' }}>
                  Matched Directly
                </span>{' '}
                to How You Learn.
              </h1>

              <p
                style={{
                  fontSize: '1.1875rem',
                  lineHeight: 1.6,
                  marginBottom: '2.5rem',
                  opacity: 0.95,
                  maxWidth: '600px',
                }}
              >
                TutorPair matches individual students directly with verified
                private tutors for 100% personalized, 1-on-1 private lessons.
                Tell us your subject, schedule, budget, and learning style, and
                we’ll match you with the educators who fit you best — with zero
                agency fees.
              </p>

              {/* Action Buttons */}
              <div
                style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}
              >
                <Link
                  to={
                    user
                      ? getDashboardPath()
                      : '/login?mode=register&role=student'
                  }
                  className="flat-btn flat-btn-accent flat-btn-lg"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    textDecoration: 'none',
                  }}
                >
                  <Sparkles size={22} strokeWidth={2.5} />
                  Find Your Top 3 Tutors
                </Link>
                <Link
                  to={
                    user
                      ? getDashboardPath()
                      : '/login?mode=register&role=tutor'
                  }
                  className="flat-btn flat-btn-outline-white flat-btn-lg"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    textDecoration: 'none',
                  }}
                >
                  <GraduationCap size={22} strokeWidth={2.5} />
                  Apply as a Tutor
                </Link>
              </div>

              {/* Trust Micro-Badges */}
              <div
                style={{
                  display: 'flex',
                  gap: '2rem',
                  marginTop: '2.5rem',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <ShieldCheck
                    size={20}
                    strokeWidth={2.5}
                    color="var(--color-accent)"
                  />
                  <span style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
                    100% Verified Degrees &amp; Test Scores
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <CheckCircle2
                    size={20}
                    strokeWidth={2.5}
                    color="var(--color-accent)"
                  />
                  <span style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
                    Tailored Top 3 Matching
                  </span>
                </div>
              </div>
            </div>

            {/* Right Graphic Poster Box — Live Tutor Match Example */}
            <div>
              <div
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '2.25rem',
                  color: 'var(--fg-main)',
                  position: 'relative',
                  border: '2px solid var(--color-border)',
                }}
              >
                {/* Match Score Badge */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.35rem',
                      }}
                    >
                      <span className="flat-badge flat-badge-primary">
                        Top Recommended Tutor
                      </span>
                    </div>
                    <h3
                      style={{
                        fontSize: '1.375rem',
                        fontWeight: 800,
                        margin: '0.25rem 0',
                      }}
                    >
                      Dr. Somchai Pattana
                    </h3>
                    <p
                      style={{
                        color: '#4b5563',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        margin: 0,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Ph.D. in Applied Math • High School &amp; Olympiad Focus
                    </p>
                  </div>
                  <div
                    style={{
                      backgroundColor: 'var(--color-secondary)',
                      color: 'var(--color-white)',
                      padding: '0.3rem 0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '0.25rem',
                      flexShrink: 0,
                      marginLeft: '0.5rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 800,
                        lineHeight: 1,
                      }}
                    >
                      96%
                    </span>
                    <span
                      style={{
                        fontSize: '0.625rem',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        opacity: 0.9,
                      }}
                    >
                      Fit
                    </span>
                  </div>
                </div>

                {/* Rating & Review summary */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <Star size={16} fill="#F59E0B" color="#F59E0B" />
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: '0.9375rem',
                        color: 'var(--fg-main)',
                      }}
                    >
                      4.9
                    </span>
                  </div>
                  <span style={{ color: '#6b7280', fontSize: '0.8125rem' }}>
                    • 28 verified reviews from confirmed students
                  </span>
                </div>

                {/* Compatibility Highlights */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        marginBottom: '0.25rem',
                      }}
                    >
                      <span>Step-by-Step Learning Pace</span>
                      <span style={{ color: 'var(--color-primary)' }}>
                        Matched (5/5)
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '6px',
                        backgroundColor: 'var(--color-muted)',
                        borderRadius: '3px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          backgroundColor: 'var(--color-primary)',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        marginBottom: '0.25rem',
                      }}
                    >
                      <span>Concept-First Teaching Style</span>
                      <span style={{ color: 'var(--color-secondary)' }}>
                        Matched (4.5/5)
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '6px',
                        backgroundColor: 'var(--color-muted)',
                        borderRadius: '3px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: '90%',
                          height: '100%',
                          backgroundColor: 'var(--color-secondary)',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Verification Checkmarks */}
                <div
                  style={{
                    backgroundColor: 'var(--color-muted)',
                    padding: '0.875rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.375rem',
                    }}
                  >
                    <ShieldCheck
                      size={16}
                      color="var(--color-secondary)"
                      strokeWidth={2.5}
                    />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>
                      Doctorate in Applied Mathematics (Verified)
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <Check
                      size={16}
                      color="var(--color-secondary)"
                      strokeWidth={2.5}
                    />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>
                      Professional Resume &amp; Identity Checked
                    </span>
                  </div>
                </div>

                {/* Rate & Confirm action */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: '#6b7280',
                      }}
                    >
                      Teaching Rate
                    </span>
                    <p
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        color: 'var(--color-primary)',
                        margin: 0,
                      }}
                    >
                      ฿450{' '}
                      <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                        / hr
                      </span>
                    </p>
                  </div>
                  <Link
                    to={
                      user
                        ? getDashboardPath()
                        : '/login?mode=register&role=student'
                    }
                    className="flat-btn flat-btn-primary flat-btn-sm"
                    style={{ padding: '0 1.25rem', textDecoration: 'none' }}
                  >
                    Match With Tutors →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 3. KEY STATS STRIP                                           */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: 'var(--bg-canvas)',
          borderBottom: '2px solid var(--color-border)',
          padding: '2.5rem 0',
        }}
      >
        <div className="container-flat">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '2rem',
              textAlign: 'center',
            }}
          >
            <div>
              <p
                style={{
                  fontSize: '2.75rem',
                  fontWeight: 800,
                  color: 'var(--color-primary)',
                  lineHeight: 1,
                  margin: 0,
                }}
              >
                100%
              </p>
              <p
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--fg-main)',
                  marginTop: '0.5rem',
                  marginBottom: '0.25rem',
                }}
              >
                Admin-Verified Tutors
              </p>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: 0 }}>
                Degrees, certificates &amp; test proof checked
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: '2.75rem',
                  fontWeight: 800,
                  color: 'var(--color-secondary)',
                  lineHeight: 1,
                  margin: 0,
                }}
              >
                Top 3
              </p>
              <p
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--fg-main)',
                  marginTop: '0.5rem',
                  marginBottom: '0.25rem',
                }}
              >
                Curated Recommendations
              </p>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: 0 }}>
                No endless lists — only your strongest matches
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: '2.75rem',
                  fontWeight: 800,
                  color: 'var(--color-accent)',
                  lineHeight: 1,
                  margin: 0,
                }}
              >
                1–5
              </p>
              <p
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--fg-main)',
                  marginTop: '0.5rem',
                  marginBottom: '0.25rem',
                }}
              >
                Learning Style Questions
              </p>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: 0 }}>
                Pace, explanation style &amp; lesson vibe
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: '2.75rem',
                  fontWeight: 800,
                  color: 'var(--color-dark)',
                  lineHeight: 1,
                  margin: 0,
                }}
              >
                Direct
              </p>
              <p
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--fg-main)',
                  marginTop: '0.5rem',
                  marginBottom: '0.25rem',
                }}
              >
                Phone &amp; LINE Unlock
              </p>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: 0 }}>
                Direct communication with your confirmed tutor
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 4. THE CHALLENGE VS. TUTORPAIR SOLUTION                      */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="section-block section-muted">
        <div className="container-flat">
          <div
            style={{
              textAlign: 'center',
              maxWidth: '960px',
              margin: '0 auto 3.5rem auto',
            }}
          >
            <span
              className="flat-badge flat-badge-primary"
              style={{ marginBottom: '1rem' }}
            >
              Why TutorPair Was Built
            </span>
            <h2
              style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                marginBottom: '1rem',
              }}
            >
              Finding a Great Tutor Shouldn't Feel Like a Gamble
            </h2>
            <p
              style={{
                fontSize: '1.125rem',
                color: '#4b5563',
                lineHeight: 1.6,
              }}
            >
              Most students in Thailand still search through unstructured social
              media groups, outdated message boards, or word-of-mouth
              recommendations. Here is how TutorPair makes the process safe,
              transparent, and personalized.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '2rem',
            }}
          >
            {/* The Old Way Box */}
            <div
              style={{
                backgroundColor: 'var(--bg-canvas)',
                padding: '2.5rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1.5rem',
                }}
              >
                <span
                  style={{
                    backgroundColor: 'var(--color-danger-tint)',
                    color: 'var(--color-danger)',
                    padding: '0.4rem 0.875rem',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 800,
                    fontSize: '0.8125rem',
                    textTransform: 'uppercase',
                  }}
                >
                  The Old Way
                </span>
              </div>
              <ul
                style={{
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                  padding: 0,
                  margin: 0,
                }}
              >
                <li
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      color: 'var(--color-danger)',
                      fontWeight: 800,
                      fontSize: '1.25rem',
                      lineHeight: 1,
                    }}
                  >
                    ✕
                  </div>
                  <div>
                    <h4
                      style={{
                        fontWeight: 700,
                        fontSize: '1.0625rem',
                        marginBottom: '0.25rem',
                        margin: 0,
                      }}
                    >
                      Scattered Social Media Posts
                    </h4>
                    <p
                      style={{
                        color: '#6b7280',
                        fontSize: '0.9375rem',
                        margin: '0.25rem 0 0 0',
                        lineHeight: 1.5,
                      }}
                    >
                      Hours spent browsing fragmented groups with vague teaching
                      descriptions, unlisted prices, and uncertain availability.
                    </p>
                  </div>
                </li>
                <li
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      color: 'var(--color-danger)',
                      fontWeight: 800,
                      fontSize: '1.25rem',
                      lineHeight: 1,
                    }}
                  >
                    ✕
                  </div>
                  <div>
                    <h4
                      style={{
                        fontWeight: 700,
                        fontSize: '1.0625rem',
                        marginBottom: '0.25rem',
                        margin: 0,
                      }}
                    >
                      Unverified Credentials &amp; Degrees
                    </h4>
                    <p
                      style={{
                        color: '#6b7280',
                        fontSize: '0.9375rem',
                        margin: '0.25rem 0 0 0',
                        lineHeight: 1.5,
                      }}
                    >
                      Parents have no way of knowing whether a tutor actually
                      scored 8.0 on IELTS, 780 on SAT Math, or holds the degree
                      they claim.
                    </p>
                  </div>
                </li>
                <li
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      color: 'var(--color-danger)',
                      fontWeight: 800,
                      fontSize: '1.25rem',
                      lineHeight: 1,
                    }}
                  >
                    ✕
                  </div>
                  <div>
                    <h4
                      style={{
                        fontWeight: 700,
                        fontSize: '1.0625rem',
                        marginBottom: '0.25rem',
                        margin: 0,
                      }}
                    >
                      Personality &amp; Pace Clashes
                    </h4>
                    <p
                      style={{
                        color: '#6b7280',
                        fontSize: '0.9375rem',
                        margin: '0.25rem 0 0 0',
                        lineHeight: 1.5,
                      }}
                    >
                      Even an accomplished tutor might move too fast for a
                      student who needs step-by-step foundation building,
                      leading to frustration and wasted money.
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* The TutorPair Way Box */}
            <div
              style={{
                backgroundColor: 'var(--color-primary-tint)',
                padding: '2.5rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid #bfdbfe',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1.5rem',
                }}
              >
                <span
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-white)',
                    padding: '0.4rem 0.875rem',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 800,
                    fontSize: '0.8125rem',
                    textTransform: 'uppercase',
                  }}
                >
                  The TutorPair Solution
                </span>
              </div>
              <ul
                style={{
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                  padding: 0,
                  margin: 0,
                }}
              >
                <li
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'flex-start',
                  }}
                >
                  <CheckCircle2
                    size={22}
                    color="var(--color-primary)"
                    strokeWidth={2.5}
                    style={{ flexShrink: 0, marginTop: '0.125rem' }}
                  />
                  <div>
                    <h4
                      style={{
                        fontWeight: 700,
                        fontSize: '1.0625rem',
                        color: 'var(--color-primary)',
                        margin: 0,
                      }}
                    >
                      Simple 3-Step Subject Selection
                    </h4>
                    <p
                      style={{
                        color: '#374151',
                        fontSize: '0.9375rem',
                        margin: '0.25rem 0 0 0',
                        lineHeight: 1.5,
                      }}
                    >
                      Choose your category, subject, and exact focus (e.g.
                      School Math, SAT Math, or POSN Competition) in seconds.
                    </p>
                  </div>
                </li>
                <li
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'flex-start',
                  }}
                >
                  <CheckCircle2
                    size={22}
                    color="var(--color-primary)"
                    strokeWidth={2.5}
                    style={{ flexShrink: 0, marginTop: '0.125rem' }}
                  />
                  <div>
                    <h4
                      style={{
                        fontWeight: 700,
                        fontSize: '1.0625rem',
                        color: 'var(--color-primary)',
                        margin: 0,
                      }}
                    >
                      Verified Documents &amp; Test Certificates
                    </h4>
                    <p
                      style={{
                        color: '#374151',
                        fontSize: '0.9375rem',
                        margin: '0.25rem 0 0 0',
                        lineHeight: 1.5,
                      }}
                    >
                      Every tutor's degree transcripts, CV, and test
                      certifications are individually audited and approved
                      before they can accept matches.
                    </p>
                  </div>
                </li>
                <li
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'flex-start',
                  }}
                >
                  <CheckCircle2
                    size={22}
                    color="var(--color-primary)"
                    strokeWidth={2.5}
                    style={{ flexShrink: 0, marginTop: '0.125rem' }}
                  />
                  <div>
                    <h4
                      style={{
                        fontWeight: 700,
                        fontSize: '1.0625rem',
                        color: 'var(--color-primary)',
                        margin: 0,
                      }}
                    >
                      Tailored Learning Style &amp; Personality Fit
                    </h4>
                    <p
                      style={{
                        color: '#374151',
                        fontSize: '0.9375rem',
                        margin: '0.25rem 0 0 0',
                        lineHeight: 1.5,
                      }}
                    >
                      Quick 1–5 questions match your preferred learning pace,
                      interaction level, and guidance style with the tutor’s
                      natural approach.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 5. SUBJECTS & CURRICULUM SELECTION FLOW                      */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section id="subjects" className="section-block section-white">
        <div className="container-flat">
          <div
            style={{
              textAlign: 'center',
              maxWidth: '960px',
              margin: '0 auto 3.5rem auto',
            }}
          >
            <span
              className="flat-badge flat-badge-secondary"
              style={{ marginBottom: '1rem' }}
            >
              Comprehensive Learning Scope
            </span>
            <h2
              style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                marginBottom: '1rem',
              }}
            >
              Choose Your Target Subject in 3 Simple Steps
            </h2>
            <p
              style={{
                fontSize: '1.125rem',
                color: '#4b5563',
                lineHeight: 1.6,
              }}
            >
              No confusing forms. Both students and tutors easily pick their
              exact focus through our structured curriculum categories:
            </p>
          </div>

          {/* Category Tabs */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              marginBottom: '2.5rem',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveCategory('GENERAL')}
              className={`flat-btn ${activeCategory === 'GENERAL' ? 'flat-btn-primary' : 'flat-btn-secondary'}`}
              style={{ fontWeight: 700 }}
            >
              <BookOpen size={18} strokeWidth={2.2} />
              School Curriculum (Math, Sciences, English)
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('LANGUAGE')}
              className={`flat-btn ${activeCategory === 'LANGUAGE' ? 'flat-btn-primary' : 'flat-btn-secondary'}`}
              style={{ fontWeight: 700 }}
            >
              <Compass size={18} strokeWidth={2.2} />
              Language Testing (IELTS, TOEIC, JLPT, HSK)
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('ENTRANCE')}
              className={`flat-btn ${activeCategory === 'ENTRANCE' ? 'flat-btn-primary' : 'flat-btn-secondary'}`}
              style={{ fontWeight: 700 }}
            >
              <Award size={18} strokeWidth={2.2} />
              University Entrance (Digital SAT, TGAT, TPAT, A-Level)
            </button>
          </div>

          {/* Interactive Flow Visualizer */}
          <div
            style={{
              backgroundColor: 'var(--color-muted)',
              padding: '2.5rem',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1.5rem',
              }}
            >
              {/* Step 1 */}
              <div
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  padding: '1.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: 'var(--color-primary)',
                  }}
                >
                  Step 1
                </span>
                <h4
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: 800,
                    margin: '0.375rem 0 0.875rem 0',
                  }}
                >
                  Select Category
                </h4>
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--color-primary-tint)',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                    fontSize: '0.9375rem',
                  }}
                >
                  {activeCategory === 'GENERAL' &&
                    'General Learning (School Subjects)'}
                  {activeCategory === 'LANGUAGE' &&
                    'Language Testing & Fluency'}
                  {activeCategory === 'ENTRANCE' && 'University Entrance Exams'}
                </div>
              </div>

              {/* Step 2 */}
              <div
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  padding: '1.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: 'var(--color-secondary)',
                  }}
                >
                  Step 2
                </span>
                <h4
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: 800,
                    margin: '0.375rem 0 0.875rem 0',
                  }}
                >
                  Choose Subject
                </h4>
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--color-secondary-tint)',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 700,
                    color: 'var(--color-secondary)',
                    fontSize: '0.9375rem',
                  }}
                >
                  {activeCategory === 'GENERAL' &&
                    'Mathematics / Science / English'}
                  {activeCategory === 'LANGUAGE' &&
                    'IELTS / Japanese / Chinese'}
                  {activeCategory === 'ENTRANCE' &&
                    'Digital SAT / TGAT / A-Level'}
                </div>
              </div>

              {/* Step 3 */}
              <div
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  padding: '1.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: 'var(--color-accent)',
                  }}
                >
                  Step 3
                </span>
                <h4
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: 800,
                    margin: '0.375rem 0 0.875rem 0',
                  }}
                >
                  Specific Focus
                </h4>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  {activeCategory === 'GENERAL' && (
                    <>
                      <div
                        style={{
                          padding: '0.5rem 0.75rem',
                          backgroundColor: 'var(--color-muted)',
                          borderRadius: '4px',
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                        }}
                      >
                        ✓ School Curriculum Math (G7–G12)
                      </div>
                      <div
                        style={{
                          padding: '0.5rem 0.75rem',
                          backgroundColor: 'var(--color-muted)',
                          borderRadius: '4px',
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                        }}
                      >
                        ✓ Math Olympiad &amp; POSN Competitions
                      </div>
                    </>
                  )}
                  {activeCategory === 'LANGUAGE' && (
                    <>
                      <div
                        style={{
                          padding: '0.5rem 0.75rem',
                          backgroundColor: 'var(--color-muted)',
                          borderRadius: '4px',
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                        }}
                      >
                        ✓ IELTS Academic (Target 6.5+)
                      </div>
                      <div
                        style={{
                          padding: '0.5rem 0.75rem',
                          backgroundColor: 'var(--color-muted)',
                          borderRadius: '4px',
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                        }}
                      >
                        ✓ JLPT N1–N5 Foundation / Conversation
                      </div>
                    </>
                  )}
                  {activeCategory === 'ENTRANCE' && (
                    <>
                      <div
                        style={{
                          padding: '0.5rem 0.75rem',
                          backgroundColor: 'var(--color-muted)',
                          borderRadius: '4px',
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                        }}
                      >
                        ✓ Digital SAT Math (700+ Score Target)
                      </div>
                      <div
                        style={{
                          padding: '0.5rem 0.75rem',
                          backgroundColor: 'var(--color-muted)',
                          borderRadius: '4px',
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                        }}
                      >
                        ✓ TGAT 1, 2, 3 Thai University Admissions
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 6. LEARNING STYLE & PERSONALITY MATCHING                     */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section id="matching-system" className="section-block section-muted">
        <div className="container-flat">
          <div
            style={{
              textAlign: 'center',
              maxWidth: '960px',
              margin: '0 auto 3.5rem auto',
            }}
          >
            <span
              className="flat-badge flat-badge-accent"
              style={{ marginBottom: '1rem' }}
            >
              Learning Style Compatibility
            </span>
            <h2
              style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                marginBottom: '1rem',
              }}
            >
              Finding the Teaching Style That Clicks for You
            </h2>
            <p
              style={{
                fontSize: '1.125rem',
                color: '#4b5563',
                lineHeight: 1.6,
              }}
            >
              A great tutor isn't just someone with good grades—it's someone who
              communicates at your pace. Our questions align your learning
              preferences with a tutor's natural teaching approach.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '3rem',
              alignItems: 'center',
            }}
          >
            {/* The Sliders Visual Breakdown */}
            <div
              style={{
                backgroundColor: 'var(--bg-canvas)',
                padding: '2.5rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
              }}
            >
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  marginBottom: '1rem',
                  color: 'var(--color-primary)',
                }}
              >
                Sample Learning Style Dimensions (1–5)
              </h3>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  marginBottom: '1.5rem',
                  lineHeight: 1.5,
                }}
              >
                Move each slider to preview how students calibrate their exact
                learning preferences:
              </p>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                }}
              >
                {SAMPLE_STYLE_DIMENSIONS.map((dim, idx) => (
                  <div key={dim.num}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        marginBottom: '0.35rem',
                      }}
                    >
                      <span>
                        {dim.num}. {dim.title}
                      </span>
                      <span
                        style={{
                          color: 'var(--color-primary)',
                          backgroundColor: 'var(--color-primary-tint)',
                          padding: '0.125rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8125rem',
                          fontWeight: 800,
                        }}
                      >
                        Setting: {sampleSliders[idx]} / 5
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          flex: 1,
                          textAlign: 'right',
                        }}
                      >
                        {dim.left}
                      </span>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        value={sampleSliders[idx]}
                        onChange={(e) =>
                          updateSampleSlider(idx, parseInt(e.target.value, 10))
                        }
                        style={{
                          width: '160px',
                          accentColor: 'var(--color-primary)',
                          cursor: 'pointer',
                        }}
                      />
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          flex: 1,
                          textAlign: 'left',
                        }}
                      >
                        {dim.right}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* How the Matching Works */}
            <div>
              <div
                style={{
                  backgroundColor: 'var(--color-dark)',
                  color: 'var(--color-white)',
                  padding: '2.5rem',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <h3
                  style={{
                    fontSize: '1.375rem',
                    fontWeight: 800,
                    marginBottom: '1.5rem',
                    color: 'var(--color-accent)',
                  }}
                >
                  How We Find Your Ideal Tutors
                </h3>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem',
                  }}
                >
                  {/* Stage 1 */}
                  <div
                    style={{
                      borderLeft: '4px solid var(--color-primary)',
                      paddingLeft: '1.25rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        color: 'var(--color-primary)',
                      }}
                    >
                      Step 1: Strict Requirements Filter
                    </span>
                    <h4
                      style={{
                        fontSize: '1.0625rem',
                        fontWeight: 700,
                        margin: '0.25rem 0',
                      }}
                    >
                      The Essentials First
                    </h4>
                    <p
                      style={{
                        fontSize: '0.875rem',
                        color: '#9ca3af',
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      We only consider tutors who are verified, teach your exact
                      subject &amp; grade level, match your available study
                      times, and fit your hourly budget.
                    </p>
                  </div>

                  {/* Stage 2 */}
                  <div
                    style={{
                      borderLeft: '4px solid var(--color-secondary)',
                      paddingLeft: '1.25rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        color: 'var(--color-secondary)',
                      }}
                    >
                      Step 2: Compatibility Scoring
                    </span>
                    <h4
                      style={{
                        fontSize: '1.0625rem',
                        fontWeight: 700,
                        margin: '0.25rem 0',
                      }}
                    >
                      The Chemistry &amp; Vibe
                    </h4>
                    <p
                      style={{
                        fontSize: '0.875rem',
                        color: '#9ca3af',
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      We score how well the tutor’s natural teaching style
                      aligns with your learning preferences, surfacing educators
                      who truly understand your pace.
                    </p>
                  </div>

                  {/* Result */}
                  <div
                    style={{
                      borderLeft: '4px solid var(--color-accent)',
                      paddingLeft: '1.25rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        color: 'var(--color-accent)',
                      }}
                    >
                      Step 3: Top 3 Matches &amp; Direct Connection
                    </span>
                    <h4
                      style={{
                        fontSize: '1.0625rem',
                        fontWeight: 700,
                        margin: '0.25rem 0',
                      }}
                    >
                      You Choose Your Tutor
                    </h4>
                    <p
                      style={{
                        fontSize: '0.875rem',
                        color: '#9ca3af',
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      Review their full bio, credentials, and genuine student
                      reviews. When you confirm your tutor, direct Phone and
                      LINE contacts unlock immediately.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 7. VERIFICATION & CREDENTIAL SAFETY                          */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section id="verification" className="section-block section-emerald">
        <div
          className="geo-shape geo-circle-lg"
          style={{ bottom: '-150px', right: '-100px' }}
        />

        <div
          className="container-flat"
          style={{ position: 'relative', zIndex: 1 }}
        >
          <div
            style={{
              textAlign: 'center',
              maxWidth: '960px',
              margin: '0 auto 3.5rem auto',
            }}
          >
            <span
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                padding: '0.4rem 1rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8125rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                display: 'inline-block',
                marginBottom: '1rem',
              }}
            >
              Parent &amp; Student Peace of Mind
            </span>
            <h2
              style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                marginBottom: '1rem',
                color: '#ffffff',
              }}
            >
              Thorough Background &amp; Credential Verification
            </h2>
            <p
              style={{
                fontSize: '1.125rem',
                opacity: 0.95,
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              No tutor can appear in match results until our administration team
              manually reviews their credentials. Every qualification is backed
              by real documentation.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '2rem',
            }}
          >
            {/* Box 1 */}
            <div
              style={{
                backgroundColor: 'var(--bg-canvas)',
                color: 'var(--fg-main)',
                padding: '2.25rem',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div
                className="flat-icon-circle"
                style={{
                  backgroundColor: 'var(--color-secondary-tint)',
                  color: 'var(--color-secondary)',
                  marginBottom: '1.5rem',
                }}
              >
                <GraduationCap size={28} strokeWidth={2.5} />
              </div>
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  marginBottom: '0.75rem',
                }}
              >
                Official University Degrees
              </h3>
              <p
                style={{
                  color: '#4b5563',
                  fontSize: '0.9375rem',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Graduation diplomas for graduates or verified university
                transcripts for undergraduate tutors from top Thai and
                international institutions.
              </p>
            </div>

            {/* Box 2 */}
            <div
              style={{
                backgroundColor: 'var(--bg-canvas)',
                color: 'var(--fg-main)',
                padding: '2.25rem',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div
                className="flat-icon-circle"
                style={{
                  backgroundColor: 'var(--color-secondary-tint)',
                  color: 'var(--color-secondary)',
                  marginBottom: '1.5rem',
                }}
              >
                <FileCheck size={28} strokeWidth={2.5} />
              </div>
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  marginBottom: '0.75rem',
                }}
              >
                Certified Exam Score Reports
              </h3>
              <p
                style={{
                  color: '#4b5563',
                  fontSize: '0.9375rem',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Tutors teaching specialized test prep (IELTS, Digital SAT, JLPT,
                HSK) must provide authentic, official score transcripts before
                approval.
              </p>
            </div>

            {/* Box 3 */}
            <div
              style={{
                backgroundColor: 'var(--bg-canvas)',
                color: 'var(--fg-main)',
                padding: '2.25rem',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div
                className="flat-icon-circle"
                style={{
                  backgroundColor: 'var(--color-secondary-tint)',
                  color: 'var(--color-secondary)',
                  marginBottom: '1.5rem',
                }}
              >
                <ShieldCheck size={28} strokeWidth={2.5} />
              </div>
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  marginBottom: '0.75rem',
                }}
              >
                Full Resume &amp; Experience Audit
              </h3>
              <p
                style={{
                  color: '#4b5563',
                  fontSize: '0.9375rem',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                We inspect professional CVs, teaching histories, and subject
                expertise so students learn from educators with genuine
                classroom and mentoring experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 8. 4-DIMENSION REVIEW SYSTEM                                 */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="section-block section-white">
        <div className="container-flat">
          <div
            style={{
              textAlign: 'center',
              maxWidth: '960px',
              margin: '0 auto 3.5rem auto',
            }}
          >
            <span
              className="flat-badge flat-badge-primary"
              style={{ marginBottom: '1rem' }}
            >
              Genuine Student Feedback
            </span>
            <h2
              style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                marginBottom: '1rem',
              }}
            >
              100% Verified, Anti-Fraud Reviews
            </h2>
            <p
              style={{
                fontSize: '1.125rem',
                color: '#4b5563',
                lineHeight: 1.6,
              }}
            >
              No anonymous or fake ratings. Only students who actually confirmed
              lessons with a tutor can submit reviews, evaluated across four
              concrete teaching dimensions:
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1.5rem',
            }}
          >
            <div className="flat-card flat-card-muted">
              <span
                style={{
                  fontSize: '2rem',
                  display: 'block',
                  marginBottom: '0.75rem',
                }}
              >
                🧠
              </span>
              <h4
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 800,
                  marginBottom: '0.5rem',
                }}
              >
                1. Knowledge &amp; Mastery
              </h4>
              <p
                style={{
                  color: '#4b5563',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                Depth of subject understanding, accuracy of solutions, and
                ability to handle difficult curriculum problems.
              </p>
            </div>

            <div className="flat-card flat-card-muted">
              <span
                style={{
                  fontSize: '2rem',
                  display: 'block',
                  marginBottom: '0.75rem',
                }}
              >
                📋
              </span>
              <h4
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 800,
                  marginBottom: '0.5rem',
                }}
              >
                2. Lesson Preparation
              </h4>
              <p
                style={{
                  color: '#4b5563',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                Structured syllabus, tailored practice sheets, homework
                follow-ups, and clear lesson goals.
              </p>
            </div>

            <div className="flat-card flat-card-muted">
              <span
                style={{
                  fontSize: '2rem',
                  display: 'block',
                  marginBottom: '0.75rem',
                }}
              >
                💡
              </span>
              <h4
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 800,
                  marginBottom: '0.5rem',
                }}
              >
                3. Clarity &amp; Delivery
              </h4>
              <p
                style={{
                  color: '#4b5563',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                Patient explanations, breaking difficult concepts into simple
                steps, and engaging communication.
              </p>
            </div>

            <div className="flat-card flat-card-muted">
              <span
                style={{
                  fontSize: '2rem',
                  display: 'block',
                  marginBottom: '0.75rem',
                }}
              >
                ⏰
              </span>
              <h4
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 800,
                  marginBottom: '0.5rem',
                }}
              >
                4. Punctuality &amp; Reliability
              </h4>
              <p
                style={{
                  color: '#4b5563',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                Starting and ending lessons on time, schedule reliability, and
                professional responsibility.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 9. TUTOR TIERS FOR EVERY BUDGET                              */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section id="tutors" className="section-block section-muted">
        <div className="container-flat">
          <div
            style={{
              textAlign: 'center',
              maxWidth: '960px',
              margin: '0 auto 3.5rem auto',
            }}
          >
            <span
              className="flat-badge flat-badge-accent"
              style={{ marginBottom: '1rem' }}
            >
              Tutor Profiles
            </span>
            <h2
              style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                marginBottom: '1rem',
              }}
            >
              Diverse Tutor Backgrounds for Every Goal
            </h2>
            <p
              style={{
                fontSize: '1.125rem',
                color: '#4b5563',
                lineHeight: 1.6,
              }}
            >
              Tutors set their own hourly rates freely, and students define
              their own budget. Filter by tutor background to find the mentor
              that best fits your learning needs:
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '2rem',
              alignItems: 'stretch',
            }}
          >
            {/* Tier 1: Undergraduate */}
            <div
              style={{
                backgroundColor: 'var(--bg-canvas)',
                padding: '2.5rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                }}
              >
                <GraduationCap
                  size={24}
                  color="var(--color-primary)"
                  strokeWidth={2.5}
                />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  Undergraduate Tutors
                </h3>
              </div>
              <p
                style={{
                  color: '#4b5563',
                  fontSize: '0.9375rem',
                  marginBottom: '1.5rem',
                  lineHeight: 1.5,
                }}
              >
                Top-ranking university students who recently mastered the same
                exams and can guide students with high empathy.
              </p>
              <ul
                style={{
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  marginBottom: '2rem',
                  fontSize: '0.875rem',
                  color: '#374151',
                  padding: 0,
                  flexGrow: 1,
                }}
              >
                <li
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Check
                    size={18}
                    color="var(--color-primary)"
                    strokeWidth={2.5}
                  />{' '}
                  Relatable peer learning atmosphere
                </li>
                <li
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Check
                    size={18}
                    color="var(--color-primary)"
                    strokeWidth={2.5}
                  />{' '}
                  Fresh, up-to-date test-taking tips
                </li>
                <li
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Check
                    size={18}
                    color="var(--color-primary)"
                    strokeWidth={2.5}
                  />{' '}
                  Ideal for G1–G9 homework &amp; midterm prep
                </li>
              </ul>
              <Link
                to="/login?mode=register&role=student"
                className="flat-btn flat-btn-secondary"
                style={{ width: '100%', textDecoration: 'none' }}
              >
                Find Undergraduate Tutors
              </Link>
            </div>

            {/* Tier 2: Freelance */}
            <div
              style={{
                backgroundColor: 'var(--bg-canvas)',
                padding: '2.5rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                }}
              >
                <Briefcase
                  size={24}
                  color="var(--color-primary)"
                  strokeWidth={2.5}
                />
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    margin: 0,
                  }}
                >
                  Full-Time Freelance Tutors
                </h3>
              </div>
              <p
                style={{
                  color: '#4b5563',
                  fontSize: '0.9375rem',
                  marginBottom: '1.5rem',
                  lineHeight: 1.5,
                }}
              >
                Professional private tutors with years of coaching experience.
                Specialize in dedicated 1-on-1 exam prep, flexible scheduling,
                and custom practice sets.
              </p>
              <ul
                style={{
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  marginBottom: '2rem',
                  fontSize: '0.875rem',
                  color: '#374151',
                  padding: 0,
                  flexGrow: 1,
                }}
              >
                <li
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Check
                    size={18}
                    color="var(--color-primary)"
                    strokeWidth={2.5}
                  />{' '}
                  Customized syllabi &amp; problem sets
                </li>
                <li
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Check
                    size={18}
                    color="var(--color-primary)"
                    strokeWidth={2.5}
                  />{' '}
                  Flexible weekly scheduling slots
                </li>
                <li
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Check
                    size={18}
                    color="var(--color-primary)"
                    strokeWidth={2.5}
                  />{' '}
                  Proven track record with high-school students
                </li>
              </ul>
              <Link
                to="/login?mode=register&role=student"
                className="flat-btn flat-btn-secondary"
                style={{ width: '100%', textDecoration: 'none' }}
              >
                Find Freelance Tutors
              </Link>
            </div>

            {/* Tier 3: Institutional */}
            <div
              style={{
                backgroundColor: 'var(--bg-canvas)',
                padding: '2.5rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                }}
              >
                <Building2
                  size={24}
                  color="var(--color-primary)"
                  strokeWidth={2.5}
                />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  Institutional Teachers
                </h3>
              </div>
              <p
                style={{
                  color: '#4b5563',
                  fontSize: '0.9375rem',
                  marginBottom: '1.5rem',
                  lineHeight: 1.5,
                }}
              >
                Certified school teachers and academy instructors offering
                rigorous foundation building and competitive test prep.
              </p>
              <ul
                style={{
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  marginBottom: '2rem',
                  fontSize: '0.875rem',
                  color: '#374151',
                  padding: 0,
                  flexGrow: 1,
                }}
              >
                <li
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Check
                    size={18}
                    color="var(--color-primary)"
                    strokeWidth={2.5}
                  />{' '}
                  Systematic curriculum mastery
                </li>
                <li
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Check
                    size={18}
                    color="var(--color-primary)"
                    strokeWidth={2.5}
                  />{' '}
                  Advanced SAT, IELTS &amp; Olympiad prep
                </li>
                <li
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Check
                    size={18}
                    color="var(--color-primary)"
                    strokeWidth={2.5}
                  />{' '}
                  Structured milestone reviews
                </li>
              </ul>
              <Link
                to="/login?mode=register&role=student"
                className="flat-btn flat-btn-secondary"
                style={{ width: '100%', textDecoration: 'none' }}
              >
                Browse Institutional Teachers
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 10. FREQUENTLY ASKED QUESTIONS                               */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="section-block section-white">
        <div className="container-flat">
          <div
            style={{
              textAlign: 'center',
              maxWidth: '960px',
              margin: '0 auto 3.5rem auto',
            }}
          >
            <span
              className="flat-badge flat-badge-primary"
              style={{ marginBottom: '1rem' }}
            >
              Common Questions
            </span>
            <h2
              style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                marginBottom: '1rem',
              }}
            >
              Frequently Asked Questions
            </h2>
            <p
              style={{
                fontSize: '1.125rem',
                color: '#4b5563',
                lineHeight: 1.6,
              }}
            >
              Everything you need to know about matching, booking lessons, and
              verified reviews on TutorPair.
            </p>
          </div>

          <div style={{ maxWidth: '840px', margin: '0 auto' }}>
            {/* FAQ 0: 1-on-1 Focus */}
            <div className="faq-item" onClick={() => toggleFaq(4)}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <h4
                  style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0 }}
                >
                  Is TutorPair for group classes or private 1-on-1 tutoring?
                </h4>
                {activeFaq === 4 ? (
                  <ChevronUp size={22} strokeWidth={2.5} />
                ) : (
                  <ChevronDown size={22} strokeWidth={2.5} />
                )}
              </div>
              {activeFaq === 4 && (
                <p
                  style={{
                    marginTop: '0.75rem',
                    color: '#4b5563',
                    fontSize: '0.9375rem',
                    lineHeight: 1.6,
                    marginBottom: 0,
                  }}
                >
                  TutorPair is strictly designed for{' '}
                  <strong>1-on-1 private tutoring</strong>. We match individual
                  students directly to verified private tutors. There are no
                  crowded cohorts or pre-recorded videos — every lesson is
                  personalized 1-to-1 mentorship focused entirely on the
                  student's individual learning goals, pace, and curriculum.
                </p>
              )}
            </div>

            {/* FAQ 0: 1-on-1 Focus */}
            <div className="faq-item" onClick={() => toggleFaq(4)}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <h4
                  style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0 }}
                >
                  Is TutorPair for group classes or private 1-on-1 tutoring?
                </h4>
                {activeFaq === 4 ? (
                  <ChevronUp size={22} strokeWidth={2.5} />
                ) : (
                  <ChevronDown size={22} strokeWidth={2.5} />
                )}
              </div>
              {activeFaq === 4 && (
                <p
                  style={{
                    marginTop: '0.75rem',
                    color: '#4b5563',
                    fontSize: '0.9375rem',
                    lineHeight: 1.6,
                    marginBottom: 0,
                  }}
                >
                  TutorPair is strictly designed for{' '}
                  <strong>1-on-1 private tutoring</strong>. We match individual
                  students directly to verified private tutors. There are no
                  crowded cohorts or pre-recorded videos — every lesson is
                  personalized 1-to-1 mentorship focused entirely on the
                  student's individual learning goals, pace, and curriculum.
                </p>
              )}
            </div>

            {/* FAQ 1 */}
            <div className="faq-item" onClick={() => toggleFaq(0)}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <h4
                  style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0 }}
                >
                  How does the Top 3 tutor matchmaking work?
                </h4>
                {activeFaq === 0 ? (
                  <ChevronUp size={22} strokeWidth={2.5} />
                ) : (
                  <ChevronDown size={22} strokeWidth={2.5} />
                )}
              </div>
              {activeFaq === 0 && (
                <p
                  style={{
                    marginTop: '0.75rem',
                    color: '#4b5563',
                    fontSize: '0.9375rem',
                    lineHeight: 1.6,
                    marginBottom: 0,
                  }}
                >
                  First, we filter out any tutors who don’t match your exact
                  subject, grade level, weekly schedule, or maximum budget.
                  Then, we score compatibility based on your answers to our
                  learning style questions (learning pace, practice style,
                  discussion level). We present the Top 3 best matches so you
                  can compare their full profiles and choose the right educator
                  for you.
                </p>
              )}
            </div>

            {/* FAQ 2 */}
            <div className="faq-item" onClick={() => toggleFaq(1)}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <h4
                  style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0 }}
                >
                  How do I contact my tutor after selecting them?
                </h4>
                {activeFaq === 1 ? (
                  <ChevronUp size={22} strokeWidth={2.5} />
                ) : (
                  <ChevronDown size={22} strokeWidth={2.5} />
                )}
              </div>
              {activeFaq === 1 && (
                <p
                  style={{
                    marginTop: '0.75rem',
                    color: '#4b5563',
                    fontSize: '0.9375rem',
                    lineHeight: 1.6,
                    marginBottom: 0,
                  }}
                >
                  As soon as you confirm a tutor from your Top 3 results, their
                  direct <strong>Phone Number</strong> and{' '}
                  <strong>LINE ID</strong> unlock immediately on your screen and
                  in your Matching History. You can message or call them
                  directly to discuss lesson plans and start learning right
                  away.
                </p>
              )}
            </div>

            {/* FAQ 3 */}
            <div className="faq-item" onClick={() => toggleFaq(2)}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <h4
                  style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0 }}
                >
                  Are tutors vetted before they can teach?
                </h4>
                {activeFaq === 2 ? (
                  <ChevronUp size={22} strokeWidth={2.5} />
                ) : (
                  <ChevronDown size={22} strokeWidth={2.5} />
                )}
              </div>
              {activeFaq === 2 && (
                <p
                  style={{
                    marginTop: '0.75rem',
                    color: '#4b5563',
                    fontSize: '0.9375rem',
                    lineHeight: 1.6,
                    marginBottom: 0,
                  }}
                >
                  Yes, absolutely. Every tutor must upload their resume/CV,
                  proof of degree or university transcript, and official test
                  score certificates (for exams like IELTS, SAT, or JLPT). Our
                  team manually inspects each application, and only approved
                  tutors are eligible to match with students.
                </p>
              )}
            </div>

            {/* FAQ 4 */}
            <div className="faq-item" onClick={() => toggleFaq(3)}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <h4
                  style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0 }}
                >
                  How are student reviews kept fair and honest?
                </h4>
                {activeFaq === 3 ? (
                  <ChevronUp size={22} strokeWidth={2.5} />
                ) : (
                  <ChevronDown size={22} strokeWidth={2.5} />
                )}
              </div>
              {activeFaq === 3 && (
                <p
                  style={{
                    marginTop: '0.75rem',
                    color: '#4b5563',
                    fontSize: '0.9375rem',
                    lineHeight: 1.6,
                    marginBottom: 0,
                  }}
                >
                  Reviews can only be submitted by students who have confirmed a
                  booking with that specific tutor. Each review evaluates four
                  clear criteria: Subject Knowledge, Lesson Preparation, Clarity
                  of Explanation, and Punctuality. This eliminates fake reviews
                  and provides helpful feedback for everyone.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 11. BOLD AMBER CTA SECTION                                   */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="section-block section-amber">
        <div
          className="geo-shape geo-circle-lg"
          style={{ top: '-100px', left: '-100px' }}
        />

        <div
          className="container-flat"
          style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}
        >
          <h2
            style={{
              fontSize: '3rem',
              fontWeight: 800,
              color: 'var(--color-white)',
              marginBottom: '1.25rem',
            }}
          >
            Ready to Find Your Ideal Tutor?
          </h2>
          <p
            style={{
              fontSize: '1.1875rem',
              color: 'var(--color-white)',
              opacity: 0.95,
              maxWidth: '650px',
              margin: '0 auto 2.5rem auto',
              lineHeight: 1.6,
            }}
          >
            Join students and families across Thailand connecting with verified
            educators tailored to their unique pace, curriculum, and goals.
          </p>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1.25rem',
              flexWrap: 'wrap',
            }}
          >
            <Link
              to={
                user ? getDashboardPath() : '/login?mode=register&role=student'
              }
              className="flat-btn flat-btn-lg"
              style={{
                backgroundColor: 'var(--color-white)',
                color: 'var(--color-accent)',
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              Start Free Matching Now
            </Link>
            <Link
              to={user ? getDashboardPath() : '/login?mode=register&role=tutor'}
              className="flat-btn flat-btn-outline-white flat-btn-lg"
              style={{ textDecoration: 'none' }}
            >
              Apply as a Tutor
            </Link>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 12. CLEAN DARK FOOTER                                        */}
      {/* ──────────────────────────────────────────────────────────── */}
      <footer
        className="section-block section-dark"
        style={{ padding: '4rem 0 2rem 0' }}
      >
        <div className="container-flat">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 1fr 1fr 1fr',
              gap: '3rem',
              marginBottom: '3.5rem',
            }}
          >
            {/* Column 1: Brand */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1rem',
                }}
              >
                <div
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-white)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.25rem',
                  }}
                >
                  TP
                </div>
                <span
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: 'var(--color-white)',
                  }}
                >
                  Tutor
                  <span style={{ color: 'var(--color-primary)' }}>Pair</span>
                </span>
              </div>
              <p
                style={{
                  color: '#9ca3af',
                  fontSize: '0.9375rem',
                  lineHeight: 1.6,
                  maxWidth: '320px',
                  marginBottom: '1.5rem',
                }}
              >
                A personalized tutor matchmaking platform for G1–G12 students
                and tutors in Thailand. Verified credentials, compatible
                learning styles, and direct contacts.
              </p>
              <div
                style={{
                  display: 'inline-block',
                  backgroundColor: 'var(--color-dark-surface)',
                  padding: '0.4rem 0.8rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#9ca3af',
                }}
              >
                🇹🇭 Trusted Tutor Matchmaking in Thailand
              </div>
            </div>

            {/* Column 2: Platform */}
            <div>
              <h4
                style={{
                  fontSize: '0.9375rem',
                  fontWeight: 800,
                  color: 'var(--color-white)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '1.25rem',
                }}
              >
                Platform
              </h4>
              <ul
                style={{
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  fontSize: '0.875rem',
                  color: '#9ca3af',
                  padding: 0,
                }}
              >
                <li>
                  <a
                    href="#how-it-works"
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    How It Works
                  </a>
                </li>
                <li>
                  <a
                    href="#matching-system"
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    Learning Style Fit
                  </a>
                </li>
                <li>
                  <a
                    href="#subjects"
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    Academic Subjects
                  </a>
                </li>
                <li>
                  <a
                    href="#verification"
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    Tutor Verification
                  </a>
                </li>
                <li>
                  <Link
                    to="/login?mode=register&role=student"
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    Find a Tutor
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Subjects */}
            <div>
              <h4
                style={{
                  fontSize: '0.9375rem',
                  fontWeight: 800,
                  color: 'var(--color-white)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '1.25rem',
                }}
              >
                Subject Focus
              </h4>
              <ul
                style={{
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  fontSize: '0.875rem',
                  color: '#9ca3af',
                  padding: 0,
                }}
              >
                <li>
                  <a
                    href="#subjects"
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    G1–G12 School Mathematics
                  </a>
                </li>
                <li>
                  <a
                    href="#subjects"
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    Science, Physics &amp; Chemistry
                  </a>
                </li>
                <li>
                  <a
                    href="#subjects"
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    IELTS &amp; English Fluency
                  </a>
                </li>
                <li>
                  <a
                    href="#subjects"
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    Digital SAT Exam Prep
                  </a>
                </li>
                <li>
                  <a
                    href="#subjects"
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    TGAT &amp; TPAT University Prep
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Portals */}
            <div>
              <h4
                style={{
                  fontSize: '0.9375rem',
                  fontWeight: 800,
                  color: 'var(--color-white)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '1.25rem',
                }}
              >
                Access
              </h4>
              <ul
                style={{
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  fontSize: '0.875rem',
                  color: '#9ca3af',
                  padding: 0,
                }}
              >
                <li>
                  <Link
                    to="/login?mode=signin&role=student"
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    Student Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login?mode=register&role=tutor"
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    Apply as Tutor
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login?mode=signin&role=tutor"
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    Tutor Sign In
                  </Link>
                </li>
                <li>
                  <a
                    href="#faq"
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    Frequently Asked Questions
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div
            style={{
              borderTop: '1px solid #374151',
              paddingTop: '2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.8125rem',
              color: '#9ca3af',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              © {new Date().getFullYear()} TutorPair Thailand. All rights
              reserved.
            </div>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <span>Verified Tutors</span>
              <span>•</span>
              <span>Transparent Rates</span>
              <span>•</span>
              <span>Direct Phone &amp; LINE Unlock</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
