import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  CheckCircle,
  ExternalLink,
  FileText,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  Sparkles,
  Star,
  UserCheck,
} from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Modal } from '../../../components/ui';
import { TutorReviewsSection } from '../../reviews/components/TutorReviewsSection';
import { tutorsApi } from '../tutors.api';

interface TutorDetailModalProps {
  tutorId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmSelection?: (tutorId: string) => void;
  confirmButtonText?: string;
}

export const TutorDetailModal: React.FC<TutorDetailModalProps> = ({
  tutorId,
  isOpen,
  onClose,
  onConfirmSelection,
  confirmButtonText = 'Confirm This Tutor',
}) => {
  const {
    data: tutor,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['tutors', tutorId, 'public-detail'],
    queryFn: () => tutorsApi.getPublicDetails(tutorId!),
    enabled: Boolean(isOpen && tutorId),
  });

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tutor ? `${tutor.first_name} ${tutor.last_name}` : 'Tutor Profile'}
      subtitle={
        tutor ? `Detailed verified profile & student ratings` : undefined
      }
      maxWidth="1100px"
      footerActions={
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            width: '100%',
          }}
        >
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {onConfirmSelection && tutor && (
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                onConfirmSelection(tutor.tutor_id);
              }}
            >
              <UserCheck
                size={18}
                strokeWidth={2.4}
                style={{ marginRight: '0.375rem' }}
              />
              {confirmButtonText}
            </Button>
          )}
        </div>
      }
    >
      {isLoading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
          <p style={{ fontWeight: 700 }}>Loading detailed tutor profile...</p>
        </div>
      ) : isError || !tutor ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
          <p style={{ fontWeight: 700 }}>Failed to load tutor profile.</p>
        </div>
      ) : (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          {/* Top Profile Summary Card */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--color-primary-tint)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-lg)',
              gap: '0.875rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '3.75rem',
                  height: '3.75rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-primary)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 900,
                }}
              >
                {tutor.first_name.charAt(0)}
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
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '1.375rem',
                      fontWeight: 900,
                      color: 'var(--fg-main)',
                    }}
                  >
                    {tutor.first_name} {tutor.last_name}
                  </h3>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      backgroundColor: 'var(--color-secondary-tint)',
                      color: 'var(--color-secondary)',
                      padding: '0.2rem 0.625rem',
                      borderRadius: '999px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {tutor.tutor_type.replace('_', ' ')}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    marginTop: '0.25rem',
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
                    {tutor.average_rating.toFixed(1)}
                  </span>
                  <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                    ({tutor.review_count} review
                    {tutor.review_count === 1 ? '' : 's'})
                  </span>
                </div>
              </div>
            </div>

            {/* Price Badge */}
            <div
              style={{
                backgroundColor: 'var(--bg-canvas)',
                padding: '0.75rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                textAlign: 'right',
                border: '2px solid var(--color-border)',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#6b7280',
                }}
              >
                STARTING RATE
              </div>
              <div
                style={{
                  fontSize: '1.375rem',
                  fontWeight: 900,
                  color: 'var(--color-primary)',
                }}
              >
                ฿{tutor.hourly_rate}
                <span
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: '#6b7280',
                  }}
                >
                  {' '}
                  / hr
                </span>
              </div>
            </div>
          </div>

          {/* Contact Details Section (Unlocked vs Locked) */}
          {tutor.contact_unlocked ? (
            <div
              style={{
                backgroundColor: 'var(--color-secondary-tint)',
                border: '2px solid var(--color-secondary)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem 1.5rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                }}
              >
                <CheckCircle
                  size={20}
                  color="var(--color-secondary)"
                  strokeWidth={2.6}
                />
                <h4
                  style={{
                    margin: 0,
                    fontWeight: 800,
                    fontSize: '1rem',
                    color: 'var(--color-secondary)',
                  }}
                >
                  Confirmed Lesson — Direct Contact Unlocked
                </h4>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                }}
              >
                {tutor.phone_number && (
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
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Phone size={16} color="var(--color-secondary)" />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
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
                        {tutor.phone_number}
                      </span>
                    </div>
                  </div>
                )}
                {tutor.line_id && (
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
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MessageCircle size={16} color="var(--color-secondary)" />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          color: '#6b7280',
                        }}
                      >
                        LINE ID
                      </div>
                      <span
                        style={{
                          fontWeight: 800,
                          color: 'var(--fg-main)',
                          fontSize: '0.9375rem',
                        }}
                      >
                        @{tutor.line_id.replace(/^@/, '')}
                      </span>
                    </div>
                  </div>
                )}
                {tutor.email && (
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
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Mail size={16} color="var(--color-secondary)" />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
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
                        {tutor.email}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: 'var(--color-muted)',
                borderRadius: 'var(--radius-md)',
                padding: '0.875rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
              }}
            >
              <Lock size={18} color="#6b7280" />
              <span
                style={{
                  fontSize: '0.8125rem',
                  color: '#4b5563',
                  fontWeight: 600,
                }}
              >
                Direct contact channels (Phone & Line ID) unlock immediately
                once you confirm this tutor.
              </span>
            </div>
          )}

          {/* About / Description */}
          {tutor.description && (
            <div>
              <h4
                style={{
                  fontSize: '0.9375rem',
                  fontWeight: 800,
                  color: 'var(--fg-main)',
                  margin: '0 0 0.5rem 0',
                }}
              >
                About the Tutor
              </h4>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.9375rem',
                  color: '#374151',
                  lineHeight: 1.6,
                }}
              >
                {tutor.description}
              </p>
            </div>
          )}

          {/* Verified CV / Professional Resume Section */}
          <div
            style={{
              backgroundColor: 'var(--bg-canvas)',
              border: '2px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}
            >
              <div
                style={{
                  width: '2.75rem',
                  height: '2.75rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-primary-tint)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid var(--color-primary)',
                  flexShrink: 0,
                }}
              >
                <FileText size={22} strokeWidth={2.4} />
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
                      fontWeight: 800,
                      fontSize: '0.9375rem',
                      color: 'var(--fg-main)',
                    }}
                  >
                    Verified CV / Professional Resume
                  </h4>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      backgroundColor: 'var(--color-secondary-tint)',
                      color: 'var(--color-secondary)',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '999px',
                    }}
                  >
                    Verified
                  </span>
                </div>
                <p
                  style={{
                    margin: '0.2rem 0 0 0',
                    fontSize: '0.8125rem',
                    color: '#6b7280',
                  }}
                >
                  Academic credentials, educational background, and tutoring
                  history.
                </p>
              </div>
            </div>

            <div>
              {tutor.cv_url ? (
                <a
                  href={tutor.cv_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <Button
                    variant="outline"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      fontWeight: 800,
                      fontSize: '0.8125rem',
                      padding: '0.45rem 0.875rem',
                    }}
                  >
                    <ExternalLink size={14} strokeWidth={2.4} />
                    View Full CV / Resume
                  </Button>
                </a>
              ) : (
                <span
                  style={{
                    fontSize: '0.8125rem',
                    color: '#9ca3af',
                    fontStyle: 'italic',
                    fontWeight: 600,
                  }}
                >
                  No CV document uploaded
                </span>
              )}
            </div>
          </div>

          {/* Teaching Focus if present */}
          {tutor.teaching_focus && (
            <div
              style={{
                backgroundColor: 'var(--color-accent-tint)',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                border: '2px solid #F59E0B',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: '#B45309',
                  textTransform: 'uppercase',
                  marginBottom: '0.25rem',
                }}
              >
                Specialized Teaching Focus
              </div>
              <p
                style={{
                  margin: 0,
                  fontWeight: 700,
                  color: 'var(--fg-main)',
                  fontSize: '0.9375rem',
                }}
              >
                {tutor.teaching_focus}
              </p>
            </div>
          )}

          {/* Subjects Offered */}
          {tutor.subjects.length > 0 && (
            <div>
              <h4
                style={{
                  fontSize: '0.9375rem',
                  fontWeight: 800,
                  color: 'var(--fg-main)',
                  margin: '0 0 0.625rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                }}
              >
                <BookOpen size={16} color="var(--color-primary)" /> Subjects &
                Rates
              </h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '0.625rem',
                }}
              >
                {tutor.subjects.map(
                  (
                    sub: {
                      variant_name: string;
                      subject_name: string;
                      hourly_rate: number;
                    },
                    idx: number,
                  ) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.875rem 1rem',
                        backgroundColor: 'var(--bg-canvas)',
                        border: '2px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 800,
                            color: 'var(--fg-main)',
                            fontSize: '0.875rem',
                          }}
                        >
                          {sub.variant_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {sub.subject_name}
                        </div>
                      </div>
                      <div
                        style={{
                          fontWeight: 800,
                          color: 'var(--color-primary)',
                          fontSize: '0.875rem',
                        }}
                      >
                        ฿{sub.hourly_rate}/hr
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          {/* TP-19 Reviews & 4-Metric Rating Breakdown with Anti-Fraud Gating Notice */}
          <div
            style={{
              borderTop: '2px solid var(--color-border)',
              paddingTop: '1.5rem',
            }}
          >
            {/* Review Writing Eligibility Card */}
            {tutor.contact_unlocked && tutor.confirmed_recommendation_id ? (
              tutor.has_reviewed ? (
                <div
                  style={{
                    backgroundColor: 'var(--color-secondary-tint)',
                    border: '1.5px solid var(--color-secondary)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1.25rem',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    color: 'var(--color-secondary)',
                  }}
                >
                  <CheckCircle size={16} strokeWidth={2.6} />
                  You have submitted your verified 4-category review for this
                  tutor.
                </div>
              ) : (
                <div
                  style={{
                    backgroundColor: 'var(--color-primary-tint)',
                    border: '2px solid var(--color-primary)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}
                  >
                    <Sparkles size={20} color="var(--color-primary)" />
                    <div>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: '0.9375rem',
                          color: 'var(--fg-main)',
                        }}
                      >
                        Confirmed Lesson — Your Review is Unlocked
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: '#4b5563' }}>
                        Share your genuine lesson experience across 4 concrete
                        teaching dimensions.
                      </div>
                    </div>
                  </div>
                  <Link
                    to={`/student/review/${tutor.confirmed_recommendation_id}`}
                    style={{ textDecoration: 'none' }}
                    onClick={onClose}
                  >
                    <Button
                      variant="primary"
                      style={{
                        fontSize: '0.8125rem',
                        padding: '0.45rem 0.875rem',
                      }}
                    >
                      <Star
                        size={14}
                        fill="#ffffff"
                        style={{ marginRight: '0.375rem' }}
                      />
                      Write 4-Category Review
                    </Button>
                  </Link>
                </div>
              )
            ) : (
              <div
                style={{
                  backgroundColor: 'var(--color-muted)',
                  border: '1px dashed var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  marginBottom: '1.25rem',
                }}
              >
                <Lock size={16} color="#6b7280" />
                <span
                  style={{
                    fontSize: '0.8125rem',
                    color: '#4b5563',
                    fontWeight: 600,
                  }}
                >
                  <strong style={{ color: 'var(--fg-main)' }}>
                    Review Fraud Protection:
                  </strong>{' '}
                  Review and rating submission is enabled only for students who
                  have chosen and confirmed lessons with this tutor.
                </span>
              </div>
            )}

            <TutorReviewsSection tutorId={tutor.tutor_id} />
          </div>
        </div>
      )}
    </Modal>
  );
};
