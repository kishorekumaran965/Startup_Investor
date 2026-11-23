import React, { useEffect, useState, useMemo } from 'react';
import { startupsApi, fundingAppApi, messagesApi, investorProfilesApi } from '../api';
import { useAuth } from '../context/AuthContext';
import StartupTimelineModal from '../components/StartupTimelineModal';
import StartupDetailsModal from '../components/StartupDetailsModal';

const INDUSTRIES = ['All', 'Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce', 'Sustainability', 'AI/ML', 'Other'];
const STAGES = ['All', 'IDEA', 'MVP', 'GROWTH', 'SCALING'];
const POTENTIAL_TIERS = ['All', 'HIGH_POTENTIAL', 'MODERATE_POTENTIAL', 'LOW_POTENTIAL'];
const FUNDING_RANGES = [
    { label: 'All Goals', min: 0, max: Infinity },
    { label: '< ₹25 Lakhs', min: 0, max: 2500000 },
    { label: '₹25L - ₹1 Crore', min: 2500000, max: 10000000 },
    { label: '> ₹1 Crore', min: 10000000, max: Infinity }
];
const SORT_OPTIONS = [
    { label: 'Newest Startups', value: 'newest' },
    { label: 'Highest AI Potential', value: 'potential' },
    { label: 'Lowest Funding Goal', value: 'goal_asc' },
    { label: 'Highest Valuation', value: 'val_desc' }
];

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
                        <label className="form-label">Investment Amount (₹ / $)</label>
                        <input name="amount" type="number" className="form-input" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="Enter proposed amount" required />
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

