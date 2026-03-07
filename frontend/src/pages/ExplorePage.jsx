import React, { useEffect, useState } from 'react';
import { startupsApi, fundingAppApi, messagesApi } from '../api';
import { useAuth } from '../context/AuthContext';

const INDUSTRIES = ['All', 'Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce', 'Sustainability', 'AI/ML', 'Other'];

/* ─── Investor Modal: Express Investment Interest ─── */
function InvestModal({ startup, onClose, userId }) {
    const [form, setForm] = useState({ startupId: startup.id, investorId: userId, amount: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            await fundingAppApi.apply(form);
            setSuccess(true);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    if (success) return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box" style={{ textAlign: 'center', padding: '40px 32px' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Interest Submitted!</h2>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>The startup founder will review your application.</p>
                <button className="btn btn-primary" onClick={onClose}>Close</button>
            </div>
        </div>
    );

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box">
                <div className="modal-header">
                    <h2 className="modal-title">💰 Express Interest in {startup.name}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                {error && <div className="alert alert-error">⚠ {error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Investment Amount ($)</label>
                        <input name="amount" type="number" className="form-input" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="Enter amount" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Message to Founder</label>
                        <textarea name="message" className="form-textarea" rows={3} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Why are you interested in this startup?" />
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Submitting...' : 'Submit Interest'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─── Researcher Modal: Apply to Join with Study Details ─── */
function ResearcherApplyModal({ startup, onClose, userId }) {
    const [form, setForm] = useState({
        fullName: '', university: '', department: '', degree: '',
        researchArea: '', experience: '', motivation: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            // Send researcher application as a message to the founder
            const content =
                `🔬 Research Application for "${startup.name}"

👤 Name: ${form.fullName}
🎓 University: ${form.university}
📚 Department: ${form.department}
🎓 Degree: ${form.degree}
🔬 Research Area: ${form.researchArea}
📋 Experience: ${form.experience}

💡 Motivation:
${form.motivation}`;

            const founderId = startup.founder?.id || startup.userId;
            if (founderId) {
                await messagesApi.send({ receiverId: founderId, content });
            }
            setSuccess(true);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    if (success) return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box" style={{ textAlign: 'center', padding: '40px 32px' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Application Submitted!</h2>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>Your research profile has been sent to the startup founder. They will contact you via Messages.</p>
                <button className="btn btn-primary" onClick={onClose}>Close</button>
            </div>
        </div>
    );

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box" style={{ maxWidth: 600 }}>
                <div className="modal-header">
                    <h2 className="modal-title">🔬 Apply to Join: {startup.name}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                {error && <div className="alert alert-error">⚠ {error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input name="fullName" className="form-input" value={form.fullName} onChange={handleChange} placeholder="Dr. Jane Smith" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">University / Institution</label>
                            <input name="university" className="form-input" value={form.university} onChange={handleChange} placeholder="MIT, Stanford..." required />
                        </div>
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Department</label>
                            <input name="department" className="form-input" value={form.department} onChange={handleChange} placeholder="Computer Science" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Degree / Position</label>
                            <input name="degree" className="form-input" value={form.degree} onChange={handleChange} placeholder="PhD, Postdoc, Professor..." required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Research Area / Specialization</label>
                        <input name="researchArea" className="form-input" value={form.researchArea} onChange={handleChange} placeholder="Machine Learning, Biotech, Data Analytics..." required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Relevant Experience & Publications</label>
                        <textarea name="experience" className="form-textarea" rows={3} value={form.experience} onChange={handleChange} placeholder="Describe your relevant research experience, published papers, projects..." required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Why do you want to join this project?</label>
                        <textarea name="motivation" className="form-textarea" rows={3} value={form.motivation} onChange={handleChange} placeholder="Explain how your research can contribute to this startup..." required />
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Sending...' : '🔬 Submit Application'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─── Chat Modal ─── */
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
            <div className="modal-box" style={{ maxWidth: 560, height: '70vh', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                    <h2 className="modal-title">💬 Chat with {targetUser.name || targetUser.email}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {loading ? <div className="loading-screen"><div className="spinner" /></div> :
                        messages.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 40 }}>No messages yet. Start the conversation!</p>
                        ) : messages.map((m, i) => (
                            <div key={m.id || i} style={{
                                alignSelf: m.senderId === currentUserId ? 'flex-end' : 'flex-start',
                                background: m.senderId === currentUserId ? 'var(--accent)' : 'var(--card-bg)',
                                color: m.senderId === currentUserId ? '#fff' : 'var(--text-primary)',
                                padding: '10px 16px', borderRadius: 16, maxWidth: '75%', fontSize: 14, lineHeight: 1.5,
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

/* ─── Main Explore Page ─── */
export default function ExplorePage() {
    const { user } = useAuth();
    const [startups, setStartups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterIndustry, setFilterIndustry] = useState('All');
    const [filterStage, setFilterStage] = useState('All');
    const [investTarget, setInvestTarget] = useState(null);
    const [researchTarget, setResearchTarget] = useState(null);
    const [chatTarget, setChatTarget] = useState(null);

    useEffect(() => {
        startupsApi.getAll()
            .then(setStartups)
            .catch(() => setStartups([]))
            .finally(() => setLoading(false));
    }, []);

    const filtered = startups.filter(s =>
        (s.name?.toLowerCase().includes(search.toLowerCase()) || s.description?.toLowerCase().includes(search.toLowerCase())) &&
        (filterIndustry === 'All' || (s.industry || s.sector) === filterIndustry) &&
        (filterStage === 'All' || s.stage === filterStage)
    );

    const stageColors = { IDEA: '#6366f1', MVP: '#06b6d4', GROWTH: '#10b981', SCALING: '#f59e0b' };

    return (
        <div className="page-container">
            {investTarget && <InvestModal startup={investTarget} onClose={() => setInvestTarget(null)} userId={user?.id} />}
            {researchTarget && <ResearcherApplyModal startup={researchTarget} onClose={() => setResearchTarget(null)} userId={user?.id} />}
            {chatTarget && <ChatModal targetUser={chatTarget} onClose={() => setChatTarget(null)} currentUserId={user?.id} />}

            <div style={{ marginBottom: 24 }}>
                <h1 className="topbar-title">🔍 Explore Startup Ideas</h1>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                    {user?.role === 'INVESTOR' ? 'Discover promising startups and invest in the future.' :
                        user?.role === 'RESEARCHER' ? 'Find innovative ideas to join and contribute your research.' :
                            'Browse all startup ideas in the ecosystem.'}
                </p>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                <input className="form-input" style={{ maxWidth: 300 }} placeholder="🔍 Search startups..." value={search} onChange={e => setSearch(e.target.value)} />
                <select className="form-select" style={{ maxWidth: 160 }} value={filterIndustry} onChange={e => setFilterIndustry(e.target.value)}>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
                <select className="form-select" style={{ maxWidth: 140 }} value={filterStage} onChange={e => setFilterStage(e.target.value)}>
                    <option value="All">All Stages</option>
                    {['IDEA', 'MVP', 'GROWTH', 'SCALING'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                </div>
            </div>

            {loading ? (
                <div className="loading-screen"><div className="spinner" /><p>Loading startups...</p></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🔍</div>
                    <h3>No startups found</h3>
                    <p>Try adjusting your filters</p>
                </div>
            ) : (
                <div className="grid-auto">
                    {filtered.map(s => (
                        <div key={s.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div className="flex-between">
                                <div>
                                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{s.name}</h3>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        <span className="badge" style={{ background: (stageColors[s.stage] || '#6366f1') + '22', color: stageColors[s.stage] || '#6366f1', border: `1px solid ${(stageColors[s.stage] || '#6366f1')}44` }}>{s.stage || 'IDEA'}</span>
                                        {(s.industry || s.sector) && <span className="badge badge-cyan">{s.industry || s.sector}</span>}
                                    </div>
                                </div>
                                <div style={{ fontSize: 32 }}>🚀</div>
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                {s.description?.slice(0, 150)}{s.description?.length > 150 ? '...' : ''}
                            </p>
                            {s.fundingGoal && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Goal:</span>
                                    <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--success)' }}>${Number(s.fundingGoal).toLocaleString()}</span>
                                </div>
                            )}
                            {s.founder && (
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                    Founded by: <strong style={{ color: 'var(--text-secondary)' }}>{s.founder.name || s.founder.email}</strong>
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                                {user?.role === 'INVESTOR' && (
                                    <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => setInvestTarget(s)}>
                                        💰 Express Interest
                                    </button>
                                )}
                                {user?.role === 'RESEARCHER' && (
                                    <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => setResearchTarget(s)}>
                                        🔬 Apply to Join
                                    </button>
                                )}
                                {s.founder && (
                                    <button className="btn btn-secondary btn-sm" onClick={() => setChatTarget({ id: s.founder.id || s.userId, name: s.founder.name, email: s.founder.email })}>
                                        💬 Chat
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
