import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/api-client';
import { Spinner } from '../../components/ui/Feedback';
import {
  VerificationStatus,
  AdminTutorDetailDto,
  AdminDocumentDto,
  ApiResponse,
} from '@tutorpair/shared';
import {
  CheckCircle,
  XCircle,
  FileText,
  AlertCircle,
  Eye,
  RefreshCw,
  Award,
  BookOpen,
} from 'lucide-react';

export const renderStatusBadge = (status: VerificationStatus) => {
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

export interface TutorDetailPanelProps {
  tutorId: string;
  isMutating: boolean;
  documentLoadingId: string | null;
  rejectingTutorId: string | null;
  rejectionReason: string;
  rejectError: string | null;
  onApprove: (tutor: { id: string; name: string }) => void;
  onStartReject: (tutor: AdminTutorDetailDto) => void;
  onCancelReject: () => void;
  onRejectionReasonChange: (value: string) => void;
  onRejectSubmit: (e: React.FormEvent, tutorName: string) => void;
  onViewDocument: (doc: AdminDocumentDto) => void;
}

export const TutorDetailPanel: React.FC<TutorDetailPanelProps> = ({
  tutorId,
  isMutating,
  documentLoadingId,
  rejectingTutorId,
  rejectionReason,
  rejectError,
  onApprove,
  onStartReject,
  onCancelReject,
  onRejectionReasonChange,
  onRejectSubmit,
  onViewDocument,
}) => {
  const {
    data: tutorDetail,
    isLoading: isDetailLoading,
    isError: isDetailError,
    error: detailError,
    refetch: refetchDetail,
  } = useQuery<AdminTutorDetailDto>({
    queryKey: ['admin', 'tutor-detail', tutorId],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<AdminTutorDetailDto>>(
        `/api/admin/tutors/${tutorId}`
      );
      return res.data.data!;
    },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {isDetailLoading ? (
              <div className="flat-card-muted" style={{ padding: '3.5rem', textAlign: 'center' }}>
                <Spinner size={36} />
                <p style={{ marginTop: '0.75rem', color: '#6b7280', fontWeight: 600 }}>
                  Loading tutor profile details...
                </p>
              </div>
            ) : isDetailError || !tutorDetail ? (
              <div className="flat-card-muted" style={{ padding: '2.5rem', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', color: '#ef4444', marginBottom: '0.75rem' }}>
                  <AlertCircle size={36} />
                </div>
                <h4 style={{ fontWeight: 800, fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                  Unable to load tutor profile
                </h4>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                  {(detailError as any)?.response?.data?.message || 'Could not fetch tutor details. Please try again.'}
                </p>
                <button
                  type="button"
                  className="flat-button flat-button-primary"
                  onClick={() => refetchDetail()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}
                >
                  <RefreshCw size={16} /> Retry
                </button>
              </div>
            ) : (
              <div
                style={{
                  borderTop: '2px solid var(--color-border)',
                  paddingTop: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.75rem',
                }}
              >
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
                      ONLINE
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
                            <div
                              style={{
                                fontSize: '0.875rem',
                                color: '#4b5563',
                                marginTop: '0.35rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.2rem',
                              }}
                            >
                              <div>
                                <strong style={{ fontWeight: 800, color: 'var(--fg-main)' }}>
                                  Category:
                                </strong>{' '}
                                {sub.category}
                              </div>
                              {sub.teaching_focus && (
                                <div>
                                  <strong style={{ fontWeight: 800, color: 'var(--fg-main)' }}>
                                    Focus:
                                  </strong>{' '}
                                  {sub.teaching_focus}
                                </div>
                              )}
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
                                </div>
                            </div>

                            <button
                              disabled={isDocLoading}
                              onClick={() => onViewDocument(doc)}
                              className="flat-btn flat-btn-secondary flat-btn-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
                            >
                              {isDocLoading ? <Spinner size={14} /> : <Eye size={16} strokeWidth={2.5} />}
                              View
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
                    flexWrap: 'wrap',
                    borderTop: '2px solid var(--color-border)',
                    paddingTop: '1.5rem',
                  }}
                >
                  <button
                    disabled={isMutating}
                    onClick={() =>
                      onApprove({
                        id: tutorDetail.user_id,
                        name: `${tutorDetail.first_name} ${tutorDetail.last_name}`,
                      })
                    }
                    className="flat-btn flat-btn-lg"
                    style={{
                      flex: '1 1 12rem',
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
                    disabled={isMutating}
                    onClick={() => onStartReject(tutorDetail)}
                    className="flat-btn flat-btn-lg"
                    style={{
                      flex: '1 1 12rem',
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
                    onSubmit={(e) => onRejectSubmit(e, `${tutorDetail.first_name} ${tutorDetail.last_name}`)}
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
                        onClick={() => onCancelReject()}
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
                      State clearly why the application was rejected (e.g., illegible transcript,
                      unaccredited test score, or missing diploma). An email status update will be
                      sent to the tutor.
                    </p>

                    {/* Scoped to this textarea: global .flat-input placeholder is 2.5:1 and has no focus outline */}
                    <style>{`.reject-reason-input::placeholder{color:#6b7280}.reject-reason-input:focus-visible{outline:3px solid var(--color-primary);outline-offset:2px}`}</style>
                    <label
                      htmlFor="reject-reason"
                      style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--fg-main)' }}
                    >
                      Rejection reason
                    </label>
                    <textarea
                      id="reject-reason"
                      rows={3}
                      className="flat-input reject-reason-input"
                      aria-required="true"
                      aria-invalid={!!rejectError}
                      aria-describedby={rejectError ? 'reject-reason-error' : undefined}
                      value={rejectionReason}
                      onChange={(e) => onRejectionReasonChange(e.target.value)}
                      placeholder="e.g. The uploaded academic certificate lacks an official university seal or watermark. Please upload an official scanned copy."
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        resize: 'vertical',
                      }}
                    />

                    {rejectError && (
                      <span
                        id="reject-reason-error"
                        role="alert"
                        style={{
                          fontSize: '0.875rem',
                          color: '#b91c1c', // darker than --color-danger for >=4.5:1 on muted bg
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
                        onClick={() => onCancelReject()}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isMutating}
                        className="flat-btn flat-btn-sm"
                        style={{
                          backgroundColor: 'var(--color-danger)',
                          color: 'var(--color-white)',
                          fontWeight: 700,
                        }}
                      >
                        {isMutating ? 'Submitting...' : 'Confirm Rejection'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
    </div>
  );
};
