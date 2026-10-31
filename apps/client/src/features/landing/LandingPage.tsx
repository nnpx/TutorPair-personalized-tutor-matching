import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { UserRole } from '@tutorpair/shared';
import {
  Sparkles,
  ShieldCheck,
  Award,
  Sliders,
  CheckCircle2,
  FileCheck,
  BookOpen,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Briefcase,
  Building2,
  Check,
  Compass,
} from 'lucide-react';

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
  const [activeCategory, setActiveCategory] = useState<'GENERAL' | 'LANGUAGE' | 'ENTRANCE'>('LANGUAGE');
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  // Interactive state for slider preview in Hero/Algorithm section
  const [previewSlider, setPreviewSlider] = useState<number>(4);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-canvas)' }}>
      {/* ──────────────────────────────────────────────────────────── */}
      {/* 1. STICKY FLAT NAVIGATION BAR (No Shadow, Pure Solid Color)  */}
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
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
              <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg-main)' }}>
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
                Thailand Cloud Match
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <a href="#how-it-works" style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--fg-main)' }}>
              How It Works
            </a>
            <a href="#matching-system" style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--fg-main)' }}>
              1–5 Slider Algorithm
            </a>
            <a href="#subjects" style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--fg-main)' }}>
              Subjects & Exams
            </a>
            <a href="#verification" style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--fg-main)' }}>
              Verification
            </a>
            <a href="#tutors" style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--fg-main)' }}>
              Tutor Tiers
            </a>
            <a href="#faq" style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--fg-main)' }}>
              FAQ
            </a>
          </nav>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {user ? (
              <Link
                to={getDashboardPath()}
                className="flat-btn flat-btn-primary flat-btn-sm"
                style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <span>Go to {user.role.toLowerCase()} Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login?mode=signin"
                  className="flat-btn flat-btn-secondary flat-btn-sm"
                  style={{ fontWeight: 700 }}
                >
                  Sign In
                </Link>
                <Link
                  to="/login?mode=register"
                  className="flat-btn flat-btn-primary flat-btn-sm"
                  style={{ fontWeight: 700 }}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 2. BOLD BLUE HERO SECTION (Flat Poster Look with Geometrics) */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="section-block section-blue" style={{ minHeight: '640px', display: 'flex', alignItems: 'center' }}>
        {/* Subtle Decorative Geometric Shapes (Zero blur, low opacity) */}
        <div className="geo-shape geo-circle-lg" style={{ top: '-120px', right: '-80px' }} />
        <div className="geo-shape geo-square-rot" style={{ bottom: '-100px', left: '-50px' }} />

        <div className="container-flat" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '4rem', alignItems: 'center' }}>
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
                <span style={{ fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Cloud-Native Tutor Matchmaking in Thailand
                </span>
              </div>

              <h1 style={{ fontSize: '3.75rem', lineHeight: 1.1, marginBottom: '1.5rem', color: '#ffffff' }}>
                Stop Searching. <br />
                <span style={{ color: 'var(--color-accent)' }}>Get Matched</span> by Compatibility.
              </h1>

              <p style={{ fontSize: '1.25rem', lineHeight: 1.6, marginBottom: '2.5rem', opacity: 0.95, maxWidth: '600px' }}>
                Connect G1–G12 students with verified private tutors in Thailand. Filter by subject, schedule, and budget, then score compatibility with our scientific 1–5 style and personality algorithm.
              </p>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                <Link
                  to={user ? getDashboardPath() : "/login?mode=register&role=student"}
                  className="flat-btn flat-btn-accent flat-btn-lg"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}
                >
                  <Sparkles size={22} strokeWidth={2.5} />
                  Find Your Top 3 Tutors
                </Link>
                <Link
                  to={user ? getDashboardPath() : "/login?mode=register&role=tutor"}
                  className="flat-btn flat-btn-outline-white flat-btn-lg"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}
                >
                  <GraduationCap size={22} strokeWidth={2.5} />
                  Become a Verified Tutor
                </Link>
              </div>

              {/* Trust Micro-Badges */}
              <div style={{ display: 'flex', gap: '2rem', marginTop: '2.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={20} strokeWidth={2.5} color="var(--color-accent)" />
                  <span style={{ fontSize: '0.9375rem', fontWeight: 600 }}>100% Admin Verified Credentials</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={20} strokeWidth={2.5} color="var(--color-accent)" />
                  <span style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Deterministic Top 3 Ranking</span>
                </div>
              </div>
            </div>

            {/* Right Graphic Poster Box — Live Top Match Candidate Simulation */}
            <div>
              <div
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '2.25rem',
                  color: 'var(--fg-main)',
                  position: 'relative',
                }}
              >
                {/* Match Score Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div>
                    <span className="flat-badge flat-badge-primary" style={{ marginBottom: '0.5rem' }}>
                      #1 Top Recommended Match
                    </span>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Pimchanok V.</h3>
                    <p style={{ color: '#4b5563', fontSize: '0.875rem', fontWeight: 600 }}>
                      Chulalongkorn University • SAT & IELTS Specialist
                    </p>
                  </div>
                  <div
                    style={{
                      backgroundColor: 'var(--color-secondary)',
                      color: 'var(--color-white)',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                    }}
                  >
                    <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 800, lineHeight: 1 }}>98%</span>
                    <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', fontWeight: 700 }}>Match Fit</span>
                  </div>
                </div>

                {/* Compatibility Bars */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    <span>Learning Pace Alignment</span>
                    <span style={{ color: 'var(--color-primary)' }}>Exact Match (5/5)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-muted)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--color-primary)' }} />
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    <span>Guidance & Independence</span>
                    <span style={{ color: 'var(--color-secondary)' }}>High Fit (4.5/5)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-muted)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '90%', height: '100%', backgroundColor: 'var(--color-secondary)' }} />
                  </div>
                </div>

                {/* Verification Checkmarks */}
                <div style={{ backgroundColor: 'var(--color-muted)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <FileCheck size={18} color="var(--color-secondary)" strokeWidth={2.5} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>IELTS Academic: 8.5 Band Certified</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Check size={18} color="var(--color-secondary)" strokeWidth={2.5} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>SAT Math: 780/800 Verified Score</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280' }}>Hourly Rate</span>
                    <p style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-primary)' }}>฿650 / hr</p>
                  </div>
                  <Link to="/login" className="flat-btn flat-btn-primary flat-btn-sm" style={{ padding: '0 1.25rem' }}>
                    View & Confirm →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 3. MULTI-COLOR STATS STRIP (Poster Look, Bold Accent Colors) */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: 'var(--bg-canvas)', borderBottom: '2px solid var(--color-border)', padding: '2.5rem 0' }}>
        <div className="container-flat">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', textAlign: 'center' }}>
            <div>
              <p style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>100%</p>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--fg-main)', marginTop: '0.5rem' }}>Admin Verified Tutors</p>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>Transcripts & test proof validated</p>
            </div>
            <div>
              <p style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--color-secondary)', lineHeight: 1 }}>Top 3</p>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--fg-main)', marginTop: '0.5rem' }}>Ranked Recommendations</p>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>Hard filter + Compatibility score</p>
            </div>
            <div>
              <p style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--color-accent)', lineHeight: 1 }}>1–5</p>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--fg-main)', marginTop: '0.5rem' }}>Scientific Sliders</p>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>5 Style + 4 Personality dimensions</p>
            </div>
            <div>
              <p style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--color-dark)', lineHeight: 1 }}>&lt; 3s</p>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--fg-main)', marginTop: '0.5rem' }}>Instant Matchmaking</p>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>AWS Cloud-native speed</p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 4. THE THAILAND PROBLEM VS. TUTORPAIR SOLUTION               */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="section-block section-muted">
        <div className="container-flat">
          <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 4rem auto' }}>
            <span className="flat-badge flat-badge-primary" style={{ marginBottom: '1rem' }}>
              Why TutorPair Was Built
            </span>
            <h2 style={{ fontSize: '2.75rem', fontWeight: 800, marginBottom: '1rem' }}>
              Finding a Great Tutor in Thailand Shouldn't Be a Gamble
            </h2>
            <p style={{ fontSize: '1.125rem', color: '#4b5563', lineHeight: 1.6 }}>
              Thousands of students in Grades 1–12 search through messy Facebook groups, unverified Line contacts, and word-of-mouth. Here is how TutorPair replaces chaos with structured precision.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
            {/* The Old Way Box */}
            <div style={{ backgroundColor: 'var(--bg-canvas)', padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <span
                  style={{
                    backgroundColor: 'var(--color-danger-tint)',
                    color: 'var(--color-danger)',
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 800,
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                  }}
                >
                  The Old Way in Thailand
                </span>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--color-danger)', fontWeight: 800, fontSize: '1.25rem' }}>✕</div>
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '1.0625rem', marginBottom: '0.25rem' }}>Scattered Social Media Posts</h4>
                    <p style={{ color: '#6b7280', fontSize: '0.9375rem' }}>
                      Hours spent browsing fragmented social groups with missing rate details, stale availability, and no structured profiles.
                    </p>
                  </div>
                </li>
                <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--color-danger)', fontWeight: 800, fontSize: '1.25rem' }}>✕</div>
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '1.0625rem', marginBottom: '0.25rem' }}>Zero Verification or Transcript Proof</h4>
                    <p style={{ color: '#6b7280', fontSize: '0.9375rem' }}>
                      Parents have no way to verify whether a tutor actually scored 8.0 on IELTS, 750 on SAT, or holds an accredited degree.
                    </p>
                  </div>
                </li>
                <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--color-danger)', fontWeight: 800, fontSize: '1.25rem' }}>✕</div>
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '1.0625rem', marginBottom: '0.25rem' }}>High Failure Rate on Personality & Style</h4>
                    <p style={{ color: '#6b7280', fontSize: '0.9375rem' }}>
                      A brilliant tutor who lectures too fast fails a student who needs step-by-step guidance. Subjective mismatch wastes time and money.
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* The TutorPair Way Box */}
            <div style={{ backgroundColor: 'var(--color-primary-tint)', padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <span
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-white)',
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 800,
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                  }}
                >
                  The TutorPair Solution
                </span>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <CheckCircle2 size={24} color="var(--color-primary)" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '1.0625rem', marginBottom: '0.25rem', color: 'var(--color-primary)' }}>
                      Grouped 3-Step Cascading Selection
                    </h4>
                    <p style={{ color: '#374151', fontSize: '0.9375rem' }}>
                      Select Category → Subject → Specific Variant in seconds, dynamically tailored to curriculum or standardized tests.
                    </p>
                  </div>
                </li>
                <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <CheckCircle2 size={24} color="var(--color-primary)" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '1.0625rem', marginBottom: '0.25rem', color: 'var(--color-primary)' }}>
                      Rigorous Admin Document Verification
                    </h4>
                    <p style={{ color: '#374151', fontSize: '0.9375rem' }}>
                      Transcripts, graduation certificates, and standardized test reports are inspected and approved by admins before tutors can be matched.
                    </p>
                  </div>
                </li>
                <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <CheckCircle2 size={24} color="var(--color-primary)" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '1.0625rem', marginBottom: '0.25rem', color: 'var(--color-primary)' }}>
                      1–5 Slider Pedagogical Matchmaking
                    </h4>
                    <p style={{ color: '#374151', fontSize: '0.9375rem' }}>
                      Pace, guidance style, communication vibe, and discipline are paired mathematically to guarantee natural teaching rapport.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 5. THE GROUPED 3-STEP SELECTION SHOWCASE                     */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section id="subjects" className="section-block section-white">
        <div className="container-flat">
          <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3.5rem auto' }}>
            <span className="flat-badge flat-badge-secondary" style={{ marginBottom: '1rem' }}>
              Academic Scope & Flow
            </span>
            <h2 style={{ fontSize: '2.75rem', fontWeight: 800, marginBottom: '1rem' }}>
              The Grouped 3-Step Selection Flow
            </h2>
            <p style={{ fontSize: '1.125rem', color: '#4b5563', lineHeight: 1.6 }}>
              No repetitive questionnaires. Both students and tutors define learning goals through our unified 3-step hierarchy:
            </p>
          </div>

          {/* Category Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
            <button
              onClick={() => setActiveCategory('LANGUAGE')}
              className={`flat-btn ${activeCategory === 'LANGUAGE' ? 'flat-btn-primary' : 'flat-btn-secondary'}`}
              style={{ fontWeight: 700 }}
            >
              <Compass size={20} strokeWidth={2.2} />
              Language Testing (IELTS, HSK, JLPT)
            </button>
            <button
              onClick={() => setActiveCategory('ENTRANCE')}
              className={`flat-btn ${activeCategory === 'ENTRANCE' ? 'flat-btn-primary' : 'flat-btn-secondary'}`}
              style={{ fontWeight: 700 }}
            >
              <Award size={20} strokeWidth={2.2} />
              University Entrance (SAT, TGAT, TPAT)
            </button>
            <button
              onClick={() => setActiveCategory('GENERAL')}
              className={`flat-btn ${activeCategory === 'GENERAL' ? 'flat-btn-primary' : 'flat-btn-secondary'}`}
              style={{ fontWeight: 700 }}
            >
              <BookOpen size={20} strokeWidth={2.2} />
              General Learning (Math, Physics, Bio)
            </button>
          </div>

          {/* Interactive Flow Visualizer */}
          <div style={{ backgroundColor: 'var(--color-muted)', padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
              {/* Step 1 */}
              <div style={{ backgroundColor: 'var(--bg-canvas)', padding: '1.75rem', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-primary)' }}>
                  Step 1
                </span>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0.5rem 0 1rem 0' }}>Select Category</h4>
                <div style={{ padding: '0.875rem', backgroundColor: 'var(--color-primary-tint)', borderRadius: 'var(--radius-md)', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {activeCategory === 'LANGUAGE' && 'Language Testing'}
                  {activeCategory === 'ENTRANCE' && 'University Entrance Exams'}
                  {activeCategory === 'GENERAL' && 'General Learning (School)'}
                </div>
              </div>

              {/* Step 2 */}
              <div style={{ backgroundColor: 'var(--bg-canvas)', padding: '1.75rem', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-secondary)' }}>
                  Step 2
                </span>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0.5rem 0 1rem 0' }}>Select Subject</h4>
                <div style={{ padding: '0.875rem', backgroundColor: 'var(--color-secondary-tint)', borderRadius: 'var(--radius-md)', fontWeight: 700, color: 'var(--color-secondary)' }}>
                  {activeCategory === 'LANGUAGE' && 'Japanese / English'}
                  {activeCategory === 'ENTRANCE' && 'SAT / TGAT Comprehensive'}
                  {activeCategory === 'GENERAL' && 'Mathematics (G1–G12)'}
                </div>
              </div>

              {/* Step 3 */}
              <div style={{ backgroundColor: 'var(--bg-canvas)', padding: '1.75rem', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-accent)' }}>
                  Step 3
                </span>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0.5rem 0 1rem 0' }}>Grouped Variants</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {activeCategory === 'LANGUAGE' && (
                    <>
                      <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--color-muted)', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 700 }}>
                        ★ Standardized: JLPT N1 / N2 (Proof Required)
                      </div>
                      <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--color-muted)', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 700 }}>
                        ★ Practical: Daily Conversation & Business
                      </div>
                    </>
                  )}
                  {activeCategory === 'ENTRANCE' && (
                    <>
                      <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--color-muted)', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 700 }}>
                        ★ SAT Digital: Math & Reading / Writing
                      </div>
                      <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--color-muted)', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 700 }}>
                        ★ TGAT 1, 2, 3 (Thai University Central)
                      </div>
                    </>
                  )}
                  {activeCategory === 'GENERAL' && (
                    <>
                      <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--color-muted)', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 700 }}>
                        ★ Primary School Math (G1–G6)
                      </div>
                      <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--color-muted)', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 700 }}>
                        ★ High School Math (G10–G12 Calculus)
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Dynamic UI Conditional Logic Banner */}
            <div
              style={{
                marginTop: '2rem',
                padding: '1.25rem 1.75rem',
                backgroundColor: 'var(--bg-canvas)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <div
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-primary-tint)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Sliders size={20} strokeWidth={2.5} />
              </div>
              <p style={{ fontSize: '0.9375rem', color: '#4b5563', margin: 0 }}>
                <strong>Dynamic Conditional Fields:</strong> Grade levels (G1–G12) appear automatically when school curriculum variants are selected, and disappear for standardized tests like SAT and IELTS to keep forms clean and fast.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 6. THE 1-5 SLIDER MATCHMAKING ALGORITHM                      */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section id="matching-system" className="section-block section-muted">
        <div className="container-flat">
          <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3.5rem auto' }}>
            <span className="flat-badge flat-badge-accent" style={{ marginBottom: '1rem' }}>
              Scientific Compatibility
            </span>
            <h2 style={{ fontSize: '2.75rem', fontWeight: 800, marginBottom: '1rem' }}>
              1–5 Slider Style & Personality Pairing
            </h2>
            <p style={{ fontSize: '1.125rem', color: '#4b5563', lineHeight: 1.6 }}>
              Students and tutors answer symmetrical 1–5 slider questions. Our two-stage engine filters hard constraints, then computes Euclidean vector distances to surface the Top 3 matches.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>
            {/* The Sliders Visual Breakdown */}
            <div style={{ backgroundColor: 'var(--bg-canvas)', padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
              <h3 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--color-primary)' }}>
                5 Learning Style Sliders (Student vs. Tutor)
              </h3>

              {/* Slider 1 Interactive Demo */}
              <div style={{ marginBottom: '1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.5rem' }}>
                  <span>1. Learning Pace</span>
                  <span style={{ color: 'var(--color-primary)' }}>Value: {previewSlider} / 5</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.8125rem', color: '#6b7280', flex: 1, textAlign: 'right' }}>Step-by-step carefully</span>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={previewSlider}
                    onChange={(e) => setPreviewSlider(parseInt(e.target.value, 10))}
                    style={{ width: '180px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.8125rem', color: '#6b7280', flex: 1, textAlign: 'left' }}>Focus on key points fast</span>
                </div>
              </div>

              {/* Slider 2 */}
              <div style={{ marginBottom: '1.5rem', opacity: 0.9 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.35rem' }}>2. Practice vs. Concept</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#6b7280' }}>
                  <span>Doing a lot of practice questions (1)</span>
                  <span>Understanding concept first (5)</span>
                </div>
              </div>

              {/* Slider 3 */}
              <div style={{ marginBottom: '1.5rem', opacity: 0.9 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.35rem' }}>3. Classroom Interaction</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#6b7280' }}>
                  <span>Chat & discuss with tutor (1)</span>
                  <span>Listen quietly without interruptions (5)</span>
                </div>
              </div>

              {/* Slider 4 */}
              <div style={{ marginBottom: '1.5rem', opacity: 0.9 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.35rem' }}>4. Guidance Style</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#6b7280' }}>
                  <span>Guide me step-by-step (1)</span>
                  <span>Let me think & try by myself (5)</span>
                </div>
              </div>

              {/* Slider 5 */}
              <div style={{ opacity: 0.9 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.35rem' }}>5. Lesson Atmosphere</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#6b7280' }}>
                  <span>Fun and relaxed (1)</span>
                  <span>Quiet & serious concentration (5)</span>
                </div>
              </div>
            </div>

            {/* Two-Stage Matching Process Poster */}
            <div>
              <div style={{ backgroundColor: 'var(--color-dark)', color: 'var(--color-white)', padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--color-accent)' }}>
                  Two-Stage Deterministic Pipeline
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Stage 1 */}
                  <div style={{ borderLeft: '4px solid var(--color-primary)', paddingLeft: '1.25rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-primary)' }}>
                      Stage 1: Strict Hard Filters
                    </span>
                    <h4 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0.25rem 0' }}>Pass / Fail Gate</h4>
                    <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                      Status = APPROVED • Exact Subject Variant Match • Grade Level Match • Online/Onsite Compatibility • Overlapping Availability Slot.
                    </p>
                  </div>

                  {/* Stage 2 */}
                  <div style={{ borderLeft: '4px solid var(--color-secondary)', paddingLeft: '1.25rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-secondary)' }}>
                      Stage 2: Weighted Scoring (0–100%)
                    </span>
                    <h4 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0.25rem 0' }}>Multi-Dimensional Distance</h4>
                    <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                      Learning Style (5 Sliders) + Personality Fit (4 Sliders) + Budget Proximity + Tutor Type (Undergrad / Freelance / Inst) + Gender Preference.
                    </p>
                  </div>

                  {/* Result */}
                  <div style={{ borderLeft: '4px solid var(--color-accent)', paddingLeft: '1.25rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-accent)' }}>
                      Outcome
                    </span>
                    <h4 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0.25rem 0' }}>Top 3 Recommendations</h4>
                    <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                      Student reviews CV, qualifications, and past student reviews, then selects and confirms exactly 1 tutor to begin lessons.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 7. VERIFICATION & TRUST (Emerald Section)                    */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section id="verification" className="section-block section-emerald">
        {/* Decorative Shapes */}
        <div className="geo-shape geo-circle-lg" style={{ bottom: '-150px', right: '-100px' }} />

        <div className="container-flat" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3.5rem auto' }}>
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
              Zero Impersonation
            </span>
            <h2 style={{ fontSize: '2.75rem', fontWeight: 800, marginBottom: '1rem', color: '#ffffff' }}>
              Rigorous Admin Verification & Secure S3 Storage
            </h2>
            <p style={{ fontSize: '1.125rem', opacity: 0.95, lineHeight: 1.6 }}>
              No tutor can appear in student match results until our administrator team reviews their credentials. All verification files are stored privately on Amazon S3.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
            {/* Box 1 */}
            <div style={{ backgroundColor: 'var(--bg-canvas)', color: 'var(--fg-main)', padding: '2.25rem', borderRadius: 'var(--radius-lg)' }}>
              <div className="flat-icon-circle" style={{ backgroundColor: 'var(--color-secondary-tint)', color: 'var(--color-secondary)', marginBottom: '1.5rem' }}>
                <GraduationCap size={28} strokeWidth={2.5} />
              </div>
              <h3 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '0.75rem' }}>Transcripts & Degrees</h3>
              <p style={{ color: '#4b5563', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                Graduation certificates for graduates or verified university transcripts for active undergraduate tutors (Chulalongkorn, Thammasat, Mahidol, etc.).
              </p>
            </div>

            {/* Box 2 */}
            <div style={{ backgroundColor: 'var(--bg-canvas)', color: 'var(--fg-main)', padding: '2.25rem', borderRadius: 'var(--radius-lg)' }}>
              <div className="flat-icon-circle" style={{ backgroundColor: 'var(--color-secondary-tint)', color: 'var(--color-secondary)', marginBottom: '1.5rem' }}>
                <FileCheck size={28} strokeWidth={2.5} />
              </div>
              <h3 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '0.75rem' }}>Test Score Reports</h3>
              <p style={{ color: '#4b5563', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                Dynamic upload triggers require official score documents for test variants (IELTS, SAT, JLPT, TGAT/TPAT) before teaching approval.
              </p>
            </div>

            {/* Box 3 */}
            <div style={{ backgroundColor: 'var(--bg-canvas)', color: 'var(--fg-main)', padding: '2.25rem', borderRadius: 'var(--radius-lg)' }}>
              <div className="flat-icon-circle" style={{ backgroundColor: 'var(--color-secondary-tint)', color: 'var(--color-secondary)', marginBottom: '1.5rem' }}>
                <ShieldCheck size={28} strokeWidth={2.5} />
              </div>
              <h3 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '0.75rem' }}>Admin Audit Log</h3>
              <p style={{ color: '#4b5563', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                Every approval or rejection is logged with mandatory rationale notes. Tutors receive automated notifications directly via Amazon SES.
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
          <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3.5rem auto' }}>
            <span className="flat-badge flat-badge-primary" style={{ marginBottom: '1rem' }}>
              Accountability & Feedback
            </span>
            <h2 style={{ fontSize: '2.75rem', fontWeight: 800, marginBottom: '1rem' }}>
              Verified 4-Category Student Reviews
            </h2>
            <p style={{ fontSize: '1.125rem', color: '#4b5563', lineHeight: 1.6 }}>
              No fake or anonymous ratings. Only students who confirmed a tutor from their Top 3 matches can submit reviews, evaluated across four concrete dimensions:
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
            <div className="flat-card flat-card-muted">
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.75rem' }}>🧠</span>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>1. Knowledge</h4>
              <p style={{ color: '#4b5563', fontSize: '0.875rem', lineHeight: 1.5 }}>
                Depth of subject mastery, accuracy of solutions, and ability to handle difficult curriculum problems.
              </p>
            </div>

            <div className="flat-card flat-card-muted">
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.75rem' }}>📋</span>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>2. Preparation</h4>
              <p style={{ color: '#4b5563', fontSize: '0.875rem', lineHeight: 1.5 }}>
                Lesson plans, curated practice materials, homework follow-ups, and clear learning milestones.
              </p>
            </div>

            <div className="flat-card flat-card-muted">
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.75rem' }}>💡</span>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>3. Clarity</h4>
              <p style={{ color: '#4b5563', fontSize: '0.875rem', lineHeight: 1.5 }}>
                Explanation skills, patient communication, and breaking complex topics into digestible steps.
              </p>
            </div>

            <div className="flat-card flat-card-muted">
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.75rem' }}>⏰</span>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>4. Punctuality</h4>
              <p style={{ color: '#4b5563', fontSize: '0.875rem', lineHeight: 1.5 }}>
                Time management, session reliability, following agreed schedules, and professional conduct.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 9. TUTOR TIERS / CATEGORIES (Dramatic Scale on Popular Tier) */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section id="tutors" className="section-block section-muted">
        <div className="container-flat">
          <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3.5rem auto' }}>
            <span className="flat-badge flat-badge-accent" style={{ marginBottom: '1rem' }}>
              Transparent Options
            </span>
            <h2 style={{ fontSize: '2.75rem', fontWeight: 800, marginBottom: '1rem' }}>
              Choose by Tutor Background & Budget
            </h2>
            <p style={{ fontSize: '1.125rem', color: '#4b5563', lineHeight: 1.6 }}>
              Whether you need affordable peer tutoring or institutional mastery, select your preference:
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', alignItems: 'center' }}>
            {/* Tier 1: Undergraduate */}
            <div style={{ backgroundColor: 'var(--bg-canvas)', padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <GraduationCap size={24} color="var(--color-primary)" strokeWidth={2.5} />
                <h3 style={{ fontSize: '1.375rem', fontWeight: 800 }}>Undergraduate</h3>
              </div>
              <p style={{ color: '#4b5563', fontSize: '0.9375rem', marginBottom: '1.5rem' }}>
                High-achieving university students from top Thai institutions who recently aced exams.
              </p>
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--fg-main)' }}>฿250–฿450</span>
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}> / hour</span>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem', fontSize: '0.875rem', color: '#374151' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={18} color="var(--color-primary)" strokeWidth={2.5} /> Relatable peer learning pace
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={18} color="var(--color-primary)" strokeWidth={2.5} /> Recent test-taking insights
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={18} color="var(--color-primary)" strokeWidth={2.5} /> Ideal for G1–G9 students
                </li>
              </ul>
              <Link to="/login" className="flat-btn flat-btn-secondary" style={{ width: '100%' }}>
                Browse Undergrads
              </Link>
            </div>

            {/* Tier 2: Freelance (POPULAR - Dramatic Scale Effect) */}
            <div
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-white)',
                padding: '3rem 2.5rem',
                borderRadius: 'var(--radius-lg)',
                transform: 'scale(1.05)', /* Popular tier starts larger */
                zIndex: 2,
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  backgroundColor: 'var(--color-accent)',
                  color: 'var(--color-white)',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '0.25rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  marginBottom: '1rem',
                }}
              >
                Most Popular Match
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Briefcase size={24} color="#ffffff" strokeWidth={2.5} />
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff' }}>Freelance Tutor</h3>
              </div>
              <p style={{ opacity: 0.95, fontSize: '0.9375rem', marginBottom: '1.5rem' }}>
                Full-time dedicated educators with years of proven track records in standardized tests.
              </p>
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '2.25rem', fontWeight: 800, color: '#ffffff' }}>฿500–฿900</span>
                <span style={{ opacity: 0.8, fontSize: '0.875rem' }}> / hour</span>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem', fontSize: '0.875rem', color: '#ffffff' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={18} color="var(--color-accent)" strokeWidth={2.5} /> Tailored test preparation
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={18} color="var(--color-accent)" strokeWidth={2.5} /> High schedule flexibility
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={18} color="var(--color-accent)" strokeWidth={2.5} /> Proven score improvements
                </li>
              </ul>
              <Link to="/login" className="flat-btn flat-btn-accent" style={{ width: '100%' }}>
                Find Freelance Tutors
              </Link>
            </div>

            {/* Tier 3: Institutional */}
            <div style={{ backgroundColor: 'var(--bg-canvas)', padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Building2 size={24} color="var(--color-dark)" strokeWidth={2.5} />
                <h3 style={{ fontSize: '1.375rem', fontWeight: 800 }}>Institutional</h3>
              </div>
              <p style={{ color: '#4b5563', fontSize: '0.9375rem', marginBottom: '1.5rem' }}>
                Affiliated with recognized tutoring academies and specialized test prep centers.
              </p>
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--fg-main)' }}>฿1,000+</span>
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}> / hour</span>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem', fontSize: '0.875rem', color: '#374151' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={18} color="var(--color-dark)" strokeWidth={2.5} /> Academy curriculum & mock tests
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={18} color="var(--color-dark)" strokeWidth={2.5} /> Specialized SAT/IELTS programs
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={18} color="var(--color-dark)" strokeWidth={2.5} /> Intensive study regimens
                </li>
              </ul>
              <Link to="/login" className="flat-btn flat-btn-secondary" style={{ width: '100%' }}>
                Browse Institutional
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 10. FAQ SECTION (Thick Border-2 Dividers as Specified)        */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="section-block section-white">
        <div className="container-flat">
          <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3.5rem auto' }}>
            <span className="flat-badge flat-badge-primary" style={{ marginBottom: '1rem' }}>
              Common Questions
            </span>
            <h2 style={{ fontSize: '2.75rem', fontWeight: 800, marginBottom: '1rem' }}>
              Frequently Asked Questions
            </h2>
            <p style={{ fontSize: '1.125rem', color: '#4b5563', lineHeight: 1.6 }}>
              Everything you need to know about TutorPair's matchmaking, verification, and reviews.
            </p>
          </div>

          <div style={{ maxWidth: '840px', margin: '0 auto' }}>
            {/* FAQ 1 */}
            <div className="faq-item" onClick={() => toggleFaq(0)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '1.1875rem', fontWeight: 800 }}>
                  How does the Top 3 matchmaking algorithm work?
                </h4>
                {activeFaq === 0 ? <ChevronUp size={24} strokeWidth={2.5} /> : <ChevronDown size={24} strokeWidth={2.5} />}
              </div>
              {activeFaq === 0 && (
                <p style={{ marginTop: '0.75rem', color: '#4b5563', fontSize: '1rem', lineHeight: 1.6 }}>
                  Our algorithm runs in two distinct stages: First, <strong>Hard Filters</strong> eliminate tutors who do not meet your required subject variant, grade level, schedule availability, or online/onsite preference. Next, <strong>Weighted Compatibility Scoring</strong> evaluates the vector distance between your 1–5 slider responses and the tutor's teaching traits, sorting eligible tutors to present the Top 3 recommendations.
                </p>
              )}
            </div>

            {/* FAQ 2 */}
            <div className="faq-item" onClick={() => toggleFaq(1)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '1.1875rem', fontWeight: 800 }}>
                  Can any tutor sign up and start teaching immediately?
                </h4>
                {activeFaq === 1 ? <ChevronUp size={24} strokeWidth={2.5} /> : <ChevronDown size={24} strokeWidth={2.5} />}
              </div>
              {activeFaq === 1 && (
                <p style={{ marginTop: '0.75rem', color: '#4b5563', fontSize: '1rem', lineHeight: 1.6 }}>
                  No. Tutors must upload their resume/CV, graduation certificate (or university transcript for undergraduates), and official score reports for test-based subjects (IELTS, SAT, JLPT, etc.). Only tutors with an <strong>APPROVED</strong> verification status by platform administrators are eligible to appear in student match results.
                </p>
              )}
            </div>

            {/* FAQ 3 */}
            <div className="faq-item" onClick={() => toggleFaq(2)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '1.1875rem', fontWeight: 800 }}>
                  How are tutor reviews kept honest and verified?
                </h4>
                {activeFaq === 2 ? <ChevronUp size={24} strokeWidth={2.5} /> : <ChevronDown size={24} strokeWidth={2.5} />}
              </div>
              {activeFaq === 2 && (
                <p style={{ marginTop: '0.75rem', color: '#4b5563', fontSize: '1rem', lineHeight: 1.6 }}>
                  Review submission is gated by database records. A student can only submit a review for a tutor they have matched with and confirmed in their Matching History. Reviews are structured across four specific 1–5 star ratings (Knowledge, Preparation, Clarity, Punctuality) plus a written comment.
                </p>
              )}
            </div>

            {/* FAQ 4 */}
            <div className="faq-item" onClick={() => toggleFaq(3)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '1.1875rem', fontWeight: 800 }}>
                  Can I choose between online lessons and onsite tutoring?
                </h4>
                {activeFaq === 3 ? <ChevronUp size={24} strokeWidth={2.5} /> : <ChevronDown size={24} strokeWidth={2.5} />}
              </div>
              {activeFaq === 3 && (
                <p style={{ marginTop: '0.75rem', color: '#4b5563', fontSize: '1rem', lineHeight: 1.6 }}>
                  Yes! When students submit their matching preferences, they can specify Online, Onsite, or Both. Tutors also specify their delivery capabilities, and the hard filter ensures only matching delivery modes are recommended.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 11. BOLD AMBER CTA SECTION (Poster Call-to-Action)           */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="section-block section-amber">
        <div className="geo-shape geo-circle-lg" style={{ top: '-100px', left: '-100px' }} />

        <div className="container-flat" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: '3.25rem', fontWeight: 800, color: 'var(--color-white)', marginBottom: '1.25rem' }}>
            Ready to Find Your Ideal Tutor?
          </h2>
          <p style={{ fontSize: '1.25rem', color: 'var(--color-white)', opacity: 0.95, maxWidth: '650px', margin: '0 auto 2.5rem auto', lineHeight: 1.6 }}>
            Join students across Thailand matching with verified educators tailored to their unique pace, curriculum, and goals.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <Link
              to={user ? getDashboardPath() : "/login?mode=register&role=student"}
              className="flat-btn flat-btn-lg"
              style={{
                backgroundColor: 'var(--color-white)',
                color: 'var(--color-accent)',
                fontWeight: 800,
              }}
            >
              Start Free Matching Now
            </Link>
            <Link
              to={user ? getDashboardPath() : "/login?mode=signin&role=tutor"}
              className="flat-btn flat-btn-outline-white flat-btn-lg"
            >
              Sign In as Tutor
            </Link>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 12. GRAPHIC DARK GRAY FOOTER (Flat Grid, Clear Typography)    */}
      {/* ──────────────────────────────────────────────────────────── */}
      <footer className="section-block section-dark" style={{ padding: '4rem 0 2rem 0' }}>
        <div className="container-flat">
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '3rem', marginBottom: '3.5rem' }}>
            {/* Column 1: Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
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
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-white)' }}>
                  Tutor<span style={{ color: 'var(--color-primary)' }}>Pair</span>
                </span>
              </div>
              <p style={{ color: '#9ca3af', fontSize: '0.9375rem', lineHeight: 1.6, maxWidth: '320px', marginBottom: '1.5rem' }}>
                Cloud-native tutor matchmaking platform for G1–G12 students and tutors in Thailand. Structured profiles, admin verification, and deterministic scoring.
              </p>
              <div style={{ display: 'inline-block', backgroundColor: 'var(--color-dark-surface)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af' }}>
                ☁ Powered by AWS Amplify & ECS Fargate
              </div>
            </div>

            {/* Column 2: Platform */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-white)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.25rem' }}>
                Platform
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9375rem', color: '#9ca3af' }}>
                <li><a href="#how-it-works" style={{ color: 'inherit' }}>How It Works</a></li>
                <li><a href="#matching-system" style={{ color: 'inherit' }}>1–5 Slider System</a></li>
                <li><a href="#subjects" style={{ color: 'inherit' }}>Academic Scope</a></li>
                <li><a href="#verification" style={{ color: 'inherit' }}>Tutor Verification</a></li>
                <li><Link to={user ? getDashboardPath() : "/login?mode=register&role=student"} style={{ color: 'inherit' }}>Student Matching Portal</Link></li>
              </ul>
            </div>

            {/* Column 3: Subjects */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-white)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.25rem' }}>
                Exam Prep
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9375rem', color: '#9ca3af' }}>
                <li><a href="#subjects" style={{ color: 'inherit' }}>IELTS Academic</a></li>
                <li><a href="#subjects" style={{ color: 'inherit' }}>SAT Digital (Math & R&W)</a></li>
                <li><a href="#subjects" style={{ color: 'inherit' }}>TGAT & TPAT (Thai Univ)</a></li>
                <li><a href="#subjects" style={{ color: 'inherit' }}>JLPT & HSK Language</a></li>
                <li><a href="#subjects" style={{ color: 'inherit' }}>G1–G12 Curriculum Math</a></li>
              </ul>
            </div>

            {/* Column 4: Portals */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-white)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.25rem' }}>
                Quick Access
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9375rem', color: '#9ca3af' }}>
                <li><Link to={user ? getDashboardPath() : "/login?mode=signin&role=student"} style={{ color: 'inherit' }}>Student Sign In</Link></li>
                <li><Link to={user ? getDashboardPath() : "/login?mode=register&role=tutor"} style={{ color: 'inherit' }}>Tutor Application</Link></li>
                <li><Link to={user ? getDashboardPath() : "/login?mode=signin&role=admin"} style={{ color: 'inherit' }}>Admin Verification Login</Link></li>
                <li><a href="#faq" style={{ color: 'inherit' }}>Help & Support</a></li>
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
              fontSize: '0.875rem',
              color: '#9ca3af',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              © {new Date().getFullYear()} TutorPair Thailand. All rights reserved. Built with Flat Design principles.
            </div>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <span>Zero Artificial Depth</span>
              <span>•</span>
              <span>Color as Structure</span>
              <span>•</span>
              <span>Pure Geometric Hierarchy</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
