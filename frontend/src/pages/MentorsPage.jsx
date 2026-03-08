import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mentorsApi, messagesApi, startupsApi, usersApi, mentorshipRequestsApi, feedbackApi } from '../api';
import { useAuth } from '../context/AuthContext';

function FeedbackModal({ target, onClose, currentUserId, type = 'MENTOR' }) {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [myReview, setMyReview] = useState({ rating: 5, comment: '', isNew: true });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadReviews = async () => {
        setLoading(true);
        try {
            const data = await feedbackApi.getForTarget(target.id, type);
            setReviews(data);
            const existing = data.find(r => r.reviewerId === currentUserId);
            if (existing) {
                setMyReview({ ...existing, isNew: false });
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadReviews(); }, [target.id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (myReview.isNew) {
                await feedbackApi.leave({
                    rating: myReview.rating,
                    comment: myReview.comment,
                    reviewerId: currentUserId,
                    targetId: target.id,
                    targetType: type
                });
            } else {
                await feedbackApi.update(myReview.id, {
                    rating: myReview.rating,
                    comment: myReview.comment
                });
            }
            loadReviews();
            alert('Feedback submitted successfully!');
        } catch (e) { alert(e.message); }
        finally { setIsSubmitting(false); }
    };

    const renderStars = (rating) => '⭐'.repeat(rating) + '☆'.repeat(5 - rating);

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box" style={{ maxWidth: 500, padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                    <h2 className="modal-title" style={{ margin: 0 }}>⭐ Reviews & Ratings</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                
                <div style={{ padding: '24px 24px 0' }}>
                    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--accent-glow)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>
                            {(target.userName || target.name || '?').charAt(0)}
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{target.userName || target.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Feedback History</div>
                        </div>
                    </div>

                    <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: 8, marginBottom: 20 }}>
                        {loading ? <div className="spinner" style={{ margin: '20px auto' }} /> : reviews.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 0', border: '1px dashed var(--border)', borderRadius: 12 }}>
                                <div style={{ fontSize: 32, marginBottom: 10 }}>📝</div>
                                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No reviews yet. Be the first to share your experience!</p>
                            </div>
                        ) : (
                            reviews.map(r => (
                                <div key={r.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                                    <div className="flex-between" style={{ marginBottom: 8 }}>
                                        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{r.reviewerName}</span>
                                        <span style={{ color: '#f59e0b', fontSize: 12 }}>{renderStars(r.rating)}</span>
                                    </div>
                                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r.comment}</p>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                                        {new Date(r.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {currentUserId && (
                    <div style={{ background: 'rgba(255,255,255,0.03)', borderTop: '1px solid var(--border)', padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 700 }}>{myReview.isNew ? 'Leave a Review' : 'Your Review'}</h4>
                            {!myReview.isNew && !myReview.isEditable && (
                                <span style={{ fontSize: 11, color: 'var(--warning)', fontWeight: 600 }}>🔒 History Locked</span>
                            )}
                        </div>
                        
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                                {[1, 2, 3, 4, 5].map(s => (
                                    <span 
                                        key={s} 
                                        style={{ 
                                            fontSize: 24, cursor: (myReview.isNew || myReview.isEditable) ? 'pointer' : 'default', transition: '0.2s',
                                            opacity: s <= myReview.rating ? 1 : 0.2
                                        }}
                                        onClick={() => (myReview.isNew || myReview.isEditable) && setMyReview({ ...myReview, rating: s })}
                                    >
                                        ⭐
                                    </span>
                                ))}
                            </div>
                            <div className="form-group">
                                <textarea 
                                    className="form-textarea" 
                                    style={{ height: 100, borderRadius: 12, background: 'var(--bg-primary)' }} 
                                    placeholder="Describe your collaboration/mentorship experience..." 
                                    disabled={!myReview.isNew && !myReview.isEditable}
                                    value={myReview.comment} 
                                    onChange={e => setMyReview({ ...myReview, comment: e.target.value })} 
                                    required 
                                />
                            </div>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
                                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                                {(myReview.isNew || myReview.isEditable) && (
                                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                        {isSubmitting ? 'Saving...' : (myReview.isNew ? 'Submit' : 'Update')}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

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
                <p style={{ marginBottom: 12 }}>Apply for mentorship from <strong>{mentor.userName}</strong>.</p>
                <div style={{ background: 'var(--surface)', padding: '10px 14px', borderRadius: 8, fontSize: 12, border: '1px solid var(--border)', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 18 }}>⏳</span>
                    <span style={{ color: 'var(--text-secondary)' }}>Note: Approved mentorships are active for <strong>30 days</strong>.</span>
                </div>
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
    const [feedbackTarget, setFeedbackTarget] = useState(null);
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
            {feedbackTarget && <FeedbackModal target={feedbackTarget} onClose={() => setFeedbackTarget(null)} currentUserId={user?.id} />}

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
                        <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                            {/* Card Header Area */}
                            <div style={{ padding: '24px 20px 0', display: 'flex', gap: 16 }}>
                                <div style={{
                                    width: 60, height: 60, borderRadius: 'var(--radius-md)',
                                    background: 'linear-gradient(135deg, var(--accent), var(--accent-3))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontSize: 24, fontWeight: 800, flexShrink: 0,
                                    boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)'
                                }}>
                                    {(item.userName || '?').charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{item.userName || 'Mentor'}</h3>
                                        <span className="badge" style={{ 
                                            background: (statusColors[item.status] || '#6366f1') + '15', 
                                            color: statusColors[item.status] || '#6366f1',
                                            border: `1px solid ${(statusColors[item.status] || '#6366f1')}30`,
                                            fontSize: 10
                                        }}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{item.currentTitle || 'Professional Mentor'}</div>
                                    <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12 }}>
                                        {item.yearsOfExperience !== undefined && (
                                            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <span style={{ color: '#f59e0b' }}>⭐</span> {item.yearsOfExperience}Y Exp
                                            </span>
                                        )}
                                        {item.startups?.length > 0 && (
                                            <span style={{ color: 'var(--accent-2)', fontWeight: 600 }}>
                                                🚀 {item.startups.length} Active
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Expertise / Tags Section */}
                            <div style={{ padding: '20px 20px 12px' }}>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Expertise</div>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {(item.expertise || 'General').split(',').map((tag, idx) => (
                                        <span key={idx} style={{ 
                                            padding: '4px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', 
                                            borderRadius: 6, fontSize: 12, color: 'var(--text-secondary)'
                                        }}>
                                            {tag.trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Bio Section */}
                            {item.bio && (
                                <div style={{ padding: '0 20px 20px', flex: 1 }}>
                                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {item.bio}
                                    </p>
                                </div>
                            )}

                            {/* Relationship / Status Bar (Conditional) */}
                            {user?.role === 'STARTUP' && (() => {
                                const activeReq = mySentRequests.find(r => r.mentorId === item.id && r.status === 'APPROVED');
                                const isPending = mySentRequests.some(r => r.mentorId === item.id && r.status === 'PENDING');
                                
                                if (activeReq) return (
                                    <div style={{ margin: '0 20px 12px', padding: '10px 14px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 10, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>✅ Active Session</span>
                                            {activeReq.expiryDate && (
                                                <span style={{ fontSize: 11, color: '#10b981', opacity: 0.8 }}>
                                                    {(() => {
                                                        const diff = new Date(activeReq.expiryDate) - new Date();
                                                        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                                                        return days > 0 ? `${days}d left` : 'Expires soon';
                                                    })()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                                if (isPending) return (
                                    <div style={{ margin: '0 20px 12px', padding: '10px 14px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: 10, border: '1px solid rgba(245, 158, 11, 0.2)', textAlign: 'center' }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>⏳ Request Pending</span>
                                    </div>
                                );
                                return null;
                            })()}

                            {/* Action Buttons Section */}
                            <div style={{ padding: 16, borderTop: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', display: 'flex', gap: 8 }}>
                                {item.userId && item.userId !== user?.id && (
                                    <button className="btn btn-secondary btn-sm" style={{ flex: 1, padding: '10px' }} title="Send Message" onClick={() => setChatTarget({ id: item.userId, name: item.userName, email: item.userEmail })}>
                                        💬 Message
                                    </button>
                                )}
                                <button className="btn btn-secondary btn-sm" style={{ flex: 1, padding: '10px' }} title="View Feedback" onClick={() => setFeedbackTarget({ id: item.userId, userName: item.userName })}>
                                    ⭐ Reviews
                                </button>
                                
                                {user?.role === 'STARTUP' && !mySentRequests.some(r => r.mentorId === item.id && (r.status === 'PENDING' || r.status === 'APPROVED')) && (
                                    <button className="btn btn-primary btn-sm" style={{ flex: 2, padding: '10px' }} onClick={() => setRequestTarget(item)}>
                                        🤝 Request
                                    </button>
                                )}

                                {user?.role === 'ADMIN' && item.status === 'PENDING' && (
                                    <div style={{ display: 'flex', gap: 6, flex: 2 }}>
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

