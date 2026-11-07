import { CheckCircle, MessageSquare, Star } from 'lucide-react';
import React from 'react';
import { useTutorReviews } from '../hooks/useReviews';

interface TutorReviewsSectionProps {
  tutorId: string;
}

export const TutorReviewsSection: React.FC<TutorReviewsSectionProps> = ({
  tutorId,
}) => {
  const { data: summary, isLoading, isError } = useTutorReviews(tutorId);

  if (isLoading) {
    return (
      <div style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280' }}>
        <p style={{ fontWeight: 600 }}>Loading verified student reviews...</p>
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div
        style={{
          padding: '1rem',
          backgroundColor: 'var(--color-muted)',
          borderRadius: 'var(--radius-md)',
          textAlign: 'center',
        }}
      >
        <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>
          No reviews available yet.
        </p>
      </div>
    );
  }

  const { average_rating, review_count, rating_breakdown, reviews } = summary;

  const categories = [
    {
      label: 'Knowledge & Mastery',
      value: rating_breakdown.knowledge,
      color: 'var(--color-primary)',
    },
    {
      label: 'Lesson Preparation',
      value: rating_breakdown.preparation,
      color: '#10B981',
    },
    {
      label: 'Clarity & Delivery',
      value: rating_breakdown.clarity,
      color: '#F59E0B',
    },
    {
      label: 'Punctuality & Reliability',
      value: rating_breakdown.punctuality,
      color: '#8B5CF6',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Overall Summary Card */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: review_count > 0 ? '1fr 2fr' : '1fr',
          gap: '1.5rem',
          backgroundColor: 'var(--color-muted)',
          padding: '1.5rem',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        {/* Big Overall Rating Pill */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-canvas)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            border: '2px solid var(--color-border)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              marginBottom: '0.25rem',
            }}
          >
            <Star size={28} fill="#F59E0B" color="#F59E0B" />
            <span
              style={{
                fontSize: '2.25rem',
                fontWeight: 900,
                color: 'var(--fg-main)',
                lineHeight: 1,
              }}
            >
              {average_rating.toFixed(1)}
            </span>
          </div>
          <span
            style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#6b7280' }}
          >
            out of 5.0
          </span>
          <div
            style={{
              marginTop: '0.5rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.25rem 0.625rem',
              backgroundColor: 'var(--color-secondary-tint)',
              color: 'var(--color-secondary)',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 800,
            }}
          >
            <CheckCircle size={13} strokeWidth={2.6} />
            {review_count} Verified Review{review_count === 1 ? '' : 's'}
          </div>
        </div>

        {/* 4 Concrete Category Breakdown Bars */}
        {review_count > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '0.75rem',
            }}
          >
            {categories.map((cat) => {
              const pct = (cat.value / 5) * 100;
              return (
                <div key={cat.label}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.25rem',
                      fontSize: '0.8125rem',
                    }}
                  >
                    <span style={{ fontWeight: 700, color: 'var(--fg-main)' }}>
                      {cat.label}
                    </span>
                    <span style={{ fontWeight: 800, color: 'var(--fg-main)' }}>
                      {cat.value.toFixed(1)} / 5.0
                    </span>
                  </div>
                  {/* Progress bar container */}
                  <div
                    style={{
                      height: '8px',
                      backgroundColor: 'var(--bg-canvas)',
                      borderRadius: '999px',
                      overflow: 'hidden',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        backgroundColor: cat.color,
                        borderRadius: '999px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Cards List */}
      <div>
        <h4
          style={{
            fontSize: '1rem',
            fontWeight: 800,
            color: 'var(--fg-main)',
            margin: '0 0 0.875rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <MessageSquare size={18} color="var(--color-primary)" /> Verified
          Student Feedback
        </h4>

        {reviews.length === 0 ? (
          <div
            style={{
              padding: '2rem',
              textAlign: 'center',
              backgroundColor: 'var(--color-muted)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <p
              style={{
                margin: 0,
                fontWeight: 600,
                color: '#6b7280',
                fontSize: '0.9375rem',
              }}
            >
              No written student reviews yet. Be the first confirmed student to
              leave a review!
            </p>
          </div>
        ) : (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
          >
            {reviews.map((r) => (
              <div
                key={r.id}
                style={{
                  padding: '1.25rem',
                  backgroundColor: 'var(--bg-canvas)',
                  borderRadius: 'var(--radius-md)',
                  border: '2px solid var(--color-border)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.5rem',
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontWeight: 800,
                        color: 'var(--fg-main)',
                        fontSize: '0.9375rem',
                      }}
                    >
                      {r.student_name}
                    </span>
                  </div>
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
                        color: 'var(--fg-main)',
                        fontSize: '0.9375rem',
                      }}
                    >
                      {r.overall_rating.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Sub-ratings mini tags */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.375rem',
                    marginBottom: '0.625rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      backgroundColor: 'var(--color-muted)',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '4px',
                      fontWeight: 600,
                      color: '#4b5563',
                    }}
                  >
                    Knowledge: {r.rating_knowledge}/5
                  </span>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      backgroundColor: 'var(--color-muted)',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '4px',
                      fontWeight: 600,
                      color: '#4b5563',
                    }}
                  >
                    Prep: {r.rating_preparation}/5
                  </span>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      backgroundColor: 'var(--color-muted)',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '4px',
                      fontWeight: 600,
                      color: '#4b5563',
                    }}
                  >
                    Clarity: {r.rating_clarity}/5
                  </span>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      backgroundColor: 'var(--color-muted)',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '4px',
                      fontWeight: 600,
                      color: '#4b5563',
                    }}
                  >
                    Punctual: {r.rating_punctuality}/5
                  </span>
                </div>

                {r.comment && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.875rem',
                      color: '#374151',
                      lineHeight: 1.5,
                    }}
                  >
                    "{r.comment}"
                  </p>
                )}
                <div
                  style={{
                    marginTop: '0.5rem',
                    fontSize: '0.75rem',
                    color: '#9ca3af',
                  }}
                >
                  {new Date(r.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
