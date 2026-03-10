import React, { useEffect, useState } from 'react';
import { notificationsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const TYPE_CONFIG = {
    SUCCESS: { icon: 'OK', color: 'var(--green)', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
    WARNING: { icon: 'WN', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
    ERROR: { icon: 'ER', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
    INFO: { icon: 'IN', color: 'var(--violet)', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)' },
    FUNDING_UPDATE: { icon: 'FD', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
    MENTOR_ASSIGNED: { icon: 'MT', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
    SYSTEM: { icon: 'SY', color: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)' },
    NEW_MESSAGE: { icon: 'MS', color: 'var(--teal)', bg: 'rgba(63,185,197,0.08)', border: 'rgba(63,185,197,0.2)' },
};

export default function NotificationsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        if (user?.id) {
            notificationsApi.getByUser(user.id)
                .then(setNotifications)
                .catch(() => setNotifications([]))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [user]);

    const handleNotificationClick = async (n) => {
        const isUnread = !n.isRead && !n.read;
        if (isUnread) {
            try {
                await notificationsApi.markRead(n.id);
                setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, isRead: true, read: true } : notif));
            } catch (e) { console.error(e); }
        }
        if (n.type === 'NEW_MESSAGE' || n.content?.toLowerCase().includes('message')) {
            navigate('/messages', { state: { selectedUserId: n.relatedId } });
        }
    };

    const handleMarkAllRead = async () => {
        if (!user?.id) return;
        try {
            await notificationsApi.markAllRead(user.id);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
        } catch (e) { console.error(e); }
    };

    const types = ['ALL', ...new Set(notifications.map(n => n.type).filter(Boolean))];
    const filtered = filter === 'ALL' ? notifications : notifications.filter(n => n.type === filter);
    const unreadCount = notifications.filter(n => !n.isRead && !n.read).length;

    const getConfig = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.INFO;

    return (
        <div className="page-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                    <h1 className="topbar-title">Notifications</h1>
                    <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
                        Stay updated with platform activity
                        {unreadCount > 0 && <span style={{ color: 'var(--warning)', fontWeight: 600 }}> · {unreadCount} unread</span>}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button className="btn btn-secondary btn-sm" onClick={handleMarkAllRead}>✓ Mark all read</button>
                )}
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                {types.map(t => (
                    <button key={t} className={`btn btn-sm ${filter === t ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(t)}>
                        {t}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="loading-screen"><div className="spinner" /><p>Loading notifications...</p></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <h3>No notifications</h3>
                    <p>You're all caught up! New notifications will appear here.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filtered.map((n, idx) => {
                        const cfg = getConfig(n.type);
                        const isUnread = !n.isRead && !n.read;
                        return (
                            <div
                                key={n.id || idx}
                                onClick={() => handleNotificationClick(n)}
                                style={{
                                    display: 'flex', gap: 16, padding: '16px 20px',
                                    background: cfg.bg,
                                    border: `1px solid ${isUnread ? cfg.color : cfg.border}`,
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    opacity: isUnread ? 1 : 0.7,
                                    animation: 'slideUp 0.3s ease',
                                    animationDelay: `${idx * 0.05}s`,
                                    animationFillMode: 'both',
                                    transition: 'var(--transition-fast)',
                                }}
                            >
                                <div style={{
                                    width: 36, height: 36,
                                    borderRadius: 8,
                                    background: cfg.bg,
                                    border: `1px solid ${cfg.border}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 11, fontWeight: 800,
                                    color: cfg.color,
                                    flexShrink: 0, letterSpacing: '0.04em',
                                }}>{cfg.icon}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: isUnread ? 700 : 500, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
                                        {n.content || n.title || 'Notification'}
                                    </div>
                                    {n.createdAt && (
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                                            {new Date(n.createdAt).toLocaleString()}
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                    <span className="badge" style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
                                        {n.type || 'INFO'}
                                    </span>
                                    {isUnread && <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color }} />}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
