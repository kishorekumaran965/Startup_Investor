import React, { useEffect, useState } from 'react';
import { projectsApi, startupsApi, messagesApi, patentsApi } from '../api';
import { useAuth } from '../context/AuthContext';

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
                            <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <h3 style={{ fontSize: 16, fontWeight: 700 }}>{p.title}</h3>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <span className="badge" style={{ background: (statusColors[p.status] || '#6366f1') + '22', color: statusColors[p.status] }}>{p.status}</span>
                                    {p.domain && <span className="badge badge-purple">{p.domain}</span>}
                                </div>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{p.description?.slice(0, 150)}...</p>
                                <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 12 }}>
                                    <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>PI: {p.researcher?.name || p.researcher?.email}</div>
                                    <div style={{ color: 'var(--text-muted)' }}>{p.institution || 'Independent Research'}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    );
}
