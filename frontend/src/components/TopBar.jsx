import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { usersApi, notificationsApi } from '../api';

// Role → color map
const ROLE_COLORS = {
    ADMIN: '#e05c5c',
    STARTUP: '#7c6fcd',
    INVESTOR: '#3dba78',
    MENTOR: '#e8a838',
    RESEARCHER: '#3fb9c5',
};

/* ── SVG icon helpers ── */
const BellIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
);
const SunIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
);
const MoonIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
);
const UserIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
);
const GridIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
);
const MessageIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);
const BellSmallIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
);
const LogOutIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);
const SunSmallIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    </svg>
);
const MoonSmallIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
);
const CheckIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);
const ArrowRightIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
);

function getInitials(name, email) {
    if (name) {
        const parts = name.trim().split(' ');
        return parts.length > 1
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : name[0].toUpperCase();
    }
    return email ? email[0].toUpperCase() : '?';
}

/* ─── Notification type → accent colour ─── */
const NOTIF_COLORS = {
    SUCCESS: '#3dba78', FUNDING_UPDATE: '#3dba78',
    ERROR: '#e05c5c',
    WARNING: '#e8a838', MENTOR_ASSIGNED: '#e8a838',
    INFO: '#7c6fcd', SYSTEM: '#7c6fcd',
    NEW_MESSAGE: '#3fb9c5',
};
function notifColor(type) { return NOTIF_COLORS[type] || '#7c6fcd'; }
function notifLabel(type) {
    const map = {
        SUCCESS: 'OK', ERROR: 'ER', WARNING: 'WN', INFO: 'IN',
        FUNDING_UPDATE: 'FD', MENTOR_ASSIGNED: 'MT', SYSTEM: 'SY', NEW_MESSAGE: 'MS',
    };
    return map[type] || 'IN';
}
function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

