import React, { useEffect, useState } from 'react';
import { usersApi, startupsApi, fundingAppApi, mentorsApi, notificationsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);
import { messagesApi } from '../api';

function ChatInterface({ targetUserId, currentUserId }) {
    const [messages, setMessages] = useState([]);
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        messagesApi.getConversation(targetUserId)
            .then(setMessages)
            .catch(() => setMessages([]))
            .finally(() => setLoading(false));
    }, [targetUserId]);

    const handleSend = async () => {
        if (!msg.trim()) return;
        try {
            const sent = await messagesApi.send({ receiverId: targetUserId, content: msg });
            setMessages(prev => [...prev, sent]);
            setMsg('');
        } catch (e) { console.error(e); }
    };

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {loading ? <div className="spinner" style={{ margin: '40px auto' }} /> :
                    messages.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 40 }}>No messages yet.</p>
                    ) : messages.map((m, i) => (
                        <div key={m.id || i} style={{
                            alignSelf: m.senderId === currentUserId ? 'flex-end' : 'flex-start',
                            background: m.senderId === currentUserId ? 'var(--primary-gradient)' : 'var(--surface)',
                            color: m.senderId === currentUserId ? '#fff' : 'var(--text-primary)',
                            padding: '10px 16px', borderRadius: 16, maxWidth: '85%', fontSize: 14,
                            border: m.senderId === currentUserId ? 'none' : '1px solid var(--border)',
                        }}>
                            {m.content}
                        </div>
                    ))
                }
            </div>
            <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <input className="form-input" style={{ flex: 1 }} placeholder="Type a message..." value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} />
                <button className="btn btn-primary" onClick={handleSend}>Send</button>
            </div>
        </div>
    );
}


