import React, { useEffect, useState } from 'react';
import { projectsApi, startupsApi, messagesApi, patentsApi, feedbackApi } from '../api';
import { useAuth } from '../context/AuthContext';

function FeedbackModal({ target, onClose, currentUserId, type = 'RESEARCHER' }) {
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
                    <h2 className="modal-title" style={{ margin: 0 }}>⭐ Researcher Reviews</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                
                <div style={{ padding: '24px 24px 0' }}>
                    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--accent-glow)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>
                            {(target.name || '?').charAt(0)}
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{target.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Scientific Partnership History</div>
                        </div>
                    </div>

                    <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: 8, marginBottom: 20 }}>
                        {loading ? <div className="spinner" style={{ margin: '20px auto' }} /> : reviews.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 0', border: '1px dashed var(--border)', borderRadius: 12 }}>
                                <div style={{ fontSize: 32, marginBottom: 10 }}>🔬</div>
                                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No feedback yet. Help others by sharing your collaboration experience!</p>
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
                            <h4 style={{ fontSize: 14, fontWeight: 700 }}>{myReview.isNew ? 'Leave Feedback' : 'Your Review'}</h4>
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
                                    placeholder="Describe your scientific partnership experience..." 
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

function ChatQuickModal({ targetUser, onClose, currentUserId, type = 'general', startupName = '' }) {
    const [msg, setMsg] = useState(type === 'collaboration' 
        ? `Hello! As a researcher, I'm interested in collaborating on ${startupName}. I believe my technical background can help validate your core technology.`
        : '');
    const [sent, setSent] = useState(false);
    const handleSend = async () => {
        if (!msg.trim()) return;
        try {
            await messagesApi.send({ 
                receiverId: targetUser.id, 
                content: `[${type.toUpperCase()}] ${msg}` 
            });
            setSent(true);
        } catch (e) { console.error(e); }
    };
    if (sent) return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box" style={{ textAlign: 'center', padding: '40px 32px' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Proposal Sent!</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>The startup will review your scientific partnership proposal.</p>
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={onClose}>Close</button>
            </div>
        </div>
    );
    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box">
                <div className="modal-header">
                    <h2 className="modal-title">{type === 'collaboration' ? '🔬 Propose Scientific Partnership' : '📧 Contact Team'}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                {type === 'collaboration' && (
                    <div style={{ background: 'var(--surface)', padding: '10px 14px', borderRadius: 8, fontSize: 12, border: '1px solid var(--border)', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span style={{ fontSize: 18 }}>⏳</span>
                        <span style={{ color: 'var(--text-secondary)' }}>Note: Approved scientific partnerships are active for <strong>30 days</strong>.</span>
                    </div>
                )}
                <div className="form-group">
                    <label className="form-label">{type === 'collaboration' ? 'Your Scientific Proposal' : 'Your Message'}</label>
                    <textarea className="form-textarea" rows={6} value={msg} onChange={e => setMsg(e.target.value)}
                        placeholder={type === 'collaboration' ? "Explain how your research expertise can benefit this startup's technical foundation..." : "Introduce yourself..."} />
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSend} disabled={!msg.trim()}>
                        {type === 'collaboration' ? 'Send Proposal' : 'Send Message'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ProjectModal({ project, onClose, onSave, researcherId }) {
    const [form, setForm] = useState(project || { title: '', description: '', fundingAmount: '', domain: '', institution: '', status: 'Pending', researcherId });
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(form);
            onClose();
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };
    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box">
                <div className="modal-header">
                    <h2 className="modal-title">{project?.id ? '✏️ Edit Project' : '🔬 New Research Registration'}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Research Title</label>
                        <input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Quantum Computing Architectures" required />
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Domain</label>
                            <input className="form-input" value={form.domain || ''} onChange={e => setForm({...form, domain: e.target.value})} placeholder="e.g. Biotechnology" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Institution / Lab</label>
                            <input className="form-input" value={form.institution || ''} onChange={e => setForm({...form, institution: e.target.value})} placeholder="e.g. MIT CSail" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Technical Abstract</label>
                        <textarea className="form-textarea" rows={5} value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Research Grant ($)</label>
                            <input type="number" className="form-input" value={form.fundingAmount || ''} onChange={e => setForm({...form, fundingAmount: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Stage</label>
                            <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                                <option>Pending</option>
                                <option>Ongoing</option>
                                <option>Completed</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Register Project'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function PatentModal({ projectId, onClose, onSave }) {
    const [form, setForm] = useState({ title: '', applicationNumber: '', status: 'Pending', projectId });
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(form);
            onClose();
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };
    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box">
                <div className="modal-header">
                    <h2 className="modal-title">📜 Register New Patent</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Patent Title</label>
                        <input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Application Number</label>
                        <input className="form-input" value={form.applicationNumber} onChange={e => setForm({...form, applicationNumber: e.target.value})} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Status</label>
                        <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                            <option>Pending</option>
                            <option>Published</option>
                            <option>Granted</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>Register Patent</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ResearchPage() {
    const { user } = useAuth();
    const [startups, setStartups] = useState([]);
    const [projects, setProjects] = useState([]);
    const [myProjects, setMyProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('my-projects');
    const [search, setSearch] = useState('');
    const [contactTarget, setContactTarget] = useState(null);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [showPatentModal, setShowPatentModal] = useState(false);
    const [activeProjectId, setActiveProjectId] = useState(null);
    const [feedbackTarget, setFeedbackTarget] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [s, p, myP] = await Promise.all([
                startupsApi.getAll().catch(() => []),
                projectsApi.getAll().catch(() => []),
                projectsApi.getByResearcher(user?.id).catch(() => []),
            ]);
            setStartups(s);
            setProjects(p);
            setMyProjects(myP);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleSaveProject = async (form) => {
        if (form.id) await projectsApi.update(form.id, form);
        else await projectsApi.create(form);
        fetchData();
    };

    const handleDeleteProject = async (id) => {
        if (!window.confirm('Delete this project?')) return;
        await projectsApi.delete(id);
        fetchData();
    };

    const handleSavePatent = async (form) => {
        await patentsApi.create(form);
        fetchData();
    };

    const handleDeletePatent = async (id) => {
        if (!window.confirm('Delete this patent?')) return;
        await patentsApi.delete(id);
        fetchData();
    };

    const filteredStartups = startups.filter(s =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.description?.toLowerCase().includes(search.toLowerCase())
    );

    const filteredProjects = projects.filter(p =>
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase())
    );

    const filteredMyProjects = myProjects.filter(p =>
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase())
    );

    const stageColors = { IDEA: '#6366f1', MVP: '#06b6d4', GROWTH: '#10b981', SCALING: '#f59e0b' };
    const statusColors = { Ongoing: '#6366f1', Completed: '#10b981', Pending: '#f59e0b', Published: '#10b981', Granted: '#8b5cf6' };

    return (
        <div className="page-container">
            {contactTarget && <ChatQuickModal {...contactTarget} onClose={() => setContactTarget(null)} currentUserId={user?.id} />}
            {showProjectModal && <ProjectModal project={selectedProject} onClose={() => {setShowProjectModal(false); setSelectedProject(null);}} onSave={handleSaveProject} researcherId={user?.id} />}
            {showPatentModal && <PatentModal projectId={activeProjectId} onClose={() => setShowPatentModal(false)} onSave={handleSavePatent} />}
            {feedbackTarget && <FeedbackModal target={feedbackTarget} onClose={() => setFeedbackTarget(null)} currentUserId={user?.id} />}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                    <h1 className="topbar-title">🧬 Research & Innovation Hub</h1>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Manage scientific repositories, secure IP, and provide technical validation to startups.</p>
                </div>
                {user?.role === 'RESEARCHER' && (
                    <button className="btn btn-primary" onClick={() => { setSelectedProject(null); setShowProjectModal(true); }}>+ Register Research</button>
                )}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <button className={`btn btn-sm ${tab === 'my-projects' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('my-projects')}>📁 My Research</button>
                <button className={`btn btn-sm ${tab === 'ideas' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('ideas')}>🚀 Startup Bridge</button>
                <button className={`btn btn-sm ${tab === 'projects' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('projects')}>🌍 Global Network</button>
            </div>

            <input className="form-input" style={{ maxWidth: 320, marginBottom: 20 }} placeholder="🔍 Search keywords..." value={search} onChange={e => setSearch(e.target.value)} />

            {loading ? (
                <div className="loading-screen"><div className="spinner" /><p>Accessing scientific data...</p></div>
            ) : tab === 'my-projects' ? (
                filteredMyProjects.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🧬</div>
                        <h3>No projects registered</h3>
                        <p>Begin by documenting your research milestones and protecting your intellectual property.</p>
                        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowProjectModal(true)}>+ Register First Project</button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {filteredMyProjects.map(p => (
                            <div key={p.id} className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                                            <h3 style={{ fontSize: 18, fontWeight: 700 }}>{p.title}</h3>
                                            <span className="badge" style={{ background: (statusColors[p.status] || '#6366f1') + '22', color: statusColors[p.status], border: `1px solid ${(statusColors[p.status] || '#6366f1')}44` }}>{p.status}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                                            {p.domain && <span className="badge badge-purple">{p.domain}</span>}
                                            {p.institution && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>🏛 {p.institution}</span>}
                                        </div>
                                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>{p.description}</p>
                                        {p.fundingAmount && (
                                            <div style={{ fontSize: 13 }}>
                                                <span style={{ color: 'var(--text-muted)' }}>RESEARCH GRANT: </span>
                                                <span style={{ color: 'var(--success)', fontWeight: 700 }}>${Number(p.fundingAmount).toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedProject(p); setShowProjectModal(true); }}>✏️ Edit</button>
                                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteProject(p.id)}>🗑</button>
                                    </div>
                                </div>

                                {/* Patents Section */}
                                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <h4 style={{ fontSize: 14, fontWeight: 700 }}>📜 Intellectual Property ({p.patents?.length || 0})</h4>
                                        <button className="btn btn-sm btn-secondary" onClick={() => { setActiveProjectId(p.id); setShowPatentModal(true); }}>+ Record Patent</button>
                                    </div>
                                    {p.patents && p.patents.length > 0 ? (
                                        <div className="table-wrap">
                                            <table>
                                                <thead><tr><th>Patent Title</th><th>Application ID</th><th>Status</th><th>Actions</th></tr></thead>
                                                <tbody>
                                                    {p.patents.map(pat => (
                                                        <tr key={pat.id}>
                                                            <td style={{ fontWeight: 600 }}>{pat.title}</td>
                                                            <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{pat.applicationNumber}</td>
                                                            <td><span className="badge" style={{ background: (statusColors[pat.status] || '#6366f1') + '22', color: statusColors[pat.status] }}>{pat.status}</span></td>
                                                            <td><button className="btn btn-danger btn-sm" onClick={() => handleDeletePatent(pat.id)}>🗑</button></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No registered patents for this research.</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : tab === 'ideas' ? (
                // This tab is where the "too similar" issue was most visible
                filteredStartups.length === 0 ? (
                    <div className="empty-state"><div className="empty-state-icon">🚀</div><h3>No active startups for bridge</h3></div>
                ) : (
                    <div className="grid-auto">
                        {filteredStartups.map(s => (
                            <div key={s.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div>
                                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{s.name}</h3>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <span className="badge badge-purple">{s.stage}阶段</span>
                                        {(s.industry || s.sector) && <span className="badge badge-cyan">{s.industry || s.sector}</span>}
                                    </div>
                                </div>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{s.description?.slice(0, 150)}...</p>
                                {s.founder && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Founder: {s.founder.name}</div>}
                                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                                    {s.founder && s.founder.id !== user?.id && (
                                        <button className="btn btn-primary btn-sm" style={{ flex: 1 }} 
                                            onClick={() => setContactTarget({ 
                                                targetUser: { id: s.founder.id || s.userId, name: s.founder.name || s.founder.email },
                                                type: 'collaboration',
                                                startupName: s.name
                                            })}>
                                            🔬 Propose Scientific Partnership
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                filteredProjects.length === 0 ? (
                    <div className="empty-state"><div className="empty-state-icon">🔬</div><h3>No global research found</h3></div>
                ) : (
                    <div className="grid-auto">
                        {filteredProjects.map(p => (
                            <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                                {/* Content Area */}
                                <div style={{ padding: '20px 20px 16px', flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            <span className="badge" style={{ background: (statusColors[p.status] || '#6366f1') + '15', color: statusColors[p.status] || '#6366f1', border: `1px solid ${(statusColors[p.status] || '#6366f1')}30` }}>
                                                {p.status}
                                            </span>
                                            {p.domain && <span className="badge badge-purple" style={{ fontSize: 10 }}>{p.domain}</span>}
                                        </div>
                                    </div>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, lineHeight: 1.4 }}>{p.title}</h3>
                                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {p.description}
                                    </p>
                                </div>

                                {/* Footer Info Area */}
                                <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-glow)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, border: '1px solid var(--border-accent)' }}>
                                                {(p.researcher?.name || 'R').charAt(0)}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{p.researcher?.name || p.researcher?.email}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.institution || 'Independent Research'}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn btn-secondary btn-sm" style={{ padding: '6px 10px' }} title="View Feedback" onClick={() => setFeedbackTarget({ id: p.researcher?.id || p.userId, name: p.researcher?.name || p.researcher?.email })}>
                                                ⭐
                                            </button>
                                            <button className="btn btn-primary btn-sm" onClick={() => setContactTarget({ targetUser: { id: p.researcher?.id || p.userId, name: p.researcher?.name || p.researcher?.email }, type: 'collaboration', startupName: 'your project' })}>
                                                Connect
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    );
}