/* ─── Researcher Modal: Apply to Join ─── */
function ResearcherApplyModal({ startup, onClose }) {
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
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>Your research profile has been sent to the startup founder.</p>
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
                        <label className="form-label">Research Area</label>
                        <input name="researchArea" className="form-input" value={form.researchArea} onChange={handleChange} placeholder="Machine Learning, Biotech, etc." required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Relevant Experience</label>
                        <textarea name="experience" className="form-textarea" rows={3} value={form.experience} onChange={handleChange} placeholder="Describe relevant experience..." required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Why do you want to join this project?</label>
                        <textarea name="motivation" className="form-textarea" rows={3} value={form.motivation} onChange={handleChange} placeholder="Explain how your expertise helps..." required />
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

/* ─── Currency Formatter ─── */
const formatCurrency = (val) => {
    if (val == null || isNaN(val)) return '—';
    const num = Number(val);
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}k`;
    return `₹${num.toLocaleString('en-IN')}`;
};

/* ─── Main Explore Page ─── */
export default function ExplorePage() {
    const { user } = useAuth();
    const [startups, setStartups] = useState([]);
    const [matchingStartups, setMatchingStartups] = useState([]);
    const [viewMode, setViewMode] = useState('ALL'); // 'ALL' or 'MATCHED'
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState('');
    const [filterIndustry, setFilterIndustry] = useState('All');
    const [filterStage, setFilterStage] = useState('All');
    const [filterPotential, setFilterPotential] = useState('All');
    const [filterFundingIndex, setFilterFundingIndex] = useState(0);
    const [sortBy, setSortBy] = useState('newest');

    // Modals
    const [detailsTarget, setDetailsTarget] = useState(null);
    const [investTarget, setInvestTarget] = useState(null);
    const [researchTarget, setResearchTarget] = useState(null);
    const [chatTarget, setChatTarget] = useState(null);
    const [timelineTarget, setTimelineTarget] = useState(null);

    const fetchAllStartups = () => {
        setLoading(true);
        startupsApi.getAll()
            .then(data => {
                setStartups(Array.isArray(data) ? data : []);
            })
            .catch(err => {
                console.error("Failed to fetch startups:", err);
                setStartups([]);
            })
            .finally(() => setLoading(false));
    };

    const fetchMatchingStartups = () => {
        if (!user?.id || user?.role !== 'INVESTOR') return;
        investorProfilesApi.getMatchingStartups(user.id)
            .then(data => {
                setMatchingStartups(Array.isArray(data) ? data : []);
            })
            .catch(err => {
                console.error("Failed to fetch matching startups:", err);
                setMatchingStartups([]);
            });
    };

    useEffect(() => {
        fetchAllStartups();
        if (user?.role === 'INVESTOR') {
            fetchMatchingStartups();
        }
    }, [user?.id, user?.role]);

    // Active filters count
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (search.trim()) count++;
        if (filterIndustry !== 'All') count++;
        if (filterStage !== 'All') count++;
        if (filterPotential !== 'All') count++;
        if (filterFundingIndex !== 0) count++;
        if (sortBy !== 'newest') count++;
        return count;
    }, [search, filterIndustry, filterStage, filterPotential, filterFundingIndex, sortBy]);

    const handleClearFilters = () => {
        setSearch('');
        setFilterIndustry('All');
        setFilterStage('All');
        setFilterPotential('All');
        setFilterFundingIndex(0);
        setSortBy('newest');
    };

    const currentList = viewMode === 'MATCHED' ? matchingStartups : startups;

    const filtered = useMemo(() => {
        const query = (search || '').toLowerCase().trim();
        const selectedRange = FUNDING_RANGES[filterFundingIndex] || FUNDING_RANGES[0];

        return currentList
            .filter(s => {
                const name = (s.name || s.startupName || '').toLowerCase();
                const desc = (s.description || '').toLowerCase();
                const sector = (s.industry || s.sector || '').toLowerCase();

                // Search query
                if (query && !name.includes(query) && !desc.includes(query) && !sector.includes(query)) {
                    return false;
                }

                // Industry filter
                if (filterIndustry !== 'All') {
                    const fi = filterIndustry.toLowerCase();
                    const matchesInd = sector === fi ||
                        (fi === 'finance' && sector.includes('fin')) ||
                        (fi === 'technology' && (sector.includes('tech') || sector.includes('ai') || sector.includes('soft'))) ||
                        (fi === 'ai/ml' && (sector.includes('ai') || sector.includes('ml') || sector.includes('data'))) ||
                        sector.includes(fi);
                    if (!matchesInd) return false;
                }

                // Stage filter
                if (filterStage !== 'All') {
                    const fs = filterStage.toUpperCase();
                    const cs = (s.stage || '').toUpperCase();
                    const matchesSt = cs === fs ||
                        (fs === 'MVP' && (cs.includes('PROTO') || cs.includes('MVP'))) ||
                        (fs === 'IDEA' && cs.includes('IDEA')) ||
                        (fs === 'GROWTH' && cs.includes('GROW')) ||
                        (fs === 'SCALING' && cs.includes('SCALE'));
                    if (!matchesSt) return false;
                }

                // Investment Potential filter
                if (filterPotential !== 'All') {
                    const tier = (s.investmentPotentialTier || '').toUpperCase();
                    if (filterPotential === 'HIGH_POTENTIAL' && !tier.includes('HIGH')) return false;
                    if (filterPotential === 'MODERATE_POTENTIAL' && !tier.includes('MODERATE')) return false;
                    if (filterPotential === 'LOW_POTENTIAL' && !tier.includes('LOW')) return false;
                }

                // Funding Range filter
                const goal = Number(s.fundingGoal) || 0;
                if (goal < selectedRange.min || goal > selectedRange.max) {
                    return false;
                }

                return true;
            })
            .sort((a, b) => {
                if (sortBy === 'potential') {
                    const scoreA = a.investmentPotentialScore != null ? a.investmentPotentialScore : (a.investmentPotentialTier === 'HIGH_POTENTIAL' ? 0.9 : 0.5);
                    const scoreB = b.investmentPotentialScore != null ? b.investmentPotentialScore : (b.investmentPotentialTier === 'HIGH_POTENTIAL' ? 0.9 : 0.5);
                    return scoreB - scoreA;
                }
                if (sortBy === 'goal_asc') {
                    return (Number(a.fundingGoal) || 0) - (Number(b.fundingGoal) || 0);
                }
                if (sortBy === 'val_desc') {
                    return (Number(b.companyValuation) || 0) - (Number(a.companyValuation) || 0);
                }
                // newest default (by id descending or created)
                return (b.id || 0) - (a.id || 0);
            });
    }, [currentList, search, filterIndustry, filterStage, filterPotential, filterFundingIndex, sortBy]);

    const stageColors = {
        IDEA: { color: '#818cf8', bg: 'rgba(129, 140, 248, 0.12)', border: 'rgba(129, 140, 248, 0.25)' },
        MVP: { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.25)' },
        GROWTH: { color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)', border: 'rgba(52, 211, 153, 0.25)' },
        SCALING: { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)', border: 'rgba(251, 191, 36, 0.25)' }
    };

    return (
        <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '60px' }}>
            {/* Modals */}
            {detailsTarget && (
                <StartupDetailsModal
                    startup={detailsTarget}
                    onClose={() => setDetailsTarget(null)}
                    isInvestor={user?.role === 'INVESTOR'}
                    onExpressInterest={(s) => setInvestTarget(s)}
                    onViewTimeline={(s) => setTimelineTarget(s)}
                    onOpenChat={(s) => {
                        const f = s.founder || (s.founderName ? { name: s.founderName, id: s.founderId } : null);
                        if (f) setChatTarget({ id: f.id || s.userId, name: f.name, email: f.email });
                    }}
                />
            )}
            {investTarget && <InvestModal startup={investTarget} onClose={() => setInvestTarget(null)} userId={user?.id} />}
            {researchTarget && <ResearcherApplyModal startup={researchTarget} onClose={() => setResearchTarget(null)} />}
            {chatTarget && <ChatModal targetUser={chatTarget} onClose={() => setChatTarget(null)} currentUserId={user?.id} />}
            {timelineTarget && (
                <StartupTimelineModal
                    startup={timelineTarget}
                    onClose={() => setTimelineTarget(null)}
                    isInvestor={user?.role === 'INVESTOR'}
                    onExpressInterest={() => {
                        const tgt = timelineTarget;
                        setTimelineTarget(null);
                        setInvestTarget(tgt);
                    }}
                    onChat={() => {
                        const tgt = timelineTarget;
                        const f = tgt.founder || (tgt.founderName ? { name: tgt.founderName, id: tgt.founderId } : null);
                        if (f) {
                            setTimelineTarget(null);
                            setChatTarget({ id: f.id || tgt.userId, name: f.name, email: f.email });
                        }
                    }}
                />
            )}

            {/* Page Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                    marginBottom: '24px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid var(--border)'
                }}
            >
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                            Explore Startups
                        </h1>
                        <span
                            style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background: 'rgba(247, 37, 133, 0.15)',
                                color: 'var(--violet, #f72585)',
                                padding: '3px 10px',
                                borderRadius: '14px',
                                border: '1px solid rgba(247, 37, 133, 0.3)'
                            }}
                        >
                            VC Dashboard
                        </span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                        {user?.role === 'INVESTOR'
                            ? 'Discover verified ventures, evaluate predictive AI potential, and track funding milestones.'
                            : user?.role === 'RESEARCHER'
                            ? 'Connect with deep-tech ventures and apply your academic expertise.'
                            : 'Explore ecosystem startups and innovation milestones.'}
                    </p>
                </div>

                {/* View Switcher for Investors: All vs. AI Matched */}
                {user?.role === 'INVESTOR' && (
                    <div
                        style={{
                            display: 'flex',
                            background: 'rgba(20, 20, 28, 0.8)',
                            padding: '4px',
                            borderRadius: '10px',
                            border: '1px solid var(--border)'
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setViewMode('ALL')}
                            style={{
                                padding: '7px 16px',
                                borderRadius: '7px',
                                border: 'none',
                                background: viewMode === 'ALL' ? 'linear-gradient(135deg, var(--violet, #f72585), #7209b7)' : 'transparent',
                                color: viewMode === 'ALL' ? '#fff' : 'var(--text-muted)',
                                fontWeight: 600,
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            🌐 All Startups ({startups.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('MATCHED')}
                            style={{
                                padding: '7px 16px',
                                borderRadius: '7px',
                                border: 'none',
                                background: viewMode === 'MATCHED' ? 'linear-gradient(135deg, var(--violet, #f72585), #7209b7)' : 'transparent',
                                color: viewMode === 'MATCHED' ? '#fff' : 'var(--text-muted)',
                                fontWeight: 600,
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <span>🎯 AI Matched</span>
                            <span
                                style={{
                                    fontSize: '0.7rem',
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    padding: '1px 6px',
                                    borderRadius: '10px'
                                }}
                            >
                                {matchingStartups.length}
                            </span>
                        </button>
                    </div>
                )}
            </div>

            {/* Filter and Control Bar */}
            <div
                style={{
                    background: 'linear-gradient(145deg, rgba(20, 20, 30, 0.7), rgba(12, 12, 18, 0.7))',
                    border: '1px solid var(--border)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    marginBottom: '28px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
                }}
            >
                {/* Search row */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ flex: '1 1 280px', position: 'relative' }}>
                        <span
                            style={{
                                position: 'absolute',
                                left: '14px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-muted)',
                                fontSize: '0.9rem'
                            }}
                        >
                            🔍
                        </span>
                        <input
                            type="text"
                            placeholder="Search startups by name, industry, keywords..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 14px 10px 38px',
                                background: 'rgba(0, 0, 0, 0.4)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '0.88rem',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Sort by:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                style={{
                                    padding: '8px 12px',
                                    background: 'rgba(0, 0, 0, 0.4)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontSize: '0.82rem',
                                    cursor: 'pointer'
                                }}
                            >
                                {SORT_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value} style={{ background: '#12121c' }}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {activeFilterCount > 0 && (
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                style={{
                                    padding: '8px 14px',
                                    background: 'rgba(247, 37, 133, 0.12)',
                                    border: '1px solid rgba(247, 37, 133, 0.3)',
                                    borderRadius: '8px',
                                    color: 'var(--violet, #f72585)',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                ✕ Clear Filters ({activeFilterCount})
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter selects row */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                        gap: '12px',
                        paddingTop: '12px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                >
                    {/* Industry */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '5px' }}>
                            Industry
                        </label>
                        <select
                            value={filterIndustry}
                            onChange={(e) => setFilterIndustry(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                background: 'rgba(0, 0, 0, 0.3)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '0.82rem'
                            }}
                        >
                            {INDUSTRIES.map((ind) => (
                                <option key={ind} value={ind} style={{ background: '#12121c' }}>
                                    {ind}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Stage */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '5px' }}>
                            Stage
                        </label>
                        <select
                            value={filterStage}
                            onChange={(e) => setFilterStage(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                background: 'rgba(0, 0, 0, 0.3)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '0.82rem'
                            }}
                        >
                            {STAGES.map((st) => (
                                <option key={st} value={st} style={{ background: '#12121c' }}>
                                    {st === 'All' ? 'All Stages' : st}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* AI Potential */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '5px' }}>
                            AI Prediction
                        </label>
                        <select
                            value={filterPotential}
                            onChange={(e) => setFilterPotential(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                background: 'rgba(0, 0, 0, 0.3)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '0.82rem'
                            }}
                        >
                            <option value="All" style={{ background: '#12121c' }}>All Potential Tiers</option>
                            <option value="HIGH_POTENTIAL" style={{ background: '#12121c' }}>High Potential</option>
                            <option value="MODERATE_POTENTIAL" style={{ background: '#12121c' }}>Moderate Potential</option>
                            <option value="LOW_POTENTIAL" style={{ background: '#12121c' }}>Low Potential</option>
                        </select>
                    </div>

                    {/* Funding Requirement */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '5px' }}>
                            Funding Goal
                        </label>
                        <select
                            value={filterFundingIndex}
                            onChange={(e) => setFilterFundingIndex(Number(e.target.value))}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                background: 'rgba(0, 0, 0, 0.3)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '0.82rem'
                            }}
                        >
                            {FUNDING_RANGES.map((rng, idx) => (
                                <option key={rng.label} value={idx} style={{ background: '#12121c' }}>
                                    {rng.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Results count & status */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Showing <strong style={{ color: '#fff' }}>{filtered.length}</strong> active ventures
                </span>
            </div>

            {/* Content states */}
            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                            key={i}
                            style={{
                                height: '360px',
                                borderRadius: '16px',
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid var(--border)',
                                animation: 'pulse 1.5s infinite ease-in-out'
                            }}
                        />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div
                    style={{
                        padding: '60px 24px',
                        textAlign: 'center',
                        background: 'rgba(15, 15, 22, 0.5)',
                        border: '1px dashed var(--border)',
                        borderRadius: '16px'
                    }}
                >
                    <div style={{ fontSize: '42px', marginBottom: '14px' }}>🔍</div>
                    <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', color: '#fff' }}>No Startups Found</h3>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '440px', marginInline: 'auto' }}>
                        {viewMode === 'MATCHED'
                            ? 'No ventures currently match your specific investor preference profile. Try switching to "All Startups" or updating your portfolio criteria.'
                            : 'No ventures match your filter criteria. Try adjusting or resetting your filters to explore more opportunities.'}
                    </p>
                    <button
                        type="button"
                        onClick={handleClearFilters}
                        style={{
                            marginTop: '18px',
                            padding: '9px 20px',
                            background: 'var(--violet, #f72585)',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                        }}
                    >
                        Reset All Filters
                    </button>
                </div>
            ) : (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                        gap: '22px'
                    }}
                >
                    {filtered.map((s) => {
                        const sid = s.id || s.startupId;
                        const sname = s.name || s.startupName;
                        const ssector = s.industry || s.sector;
                        const sstage = s.stage || 'IDEA';
                        const sdesc = s.description;
                        const sgoal = s.fundingGoal;
                        const sval = s.companyValuation;
                        const sequity = s.availableEquity;
                        const srevenue = s.annualRevenue;
                        const stier = s.investmentPotentialTier;
                        const sscore = s.investmentPotentialScore;
                        const smatch = s.matchScore;
                        const sfounder = s.founder || (s.founderName ? { name: s.founderName, id: s.founderId } : null);

                        const stageStyle = stageColors[sstage] || stageColors.IDEA;

                        return (
                            <div
                                key={sid}
                                style={{
                                    background: 'linear-gradient(145deg, rgba(18, 18, 26, 0.85) 0%, rgba(12, 12, 18, 0.95) 100%)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '16px',
                                    padding: '22px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '14px',
                                    position: 'relative',
                                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.45)',
                                    transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.borderColor = 'rgba(247, 37, 133, 0.35)';
                                    e.currentTarget.style.boxShadow = '0 16px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(247, 37, 133, 0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = 'var(--border)';
                                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.45)';
                                }}
                            >
                                {/* Card Header */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div
                                            style={{
                                                width: '44px',
                                                height: '44px',
                                                borderRadius: '12px',
                                                background: 'linear-gradient(135deg, rgba(247, 37, 133, 0.18), rgba(76, 201, 240, 0.18))',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '22px',
                                                flexShrink: 0
                                            }}
                                        >
                                            🚀
                                        </div>
                                        <div>
                                            <h3
                                                onClick={() => setDetailsTarget(s)}
                                                style={{
                                                    margin: '0 0 4px',
                                                    fontSize: '1.15rem',
                                                    fontWeight: 700,
                                                    color: '#fff',
                                                    cursor: 'pointer',
                                                    letterSpacing: '-0.01em',
                                                    transition: 'color 0.2s'
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--violet, #f72585)')}
                                                onMouseLeave={(e) => (e.currentTarget.style.color = '#fff')}
                                                title="Click to view complete details"
                                            >
                                                {sname}
                                            </h3>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                Founder: <span style={{ color: '#e2e8f0' }}>{sfounder?.name || 'Venture Founder'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stage Badge */}
                                    <span
                                        style={{
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            padding: '3px 8px',
                                            borderRadius: '12px',
                                            color: stageStyle.color,
                                            backgroundColor: stageStyle.bg,
                                            border: `1px solid ${stageStyle.border}`,
                                            letterSpacing: '0.04em'
                                        }}
                                    >
                                        {sstage}
                                    </span>
                                </div>

                                {/* Badges Row: Sector & AI Prediction */}
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                    {ssector && (
                                        <span
                                            style={{
                                                fontSize: '0.72rem',
                                                padding: '2px 8px',
                                                borderRadius: '6px',
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                                color: 'var(--text-muted)'
                                            }}
                                        >
                                            {ssector}
                                        </span>
                                    )}

                                    {stier && (
                                        <span
                                            style={{
                                                fontSize: '0.72rem',
                                                fontWeight: 600,
                                                padding: '2px 8px',
                                                borderRadius: '6px',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '5px',
                                                background:
                                                    stier === 'HIGH_POTENTIAL' || stier === 'HIGH'
                                                        ? 'rgba(0, 245, 212, 0.1)'
                                                        : stier === 'MODERATE_POTENTIAL' || stier === 'MODERATE'
                                                        ? 'rgba(252, 163, 17, 0.1)'
                                                        : 'rgba(247, 37, 133, 0.1)',
                                                color:
                                                    stier === 'HIGH_POTENTIAL' || stier === 'HIGH'
                                                        ? 'var(--green, #00f5d4)'
                                                        : stier === 'MODERATE_POTENTIAL' || stier === 'MODERATE'
                                                        ? 'var(--amber, #fca311)'
                                                        : 'var(--red, #f72585)',
                                                border: `1px solid ${
                                                    stier === 'HIGH_POTENTIAL' || stier === 'HIGH'
                                                        ? 'rgba(0, 245, 212, 0.25)'
                                                        : stier === 'MODERATE_POTENTIAL' || stier === 'MODERATE'
                                                        ? 'rgba(252, 163, 17, 0.25)'
                                                        : 'rgba(247, 37, 133, 0.25)'
                                                }`
                                            }}
                                        >
                                            <span
                                                style={{
                                                    width: '5px',
                                                    height: '5px',
                                                    borderRadius: '50%',
                                                    backgroundColor: 'currentColor'
                                                }}
                                            />
                                            {stier.replace('_', ' ')}
                                            {sscore != null && ` (${(Number(sscore) > 1 ? Number(sscore) : Number(sscore) * 100).toFixed(0)}%)`}
                                        </span>
                                    )}

                                    {smatch != null && (
                                        <span
                                            style={{
                                                fontSize: '0.72rem',
                                                fontWeight: 600,
                                                padding: '2px 8px',
                                                borderRadius: '6px',
                                                background: 'rgba(114, 9, 183, 0.15)',
                                                border: '1px solid rgba(114, 9, 183, 0.3)',
                                                color: '#c77dff'
                                            }}
                                        >
                                            🎯 {smatch}% Match
                                        </span>
                                    )}
                                </div>

                                {/* Description */}
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: '0.84rem',
                                        lineHeight: 1.55,
                                        color: '#cbd5e1',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        minHeight: '38px'
                                    }}
                                >
                                    {sdesc || 'Innovative venture developing market-ready technology and sustainable solutions.'}
                                </p>

                                {/* Financial Matrix */}
                                <div
                                    style={{
                                        background: 'rgba(0, 0, 0, 0.35)',
                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                        borderRadius: '10px',
                                        padding: '10px 14px',
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(3, 1fr)',
                                        gap: '8px',
                                        marginTop: 'auto'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            Goal
                                        </div>
                                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--teal, #4cc9f0)', marginTop: '2px' }}>
                                            {formatCurrency(sgoal)}
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            Valuation
                                        </div>
                                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                                            {formatCurrency(sval)}
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            Equity
                                        </div>
                                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--violet, #f72585)', marginTop: '2px' }}>
                                            {sequity != null ? `${sequity}%` : '—'}
                                        </div>
                                    </div>
                                </div>

                                {srevenue != null && srevenue > 0 && (
                                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', paddingInline: '2px' }}>
                                        <span>Annual Revenue:</span>
                                        <span style={{ color: '#fff', fontWeight: 600 }}>{formatCurrency(srevenue)}</span>
                                    </div>
                                )}

                                {/* Action Buttons Grid */}
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: user?.role === 'INVESTOR' ? '1fr 1fr' : '1fr',
                                        gap: '8px',
                                        paddingTop: '6px'
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setDetailsTarget(s)}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            color: '#fff',
                                            fontSize: '0.78rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '5px'
                                        }}
                                    >
                                        🔍 View Details
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setTimelineTarget(s)}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            background: 'rgba(76, 201, 240, 0.08)',
                                            border: '1px solid rgba(76, 201, 240, 0.2)',
                                            color: 'var(--teal, #4cc9f0)',
                                            fontSize: '0.78rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '5px'
                                        }}
                                    >
                                        ⏱️ Timeline
                                    </button>

                                    {user?.role === 'INVESTOR' && (
                                        <button
                                            type="button"
                                            onClick={() => setInvestTarget({ id: sid, name: sname })}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '8px',
                                                background: 'linear-gradient(135deg, var(--violet, #f72585), #7209b7)',
                                                border: 'none',
                                                color: '#fff',
                                                fontSize: '0.78rem',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '5px',
                                                boxShadow: '0 4px 12px rgba(247, 37, 133, 0.25)'
                                            }}
                                        >
                                            💰 Express Interest
                                        </button>
                                    )}

                                    {user?.role === 'RESEARCHER' && (
                                        <button
                                            type="button"
                                            onClick={() => setResearchTarget({ id: sid, name: sname, founder: sfounder })}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '8px',
                                                background: 'linear-gradient(135deg, #00f5d4, #00bbf9)',
                                                border: 'none',
                                                color: '#050507',
                                                fontSize: '0.78rem',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '5px'
                                            }}
                                        >
                                            🔬 Apply to Join
                                        </button>
                                    )}

                                    {sfounder && (
                                        <button
                                            type="button"
                                            onClick={() => setChatTarget({ id: sfounder.id || s.userId, name: sfounder.name, email: sfounder.email })}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '8px',
                                                background: 'rgba(255, 255, 255, 0.03)',
                                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                                color: 'var(--text-muted)',
                                                fontSize: '0.78rem',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '5px'
                                            }}
                                        >
                                            💬 Chat
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
