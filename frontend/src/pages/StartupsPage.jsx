import React, { useEffect, useState } from 'react';
import { startupsApi, fundingAppApi, usersApi } from '../api';
import { useAuth } from '../context/AuthContext';

const STAGES = ['IDEA', 'MVP', 'GROWTH', 'SCALING'];
const INDUSTRIES = ['Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce', 'Sustainability', 'AI/ML', 'Other'];

function StartupModal({ startup, onClose, onSave, currentUserId }) {
    const [form, setForm] = useState(startup || { name: '', description: '', industry: 'Technology', stage: 'IDEA', fundingGoal: '', userId: currentUserId || '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            await onSave(form);
            onClose();
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box">
                <div className="modal-header">
                    <h2 className="modal-title">{startup?.id ? '✏️ Edit Startup' : '🚀 New Startup'}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                {error && <div className="alert alert-error">⚠ {error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Startup Name</label>
                        <input name="name" className="form-input" value={form.name} onChange={handleChange} placeholder="e.g. TechVision AI" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea name="description" className="form-textarea" value={form.description} onChange={handleChange} placeholder="Describe your startup..." required />
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
                            {loading ? 'Saving...' : startup?.id ? 'Update' : 'Create Startup'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function StartupsPage() {
    const { user } = useAuth();
    const [startups, setStartups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState('');
    const [filterIndustry, setFilterIndustry] = useState('');

    const fetchStartups = async () => {
        setLoading(true);
        try {
            let data = [];
            if (user?.role === 'ADMIN') {
                data = await startupsApi.getAll().catch(() => []);
            } else if (user?.id) {
                data = await usersApi.getStartups(user.id).catch(() => []);
            }
            setStartups(data);
        }
        catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchStartups(); }, []);

    const handleSave = async (form) => {
        if (form.id) await startupsApi.update(form.id, form);
        else await startupsApi.create(form);
        fetchStartups();
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this startup?')) return;
        await startupsApi.delete(id);
        fetchStartups();
    };

    const stageColors = { IDEA: 'badge-amber', MVP: 'badge-cyan', GROWTH: 'badge-green', SCALING: 'badge-violet' };

    const filtered = startups.filter(s => {
        const query = search.toLowerCase();
        const matchesSearch = (s.name?.toLowerCase() || '').includes(query);
        const matchesIndustry = filterIndustry ? s.industry === filterIndustry : true;
        return matchesSearch && matchesIndustry;
    });

    return (
        <div className="page-container">
            {showModal && (
                <StartupModal
                    startup={selected}
                    onClose={() => { setShowModal(false); setSelected(null); }}
                    onSave={handleSave}
                    currentUserId={user?.id}
                />
            )}

            <div className="topbar" style={{ position: 'static', background: 'transparent', border: 'none', padding: '0 0 24px 0' }}>
                <div>
                    <h1 className="topbar-title">🚀 Startups</h1>
                    <p className="topbar-sub">Browse and manage all startups in the ecosystem</p>
                </div>
                {user?.role !== 'ADMIN' && (
                    <button id="new-startup-btn" className="btn btn-primary" onClick={() => { setSelected(null); setShowModal(true); }}>
                        + New Startup
                    </button>
                )}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <input
                    className="form-input"
                    style={{ maxWidth: 280 }}
                    placeholder="🔍 Search startups..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select className="form-select" style={{ maxWidth: 180 }} value={filterIndustry} onChange={(e) => setFilterIndustry(e.target.value)}>
                    <option value="">All Industries</option>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13 }}>
                    {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                </div>
            </div>

            {loading ? (
                <div className="loading-screen"><div className="spinner" /><p>Loading startups...</p></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🚀</div>
                    <h3>No startups found</h3>
                    <p>Try adjusting your filters or create a new startup</p>
                </div>
            ) : (
                <div className="grid-auto">
                    {filtered.map((s) => (
                        <div key={s.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '24px 20px 16px', flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <span className={`badge ${stageColors[s.stage] || 'badge-purple'}`} style={{ fontSize: 10 }}>{s.stage || 'IDEA'}</span>
                                        {s.industry && <span className="badge badge-cyan" style={{ fontSize: 10 }}>{s.industry}</span>}
                                    </div>
                                    <div style={{ fontSize: 24 }}>🚀</div>
                                </div>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{s.name}</h3>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {s.description}
                                </p>
                                
                                {s.fundingGoal && (
                                    <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 10 }}>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Funding Goal</div>
                                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--success)' }}>
                                            ${Number(s.fundingGoal).toLocaleString()}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                                {user?.role !== 'ADMIN' && s.founder?.id === user?.id && (
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => { setSelected(s); setShowModal(true); }}
                                        style={{ flex: 1 }}
                                    >
                                        ✏️ Edit Startup
                                    </button>
                                )}
                                {user?.role === 'ADMIN' && (
                                    <button className="btn btn-danger btn-sm" style={{ flexShrink: 0 }} onClick={() => handleDelete(s.id)}>🗑 Delete</button>
                                )}
                                <button className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                                    View Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
