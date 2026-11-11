import {
  MatchRequestStatus,
  type MatchRecommendationDto,
} from '@tutorpair/shared';
import {
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Mail,
  MessageCircle,
  Phone,
  PlusCircle,
  Sparkles,
  Star,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BackLink, Button, Card, Modal } from '../../components/ui';
import { TutorDetailModal } from '../tutors/components/TutorDetailModal';
import { useConfirmTutor, useMatchHistory } from './hooks/useMatching';

export const MatchHistoryPage: React.FC = () => {
  const { data: history, isLoading, isError, refetch } = useMatchHistory();
  const confirmTutorMutation = useConfirmTutor();
  const [searchParams] = useSearchParams();

  // Active filter tab with query param support (e.g. ?tab=CONFIRMED)
  const initialTab =
    searchParams.get('tab') === 'CONFIRMED' ? 'CONFIRMED' : 'ALL';
  const [activeTab, setActiveTab] = useState<'ALL' | 'CONFIRMED' | 'PENDING'>(
    initialTab,
  );

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (
      tabParam === 'CONFIRMED' ||
      tabParam === 'PENDING' ||
      tabParam === 'ALL'
    ) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Inspection & Confirmation modals
  const [inspectTutorId, setInspectTutorId] = useState<string | null>(null);
  const [confirmingRec, setConfirmingRec] = useState<{
    matchRequestId: string;
    rec: MatchRecommendationDto;
  } | null>(null);

  // Copy Line ID feedback state
  const [copiedLineId, setCopiedLineId] = useState<string | null>(null);

  const handleCopyLineId = (lineId: string) => {
    navigator.clipboard.writeText(lineId.replace(/^@/, ''));
    setCopiedLineId(lineId);
    setTimeout(() => setCopiedLineId(null), 2000);
  };

  const handleConfirmAction = () => {
    if (!confirmingRec) return;
    confirmTutorMutation.mutate(
      {
        matchRequestId: confirmingRec.matchRequestId,
        data: {
          recommendation_id: confirmingRec.rec.recommendation_id,
          tutor_id: confirmingRec.rec.tutor.tutor_id,
        },
      },
      {
        onSuccess: () => {
          setConfirmingRec(null);
          refetch();
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div
        style={{ maxWidth: '960px', margin: '3rem auto', textAlign: 'center' }}
      >
        <Card style={{ padding: '3.5rem' }}>
          <p style={{ fontWeight: 700, color: '#6b7280' }}>
            Loading your matching history...
          </p>
        </Card>
      </div>
    );
  }

  if (isError || !history) {
    return (
      <div
        style={{ maxWidth: '960px', margin: '3rem auto', textAlign: 'center' }}
      >
        <Card style={{ padding: '3rem', border: '2px solid #ef4444' }}>
          <p style={{ fontWeight: 800, color: '#b91c1c' }}>
            Failed to load matching history.
          </p>
          <Button
            variant="outline"
            onClick={() => refetch()}
            style={{ marginTop: '1rem' }}
          >
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  const confirmedCount = history.filter(
    (h) => h.status === MatchRequestStatus.CONFIRMED,
  ).length;
  const pendingCount = history.filter(
    (h) => h.status === MatchRequestStatus.PENDING,
  ).length;

  const filteredHistory = history.filter((item) => {
    if (activeTab === 'CONFIRMED')
      return item.status === MatchRequestStatus.CONFIRMED;
    if (activeTab === 'PENDING')
      return item.status === MatchRequestStatus.PENDING;
    return true;
  });

  return (
    <div
      style={{
        maxWidth: '980px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.75rem',
      }}
    >
      {/* Back to Matching Hub Button */}
      <div>
        <BackLink to="/student/matching">Back to Matching Hub</BackLink>
      </div>

      {/* Header with New Request CTA */}
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
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 900,
              color: 'var(--fg-main)',
              margin: '0 0 0.375rem 0',
            }}
          >
            Matching History & Confirmed Lessons
          </h1>
          <p style={{ fontSize: '0.9375rem', color: '#6b7280', margin: 0 }}>
            Manage your tutor recommendations, access unlocked direct contact
            channels, and submit verified reviews.
          </p>
        </div>

        <Link to="/student/matching/request" style={{ textDecoration: 'none' }}>
          <Button variant="primary">
            <PlusCircle
              size={18}
              strokeWidth={2.4}
              style={{ marginRight: '0.375rem' }}
            />
            New Tutor Match Request
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '2px solid var(--color-border)',
          paddingBottom: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setActiveTab('ALL')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            backgroundColor:
              activeTab === 'ALL'
                ? 'var(--color-primary)'
                : 'var(--color-muted)',
            color: activeTab === 'ALL' ? '#ffffff' : 'var(--fg-main)',
            fontWeight: 800,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          All Requests ({history.length})
        </button>
        <button
          onClick={() => setActiveTab('CONFIRMED')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            backgroundColor:
              activeTab === 'CONFIRMED'
                ? 'var(--color-secondary)'
                : 'var(--color-muted)',
            color: activeTab === 'CONFIRMED' ? '#ffffff' : 'var(--fg-main)',
            fontWeight: 800,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          Confirmed Lessons ({confirmedCount})
        </button>
        <button
          onClick={() => setActiveTab('PENDING')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            backgroundColor:
              activeTab === 'PENDING' ? '#F59E0B' : 'var(--color-muted)',
            color: activeTab === 'PENDING' ? '#ffffff' : 'var(--fg-main)',
            fontWeight: 800,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          Pending Selection ({pendingCount})
        </button>
      </div>

      {/* Empty State */}
      {filteredHistory.length === 0 ? (
        <Card
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            backgroundColor: 'var(--color-muted)',
          }}
        >
          <div
            style={{
              width: '4rem',
              height: '4rem',
              margin: '0 auto 1.25rem auto',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-primary-tint)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BookOpen size={32} />
          </div>
          <h3
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: 'var(--fg-main)',
              margin: '0 0 0.5rem 0',
            }}
          >
            No Matching Requests Found
          </h3>
          <p
            style={{
              fontSize: '0.9375rem',
              color: '#6b7280',
              margin: '0 auto 1.5rem auto',
              maxWidth: '440px',
              lineHeight: 1.5,
            }}
          >
            {activeTab === 'CONFIRMED'
              ? 'You have not confirmed any tutors yet. Submit a match request to find your top tutors!'
              : 'You have not submitted any tutor match requests yet.'}
          </p>
          <Link
            to="/student/matching/request"
            style={{ textDecoration: 'none' }}
          >
            <Button variant="primary">Find My First Tutor</Button>
          </Link>
        </Card>
      ) : (
        /* History Item Cards */
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          {filteredHistory.map((item) => {
            const isConfirmed = item.status === MatchRequestStatus.CONFIRMED;
            const selected = item.selected;

            return (
              <Card
                key={item.match_request_id}
                style={{
                  padding: '2rem',
                  backgroundColor: isConfirmed
                    ? 'var(--bg-canvas)'
                    : 'var(--bg-canvas)',
                  border: isConfirmed
                    ? '2px solid var(--color-secondary)'
                    : '2px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                }}
              >
                {/* Header row: Subject tags & status badge */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                        marginBottom: '0.25rem',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          backgroundColor: 'var(--color-primary-tint)',
                          color: 'var(--color-primary)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                        }}
                      >
                        {item.category.replace('_', ' ')}
                      </span>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: '1.25rem',
                          fontWeight: 900,
                          color: 'var(--fg-main)',
                        }}
                      >
                        {item.subject_name} — {item.variant_name}
                      </h3>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      Requested on{' '}
                      {new Date(item.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isConfirmed ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          padding: '0.375rem 0.875rem',
                          backgroundColor: 'var(--color-secondary-tint)',
                          color: 'var(--color-secondary)',
                          borderRadius: '999px',
                          fontWeight: 800,
                          fontSize: '0.8125rem',
                        }}
                      >
                        <CheckCircle2 size={16} strokeWidth={2.6} />
                        Confirmed Lesson
                      </span>
                    ) : (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          padding: '0.375rem 0.875rem',
                          backgroundColor: 'var(--color-accent-tint)',
                          color: '#B45309',
                          borderRadius: '999px',
                          fontWeight: 800,
                          fontSize: '0.8125rem',
                        }}
                      >
                        <Clock size={16} strokeWidth={2.6} />
                        Pending Confirmation
                      </span>
                    )}
                  </div>
                </div>

                {/* CASE A: CONFIRMED LESSON VIEW */}
                {isConfirmed && selected ? (
                  <>
                    <div
                      style={{
                        backgroundColor: 'var(--color-secondary-tint)',
                        border: '2px solid var(--color-secondary)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.25rem',
                      }}
                    >
                      {/* Tutor info banner */}
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
                            alignItems: 'center',
                            gap: '1rem',
                          }}
                        >
                          <div
                            style={{
                              width: '3.25rem',
                              height: '3.25rem',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: 'var(--color-secondary)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.25rem',
                              fontWeight: 900,
                            }}
                          >
                            {selected.first_name.charAt(0)}
                          </div>
                          <div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                flexWrap: 'wrap',
                              }}
                            >
                              <h4
                                style={{
                                  margin: 0,
                                  fontSize: '1.125rem',
                                  fontWeight: 900,
                                  color: 'var(--fg-main)',
                                }}
                              >
                                {selected.first_name} {selected.last_name}
                              </h4>
                              <span
                                style={{
                                  fontSize: '0.6875rem',
                                  fontWeight: 800,
                                  backgroundColor: '#ffffff',
                                  padding: '0.125rem 0.5rem',
                                  borderRadius: '999px',
                                  color: '#374151',
                                  textTransform: 'uppercase',
                                }}
                              >
                                {selected.tutor_type.replace('_', ' ')}
                              </span>
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                marginTop: '0.2rem',
                              }}
                            >
                              <Star size={14} fill="#F59E0B" color="#F59E0B" />
                              <span
                                style={{
                                  fontWeight: 800,
                                  fontSize: '0.875rem',
                                  color: 'var(--fg-main)',
                                }}
                              >
                                {selected.average_rating.toFixed(1)}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  color: '#6b7280',
                                }}
                              >
                                ({selected.review_count} review
                                {selected.review_count === 1 ? '' : 's'})
                              </span>
                              <span
                                style={{
                                  margin: '0 0.375rem',
                                  color: '#9ca3af',
                                }}
                              >
                                •
                              </span>
                              <span
                                style={{
                                  fontWeight: 800,
                                  color: 'var(--color-primary)',
                                  fontSize: '0.875rem',
                                }}
                              >
                                ฿{selected.hourly_rate}/hr
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Review Action Trigger (TP-30) */}
                        <div>
                          {selected.has_reviewed ? (
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                padding: '0.5rem 1rem',
                                backgroundColor: '#ffffff',
                                border: '2px solid var(--color-secondary)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--color-secondary)',
                                fontWeight: 800,
                                fontSize: '0.875rem',
                              }}
                            >
                              <CheckCircle2 size={16} strokeWidth={2.6} />
                              Review Submitted
                            </div>
                          ) : (
                            <Link
                              to={`/student/review/${selected.recommendation_id}`}
                              style={{ textDecoration: 'none' }}
                            >
                              <Button variant="primary">
                                <Star
                                  size={16}
                                  fill="#ffffff"
                                  style={{ marginRight: '0.375rem' }}
                                />
                                Write 4-Category Review
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Unlocked Contact Details Box */}
                      <div
                        style={{
                          backgroundColor: '#ffffff',
                          borderRadius: 'var(--radius-md)',
                          padding: '1rem 1.25rem',
                          display: 'grid',
                          gridTemplateColumns:
                            'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: '1rem',
                          border: '1px solid #d1fae5',
                        }}
                      >
                        {selected.phone_number && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.625rem',
                            }}
                          >
                            <div
                              style={{
                                width: '2rem',
                                height: '2rem',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'var(--color-secondary-tint)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Phone size={15} color="var(--color-secondary)" />
                            </div>
                            <div>
                              <div
                                style={{
                                  fontSize: '0.6875rem',
                                  fontWeight: 800,
                                  color: '#6b7280',
                                }}
                              >
                                PHONE NUMBER
                              </div>
                              <span
                                style={{
                                  fontWeight: 800,
                                  color: 'var(--fg-main)',
                                  fontSize: '0.9375rem',
                                }}
                              >
                                {selected.phone_number}
                              </span>
                            </div>
                          </div>
                        )}

                        {selected.line_id && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.625rem',
                            }}
                          >
                            <div
                              style={{
                                width: '2rem',
                                height: '2rem',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'var(--color-secondary-tint)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <MessageCircle
                                size={15}
                                color="var(--color-secondary)"
                              />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  fontSize: '0.6875rem',
                                  fontWeight: 800,
                                  color: '#6b7280',
                                }}
                              >
                                LINE ID
                              </div>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                }}
                              >
                                <span
                                  style={{
                                    fontWeight: 800,
                                    color: 'var(--fg-main)',
                                    fontSize: '0.9375rem',
                                  }}
                                >
                                  @{selected.line_id.replace(/^@/, '')}
                                </span>
                                <button
                                  onClick={() =>
                                    handleCopyLineId(selected.line_id!)
                                  }
                                  title="Copy LINE ID"
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '2px',
                                    color:
                                      copiedLineId === selected.line_id
                                        ? 'var(--color-secondary)'
                                        : '#6b7280',
                                  }}
                                >
                                  {copiedLineId === selected.line_id ? (
                                    <Check size={14} />
                                  ) : (
                                    <Copy size={14} />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {selected.email && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.625rem',
                            }}
                          >
                            <div
                              style={{
                                width: '2rem',
                                height: '2rem',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'var(--color-secondary-tint)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Mail size={15} color="var(--color-secondary)" />
                            </div>
                            <div>
                              <div
                                style={{
                                  fontSize: '0.6875rem',
                                  fontWeight: 800,
                                  color: '#6b7280',
                                }}
                              >
                                EMAIL
                              </div>
                              <span
                                style={{
                                  fontWeight: 800,
                                  color: 'var(--fg-main)',
                                  fontSize: '0.875rem',
                                }}
                              >
                                {selected.email}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div
                        style={{ display: 'flex', justifyContent: 'flex-end' }}
                      >
                        <Button
                          variant="outline"
                          style={{
                            fontSize: '0.8125rem',
                            padding: '0.375rem 0.75rem',
                            height: 'auto',
                          }}
                          onClick={() => setInspectTutorId(selected.tutor_id)}
                        >
                          Inspect Full Profile & All Reviews
                        </Button>
                      </div>
                    </div>

                    {/* All Top Matched Tutors (TP-34 / Student Revisit Feature) */}
                    {item.recommendations &&
                      item.recommendations.length > 0 && (
                        <div
                          style={{
                            padding: '1.25rem',
                            backgroundColor: '#ffffff',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--color-border)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.875rem',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '0.5rem',
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.375rem',
                                  marginBottom: '0.2rem',
                                }}
                              >
                                <Sparkles
                                  size={15}
                                  color="var(--color-primary)"
                                />
                                <h4
                                  style={{
                                    margin: 0,
                                    fontSize: '0.9375rem',
                                    fontWeight: 800,
                                    color: 'var(--fg-main)',
                                  }}
                                >
                                  All Top Matched Recommendations for this
                                  Request ({item.recommendations.length})
                                </h4>
                              </div>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: '0.8125rem',
                                  color: '#6b7280',
                                }}
                              >
                                All tutors recommended based on your study style
                                and budget. You can inspect any candidate's full
                                profile below:
                              </p>
                            </div>
                          </div>

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns:
                                'repeat(auto-fit, minmax(260px, 1fr))',
                              gap: '0.875rem',
                            }}
                          >
                            {item.recommendations.map((rec) => {
                              const isChosen =
                                rec.tutor.tutor_id === selected.tutor_id;

                              return (
                                <div
                                  key={rec.recommendation_id}
                                  style={{
                                    padding: '1rem',
                                    backgroundColor: isChosen
                                      ? 'var(--color-secondary-tint)'
                                      : 'var(--color-muted)',
                                    borderRadius: 'var(--radius-md)',
                                    border: isChosen
                                      ? '2px solid var(--color-secondary)'
                                      : '1px solid var(--color-border)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.625rem',
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.375rem',
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontSize: '0.6875rem',
                                          fontWeight: 900,
                                          backgroundColor: isChosen
                                            ? 'var(--color-secondary)'
                                            : 'var(--color-dark)',
                                          color: '#ffffff',
                                          padding: '0.15rem 0.45rem',
                                          borderRadius: '4px',
                                        }}
                                      >
                                        Rank #{rec.rank}
                                      </span>
                                      {isChosen && (
                                        <span
                                          style={{
                                            fontSize: '0.6875rem',
                                            fontWeight: 800,
                                            backgroundColor: '#ffffff',
                                            color: 'var(--color-secondary)',
                                            padding: '0.15rem 0.45rem',
                                            borderRadius: '4px',
                                            border:
                                              '1px solid var(--color-secondary)',
                                          }}
                                        >
                                          ✓ Chosen Tutor
                                        </span>
                                      )}
                                    </div>

                                    <span
                                      style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 800,
                                        color: 'var(--color-primary)',
                                      }}
                                    >
                                      {rec.score.toFixed(1)}% Match
                                    </span>
                                  </div>

                                  <div>
                                    <h5
                                      style={{
                                        margin: '0 0 0.25rem 0',
                                        fontWeight: 800,
                                        fontSize: '0.9375rem',
                                        color: 'var(--fg-main)',
                                      }}
                                    >
                                      {rec.tutor.first_name}{' '}
                                      {rec.tutor.last_name}
                                    </h5>
                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.375rem',
                                      }}
                                    >
                                      <Star
                                        size={13}
                                        fill="#F59E0B"
                                        color="#F59E0B"
                                      />
                                      <span
                                        style={{
                                          fontWeight: 800,
                                          fontSize: '0.75rem',
                                        }}
                                      >
                                        {rec.tutor.average_rating.toFixed(1)}
                                      </span>
                                      <span
                                        style={{
                                          fontSize: '0.6875rem',
                                          color: '#6b7280',
                                        }}
                                      >
                                        ({rec.tutor.review_count})
                                      </span>
                                      <span
                                        style={{
                                          margin: '0 0.2rem',
                                          color: '#9ca3af',
                                        }}
                                      >
                                        •
                                      </span>
                                      <span
                                        style={{
                                          fontWeight: 800,
                                          color: 'var(--color-primary)',
                                          fontSize: '0.75rem',
                                        }}
                                      >
                                        ฿{rec.tutor.hourly_rate}/hr
                                      </span>
                                    </div>
                                  </div>

                                  {rec.tutor.teaching_focus && (
                                    <span
                                      style={{
                                        fontSize: '0.6875rem',
                                        color: '#6b7280',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      Focus: {rec.tutor.teaching_focus}
                                    </span>
                                  )}

                                  <div
                                    style={{
                                      marginTop: 'auto',
                                      paddingTop: '0.375rem',
                                    }}
                                  >
                                    <Button
                                      variant="outline"
                                      style={{
                                        width: '100%',
                                        fontSize: '0.75rem',
                                        padding: '0.35rem 0.5rem',
                                        height: 'auto',
                                      }}
                                      onClick={() =>
                                        setInspectTutorId(rec.tutor.tutor_id)
                                      }
                                    >
                                      View Full Profile
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                  </>
                ) : (
                  /* CASE B: PENDING LESSON VIEW (TOP 3 READY TO CONFIRM) */
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.875rem',
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#4b5563',
                      }}
                    >
                      Top 3 recommendations generated. Please review and confirm
                      1 tutor to unlock their contact information:
                    </p>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '1rem',
                      }}
                    >
                      {item.recommendations.map((rec) => (
                        <div
                          key={rec.recommendation_id}
                          style={{
                            padding: '1.25rem',
                            backgroundColor: 'var(--color-muted)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 900,
                                backgroundColor: 'var(--color-dark)',
                                color: '#ffffff',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                              }}
                            >
                              Rank #{rec.rank}
                            </span>
                            <span
                              style={{
                                fontSize: '0.8125rem',
                                fontWeight: 800,
                                color: 'var(--color-primary)',
                              }}
                            >
                              {rec.score.toFixed(1)}% Match
                            </span>
                          </div>

                          <div>
                            <h4
                              style={{
                                margin: '0 0 0.25rem 0',
                                fontWeight: 800,
                                fontSize: '1rem',
                                color: 'var(--fg-main)',
                              }}
                            >
                              {rec.tutor.first_name} {rec.tutor.last_name}
                            </h4>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                              }}
                            >
                              <Star size={14} fill="#F59E0B" color="#F59E0B" />
                              <span
                                style={{
                                  fontWeight: 800,
                                  fontSize: '0.8125rem',
                                }}
                              >
                                {rec.tutor.average_rating.toFixed(1)}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  color: '#6b7280',
                                }}
                              >
                                ({rec.tutor.review_count})
                              </span>
                              <span
                                style={{
                                  margin: '0 0.25rem',
                                  color: '#9ca3af',
                                }}
                              >
                                •
                              </span>
                              <span
                                style={{
                                  fontWeight: 800,
                                  color: 'var(--color-primary)',
                                  fontSize: '0.8125rem',
                                }}
                              >
                                ฿{rec.tutor.hourly_rate}/hr
                              </span>
                            </div>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              gap: '0.5rem',
                              marginTop: 'auto',
                              paddingTop: '0.5rem',
                            }}
                          >
                            <Button
                              variant="outline"
                              style={{
                                flex: 1,
                                fontSize: '0.75rem',
                                padding: '0.375rem 0.5rem',
                                height: 'auto',
                              }}
                              onClick={() =>
                                setInspectTutorId(rec.tutor.tutor_id)
                              }
                            >
                              Profile
                            </Button>
                            <Button
                              variant="primary"
                              style={{
                                flex: 1.4,
                                fontSize: '0.75rem',
                                padding: '0.375rem 0.5rem',
                                height: 'auto',
                              }}
                              onClick={() =>
                                setConfirmingRec({
                                  matchRequestId: item.match_request_id,
                                  rec,
                                })
                              }
                            >
                              Confirm
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Detailed Tutor Profile Modal (TP-35 + TP-19) */}
      <TutorDetailModal
        isOpen={Boolean(inspectTutorId)}
        tutorId={inspectTutorId}
        onClose={() => setInspectTutorId(null)}
      />

      {/* Confirm Tutor Modal Prompt */}
      <Modal
        isOpen={Boolean(confirmingRec)}
        onClose={() => setConfirmingRec(null)}
        title="Confirm Tutor Selection"
        subtitle="Confirm your choice to unlock direct contact info"
        maxWidth="500px"
        footerActions={
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              width: '100%',
            }}
          >
            <Button variant="outline" onClick={() => setConfirmingRec(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmAction}
              disabled={confirmTutorMutation.isPending}
            >
              {confirmTutorMutation.isPending
                ? 'Confirming...'
                : 'Yes, Confirm Tutor'}
            </Button>
          </div>
        }
      >
        {confirmingRec && (
          <p
            style={{
              margin: 0,
              fontSize: '0.9375rem',
              color: '#374151',
              lineHeight: 1.5,
            }}
          >
            Are you sure you want to select{' '}
            <strong>
              {confirmingRec.rec.tutor.first_name}{' '}
              {confirmingRec.rec.tutor.last_name}
            </strong>
            ? This will confirm this lesson and unlock their Phone Number and
            LINE ID.
          </p>
        )}
      </Modal>
    </div>
  );
};
