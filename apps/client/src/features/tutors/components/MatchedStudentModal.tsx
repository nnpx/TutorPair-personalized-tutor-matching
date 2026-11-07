import type { MatchedStudentDto } from '@tutorpair/shared';
import {
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  Mail,
  MessageCircle,
  Phone,
  Sliders,
  Sparkles,
} from 'lucide-react';
import React, { useState } from 'react';
import { Button, Modal } from '../../../components/ui';
import {
  LEARNING_STYLE_QUESTIONS,
  PERSONALITY_PREF_QUESTIONS,
} from '../../students/components/StudentSliders';

interface MatchedStudentModalProps {
  student: MatchedStudentDto | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MatchedStudentModal: React.FC<MatchedStudentModalProps> = ({
  student,
  isOpen,
  onClose,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen || !student) return null;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formattedDate = new Date(student.confirmed_at).toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  );

  const studentInitials =
    `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`.toUpperCase();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Matched Student Details"
      subtitle="Confirmed student booking details & learning preferences"
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
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Top Student Header Card */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--color-secondary-tint)',
            border: '2px solid var(--color-secondary)',
            padding: '1.25rem 1.5rem',
            borderRadius: 'var(--radius-lg)',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '3.75rem',
                height: '3.75rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-secondary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.375rem',
                fontWeight: 900,
                letterSpacing: '0.05em',
                flexShrink: 0,
              }}
            >
              {studentInitials || 'ST'}
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
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: 'var(--fg-main)',
                  }}
                >
                  {student.student_name}
                </h3>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    backgroundColor: 'var(--bg-canvas)',
                    color: 'var(--color-secondary)',
                    border: '1.5px solid var(--color-secondary)',
                    padding: '0.15rem 0.625rem',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  Grade {student.grade_level}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    backgroundColor: 'var(--color-secondary)',
                    color: '#ffffff',
                    padding: '0.15rem 0.625rem',
                    borderRadius: 'var(--radius-full)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <CheckCircle2 size={12} strokeWidth={2.8} /> Confirmed Match
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  marginTop: '0.35rem',
                  color: '#4b5563',
                  fontSize: '0.8125rem',
                }}
              >
                <Calendar size={14} color="var(--color-secondary)" />
                <span>
                  Confirmed on <strong>{formattedDate}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Matched Course & Subject Variant Box */}
        <div
          style={{
            backgroundColor: 'var(--bg-canvas)',
            border: '2px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.875rem',
            }}
          >
            <BookOpen
              size={18}
              color="var(--color-primary)"
              strokeWidth={2.4}
            />
            <h4
              style={{
                margin: 0,
                fontWeight: 800,
                fontSize: '1rem',
                color: 'var(--fg-main)',
              }}
            >
              Matched Course &amp; Teaching Rate
            </h4>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              backgroundColor: 'var(--color-muted)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                }}
              >
                SUBJECT &amp; CATEGORY
              </div>
              <div
                style={{
                  fontSize: '1.0625rem',
                  fontWeight: 800,
                  color: 'var(--fg-main)',
                  marginTop: '0.2rem',
                }}
              >
                {student.subject_name}
              </div>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  backgroundColor: 'var(--bg-canvas)',
                  color: '#4b5563',
                  padding: '0.1rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  marginTop: '0.25rem',
                  border: '1px solid var(--color-border)',
                }}
              >
                {student.category}
              </span>
            </div>

            <div>
              <div
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                }}
              >
                ENROLLED CURRICULUM
              </div>
              <div
                style={{
                  fontSize: '1.0625rem',
                  fontWeight: 800,
                  color: 'var(--color-primary)',
                  marginTop: '0.2rem',
                }}
              >
                {student.variant_name}
              </div>
              <div
                style={{
                  fontSize: '0.8125rem',
                  color: '#6b7280',
                  marginTop: '0.25rem',
                }}
              >
                Grade Level: {student.grade_level}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                }}
              >
                STUDENT'S MAXIMUM LESSON RATE
              </div>
              <div
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 900,
                  color: 'var(--color-secondary)',
                  marginTop: '0.2rem',
                }}
              >
                ฿{student.hourly_rate}
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
              {/* <div
                style={{
                  fontSize: '0.75rem',
                  color: '#16a34a',
                  fontWeight: 700,
                  marginTop: '0.15rem',
                }}
              >
                Direct Tutor Booking
              </div> */}
            </div>
          </div>
        </div>

        {/* Unlocked Direct Student Contact Details */}

        <div
          style={{
            backgroundColor: 'var(--bg-canvas)',
            border: '2px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.875rem',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Sparkles
                size={18}
                color="var(--color-primary)"
                strokeWidth={2.4}
              />
              <h4
                style={{
                  margin: 0,
                  fontWeight: 800,
                  fontSize: '1rem',
                  color: 'var(--fg-main)',
                }}
              >
                Direct Student Contact Channels
              </h4>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.875rem',
            }}
          >
            {/* Phone */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--color-muted)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <div
                  style={{
                    width: '2.25rem',
                    height: '2.25rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-primary-tint)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)',
                  }}
                >
                  <Phone size={16} strokeWidth={2.4} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      color: '#6b7280',
                      textTransform: 'uppercase',
                    }}
                  >
                    PHONE
                  </div>
                  <span
                    style={{
                      fontSize: '0.9375rem',
                      fontWeight: 800,
                      color: 'var(--fg-main)',
                    }}
                  >
                    {student.phone_number}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(student.phone_number || '', 'phone')}
                title="Copy phone number"
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color:
                    copiedField === 'phone'
                      ? 'var(--color-secondary)'
                      : '#6b7280',
                  padding: '0.35rem',
                }}
              >
                {copiedField === 'phone' ? (
                  <Check size={16} strokeWidth={2.6} />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>

            {/* LINE ID */}
            {student.line_id && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--color-muted)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      width: '2.25rem',
                      height: '2.25rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--color-secondary-tint)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-secondary)',
                    }}
                  >
                    <MessageCircle size={16} strokeWidth={2.4} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                        color: '#6b7280',
                        textTransform: 'uppercase',
                      }}
                    >
                      LINE ID
                    </div>
                    <span
                      style={{
                        fontSize: '0.9375rem',
                        fontWeight: 800,
                        color: 'var(--fg-main)',
                      }}
                    >
                      @{student.line_id.replace(/^@/, '')}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(student.line_id!, 'line')}
                  title="Copy LINE ID"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color:
                      copiedField === 'line'
                        ? 'var(--color-secondary)'
                        : '#6b7280',
                    padding: '0.35rem',
                  }}
                >
                  {copiedField === 'line' ? (
                    <Check size={16} strokeWidth={2.6} />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
            )}

            {/* Email */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--color-muted)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <div
                  style={{
                    width: '2.25rem',
                    height: '2.25rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-accent-tint)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#B45309',
                  }}
                >
                  <Mail size={16} strokeWidth={2.4} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      color: '#6b7280',
                      textTransform: 'uppercase',
                    }}
                  >
                    EMAIL ADDRESS
                  </div>
                  <span
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 800,
                      color: 'var(--fg-main)',
                    }}
                  >
                    {student.email}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(student.email || '', 'email')}
                title="Copy Email"
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color:
                    copiedField === 'email'
                      ? 'var(--color-secondary)'
                      : '#6b7280',
                  padding: '0.35rem',
                }}
              >
                {copiedField === 'email' ? (
                  <Check size={16} strokeWidth={2.6} />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Student Learning Preferences & Personality Sliders Summary */}
        {(student.style_profile || student.personality_profile) && (
          <div
            style={{
              backgroundColor: 'var(--bg-canvas)',
              border: '2px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.875rem',
              }}
            >
              <Sliders
                size={18}
                color="var(--color-primary)"
                strokeWidth={2.4}
              />
              <h4
                style={{
                  margin: 0,
                  fontWeight: 800,
                  fontSize: '1rem',
                  color: 'var(--fg-main)',
                }}
              >
                Student Learning Compatibility Profile
              </h4>
            </div>

            {student.style_profile && student.style_profile.length === 5 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    marginBottom: '0.5rem',
                  }}
                >
                  Learning Style Breakdown (1–5)
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.625rem',
                  }}
                >
                  {LEARNING_STYLE_QUESTIONS.map((q, idx) => {
                    const score = student.style_profile![idx] ?? 3;
                    return (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: 'var(--color-muted)',
                          padding: '0.625rem 0.875rem',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: 'var(--fg-main)',
                            marginBottom: '0.25rem',
                          }}
                        >
                          <span>{q.title}</span>
                          <span
                            style={{
                              fontWeight: 800,
                              color: 'var(--color-primary)',
                            }}
                          >
                            Rating: {score}/5
                          </span>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.6875rem',
                            color: '#6b7280',
                            marginBottom: '0.25rem',
                          }}
                        >
                          <span>1: {q.left}</span>
                          <span>5: {q.right}</span>
                        </div>
                        {/* Visual Track */}
                        <div
                          style={{
                            height: '6px',
                            backgroundColor: 'var(--color-border)',
                            borderRadius: '3px',
                            position: 'relative',
                          }}
                        >
                          <div
                            style={{
                              position: 'absolute',
                              left: `${((score - 1) / 4) * 100}%`,
                              top: '-3px',
                              width: '12px',
                              height: '12px',
                              backgroundColor: 'var(--color-primary)',
                              borderRadius: '50%',
                              transform: 'translateX(-50%)',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {student.personality_profile &&
              student.personality_profile.length === 4 && (
                <div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Personality &amp; Communication Preferences (1–5)
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.625rem',
                    }}
                  >
                    {PERSONALITY_PREF_QUESTIONS.map((q, idx) => {
                      const score = student.personality_profile![idx] ?? 3;
                      return (
                        <div
                          key={idx}
                          style={{
                            backgroundColor: 'var(--color-muted)',
                            padding: '0.625rem 0.875rem',
                            borderRadius: 'var(--radius-md)',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: 'var(--fg-main)',
                              marginBottom: '0.25rem',
                            }}
                          >
                            <span>{q.title}</span>
                            <span
                              style={{
                                fontWeight: 800,
                                color: 'var(--color-secondary)',
                              }}
                            >
                              Rating: {score}/5
                            </span>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.6875rem',
                              color: '#6b7280',
                              marginBottom: '0.25rem',
                            }}
                          >
                            <span>1: {q.left}</span>
                            <span>5: {q.right}</span>
                          </div>
                          {/* Visual Track */}
                          <div
                            style={{
                              height: '6px',
                              backgroundColor: 'var(--color-border)',
                              borderRadius: '3px',
                              position: 'relative',
                            }}
                          >
                            <div
                              style={{
                                position: 'absolute',
                                left: `${((score - 1) / 4) * 100}%`,
                                top: '-3px',
                                width: '12px',
                                height: '12px',
                                backgroundColor: 'var(--color-secondary)',
                                borderRadius: '50%',
                                transform: 'translateX(-50%)',
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    </Modal>
  );
};
