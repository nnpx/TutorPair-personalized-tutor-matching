import { apiClient } from '../../services/api-client';
import { useQueryClient } from '@tanstack/react-query';
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Button, Modal } from '../../components/ui';
import { useStudentProfile, useStudentAvailability } from '../students/hooks/useStudents';
import { StudentSubjectSelector } from '../students/components/StudentSubjectSelector';
import { StudentAvailabilityGrid } from '../students/components/StudentAvailabilityGrid';
import { DayOfWeek, type StudentSubjectItemDto, type StudentAvailabilitySlotDto, type MatchRecommendationDto } from '@tutorpair/shared';
import { useRunMatch, useConfirmTutor } from './hooks/useMatching';
import { TutorDetailModal } from '../tutors/components/TutorDetailModal';
import {
  Sparkles,
  ArrowLeft,
  Calendar,
  RotateCcw,
  CheckCircle2,
  Trophy,
  Star,
  UserCheck,
  Phone,
  MessageCircle,
  Mail,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { tutorsApi } from '../tutors/tutors.api';

export const MatchRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useStudentProfile();
  const { data: serverAvailability } = useStudentAvailability();

  // Scroll to top on load
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  // Guard: Check profile completeness
  const isProfileReady = Boolean(
    profile &&
    profile.first_name &&
    profile.last_name &&
    profile.grade_level &&
    profile.style_profile &&
    profile.style_profile.length === 5 &&
    profile.personality_profile &&
    profile.personality_profile.length === 4
  );

  // Form states
  const [selectedSubject, setSelectedSubject] = useState<StudentSubjectItemDto | null>(null);
  const [matchBudget, setMatchBudget] = useState<number | ''>('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Validation modal state
  const [isValidationModalOpen, setIsValidationModalOpen] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Schedule slot state — using standard StudentAvailabilitySlotDto
  const [matchSlots, setMatchSlots] = useState<StudentAvailabilitySlotDto[]>([]);

  // Matching execution & Top 3 results state (Module 6)
  const runMatchMutation = useRunMatch();
  const confirmTutorMutation = useConfirmTutor();

  // Active modal inspection states
  const [inspectTutorId, setInspectTutorId] = useState<string | null>(null);
  const [confirmingRec, setConfirmingRec] = useState<MatchRecommendationDto | null>(null);
  const [confirmedSuccessData, setConfirmedSuccessData] = useState<{
    tutorName: string;
    phone?: string | null;
    lineId?: string | null;
    email?: string | null;
  } | null>(null);

  // Pre-populate budget from student profile once
  const hasInitializedBudget = useRef(false);
  useEffect(() => {
    if (profile?.budget_max && !hasInitializedBudget.current) {
      setMatchBudget(Number(profile.budget_max));
      hasInitializedBudget.current = true;
    }
  }, [profile?.budget_max]);

  // Smart Pre-Fill: Automatically pull saved weekly availability from profile
  const hasInitializedSlots = useRef(false);
  useEffect(() => {
    if (serverAvailability && !hasInitializedSlots.current) {
      if (serverAvailability.length > 0) {
        setMatchSlots(
          serverAvailability.map((s) => ({
            day_of_week: s.day_of_week as DayOfWeek,
            start_time: s.start_time.length > 5 ? s.start_time.slice(0, 5) : s.start_time,
            end_time: s.end_time.length > 5 ? s.end_time.slice(0, 5) : s.end_time,
          }))
        );
      } else {
        setMatchSlots([
          { day_of_week: DayOfWeek.MONDAY, start_time: '17:00', end_time: '19:00' },
        ]);
      }
      hasInitializedSlots.current = true;
    }
  }, [serverAvailability]);

  const handleResetToProfileSchedule = () => {
    if (serverAvailability && serverAvailability.length > 0) {
      setMatchSlots(
        serverAvailability.map((s) => ({
          day_of_week: s.day_of_week as DayOfWeek,
          start_time: s.start_time.length > 5 ? s.start_time.slice(0, 5) : s.start_time,
          end_time: s.end_time.length > 5 ? s.end_time.slice(0, 5) : s.end_time,
        }))
      );
    }
  };

  const handleFindTutors = () => {
    if (runMatchMutation.isPending) return;
    setSubmitError(null);
    const errors: string[] = [];

    if (!selectedSubject) {
      errors.push('Target Subject & Goal: Please select 1 subject and learning goal variant in Step 1.');
    }
    if (!matchBudget || Number(matchBudget) < 100) {
      errors.push('Hourly Budget: Please specify a valid hourly budget of at least ฿100/hr (cannot be blank or zero).');
    }
    if (matchSlots.length === 0) {
      errors.push('Preferred Schedule: Please add at least one convenient weekly time slot in Step 2.');
    }

    if (errors.length > 0 || !selectedSubject) {
      setSubmitError(errors[0] || 'Please complete all required fields.');
      setValidationErrors(errors);
      setIsValidationModalOpen(true);
      return;
    }

    // Persist budget and availability before running match
    apiClient.patch('/api/students/profile', { budget_max: Number(matchBudget) }).catch(console.error);
    apiClient.put('/api/students/availability', { availability: matchSlots }).catch(console.error);
    queryClient.invalidateQueries({ queryKey: ['students'] }).catch(console.error);

    // Trigger Module 6 Matching Engine!
    runMatchMutation.mutate(selectedSubject.variant_id);
  };

  const handleConfirmAction = () => {
    if (!confirmingRec || !runMatchMutation.data) return;

    const tutorId = confirmingRec.tutor.tutor_id;
    const tutorName = `${confirmingRec.tutor.first_name} ${confirmingRec.tutor.last_name}`;

    confirmTutorMutation.mutate(
      {
        matchRequestId: runMatchMutation.data.match_request_id,
        data: {
          recommendation_id: confirmingRec.recommendation_id,
          tutor_id: tutorId,
        },
      },
      {
        onSuccess: async () => {
          try {
            const tutorDetails = await tutorsApi.getPublicDetails(tutorId);
            setConfirmedSuccessData({
              tutorName,
              phone: tutorDetails.phone_number,
              lineId: tutorDetails.line_id,
              email: tutorDetails.email,
            });
          } catch {
            setConfirmedSuccessData({
              tutorName,
            });
          }
          setConfirmingRec(null);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div style={{ maxWidth: '960px', margin: '3rem auto', textAlign: 'center' }}>
        <Card style={{ padding: '3rem' }}>
          <p style={{ fontWeight: 700, color: '#6b7280' }}>Loading match request form...</p>
        </Card>
      </div>
    );
  }

  // Guard: If onboarding is not complete, redirect to hub
  if (!isProfileReady) {
    navigate('/student/matching');
    return null;
  }

  // =========================================================================
  // VIEW 1: MATCHING IN PROGRESS (LOADING STATE)
  // =========================================================================
  if (runMatchMutation.isPending) {
    return (
      <div style={{ maxWidth: '720px', margin: '4rem auto', textAlign: 'center' }}>
        <Card style={{ padding: '3.5rem 2rem', backgroundColor: 'var(--bg-canvas)', border: '2px solid var(--color-border)' }}>
          <div
            style={{
              width: '4.5rem',
              height: '4.5rem',
              margin: '0 auto 1.5rem auto',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-primary-tint)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={36} strokeWidth={2.5} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--fg-main)', margin: '0 0 0.75rem 0' }}>
            Calculating Compatibility Scores...
          </h2>
          <p style={{ fontSize: '1rem', color: '#6b7280', margin: '0 auto 1.5rem auto', maxWidth: '480px', lineHeight: 1.6 }}>
            Our 2-stage engine is filtering approved tutors in Thailand by subject, grade level, and schedule overlap, then scoring compatibility across your 9 learning & personality sliders.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: 'var(--color-muted)', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 700, color: '#374151' }}>
            <Clock size={16} color="var(--color-primary)" /> Stage 2 Weighted Euclidean Ranking
          </div>
        </Card>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: TOP 3 RECOMMENDATIONS RESULTS (MODULE 6 & 7 FRONTEND)
  // =========================================================================
  if (runMatchMutation.isSuccess && runMatchMutation.data) {
    const { recommendations } = runMatchMutation.data;

    return (
      <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Results Header */}
        <div>
          <button
            onClick={() => runMatchMutation.reset()}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              color: 'var(--color-primary)',
              fontSize: '0.875rem',
              fontWeight: 700,
              padding: 0,
              marginBottom: '0.75rem',
            }}
          >
            <ArrowLeft size={16} strokeWidth={2.4} /> Back to Search Criteria
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.625rem', backgroundColor: 'var(--color-secondary-tint)', color: 'var(--color-secondary)', borderRadius: '999px', fontSize: '0.8125rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                <CheckCircle2 size={14} strokeWidth={2.6} /> Matchmaking Complete
              </div>
              <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--fg-main)', margin: '0 0 0.375rem 0' }}>
                Your Top Matched Tutors
              </h1>
              <p style={{ fontSize: '0.9375rem', color: '#6b7280', margin: 0 }}>
                Matched for <strong>{selectedSubject?.subject_name} — {selectedSubject?.variant_name}</strong>. Choose exactly 1 tutor to confirm and unlock direct contact channels.
              </p>
            </div>

            <Button variant="outline" onClick={() => navigate('/student/history')}>
              View Match History
            </Button>
          </div>
        </div>

        {/* Zero Results State */}
        {recommendations.length === 0 ? (
          <Card style={{ padding: '3.5rem 2rem', textAlign: 'center', backgroundColor: 'var(--bg-canvas)', border: '2px solid var(--color-border)' }}>
            <div
              style={{
                width: '4rem',
                height: '4rem',
                margin: '0 auto 1.25rem auto',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-accent-tint)',
                color: '#F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertCircle size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-main)', margin: '0 0 0.5rem 0' }}>
              No Approved Tutors Found for This Selection
            </h3>
            <p style={{ fontSize: '0.9375rem', color: '#6b7280', margin: '0 auto 1.5rem auto', maxWidth: '520px', lineHeight: 1.6 }}>
              No currently approved tutors match this exact subject variant, your grade level ({profile?.grade_level}), or the weekly schedule slots you selected.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
              <Button variant="primary" onClick={() => runMatchMutation.reset()}>
                Adjust Schedule or Variant
              </Button>
            </div>
          </Card>
        ) : (
          /* Top 3 Recommendation Cards List */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {recommendations.map((rec) => {
              const { rank, score, tutor } = rec;
              const isTop = rank === 1;

              return (
                <Card
                  key={rec.recommendation_id}
                  style={{
                    padding: '2rem',
                    backgroundColor: 'var(--bg-canvas)',
                    border: '2px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem',
                  }}
                >
                  {/* Top Bar: Rank Badge + Score Percentage */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          padding: '0.375rem 0.875rem',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--color-dark)',
                          color: '#ffffff',
                          fontWeight: 900,
                          fontSize: '0.8125rem',
                          textTransform: 'uppercase',
                        }}
                      >
                        {isTop && <Trophy size={14} />}
                        Rank #{rank} {isTop ? '— Best Match' : ''}
                      </span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.375rem 0.75rem',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--color-secondary-tint)',
                          color: 'var(--color-secondary)',
                          fontWeight: 900,
                          fontSize: '0.8125rem',
                        }}
                      >
                        <Sparkles size={13} strokeWidth={2.6} />
                        {score.toFixed(1)}% Match Score
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-primary)' }}>
                        ฿{tutor.hourly_rate}
                      </span>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#6b7280' }}> / hr</span>
                    </div>
                  </div>

                  {/* Main Tutor Bio & Details */}
                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div
                      style={{
                        width: '3.75rem',
                        height: '3.75rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-dark)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        fontWeight: 900,
                        flexShrink: 0,
                      }}
                    >
                      {tutor.first_name.charAt(0)}
                    </div>

                    <div style={{ flex: 1, minWidth: '240px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: 'var(--fg-main)' }}>
                          {tutor.first_name} {tutor.last_name}
                        </h3>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            backgroundColor: 'var(--color-muted)',
                            color: '#374151',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '999px',
                            textTransform: 'uppercase',
                          }}
                        >
                          {tutor.tutor_type.replace('_', ' ')}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.75rem' }}>
                        <Star size={16} fill="#F59E0B" color="#F59E0B" />
                        <span style={{ fontWeight: 800, color: 'var(--fg-main)', fontSize: '0.9375rem' }}>
                          {tutor.average_rating.toFixed(1)}
                        </span>
                        <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                          ({tutor.review_count} verified review{tutor.review_count === 1 ? '' : 's'})
                        </span>
                      </div>

                      {tutor.teaching_focus && (
                        <div style={{ marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#B45309', backgroundColor: 'var(--color-accent-tint)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                            Focus: {tutor.teaching_focus}
                          </span>
                        </div>
                      )}

                      {tutor.description && (
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#4b5563', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {tutor.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)', flexWrap: 'wrap' }}>
                    <Button
                      variant="outline"
                      onClick={() => setInspectTutorId(tutor.tutor_id)}
                    >
                      View Full Profile & Reviews
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => setConfirmingRec(rec)}
                    >
                      <UserCheck size={18} strokeWidth={2.4} style={{ marginRight: '0.375rem' }} />
                      Confirm This Tutor
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Detailed Tutor Profile Inspection Modal (TP-35 + TP-19) */}
        <TutorDetailModal
          isOpen={Boolean(inspectTutorId)}
          tutorId={inspectTutorId}
          onClose={() => setInspectTutorId(null)}
          onConfirmSelection={(tutorId) => {
            const match = recommendations.find((r) => r.tutor.tutor_id === tutorId);
            if (match) setConfirmingRec(match);
          }}
          confirmButtonText="Confirm This Tutor"
        />

        {/* Confirmation Modal Prompt */}
        <Modal
          isOpen={Boolean(confirmingRec)}
          onClose={() => setConfirmingRec(null)}
          title="Confirm Tutor Selection"
          subtitle="Are you ready to commit to this tutor?"
          maxWidth="520px"
          footerActions={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
              <Button variant="outline" onClick={() => setConfirmingRec(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmAction}
                disabled={confirmTutorMutation.isPending}
              >
                {confirmTutorMutation.isPending ? 'Confirming...' : 'Yes, Confirm Tutor'}
              </Button>
            </div>
          }
        >
          {confirmingRec && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ margin: 0, fontSize: '0.9375rem', color: '#374151', lineHeight: 1.5 }}>
                You are about to select <strong>{confirmingRec.tutor.first_name} {confirmingRec.tutor.last_name}</strong> for <strong>{selectedSubject?.variant_name}</strong> at <strong>฿{confirmingRec.tutor.hourly_rate}/hr</strong>.
              </p>
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--color-primary-tint)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-primary)',
                  fontSize: '0.8125rem',
                  color: '#1e40af',
                  fontWeight: 600,
                  lineHeight: 1.5,
                }}
              >
                💡 Upon confirmation, you will instantly unlock their direct <strong>Phone Number</strong> and <strong>LINE ID</strong>, and an email notification will be sent to the tutor.
              </div>
            </div>
          )}
        </Modal>

        {/* Celebration & Contact Channels Unlocked Modal (TP-10) */}
        <Modal
          isOpen={Boolean(confirmedSuccessData)}
          onClose={() => navigate('/student/history')}
          title="🎉 Tutor Confirmed Successfully!"
          subtitle="Direct contact channels unlocked"
          maxWidth="520px"
          footerActions={
            <Button
              variant="primary"
              style={{ width: '100%' }}
              onClick={() => navigate('/student/history')}
            >
              Go to Matching History & Confirmed Lessons
            </Button>
          }
        >
          {confirmedSuccessData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ margin: 0, fontSize: '0.9375rem', color: '#374151', lineHeight: 1.5 }}>
                Congratulations! You have confirmed <strong>{confirmedSuccessData.tutorName}</strong>. You can now contact them directly to introduce yourself, discuss class schedules, and begin lessons:
              </p>

              <div
                style={{
                  backgroundColor: 'var(--color-secondary-tint)',
                  border: '2px solid var(--color-secondary)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                {confirmedSuccessData.phone || confirmedSuccessData.lineId || confirmedSuccessData.email ? (
                  <>
                    {confirmedSuccessData.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Phone size={18} color="var(--color-secondary)" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#6b7280' }}>PHONE NUMBER</div>
                          <span style={{ fontSize: '1.125rem', fontWeight: 900, color: 'var(--fg-main)' }}>
                            {confirmedSuccessData.phone}
                          </span>
                        </div>
                      </div>
                    )}

                    {confirmedSuccessData.lineId && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <MessageCircle size={18} color="var(--color-secondary)" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#6b7280' }}>LINE ID</div>
                          <span style={{ fontSize: '1.125rem', fontWeight: 900, color: 'var(--fg-main)' }}>
                            @{confirmedSuccessData.lineId.replace(/^@/, '')}
                          </span>
                        </div>
                      </div>
                    )}

                    {confirmedSuccessData.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Mail size={18} color="var(--color-secondary)" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#6b7280' }}>EMAIL ADDRESS</div>
                          <span style={{ fontSize: '1.0625rem', fontWeight: 900, color: 'var(--fg-main)' }}>
                            {confirmedSuccessData.email}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '0.5rem', color: '#4b5563', fontSize: '0.875rem', fontWeight: 600 }}>
                    Direct contact channels unlocked. You can also view them anytime in your Matching History.
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: INITIAL MATCH REQUEST FORM (DEFAULT)
  // =========================================================================
  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Navigation & Breadcrumbs */}
      <div>
        <Link
          to="/student/matching"
          style={{
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            color: 'var(--color-primary)',
            fontSize: '0.875rem',
            fontWeight: 700,
            marginBottom: '0.75rem',
          }}
        >
          <ArrowLeft size={16} strokeWidth={2.4} /> Back to Matching Hub
        </Link>

        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--fg-main)', margin: '0 0 0.375rem 0' }}>
          Submit Tutor Matching Request
        </h1>
        <p style={{ fontSize: '0.9375rem', color: '#6b7280', margin: 0 }}>
          Specify your target subject, hourly budget, and weekly schedule to match with top verified tutors in Thailand:
        </p>
      </div>

      {/* Step 1 Card: Target Subject & Hourly Budget */}
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
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary-tint)',
              color: 'var(--color-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={20} strokeWidth={2.4} />
          </span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-main)', margin: 0 }}>
                Step 1: Choose Subject & Budget
              </h2>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: 'var(--color-primary-tint)', color: 'var(--color-primary)', padding: '0.125rem 0.5rem', borderRadius: '4px' }}>
                Required
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
              Select 1 subject and learning goal variant you wish to study with a private tutor.
            </p>
          </div>
        </div>

        {/* 3-Step Cascading Subject Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 800, color: 'var(--fg-main)', marginBottom: '0.625rem' }}>
            Target Subject & Goal Variant *
          </label>
          <StudentSubjectSelector
            selectedSubject={selectedSubject}
            budget={matchBudget}
            onChangeSubject={(sub: StudentSubjectItemDto | null) => setSelectedSubject(sub)}
            onChangeBudget={(b: number | '') => setMatchBudget(b)}
          />
        </div>
      </Card>


      {/* Step 2 Card: Match Availability Schedule */}
      <Card
        style={{
          padding: '2rem',
          backgroundColor: 'var(--bg-canvas)',
          border: '2px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-secondary-tint)',
                color: 'var(--color-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Calendar size={20} strokeWidth={2.4} />
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-main)', margin: 0 }}>
                  Step 2: Convenient Study Schedule
                </h2>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: 'var(--color-secondary-tint)', color: 'var(--color-secondary)', padding: '0.125rem 0.5rem', borderRadius: '4px' }}>
                  Auto-populated
                </span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                At least 1 overlapping slot (≥ 60 mins) is required by Stage 1 hard filters to match.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleResetToProfileSchedule}
            style={{ fontSize: '0.8125rem', padding: '0.5rem 0.875rem', height: 'auto' }}
          >
            <RotateCcw size={14} style={{ marginRight: '0.375rem' }} /> Reset to Saved Profile Hours
          </Button>
        </div>

        {/* Schedule Grid Component */}
        <StudentAvailabilityGrid
          value={matchSlots}
          onChange={(newSlots: StudentAvailabilitySlotDto[]) => setMatchSlots(newSlots)}
          showSaveButton={false}
          hideHeader={true}
        />
      </Card>


      {/* Step 3: Match Submission Summary & Action */}
      <Card
        style={{
          padding: '2rem',
          backgroundColor: 'var(--color-primary-tint)',
          border: '2px solid var(--color-primary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--fg-main)', margin: '0 0 0.25rem 0' }}>
              Ready to Match with Verified Tutors?
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0 }}>
              Our 2-stage matchmaking algorithm will rank candidates and recommend the <strong>Top 3 best-fit tutors</strong>.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={handleFindTutors}
            style={{ minWidth: '220px', height: '3.5rem', fontSize: '1rem', fontWeight: 800 }}
          >
            <Sparkles size={18} strokeWidth={2.4} style={{ marginRight: '0.5rem' }} />
            Find Matched Tutors
          </Button>
        </div>

        {submitError && (
          <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 700 }}>
            {submitError}
          </div>
        )}
      </Card>

      {/* Validation Alert Modal */}
      <Modal
        isOpen={isValidationModalOpen}
        onClose={() => setIsValidationModalOpen(false)}
        title="Incomplete Matching Form"
        subtitle="Please check your selections"
        variant="danger"
        maxWidth="500px"
        primaryActionText="Got it, I'll complete it"
        onPrimaryAction={() => setIsValidationModalOpen(false)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ margin: 0, fontWeight: 700, color: '#991b1b', fontSize: '0.9375rem' }}>
            We could not submit your match request because some required information is missing or incomplete:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
            {validationErrors.map((err, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.625rem',
                  padding: '0.75rem 0.875rem',
                  backgroundColor: '#fef2f2',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  lineHeight: 1.45,
                }}
              >
                <span style={{ fontWeight: 800, color: '#ef4444' }}>•</span>
                <span>{err}</span>
              </div>
            ))}
          </div>

          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: '#6b7280' }}>
            Please complete the marked sections in the match form above and click "Find Matched Tutors" again.
          </p>
        </div>
      </Modal>
    </div>
  );
};
