import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/api-client';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, Spinner } from '../../components/ui/Feedback';
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
          <Badge
            variant="secondary"
            style={{
              backgroundColor: 'var(--color-secondary-tint)',
              color: 'var(--color-secondary-hover)',
              fontWeight: 700,
            }}
          >
            APPROVED
          </Badge>
        );
      case VerificationStatus.REJECTED:
        return (
          <Badge
            variant="danger"
            style={{
              backgroundColor: 'var(--color-danger-tint)',
              color: 'var(--color-danger)',
              fontWeight: 700,
            }}
          >
            REJECTED
          </Badge>
        );
      case VerificationStatus.PENDING:
      default:
        return (
          <Badge
            variant="accent"
            style={{
              backgroundColor: 'var(--color-accent-tint)',
              color: 'var(--color-accent-hover)',
              fontWeight: 700,
            }}
          >
            PENDING
          </Badge>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner / Metrics */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--color-dark)' }}>
            Tutor Verification Queue
          </h2>
          <p style={{ color: '#4b5563', marginTop: '0.25rem', fontSize: '1rem' }}>
            Review tutor credentials, verify degree/transcripts, and approve them for the student
            matchmaking pool.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => refetchQueue()}
          disabled={isRefetching}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw
            size={16}
            style={{ animation: isRefetching ? 'spin 1s linear infinite' : 'none' }}
          />
          Refresh Queue
        </Button>
      </div>

      {/* Success Notification Alert */}
      {actionSuccessMessage && (
        <div
          style={{
            backgroundColor: 'var(--color-secondary-tint)',
            border: '2px solid var(--color-secondary)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            color: 'var(--color-secondary-hover)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <CheckCircle size={20} />
          {actionSuccessMessage}
        </div>
      )}

      {/* Status Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          backgroundColor: '#e5e7eb',
          padding: '0.375rem',
          borderRadius: 'var(--radius-md)',
          width: 'fit-content',
        }}
      >
        {[
          { label: 'Pending Review', value: VerificationStatus.PENDING },
          { label: 'Approved', value: VerificationStatus.APPROVED },
          { label: 'Rejected', value: VerificationStatus.REJECTED },
          { label: 'All Tutors', value: 'ALL' },
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
                padding: '0.5rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.875rem',
                backgroundColor: isActive ? 'var(--color-white)' : 'transparent',
                color: isActive ? 'var(--color-dark)' : '#4b5563',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Grid: Queue List & Details Panel */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: selectedTutorId ? '1fr 1fr' : '1fr',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* Left: Queue Table / Cards */}
        <Card style={{ padding: '1.5rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
              Applications ({tutors.length})
            </h3>
          </div>

          {isQueueLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <Spinner size={32} />
              <p style={{ marginTop: '0.75rem', color: '#6b7280' }}>Loading queue...</p>
            </div>
          ) : tutors.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                backgroundColor: 'var(--color-muted)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <ShieldCheck size={40} style={{ color: '#9ca3af', margin: '0 auto 0.75rem' }} />
              <p style={{ fontWeight: 600, color: '#374151' }}>No tutors found in this status</p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                All pending submissions have been processed or none match the selected filter.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {tutors.map((tutor) => {
                const isSelected = selectedTutorId === tutor.user_id;
                return (
                  <div
                    key={tutor.user_id}
                    onClick={() => setSelectedTutorId(tutor.user_id)}
                    style={{
                      border: isSelected
                        ? '2px solid var(--color-primary)'
                        : '2px solid var(--color-border)',
                      backgroundColor: isSelected ? 'var(--color-primary-tint)' : 'var(--color-white)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem 1.25rem',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-dark)' }}>
                          {tutor.first_name} {tutor.last_name}
                        </span>
                        {renderStatusBadge(tutor.verification_status)}
                      </div>

                      <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>
                        {tutor.email} • {tutor.tutor_type} • {tutor.hourly_rate} THB/hr
                      </div>

                      {/* Document summary flags */}
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.5rem',
                          marginTop: '0.35rem',
                          fontSize: '0.75rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor: tutor.documents_summary.has_cv ? '#d1fae5' : '#fee2e2',
                            color: tutor.documents_summary.has_cv ? '#065f46' : '#991b1b',
                            fontWeight: 600,
                          }}
                        >
                          CV: {tutor.documents_summary.has_cv ? 'Uploaded' : 'Missing'}
                        </span>

                        <span
                          style={{
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor: tutor.documents_summary.has_transcript
                              ? '#d1fae5'
                              : '#fee2e2',
                            color: tutor.documents_summary.has_transcript ? '#065f46' : '#991b1b',
                            fontWeight: 600,
                          }}
                        >
                          Transcript/Degree:{' '}
                          {tutor.documents_summary.has_transcript ? 'Uploaded' : 'Missing'}
                        </span>

                        {tutor.documents_summary.has_subject_proof && (
                          <span
                            style={{
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              backgroundColor: '#e0e7ff',
                              color: '#3730a3',
                              fontWeight: 600,
                            }}
                          >
                            Subject Proof Uploaded
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: isSelected ? 'var(--color-primary)' : '#6b7280',
                        }}
                      >
                        Review
                      </span>
                      <ChevronRight
                        size={18}
                        style={{ color: isSelected ? 'var(--color-primary)' : '#9ca3af' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Right: Detailed Inspection & Document Review Panel */}
        {selectedTutorId && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {isDetailLoading || !tutorDetail ? (
              <Card style={{ padding: '3rem', textAlign: 'center' }}>
                <Spinner size={32} />
                <p style={{ marginTop: '0.75rem', color: '#6b7280' }}>Loading tutor details...</p>
              </Card>
            ) : (
              <Card style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                        {tutorDetail.first_name} {tutorDetail.last_name}
                      </h3>
                      {renderStatusBadge(tutorDetail.verification_status)}
                    </div>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      {tutorDetail.email} • {tutorDetail.phone_number}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedTutorId(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#6b7280',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                    }}
                  >
                    Close
                  </button>
                </div>

                {/* Profile Overview */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    backgroundColor: 'var(--color-muted)',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>
                      Tutor Type
                    </span>
                    <p style={{ fontWeight: 600 }}>{tutorDetail.tutor_type}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>
                      Hourly Rate
                    </span>
                    <p style={{ fontWeight: 600 }}>{tutorDetail.hourly_rate} THB / hour</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>
                      Class Format
                    </span>
                    <p style={{ fontWeight: 600 }}>{tutorDetail.class_format}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>
                      Registered Date
                    </span>
                    <p style={{ fontWeight: 600 }}>
                      {new Date(tutorDetail.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {tutorDetail.description && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>
                      Biography & Teaching Philosophy
                    </span>
                    <p style={{ marginTop: '0.25rem', color: '#374151', fontSize: '0.925rem' }}>
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
                      padding: '0.875rem 1rem',
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)', fontWeight: 800, textTransform: 'uppercase' }}>
                      Current Rejection Reason
                    </span>
                    <p style={{ color: '#991b1b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      {tutorDetail.rejection_reason}
                    </p>
                  </div>
                )}

                {/* Subjects & Variants */}
                <div>
                  <h4
                    style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      marginBottom: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <BookOpen size={18} />
                    Offered Subjects & Variants ({tutorDetail.subjects.length})
                  </h4>

                  {tutorDetail.subjects.length === 0 ? (
                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No subjects assigned yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {tutorDetail.subjects.map((sub, idx) => (
                        <div
                          key={idx}
                          style={{
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            padding: '0.75rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 700, color: 'var(--color-dark)' }}>
                              {sub.subject_name} — {sub.variant_name}
                            </span>
                            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                              Category: {sub.category}
                              {sub.teaching_focus ? ` • Focus: ${sub.teaching_focus}` : ''}
                            </div>
                          </div>

                          {sub.requires_proof && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                backgroundColor: '#fee2e2',
                                color: '#991b1b',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                              }}
                            >
                              Requires Proof
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Verification Documents Checklist */}
                <div>
                  <h4
                    style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      marginBottom: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <Award size={18} />
                    Submitted Verification Documents ({tutorDetail.documents.length})
                  </h4>

                  {tutorDetail.documents.length === 0 ? (
                    <div
                      style={{
                        padding: '1.25rem',
                        backgroundColor: 'var(--color-muted)',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'center',
                        color: '#6b7280',
                      }}
                    >
                      <AlertCircle size={24} style={{ color: '#ef4444', margin: '0 auto 0.5rem' }} />
                      <p style={{ fontWeight: 600, color: '#374151' }}>No documents uploaded yet</p>
                      <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                        Tutor must upload at least a CV and Transcript/Graduation Certificate.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                      {tutorDetail.documents.map((doc) => {
                        const isDocLoading = documentLoadingId === doc.id;
                        return (
                          <div
                            key={doc.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.875rem 1rem',
                              border: '1px solid var(--color-border)',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: 'var(--color-white)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <FileText size={20} style={{ color: 'var(--color-primary)' }} />
                              <div>
                                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                  {doc.document_type.replace('_', ' ')}
                                </span>
                                {doc.variant_name && (
                                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                    For Variant: {doc.variant_name}
                                  </div>
                                )}
                                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                  {doc.file_size_kb} KB • Uploaded:{' '}
                                  {new Date(doc.uploaded_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>

                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={isDocLoading}
                              onClick={() => handleViewDocument(doc)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              {isDocLoading ? (
                                <Spinner size={14} />
                              ) : (
                                <Eye size={14} />
                              )}
                              View (15m URL)
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Action Buttons: Approve / Reject */}
                <div
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    borderTop: '2px solid var(--color-border)',
                    paddingTop: '1.25rem',
                  }}
                >
                  <Button
                    variant="primary"
                    disabled={verifyMutation.isPending}
                    onClick={() => handleApprove(tutorDetail.user_id)}
                    style={{
                      flex: 1,
                      backgroundColor: 'var(--color-secondary)',
                      color: 'var(--color-white)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <CheckCircle size={18} />
                    Approve Application
                  </Button>

                  <Button
                    variant="danger"
                    disabled={verifyMutation.isPending}
                    onClick={() => {
                      setRejectingTutorId(tutorDetail.user_id);
                      setRejectionReason(tutorDetail.rejection_reason || '');
                      setRejectError(null);
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: 'var(--color-danger)',
                      color: 'var(--color-white)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <XCircle size={18} />
                    Reject Application
                  </Button>
                </div>

                {/* Inline Rejection Reason Modal / Box */}
                {rejectingTutorId === tutorDetail.user_id && (
                  <form
                    onSubmit={handleRejectSubmit}
                    style={{
                      backgroundColor: 'var(--color-muted)',
                      border: '2px solid var(--color-danger)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-danger)' }}>
                        Mandatory Rejection Feedback
                      </span>
                      <button
                        type="button"
                        onClick={() => setRejectingTutorId(null)}
                        style={{ fontSize: '0.8rem', color: '#6b7280', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: '#4b5563' }}>
                      Explain clearly why the application was rejected (e.g., blurred transcript,
                      unaccredited credential, or missing proof certificate) so the tutor can fix it.
                    </p>

                    <textarea
                      rows={3}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="e.g. Please upload an official degree certificate or academic transcript showing completion of studies."
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: '2px solid var(--color-border)',
                        width: '100%',
                        resize: 'vertical',
                      }}
                    />

                    {rejectError && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-danger)', fontWeight: 600 }}>
                        {rejectError}
                      </span>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setRejectingTutorId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="danger"
                        size="sm"
                        isLoading={verifyMutation.isPending}
                        style={{ backgroundColor: 'var(--color-danger)' }}
                      >
                        Confirm Rejection
                      </Button>
                    </div>
                  </form>
                )}
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
