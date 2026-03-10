import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { authApi, usersApi } from '../api';

/* ── SVG icons ── */
const EyeIcon = ({ off }) => off ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
);
const LockIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);
const ArrowLeftIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
);
const CheckIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

function strengthInfo(pw) {
    if (!pw) return null;
    if (pw.length < 6) return { label: 'Too short', color: '#ef4444', pct: 20 };
    if (pw.length < 8) return { label: 'Weak', color: '#f59e0b', pct: 45 };
    const has = [/[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(pw)).length;
    if (has === 0) return { label: 'Moderate', color: '#f59e0b', pct: 60 };
    if (has === 1) return { label: 'Good', color: '#3dba78', pct: 80 };
    return { label: 'Strong', color: '#10b981', pct: 100 };
}

function PwField({ id, label, value, onChange, show, onToggle, placeholder }) {
    return (
        <div className="form-group" style={{ marginBottom: 18 }}>
            <label className="form-label" htmlFor={id}>{label}</label>
            <div style={{ position: 'relative' }}>
                <input
                    id={id}
                    className="form-input"
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    style={{ paddingRight: 44 }}
                    required
                    autoComplete="off"
                />
                <button
                    type="button"
                    onClick={onToggle}
                    style={{
                        position: 'absolute', right: 12, top: '50%',
                        transform: 'translateY(-50%)', background: 'none',
                        border: 'none', cursor: 'pointer', color: 'var(--text-3)',
                        display: 'flex', alignItems: 'center', padding: 0,
                    }}
                    tabIndex={-1}
                >
                    <EyeIcon off={show} />
                </button>
            </div>
        </div>
    );
}

export default function ChangePasswordPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [current, setCurrent] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirm, setConfirm] = useState('');
    const [show, setShow] = useState({ current: false, new: false, confirm: false });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const strength = strengthInfo(newPw);
    const matches = newPw && confirm && newPw === confirm;
    const mismatch = confirm && newPw !== confirm;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPw !== confirm) { setError('New passwords do not match.'); return; }
        if (newPw.length < 6) { setError('New password must be at least 6 characters.'); return; }
        if (current === newPw) { setError('New password must be different from current password.'); return; }

        setLoading(true);
        try {
            // Step 1 — verify current password via login
            await authApi.login({ email: user.email, password: current });

            // Step 2 — update password via users API
            await usersApi.update(user.id, {
                name: user.name,
                email: user.email,
                bio: user.bio ?? '',
                profilePhotoUrl: user.profilePhotoUrl ?? '',
                role: user.role,
                password: newPw,
            });

            setSuccess(true);
        } catch (err) {
            const msg = err.message || '';
            if (msg.toLowerCase().includes('401') || msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials')) {
                setError('Current password is incorrect.');
            } else {
                setError(msg || 'Failed to change password. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    /* ── Success screen ── */
    if (success) {
        return (
            <div className="page-container" style={{ maxWidth: 520, margin: '0 auto' }}>
                <div className="card" style={{ padding: '40px 36px', textAlign: 'center' }}>
                    <div style={{
                        width: 60, height: 60, borderRadius: '50%',
                        background: 'rgba(16,185,129,0.12)', color: '#10b981',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 18px', fontSize: 30,
                    }}>
                        <CheckIcon />
                    </div>
                    <h2 style={{ color: 'var(--text)', fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>
                        Password changed!
                    </h2>
                    <p style={{ color: 'var(--text-2)', fontSize: 13.5, margin: '0 0 24px' }}>
                        Your password has been updated successfully.
                    </p>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/profile')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}
                    >
                        <ArrowLeftIcon /> Back to Profile
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container" style={{ maxWidth: 520, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                <button
                    onClick={() => navigate('/profile')}
                    style={{
                        width: 34, height: 34, borderRadius: 8,
                        background: 'var(--navy-2)', border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: 'var(--text-2)',
                    }}
                    title="Back to profile"
                >
                    <ArrowLeftIcon />
                </button>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Change Password</h1>
                    <p style={{ fontSize: 12.5, color: 'var(--text-2)', margin: 0 }}>
                        Verify your current password, then set a new one.
                    </p>
                </div>
            </div>

            <div className="card" style={{ padding: '26px 28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <LockIcon />
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>
                        Logged in as <span style={{ color: 'var(--violet)' }}>{user?.email}</span>
                    </div>
                </div>

                {error && (
                    <div className="alert alert-error" style={{ marginBottom: 16, fontSize: 13 }}>
                        &#9888; {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Current password */}
                    <PwField
                        id="cp-current"
                        label="Current Password"
                        value={current}
                        onChange={e => setCurrent(e.target.value)}
                        show={show.current}
                        onToggle={() => setShow(s => ({ ...s, current: !s.current }))}
                        placeholder="Enter your current password"
                    />

                    {/* Divider */}
                    <div style={{ borderTop: '1px solid var(--border)', margin: '2px 0 20px' }} />

                    {/* New password */}
                    <PwField
                        id="cp-new"
                        label="New Password"
                        value={newPw}
                        onChange={e => setNewPw(e.target.value)}
                        show={show.new}
                        onToggle={() => setShow(s => ({ ...s, new: !s.new }))}
                        placeholder="At least 6 characters"
                    />

                    {/* Strength bar */}
                    {strength && (
                        <div style={{ marginTop: -12, marginBottom: 18 }}>
                            <div style={{ height: 3, borderRadius: 2, background: 'var(--border)', overflow: 'hidden', marginBottom: 4 }}>
                                <div style={{
                                    height: '100%', borderRadius: 2,
                                    width: strength.pct + '%',
                                    background: strength.color,
                                    transition: 'width 0.3s, background 0.3s',
                                }} />
                            </div>
                            <span style={{ fontSize: 11, color: strength.color, fontWeight: 600 }}>
                                {strength.label}
                            </span>
                        </div>
                    )}

                    {/* Confirm */}
                    <PwField
                        id="cp-confirm"
                        label="Confirm New Password"
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        show={show.confirm}
                        onToggle={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
                        placeholder="Repeat new password"
                    />

                    {mismatch && (
                        <p style={{ color: '#ef4444', fontSize: 12, marginTop: -12, marginBottom: 16 }}>
                            Passwords do not match.
                        </p>
                    )}
                    {matches && !mismatch && (
                        <p style={{ color: '#10b981', fontSize: 12, marginTop: -12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CheckIcon /> Passwords match
                        </p>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading || !!mismatch}
                        style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
                    >
                        {loading ? 'Changing password…' : 'Change Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
