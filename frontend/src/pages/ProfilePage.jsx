import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { usersApi, mentorsApi, investorProfilesApi } from '../api';

const ROLE_COLORS = {
    ADMIN: '#e05c5c', STARTUP: '#7c6fcd',
    INVESTOR: '#3dba78', MENTOR: '#e8a838', RESEARCHER: '#3fb9c5',
};

function getInitials(name, email) {
    if (name) {
        const parts = name.trim().split(' ');
        return parts.length > 1
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : name.slice(0, 2).toUpperCase();
    }
    return email ? email[0].toUpperCase() : '?';
}

function compressImage(file, maxPx = 256, quality = 0.82) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (evt) => {
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
                const w = Math.round(img.width * scale);
                const h = Math.round(img.height * scale);
                const canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = reject;
            img.src = evt.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

const SaveIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
    </svg>
);
const CameraIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
    </svg>
);
const LockIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);
const UserIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
);
const BriefcaseIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
);
const StarIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);
const ArrowRightIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
);
const CheckIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

function Toast({ message, type, onDismiss }) {
    return (
        <div
            onClick={onDismiss}
            style={{
                position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
                background: type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                border: `1px solid ${type === 'success' ? '#10b981' : '#ef4444'}`,
                borderLeft: `3px solid ${type === 'success' ? '#10b981' : '#ef4444'}`,
                color: type === 'success' ? '#10b981' : '#ef4444',
                borderRadius: 10, padding: '12px 18px',
                display: 'flex', alignItems: 'center', gap: 10,
                fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                animation: 'slideUp 0.25s ease',
            }}
        >
            {type === 'success' ? <CheckIcon /> : '⚠'} {message}
        </div>
    );
}

