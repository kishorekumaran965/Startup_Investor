import React, { useEffect, useState } from 'react';
import { startupsApi, fundingAppApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const STAGES = ['IDEA', 'MVP', 'GROWTH', 'SCALING'];
const INDUSTRIES = ['Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce', 'Sustainability', 'AI/ML', 'Other'];

function IdeaModal({ idea, onClose, onSave, userId }) {
    const [form, setForm] = useState(idea || { name: '', description: '', industry: 'Technology', stage: 'IDEA', fundingGoal: '', userId: userId });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            await onSave({ ...form, userId });
            onClose();
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };
    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box">
                <div className="modal-header">
                    <h2 className="modal-title">{idea?.id ? '✏️ Edit Idea' : '💡 New Idea'}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                {error && <div className="alert alert-error">⚠ {error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Idea Name</label>
                        <input name="name" className="form-input" value={form.name} onChange={handleChange} placeholder="e.g. AI Healthcare Assistant" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description (Add any details, links, or bullet points)</label>
                        <textarea name="description" className="form-textarea" rows={6} value={form.description} onChange={handleChange} placeholder="Describe your idea in detail. You can include links to pitch decks, features, etc..." required />
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Industry</label>
                            <select name="industry" className="form-select" value={form.industry} onChange={handleChange}>
                                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Stage</label>
                            <select name="stage" className="form-select" value={form.stage} onChange={handleChange}>
                                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Funding Goal ($)</label>
                        <input name="fundingGoal" type="number" className="form-input" value={form.fundingGoal} onChange={handleChange} placeholder="500000" />
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : idea?.id ? 'Update' : 'Publish Idea'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function MyIdeasPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [ideas, setIdeas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [interestedMap, setInterestedMap] = useState({});
    const [expandedId, setExpandedId] = useState(null);

    const fetchIdeas = async () => {
        setLoading(true);
        try {
            const all = await startupsApi.getAll();
            const mine = all.filter(s => s.userId === user?.id || s.founder?.id === user?.id);
            setIdeas(mine);
            // Load interested members (funding applications) for each startup
            const map = {};
            for (const idea of mine) {
                try {
                    const apps = await fundingAppApi.getByStartup(idea.id);
                    map[idea.id] = apps || [];
                } catch { map[idea.id] = []; }
            }
            setInterestedMap(map);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchIdeas(); }, [user]);

    const handleSave = async (form) => {
        if (form.id) await startupsApi.update(form.id, form);
        else await startupsApi.create(form);
        fetchIdeas();
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this idea?')) return;
        await startupsApi.delete(id);
        fetchIdeas();
    };

    const stageColors = { IDEA: '#6366f1', MVP: '#06b6d4', GROWTH: '#10b981', SCALING: '#f59e0b' };

    return (
        <div className="page-container">
            {showModal && <IdeaModal idea={selected} onClose={() => { setShowModal(false); setSelected(null); }} onSave={handleSave} userId={user?.id} />}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                    <h1 className="topbar-title">💡 My Startup Ideas</h1>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Create and manage your startup ideas. Investors & researchers can discover and express interest.</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-secondary" onClick={() => navigate('/notifications')}>🔔 View Notifications</button>
                    <button className="btn btn-primary" onClick={() => { setSelected(null); setShowModal(true); }}>+ New Idea</button>
                </div>
            </div>

            {loading ? (
                <div className="loading-screen"><div className="spinner" /><p>Loading ideas...</p></div>
            ) : ideas.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">💡</div>
                    <h3>No ideas yet</h3>
                    <p>Publish your first startup idea to attract investors and researchers</p>
                    <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>+ Create First Idea</button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {ideas.map(idea => {
                        const interested = interestedMap[idea.id] || [];
                        const isExpanded = expandedId === idea.id;
                        return (
                            <div key={idea.id} className="card" style={{ transition: 'var(--transition-fast)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                                            <h3 style={{ fontSize: 18, fontWeight: 700 }}>{idea.name}</h3>
                                            <span className="badge" style={{ background: stageColors[idea.stage] + '22', color: stageColors[idea.stage], border: `1px solid ${stageColors[idea.stage]}44` }}>{idea.stage}</span>
                                            <span className="badge badge-purple">{idea.industry || idea.sector}</span>
                                        </div>
                                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>{idea.description}</p>
                                        {idea.fundingGoal && (
                                            <div style={{ fontSize: 13, marginBottom: 8 }}>
                                                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>FUNDING GOAL: </span>
                                                <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: 16 }}>${Number(idea.fundingGoal).toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                        <button className="btn btn-secondary btn-sm" onClick={() => { setSelected(idea); setShowModal(true); }}>✏️ Edit</button>
                                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(idea.id)}>🗑</button>
                                    </div>
                                </div>

                                {/* Interested Members */}
                                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12 }}>
                                    <button className="btn btn-secondary btn-sm" onClick={() => setExpandedId(isExpanded ? null : idea.id)}>
                                        👥 {interested.length} Interested {interested.length === 1 ? 'Member' : 'Members'} {isExpanded ? '▲' : '▼'}
                                    </button>
                                    {isExpanded && (
                                        <div style={{ marginTop: 12 }}>
                                            {interested.length === 0 ? (
                                                <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No one has expressed interest yet. Share your idea to attract investors!</p>
                                            ) : (
                                                <div className="table-wrap">
                                                    <table>
                                                        <thead>
                                                            <tr><th>Investor</th><th>Amount</th><th>Message</th><th>Status</th><th>Date</th></tr>
                                                        </thead>
                                                        <tbody>
                                                            {interested.map(app => (
                                                                <tr key={app.id}>
                                                                    <td style={{ fontWeight: 600 }}>{app.investorName || `User #${app.investorId}`}</td>
                                                                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>${Number(app.amount).toLocaleString()}</td>
                                                                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{app.message || '—'}</td>
                                                                    <td>
                                                                        <span className={`badge ${app.status === 'APPROVED' ? 'badge-green' : app.status === 'REJECTED' ? 'badge-red' : 'badge-amber'}`}>
                                                                            {app.status}
                                                                        </span>
                                                                    </td>
                                                                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{app.applicationDate}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
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
