import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mentorsApi, messagesApi, startupsApi, usersApi, mentorshipRequestsApi } from '../api';
import { useAuth } from '../context/AuthContext';

function ChatModal({ targetUser, onClose, currentUserId }) {
    const [messages, setMessages] = useState([]);
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        messagesApi.getConversation(targetUser.id)
            .then(setMessages)
            .catch(() => setMessages([]))
            .finally(() => setLoading(false));
    }, [targetUser.id]);

    const handleSend = async () => {
        if (!msg.trim()) return;
        try {
            const sent = await messagesApi.send({ receiverId: targetUser.id, content: msg });
            setMessages(prev => [...prev, sent]);
            setMsg('');
        } catch (e) { console.error(e); }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box" style={{ maxWidth: 560, height: '65vh', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                    <h2 className="modal-title">💬 Chat with {targetUser.name}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {loading ? <div className="spinner" style={{ margin: '40px auto' }} /> :
                        messages.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 40 }}>No messages yet. Start the conversation!</p>
                        ) : messages.map((m, i) => (
                            <div key={m.id || i} style={{
                                alignSelf: m.senderId === currentUserId ? 'flex-end' : 'flex-start',
                                background: m.senderId === currentUserId ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--surface)',
                                color: m.senderId === currentUserId ? '#fff' : 'var(--text-primary)',
                                padding: '10px 16px', borderRadius: 16, maxWidth: '75%', fontSize: 14,
                                border: m.senderId === currentUserId ? 'none' : '1px solid var(--border)',
                            }}>
                                {m.content}
                                <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4 }}>
                                    {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </div>
                            </div>
                        ))
                    }
                </div>
                <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    <input className="form-input" style={{ flex: 1 }} placeholder="Type a message..." value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} />
                    <button className="btn btn-primary" onClick={handleSend}>Send</button>
                </div>
            </div>
        </div>
    );
}