/* ─── Investor Profile Section ─── */
function InvestorProfileSection({ userId, roleColor }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ 
        firmName: '', investmentFocus: '', minInvestmentSize: '', maxInvestmentSize: '', bio: '',
        investorType: 'Individual', location: '', totalInvestmentBudget: '', availableCapital: '',
        preferredStages: 'IDEA,MVP,GROWTH', preferredBusinessModels: 'B2B SaaS,Marketplace',
        preferredLocations: '', riskTolerance: 'Medium', investmentStrategy: 'Balanced',
        preferredEquityMin: '5', preferredEquityMax: '20', investmentHorizon: '3-5 years',
        previousInvestmentCount: '0', successfulInvestments: '0', investmentExperience: 'Intermediate'
    });
    const [showMatches, setShowMatches] = useState(false);
    const [matches, setMatches] = useState([]);
    const [loadingMatches, setLoadingMatches] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        investorProfilesApi.getByUserId(userId)
            .then(p => {
                setProfile(p);
                setForm({
                    firmName: p.firmName || '',
                    investmentFocus: p.investmentFocus || '',
                    minInvestmentSize: p.minInvestmentSize ?? '',
                    maxInvestmentSize: p.maxInvestmentSize ?? '',
                    bio: p.bio || '',
                    investorType: p.investorType || 'Individual',
                    location: p.location || '',
                    totalInvestmentBudget: p.totalInvestmentBudget ?? '',
                    availableCapital: p.availableCapital ?? '',
                    preferredStages: p.preferredStages || 'IDEA,MVP,GROWTH',
                    preferredBusinessModels: p.preferredBusinessModels || 'B2B SaaS,Marketplace',
                    preferredLocations: p.preferredLocations || '',
                    riskTolerance: p.riskTolerance || 'Medium',
                    investmentStrategy: p.investmentStrategy || 'Balanced',
                    preferredEquityMin: p.preferredEquityMin ?? '5',
                    preferredEquityMax: p.preferredEquityMax ?? '20',
                    investmentHorizon: p.investmentHorizon || '3-5 years',
                    previousInvestmentCount: p.previousInvestmentCount ?? '0',
                    successfulInvestments: p.successfulInvestments ?? '0',
                    investmentExperience: p.investmentExperience || 'Intermediate'
                });
            })
            .catch(() => setProfile(null))
            .finally(() => setLoading(false));
    }, [userId]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                firmName: form.firmName,
                investmentFocus: form.investmentFocus,
                minInvestmentSize: form.minInvestmentSize !== '' ? parseFloat(form.minInvestmentSize) : null,
                maxInvestmentSize: form.maxInvestmentSize !== '' ? parseFloat(form.maxInvestmentSize) : null,
                bio: form.bio,
                investorType: form.investorType,
                location: form.location,
                totalInvestmentBudget: form.totalInvestmentBudget !== '' ? parseFloat(form.totalInvestmentBudget) : 0,
                availableCapital: form.availableCapital !== '' ? parseFloat(form.availableCapital) : 0,
                preferredStages: form.preferredStages,
                preferredBusinessModels: form.preferredBusinessModels,
                preferredLocations: form.preferredLocations,
                riskTolerance: form.riskTolerance,
                investmentStrategy: form.investmentStrategy,
                preferredEquityMin: form.preferredEquityMin !== '' ? parseFloat(form.preferredEquityMin) : 5,
                preferredEquityMax: form.preferredEquityMax !== '' ? parseFloat(form.preferredEquityMax) : 20,
                investmentHorizon: form.investmentHorizon,
                previousInvestmentCount: form.previousInvestmentCount !== '' ? parseInt(form.previousInvestmentCount) : 0,
                successfulInvestments: form.successfulInvestments !== '' ? parseInt(form.successfulInvestments) : 0,
                investmentExperience: form.investmentExperience
            };
            const updated = await investorProfilesApi.updateByUserId(userId, payload);
            setProfile(updated);
            showToast('Investor preferences saved!');
        } catch (err) {
            showToast(err.message || 'Failed to save', 'error');
        } finally {
            setSaving(false);
        }
    };

    const loadMatchingStartups = async () => {
        setLoadingMatches(true);
        setShowMatches(true);
        try {
            const data = await investorProfilesApi.getMatchingStartups(userId);
            setMatches(data || []);
        } catch (err) {
            showToast('Failed to load matching startups: ' + err.message, 'error');
        } finally {
            setLoadingMatches(false);
        }
    };

    return (
        <div className="card" style={{ marginBottom: 18, padding: '22px 28px' }}>
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 9,
                        background: 'rgba(61,186,120,0.12)', color: '#3dba78',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <BriefcaseIcon />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Investor Profile & Matching Preferences</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Powers the Investor–Startup Weighted Matching Algorithm</div>
                    </div>
                </div>
                <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ fontSize: 12, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
                    onClick={loadMatchingStartups}
                >
                    🎯 Find Matching Startups
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}><div className="spinner" /></div>
            ) : (
                <form onSubmit={handleSave}>
                    {/* Basic Info */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                        <div className="form-group">
                            <label className="form-label">Firm / Organization</label>
                            <input className="form-input" placeholder="e.g. Angel Network / Self" value={form.firmName} onChange={e => setForm({ ...form, firmName: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Investor Type</label>
                            <select className="form-select" value={form.investorType} onChange={e => setForm({ ...form, investorType: e.target.value })}>
                                <option value="Individual">Individual / Angel Investor</option>
                                <option value="Venture Capital">Venture Capital Firm</option>
                                <option value="Investment Company">Investment Syndicate / Fund</option>
                                <option value="Family Office">Family Office</option>
                            </select>
                        </div>
                    </div>

                    {/* Financial Capacity */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                        <div className="form-group">
                            <label className="form-label">Total Investment Budget ($)</label>
                            <input className="form-input" type="number" placeholder="500000" value={form.totalInvestmentBudget} onChange={e => setForm({ ...form, totalInvestmentBudget: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Available Capital Currently ($)</label>
                            <input className="form-input" type="number" placeholder="300000" value={form.availableCapital} onChange={e => setForm({ ...form, availableCapital: e.target.value })} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                        <div className="form-group">
                            <label className="form-label">Min Investment Per Deal ($)</label>
                            <input className="form-input" type="number" placeholder="10000" value={form.minInvestmentSize} onChange={e => setForm({ ...form, minInvestmentSize: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Max Investment Per Deal ($)</label>
                            <input className="form-input" type="number" placeholder="200000" value={form.maxInvestmentSize} onChange={e => setForm({ ...form, maxInvestmentSize: e.target.value })} />
                        </div>
                    </div>

                    {/* Preferences for Matching */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                        <div className="form-group">
                            <label className="form-label">Preferred Industries (comma-separated)</label>
                            <input className="form-input" placeholder="e.g. Technology,FinTech,Healthcare" value={form.investmentFocus} onChange={e => setForm({ ...form, investmentFocus: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Preferred Stages (comma-separated)</label>
                            <input className="form-input" placeholder="e.g. IDEA,MVP,GROWTH" value={form.preferredStages} onChange={e => setForm({ ...form, preferredStages: e.target.value })} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
                        <div className="form-group">
                            <label className="form-label">Risk Tolerance</label>
                            <select className="form-select" value={form.riskTolerance} onChange={e => setForm({ ...form, riskTolerance: e.target.value })}>
                                <option value="Low">Low (Prefers Scaling / Low Risk)</option>
                                <option value="Medium">Medium (Balanced MVP / Growth)</option>
                                <option value="High">High (Comfortable with Early Idea / Seed)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Investment Strategy</label>
                            <select className="form-select" value={form.investmentStrategy} onChange={e => setForm({ ...form, investmentStrategy: e.target.value })}>
                                <option value="Conservative">Conservative</option>
                                <option value="Balanced">Balanced</option>
                                <option value="Aggressive">Aggressive</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Investment Horizon</label>
                            <select className="form-select" value={form.investmentHorizon} onChange={e => setForm({ ...form, investmentHorizon: e.target.value })}>
                                <option value="1-2 years">1-2 years (Short)</option>
                                <option value="3-5 years">3-5 years (Standard)</option>
                                <option value="5+ years">5+ years (Long)</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                        <div className="form-group">
                            <label className="form-label">Preferred Equity Range (%)</label>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <input className="form-input" type="number" placeholder="Min %" value={form.preferredEquityMin} onChange={e => setForm({ ...form, preferredEquityMin: e.target.value })} />
                                <span style={{ color: 'var(--text-3)' }}>to</span>
                                <input className="form-input" type="number" placeholder="Max %" value={form.preferredEquityMax} onChange={e => setForm({ ...form, preferredEquityMax: e.target.value })} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Investment Experience Level</label>
                            <select className="form-select" value={form.investmentExperience} onChange={e => setForm({ ...form, investmentExperience: e.target.value })}>
                                <option value="Beginner">Beginner (1-2 deals)</option>
                                <option value="Intermediate">Intermediate (3-8 deals)</option>
                                <option value="Experienced">Experienced (8+ deals)</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 18 }}>
                        <label className="form-label">About / Investment Philosophy</label>
                        <textarea className="form-textarea" rows={3} placeholder="Describe your investment thesis, what you look for in founders, and how you provide value beyond capital…" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} style={{ resize: 'vertical', minHeight: 70 }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#3dba78', borderColor: '#3dba78' }}>
                            <SaveIcon />{saving ? 'Saving…' : 'Save Matching Preferences'}
                        </button>
                    </div>
                </form>
            )}

            {/* Matched Startups Drawer / Modal */}
            {showMatches && (
                <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h4 style={{ margin: 0, fontSize: 16, color: 'var(--text-1)' }}>🎯 Top Recommended Startups for You</h4>
                        <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setShowMatches(false)}>✕ Close</button>
                    </div>

                    {loadingMatches ? (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}><div className="spinner" /><p style={{ fontSize: 12, color: 'var(--text-3)' }}>Calculating weighted match scores...</p></div>
                    ) : matches.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-3)', fontSize: 13 }}>
                            No startups match your criteria right now. Try broadening your industry focus or stage preferences.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                            {matches.map(m => (
                                <div key={m.startupId} style={{
                                    padding: '16px', borderRadius: 10, border: '1px solid var(--border)',
                                    background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: 8
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <strong style={{ fontSize: 15, color: 'var(--text-1)' }}>{m.startupName}</strong>
                                        <span className={`badge ${
                                            m.matchScore >= 80 ? 'badge-green' : m.matchScore >= 60 ? 'badge-amber' : 'badge-purple'
                                        }`} style={{ fontSize: 11, padding: '3px 8px' }}>
                                            {m.matchScore}% Match
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        <span className="badge badge-cyan" style={{ fontSize: 10 }}>{m.sector}</span>
                                        <span className="badge badge-purple" style={{ fontSize: 10 }}>{m.stage}</span>
                                        {m.investmentPotentialTier && (
                                            <span className="badge badge-green" style={{ fontSize: 10 }}>⚡ AI {m.investmentPotentialTier.replace('_', ' ')}</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                                        Ask: <strong>${Number(m.fundingGoal || 0).toLocaleString()}</strong> | Available Equity: <strong>{m.availableEquity || 100}%</strong>
                                    </div>
                                    {m.matchReasons && m.matchReasons.length > 0 && (
                                        <div style={{ fontSize: 11, color: 'var(--teal)', lineHeight: 1.4, borderTop: '1px dashed var(--border)', paddingTop: 6 }}>
                                            ✓ {m.matchReasons[0]}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ─── Mentor Profile Section ─── */
function MentorProfileSection({ userId }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ expertise: '', bio: '', contactNumber: '', yearsOfExperience: '', currentTitle: '' });
    const [toast, setToast] = useState(null);

    useEffect(() => {
        mentorsApi.getByUserId(userId)
            .then(p => {
                setProfile(p);
                setForm({
                    expertise: p.expertise || '',
                    bio: p.bio || '',
                    contactNumber: p.contactNumber || '',
                    yearsOfExperience: p.yearsOfExperience ?? '',
                    currentTitle: p.currentTitle || '',
                });
            })
            .catch(() => setProfile(null))
            .finally(() => setLoading(false));
    }, [userId]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!profile?.id) {
            showToast('No mentor profile found to update.', 'error');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                ...form,
                yearsOfExperience: form.yearsOfExperience !== '' ? parseInt(form.yearsOfExperience) : null,
            };
            const updated = await mentorsApi.update(profile.id, payload);
            setProfile(updated);
            showToast('Mentor profile saved!');
        } catch (err) {
            showToast(err.message || 'Failed to save', 'error');
        } finally {
            setSaving(false);
        }
    };

    const statusColors = { APPROVED: '#10b981', PENDING: '#f59e0b', REJECTED: '#ef4444' };

    return (
        <div className="card" style={{ marginBottom: 18, padding: '22px 28px' }}>
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 9,
                        background: 'rgba(232,168,56,0.12)', color: '#e8a838',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <StarIcon />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Mentor Profile</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Visible to startups seeking guidance</div>
                    </div>
                </div>
                {profile?.status && (
                    <span style={{
                        padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                        background: (statusColors[profile.status] || '#f59e0b') + '22',
                        color: statusColors[profile.status] || '#f59e0b',
                        border: `1px solid ${(statusColors[profile.status] || '#f59e0b')}44`,
                    }}>{profile.status}</span>
                )}
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}><div className="spinner" /></div>
            ) : !profile ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-3)', fontSize: 13 }}>
                    No mentor profile found. Apply to become a mentor from the <strong>Mentors</strong> page.
                </div>
            ) : (
                <form onSubmit={handleSave}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                        <div className="form-group">
                            <label className="form-label">Professional Title</label>
                            <input className="form-input" placeholder="e.g. Senior Architect" value={form.currentTitle} onChange={e => setForm({ ...form, currentTitle: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Years of Experience</label>
                            <input className="form-input" type="number" placeholder="10" value={form.yearsOfExperience} onChange={e => setForm({ ...form, yearsOfExperience: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                        <div className="form-group">
                            <label className="form-label">Mentorship Expertise</label>
                            <input className="form-input" placeholder="e.g. Scaling, AI, Marketing" value={form.expertise} onChange={e => setForm({ ...form, expertise: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Contact Number</label>
                            <input className="form-input" placeholder="+1 234 567 890" value={form.contactNumber} onChange={e => setForm({ ...form, contactNumber: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 18 }}>
                        <label className="form-label">Mentorship Pitch (Bio)</label>
                        <textarea className="form-textarea" rows={3} placeholder="Why should startups choose you as a mentor?" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} style={{ resize: 'vertical', minHeight: 80 }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#e8a838', borderColor: '#e8a838', color: '#000' }}>
                            <SaveIcon />{saving ? 'Saving…' : 'Save Mentor Profile'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

/* ─── Main Profile Page ─── */
export default function ProfilePage() {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const roleColor = ROLE_COLORS[user?.role] || '#7c6fcd';

    const [name, setName] = useState(user?.name || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [photoPreview, setPhotoPreview] = useState(user?.profilePhotoUrl || null);
    const [photoData, setPhotoData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const fileRef = useRef(null);

    const avatarSrc = photoPreview;
    const avatarBg = avatarSrc
        ? `url(${avatarSrc}) center/cover no-repeat`
        : `linear-gradient(135deg, ${roleColor}, #7c6fcd)`;

    const handleFilePick = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setToast({ message: 'Please choose an image file.', type: 'error' });
            setTimeout(() => setToast(null), 3000);
            return;
        }
        try {
            const compressed = await compressImage(file, 256, 0.85);
            setPhotoPreview(compressed);
            setPhotoData(compressed);
        } catch {
            setToast({ message: 'Could not process image.', type: 'error' });
            setTimeout(() => setToast(null), 3000);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!user?.id) return;
        setLoading(true);
        try {
            const updatedPhotoUrl = photoData ?? user?.profilePhotoUrl ?? '';
            await usersApi.update(user.id, {
                name,
                email: user.email,
                bio,
                profilePhotoUrl: updatedPhotoUrl,
                role: user.role,
            });
            updateUser({ name, bio, profilePhotoUrl: updatedPhotoUrl });
            setPhotoData(null);
            setToast({ message: 'Profile saved!', type: 'success' });
            setTimeout(() => setToast(null), 3000);
        } catch (err) {
            setToast({ message: err.message || 'Failed to save.', type: 'error' });
            setTimeout(() => setToast(null), 3500);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            {/* High-Fidelity Profile Hero */}
            <div className="hero-section" style={{ 
                marginBottom: 32, 
                padding: '48px',
                borderRadius: 'var(--r-lg)',
                background: 'var(--navy-2)',
                border: '1px solid var(--border)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                gap: '32px'
            }}>
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{
                        width: 120, height: 120, borderRadius: '24px',
                        background: avatarBg,
                        border: `4px solid ${roleColor}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 42, fontWeight: 900, color: '#fff',
                        boxShadow: `0 0 40px ${roleColor}33`,
                        overflow: 'hidden',
                        cursor: 'pointer'
                    }} onClick={() => fileRef.current?.click()}>
                        {!avatarSrc && getInitials(user?.name, user?.email)}
                    </div>
                </div>

                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: roleColor, letterSpacing: '2px', marginBottom: '8px' }}>{user?.role.toUpperCase()} ACCOUNT</div>
                    <h1 className="hero-title" style={{ fontSize: '32px', marginBottom: '8px' }}>{user?.name || 'Venture Member'}</h1>
                    <p className="hero-subtitle" style={{ fontSize: '15px', color: 'var(--text-3)', maxWidth: '600px' }}>{user?.email}</p>
                    
                    <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => fileRef.current?.click()}>Update Photo</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/change-password')}>Secure ID</button>
                    </div>
                </div>

                {/* Decorative mesh */}
                <div style={{ 
                    position: 'absolute', 
                    top: '-20%', 
                    right: '-10%', 
                    width: '400px', 
                    height: '400px', 
                    background: roleColor, 
                    filter: 'blur(120px)', 
                    opacity: 0.1,
                    borderRadius: '50%'
                }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24 }}>

                {/* Photo Update section is now in Hero, hiding this card */}
                {photoData && (
                    <div style={{
                        gridColumn: 'span 12',
                        padding: '16px 24px', borderRadius: 12,
                        background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)',
                        fontSize: 14, color: '#10b981', display: 'flex', alignItems: 'center', gap: 10,
                        marginBottom: 12
                    }}>
                        <CheckIcon /> New identity image synchronized. <strong>Commit changes</strong> below to persist.
                    </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFilePick} />

                {/* Personal info form - Left Column */}
                <div className="card" style={{ gridColumn: 'span 5', padding: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 10,
                            background: 'var(--violet-dim)', color: 'var(--violet)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <UserIcon />
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '15px' }}>Identity Core</div>
                    </div>

                    <form onSubmit={handleSave}>
                        <div className="form-group" style={{ marginBottom: 20 }}>
                            <label className="form-label">GLOBAL ALIAS</label>
                            <input
                                className="form-input"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Your identity"
                                required
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: 32 }}>
                            <label className="form-label">SYNOPSIS (BIO)</label>
                            <textarea
                                className="form-textarea"
                                rows={4}
                                value={bio}
                                onChange={e => setBio(e.target.value)}
                                placeholder="Share your trajectory..."
                                style={{ resize: 'none' }}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                            style={{ width: '100%', padding: '14px' }}
                        >
                            {loading ? 'Synthesizing...' : 'Commit Changes'}
                        </button>
                    </form>
                </div>

                {/* Right Area for Role Profiles */}
                <div style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {user?.role === 'INVESTOR' && user?.id && (
                        <InvestorProfileSection userId={user.id} roleColor={ROLE_COLORS.INVESTOR} />
                    )}
                    {user?.role === 'MENTOR' && user?.id && (
                        <MentorProfileSection userId={user.id} />
                    )}
                    
                    {/* Account Security Box */}
                    <div className="card" style={{ padding: '32px' }}>
                       <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
                           <div style={{ width: 32, height: 32, background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                               <LockIcon />
                           </div>
                           <div style={{ fontWeight: 800, fontSize: '15px' }}>Security Protocol</div>
                       </div>
                       <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: 24 }}>Update your secure access credentials and authentication methods.</p>
                       <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => navigate('/change-password')}>
                           Change Access Key
                       </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