/* ─── Toast Component ────────────────────────────────────────────────── */
function Toast({ toasts, onDismiss }) {
    return (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none' }}>
            {toasts.map(t => (
                <div
                    key={t.id}
                    onClick={() => onDismiss(t.id)}
                    style={{
                        pointerEvents: 'all', cursor: 'pointer',
                        background: 'var(--bg-card)', border: `1px solid ${t.borderColor || 'var(--border)'}`,
                        borderLeft: `4px solid ${t.accentColor || 'var(--accent)'}`,
                        borderRadius: 12, padding: '12px 16px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                        display: 'flex', gap: 12, alignItems: 'flex-start',
                        maxWidth: 320, animation: 'slideUp 0.3s ease',
                        backdropFilter: 'blur(12px)',
                    }}
                >
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{t.icon}</span>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: t.accentColor || 'var(--text-primary)', marginBottom: 2 }}>{t.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{t.message}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function useToast() {
    const [toasts, setToasts] = React.useState([]);
    const addToast = React.useCallback(({ icon, title, message, accentColor, borderColor, duration = 4500 }) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, icon, title, message, accentColor, borderColor }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    }, []);
    const dismiss = React.useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);
    return { toasts, addToast, dismiss };
}

export default function AdminPanelPage() {
    const { user } = useAuth();
    const { toasts, addToast, dismiss } = useToast();
    const [tab, setTab] = useState('overview');
    const [users, setUsers] = useState([]);
    const [startups, setStartups] = useState([]);
    const [applications, setApplications] = useState([]);
    const [mentors, setMentors] = useState([]);
    const [pendingMentors, setPendingMentors] = useState([]);
    const [announcement, setAnnouncement] = useState('');
    const [broadcastRole, setBroadcastRole] = useState('ALL');
    const [broadcasting, setBroadcasting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteReason, setDeleteReason] = useState('');
    const [chatTarget, setChatTarget] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            usersApi.getAll().catch(() => []),
            startupsApi.getAll().catch(() => []),
            fundingAppApi.getAll().catch(() => []),
            mentorsApi.getAll().catch(() => []),
            mentorsApi.getPending().catch(() => []),
        ]).then(([u, s, a, m, p]) => {
            setUsers(u); setStartups(s); setApplications(a); setMentors(m); setPendingMentors(p);
        }).finally(() => setLoading(false));
    }, []);

    const handleApproveMentor = async (mentorId, status) => {
        try {
            await mentorsApi.approve(mentorId, status);
            const updated = await mentorsApi.getPending().catch(() => []);
            setPendingMentors(updated);
            const allM = await mentorsApi.getAll().catch(() => []);
            setMentors(allM);
            addToast({
                icon: status === 'APPROVED' ? '✅' : '❌',
                title: `Mentor ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
                message: `Mentor status has been updated successfully.`,
                accentColor: status === 'APPROVED' ? 'var(--success)' : 'var(--danger)',
                borderColor: status === 'APPROVED' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'
            });
        } catch (e) {
            console.error(e);
            addToast({ icon: '⚠️', title: 'Error', message: 'Failed to update mentor status.', accentColor: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' });
        }
    };

    const handleDeleteUser = async () => {
        if (!deleteTarget) return;
        try {
            await usersApi.delete(deleteTarget.id, deleteReason);
            setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
            addToast({ 
                icon: '🗑️', 
                title: 'User Deleted', 
                message: `Account for ${deleteTarget.email} removed.`, 
                accentColor: 'var(--danger)', 
                borderColor: 'rgba(239,68,68,0.3)' 
            });
            setDeleteTarget(null);
            setDeleteReason('');
        } catch (e) {
            console.error(e);
            addToast({ icon: '⚠️', title: 'Error', message: 'Failed to delete user.', accentColor: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' });
        }
    };

    const handleUpdateAppStatus = async (id, status) => {
        try {
            await fundingAppApi.updateStatus(id, status);
            const updated = await fundingAppApi.getAll().catch(() => []);
            setApplications(updated);
            addToast({
                icon: status === 'APPROVED' ? '✅' : '❌',
                title: `Application ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
                message: `Funding application status updated to ${status}.`,
                accentColor: status === 'APPROVED' ? 'var(--success)' : 'var(--danger)',
                borderColor: status === 'APPROVED' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'
            });
        } catch (e) {
            console.error(e);
            addToast({ icon: '⚠️', title: 'Error', message: 'Failed to update application status.', accentColor: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' });
        }
    };

    const roleColors = { ADMIN: '#ef4444', STARTUP: '#6366f1', INVESTOR: '#10b981', MENTOR: '#f59e0b', RESEARCHER: '#06b6d4' };
    const roleMap = {};
    users.forEach(u => { roleMap[u.role] = (roleMap[u.role] || 0) + 1; });
    const roleData = {
        labels: Object.keys(roleMap),
        datasets: [{ data: Object.values(roleMap), backgroundColor: Object.keys(roleMap).map(r => roleColors[r] || '#6366f1'), borderWidth: 0 }]
    };

    const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 } } } } };

    const tabs = [
        { key: 'overview', label: '📊 Overview' },
        { key: 'users', label: '👥 Users' },
        { key: 'investors', label: '💼 Investors' },
        { key: 'researchers', label: '🔬 Researchers' },
        { key: 'startups', label: '🚀 Startups' },
        { key: 'applications', label: '💰 Applications' },
        { key: 'mentors', label: '🎓 Mentors' },
        { key: 'announcements', label: '📢 Announcements' },
    ];

    const handleBroadcast = async () => {
        if (!announcement.trim()) return;
        setBroadcasting(true);
        try {
            if (broadcastRole === 'ALL') {
                await notificationsApi.broadcastAnnouncement(announcement);
            } else {
                await notificationsApi.broadcastToRole(announcement, broadcastRole);
            }
            addToast({ 
                icon: '📢', 
                title: 'Broadcast Sent', 
                message: `Announcement has been sent to ${broadcastRole === 'ALL' ? 'all users' : broadcastRole + 's'}.`, 
                accentColor: '#8b5cf6', 
                borderColor: 'rgba(139,92,246,0.3)' 
            });
            setAnnouncement('');
        } catch (e) {
            addToast({ icon: '⚠️', title: 'Error', message: 'Failed to send broadcast.', accentColor: 'var(--danger)' });
        } finally {
            setBroadcasting(false);
        }
    };

    return (
        <div className="page-container">
            <Toast toasts={toasts} onDismiss={dismiss} />

            {/* Chat Modal */}
            {chatTarget && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setChatTarget(null)}>
                    <div className="modal-box" style={{ maxWidth: 500, height: '60vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">💬 Message {chatTarget.name || chatTarget.email}</h2>
                            <button className="modal-close" onClick={() => setChatTarget(null)}>✕</button>
                        </div>
                        <ChatInterface targetUserId={chatTarget.id} currentUserId={user.id} />
                    </div>
                </div>
            )}

            {/* Deletion Modal */}
            {deleteTarget && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteTarget(null)}>
                    <div className="modal-box" style={{ maxWidth: 450 }}>
                        <div className="modal-header">
                            <h2 className="modal-title" style={{ color: 'var(--danger)' }}>🚨 Remove User</h2>
                            <button className="modal-close" onClick={() => setDeleteTarget(null)}>✕</button>
                        </div>
                        <p style={{ marginBottom: 16 }}>
                            Are you sure you want to remove <strong>{deleteTarget.name || deleteTarget.email}</strong>? 
                            This action is permanent and will delete all associated data.
                        </p>
                        <div className="form-group">
                            <label className="form-label">Reason for Removal (Required)</label>
                            <textarea 
                                className="form-textarea" 
                                placeholder="e.g. Violation of terms, Spam account, User request..."
                                style={{ height: 100 }}
                                value={deleteReason}
                                onChange={e => setDeleteReason(e.target.value)}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                            <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                            <button 
                                className="btn btn-danger" 
                                disabled={!deleteReason.trim()}
                                onClick={handleDeleteUser}
                            >
                                Confirm Permanent Deletion
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ marginBottom: 24 }}>
                <h1 className="topbar-title">⚙️ Admin Panel</h1>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Full platform oversight and management</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                {tabs.map(t => (
                    <button key={t.key} className={`btn btn-sm ${tab === t.key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab(t.key)}>
                        {t.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="loading-screen"><div className="spinner" /><p>Loading...</p></div>
            ) : (
                <>
                    {tab === 'overview' && (
                        <>
                            <div className="stats-grid">
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>👥</div><div><div className="stat-value">{users.length}</div><div className="stat-label">Users</div></div></div>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>🚀</div><div><div className="stat-value">{startups.length}</div><div className="stat-label">Startups</div></div></div>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>💰</div><div><div className="stat-value">{applications.length}</div><div className="stat-label">Applications</div></div></div>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)' }}>🎓</div><div><div className="stat-value">{mentors.length}</div><div className="stat-label">Mentors</div></div></div>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)' }}>⏳</div><div><div className="stat-value">{pendingMentors.length}</div><div className="stat-label">Pending Approval</div></div></div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 24 }}>
                                <div className="card"><div className="section-title" style={{ marginBottom: 16 }}>Users by Role</div><div style={{ height: 260 }}><Doughnut data={roleData} options={chartOpts} /></div></div>
                                <div className="card"><div className="section-title" style={{ marginBottom: 16 }}>Quick Status</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(99,102,241,0.06)', borderRadius: 8 }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Active Startups</span><strong style={{ color: '#6366f1' }}>{startups.length}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(16,185,129,0.06)', borderRadius: 8 }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Approved Applications</span><strong style={{ color: '#10b981' }}>{applications.filter(a => a.status === 'APPROVED').length}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(245,158,11,0.06)', borderRadius: 8 }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Pending Applications</span><strong style={{ color: '#f59e0b' }}>{applications.filter(a => a.status === 'PENDING').length}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(245,158,11,0.06)', borderRadius: 8 }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Approved Mentors</span><strong style={{ color: '#10b981' }}>{mentors.filter(m => m.status === 'APPROVED').length}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {tab === 'users' && (
                        <div className="card">
                            <div className="section-title" style={{ marginBottom: 16 }}>All Users ({users.length})</div>
                            <div className="table-wrap">
                                <table>
                                    <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u.id}>
                                                <td>{u.id}</td>
                                                <td style={{ fontWeight: 600 }}>{u.name || '—'}</td>
                                                <td>{u.email}</td>
                                                <td><span className="badge" style={{ background: (roleColors[u.role] || '#6366f1') + '22', color: roleColors[u.role], border: `1px solid ${(roleColors[u.role] || '#6366f1')}44` }}>{u.role}</span></td>
                                                <td style={{ display: 'flex', gap: 8 }}>
                                                    <button className="btn btn-primary btn-sm" onClick={() => setChatTarget(u)}>💬 Contact</button>
                                                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(u)}>🗑 Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {tab === 'investors' && (
                        <div className="card">
                            <div className="section-title" style={{ marginBottom: 16 }}>All Investors ({users.filter(u => u.role === 'INVESTOR').length})</div>
                            <div className="table-wrap">
                                <table>
                                    <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Actions</th></tr></thead>
                                    <tbody>
                                        {users.filter(u => u.role === 'INVESTOR').map(u => (
                                            <tr key={u.id}>
                                                <td>{u.id}</td>
                                                <td style={{ fontWeight: 600 }}>{u.name || '—'}</td>
                                                <td>{u.email}</td>
                                                <td style={{ display: 'flex', gap: 8 }}>
                                                    <button className="btn btn-primary btn-sm" onClick={() => setChatTarget(u)}>💬 Contact</button>
                                                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(u)}>🗑 Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {tab === 'researchers' && (
                        <div className="card">
                            <div className="section-title" style={{ marginBottom: 16 }}>All Researchers ({users.filter(u => u.role === 'RESEARCHER').length})</div>
                            <div className="table-wrap">
                                <table>
                                    <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Actions</th></tr></thead>
                                    <tbody>
                                        {users.filter(u => u.role === 'RESEARCHER').map(u => (
                                            <tr key={u.id}>
                                                <td>{u.id}</td>
                                                <td style={{ fontWeight: 600 }}>{u.name || '—'}</td>
                                                <td>{u.email}</td>
                                                <td style={{ display: 'flex', gap: 8 }}>
                                                    <button className="btn btn-primary btn-sm" onClick={() => setChatTarget(u)}>💬 Contact</button>
                                                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(u)}>🗑 Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {tab === 'startups' && (
                        <div className="card">
                            <div className="section-title" style={{ marginBottom: 16 }}>All Startups ({startups.length})</div>
                            <div className="table-wrap">
                                <table>
                                    <thead><tr><th>Name</th><th>Industry</th><th>Stage</th><th>Founder</th><th>Funding Goal</th><th>Actions</th></tr></thead>
                                    <tbody>
                                        {startups.map(s => (
                                            <tr key={s.id}>
                                                <td style={{ fontWeight: 600 }}>{s.name}</td>
                                                <td><span className="badge badge-purple">{s.industry || s.sector}</span></td>
                                                <td><span className="badge badge-cyan">{s.stage}</span></td>
                                                <td>{s.founder?.name || s.founder?.email || '—'}</td>
                                                <td style={{ color: 'var(--success)', fontWeight: 600 }}>{s.fundingGoal ? `$${Number(s.fundingGoal).toLocaleString()}` : '—'}</td>
                                                <td><button className="btn btn-danger btn-sm" onClick={() => { if(window.confirm('Delete this startup?')) startupsApi.delete(s.id).then(()=>setStartups(prev=>prev.filter(x=>x.id!==s.id))) }}>🗑</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {tab === 'applications' && (
                        <div className="card">
                            <div className="section-title" style={{ marginBottom: 16 }}>All Funding Applications ({applications.length})</div>
                            <div className="table-wrap">
                                <table>
                                    <thead><tr><th>Startup</th><th>Investor</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
                                    <tbody>
                                        {applications.map(a => (
                                            <tr key={a.id}>
                                                <td style={{ fontWeight: 600 }}>{a.startupName || `#${a.startupId}`}</td>
                                                <td>{a.investorName || `#${a.investorId}`}</td>
                                                <td style={{ color: 'var(--success)', fontWeight: 600 }}>${Number(a.amount).toLocaleString()}</td>
                                                <td>
                                                    <span className="badge" style={{ background: (a.status === 'APPROVED' ? '#10b981' : a.status === 'REJECTED' ? '#ef4444' : '#f59e0b') + '22', color: a.status === 'APPROVED' ? '#10b981' : a.status === 'REJECTED' ? '#ef4444' : '#f59e0b' }}>
                                                        {a.status}
                                                    </span>
                                                </td>
                                                <td style={{ display: 'flex', gap: 6 }}>
                                                    {a.status === 'PENDING' && (
                                                        <>
                                                            <button className="btn btn-sm" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }} onClick={() => handleUpdateAppStatus(a.id, 'APPROVED')}>✅ Approve</button>
                                                            <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }} onClick={() => handleUpdateAppStatus(a.id, 'REJECTED')}>❌ Reject</button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {tab === 'mentors' && (
                        <div className="card">
                            <div className="section-title" style={{ marginBottom: 16 }}>Manage Mentors ({mentors.length})</div>
                            {pendingMentors.length > 0 && (
                                <div style={{ marginBottom: 20, padding: 16, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-md)' }}>
                                    <div style={{ fontWeight: 600, color: '#f59e0b', marginBottom: 8 }}>⏳ {pendingMentors.length} Pending Approval</div>
                                    {pendingMentors.map(m => (
                                        <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(245,158,11,0.1)' }}>
                                            <div>
                                                <strong>{m.userName}</strong> — {m.expertise || 'N/A'}
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.userEmail}</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button className="btn btn-sm" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }} onClick={() => handleApproveMentor(m.id, 'APPROVED')}>✅ Approve</button>
                                                <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }} onClick={() => handleApproveMentor(m.id, 'REJECTED')}>❌ Reject</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="table-wrap">
                                <table>
                                    <thead><tr><th>Name</th><th>Email</th><th>Expertise</th><th>Status</th><th>Startups</th><th>Actions</th></tr></thead>
                                    <tbody>
                                        {mentors.map(m => (
                                            <tr key={m.id}>
                                                <td style={{ fontWeight: 600 }}>{m.userName}</td>
                                                <td>{m.userEmail}</td>
                                                <td>{m.expertise || '—'}</td>
                                                <td>
                                                    <span className="badge" style={{ background: (m.status === 'APPROVED' ? '#10b981' : m.status === 'REJECTED' ? '#ef4444' : '#f59e0b') + '22', color: m.status === 'APPROVED' ? '#10b981' : m.status === 'REJECTED' ? '#ef4444' : '#f59e0b' }}>
                                                        {m.status}
                                                    </span>
                                                </td>
                                                <td>{m.startups?.length || 0}</td>
                                                <td style={{ display: 'flex', gap: 8 }}>
                                                    <button className="btn btn-primary btn-sm" onClick={() => setChatTarget({ id: m.userId, name: m.userName })}>💬 Contact</button>
                                                    <button className="btn btn-danger btn-sm" onClick={() => { if(window.confirm('Delete this mentor profile?')) mentorsApi.delete(m.id).then(() => setMentors(prev => prev.filter(x => x.id !== m.id))) }}>🗑 Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {tab === 'announcements' && (
                        <div className="card" style={{ maxWidth: 700, margin: '0 auto' }}>
                            <div className="section-title" style={{ marginBottom: 16 }}>📢 Platform Announcements</div>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                                Send a notification to specific roles or the entire platform. This will appear in their notifications center instantly.
                            </p>
                            
                            <div className="form-group" style={{ marginBottom: 20 }}>
                                <label className="form-label">Recipient Group</label>
                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                    {['ALL', 'STARTUP', 'INVESTOR', 'MENTOR', 'RESEARCHER', 'ADMIN'].map(r => (
                                        <button 
                                            key={r} 
                                            className={`btn btn-sm ${broadcastRole === r ? 'btn-primary' : 'btn-secondary'}`} 
                                            onClick={() => setBroadcastRole(r)}
                                        >
                                            {r === 'ALL' ? '🌐 Everyone' : r}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Message Content</label>
                                <textarea 
                                    className="form-textarea" 
                                    style={{ height: 120, fontSize: 14 }} 
                                    placeholder={`Type your announcement for ${broadcastRole === 'ALL' ? 'all users' : broadcastRole + 's'} here...`}
                                    value={announcement}
                                    onChange={e => setAnnouncement(e.target.value)}
                                />
                            </div>
                            
                            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                                <button 
                                    className="btn btn-primary" 
                                    style={{ padding: '10px 32px' }}
                                    disabled={broadcasting || !announcement.trim()}
                                    onClick={handleBroadcast}
                                >
                                    {broadcasting ? '📡 Broadcasting...' : `🚀 Send to ${broadcastRole === 'ALL' ? 'All Users' : broadcastRole + 's'}`}
                                </button>
                            </div>

                            <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
                                <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>Pro Tips</h4>
                                <ul style={{ fontSize: 13, color: 'var(--text-secondary)', paddingLeft: 20, lineHeight: 1.6 }}>
                                    <li>Keep Announcements concise and professional.</li>
                                    <li>Use emojis to make important news stand out.</li>
                                    <li>Role-based broadcasts are great for role-specific updates (e.g. "New funding round for Startups").</li>
                                </ul>
                            </div>
                        </div>
                    )}

                </>
            )}
        </div>
    );
}

