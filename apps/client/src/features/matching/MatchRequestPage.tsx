import { apiClient } from '../../services/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import type { ApiResponse, MatchResultDto } from '@tutorpair/shared';
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Button, Modal } from '../../components/ui';
import { useStudentProfile, useStudentAvailability } from '../students/hooks/useStudents';
import { StudentSubjectSelector } from '../students/components/StudentSubjectSelector';
import { StudentAvailabilityGrid } from '../students/components/StudentAvailabilityGrid';
import { DayOfWeek, type StudentSubjectItemDto, type StudentAvailabilitySlotDto } from '@tutorpair/shared';
import {
  Sparkles,
  ArrowLeft,
  Calendar,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

export const MatchRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searching, setSearching] = useState(false);
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

  const handleFindTutors = async () => {
    if (searching) return;
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

    setSearching(true);
    try {
      // The matching API reads the saved profile, so persist these explicit form choices first.
      // Use direct requests: a browser-only fallback must never masquerade as a real match.
      await apiClient.patch('/api/students/profile', { budget_max: Number(matchBudget) });
      await apiClient.put('/api/students/availability', { availability: matchSlots });
      await queryClient.invalidateQueries({ queryKey: ['students'] });
      const response = await apiClient.post<ApiResponse<MatchResultDto>>('/api/matching', { variant_id: selectedSubject.variant_id });
      if (!response.data.success || !response.data.data) throw new Error('No match results returned');
      navigate('/student/matching/results', { state: { result: response.data.data } });
    } catch (error) {
      setSubmitError(isAxiosError(error) ? error.response?.data?.message || 'Matching could not be completed. Please try again.' : 'Matching could not be completed. Please try again.');
    } finally { setSearching(false); }
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
                Target Subject &amp; Hourly Budget
              </h2>
              <span
                style={{
                  padding: '0.15rem 0.5rem',
                  backgroundColor: 'var(--color-primary-tint)',
                  color: 'var(--color-primary)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                }}
              >
                Step 1
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: 0 }}>
              Select your subject, learning goal variant, and your maximum hourly budget.
            </p>
          </div>
        </div>

        <StudentSubjectSelector
          selectedSubject={selectedSubject}
          budget={matchBudget}
          onChangeSubject={(updated) => {
            setSelectedSubject(updated);
            setSubmitError(null);
          }}
          onChangeBudget={(b) => {
            setMatchBudget(b);
            setSubmitError(null);
          }}
          error={submitError}
        />
      </Card>

      {/* Step 2 Card: Preferred Schedule Time Slots (Identical style card as My Profile page) */}
      <Card
        style={{
          padding: '2rem',
          backgroundColor: 'var(--bg-canvas)',
          border: '2px solid var(--color-border)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '1.5rem',
            borderBottom: '2px solid var(--color-border)',
            paddingBottom: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
              <Calendar size={20} strokeWidth={2.4} />
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-main)', margin: 0 }}>
                  Weekly Study Schedule
                </h2>
                <span
                  style={{
                    padding: '0.15rem 0.5rem',
                    backgroundColor: 'var(--color-primary-tint)',
                    color: 'var(--color-primary)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                  }}
                >
                  Step 2
                </span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: 0 }}>
                Choose the days and hours you are free to study. These are smart pre-filled from your profile.
              </p>
            </div>
          </div>

          {serverAvailability && serverAvailability.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle2 size={13} strokeWidth={2.5} /> Smart Pre-filled from My Profile
              </span>
              <button
                type="button"
                onClick={handleResetToProfileSchedule}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                <RotateCcw size={12} /> Reset to Profile Schedule
              </button>
            </div>
          )}
        </div>

        <StudentAvailabilityGrid
          value={matchSlots}
          onChange={setMatchSlots}
          showSaveButton={false}
          hideHeader={true}
        />
      </Card>

      {/* Search Summary & Action */}
      <Card
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
          onClick={() => void handleFindTutors()}
          isLoading={searching}
          style={{ height: '3.25rem', padding: '0 2rem', fontSize: '0.9375rem', fontWeight: 800 }}
        >
          <Sparkles size={16} style={{ marginRight: '0.375rem' }} /> Find Matched Tutors
        </Button>
      </Card>

      {/* Red Validation Warning Modal */}
      <Modal
        isOpen={isValidationModalOpen}
        onClose={() => setIsValidationModalOpen(false)}
        title="Required Match Details Missing"
        variant="danger"
        primaryActionText="Review & Complete Form"
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
