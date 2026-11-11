import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/api-client';
import { Spinner } from '../../components/ui/Feedback';
import { Modal } from '../../components/ui/Modal';
import { TutorDetailPanel, renderStatusBadge } from './TutorDetailPanel';
import {
  VerificationStatus,
  AdminTutorListItemDto,
  AdminDocumentDto,
  ApiResponse,
} from '@tutorpair/shared';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';

export const AdminVerificationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<VerificationStatus | 'ALL'>(
    VerificationStatus.PENDING
  );
  const [expandedOverride, setExpandedTutorId] = useState<string | null | undefined>(undefined);
  const [rejectingTutorId, setRejectingTutorId] = useState<string | null>(null);
  const [approvingTutor, setApprovingTutor] = useState<{ id: string; name: string } | null>(null);
  const [confirmingRejectTutor, setConfirmingRejectTutor] = useState<{ id: string; name: string; reason: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [documentLoadingId, setDocumentLoadingId] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // 1. Fetch Tutors in Verification Queue (for currently selected status)
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

  // 1b. Fetch All Tutors to calculate live tab counts for each stage
  const { data: allTutors = [] } = useQuery<AdminTutorListItemDto[]>({
    queryKey: ['admin', 'tutors', 'ALL'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<AdminTutorListItemDto[]>>(
        `/api/admin/tutors?status=ALL`
      );
      return res.data.data || [];
    },
  });

  const stageCounts = useMemo(() => {
    const counts = {
      [VerificationStatus.PENDING]: 0,
      [VerificationStatus.APPROVED]: 0,
      [VerificationStatus.REJECTED]: 0,
      ALL: allTutors.length,
    };
    allTutors.forEach((t) => {
      if (t.verification_status && counts[t.verification_status] !== undefined) {
        counts[t.verification_status]++;
      }
    });
    return counts;
  }, [allTutors]);

  // Accordion: undefined = default (Pending tab auto-opens the oldest, #1 FIFO), null = user collapsed.
  const defaultExpandedId =
    selectedStatus === VerificationStatus.PENDING ? (tutors[0]?.user_id ?? null) : null;
  const expandedTutorId = expandedOverride === undefined ? defaultExpandedId : expandedOverride;


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
      setExpandedTutorId(undefined);
      queryClient.removeQueries({ queryKey: ['admin', 'tutor-detail', variables.tutorId] });
      await queryClient.refetchQueries({ queryKey: ['admin', 'tutors'] });
      setRejectingTutorId(null);
      setApprovingTutor(null);
      setConfirmingRejectTutor(null);
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

  const handleRejectSubmit = (e: React.FormEvent, tutorName: string) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setRejectError('Please specify the rejection reason so the tutor can rectify their profile.');
      return;
    }
    if (rejectingTutorId) {
      setConfirmingRejectTutor({
        id: rejectingTutorId,
        name: tutorName,
        reason: rejectionReason.trim(),
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
      {/* FILTER TABS & REFRESH ACTION (Same Level)                    */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            backgroundColor: 'var(--color-muted)',
            padding: '0.5rem',
            borderRadius: 'var(--radius-md)',
            width: 'fit-content',
            maxWidth: '100%',
            flexWrap: 'wrap',
          }}
        >
          {[
            {
              label: 'Pending Review',
              value: VerificationStatus.PENDING,
              badgeColor: 'var(--color-secondary)',
            },
            {
              label: 'Approved Tutors',
              value: VerificationStatus.APPROVED,
              badgeColor: '#10b981',
            },
            {
              label: 'Rejected Applications',
              value: VerificationStatus.REJECTED,
              badgeColor: 'var(--color-danger)',
            },
            {
              label: 'All Applications',
              value: 'ALL',
              badgeColor: '#6b7280',
            },
          ].map((tab) => {
            const isActive = selectedStatus === tab.value;
            const count = stageCounts[tab.value as keyof typeof stageCounts] ?? 0;
            return (
              <button
                key={tab.value}
                onClick={() => {
                  setSelectedStatus(tab.value as any);
                  setExpandedTutorId(undefined);
                }}
                style={{
                  padding: '0.625rem 1.125rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '0.9375rem',
                  backgroundColor: isActive ? 'var(--color-dark)' : 'transparent',
                  color: isActive ? 'var(--color-white)' : 'var(--fg-main)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '22px',
                    height: '22px',
                    padding: '0 6px',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    lineHeight: 1,
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.08)',
                    color: isActive ? 'var(--color-white)' : 'var(--fg-main)',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => refetchQueue()}
          disabled={isRefetching}
          className="flat-btn flat-btn-secondary flat-btn-sm"
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

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MAIN TWO-COLUMN WORKBENCH                                    */}
      {/* ──────────────────────────────────────────────────────────── */}
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
                Applications Pool
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
              {tutors.map((tutor, index) => {
                const isExpanded = expandedTutorId === tutor.user_id;
                const panelId = `tutor-panel-${tutor.user_id}`;
                const isFifoPending = selectedStatus === VerificationStatus.PENDING;
                return (
                  <div
                    key={tutor.user_id}
                    style={{
                      border: isExpanded
                        ? '3px solid var(--color-primary)'
                        : '2px solid var(--color-border)',
                      backgroundColor: isExpanded ? 'var(--color-primary-tint)' : 'var(--bg-canvas)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1.25rem 1.5rem',
                      position: 'relative',
                    }}
                  >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {isFifoPending && (
                          <span
                            style={{
                              backgroundColor: index === 0 ? 'var(--color-secondary)' : '#4b5563',
                              color: 'var(--color-white)',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              padding: '0.15rem 0.55rem',
                              borderRadius: 'var(--radius-sm)',
                              letterSpacing: '0.03em',
                              textTransform: 'uppercase',
                            }}
                          >
                            {index === 0 ? '★ #1 Next in Line' : `#${index + 1} In Queue`}
                          </span>
                        )}
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

                      {/* Structured Key-Value Grid matching Right Panel Style */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                          gap: '0.75rem 1.25rem',
                          padding: '0.875rem 1rem',
                          backgroundColor: isExpanded ? 'rgba(255, 255, 255, 0.7)' : 'var(--color-bg)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        <div>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              color: '#6b7280',
                              textTransform: 'uppercase',
                              fontWeight: 800,
                              letterSpacing: '0.04em',
                              display: 'block',
                            }}
                          >
                            Contact Email
                          </span>
                          <p
                            style={{
                              fontWeight: 700,
                              fontSize: '0.875rem',
                              color: 'var(--fg-main)',
                              marginTop: '0.15rem',
                              wordBreak: 'break-all',
                            }}
                          >
                            {tutor.email}
                          </p>
                        </div>

                        <div>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              color: '#6b7280',
                              textTransform: 'uppercase',
                              fontWeight: 800,
                              letterSpacing: '0.04em',
                              display: 'block',
                            }}
                          >
                            Tutor Type
                          </span>
                          <p
                            style={{
                              fontWeight: 700,
                              fontSize: '0.875rem',
                              color: 'var(--fg-main)',
                              marginTop: '0.15rem',
                            }}
                          >
                            {tutor.tutor_type}
                          </p>
                        </div>

                        <div>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              color: '#6b7280',
                              textTransform: 'uppercase',
                              fontWeight: 800,
                              letterSpacing: '0.04em',
                              display: 'block',
                            }}
                          >
                            Hourly Rate
                          </span>
                          <p
                            style={{
                              fontWeight: 700,
                              fontSize: '0.875rem',
                              color: 'var(--fg-main)',
                              marginTop: '0.15rem',
                            }}
                          >
                            {tutor.hourly_rate} THB / hr
                          </p>
                        </div>

                        <div>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              color: '#6b7280',
                              textTransform: 'uppercase',
                              fontWeight: 800,
                              letterSpacing: '0.04em',
                              display: 'block',
                            }}
                          >
                            Submitted
                          </span>
                          <p
                            style={{
                              fontWeight: 700,
                              fontSize: '0.875rem',
                              color: 'var(--fg-main)',
                              marginTop: '0.15rem',
                            }}
                          >
                            {new Date(tutor.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedTutorId(isExpanded ? null : tutor.user_id)}
                      aria-expanded={isExpanded}
                      aria-controls={panelId}
                      className="flat-btn flat-btn-secondary flat-btn-sm"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: 700,
                      }}
                    >
                      {isExpanded ? 'Hide' : 'Inspect'}
                      {isExpanded ? (
                        <ChevronUp size={18} aria-hidden="true" />
                      ) : (
                        <ChevronDown size={18} aria-hidden="true" />
                      )}
                    </button>
                  </div>

                  {isExpanded && (
                    <div id={panelId} style={{ marginTop: '1.5rem' }}>
                      <TutorDetailPanel
                        tutorId={tutor.user_id}
                        isMutating={verifyMutation.isPending}
                        documentLoadingId={documentLoadingId}
                        rejectingTutorId={rejectingTutorId}
                        rejectionReason={rejectionReason}
                        rejectError={rejectError}
                        onApprove={setApprovingTutor}
                        onStartReject={(t) => {
                          setRejectingTutorId(t.user_id);
                          setRejectionReason(t.rejection_reason || '');
                          setRejectError(null);
                        }}
                        onCancelReject={() => setRejectingTutorId(null)}
                        onRejectionReasonChange={setRejectionReason}
                        onRejectSubmit={handleRejectSubmit}
                        onViewDocument={handleViewDocument}
                      />
                    </div>
                  )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      {/* Flat Design Approval Confirmation Modal */}
      <Modal
        isOpen={!!approvingTutor}
        onClose={() => {
          if (!verifyMutation.isPending) setApprovingTutor(null);
        }}
        title="Approve Tutor Application"
        subtitle="Action cannot be undone automatically"
        variant="secondary"
        icon={
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CheckCircle size={24} strokeWidth={2.4} />
          </div>
        }
        footerActions={
          <>
            <button
              type="button"
              disabled={verifyMutation.isPending}
              onClick={() => setApprovingTutor(null)}
              style={{
                height: '2.625rem',
                padding: '0 1.25rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e5e7eb')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={verifyMutation.isPending}
              onClick={() => {
                if (approvingTutor) {
                  setRejectError(null);
                  verifyMutation.mutate({
                    tutorId: approvingTutor.id,
                    status: VerificationStatus.APPROVED,
                  });
                }
              }}
              style={{
                height: '2.625rem',
                padding: '0 1.5rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 700,
                backgroundColor: '#059669',
                color: '#ffffff',
                border: 'none',
                cursor: verifyMutation.isPending ? 'not-allowed' : 'pointer',
                opacity: verifyMutation.isPending ? 0.7 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                justifyContent: 'center',
                boxShadow: 'none',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => !verifyMutation.isPending && (e.currentTarget.style.backgroundColor = '#047857')}
              onMouseLeave={(e) => !verifyMutation.isPending && (e.currentTarget.style.backgroundColor = '#059669')}
            >
              <CheckCircle size={18} strokeWidth={2.4} color="#ffffff" />
              {verifyMutation.isPending ? 'Approving...' : 'Confirm Approval'}
            </button>
          </>
        }
      >
        {rejectError && <p role="alert" style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>{rejectError}</p>}
        {approvingTutor && (
          <div
            style={{
              backgroundColor: 'var(--color-bg)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem 1.25rem',
              border: '1px solid var(--color-border)',
              fontSize: '0.9375rem',
              color: 'var(--color-text-main)',
              lineHeight: 1.6,
            }}
          >
            Are you sure you want to approve{' '}
            <strong style={{ fontWeight: 800, color: 'var(--color-text-main)' }}>
              {approvingTutor.name}
            </strong>
            ?
            <ul
              style={{
                margin: '0.75rem 0 0 1.25rem',
                padding: 0,
                fontSize: '0.875rem',
                color: '#4b5563',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.375rem',
              }}
            >
              <li>Profile will be unlocked in the student matchmaking pool.</li>
              <li>An automated verification confirmation email will be sent.</li>
            </ul>
          </div>
        )}
      </Modal>

      {/* Flat Design Rejection Confirmation Modal */}
      <Modal
        isOpen={!!confirmingRejectTutor}
        onClose={() => {
          if (!verifyMutation.isPending) setConfirmingRejectTutor(null);
        }}
        title="Confirm Application Rejection"
        subtitle="Feedback will be dispatched to the applicant"
        variant="danger"
        icon={
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <XCircle size={24} strokeWidth={2.4} />
          </div>
        }
        footerActions={
          <>
            <button
              type="button"
              disabled={verifyMutation.isPending}
              onClick={() => setConfirmingRejectTutor(null)}
              style={{
                height: '2.625rem',
                padding: '0 1.25rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e5e7eb')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
            >
              Back to Edit
            </button>
            <button
              type="button"
              disabled={verifyMutation.isPending}
              onClick={() => {
                if (confirmingRejectTutor) {
                  setRejectError(null);
                  verifyMutation.mutate({
                    tutorId: confirmingRejectTutor.id,
                    status: VerificationStatus.REJECTED,
                    rejectionReason: confirmingRejectTutor.reason,
                  });
                }
              }}
              style={{
                height: '2.625rem',
                padding: '0 1.5rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 700,
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                cursor: verifyMutation.isPending ? 'not-allowed' : 'pointer',
                opacity: verifyMutation.isPending ? 0.7 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                justifyContent: 'center',
                boxShadow: 'none',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => !verifyMutation.isPending && (e.currentTarget.style.backgroundColor = '#b91c1c')}
              onMouseLeave={(e) => !verifyMutation.isPending && (e.currentTarget.style.backgroundColor = '#dc2626')}
            >
              <XCircle size={18} strokeWidth={2.4} color="#ffffff" />
              {verifyMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </>
        }
      >
        {rejectError && <p role="alert" style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>{rejectError}</p>}
        {confirmingRejectTutor && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-main)', lineHeight: 1.5 }}>
              Are you sure you want to reject the application for{' '}
              <strong style={{ fontWeight: 800 }}>{confirmingRejectTutor.name}</strong>?
            </p>

            <div
              style={{
                backgroundColor: 'var(--color-bg)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.25rem',
                border: '2px solid var(--color-danger)',
              }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: 'var(--color-danger)',
                  letterSpacing: '0.04em',
                }}
              >
                Rejection Feedback to be Emailed:
              </span>
              <p
                style={{
                  fontSize: '0.9375rem',
                  color: '#374151',
                  marginTop: '0.4rem',
                  lineHeight: 1.5,
                  fontStyle: 'italic',
                }}
              >
                "{confirmingRejectTutor.reason}"
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
