import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, Button, Modal } from '../../components/ui';
import { useRecommendationReviewContext, useSubmitReview } from './hooks/useReviews';
import {
  Star,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Award,
} from 'lucide-react';

interface MetricConfig {
  key: 'rating_knowledge' | 'rating_preparation' | 'rating_clarity' | 'rating_punctuality';
  title: string;
  thai: string;
  desc: string;
}

const METRICS: MetricConfig[] = [
  {
    key: 'rating_knowledge',
    title: 'Knowledge & Mastery',
    thai: 'ความรู้และความเชี่ยวชาญในวิชาที่สอน',
    desc: 'Accuracy, depth of subject understanding, and ability to solve difficult problems.',
  },
  {
    key: 'rating_preparation',
    title: 'Lesson Preparation & Materials',
    thai: 'การเตรียมการสอนและเอกสารประกอบ',
    desc: 'Structured syllabus, curated practice sheets, and organized lesson pace.',
  },
  {
    key: 'rating_clarity',
    title: 'Clarity & Delivery',
    thai: 'ความชัดเจนและการถ่ายทอดความรู้',
    desc: 'Ability to explain complex concepts simply, engaging communication, and addressing questions.',
  },
  {
    key: 'rating_punctuality',
    title: 'Punctuality & Reliability',
    thai: 'การตรงต่อเวลาและระเบียบวินัย',
    desc: 'Starting and concluding sessions on time, consistency, and professional reliability.',
  },
];

const RATING_LABELS: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'Needs Improvement', color: '#b91c1c', bg: '#fee2e2' },
  2: { label: 'Fair', color: '#c2410c', bg: '#ffedd5' },
  3: { label: 'Good', color: '#4b5563', bg: '#f3f4f6' },
  4: { label: 'Very Good', color: '#1d4ed8', bg: '#dbeafe' },
  5: { label: 'Outstanding', color: '#047857', bg: '#d1fae5' },
};

