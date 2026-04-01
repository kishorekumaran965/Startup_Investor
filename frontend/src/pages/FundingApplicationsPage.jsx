import React, { useEffect, useState, useCallback } from 'react';
import { fundingAppApi, startupsApi, usersApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

/* ─── Status badge colours ─────────────────────────────────────────────── */
const STATUS_META = {
    PENDING: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', icon: '⏳' },
    APPROVED: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', icon: '✅' },
    REJECTED: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', icon: '❌' },
    UNDER_REVIEW: { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.3)', icon: '🔍' },
};

/* ─── Toast ─────────────────────────────────────────────────────────────── */
function Toast({ toasts, onDismiss }) {
    return (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none' }}>
            {toasts.map(t => (
                <div
                    key={t.id}
                    onClick={() => onDismiss(t.id)}
                    style={{
                        pointerEvents: 'all', cursor: 'pointer',
                        background: 'var(--bg-card)', border: `1px solid ${t.borderColor || 'var(--border)'}`,
                        borderLeft: `4px solid ${t.accentColor || 'var(--accent)'}`,
                        borderRadius: 12, padding: '12px 16px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                        display: 'flex', gap: 12, alignItems: 'flex-start',
                        maxWidth: 320, animation: 'slideUp 0.3s ease',
                        backdropFilter: 'blur(12px)',
                    }}
                >
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{t.icon}</span>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: t.accentColor || 'var(--text-primary)', marginBottom: 2 }}>{t.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{t.message}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function useToast() {
    const [toasts, setToasts] = useState([]);
    const addToast = useCallback(({ icon, title, message, accentColor, borderColor, duration = 4500 }) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, icon, title, message, accentColor, borderColor }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    }, []);
    const dismiss = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);
    return { toasts, addToast, dismiss };
}

/* ─── Apply Modal (for STARTUP users) ───────────────────────────────────── */
function ApplyModal({ onClose, onSave, userStartups, investors, allApps }) {
    const [form, setForm] = useState({ startupId: '', investorId: '', amount: '', equityOffered: '10', message: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const selectedStartup = userStartups.find(s => s.id === Number(form.startupId));
        const available = selectedStartup ? (selectedStartup.availableEquity ?? 100) : 100;
        
        // Calculate earmarked (Pending)
        const pending = allApps
            .filter(a => a.startupId === Number(form.startupId) && a.status === 'PENDING')
            .reduce((sum, a) => sum + (a.equityOffered || 0), 0);

        if (!form.startupId) { setError('Please select your startup.'); return; }
        if (!form.investorId) { setError('Please select an investor to request funding from.'); return; }
        if (!form.amount || Number(form.amount) <= 0) { setError('Please enter a valid funding amount.'); return; }
        if (!form.equityOffered || Number(form.equityOffered) <= 0 || Number(form.equityOffered) >= 100) { 
            setError('Please enter a valid equity percentage (0-100).'); return; 
        }
        if (Number(form.equityOffered) + pending > available) {
            if (pending > 0) {
                setError(`Insufficient equity. Available: ${available.toFixed(2)}%, Earmarked in pending requests: ${pending.toFixed(2)}%. You can only offer up to ${(available - pending).toFixed(2)}% more.`);
            } else {
                setError(`You only have ${available.toFixed(2)}% equity available to offer.`);
            }
            return;
        }
        
        setLoading(true); setError('');
        try {
            await onSave({
                startupId: Number(form.startupId),
                investorId: Number(form.investorId),
                amount: Number(form.amount),
                equityOffered: Number(form.equityOffered),
                message: form.message,
            });
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to submit application.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box" style={{ maxWidth: 520 }}>
                <div className="modal-header">
                    <h2 className="modal-title">💰 Request Funding</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
                    Submit a funding request to an investor. They will receive a notification and can accept or decline.
                </p>

                {error && (
                    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#ef4444', fontSize: 13 }}>
                        ⚠ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Startup selector */}
                    <div className="form-group">
                        <label className="form-label">Your Startup</label>
                        {userStartups.length === 0 ? (
                            <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>
                                You don't have any startups yet. Create one from the Startups page first.
                            </div>
                        ) : (
                            <select
                                className="form-select"
                                value={form.startupId}
                                onChange={e => setForm({ ...form, startupId: e.target.value })}
                                required
                            >
                                <option value="">Select your startup…</option>
                                {userStartups.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} {s.stage ? `(${s.stage})` : ''}
                                    </option>
                                ))}
                            </select>
                        )}
                        {form.startupId && (() => {
                            const selected = userStartups.find(s => s.id === Number(form.startupId));
                            const available = selected?.availableEquity ?? 100;
                            const earmarked = allApps
                                .filter(a => a.startupId === Number(form.startupId) && a.status === 'PENDING')
                                .reduce((sum, a) => sum + (a.equityOffered || 0), 0);
                            const remaining = available - earmarked;

                            return (
                                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, fontWeight: 600 }}>
                                    Available: <span style={{ color: 'var(--teal)' }}>{available.toFixed(2)}%</span>
                                    {earmarked > 0 && (
                                        <> | Earmarked: <span style={{ color: '#f59e0b' }}>{earmarked.toFixed(2)}%</span></>
                                    )}
                                    <span style={{ marginLeft: 8, color: remaining <= 0 ? '#ef4444' : 'var(--text-3)' }}>
                                        (Net available: <strong>{remaining.toFixed(2)}%</strong>)
                                    </span>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Investor selector */}
                    <div className="form-group">
                        <label className="form-label">Target Investor</label>
                        {investors.length === 0 ? (
                            <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>
                                No investors are registered on the platform yet.
                            </div>
                        ) : (
                            <select
                                className="form-select"
                                value={form.investorId}
                                onChange={e => setForm({ ...form, investorId: e.target.value })}
                                required
                            >
                                <option value="">Select an investor…</option>
                                {investors.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.name || u.email} (ID: {u.id})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Amount & Equity */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                        <div className="form-group">
                            <label className="form-label">Amount Required ($)</label>
                            <input
                                className="form-input"
                                type="number"
                                min="1"
                                step="any"
                                placeholder="100,000"
                                value={form.amount}
                                onChange={e => setForm({ ...form, amount: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Equity Offered (%)</label>
                            <input
                                className="form-input"
                                type="number"
                                min="0.01"
                                max="99.99"
                                step="any"
                                placeholder="10"
                                value={form.equityOffered}
                                onChange={e => setForm({ ...form, equityOffered: e.target.value })}
                                required
                            />
                        </div>
                    </div>


                    {/* Pitch message */}
                    <div className="form-group">
                        <label className="form-label">Pitch / Message</label>
                        <textarea
                            className="form-textarea"
                            rows={4}
                            placeholder="Describe why you need this funding and what you plan to do with it…"
                            value={form.message}
                            onChange={e => setForm({ ...form, message: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || userStartups.length === 0 || investors.length === 0}
                        >
                            {loading ? 'Submitting…' : '🚀 Send Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─── Status Badge ───────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
    const meta = STATUS_META[status] || STATUS_META.PENDING;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
            background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
        }}>
            {meta.icon} {status}
        </span>
    );
}

/* ─── Confirm Dialog ─────────────────────────────────────────────────────── */
function ConfirmDialog({ app, action, onConfirm, onCancel }) {
    const isApprove = action === 'APPROVED';
    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
            <div className="modal-box" style={{ maxWidth: 420 }}>
                <div className="modal-header">
                    <h2 className="modal-title">{isApprove ? '✅ Approve Application' : '❌ Reject Application'}</h2>
                    <button className="modal-close" onClick={onCancel}>✕</button>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    {isApprove
                        ? `Approve the $${Number(app.amount).toLocaleString()} funding request from `
                        : `Reject the $${Number(app.amount).toLocaleString()} funding request from `}
                    <strong style={{ color: 'var(--text-primary)' }}>{app.startupName || `Startup #${app.startupId}`}</strong>?
                </p>
                {isApprove && (
                    <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#10b981', marginBottom: 16 }}>
                        💡 Approving will automatically create an Investment record and notify the startup founder.
                    </div>
                )}
                {!isApprove && (
                    <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#ef4444', marginBottom: 16 }}>
                        The startup founder will be notified that their application was rejected.
                    </div>
                )}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
                    <button
                        className="btn"
                        style={{
                            background: isApprove ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                            color: isApprove ? '#10b981' : '#ef4444',
                            border: `1px solid ${isApprove ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
                        }}
                        onClick={onConfirm}
                    >
                        {isApprove ? '✅ Yes, Approve' : '❌ Yes, Reject'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── Application Card (investor/admin view) ─────────────────────────────── */
function AppCard({ app, onAction, actionLoading }) {
    const meta = STATUS_META[app.status] || STATUS_META.PENDING;
    const isPending = app.status === 'PENDING';

    return (
        <div style={{
            background: 'var(--bg-card)', border: `1px solid var(--border)`,
            borderRadius: 'var(--radius-md)', padding: 20,
            display: 'flex', flexDirection: 'column', gap: 14,
            transition: 'var(--transition-fast)',
            borderLeft: `4px solid ${meta.color}`,
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>
                        🚀 {app.startupName || `Startup #${app.startupId}`}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        From: <span style={{ color: 'var(--text-secondary)' }}>{app.investorName || `User #${app.investorId}`}</span>
                        &nbsp;·&nbsp; Applied: {app.applicationDate ? new Date(app.applicationDate).toLocaleDateString() : '—'}
                    </div>
                </div>
                <StatusBadge status={app.status} />
            </div>

            {/* Amount & Equity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>
                        ${Number(app.amount || 0).toLocaleString()}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>requested</span>
                </div>
                <div style={{ height: 20, width: 1, background: 'var(--border)' }}></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--violet)' }}>
                        {app.equityOffered || '0'}%
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>equity</span>
                </div>
            </div>

            {/* Message / Pitch */}
            {app.message && (
                <div style={{
                    background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
                    borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--text-secondary)',
                    lineHeight: 1.6, fontStyle: 'italic',
                }}>
                    "{app.message.length > 200 ? app.message.slice(0, 200) + '…' : app.message}"
                </div>
            )}

            {/* Actions */}
            {isPending && onAction && (
                <div style={{ display: 'flex', gap: 10 }}>
                    <button
                        className="btn"
                        style={{
                            flex: 1, background: 'rgba(16,185,129,0.12)', color: '#10b981',
                            border: '1px solid rgba(16,185,129,0.35)', fontWeight: 700,
                            opacity: actionLoading ? 0.6 : 1,
                        }}
                        disabled={actionLoading}
                        onClick={() => onAction(app, 'APPROVED')}
                    >
                        ✅ Accept
                    </button>
                    <button
                        className="btn"
                        style={{
                            flex: 1, background: 'rgba(239,68,68,0.12)', color: '#ef4444',
                            border: '1px solid rgba(239,68,68,0.35)', fontWeight: 700,
                            opacity: actionLoading ? 0.6 : 1,
                        }}
                        disabled={actionLoading}
                        onClick={() => onAction(app, 'REJECTED')}
                    >
                        ❌ Decline
                    </button>
                </div>
            )}
        </div>
    );
}

/* ─── Main Page ─────────────────────────────────────────────────────────── */
export default function FundingApplicationsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toasts, addToast, dismiss } = useToast();

    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Apply modal state
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [userStartups, setUserStartups] = useState([]);
    const [investors, setInvestors] = useState([]);

    // Confirm dialog state
    const [confirm, setConfirm] = useState(null); // { app, action }

    // Filter
    const [filter, setFilter] = useState('ALL');

    const isAdmin = user?.role === 'ADMIN';
    const isInvestor = user?.role === 'INVESTOR';
    const isStartup = user?.role === 'STARTUP';

    /* ── Fetch applications ── */
    const fetchApps = useCallback(async () => {
        setLoading(true);
        try {
            let data;
            if (isAdmin) {
                data = await fundingAppApi.getAll();
            } else if (isInvestor) {
                data = await fundingAppApi.getByInvestor(user.id);
            } else if (isStartup) {
                // Load startups for current user, then fetch apps for each
                const myStartups = await startupsApi.getAll().catch(() => []);
                const mine = myStartups.filter(s => s.founder?.id === user.id || s.userId === user.id);
                if (mine.length > 0) {
                    const results = await Promise.all(mine.map(s => fundingAppApi.getByStartup(s.id).catch(() => [])));
                    data = results.flat();
                } else {
                    data = [];
                }
            } else {
                data = await fundingAppApi.getAll();
            }
            setApps(data);
        } catch (e) {
            console.error(e);
            addToast({ icon: '⚠️', title: 'Load Error', message: 'Could not load applications.', accentColor: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' });
        } finally {
            setLoading(false);
        }
    }, [user, isAdmin, isInvestor, isStartup]);

    useEffect(() => { fetchApps(); }, [fetchApps]);

    /* ── Preload data for Apply modal ── */
    const openApplyModal = async () => {
        try {
            const [allStartups, allUsers] = await Promise.all([
                startupsApi.getAll().catch(() => []),
                usersApi.getAll().catch(() => []),
            ]);
            // Filter to user's own startups
            const mine = allStartups.filter(s => s.founder?.id === user.id || s.userId === user.id);
            const investorUsers = allUsers.filter(u => u.role === 'INVESTOR');
            setUserStartups(mine);
            setInvestors(investorUsers);
        } catch (e) {
            console.error(e);
        }
        setShowApplyModal(true);
    };

    /* ── Submit application (STARTUP) ── */
    const handleApply = async (form) => {
        await fundingAppApi.apply(form);
        await fetchApps();
        addToast({
            icon: '🚀',
            title: 'Application Submitted!',
            message: 'Your funding request has been sent to the investor. They will review it shortly.',
            accentColor: '#6366f1',
            borderColor: 'rgba(99,102,241,0.3)',
        });
    };

    /* ── Initiate accept/reject ── */
    const handleAction = (app, action) => {
        setConfirm({ app, action });
    };

    /* ── Confirm accept/reject ── */
    const handleConfirm = async () => {
        if (!confirm) return;
        const { app, action } = confirm;
        setConfirm(null);
        setActionLoading(true);
        try {
            await fundingAppApi.updateStatus(app.id, action);
            await fetchApps();
            if (action === 'APPROVED') {
                addToast({
                    icon: '✅',
                    title: 'Application Approved!',
                    message: `You approved the $${Number(app.amount).toLocaleString()} request from ${app.startupName}. The Cap Table has been updated and an investment record created.`,
                    accentColor: '#10b981',
                    borderColor: 'rgba(16,185,129,0.3)',
                    duration: 6000,
                });
            } else {
                addToast({
                    icon: '❌',
                    title: 'Application Rejected',
                    message: `You rejected the funding request from ${app.startupName}. The founder has been notified.`,
                    accentColor: '#ef4444',
                    borderColor: 'rgba(239,68,68,0.3)',
                    duration: 5000,
                });
            }
        } catch (e) {
            console.error(e);
            addToast({
                icon: '⚠️', title: 'Action Failed',
                message: e.message || 'Could not update application status.',
                accentColor: '#ef4444', borderColor: 'rgba(239,68,68,0.3)',
            });
        } finally {
            setActionLoading(false);
        }
    };

    /* ── Filtered list ── */
    const statuses = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW'];
    const filtered = filter === 'ALL' ? apps : apps.filter(a => a.status === filter);

    const pendingCount = apps.filter(a => a.status === 'PENDING').length;

    /* ── Role-aware heading ── */
    const heading = isStartup
        ? '💰 My Funding Applications'
        : isInvestor
            ? '📥 Incoming Funding Requests'
            : '💰 All Funding Applications';

    const subHeading = isStartup
        ? 'Track the status of your funding requests to investors'
        : isInvestor
            ? 'Review and respond to funding requests from startups'
            : 'Platform-wide funding application management';

    return (
        <div className="page-container">
            {/* Toasts */}
            <Toast toasts={toasts} onDismiss={dismiss} />

            {/* Apply Modal */}
            {showApplyModal && (
                <ApplyModal
                    onClose={() => setShowApplyModal(false)}
                    onSave={handleApply}
                    userStartups={userStartups}
                    investors={investors}
                    allApps={apps}
                />
            )}

            {/* Confirm Dialog */}
            {confirm && (
                <ConfirmDialog
                    app={confirm.app}
                    action={confirm.action}
                    onConfirm={handleConfirm}
                    onCancel={() => setConfirm(null)}
                />
            )}

            {/* Page Header */}
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
                    <h1 className="hero-title" style={{ fontSize: '28px', marginBottom: '4px' }}>{heading}</h1>
                    <p className="hero-subtitle" style={{ fontSize: '14px', color: 'var(--text-3)' }}>{subHeading}</p>
                </div>
                {isStartup && (
                    <button className="btn btn-primary" style={{ padding: '12px 24px' }} onClick={openApplyModal}>
                        Request New Funding
                    </button>
                )}
            </div>

            {/* Investor pending banner */}
            {isInvestor && pendingCount > 0 && (
                <div style={{
                    background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)',
                    borderRadius: 'var(--radius-md)', padding: '14px 18px',
                    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
                }}>
                    <span style={{ fontSize: 20 }}>🔔</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#f59e0b' }}>You have {pendingCount} pending funding request{pendingCount !== 1 ? 's' : ''}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Review them below and accept or decline each request.</div>
                    </div>
                </div>
            )}

            {/* Status Filter Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                {statuses.map(s => {
                    const count = s === 'ALL' ? apps.length : apps.filter(a => a.status === s).length;
                    const meta = STATUS_META[s];
                    return (
                        <button
                            key={s}
                            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setFilter(s)}
                            style={filter === s && meta ? {
                                background: meta.bg, color: meta.color,
                                border: `1px solid ${meta.border}`,
                            } : {}}
                        >
                            {meta?.icon} {s} {count > 0 && <span style={{ marginLeft: 4, opacity: 0.7 }}>({count})</span>}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            {loading ? (
                <div className="loading-screen"><div className="spinner" /><p>Loading applications…</p></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">💰</div>
                    <h3>{filter === 'ALL' ? 'No applications yet' : `No ${filter} applications`}</h3>
                    <p>
                        {isStartup ? 'Click "Request Funding" to send a funding request to an investor.' :
                            isInvestor ? 'No funding requests have been directed to you yet.' :
                                'No funding applications on the platform.'}
                    </p>
                    {isStartup && (
                        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openApplyModal}>
                            + Request Funding
                        </button>
                    )}
                </div>
            ) : (
                <>
                    {/* ── Investor/Admin card view ── */}
                    {(isInvestor || isAdmin) ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                            {filtered.map(app => (
                                <AppCard
                                    key={app.id}
                                    app={app}
                                    onAction={handleAction}
                                    actionLoading={actionLoading}
                                />
                            ))}
                        </div>
                    ) : (
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                            gap: 20 
                        }}>
                            {filtered.map(app => (
                                <div key={app.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '28px', position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-3)', letterSpacing: '1px' }}>APPLICATION #{app.id}</div>
                                        <StatusBadge status={app.status || 'PENDING'} />
                                    </div>
                                    
                                    <div>
                                        <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px' }}>{app.startupName || `Startup #${app.startupId}`}</h3>
                                        <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>
                                            Managing Investor: <strong style={{ color: 'var(--violet)' }}>{app.investorName || `User #${app.investorId}`}</strong>
                                        </div>
                                    </div>

                                    <div style={{ 
                                        padding: '16px', 
                                        background: 'rgba(255,255,255,0.03)', 
                                        borderRadius: '12px', 
                                        border: '1px solid var(--border)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 'bold', marginBottom: '2px' }}>AMOUNT</div>
                                            <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--teal)' }}>${Number(app.amount || 0).toLocaleString()}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 'bold', marginBottom: '2px' }}>EQUITY</div>
                                            <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--violet)' }}>{app.equityOffered}%</div>
                                        </div>
                                    </div>

                                    <div style={{ fontSize: '13px', color: 'var(--text-3)', fontStyle: 'italic', opacity: 0.8 }}>
                                        {app.message ? `"${app.message.slice(0, 100)}${app.message.length > 100 ? '...' : ''}"` : 'No pitch message provided.'}
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{app.applicationDate ? new Date(app.applicationDate).toLocaleDateString() : '—'}</div>
                                        <button className="btn btn-ghost" onClick={() => navigate(`/startups/${app.startupId}`)}>Details</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