function ApplyMentorModal({ onClose, onApply, currentUserId }) {
    const [form, setForm] = useState({ 
        expertise: '', 
        bio: '', 
        contactNumber: '', 
        yearsOfExperience: '', 
        currentTitle: '',
        userId: currentUserId 
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onApply({
                ...form,
                yearsOfExperience: parseInt(form.yearsOfExperience) || 0
            });
            onClose();
        } catch (err) { alert(err.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box" style={{ maxWidth: 500 }}>
                <div className="modal-header">
                    <h2 className="modal-title">🎓 Apply as Mentor</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Professional Title</label>
                            <input className="form-input" placeholder="e.g. Senior Architect" required value={form.currentTitle} onChange={e => setForm({ ...form, currentTitle: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Years of Experience</label>
                            <input className="form-input" type="number" placeholder="10" required value={form.yearsOfExperience} onChange={e => setForm({ ...form, yearsOfExperience: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Mentorship Expertise</label>
                        <input className="form-input" placeholder="e.g. Scaling, Marketing, Java/Spring" required value={form.expertise} onChange={e => setForm({ ...form, expertise: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Contact Number</label>
                        <input className="form-input" placeholder="+1 234 567 890" required value={form.contactNumber} onChange={e => setForm({ ...form, contactNumber: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Mentorship Pitch (Bio)</label>
                        <textarea className="form-textarea" style={{ height: 100 }} placeholder="Why should startups choose you as a mentor? Briefly describe your background..." required value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Submitting Application...' : 'Apply Now'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function RequestMentorshipModal({ mentor, onClose, currentUserId }) {
    const [startups, setStartups] = useState([]);
    const [selectedId, setSelectedId] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        usersApi.getStartups(currentUserId).then(setStartups).finally(() => setLoading(false));
    }, [currentUserId]);

    const handleRequest = async () => {
        if (!selectedId) return;
        setSubmitting(true);
        try {
            await mentorshipRequestsApi.create(selectedId, mentor.id, message);
            alert('Mentorship request sent successfully! Waiting for mentor approval.');
            onClose();
        } catch (err) { alert(err.message); }
        finally { setSubmitting(false); }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box" style={{ maxWidth: 450 }}>
                <div className="modal-header">
                    <h2 className="modal-title">🚀 Request Mentorship</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <p style={{ marginBottom: 16 }}>Apply for mentorship from <strong>{mentor.userName}</strong>.</p>
                {loading ? <div className="spinner" /> : (
                    <>
                        <div className="form-group">
                            <label className="form-label">Select Your Startup</label>
                            <select className="form-select" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
                                <option value="">-- Choose Startup --</option>
                                {startups.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group" style={{ marginTop: 12 }}>
                            <label className="form-label">Message to Mentor</label>
                            <textarea 
                                className="form-textarea" 
                                placeholder="Explain why you are seeking mentorship from this specific mentor..." 
                                style={{ height: 100 }}
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                            />
                        </div>
                    </>
                )}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" disabled={!selectedId || submitting} onClick={handleRequest}>
                        {submitting ? 'Sending...' : 'Send Request'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function EditMentorModal({ mentor, onClose, onSave }) {
    const [form, setForm] = useState({ ...mentor });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(mentor.id, {
                ...form,
                yearsOfExperience: parseInt(form.yearsOfExperience) || 0
            });
            onClose();
        } catch (err) { alert(err.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box" style={{ maxWidth: 500 }}>
                <div className="modal-header">
                    <h2 className="modal-title">✏️ Edit Mentor: {mentor.userName}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Professional Title</label>
                            <input className="form-input" required value={form.currentTitle || ''} onChange={e => setForm({ ...form, currentTitle: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Years of Experience</label>
                            <input className="form-input" type="number" required value={form.yearsOfExperience || ''} onChange={e => setForm({ ...form, yearsOfExperience: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Mentorship Expertise</label>
                        <input className="form-input" required value={form.expertise || ''} onChange={e => setForm({ ...form, expertise: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Contact Number</label>
                        <input className="form-input" required value={form.contactNumber || ''} onChange={e => setForm({ ...form, contactNumber: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Mentorship Pitch (Bio)</label>
                        <textarea className="form-textarea" style={{ height: 100 }} required value={form.bio || ''} onChange={e => setForm({ ...form, bio: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Status</label>
                        <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                            <option value="PENDING">PENDING</option>
                            <option value="APPROVED">APPROVED</option>
                            <option value="REJECTED">REJECTED</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Update Mentor'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function MentorsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [mySentRequests, setMySentRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chatTarget, setChatTarget] = useState(null);
    const [showApply, setShowApply] = useState(false);
    const [requestTarget, setRequestTarget] = useState(null);
    const [editingMentor, setEditingMentor] = useState(null);
    const [myProfile, setMyProfile] = useState(null);
    const [search, setSearch] = useState('');
    const [error, setError] = useState(null);
    const isMentor = user?.role === 'MENTOR';

    const loadData = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            // Check if user has a mentor profile
            try {
                const profile = await mentorsApi.getByUserId(user.id);
                setMyProfile(profile);
                
                // If they ARE a mentor, fetch pending mentorship requests
                if (user.role === 'MENTOR') {
                    const requests = await mentorshipRequestsApi.getForMentor(user.id);
                    setPendingRequests(requests || []);
                }

                // If they are a STARTUP, fetch their sent requests to hide button
                if (user.role === 'STARTUP') {
                    const myRequests = await mentorshipRequestsApi.getForStartup(user.id);
                    setMySentRequests(myRequests || []);
                }
            } catch (err) { setMyProfile(null); }

            const mentors = await mentorsApi.getAll();
            const visibleMentors = Array.isArray(mentors) 
                ? (user.role === 'ADMIN' ? mentors : mentors.filter(m => m.status === 'APPROVED'))
                : [];
            setData(visibleMentors);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError(err.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [user?.id, user?.role]);

    const handleApply = async (formData) => {
        await mentorsApi.create(formData);
        loadData();
    };

    const handleApproveMentor = async (mentorId, status) => {
        try {
            await mentorsApi.approve(mentorId, status);
            loadData();
        } catch (err) { alert(err.message); }
    };

    const handleUpdateMentor = async (id, formData) => {
        await mentorsApi.update(id, formData);
        loadData();
    };

    const handleRequestAction = async (requestId, status) => {
        try {
            await mentorshipRequestsApi.updateStatus(requestId, status);
            if (status === 'APPROVED') {
                alert(`Mentorship request approved! Redirecting to messages...`);
                navigate('/messages');
            } else {
                alert(`Mentorship request ${status.toLowerCase()}ed!`);
                loadData();
            }
        } catch (err) { alert(err.message); }
    }

    const filtered = data.filter(item => {
        const s = search.toLowerCase();
        return (
            (item.userName?.toLowerCase() || '').includes(s) ||
            (item.expertise?.toLowerCase() || '').includes(s) ||
            (item.bio?.toLowerCase() || '').includes(s) ||
            (item.currentTitle?.toLowerCase() || '').includes(s)
        );
    });

    const statusColors = { APPROVED: '#10b981', PENDING: '#f59e0b', REJECTED: '#ef4444' };

    return (
        <div className="page-container">
            {chatTarget && <ChatModal targetUser={chatTarget} onClose={() => setChatTarget(null)} currentUserId={user?.id} />}
            {showApply && <ApplyMentorModal onClose={() => setShowApply(false)} onApply={handleApply} currentUserId={user?.id} />}
            {requestTarget && <RequestMentorshipModal mentor={requestTarget} onClose={() => setRequestTarget(null)} currentUserId={user?.id} />}
            {editingMentor && <EditMentorModal mentor={editingMentor} onClose={() => setEditingMentor(null)} onSave={handleUpdateMentor} />}

            {error && <div className="alert alert-error">⚠ {error}</div>}

            {/* Mentor Requests Section (Only for Mentors) */}
            {isMentor && pendingRequests.length > 0 && (
                <div style={{ marginBottom: 32 }}>
                    <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 10px #f59e0b' }} />
                        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Pending Partnership Requests</h2>
                    </div>
                    <div className="grid-auto">
                        {pendingRequests.map(req => (
                            <div key={req.id} className="card" style={{ border: '1px solid #f59e0b33', background: '#f59e0b05' }}>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🚀</div>
                                    <div>
                                        <h4 style={{ fontSize: 15, fontWeight: 700 }}>{req.startupName}</h4>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Received {new Date(req.createdAt).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                {req.message && (
                                    <div style={{ background: 'var(--surface)', padding: 12, borderRadius: 8, fontSize: 13, border: '1px solid var(--border)', marginBottom: 12, fontStyle: 'italic' }}>
                                        "{req.message}"
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => handleRequestAction(req.id, 'APPROVED')}>Accept</button>
                                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => handleRequestAction(req.id, 'REJECTED')}>Decline</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* If user HAS a profile but is not officially a MENTOR yet, show status */}
            {myProfile && user?.role !== 'MENTOR' && (
                <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid #f59e0b', background: 'rgba(245,158,11,0.05)' }}>
                    <div className="flex-between">
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mentor Application Under Review</div>
                            <h3 style={{ fontSize: 16, margin: '4px 0' }}>{myProfile.currentTitle}</h3>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <span className="badge" style={{ background: (statusColors[myProfile.status] || '#f59e0b') + '22', color: statusColors[myProfile.status] || '#f59e0b' }}>
                                    {myProfile.status}
                                </span>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Specializing in {myProfile.expertise}</span>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                {myProfile.status === 'PENDING' ? 'Our team is reviewing your profile.' : 'Application updated.'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                    <h1 className="topbar-title">🎓 Mentors</h1>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                        Connect with experienced mentors to guide your startup journey
                    </p>
                </div>
                {user?.role !== 'ADMIN' && !isMentor && !myProfile && (
                    <button className="btn btn-primary" onClick={() => setShowApply(true)}>Apply to be a Mentor</button>
                )}
            </div>

            <input 
                className="form-input" 
                style={{ maxWidth: 320, marginBottom: 20 }} 
                placeholder="🔍 Search mentors by name, expertise, or title..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
            />

            {loading ? (
                <div className="loading-screen"><div className="spinner" /><p>Loading mentors...</p></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🎓</div>
                    <h3>No mentors found</h3>
                    <p>Check back later for available mentors</p>
                </div>
            ) : (
                <div className="grid-auto">
                    {filtered.map(item => (
                        <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                                <div style={{
                                    width: 52, height: 52, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #f59e0b, #6366f1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontSize: 20, fontWeight: 700, flexShrink: 0,
                                }}>
                                    {(item.userName || '?').charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{item.userName || 'Mentor'}</h3>
                                    {item.currentTitle && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{item.currentTitle}</div>}
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <span className="badge" style={{ background: (statusColors[item.status] || '#6366f1') + '22', color: statusColors[item.status] || '#6366f1', border: `1px solid ${(statusColors[item.status] || '#6366f1')}44` }}>
                                            {item.status}
                                        </span>
                                        {item.yearsOfExperience !== undefined && (
                                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>⭐ {item.yearsOfExperience}Y Experience</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="grid-2" style={{ gap: 12 }}>
                                {item.expertise && (
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Expertise</div>
                                        <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{item.expertise}</div>
                                    </div>
                                )}
                                {item.contactNumber && (
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Contact</div>
                                        <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{item.contactNumber}</div>
                                    </div>
                                )}
                            </div>
                            {item.bio && (
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 4 }}>{item.bio}</p>
                            )}
                            {item.startups?.length > 0 && (
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>🚀 Currently Mentoring {item.startups.length} startup{item.startups.length !== 1 ? 's' : ''}</div>
                            )}
                            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {item.userId && item.userId !== user?.id && (
                                    <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => setChatTarget({ id: item.userId, name: item.userName, email: item.userEmail })}>
                                        💬 Contact Mentor
                                    </button>
                                )}
                                {user?.role === 'STARTUP' && (
                                    (() => {
                                        const hasRelationship = mySentRequests.some(r => 
                                            r.mentorId === item.id && (r.status === 'PENDING' || r.status === 'APPROVED')
                                        );
                                        
                                        return hasRelationship ? (
                                            <div style={{ padding: '8px', textAlign: 'center', background: '#f59e0b11', borderRadius: 8, fontSize: 12, color: '#f59e0b' }}>
                                                {mySentRequests.find(r => r.mentorId === item.id && r.status === 'APPROVED') ? '✅ Mentorship Active' : '⏳ Request Pending'}
                                            </div>
                                        ) : (
                                            <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={() => setRequestTarget(item)}>
                                                🤝 Request Mentorship
                                            </button>
                                        );
                                    })()
                                )}
                                {user?.role === 'ADMIN' && item.status === 'PENDING' && (
                                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                                        <button className="btn btn-success btn-sm" style={{ flex: 1 }} onClick={() => handleApproveMentor(item.id, 'APPROVED')}>Approve</button>
                                        <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => handleApproveMentor(item.id, 'REJECTED')}>Reject</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

