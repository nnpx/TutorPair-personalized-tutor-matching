import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/api-client';
import { Spinner } from '../../components/ui/Feedback';
import {
  VerificationStatus,
  AdminTutorListItemDto,
  AdminTutorDetailDto,
  AdminDocumentDto,
  ApiResponse,
} from '@tutorpair/shared';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  FileText,
  AlertCircle,
  ChevronRight,
  Eye,
  RefreshCw,
  Award,
  BookOpen,
} from 'lucide-react';

export const AdminVerificationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<VerificationStatus | 'ALL'>(
    VerificationStatus.PENDING
  );
  const [selectedTutorId, setSelectedTutorId] = useState<string | null>(null);
  const [rejectingTutorId, setRejectingTutorId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [documentLoadingId, setDocumentLoadingId] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // 1. Fetch Tutors in Verification Queue
  const {
    data: tutors = [],
    isLoading: isQueueLoading,
    refetch: refetchQueue,
    isRefetching,
  } = useQuery<AdminTutorListItemDto[]>({
    queryKey: ['admin', 'tutors', selectedStatus],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<AdminTutorListItemDto[]>>(
        `/api/admin/tutors?status=${selectedStatus}`
      );
      return res.data.data || [];
    },
  });

  // 2. Fetch Selected Tutor Details
  const { data: tutorDetail, isLoading: isDetailLoading } = useQuery<AdminTutorDetailDto>({
    queryKey: ['admin', 'tutor-detail', selectedTutorId],
    queryFn: async () => {
      if (!selectedTutorId) return null as unknown as AdminTutorDetailDto;
      const res = await apiClient.get<ApiResponse<AdminTutorDetailDto>>(
        `/api/admin/tutors/${selectedTutorId}`
      );
      return res.data.data!;
    },
    enabled: !!selectedTutorId,
  });

  // 3. Mutation: Approve or Reject Tutor
  const verifyMutation = useMutation({
    mutationFn: async ({
      tutorId,
      status,
      rejectionReason,
    }: {
      tutorId: string;
      status: VerificationStatus;
      rejectionReason?: string;
    }) => {
      const res = await apiClient.patch<ApiResponse<{ verification_status: VerificationStatus }>>(
        `/api/admin/tutors/${tutorId}/verify`,
        {
          status,
          rejection_reason: rejectionReason,
        }
      );
      return res.data;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.refetchQueries({ queryKey: ['admin', 'tutors'] });
      await queryClient.refetchQueries({ queryKey: ['admin', 'tutor-detail', variables.tutorId] });
      setRejectingTutorId(null);
      setRejectionReason('');
      setRejectError(null);
      setActionSuccessMessage(
        variables.status === VerificationStatus.APPROVED
          ? 'Tutor application approved successfully! Notification email dispatched.'
          : 'Tutor application rejected. Feedback notification dispatched.'
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setActionSuccessMessage(null), 6000);
    },
    onError: (err: any) => {
      const message =
        err.response?.data?.message || err.message || 'Action failed. Please try again.';
      setRejectError(message);
    },
  });

  // 4. Document Presigned View URL Handler
  const handleViewDocument = async (doc: AdminDocumentDto) => {
    try {
      setDocumentLoadingId(doc.id);
      const res = await apiClient.get<
        ApiResponse<{
          view_url: string;
          document_id: string;
        }>
      >(`/api/admin/tutors/${doc.tutor_id}/documents/${doc.id}/view-url`);

      if (res.data?.data?.view_url) {
        window.open(res.data.data.view_url, '_blank', 'noopener,noreferrer');
      }
    } catch (err: any) {
      alert(
        err.response?.data?.message ||
          'Could not retrieve secure document view URL. Please try again.'
      );
    } finally {
      setDocumentLoadingId(null);
    }
  };

  const handleApprove = (tutorId: string) => {
    if (window.confirm('Are you sure you want to approve this tutor application?')) {
      verifyMutation.mutate({ tutorId, status: VerificationStatus.APPROVED });
    }
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setRejectError('Please specify the rejection reason so the tutor can rectify their profile.');
      return;
    }
    if (rejectingTutorId) {
      verifyMutation.mutate({
        tutorId: rejectingTutorId,
        status: VerificationStatus.REJECTED,
        rejectionReason: rejectionReason.trim(),
      });
    }
  };

  const renderStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case VerificationStatus.APPROVED:
        return (
          <span
            className="flat-badge flat-badge-secondary"
            style={{ fontWeight: 800, letterSpacing: '0.04em' }}
          >
            APPROVED
          </span>
        );
      case VerificationStatus.REJECTED:
        return (
          <span
            className="flat-badge"
            style={{
              backgroundColor: 'var(--color-danger-tint)',
              color: 'var(--color-danger)',
              fontWeight: 800,
              letterSpacing: '0.04em',
            }}
          >
            REJECTED
          </span>
        );
      case VerificationStatus.PENDING:
      default:
        return (
          <span
            className="flat-badge flat-badge-accent"
            style={{ fontWeight: 800, letterSpacing: '0.04em' }}
          >
            PENDING
          </span>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* ──────────────────────────────────────────────────────────── */}
      {/* HERO POSTER SECTION (Matches Landing Page Section-Emerald)   */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section
        className="section-block section-emerald"
        style={{
          borderRadius: 'var(--radius-lg)',
          padding: '3rem 2.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle Decorative Geometric Shapes (Matching Landing Page) */}
        <div className="geo-shape geo-circle-lg" style={{ top: '-180px', right: '-120px' }} />
        <div className="geo-shape geo-square-rot" style={{ bottom: '-140px', left: '-80px' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              padding: '0.4rem 1rem',
              borderRadius: 'var(--radius-full)',
              marginBottom: '1rem',
            }}
          >
            <ShieldCheck size={18} color="#ffffff" strokeWidth={2.5} />
            <span
              style={{
                fontSize: '0.8125rem',
                fontWeight: 800,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: '#ffffff',
              }}
            >
              Zero Impersonation • Strict Admin Gate
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: '1.5rem',
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: '2.75rem',
                  fontWeight: 800,
                  lineHeight: 1.15,
                  color: '#ffffff',
                  marginBottom: '0.75rem',
                }}
              >
                Tutor Verification <span style={{ color: 'var(--color-accent)' }}>Portal</span>
              </h1>
              <p
                style={{
                  fontSize: '1.125rem',
                  lineHeight: 1.6,
                  color: 'rgba(255, 255, 255, 0.95)',
                  maxWidth: '680px',
                }}
              >
                Review uploaded CVs, degrees, transcripts, and subject test certificates stored on
                private Amazon S3. Only approved tutors enter the matchmaking recommendation pool.
              </p>
            </div>

            <button
              onClick={() => refetchQueue()}
              disabled={isRefetching}
              className="flat-btn flat-btn-outline-white flat-btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 700,
              }}
            >
              <RefreshCw
                size={16}
                style={{ animation: isRefetching ? 'spin 1s linear infinite' : 'none' }}
              />
              Refresh Queue
            </button>
          </div>
        </div>
      </section>

      {/* Success Notification Alert */}
      {actionSuccessMessage && (
        <div
          className="flat-card flat-card-tint-emerald"
          style={{
            border: '2px solid var(--color-secondary)',
            padding: '1.25rem 1.75rem',
            color: 'var(--color-secondary-hover)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <CheckCircle size={22} strokeWidth={2.5} />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* FILTER TABS (Solid 2D Color Blocks)                          */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          backgroundColor: 'var(--color-muted)',
          padding: '0.5rem',
          borderRadius: 'var(--radius-md)',
          width: 'fit-content',
        }}
      >
        {[
          { label: 'Pending Review', value: VerificationStatus.PENDING },
          { label: 'Approved Tutors', value: VerificationStatus.APPROVED },
          { label: 'Rejected Applications', value: VerificationStatus.REJECTED },
          { label: 'All Applications', value: 'ALL' },
        ].map((tab) => {
          const isActive = selectedStatus === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => {
                setSelectedStatus(tab.value as any);
                setSelectedTutorId(null);
              }}
              style={{
                padding: '0.625rem 1.375rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: isActive ? 800 : 600,
                fontSize: '0.9375rem',
                backgroundColor: isActive ? 'var(--color-dark)' : 'transparent',
                color: isActive ? 'var(--color-white)' : 'var(--fg-main)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MAIN TWO-COLUMN WORKBENCH                                    */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: selectedTutorId ? '1.1fr 1.3fr' : '1fr',
          gap: '2rem',
          alignItems: 'start',
        }}
      >
        {/* Left: Queue Applications List */}
        <div className="flat-card" style={{ padding: '2rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
            }}
          >
            <div>
              <span className="flat-badge flat-badge-primary" style={{ marginBottom: '0.35rem' }}>
                Queue Inspection
              </span>
              <h3 style={{ fontSize: '1.375rem', fontWeight: 800 }}>
                Applications Pool ({tutors.length})
              </h3>
            </div>
          </div>

          {isQueueLoading ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 0' }}>
              <Spinner size={36} />
              <p style={{ marginTop: '0.75rem', color: '#6b7280', fontWeight: 600 }}>
                Loading verification queue...
              </p>
            </div>
          ) : tutors.length === 0 ? (
            <div
              className="flat-card-muted"
              style={{
                textAlign: 'center',
                padding: '3.5rem 1.5rem',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div
                className="flat-icon-circle"
                style={{
                  backgroundColor: 'var(--color-secondary-tint)',
                  color: 'var(--color-secondary)',
                  margin: '0 auto 1rem auto',
                }}
              >
                <ShieldCheck size={28} strokeWidth={2.5} />
              </div>
              <h4 style={{ fontSize: '1.125rem', fontWeight: 800 }}>No Applications in This Queue</h4>
              <p style={{ fontSize: '0.9375rem', color: '#4b5563', marginTop: '0.35rem' }}>
                All applications matching this filter have been processed or no submissions exist.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {tutors.map((tutor) => {
                const isSelected = selectedTutorId === tutor.user_id;
                return (
                  <div
                    key={tutor.user_id}
                    onClick={() => setSelectedTutorId(tutor.user_id)}
                    style={{
                      border: isSelected
                        ? '3px solid var(--color-primary)'
                        : '2px solid var(--color-border)',
                      backgroundColor: isSelected ? 'var(--color-primary-tint)' : 'var(--bg-canvas)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1.25rem 1.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: '1.1875rem',
                            color: 'var(--fg-main)',
                          }}
                        >
                          {tutor.first_name} {tutor.last_name}
                        </span>
                        {renderStatusBadge(tutor.verification_status)}
                      </div>

                      <div style={{ fontSize: '0.9375rem', color: '#4b5563', fontWeight: 500 }}>
                        {tutor.email} •{' '}
                        <strong style={{ color: 'var(--fg-main)' }}>{tutor.tutor_type}</strong> •{' '}
                        {tutor.hourly_rate} THB/hr
                      </div>

                      {/* Document summary flags */}
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.5rem',
                          marginTop: '0.4rem',
                          fontSize: '0.8125rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: tutor.documents_summary.has_cv ? '#d1fae5' : '#fee2e2',
                            color: tutor.documents_summary.has_cv ? '#065f46' : '#991b1b',
                            fontWeight: 700,
                          }}
                        >
                          CV: {tutor.documents_summary.has_cv ? '✓ Uploaded' : '✗ Missing'}
                        </span>

                        <span
                          style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: tutor.documents_summary.has_transcript
                              ? '#d1fae5'
                              : '#fee2e2',
                            color: tutor.documents_summary.has_transcript ? '#065f46' : '#991b1b',
                            fontWeight: 700,
                          }}
                        >
                          Transcript/Degree:{' '}
                          {tutor.documents_summary.has_transcript ? '✓ Uploaded' : '✗ Missing'}
                        </span>

                        {tutor.documents_summary.has_subject_proof && (
                          <span
                            style={{
                              padding: '0.2rem 0.6rem',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: '#e0e7ff',
                              color: '#3730a3',
                              fontWeight: 700,
                            }}
                          >
                            ★ Test Proof Uploaded
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.9375rem',
                          fontWeight: 700,
                          color: isSelected ? 'var(--color-primary)' : '#6b7280',
                        }}
                      >
                        Inspect
                      </span>
                      <ChevronRight
                        size={20}
                        style={{ color: isSelected ? 'var(--color-primary)' : '#9ca3af' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Detailed Inspection & S3 Document Review Panel */}
        {selectedTutorId && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {isDetailLoading || !tutorDetail ? (
              <div className="flat-card" style={{ padding: '3.5rem', textAlign: 'center' }}>
                <Spinner size={36} />
                <p style={{ marginTop: '0.75rem', color: '#6b7280', fontWeight: 600 }}>
                  Loading tutor profile details...
                </p>
              </div>
            ) : (
              <div
                className="flat-card"
                style={{
                  padding: '2.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.75rem',
                }}
              >
                {/* Header with Name & Actions */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    borderBottom: '2px solid var(--color-border)',
                    paddingBottom: '1.25rem',
                  }}
                >
                  <div>
                    <span
                      className="flat-badge flat-badge-secondary"
                      style={{ marginBottom: '0.4rem' }}
                    >
                      Applicant Review
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <h3 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
                        {tutorDetail.first_name} {tutorDetail.last_name}
                      </h3>
                      {renderStatusBadge(tutorDetail.verification_status)}
                    </div>
                    <p
                      style={{
                        color: '#4b5563',
                        fontSize: '0.9375rem',
                        fontWeight: 500,
                        marginTop: '0.25rem',
                      }}
                    >
                      {tutorDetail.email} • Phone: {tutorDetail.phone_number}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedTutorId(null)}
                    className="flat-btn flat-btn-secondary flat-btn-sm"
                    style={{ fontWeight: 700 }}
                  >
                    Close
                  </button>
                </div>

                {/* Profile Overview (Poster Color Block Box) */}
                <div
                  className="flat-card-muted"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '1.25rem',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                      }}
                    >
                      Tutor Background
                    </span>
                    <p style={{ fontWeight: 700, fontSize: '1.0625rem', marginTop: '0.2rem' }}>
                      {tutorDetail.tutor_type}
                    </p>
                  </div>

                  <div>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                      }}
                    >
                      Hourly Tuition Rate
                    </span>
                    <p style={{ fontWeight: 700, fontSize: '1.0625rem', marginTop: '0.2rem' }}>
                      {tutorDetail.hourly_rate} THB / hr
                    </p>
                  </div>

                  <div>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                      }}
                    >
                      Class Mode
                    </span>
                    <p style={{ fontWeight: 700, fontSize: '1.0625rem', marginTop: '0.2rem' }}>
                      {tutorDetail.class_format}
                    </p>
                  </div>

                  <div>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                      }}
                    >
                      Application Date
                    </span>
                    <p style={{ fontWeight: 700, fontSize: '1.0625rem', marginTop: '0.2rem' }}>
                      {new Date(tutorDetail.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {tutorDetail.description && (
                  <div>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                      }}
                    >
                      Teaching Philosophy & Credentials
                    </span>
                    <p
                      style={{
                        marginTop: '0.4rem',
                        color: '#374151',
                        fontSize: '1rem',
                        lineHeight: 1.6,
                      }}
                    >
                      {tutorDetail.description}
                    </p>
                  </div>
                )}

                {/* Previous Rejection Reason if any */}
                {tutorDetail.rejection_reason && (
                  <div
                    style={{
                      backgroundColor: 'var(--color-danger-tint)',
                      border: '2px solid var(--color-danger)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem 1.25rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-danger)',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Active Rejection Rationale
                    </span>
                    <p
                      style={{
                        color: '#991b1b',
                        fontSize: '0.9375rem',
                        marginTop: '0.35rem',
                        lineHeight: 1.5,
                      }}
                    >
                      {tutorDetail.rejection_reason}
                    </p>
                  </div>
                )}

                {/* Subjects & Variants */}
                <div>
                  <h4
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: 800,
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <BookOpen size={20} color="var(--color-primary)" />
                    Teaching Offerings & Proof Requirements ({tutorDetail.subjects.length})
                  </h4>

                  {tutorDetail.subjects.length === 0 ? (
                    <p style={{ color: '#6b7280', fontSize: '0.9375rem' }}>
                      No subjects specified yet.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                      {tutorDetail.subjects.map((sub, idx) => (
                        <div
                          key={idx}
                          style={{
                            border: '2px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            padding: '1rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: 'var(--bg-canvas)',
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontWeight: 800,
                                color: 'var(--fg-main)',
                                fontSize: '1.05rem',
                              }}
                            >
                              {sub.subject_name} — {sub.variant_name}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.2rem' }}>
                              Category: {sub.category}
                              {sub.teaching_focus ? ` • Focus: ${sub.teaching_focus}` : ''}
                            </div>
                          </div>

                          {sub.requires_proof && (
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                backgroundColor: '#fee2e2',
                                color: '#991b1b',
                                padding: '0.3rem 0.6rem',
                                borderRadius: 'var(--radius-md)',
                                letterSpacing: '0.04em',
                              }}
                            >
                              Proof Mandatory
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submitted Verification Documents Checklist */}
                <div>
                  <h4
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: 800,
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <Award size={20} color="var(--color-secondary)" />
                    Amazon S3 Documents ({tutorDetail.documents.length})
                  </h4>

                  {tutorDetail.documents.length === 0 ? (
                    <div
                      className="flat-card-muted"
                      style={{
                        padding: '1.75rem',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'center',
                      }}
                    >
                      <AlertCircle
                        size={28}
                        style={{ color: 'var(--color-danger)', margin: '0 auto 0.5rem' }}
                      />
                      <p style={{ fontWeight: 800, color: 'var(--fg-main)' }}>
                        No Documents Uploaded Yet
                      </p>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        Tutor must upload at least a CV and Transcript/Graduation Certificate.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {tutorDetail.documents.map((doc) => {
                        const isDocLoading = documentLoadingId === doc.id;
                        return (
                          <div
                            key={doc.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '1rem 1.25rem',
                              border: '2px solid var(--color-border)',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: 'var(--bg-canvas)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <div
                                className="flat-icon-circle"
                                style={{
                                  width: '2.75rem',
                                  height: '2.75rem',
                                  backgroundColor: 'var(--color-primary-tint)',
                                  color: 'var(--color-primary)',
                                }}
                              >
                                <FileText size={20} strokeWidth={2.5} />
                              </div>
                              <div>
                                <span style={{ fontWeight: 800, fontSize: '1rem' }}>
                                  {doc.document_type.replace(/_/g, ' ')}
                                </span>
                                {doc.variant_name && (
                                  <div style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                                    Required for: <strong>{doc.variant_name}</strong>
                                  </div>
                                )}
                                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.15rem' }}>
                                  {doc.file_size_kb} KB • S3 Key: {doc.file_key}
                                </div>
                              </div>
                            </div>

                            <button
                              disabled={isDocLoading}
                              onClick={() => handleViewDocument(doc)}
                              className="flat-btn flat-btn-secondary flat-btn-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
                            >
                              {isDocLoading ? <Spinner size={14} /> : <Eye size={16} strokeWidth={2.5} />}
                              View (15m Signed URL)
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Action Buttons: Approve / Reject (Bold Flat Design Buttons) */}
                <div
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    borderTop: '2px solid var(--color-border)',
                    paddingTop: '1.5rem',
                  }}
                >
                  <button
                    disabled={verifyMutation.isPending}
                    onClick={() => handleApprove(tutorDetail.user_id)}
                    className="flat-btn flat-btn-lg"
                    style={{
                      flex: 1,
                      backgroundColor: 'var(--color-secondary)',
                      color: 'var(--color-white)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.75rem',
                      fontWeight: 800,
                    }}
                  >
                    <CheckCircle size={22} strokeWidth={2.5} />
                    Approve Application
                  </button>

                  <button
                    disabled={verifyMutation.isPending}
                    onClick={() => {
                      setRejectingTutorId(tutorDetail.user_id);
                      setRejectionReason(tutorDetail.rejection_reason || '');
                      setRejectError(null);
                    }}
                    className="flat-btn flat-btn-lg"
                    style={{
                      flex: 1,
                      backgroundColor: 'var(--color-danger)',
                      color: 'var(--color-white)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.75rem',
                      fontWeight: 800,
                    }}
                  >
                    <XCircle size={22} strokeWidth={2.5} />
                    Reject Application
                  </button>
                </div>

                {/* Inline Rejection Reason Box */}
                {rejectingTutorId === tutorDetail.user_id && (
                  <form
                    onSubmit={handleRejectSubmit}
                    className="flat-card-muted"
                    style={{
                      border: '3px solid var(--color-danger)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: '1.125rem',
                          color: 'var(--color-danger)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        Mandatory Rejection Feedback
                      </span>
                      <button
                        type="button"
                        onClick={() => setRejectingTutorId(null)}
                        style={{
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>

                    <p style={{ fontSize: '0.9375rem', color: '#4b5563', lineHeight: 1.5 }}>
                      State clearly why the application was rejected (e.g. illegible transcript,
                      unaccredited test score, or missing diploma). This will be sent directly to the
                      tutor via automated Amazon SES email so they can rectify and resubmit.
                    </p>

                    <textarea
                      rows={3}
                      className="flat-input"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="e.g. The uploaded academic certificate lacks an official university seal or watermark. Please upload an official scanned copy."
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        resize: 'vertical',
                      }}
                    />

                    {rejectError && (
                      <span
                        style={{
                          fontSize: '0.875rem',
                          color: 'var(--color-danger)',
                          fontWeight: 700,
                        }}
                      >
                        {rejectError}
                      </span>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                      <button
                        type="button"
                        className="flat-btn flat-btn-secondary flat-btn-sm"
                        onClick={() => setRejectingTutorId(null)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={verifyMutation.isPending}
                        className="flat-btn flat-btn-sm"
                        style={{
                          backgroundColor: 'var(--color-danger)',
                          color: 'var(--color-white)',
                          fontWeight: 700,
                        }}
                      >
                        {verifyMutation.isPending ? 'Submitting...' : 'Confirm Rejection'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
