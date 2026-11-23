import React, { useEffect, useState } from 'react';
import { startupsApi, fundingsApi, investmentsApi, fundingAppApi } from '../api';
import { useAuth } from '../context/AuthContext';

const STAGE_ORDER = ['IDEA', 'MVP', 'GROWTH', 'SCALING'];

function AddFundingModal({ startup, onClose, onAdded }) {
    const [form, setForm] = useState({
        amount: '',
        fundingSource: '',
        fundingType: 'SEED',
        status: 'APPROVED',
        fundingDate: new Date().toISOString().split('T')[0],
        startupId: startup.id
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await fundingsApi.create({
                ...form,
                amount: parseFloat(form.amount),
                startupId: startup.id
            });
            onAdded();
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to record funding event');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box" style={{ maxWidth: 520 }}>
                <div className="modal-header">
                    <h2 className="modal-title">📈 Record Investment Round / Goal</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                {error && <div className="alert alert-error">⚠ {error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Round / Milestone Title or Source</label>
                        <input 
                            name="fundingSource" 
                            className="form-input" 
                            placeholder="e.g. Angel Syndicate Lead / Pre-Seed Round" 
                            value={form.fundingSource} 
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Funding Type</label>
                            <select name="fundingType" className="form-select" value={form.fundingType} onChange={handleChange}>
                                <option value="SEED">Seed Round</option>
                                <option value="ANGEL">Angel Round</option>
                                <option value="GRANT">Government / Research Grant</option>
                                <option value="SERIES_A">Series A Round</option>
                                <option value="VC">Institutional Venture Capital</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Round Status</label>
                            <select name="status" className="form-select" value={form.status} onChange={handleChange}>
                                <option value="APPROVED">Closed / Completed</option>
                                <option value="PENDING">Active In-Progress</option>
                                <option value="PROJECTED">Projected Milestone Goal</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Amount ($)</label>
                            <input 
                                name="amount" 
                                type="number" 
                                className="form-input" 
                                placeholder="150000" 
                                value={form.amount} 
                                onChange={handleChange} 
                                required 
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Event / Milestone Date</label>
                            <input 
                                name="fundingDate" 
                                type="date" 
                                className="form-input" 
                                value={form.fundingDate} 
                                onChange={handleChange} 
                                required 
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Recording...' : 'Add to Timeline'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function StartupTimelinePage() {
    const { user } = useAuth();
    const [startups, setStartups] = useState([]);
    const [selectedStartupId, setSelectedStartupId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sortOrder, setSortOrder] = useState('ASC'); // 'ASC' = Oldest first (chronological progression), 'DESC' = Newest first
    const [showAddModal, setShowAddModal] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const all = await startupsApi.getAll().catch(() => []);
            const valid = Array.isArray(all) ? all : [];
            setStartups(valid);
            if (valid.length > 0 && !selectedStartupId) {
                // Default to user's startup if founder, else first in list
                const mine = valid.find(s => s.userId === user?.id || s.founder?.id === user?.id);
                setSelectedStartupId(mine ? mine.id : valid[0].id);
            }
        } catch (e) {
            console.error("Failed to load startups:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user?.id]);

    const activeStartup = startups.find(s => s.id === Number(selectedStartupId));

    // Construct the Unified Chronological Timeline
    const buildTimelineEvents = (startup) => {
        if (!startup) return [];
        const events = [];

        // 1. Initial Inception / Incorporation Event
        events.push({
            id: 'init-foundation',
            date: '2023-01-15', // Base inception date
            title: '🚀 Company Foundation & Ideation',
            type: 'FOUNDATION',
            category: 'MILESTONE',
            status: 'COMPLETED',
            amount: null,
            description: `Founded ${startup.name} in the ${startup.sector || 'Technology'} sector with initial founder equity allocation of ${startup.availableEquity || 100}%.`,
            badge: startup.stage || 'IDEA'
        });

        // 2. Existing Historical Fundings from DB
        if (startup.fundings && startup.fundings.length > 0) {
            startup.fundings.forEach(f => {
                events.push({
                    id: `funding-${f.id}`,
                    date: f.fundingDate || '2023-06-20',
                    title: `💼 ${f.fundingType ? f.fundingType.replace('_', ' ') : 'Seed'} Round: ${f.fundingSource || 'Angel Syndicate'}`,
                    type: f.fundingType || 'SEED',
                    category: 'FUNDING_CLOSED',
                    status: f.status === 'APPROVED' ? 'COMPLETED' : 'IN_PROGRESS',
                    amount: f.amount,
                    description: `Secured $${Number(f.amount || 0).toLocaleString()} in capital from ${f.fundingSource || 'Private Investors'}. Status: ${f.status || 'APPROVED'}.`,
                    badge: f.status || 'CLOSED'
                });
            });
        } else if (startup.totalFundingRaised > 0) {
            // Seed milestone if raised but no individual funding records
            events.push({
                id: 'prior-funding-aggregate',
                date: '2023-08-10',
                title: '💼 Pre-Seed Capital Closure',
                type: 'SEED',
                category: 'FUNDING_CLOSED',
                status: 'COMPLETED',
                amount: startup.totalFundingRaised,
                description: `Successfully closed previous funding rounds raising a total of $${Number(startup.totalFundingRaised).toLocaleString()}.`,
                badge: 'CLOSED'
            });
        }

        // 3. Investments from Investors on the Platform
        if (startup.investments && startup.investments.length > 0) {
            startup.investments.forEach(inv => {
                events.push({
                    id: `invest-${inv.id}`,
                    date: inv.investmentDate || '2024-01-10',
                    title: `🤝 Direct Platform Angel Investment`,
                    type: 'ANGEL',
                    category: 'INVESTMENT',
                    status: 'COMPLETED',
                    amount: inv.amount,
                    description: `Received direct investor capital backing of $${Number(inv.amount || 0).toLocaleString()}.`,
                    badge: 'ACTIVE'
                });
            });
        }

        // 4. Current Active Funding Round & Goal
        if (startup.fundingGoal && startup.fundingGoal > 0) {
            const raisedSoFar = (startup.fundings?.reduce((sum, f) => sum + (f.amount || 0), 0) || 0) + (startup.totalFundingRaised || 0);
            const remaining = Math.max(0, startup.fundingGoal - raisedSoFar);
            const pct = Math.min(100, Math.round((raisedSoFar / startup.fundingGoal) * 100));

            events.push({
                id: 'active-funding-goal',
                date: '2024-12-31', // Active current round target
                title: `🎯 Current Investment Round Goal: $${Number(startup.fundingGoal).toLocaleString()}`,
                type: 'TARGET_GOAL',
                category: 'CURRENT_ROUND',
                status: remaining === 0 ? 'COMPLETED' : 'ACTIVE',
                amount: startup.fundingGoal,
                description: `Targeting $${Number(startup.fundingGoal).toLocaleString()} for ${startup.stage || 'GROWTH'} stage expansion. Progress: ${pct}% funded ($${Number(raisedSoFar).toLocaleString()} raised, $${Number(remaining).toLocaleString()} remaining).`,
                badge: `${pct}% FUNDED`
            });
        }

        // 5. Projected Future Scaling Milestone
        events.push({
            id: 'future-expansion-goal',
            date: '2025-09-30', // Future target
            title: '🔮 Projected Series A / Global Scaling Milestone',
            type: 'SERIES_A',
            category: 'FUTURE_TARGET',
            status: 'PROJECTED',
            amount: (startup.fundingGoal || 500000) * 2.5,
            description: `Projected institutional Series A target of $${Number((startup.fundingGoal || 500000) * 2.5).toLocaleString()} to enter national market penetration and achieve break-even runway.`,
            badge: 'FUTURE TARGET'
        });

        // Sort events by date in specified order
        events.sort((a, b) => {
            const dateA = new Date(a.date).getTime() || 0;
            const dateB = new Date(b.date).getTime() || 0;
            return sortOrder === 'ASC' ? dateA - dateB : dateB - dateA;
        });

        return events;
    };

    const timelineEvents = buildTimelineEvents(activeStartup);

    // Compute progress stats for current startup
    const totalRaised = activeStartup ? 
        ((activeStartup.fundings?.reduce((acc, f) => acc + (f.amount || 0), 0) || 0) + (activeStartup.totalFundingRaised || 0)) : 0;
    const goal = activeStartup?.fundingGoal || 1;
    const progressPct = Math.min(100, Math.round((totalRaised / goal) * 100));
    const remainingToGoal = Math.max(0, goal - totalRaised);

    return (
        <div className="page-container">
            {showAddModal && activeStartup && (
                <AddFundingModal 
                    startup={activeStartup} 
                    onClose={() => setShowAddModal(false)} 
                    onAdded={loadData} 
                />
            )}

            {/* Header with Switcher and Controls */}
            <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 className="topbar-title">⏱️ Startup Investment Timeline & Goals</h1>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                        Track chronological investment rounds, completed capital milestones, and future funding targets in exact time order.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Startup Selector */}
                    {startups.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 'bold' }}>STARTUP:</span>
                            <select 
                                className="form-select" 
                                style={{ minWidth: 200, fontWeight: 'bold', color: 'var(--text)' }}
                                value={selectedStartupId || ''} 
                                onChange={e => setSelectedStartupId(e.target.value)}
                            >
                                {startups.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.sector || 'Tech'})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Chronological Sort Toggle */}
                    <button 
                        type="button" 
                        className="btn btn-secondary" 
                        style={{ fontSize: 12, padding: '7px 12px' }}
                        onClick={() => setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
                    >
                        {sortOrder === 'ASC' ? '⏳ Oldest → Newest' : '⏱️ Newest → Oldest'}
                    </button>

                    {/* Add Round / Milestone Button */}
                    {activeStartup && (
                        <button 
                            type="button" 
                            className="btn btn-primary" 
                            style={{ fontSize: 12, padding: '7px 14px' }}
                            onClick={() => setShowAddModal(true)}
                        >
                            + Record Funding Round
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="loading-screen"><div className="spinner" /><p>Loading startup timelines...</p></div>
            ) : !activeStartup ? (
                <div className="empty-state">
                    <div className="empty-state-icon">⏱️</div>
                    <h3>No Startups Available</h3>
                    <p>Create or explore startups to view their funding timeline.</p>
                </div>
            ) : (
                <>
                    {/* Executive Goal & Progress Card */}
                    <div className="card" style={{ marginBottom: 28, padding: '24px 28px', background: 'var(--navy-2)', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                    <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text)' }}>{activeStartup.name}</h2>
                                    <span className="badge badge-purple" style={{ fontSize: 11 }}>{activeStartup.stage || 'IDEA'}</span>
                                    <span className="badge badge-cyan" style={{ fontSize: 11 }}>{activeStartup.sector || 'Technology'}</span>
                                    {activeStartup.investmentPotentialTier && (
                                        <span className="badge badge-green" style={{ fontSize: 11 }}>
                                            ⚡ AI {activeStartup.investmentPotentialTier.replace('_', ' ')}
                                        </span>
                                    )}
                                </div>
                                <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
                                    Valuation: <strong>${Number(activeStartup.companyValuation || 0).toLocaleString()}</strong> | Available Equity: <strong>{activeStartup.availableEquity || 100}%</strong> | Runway: <strong>{activeStartup.runwayMonths || 12} mo</strong>
                                </div>
                            </div>

                            {/* Stat chips */}
                            <div style={{ display: 'flex', gap: 16, textAlign: 'right' }}>
                                <div>
                                    <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>TARGET GOAL</span>
                                    <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--teal)' }}>${Number(activeStartup.fundingGoal || 0).toLocaleString()}</span>
                                </div>
                                <div>
                                    <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>RAISED TO DATE</span>
                                    <span style={{ fontSize: 20, fontWeight: 900, color: '#10b981' }}>${Number(totalRaised).toLocaleString()}</span>
                                </div>
                                <div>
                                    <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>REMAINING</span>
                                    <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--violet)' }}>${Number(remainingToGoal).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar toward Funding Goal */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                                <span style={{ color: 'var(--text-2)', fontWeight: 'bold' }}>Funding Goal Progress</span>
                                <span style={{ color: 'var(--teal)', fontWeight: 'bold' }}>{progressPct}% Completed</span>
                            </div>
                            <div style={{ width: '100%', height: 12, background: 'rgba(255,255,255,0.06)', borderRadius: 6, overflow: 'hidden' }}>
                                <div style={{ 
                                    width: `${progressPct}%`, 
                                    height: '100%', 
                                    background: 'linear-gradient(90deg, #10b981, #06b6d4, #6366f1)',
                                    borderRadius: 6,
                                    transition: 'width 0.8s ease'
                                }} />
                            </div>
                        </div>
                    </div>

                    {/* Chronological Timeline Container */}
                    <div style={{ position: 'relative', paddingLeft: 36, marginBottom: 40 }}>
                        {/* Vertical line through timeline */}
                        <div style={{
                            position: 'absolute',
                            left: 14,
                            top: 10,
                            bottom: 10,
                            width: 3,
                            background: 'linear-gradient(180deg, var(--teal), var(--violet), rgba(255,255,255,0.1))',
                            borderRadius: 2
                        }} />

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {timelineEvents.map((evt, idx) => {
                                const isGoal = evt.category === 'CURRENT_ROUND';
                                const isFuture = evt.status === 'PROJECTED';
                                const isCompleted = evt.status === 'COMPLETED';

                                const nodeColor = isCompleted ? '#10b981' : isGoal ? '#06b6d4' : isFuture ? '#a855f7' : '#f59e0b';

                                return (
                                    <div key={evt.id || idx} style={{ position: 'relative' }}>
                                        {/* Dot / Indicator on vertical line */}
                                        <div style={{
                                            position: 'absolute',
                                            left: -29,
                                            top: 18,
                                            width: 17,
                                            height: 17,
                                            borderRadius: '50%',
                                            background: nodeColor,
                                            border: '3px solid #080c14',
                                            boxShadow: isGoal ? `0 0 12px ${nodeColor}` : 'none',
                                            zIndex: 2
                                        }} />

                                        {/* Timeline Event Card */}
                                        <div className="card" style={{
                                            padding: '20px 24px',
                                            borderLeft: `4px solid ${nodeColor}`,
                                            background: isGoal ? 'rgba(6,182,212,0.04)' : isFuture ? 'rgba(168,85,247,0.03)' : 'var(--card-bg)',
                                            transition: 'transform 0.2s ease',
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>
                                                        {evt.title}
                                                    </span>
                                                    <span className={`badge ${isCompleted ? 'badge-green' : isGoal ? 'badge-cyan' : isFuture ? 'badge-purple' : 'badge-amber'}`} style={{ fontSize: 10 }}>
                                                        {evt.badge}
                                                    </span>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    {evt.amount && (
                                                        <span style={{ fontSize: 16, fontWeight: 900, color: nodeColor }}>
                                                            ${Number(evt.amount).toLocaleString()}
                                                        </span>
                                                    )}
                                                    <span style={{ 
                                                        fontSize: 12, 
                                                        color: 'var(--text-3)', 
                                                        fontWeight: 'bold',
                                                        background: 'rgba(255,255,255,0.04)',
                                                        padding: '4px 8px',
                                                        borderRadius: 6
                                                    }}>
                                                        📅 {evt.date}
                                                    </span>
                                                </div>
                                            </div>

                                            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>
                                                {evt.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