export const ReviewSubmissionPage: React.FC = () => {
  const { recommendationId } = useParams<{ recommendationId: string }>();
  const navigate = useNavigate();

  const {
    data: context,
    isLoading,
    isError,
    error,
  } = useRecommendationReviewContext(recommendationId || '');

  const submitMutation = useSubmitReview();

  // Ratings state (1 to 5)
  const [ratings, setRatings] = useState<{
    rating_knowledge: number;
    rating_preparation: number;
    rating_clarity: number;
    rating_punctuality: number;
  }>({
    rating_knowledge: 5,
    rating_preparation: 5,
    rating_clarity: 5,
    rating_punctuality: 5,
  });

  const [comment, setComment] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Dynamic arithmetic mean of 4 metrics
  const overallRating =
    (ratings.rating_knowledge +
      ratings.rating_preparation +
      ratings.rating_clarity +
      ratings.rating_punctuality) /
    4;

  const handleSelectScore = (
    key: 'rating_knowledge' | 'rating_preparation' | 'rating_clarity' | 'rating_punctuality',
    score: number
  ) => {
    setRatings((prev) => ({ ...prev, [key]: score }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!context || !recommendationId) return;

    submitMutation.mutate(
      {
        tutor_id: context.tutor_id,
        recommendation_id: recommendationId,
        rating_knowledge: ratings.rating_knowledge,
        rating_preparation: ratings.rating_preparation,
        rating_clarity: ratings.rating_clarity,
        rating_punctuality: ratings.rating_punctuality,
        comment: comment.trim() || undefined,
      },
      {
        onSuccess: () => {
          setIsSuccessModalOpen(true);
        },
        onError: (err: any) => {
          setValidationError(
            err.response?.data?.message || err.message || 'Failed to submit review'
          );
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div style={{ maxWidth: '800px', margin: '3rem auto', textAlign: 'center' }}>
        <Card style={{ padding: '3.5rem' }}>
          <p style={{ fontWeight: 700, color: '#6b7280' }}>Loading lesson details...</p>
        </Card>
      </div>
    );
  }

  if (isError || !context) {
    return (
      <div style={{ maxWidth: '800px', margin: '3rem auto' }}>
        <Card style={{ padding: '3rem', border: '2px solid #ef4444', textAlign: 'center' }}>
          <div
            style={{
              width: '3.5rem',
              height: '3.5rem',
              margin: '0 auto 1rem auto',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#fee2e2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertCircle size={28} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#991b1b', margin: '0 0 0.5rem 0' }}>
            Review Gating: Verified Lesson Required
          </h2>
          <p style={{ fontSize: '0.9375rem', color: '#6b7280', margin: '0 auto 1.5rem auto', maxWidth: '480px', lineHeight: 1.5 }}>
            {(error as any)?.response?.data?.message ||
              'To prevent fraudulent reviews, TutorPair strictly allows reviews only for the tutor you have chosen and confirmed for your lesson.'}
          </p>
          <Link to="/student/history" style={{ textDecoration: 'none' }}>
            <Button variant="primary">Return to Matching History</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (context.already_reviewed) {
    return (
      <div style={{ maxWidth: '800px', margin: '3rem auto' }}>
        <Card style={{ padding: '3rem', textAlign: 'center', border: '2px solid var(--color-secondary)' }}>
          <div
            style={{
              width: '3.5rem',
              height: '3.5rem',
              margin: '0 auto 1rem auto',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-secondary-tint)',
              color: 'var(--color-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={32} strokeWidth={2.6} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--fg-main)', margin: '0 0 0.5rem 0' }}>
            Review Already Submitted
          </h2>
          <p style={{ fontSize: '0.9375rem', color: '#6b7280', margin: '0 auto 1.5rem auto', maxWidth: '480px', lineHeight: 1.5 }}>
            You have already submitted a verified 4-metric review for <strong>{context.tutor_name}</strong> on <strong>{context.subject_name} — {context.variant_name}</strong>. Thank you for your feedback!
          </p>
          <Link to="/student/history" style={{ textDecoration: 'none' }}>
            <Button variant="primary">Return to Matching History</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Back Link & Header */}
      <div>
        <Link
          to="/student/history"
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
          <ArrowLeft size={16} strokeWidth={2.4} /> Back to Matching History
        </Link>

        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--fg-main)', margin: '0 0 0.375rem 0' }}>
          Review Your Confirmed Tutor
        </h1>
        <p style={{ fontSize: '0.9375rem', color: '#6b7280', margin: 0 }}>
          Your verified review directly shapes tutor ratings on TutorPair across 4 concrete teaching dimensions.
        </p>
      </div>

      {/* Lesson Details Card */}
      <Card
        style={{
          padding: '1.5rem',
          backgroundColor: 'var(--color-primary-tint)',
          border: '2px solid var(--color-primary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.375rem',
              fontWeight: 900,
            }}
          >
            {context.tutor_name.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
              CONFIRMED TUTOR
            </div>
            <h3 style={{ margin: '0.125rem 0 0.25rem 0', fontSize: '1.25rem', fontWeight: 900, color: 'var(--fg-main)' }}>
              {context.tutor_name}
            </h3>
            <div style={{ fontSize: '0.8125rem', color: '#4b5563' }}>
              {context.subject_name} • <strong>{context.variant_name}</strong> • ฿{context.hourly_rate}/hr
            </div>
          </div>
        </div>

        {/* Dynamic Overall Score Preview */}
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '2px solid var(--color-border)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase' }}>
            OVERALL RATING
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', marginTop: '0.125rem' }}>
            <Star size={20} fill="#F59E0B" color="#F59E0B" />
            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--fg-main)' }}>
              {overallRating.toFixed(2)}
            </span>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#6b7280' }}>/ 5.0</span>
          </div>
        </div>
      </Card>

      {/* Review Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* 4 Concrete Dimensions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {METRICS.map((metric, idx) => {
            const currentScore = ratings[metric.key];
            const labelInfo = RATING_LABELS[currentScore];

            return (
              <Card
                key={metric.key}
                style={{
                  padding: '1.75rem',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '2px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '1.5rem', height: '1.5rem', borderRadius: '4px', backgroundColor: 'var(--color-dark)', color: '#ffffff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                        {idx + 1}
                      </span>
                      <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: 'var(--fg-main)' }}>
                        {metric.title}
                      </h3>
                    </div>
                    <p style={{ margin: '0.25rem 0 0 2rem', fontSize: '0.8125rem', color: '#6b7280' }}>
                      {metric.thai} — {metric.desc}
                    </p>
                  </div>

                  {/* Rating value pill */}
                  <div
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '999px',
                      backgroundColor: labelInfo.bg,
                      color: labelInfo.color,
                      fontWeight: 800,
                      fontSize: '0.8125rem',
                    }}
                  >
                    {currentScore} Stars — {labelInfo.label}
                  </div>
                </div>

                {/* 1–5 Flat Block Score Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                  {[1, 2, 3, 4, 5].map((score) => {
                    const isSelected = currentScore === score;
                    return (
                      <button
                        key={score}
                        type="button"
                        onClick={() => handleSelectScore(metric.key, score)}
                        style={{
                          padding: '0.875rem 0.5rem',
                          borderRadius: 'var(--radius-md)',
                          border: isSelected ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                          backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-muted)',
                          color: isSelected ? '#ffffff' : 'var(--fg-main)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.25rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          transform: isSelected ? 'scale(1.02)' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Star size={16} fill={isSelected ? '#ffffff' : '#9ca3af'} color={isSelected ? '#ffffff' : '#9ca3af'} />
                          <span style={{ fontSize: '1.125rem', fontWeight: 900 }}>{score}</span>
                        </div>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 700, opacity: isSelected ? 1 : 0.7 }}>
                          {RATING_LABELS[score].label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Written Feedback (Optional) */}
        <Card
          style={{
            padding: '1.75rem',
            backgroundColor: 'var(--bg-canvas)',
            border: '2px solid var(--color-border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label htmlFor="review-comment" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--fg-main)' }}>
              Written Feedback & Tips (Optional)
            </label>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af' }}>
              {comment.length} / 2000 characters
            </span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0 0 0.75rem 0' }}>
            What did you like about this tutor’s teaching style? Any tips for other students taking this course?
          </p>
          <textarea
            id="review-comment"
            rows={4}
            maxLength={2000}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="e.g. Teacher explained difficult grammar rules very clearly, gave great mock exercises, and was always on time..."
            style={{
              width: '100%',
              padding: '0.875rem 1rem',
              backgroundColor: 'var(--color-muted)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.9375rem',
              color: 'var(--fg-main)',
              fontFamily: 'inherit',
              lineHeight: 1.5,
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </Card>

        {validationError && (
          <div style={{ padding: '0.875rem 1.25rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '0.875rem' }}>
            {validationError}
          </div>
        )}

        {/* Submit Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <Button variant="outline" type="button" onClick={() => navigate('/student/history')}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={submitMutation.isPending}
            style={{ minWidth: '220px', height: '3.5rem', fontSize: '1rem', fontWeight: 800 }}
          >
            <Award size={18} strokeWidth={2.4} style={{ marginRight: '0.5rem' }} />
            {submitMutation.isPending ? 'Submitting Review...' : 'Submit Verified Review'}
          </Button>
        </div>
      </form>

      {/* Success Modal */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => navigate('/student/history')}
        title="🎉 Review Submitted Successfully!"
        subtitle="Thank you for your valuable feedback"
        maxWidth="500px"
        primaryActionText="Back to Matching History"
        onPrimaryAction={() => navigate('/student/history')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ margin: 0, fontSize: '0.9375rem', color: '#374151', lineHeight: 1.5 }}>
            Your rating of <strong>{overallRating.toFixed(2)} ★</strong> for <strong>{context.tutor_name}</strong> has been recorded and the tutor’s overall rating has been updated.
          </p>
          <div
            style={{
              padding: '0.875rem 1rem',
              backgroundColor: 'var(--color-secondary-tint)',
              color: 'var(--color-secondary)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              fontWeight: 700,
            }}
          >
            ✓ Verified student review badge awarded.
          </div>
        </div>
      </Modal>
    </div>
  );
};