/* ─── Profile edit modal ─── */
function ProfileModal({ user, onClose, onSave }) {
    const [form, setForm] = useState({
        name: user?.name || '',
        profilePhotoUrl: user?.profilePhotoUrl || '',
        bio: user?.bio || '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try { await onSave(form); onClose(); }
        catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box">
                <div className="modal-header">
                    <h2 className="modal-title">Edit Profile</h2>
                    <button className="modal-close" onClick={onClose} aria-label="Close">&#x2715;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="profile-name">Name</label>
                        <input id="profile-name" className="form-input" value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="profile-photo">Photo URL</label>
                        <input id="profile-photo" className="form-input" placeholder="https://..."
                            value={form.profilePhotoUrl}
                            onChange={(e) => setForm({ ...form, profilePhotoUrl: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="profile-bio">Bio</label>
                        <textarea id="profile-bio" className="form-textarea" rows={3}
                            placeholder="A little about yourself..."
                            value={form.bio}
                            onChange={(e) => setForm({ ...form, bio: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : 'Save changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─── Notification Panel (dropdown) ─── */
function NotificationPanel({ notifications, onMarkRead, onMarkAllRead, onClose, onNavigate }) {
    const unread = notifications.filter(n => !n.isRead && !n.read);

    return (
        <div className="notif-panel" onClick={e => e.stopPropagation()}>
            {/* header */}
            <div className="notif-panel-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Notifications</span>
                    {unread.length > 0 && (
                        <span style={{
                            background: 'var(--red)', color: '#fff',
                            borderRadius: 99, fontSize: 10, fontWeight: 700,
                            padding: '1px 6px', lineHeight: '16px',
                        }}>{unread.length}</span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    {unread.length > 0 && (
                        <button
                            onClick={onMarkAllRead}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                fontSize: 11, color: 'var(--violet)', fontWeight: 600,
                                padding: '3px 6px', borderRadius: 4,
                            }}
                            title="Mark all read"
                        >
                            Mark all read
                        </button>
                    )}
                </div>
            </div>

            {/* list */}
            <div className="notif-panel-list">
                {notifications.length === 0 ? (
                    <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                        <div style={{ marginBottom: 8 }}>
                            <BellIcon />
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>You're all caught up!</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>No notifications yet.</div>
                    </div>
                ) : (
                    notifications.slice(0, 8).map((n, idx) => {
                        const isUnread = !n.isRead && !n.read;
                        const color = notifColor(n.type);
                        const label = notifLabel(n.type);
                        const isMsg = n.type === 'NEW_MESSAGE' || n.content?.toLowerCase().includes('message');
                        return (
                            <div
                                key={n.id || idx}
                                onClick={() => {
                                    if (isUnread) onMarkRead(n.id);
                                    onClose();
                                    onNavigate(isMsg ? '/messages' : null,
                                        isMsg ? { state: { selectedUserId: n.relatedId } } : undefined);
                                }}
                                style={{
                                    display: 'flex', gap: 10, padding: '10px 14px',
                                    borderBottom: '1px solid var(--border-2)',
                                    cursor: 'pointer',
                                    background: isUnread ? 'rgba(124,111,205,0.05)' : 'transparent',
                                    transition: 'background 0.15s',
                                    position: 'relative',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                                onMouseLeave={e => e.currentTarget.style.background = isUnread ? 'rgba(124,111,205,0.05)' : 'transparent'}
                            >
                                {/* type badge */}
                                <div style={{
                                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                                    background: color + '18',
                                    border: `1px solid ${color}33`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 10, fontWeight: 800, color, letterSpacing: '0.04em',
                                    marginTop: 1,
                                }}>{label}</div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: 12.5, color: 'var(--text)',
                                        fontWeight: isUnread ? 600 : 400,
                                        lineHeight: 1.4,
                                        overflow: 'hidden', display: '-webkit-box',
                                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                    }}>
                                        {n.content || n.title || 'Notification'}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>
                                        {timeAgo(n.createdAt)}
                                    </div>
                                </div>

                                {/* unread dot */}
                                {isUnread && (
                                    <div style={{
                                        width: 7, height: 7, borderRadius: '50%',
                                        background: 'var(--violet)', flexShrink: 0, marginTop: 6,
                                    }} />
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* footer */}
            <div className="notif-panel-footer">
                <button
                    onClick={() => { onClose(); onNavigate('/notifications'); }}
                    style={{
                        width: '100%', background: 'none', border: 'none',
                        cursor: 'pointer', padding: '10px 14px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--violet)',
                        borderRadius: '0 0 var(--r-md) var(--r-md)',
                        transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,111,205,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                    View all notifications <ArrowRightIcon />
                </button>
            </div>
        </div>
    );
}

/* ─── Main TopBar ─── */
export default function TopBar() {
    const { user, logout } = useAuth();
    const { updateUser } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const [showMenu, setShowMenu] = useState(false);
    const [showNotifPanel, setShowNotifPanel] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [activeToast, setActiveToast] = useState(null);

    const menuRef = useRef(null);
    const notifRef = useRef(null);
    const prevIdsRef = useRef(new Set());

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
            if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifPanel(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Poll for notifications
    useEffect(() => {
        if (!user?.id) return;

        const poll = async () => {
            try {
                const notifs = await notificationsApi.getByUser(user.id);
                const sorted = [...notifs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setNotifications(sorted);

                const unread = sorted.filter(n => !n.isRead && !n.read);
                setUnreadCount(unread.length);

                const currentIds = new Set(unread.map(n => n.id));
                const fresh = unread.filter(n => !prevIdsRef.current.has(n.id));
                prevIdsRef.current = currentIds;

                if (fresh.length > 0) {
                    setActiveToast(fresh[0]);
                    setTimeout(() => setActiveToast(null), 5000);
                }
            } catch { /* silently ignore */ }
        };

        poll();
        const timer = setInterval(poll, 4000);
        return () => clearInterval(timer);
    }, [user]);

    const handleMarkRead = async (id) => {
        try {
            await notificationsApi.markRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true, read: true } : n));
            setUnreadCount(c => Math.max(0, c - 1));
        } catch { /* ignore */ }
    };

    const handleMarkAllRead = async () => {
        if (!user?.id) return;
        try {
            await notificationsApi.markAllRead(user.id);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
            setUnreadCount(0);
        } catch { /* ignore */ }
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    const roleColor = ROLE_COLORS[user?.role] || ROLE_COLORS.STARTUP;
    const avatarBg = user?.profilePhotoUrl
        ? `url(${user.profilePhotoUrl}) center/cover`
        : `linear-gradient(135deg, ${roleColor}, #7c6fcd)`;

    return (
        <>
            {/* ── Toast notification ── */}
            {activeToast && (
                <div
                    onClick={() => {
                        setActiveToast(null);
                        const isMsg = activeToast.type === 'NEW_MESSAGE'
                            || activeToast.content?.toLowerCase().includes('message');
                        navigate(isMsg ? '/messages' : '/notifications',
                            isMsg ? { state: { selectedUserId: activeToast.relatedId } } : undefined);
                    }}
                    style={{
                        position: 'fixed', bottom: 20, left: 20, zIndex: 9999,
                        background: 'var(--navy-3)', border: '1px solid var(--border)',
                        borderLeft: '3px solid var(--violet)',
                        borderRadius: 10, padding: '11px 14px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                        display: 'flex', gap: 10, alignItems: 'center',
                        cursor: 'pointer', maxWidth: 300,
                        animation: 'slideUp 0.25s ease',
                    }}
                >
                    <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: 'var(--violet-dim)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, color: 'var(--violet)',
                    }}>
                        {activeToast.type === 'NEW_MESSAGE' ? <MessageIcon /> : <BellSmallIcon />}
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 2 }}>
                            {activeToast.type === 'NEW_MESSAGE' ? 'New message' : 'Notification'}
                        </div>
                        <div style={{
                            fontSize: 12, color: 'var(--text-2)',
                            display: '-webkit-box', WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                            {activeToast.content}
                        </div>
                    </div>
                </div>
            )}

            <div className="topbar">
                <div className="topbar-left" />

                <div className="topbar-right">

                    {/* ── Notification bell + panel ── */}
                    {user && (
                        <div ref={notifRef} style={{ position: 'relative' }}>
                            <button
                                className="topbar-icon-btn"
                                onClick={() => { setShowNotifPanel(v => !v); setShowMenu(false); }}
                                style={{ position: 'relative' }}
                                title="Notifications"
                            >
                                <BellIcon />
                                {unreadCount > 0 && (
                                    <span style={{
                                        position: 'absolute', top: -3, right: -3,
                                        minWidth: 16, height: 16,
                                        background: 'var(--red)',
                                        borderRadius: 99, border: '2px solid var(--navy)',
                                        color: '#fff', fontSize: 9, fontWeight: 700,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        padding: '0 3px',
                                    }}>
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {showNotifPanel && (
                                <NotificationPanel
                                    notifications={notifications}
                                    onMarkRead={handleMarkRead}
                                    onMarkAllRead={handleMarkAllRead}
                                    onClose={() => setShowNotifPanel(false)}
                                    onNavigate={(path, opts) => path && navigate(path, opts)}
                                />
                            )}
                        </div>
                    )}

                    {/* ── Theme toggle ── */}
                    <button
                        className="topbar-icon-btn"
                        onClick={toggleTheme}
                        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    >
                        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                    </button>

                    {/* ── Profile button + dropdown ── */}
                    {user && (
                        <div className="topbar-profile" ref={menuRef}>
                            <button
                                className="topbar-profile-btn"
                                onClick={() => { setShowMenu(v => !v); setShowNotifPanel(false); }}
                            >
                                <div className="topbar-avatar" style={{ background: avatarBg }}>
                                    {!user.profilePhotoUrl && getInitials(user.name, user.email)}
                                </div>
                                <div className="topbar-user-info">
                                    <span className="topbar-user-name">{user.name || user.email}</span>
                                    <span className="topbar-user-role" style={{ color: roleColor }}>{user.role}</span>
                                </div>
                                <span className="topbar-chevron">{showMenu ? '▲' : '▼'}</span>
                            </button>

                            {showMenu && (
                                <div className="topbar-dropdown">
                                    <div className="topbar-dropdown-header">
                                        <div className="topbar-avatar-lg" style={{ background: avatarBg }}>
                                            {!user.profilePhotoUrl && getInitials(user.name, user.email)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text)' }}>
                                                {user.name || 'User'}
                                            </div>
                                            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{user.email}</div>
                                            <span className="badge" style={{
                                                marginTop: 4,
                                                background: roleColor + '22', color: roleColor,
                                                border: `1px solid ${roleColor}44`,
                                            }}>{user.role}</span>
                                        </div>
                                    </div>

                                    <div className="topbar-dropdown-divider" />

                                    <button className="topbar-dropdown-item" onClick={() => { setShowMenu(false); navigate('/profile'); }}>
                                        <UserIcon /> Edit profile
                                    </button>
                                    <button className="topbar-dropdown-item" onClick={() => { navigate('/dashboard'); setShowMenu(false); }}>
                                        <GridIcon /> Dashboard
                                    </button>
                                    <button className="topbar-dropdown-item" onClick={() => { navigate('/messages'); setShowMenu(false); }}>
                                        <MessageIcon /> Messages
                                    </button>
                                    <button className="topbar-dropdown-item" onClick={() => { setShowMenu(false); setShowNotifPanel(true); }}>
                                        <BellSmallIcon /> Notifications
                                    </button>

                                    <div className="topbar-dropdown-divider" />

                                    <button className="topbar-dropdown-item" onClick={toggleTheme}>
                                        {theme === 'dark' ? <SunSmallIcon /> : <MoonSmallIcon />}
                                        {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                                    </button>

                                    <div className="topbar-dropdown-divider" />

                                    <button className="topbar-dropdown-item topbar-dropdown-danger" onClick={handleLogout}>
                                        <LogOutIcon /> Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
