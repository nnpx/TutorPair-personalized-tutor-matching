import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from '../../features/notifications/hooks/useNotifications';
import { useTutorMatchedStudents } from '../../features/tutors/hooks/useTutors';
import { MatchedStudentModal } from '../../features/tutors/components/MatchedStudentModal';
import { NotificationEventType, UserRole } from '@tutorpair/shared';
import type { NotificationDto, MatchedStudentDto } from '@tutorpair/shared';
import {
  Bell,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  CheckCheck,
  ExternalLink,
  GraduationCap,
} from 'lucide-react';

function formatTimeAgo(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recent';
  }
}

export const NotificationBell: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<MatchedStudentDto | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: notifData } = useNotifications();
  const { mutate: markAsRead } = useMarkNotificationAsRead();
  const { mutate: markAllAsRead, isPending: markingAll } = useMarkAllNotificationsAsRead();
  const notifications = notifData?.notifications ?? [];
  const unreadCount = notifData?.unread_count ?? (Array.isArray(notifications) ? notifications.filter((n) => !n.is_read).length : 0);

  // If tutor, fetch their matched students to display on notification click
  const isTutor = user?.role === UserRole.TUTOR;
  const { data: matchedStudents = [] } = useTutorMatchedStudents(Boolean(isTutor));

  // Close dropdown on outside click or escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleNotificationClick = (item: NotificationDto) => {
    if (!item.is_read) {
      markAsRead(item.id);
    }
    setIsOpen(false);

    // If Tutor received a match notification, lead to Student Profile Card!
    if (isTutor && item.event_type === NotificationEventType.TUTOR_SELECTED) {
      if (matchedStudents.length > 0) {
        setSelectedStudentForModal(matchedStudents[0]);
        setIsStudentModalOpen(true);
      } else {
        navigate('/tutor/profile');
      }
      return;
    }

    // If Student selected a tutor, lead to Confirmed Lessons history
    if (!isTutor && item.event_type === NotificationEventType.TUTOR_SELECTED) {
      navigate('/student/history?tab=CONFIRMED');
      return;
    }

    // If Verification approved or rejected
    if (item.event_type === NotificationEventType.VERIFICATION_APPROVED) {
      navigate('/tutor/profile');
      return;
    }
    if (item.event_type === NotificationEventType.VERIFICATION_REJECTED) {
      navigate('/tutor/profile?tab=documents');
      return;
    }

    // If New review received
    if (item.event_type === NotificationEventType.NEW_REVIEW) {
      navigate('/tutor/profile');
      return;
    }
  };

  const getEventIcon = (eventType: NotificationEventType) => {
    switch (eventType) {
      case NotificationEventType.TUTOR_SELECTED:
        return <Sparkles size={18} color="var(--color-secondary)" strokeWidth={2.4} />;
      case NotificationEventType.VERIFICATION_APPROVED:
        return <ShieldCheck size={18} color="var(--color-secondary)" strokeWidth={2.4} />;
      case NotificationEventType.VERIFICATION_REJECTED:
        return <AlertCircle size={18} color="var(--color-danger)" strokeWidth={2.4} />;
      case NotificationEventType.NEW_REVIEW:
        return <CheckCircle2 size={18} color="var(--color-primary)" strokeWidth={2.4} />;
      default:
        return <Bell size={18} color="var(--color-primary)" strokeWidth={2.4} />;
    }
  };

  const getEventTitle = (eventType: NotificationEventType) => {
    switch (eventType) {
      case NotificationEventType.TUTOR_SELECTED:
        return isTutor ? 'New Student Match! 🎉' : 'Tutor Confirmed! 🚀';
      case NotificationEventType.VERIFICATION_APPROVED:
        return 'Tutor Profile Approved! ✅';
      case NotificationEventType.VERIFICATION_REJECTED:
        return 'Verification Action Required ⚠️';
      case NotificationEventType.NEW_REVIEW:
        return 'New Student Review Received! ⭐';
      default:
        return 'Notification';
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Bell Button */}
      <button
        type="button"
        title="Notifications"
        aria-label="Notifications"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: 'var(--radius-full)',
          backgroundColor: isOpen ? 'var(--color-primary-tint)' : 'var(--color-muted)',
          border: isOpen ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
          color: isOpen ? 'var(--color-primary)' : 'var(--fg-main)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        <Bell size={18} strokeWidth={2.4} />

        {/* Unread count badge */}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              minWidth: '1.25rem',
              height: '1.25rem',
              borderRadius: '999px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              fontSize: '0.6875rem',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 0.25rem',
              border: '2px solid var(--bg-canvas)',
              lineHeight: 1,
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.625rem)',
            right: 0,
            width: '380px',
            maxWidth: '90vw',
            backgroundColor: 'var(--bg-canvas)',
            border: '2px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            zIndex: 1000,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.875rem 1.125rem',
              borderBottom: '2px solid var(--color-border)',
              backgroundColor: 'var(--color-muted)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--fg-main)' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    backgroundColor: 'var(--color-primary-tint)',
                    color: 'var(--color-primary)',
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    padding: '0.125rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsRead()}
                disabled={markingAll}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--color-secondary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem 0.375rem',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <CheckCheck size={14} strokeWidth={2.4} />
                Mark all read
              </button>
            )}
          </div>

          {/* Body / List */}
          <div
            style={{
              maxHeight: '380px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem',
                  color: '#6b7280',
                }}
              >
                <div
                  style={{
                    width: '3rem',
                    height: '3rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--color-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#9ca3af',
                  }}
                >
                  <Bell size={22} strokeWidth={2} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--fg-main)', fontSize: '0.9375rem' }}>
                    No notifications yet
                  </div>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: '#6b7280' }}>
                    When match requests, confirmations, or profile updates occur, you will receive alerts here.
                  </p>
                </div>
              </div>
            ) : (
              notifications.map((item) => {
                const title = getEventTitle(item.event_type);
                const icon = getEventIcon(item.event_type);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.875rem',
                      padding: '0.875rem 1.125rem',
                      borderBottom: '1px solid var(--color-border)',
                      backgroundColor: item.is_read ? 'var(--bg-canvas)' : 'var(--color-secondary-tint)',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = item.is_read
                        ? 'var(--color-muted)'
                        : 'rgba(209, 250, 229, 0.7)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = item.is_read
                        ? 'var(--bg-canvas)'
                        : 'var(--color-secondary-tint)';
                    }}
                  >
                    {/* Event Icon */}
                    <div
                      style={{
                        width: '2.25rem',
                        height: '2.25rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: item.is_read ? 'var(--color-muted)' : '#ffffff',
                        border: '1.5px solid var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '0.125rem',
                      }}
                    >
                      {icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <span
                          style={{
                            fontWeight: item.is_read ? 700 : 800,
                            fontSize: '0.875rem',
                            color: 'var(--fg-main)',
                          }}
                        >
                          {title}
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: '#9ca3af', fontWeight: 600, flexShrink: 0 }}>
                          {formatTimeAgo(item.created_at)}
                        </span>
                      </div>

                      <p
                        style={{
                          margin: '0.25rem 0 0 0',
                          fontSize: '0.8125rem',
                          color: '#4b5563',
                          lineHeight: 1.45,
                          wordBreak: 'break-word',
                        }}
                      >
                        {item.message}
                      </p>

                      {/* Clickable Destination Hint */}
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          color: isTutor && item.event_type === NotificationEventType.TUTOR_SELECTED
                            ? 'var(--color-secondary)'
                            : 'var(--color-primary)',
                          marginTop: '0.35rem',
                        }}
                      >
                        {isTutor && item.event_type === NotificationEventType.TUTOR_SELECTED ? (
                          <>
                            <GraduationCap size={12} strokeWidth={2.4} />
                            <span>Click to view Student Card &amp; Course</span>
                          </>
                        ) : !isTutor && item.event_type === NotificationEventType.TUTOR_SELECTED ? (
                          <>
                            <ExternalLink size={11} strokeWidth={2.4} />
                            <span>View Confirmed Lessons</span>
                          </>
                        ) : (
                          <>
                            <ExternalLink size={11} strokeWidth={2.4} />
                            <span>View Details</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Unread indicator dot */}
                    {!item.is_read && (
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--color-secondary)',
                          flexShrink: 0,
                          marginTop: '0.35rem',
                        }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Matched Student Modal for Tutor */}
      <MatchedStudentModal
        student={selectedStudentForModal}
        isOpen={isStudentModalOpen}
        onClose={() => {
          setIsStudentModalOpen(false);
          setSelectedStudentForModal(null);
        }}
      />
    </div>
  );
};
