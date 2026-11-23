import React, { useState } from 'react';

export default function StartupTimelineModal({ startup, onClose, onExpressInterest, onChat, isInvestor }) {
    const [sortOrder, setSortOrder] = useState('ASC'); // 'ASC' = Oldest to Newest, 'DESC' = Newest to Oldest

    if (!startup) return null;

    // Build the Chronological Timeline Events
    const buildTimelineEvents = () => {
        const events = [];

        // 1. Company Inception / Foundation Milestone
        events.push({
            id: 'init-foundation',
            date: '2023-01-15',
            title: '🚀 Company Foundation & Ideation',
            type: 'FOUNDATION',
            status: 'COMPLETED',
            amount: null,
            description: `Founded ${startup.name || startup.startupName} in the ${startup.sector || startup.industry || 'Technology'} sector with initial founder equity allocation of ${startup.availableEquity || 100}%.`,
            badge: startup.stage || 'IDEA'
        });

        // 2. Closed Historical Fundings
        if (startup.fundings && startup.fundings.length > 0) {
            startup.fundings.forEach(f => {
                events.push({
                    id: `funding-${f.id}`,
                    date: f.fundingDate || '2023-06-20',
                    title: `💼 ${f.fundingType ? f.fundingType.replace('_', ' ') : 'Seed'} Round: ${f.fundingSource || 'Angel Syndicate'}`,
                    type: f.fundingType || 'SEED',
                    status: f.status === 'APPROVED' ? 'COMPLETED' : 'IN_PROGRESS',
                    amount: f.amount,
                    description: `Closed $${Number(f.amount || 0).toLocaleString()} from ${f.fundingSource || 'Private Investors'}. Status: ${f.status || 'APPROVED'}.`,
                    badge: f.status || 'CLOSED'
                });
            });
        } else if (startup.totalFundingRaised > 0) {
            events.push({
                id: 'prior-funding-aggregate',
                date: '2023-08-10',
                title: '💼 Pre-Seed Capital Closure',
                type: 'SEED',
                status: 'COMPLETED',
                amount: startup.totalFundingRaised,
                description: `Successfully closed previous funding rounds raising a total of $${Number(startup.totalFundingRaised).toLocaleString()}.`,
                badge: 'CLOSED'
            });
        }

        // 3. Platform Direct Investments
        if (startup.investments && startup.investments.length > 0) {
            startup.investments.forEach(inv => {
                events.push({
                    id: `invest-${inv.id}`,
                    date: inv.investmentDate || '2024-01-10',
                    title: `🤝 Direct Platform Angel Investment`,
                    type: 'ANGEL',
                    status: 'COMPLETED',
                    amount: inv.amount,
                    description: `Received direct investor capital backing of $${Number(inv.amount || 0).toLocaleString()}.`,
                    badge: 'ACTIVE'
                });
            });
        }

        // 4. Current Active Funding Round & Goal
        const fundingGoal = startup.fundingGoal || 0;
        if (fundingGoal > 0) {
            const raisedSoFar = (startup.fundings?.reduce((sum, f) => sum + (f.amount || 0), 0) || 0) + (startup.totalFundingRaised || 0);
            const remaining = Math.max(0, fundingGoal - raisedSoFar);
            const pct = Math.min(100, Math.round((raisedSoFar / fundingGoal) * 100));

            events.push({
                id: 'active-funding-goal',
                date: '2024-12-31',
                title: `🎯 Current Round Goal: $${Number(fundingGoal).toLocaleString()}`,
                type: 'TARGET_GOAL',
                status: remaining === 0 ? 'COMPLETED' : 'ACTIVE',
                amount: fundingGoal,
                description: `Active investment ask of $${Number(fundingGoal).toLocaleString()} for ${startup.stage || 'GROWTH'} stage expansion. Progress: ${pct}% funded ($${Number(raisedSoFar).toLocaleString()} raised, $${Number(remaining).toLocaleString()} remaining).`,
                badge: `${pct}% FUNDED`
            });
        }

        // 5. Projected Future Scaling Milestone
        events.push({
            id: 'future-expansion-goal',
            date: '2025-09-30',
            title: '🔮 Projected Series A / Expansion Milestone',
            type: 'SERIES_A',
            status: 'PROJECTED',
            amount: (fundingGoal || 500000) * 2.5,
            description: `Projected institutional Series A target of $${Number((fundingGoal || 500000) * 2.5).toLocaleString()} to enter national market scaling.`,
            badge: 'FUTURE TARGET'
        });

        // Sort by date according to sortOrder
        events.sort((a, b) => {
            const dateA = new Date(a.date).getTime() || 0;
            const dateB = new Date(b.date).getTime() || 0;
            return sortOrder === 'ASC' ? dateA - dateB : dateB - dateA;
        });

        return events;
    };

    const timelineEvents = buildTimelineEvents();

    const totalRaised = (startup.fundings?.reduce((acc, f) => acc + (f.amount || 0), 0) || 0) + (startup.totalFundingRaised || 0);
    const goal = startup.fundingGoal || 1;
    const progressPct = Math.min(100, Math.round((totalRaised / goal) * 100));
    const remainingToGoal = Math.max(0, goal - totalRaised);

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box" style={{ maxWidth: 740, maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                
                {/* Header */}
                <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', background: 'var(--navy-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                                {startup.name || startup.startupName}
                            </h2>
                            <span className="badge badge-purple" style={{ fontSize: 10 }}>{startup.stage || 'IDEA'}</span>
                            <span className="badge badge-cyan" style={{ fontSize: 10 }}>{startup.sector || startup.industry}</span>
                            {startup.investmentPotentialTier && (
                                <span className="badge badge-green" style={{ fontSize: 10 }}>
                                    ⚡ AI {startup.investmentPotentialTier.replace('_', ' ')}
                                </span>
                            )}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                            Valuation: <strong>${Number(startup.companyValuation || 0).toLocaleString()}</strong> | Available Equity: <strong>{startup.availableEquity || 100}%</strong> | Runway: <strong>{startup.runwayMonths || 12} mo</strong>
                        </div>
                    </div>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                {/* Body Content */}
                <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
                    
                    {/* Goal Progress Banner */}
                    <div style={{ padding: '16px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                            <div>
                                <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase' }}>TARGET ROUND GOAL</span>
                                <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--teal)' }}>${Number(startup.fundingGoal || 0).toLocaleString()}</div>
                            </div>
                            <div>
                                <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase' }}>RAISED TO DATE</span>
                                <div style={{ fontSize: 20, fontWeight: 900, color: '#10b981' }}>${Number(totalRaised).toLocaleString()}</div>
                            </div>
                            <div>
                                <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase' }}>REMAINING TO GOAL</span>
                                <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--violet)' }}>${Number(remainingToGoal).toLocaleString()}</div>
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                                <span style={{ color: 'var(--text-2)', fontWeight: 'bold' }}>Round Completion Progress</span>
                                <span style={{ color: 'var(--teal)', fontWeight: 'bold' }}>{progressPct}% Completed</span>
                            </div>
                            <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 5, overflow: 'hidden' }}>
                                <div style={{ 
                                    width: `${progressPct}%`, 
                                    height: '100%', 
                                    background: 'linear-gradient(90deg, #10b981, #06b6d4, #6366f1)',
                                    borderRadius: 5,
                                    transition: 'width 0.8s ease'
                                }} />
                            </div>
                        </div>
                    </div>

                    {/* Timeline Controls */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>⏱️ Investment Timeline & Milestones</span>
                            <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 'normal' }}>({timelineEvents.length} events in time order)</span>
                        </div>
                        <button 
                            type="button" 
                            className="btn btn-ghost" 
                            style={{ fontSize: 11, padding: '4px 8px', border: '1px solid var(--border)' }}
                            onClick={() => setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
                        >
                            {sortOrder === 'ASC' ? '⏳ Oldest → Newest' : '⏱️ Newest → Oldest'}
                        </button>
                    </div>

                    {/* Vertical Timeline */}
                    <div style={{ position: 'relative', paddingLeft: 28 }}>
                        {/* Vertical line */}
                        <div style={{
                            position: 'absolute',
                            left: 10,
                            top: 8,
                            bottom: 8,
                            width: 2,
                            background: 'linear-gradient(180deg, #10b981, var(--teal), rgba(255,255,255,0.1))'
                        }} />

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {timelineEvents.map((evt, idx) => {
                                const isGoal = evt.type === 'TARGET_GOAL';
                                const isFuture = evt.status === 'PROJECTED';
                                const isCompleted = evt.status === 'COMPLETED';
                                const color = isCompleted ? '#10b981' : isGoal ? '#06b6d4' : isFuture ? '#a855f7' : '#f59e0b';

                                return (
                                    <div key={evt.id || idx} style={{ position: 'relative' }}>
                                        {/* Timeline Dot */}
                                        <div style={{
                                            position: 'absolute',
                                            left: -24,
                                            top: 14,
                                            width: 14,
                                            height: 14,
                                            borderRadius: '50%',
                                            background: color,
                                            border: '2px solid #080c14',
                                            boxShadow: isGoal ? `0 0 8px ${color}` : 'none',
                                            zIndex: 2
                                        }} />

                                        <div style={{
                                            padding: '14px 18px',
                                            borderRadius: 8,
                                            border: '1px solid var(--border)',
                                            borderLeft: `3px solid ${color}`,
                                            background: isGoal ? 'rgba(6,182,212,0.04)' : 'rgba(255,255,255,0.02)'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <strong style={{ fontSize: 14, color: 'var(--text)' }}>{evt.title}</strong>
                                                    <span className={`badge ${isCompleted ? 'badge-green' : isGoal ? 'badge-cyan' : isFuture ? 'badge-purple' : 'badge-amber'}`} style={{ fontSize: 9 }}>
                                                        {evt.badge}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    {evt.amount && (
                                                        <strong style={{ fontSize: 14, color }}>
                                                            ${Number(evt.amount).toLocaleString()}
                                                        </strong>
                                                    )}
                                                    <span style={{ fontSize: 11, color: 'var(--text-3)', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: 4 }}>
                                                        📅 {evt.date}
                                                    </span>
                                                </div>
                                            </div>
                                            <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>
                                                {evt.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border)', background: 'var(--navy-2)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    {isInvestor && onExpressInterest && (
                        <button className="btn btn-primary" onClick={onExpressInterest}>
                            💰 Express Interest in Round
                        </button>
                    )}
                    {onChat && (
                        <button className="btn btn-secondary" onClick={onChat}>
                            💬 Chat with Founder
                        </button>
                    )}
                    <button className="btn btn-ghost" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
