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
            <div className="hero-section" style={{ 
                marginBottom: 32, 
                padding: '32px',
                borderRadius: 'var(--r-lg)',
                background: 'var(--navy-2)',
                border: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <h1 className="hero-title" style={{ fontSize: '28px', marginBottom: '4px' }}>Inbox & Activity</h1>
                    <p className="hero-subtitle" style={{ fontSize: '14px', color: 'var(--text-3)' }}>
                        Stay updated with platform activity
                        {unreadCount > 0 && <span style={{ color: 'var(--warning)', fontWeight: 600 }}> · {unreadCount} new alerts</span>}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button className="btn btn-primary" onClick={handleMarkAllRead}>✓ Archive All</button>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 32 }}>
                
                {/* Activity Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="card" style={{ padding: '16px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-3)', marginBottom: '16px', letterSpacing: '1px' }}>FILTERS</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {types.map(t => (
                                <div 
                                    key={t}
                                    onClick={() => setFilter(t)}
                                    style={{ 
                                        padding: '10px 12px', 
                                        borderRadius: '8px', 
                                        background: filter === t ? 'var(--violet-dim)' : 'transparent', 
                                        color: filter === t ? 'var(--violet)' : 'var(--text-3)', 
                                        fontWeight: filter === t ? 'bold' : 'normal', 
                                        fontSize: '13px', 
                                        cursor: 'pointer',
                                        transition: 'var(--anim)'
                                    }}
                                >
                                    {t.charAt(0) + t.slice(1).toLowerCase().replace('_', ' ')}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card" style={{ padding: '16px', background: 'rgba(247, 37, 133, 0.05)', borderColor: 'rgba(247, 37, 133, 0.2)' }}>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--pink)', marginBottom: '8px' }}>SUBSCRIBE</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Want email alerts? Enable them in your account settings.</div>
                    </div>
                </div>

                {/* Main Feed */}
                <div>
                    {loading ? (
                        <div className="loading-screen"><div className="spinner" /><p>Syncing alerts...</p></div>
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
                                        className="card"
                                        style={{
                                            display: 'flex', gap: 16, padding: '20px 24px',
                                            cursor: 'pointer',
                                            opacity: isUnread ? 1 : 0.6,
                                            borderColor: isUnread ? 'var(--violet-border)' : 'var(--border)',
                                            transform: isUnread ? 'scale(1.01)' : 'scale(1)',
                                            transition: 'var(--anim)'
                                        }}
                                    >
                                        <div style={{
                                            width: 44, height: 44,
                                            borderRadius: 12,
                                            background: cfg.bg,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 12, fontWeight: 800,
                                            color: cfg.color,
                                            flexShrink: 0
                                        }}>{cfg.icon}</div>
                                        
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: isUnread ? 700 : 500, fontSize: '15px', color: 'var(--text)', marginBottom: 4 }}>
                                                {n.content || n.title || 'Notification'}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                                                {new Date(n.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>

                                        {isUnread && (
                                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--violet)', boxShadow: '0 0 10px var(--violet)' }} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
