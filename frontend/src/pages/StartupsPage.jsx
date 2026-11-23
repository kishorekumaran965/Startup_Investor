import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startupsApi, fundingAppApi, usersApi } from '../api';
import { useAuth } from '../context/AuthContext';
import CapTableModal from '../components/CapTableModal';

const STAGES = ['IDEA', 'MVP', 'GROWTH', 'SCALING'];
const INDUSTRIES = ['Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce', 'Sustainability', 'AI/ML', 'Other'];

function StartupModal({ startup, onClose, onSave, currentUserId }) {
    const [form, setForm] = useState(startup || { 
        name: '', description: '', industry: 'Technology', stage: 'IDEA', fundingGoal: '', userId: currentUserId || '',
        annualRevenue: '', monthlyRevenue: '', annualRevenueGrowth: '', netProfitLoss: '', monthlyExpenses: '',
        cashBalance: '', monthlyBurnRate: '', runwayMonths: '12', totalFundingRaised: '', companyValuation: '',
        debt: '', cac: '', ltv: '', breakEvenStatus: 'Pre-Breakeven'
    });
    const [showFinancials, setShowFinancials] = useState(Boolean(startup?.annualRevenue || startup?.companyValuation));
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
            <div className="modal-box" style={{ maxWidth: 680, maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="modal-header">
                    <h2 className="modal-title">{startup?.id ? '✏️ Edit Startup' : '🚀 New Startup'}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                {error && <div className="alert alert-error">⚠ {error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Startup Name</label>
                        <input name="name" className="form-input" value={form.name || ''} onChange={handleChange} placeholder="e.g. TechVision AI" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea name="description" className="form-textarea" value={form.description || ''} onChange={handleChange} placeholder="Describe your startup..." required />
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Industry</label>
                            <select name="industry" className="form-select" value={form.industry || 'Technology'} onChange={handleChange}>
                                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Stage</label>
                            <select name="stage" className="form-select" value={form.stage || 'IDEA'} onChange={handleChange}>
                                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Funding Goal ($)</label>
                            <input name="fundingGoal" type="number" className="form-input" value={form.fundingGoal || ''} onChange={handleChange} placeholder="500000" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Company Valuation ($)</label>
                            <input name="companyValuation" type="number" className="form-input" value={form.companyValuation || ''} onChange={handleChange} placeholder="5000000" />
                        </div>
                    </div>

                    {/* Financial Details Section for AI Investment Prediction */}
                    <div style={{ marginTop: 16, marginBottom: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <span style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-1)' }}>
                                📊 Financial Details & Unit Economics <span style={{ fontSize: '11px', color: 'var(--teal)', fontWeight: 'normal' }}>(Powers AI Investment Scoring)</span>
                            </span>
                            <button 
                                type="button" 
                                className="btn btn-ghost" 
                                style={{ padding: '4px 10px', fontSize: '12px' }}
                                onClick={() => setShowFinancials(!showFinancials)}
                            >
                                {showFinancials ? '▲ Hide Financials' : '▼ Add Financials'}
                            </button>
                        </div>

                        {showFinancials && (
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 10, border: '1px solid var(--border)' }}>
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Annual Revenue ($)</label>
                                        <input name="annualRevenue" type="number" className="form-input" value={form.annualRevenue || ''} onChange={handleChange} placeholder="e.g. 150000" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Annual Revenue Growth (%)</label>
                                        <input name="annualRevenueGrowth" type="number" className="form-input" value={form.annualRevenueGrowth || ''} onChange={handleChange} placeholder="e.g. 35" />
                                    </div>
                                </div>
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Net Profit / Loss ($)</label>
                                        <input name="netProfitLoss" type="number" className="form-input" value={form.netProfitLoss || ''} onChange={handleChange} placeholder="e.g. -20000" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Monthly Burn Rate ($)</label>
                                        <input name="monthlyBurnRate" type="number" className="form-input" value={form.monthlyBurnRate || ''} onChange={handleChange} placeholder="e.g. 8000" />
                                    </div>
                                </div>
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Cash Balance ($)</label>
                                        <input name="cashBalance" type="number" className="form-input" value={form.cashBalance || ''} onChange={handleChange} placeholder="e.g. 96000" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Runway (Months)</label>
                                        <input name="runwayMonths" type="number" className="form-input" value={form.runwayMonths || ''} onChange={handleChange} placeholder="12" />
                                    </div>
                                </div>
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Total Prior Funding Raised ($)</label>
                                        <input name="totalFundingRaised" type="number" className="form-input" value={form.totalFundingRaised || ''} onChange={handleChange} placeholder="e.g. 50000" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Debt / Liabilities ($)</label>
                                        <input name="debt" type="number" className="form-input" value={form.debt || ''} onChange={handleChange} placeholder="e.g. 0" />
                                    </div>
                                </div>
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label className="form-label">CAC - Customer Acquisition Cost ($)</label>
                                        <input name="cac" type="number" className="form-input" value={form.cac || ''} onChange={handleChange} placeholder="e.g. 150" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">LTV - Customer Lifetime Value ($)</label>
                                        <input name="ltv" type="number" className="form-input" value={form.ltv || ''} onChange={handleChange} placeholder="e.g. 600" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
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
    const navigate = useNavigate();
    const [startups, setStartups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showCapTable, setShowCapTable] = useState(false);
    const [search, setSearch] = useState('');
    const [filterIndustry, setFilterIndustry] = useState('');
    const [evaluatingId, setEvaluatingId] = useState(null);

    const handleEvaluateAi = async (id) => {
        setEvaluatingId(id);
        try {
            const res = await startupsApi.evaluateAi(id);
            const tier = res.investment_potential_tier || 'COMPLETED';
            const score = res.investment_potential_score != null ? res.investment_potential_score : Math.round((res.confidence_score || 0) * 100);
            const drivers = res.key_drivers?.length ? `\n\nKey Strengths:\n• ${res.key_drivers.join('\n• ')}` : '';
            const risks = res.risk_factors?.length ? `\n\nRisk Factors:\n• ${res.risk_factors.join('\n• ')}` : '';
            alert(`⚡ AI Due Diligence Result\n\nTier: ${tier}\nPotential Score: ${score}%\nModel: ${res.algorithm_used || 'Random_Forest'}${drivers}${risks}`);
            fetchStartups();
        } catch (err) {
            alert('Evaluation failed: ' + err.message);
        } finally {
            setEvaluatingId(null);
        }
    };

    const fetchStartups = async () => {
        setLoading(true);
        try {
            let data = [];
            if (user?.role === 'ADMIN' || user?.role === 'INVESTOR') {
                data = await startupsApi.getAll().catch(() => []);
            } else if (user?.id) {
                data = await usersApi.getStartups(user.id).catch(() => []);
            }
            setStartups(Array.isArray(data) ? data : []);
        }
        catch (e) { 
            console.error("Failed to load startups:", e); 
            setStartups([]);
        }
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

            {showCapTable && selected && (
                <CapTableModal
                    startup={selected}
                    onClose={() => { setShowCapTable(false); setSelected(null); }}
                />
            )}

            <div className="hero-section" style={{ 
                marginBottom: 32, 
                padding: '32px',
                borderRadius: 'var(--r-lg)',
                background: 'var(--navy-2)',
                border: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <h1 className="hero-title" style={{ fontSize: '28px', marginBottom: '4px' }}>🚀 Startups Ecosystem</h1>
                    <p className="hero-subtitle" style={{ fontSize: '14px', color: 'var(--text-3)' }}>Discover, track, and manage high-growth ventures.</p>
                </div>
                {user?.role !== 'ADMIN' && (
                    <button id="new-startup-btn" className="btn btn-primary" style={{ padding: '12px 24px' }} onClick={() => { setSelected(null); setShowModal(true); }}>
                        Launch New Startup
                    </button>
                )}
            </div>

            {/* Filters bar */}
            <div style={{ 
                display: 'flex', 
                gap: 12, 
                marginBottom: 32, 
                padding: '12px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                alignItems: 'center'
            }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <input
                        className="form-input"
                        style={{ paddingLeft: 40, border: 'none', background: 'transparent' }}
                        placeholder="Search startups..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div style={{ width: '1px', height: '24px', background: 'var(--border)' }}></div>
                <select 
                    className="form-select" 
                    style={{ maxWidth: 180, border: 'none', background: 'transparent' }} 
                    value={filterIndustry} 
                    onChange={(e) => setFilterIndustry(e.target.value)}
                >
                    <option value="">All Industries</option>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
                <div style={{ marginLeft: 'auto', paddingRight: 12, color: 'var(--text-3)', fontSize: '12px', fontWeight: 'bold' }}>
                    {filtered.length} VENTURES FOUND
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
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', 
                    gap: 24 
                }}>
                    {filtered.map((s) => (
                        <div key={s.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', position: 'relative' }}>
                            <div style={{ padding: '32px 28px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                    <div style={{ 
                                        width: '48px', 
                                        height: '48px', 
                                        borderRadius: '12px', 
                                        background: 'var(--violet-dim)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        fontSize: '24px' 
                                    }}>🚀</div>
                                    <span className={`badge ${stageColors[s.stage] || 'badge-purple'}`} style={{ fontSize: '10px', padding: '4px 10px' }}>{s.stage || 'IDEA'}</span>
                                </div>
                                
                                <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px', color: 'var(--text)' }}>{s.name}</h3>
                                <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '12px', color: 'var(--violet)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.industry}</span>
                                    {s.investmentPotentialTier && (
                                        <span className={`badge ${
                                            s.investmentPotentialTier === 'HIGH_POTENTIAL' ? 'badge-green' :
                                            s.investmentPotentialTier === 'MODERATE_POTENTIAL' ? 'badge-amber' : 'badge-danger'
                                        }`} style={{ fontSize: '11px', padding: '3px 8px' }}>
                                            ⚡ {s.investmentPotentialTier.replace('_', ' ')}
                                            {s.investmentPotentialScore != null && ` (${Math.round(s.investmentPotentialScore)}%)`}
                                        </span>
                                    )}
                                </div>
                                <p style={{ fontSize: '14px', color: 'var(--text-3)', lineHeight: '1.6', marginBottom: 16, minHeight: '66px' }}>
                                    {s.description}
                                </p>

                                {(s.annualRevenue > 0 || s.companyValuation > 0 || s.runwayMonths != null) && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                                        {s.annualRevenue > 0 && (
                                            <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: 6, color: 'var(--text-2)' }}>
                                                Rev: ${Number(s.annualRevenue).toLocaleString()}
                                            </span>
                                        )}
                                        {s.companyValuation > 0 && (
                                            <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: 6, color: 'var(--text-2)' }}>
                                                Val: ${Number(s.companyValuation).toLocaleString()}
                                            </span>
                                        )}
                                        {s.runwayMonths != null && (
                                            <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: 6, color: 'var(--text-2)' }}>
                                                Runway: {s.runwayMonths} mo
                                            </span>
                                        )}
                                    </div>
                                )}
                                
                                {s.fundingGoal && (
                                    <div style={{ 
                                        padding: '16px', 
                                        background: 'rgba(255,255,255,0.03)', 
                                        borderRadius: '12px', 
                                        border: '1px solid var(--border)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <span style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 'bold' }}>FUNDING GOAL</span>
                                        <span style={{ fontSize: '18px', fontWeight: '900', color: 'var(--teal)' }}>${Number(s.fundingGoal).toLocaleString()}</span>
                                    </div>
                                )}
                            </div>

                            <div style={{ padding: '20px 28px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
                                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { setSelected(s); setShowCapTable(true); }}>Cap Table</button>
                                <button 
                                    className="btn btn-ghost" 
                                    style={{ border: '1px solid var(--border)', padding: '8px 12px' }}
                                    onClick={() => navigate('/timeline')}
                                >
                                    ⏱️ Timeline
                                </button>
                                <button 
                                    className="btn btn-secondary" 
                                    style={{ padding: '8px 14px', fontSize: '13px', whiteSpace: 'nowrap' }} 
                                    disabled={evaluatingId === s.id}
                                    onClick={() => handleEvaluateAi(s.id)}
                                >
                                    {evaluatingId === s.id ? 'Evaluating...' : '⚡ AI Due Diligence'}
                                </button>
                                {user?.role !== 'ADMIN' && s.founder?.id === user?.id && (
                                    <button
                                        className="btn btn-ghost"
                                        onClick={() => { setSelected(s); setShowModal(true); }}
                                    >Edit</button>
                                )}
                                {user?.role === 'ADMIN' && (
                                    <button className="btn btn-danger" onClick={() => handleDelete(s.id)}>Delete</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
