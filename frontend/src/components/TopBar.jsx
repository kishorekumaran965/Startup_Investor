import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { usersApi, notificationsApi } from '../api';

function ProfileModal({ user, onClose, onSave }) {
    const [form, setForm] = useState({
        profilePhotoUrl: user?.profilePhotoUrl || '',
        bio: user?.bio || '',
        name: user?.name || ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(form);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box">
                <div className="modal-header">
                    <h2 className="modal-title">👤 Edit Profile</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Name</label>
                        <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Profile Photo URL</label>
                        <input className="form-input" placeholder="https://example.com/photo.jpg" value={form.profilePhotoUrl} onChange={(e) => setForm({ ...form, profilePhotoUrl: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Bio / Description</label>
                        <textarea className="form-textarea" rows={3} placeholder="Tell us about yourself..." value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Profile'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function TopBar() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [activeToast, setActiveToast] = useState(null);
    const prevCountRef = useRef(0);
    const prevNotifIdsRef = useRef(new Set());
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    useEffect(() => {
        if (!user?.id) return;
        const fetchUnread = async () => {
            try {
                const notifs = await notificationsApi.getByUser(user.id);
                const unreadNotifs = notifs.filter(n => !n.isRead && !n.read);
                setUnreadCount(unreadNotifs.length);

                // Detect new notifications
                const currentIds = new Set(unreadNotifs.map(n => n.id));
                const newNotifs = unreadNotifs.filter(n => !prevNotifIdsRef.current.has(n.id));
                prevNotifIdsRef.current = currentIds;

                if (newNotifs.length > 0) {
                    const latest = newNotifs[0];
                    setActiveToast(latest);
                    setTimeout(() => setActiveToast(null), 5000);
                }

            } catch (e) { }
        };
        fetchUnread();
        const interval = setInterval(fetchUnread, 3000);
        return () => clearInterval(interval);
    }, [user]);

    const getRoleBadgeColor = (role) => {
        const colors = {
            ADMIN: '#ef4444', STARTUP: '#6366f1', INVESTOR: '#10b981',
            MENTOR: '#f59e0b', RESEARCHER: '#06b6d4',
        };
        return colors[role] || '#6366f1';
    };

    const getInitials = (name, email) => {
        if (name) {
            const parts = name.split(' ');
            return parts.length > 1 ? parts[0][0] + parts[1][0] : name[0];
        }
        return email ? email[0].toUpperCase() : '?';
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const { updateUser } = useAuth();
    const handleProfileSave = async (data) => {
        try {
            await usersApi.update(user.id, { ...user, ...data });
            updateUser(data);
        } catch (err) {
            console.error(err);
            alert("Failed to update profile: " + err.message);
        }
    };

    return (
        <>
            {/* WhatsApp style Toast notification */}
            {activeToast && (
                <div style={{
                    position: 'fixed', bottom: 24, left: 24, background: 'var(--bg-card)', zIndex: 9999,
                    padding: '12px 16px', borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                    display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer', border: '1px solid var(--border)',
                    animation: 'fadeInDown 0.3s ease-out', maxWidth: 300
                }} onClick={() => {
                    setActiveToast(null);
                    if (activeToast.type === 'NEW_MESSAGE' || activeToast.content?.toLowerCase().includes('message')) {
                        navigate('/messages', { state: { selectedUserId: activeToast.relatedId } });
                    } else {
                        navigate('/notifications');
                    }
                }}>
                    <div style={{ background: 'var(--accent)', color: '#fff', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                        {activeToast.type === 'NEW_MESSAGE' ? '💬' : '🔔'}
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{activeToast.type === 'NEW_MESSAGE' ? 'New Message' : 'Notification'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{activeToast.content}</div>
                    </div>
                </div>
            )}

            <div className="topbar">
                <div className="topbar-left">
                    <h1 className="topbar-page-title"></h1>
                </div>
                <div className="topbar-right">
                    {/* Notifications Bell */}
                    {user && (
                        <button
                            className="topbar-icon-btn"
                            onClick={() => navigate('/notifications')}
                            style={{ position: 'relative' }}
                            title="Notifications"
                        >
                            🔔
                            {unreadCount > 0 && (
                                <span style={{
                                    position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18,
                                    background: 'var(--danger)', borderRadius: '9px', border: '2px solid var(--card-bg)',
                                    color: 'white', fontSize: 10, fontWeight: 'bold',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    padding: '0 4px', zIndex: 10
                                }}>
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>
                    )}

                    {/* Theme Toggle */}
                    <button
                        className="topbar-icon-btn"
                        onClick={toggleTheme}
                        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    >
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>

                    {/* Profile */}
                    {user && (
                        <div className="topbar-profile" ref={menuRef}>
                            <button
                                className="topbar-profile-btn"
                                onClick={() => setShowMenu(!showMenu)}
                            >
                                <div className="topbar-avatar" style={{
                                    background: user.profilePhotoUrl ? `url(${user.profilePhotoUrl}) center/cover` : `linear-gradient(135deg, ${getRoleBadgeColor(user.role)}, #6366f1)`
                                }}>
                                    {!user.profilePhotoUrl && getInitials(user.name, user.email)}
                                </div>
                                <div className="topbar-user-info">
                                    <span className="topbar-user-name">{user.name || user.email}</span>
                                    <span className="topbar-user-role" style={{ color: getRoleBadgeColor(user.role) }}>{user.role}</span>
                                </div>
                                <span className="topbar-chevron">{showMenu ? '▲' : '▼'}</span>
                            </button>

                            {showMenu && (
                                <div className="topbar-dropdown">
                                    <div className="topbar-dropdown-header">
                                        <div className="topbar-avatar-lg" style={{
                                            background: user.profilePhotoUrl ? `url(${user.profilePhotoUrl}) center/cover` : `linear-gradient(135deg, ${getRoleBadgeColor(user.role)}, #6366f1)`
                                        }}>
                                            {!user.profilePhotoUrl && getInitials(user.name, user.email)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{user.name || 'User'}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.email}</div>
                                            <span className="badge" style={{
                                                marginTop: 4, display: 'inline-block',
                                                background: getRoleBadgeColor(user.role) + '22',
                                                color: getRoleBadgeColor(user.role),
                                                border: `1px solid ${getRoleBadgeColor(user.role)}44`,
                                            }}>{user.role}</span>
                                        </div>
                                    </div>
                                    <div className="topbar-dropdown-divider" />
                                    <button className="topbar-dropdown-item" onClick={() => { setShowMenu(false); setShowProfile(true); }}>
                                        👤 Edit Profile
                                    </button>
                                    <button className="topbar-dropdown-item" onClick={() => { navigate('/dashboard'); setShowMenu(false); }}>
                                        ⊞ Dashboard
                                    </button>
                                    <button className="topbar-dropdown-item" onClick={() => { navigate('/messages'); setShowMenu(false); }}>
                                        💬 Messages
                                    </button>
                                    <button className="topbar-dropdown-item" onClick={() => { navigate('/notifications'); setShowMenu(false); }}>
                                        🔔 Notifications
                                    </button>
                                    <div className="topbar-dropdown-divider" />
                                    <button className="topbar-dropdown-item" onClick={toggleTheme}>
                                        {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
                                    </button>
                                    <div className="topbar-dropdown-divider" />
                                    <button className="topbar-dropdown-item topbar-dropdown-danger" onClick={handleLogout}>
                                        ⬅ Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {showProfile && user && <ProfileModal user={user} onClose={() => setShowProfile(false)} onSave={handleProfileSave} />}
            </div>
        </>
    );
}
