import { useEffect, useRef, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type TutorNotificationList, type ApiResponse } from '@tutorpair/shared';
import { apiClient } from '../../services/api-client';
import { useAuthStore } from '../../store/auth.store';
import './notifications.css';

export function NotificationBell() {
  const user = useAuthStore(s => s.user);
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  const key = ['notifications', user?.id];
  const query = useQuery({
    queryKey: key,
    queryFn: async () => (await apiClient.get<ApiResponse<TutorNotificationList>>('/api/notifications')).data.data!,
    enabled: !!user,
    retry: false,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
  useEffect(() => () => { client.removeQueries({ queryKey: ['notifications', user?.id], exact: true }); }, [client, user?.id]);
  useEffect(() => { setOpen(false); }, [user?.id]);
  useEffect(() => {
    if (!open) return;
    panel.current?.focus();
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); };
  }, [open]);
  if (!user) return null;
  const data = query.data;
  const count = data?.unreadCount ?? 0;
  const titles: Record<string, string> = { TUTOR_SELECTED: 'A student selected you', VERIFICATION_APPROVED: 'Application approved', VERIFICATION_REJECTED: 'Application needs changes', NEW_REVIEW: 'New review' };
  return <div className="notification-root" ref={root}>
    <button ref={trigger} className="notification-bell" type="button" title="Notifications"
      aria-label={`Notifications${count ? `, ${count} unread` : ''}`} aria-expanded={open} aria-controls="tutor-notifications"
      onClick={() => { setOpen(!open); if (!open) void query.refetch(); }}>
      <Bell size={18} strokeWidth={2.4}/>
      {count > 0 && <span className="notification-count">{count > 99 ? '99+' : count}</span>}
    </button>
    {open && <section ref={panel} tabIndex={-1} id="tutor-notifications" aria-label="Tutor notifications" className="notification-panel">
      <div className="notification-heading"><div><h2>Notifications</h2><p>{count} unread</p></div>
        <button type="button" aria-label="Close notifications" onClick={() => { setOpen(false); trigger.current?.focus(); }}><X size={18}/></button></div>
      {query.isLoading && <p className="notification-state" role="status">Loading notifications…</p>}
      {query.isError && <div className="notification-state" role="alert">Notifications could not be loaded.<button type="button" onClick={() => void query.refetch()}>Try again</button></div>}
      {data?.items.length === 0 && <div className="notification-state"><Bell size={28}/><h3>You’re all caught up</h3><p>When a student confirms you as their tutor, you’ll see it here.</p></div>}
      <ul className="notification-list">{data?.items.map(item => <li key={item.id} className={item.is_read ? '' : 'notification-unread'}>
        <h3>{titles[item.event_type] ?? 'Notification'}{!item.is_read && <span className="notification-dot" aria-label="Unread"/>}</h3>
        <p>{item.message}</p><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString('en-GB')}</time>
      </li>)}</ul>
    </section>}
  </div>;
}
