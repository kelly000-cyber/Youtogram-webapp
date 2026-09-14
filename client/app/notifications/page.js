'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { notificationService } from '../../services/notifications';

const iconFor = { like: '♥', comment: '💬', follow: '＋', friend_request: '👥', message: '✉', repost: '↻' };

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const result = await notificationService.list(50, 0);
      setItems(result.data?.notifications || []);
      setUnread(result.data?.unreadCount || 0);
      setError('');
    } catch (e) {
      setError(e.message || 'Unable to load notifications.');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!localStorage.getItem('youtogram_token')) { router.replace('/'); return; }
    load();
    const timer = window.setInterval(load, 15000);
    return () => window.clearInterval(timer);
  }, [router]);

  const markAll = async () => {
    try { await notificationService.markAllRead(); setUnread(0); setItems((current) => current.map((n) => ({ ...n, read: true }))); }
    catch (e) { setError(e.message || 'Unable to mark notifications as read.'); }
  };

  return (
    <main className="notificationsPage appPageCard">
      <header className="notificationsHeader">
        <div><span className="pageEyebrow">YOUTOGRAM</span><h1>Notifications</h1><p>Stay up to date with activity on your account.</p></div>
        <button type="button" className="submitButton" onClick={markAll} disabled={!unread}>Mark all read</button>
      </header>
      {error ? <div className="feedErrorBanner">{error}</div> : null}
      {loading ? <div className="notificationEmpty">Loading notifications…</div> : items.length ? (
        <div className="notificationList">
          {items.map((item) => (
            <button key={item._id} type="button" className={`notificationItem ${item.read ? '' : 'notificationUnread'}`} onClick={async () => { if (!item.read) { await notificationService.markRead(item._id).catch(() => {}); setItems((current) => current.map((n) => n._id === item._id ? { ...n, read: true } : n)); } }}>
              <span className="notificationIcon">{iconFor[item.type] || '•'}</span>
              <span className="notificationAvatar">{item.actor?.avatar ? <img src={item.actor.avatar} alt="" /> : (item.actor?.username || 'YT').slice(0,1).toUpperCase()}</span>
              <span className="notificationCopy"><strong>{item.actor?.username || 'Someone'}</strong> <span>{item.message || item.type}</span><small>{new Date(item.createdAt).toLocaleString()}</small></span>
              {!item.read ? <span className="notificationUnreadDot" /> : null}
            </button>
          ))}
        </div>
      ) : <div className="notificationEmpty"><div className="notificationEmptyIcon">✓</div><h2>You're all caught up</h2><p>New follows, likes, comments and messages will appear here.</p></div>}
    </main>
  );
}
