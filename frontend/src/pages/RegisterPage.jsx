import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authApi } from '../api';

const ROLES = [
    { value: 'STARTUP', label: 'Startup Founder', desc: 'Build and pitch your idea' },
    { value: 'INVESTOR', label: 'Investor', desc: 'Back promising startups' },
    { value: 'MENTOR', label: 'Mentor', desc: 'Help founders grow' },
    { value: 'RESEARCHER', label: 'Researcher', desc: 'Commercialize your research' },
];

export default function RegisterPage() {
    const { login } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STARTUP' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await authApi.register(form);
            login(data);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Something went wrong — please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <button
                onClick={toggleTheme}
                title="Toggle theme"
                style={{
                    position: 'absolute', top: 20, right: 20,
                    background: 'var(--navy-3)', border: '1px solid var(--border)',
                    color: 'var(--text-2)', width: 38, height: 38, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontSize: 17, zIndex: 100,
                }}
            >
                {theme === 'dark'
                    ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
                    : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                }
            </button>

            <div className="auth-bg-blob" style={{ width: 380, height: 380, background: 'var(--teal)', top: -60, right: -60 }} />
            <div className="auth-bg-blob" style={{ width: 320, height: 320, background: 'var(--violet)', bottom: -80, left: -80 }} />

            <div className="auth-card" style={{ maxWidth: 500 }}>
                <div className="auth-logo">
                    <div style={{
                        width: 38, height: 38, borderRadius: 8,
                        background: 'linear-gradient(145deg, #7c6fcd, #3fb9c5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                    </div>
                    <div>
                        <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>VentureHub</div>
                        <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>Startup Ecosystem</div>
                    </div>
                </div>

                <h1 className="auth-title">Create your account</h1>
                <p className="auth-sub">Join a growing network of founders, investors, and mentors.</p>

                {error && <div className="alert alert-error">&#9888; {error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-name">Full Name</label>
                        <input
                            id="reg-name"
                            name="name"
                            type="text"
                            className="form-input"
                            placeholder="Jane Smith"
                            value={form.name}
                            onChange={handleChange}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-email">Email</label>
                        <input
                            id="reg-email"
                            name="email"
                            type="email"
                            className="form-input"
                            placeholder="your@email.com"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-password">Password</label>
                        <input
                            id="reg-password"
                            name="password"
                            type="password"
                            className="form-input"
                            placeholder="At least 8 characters"
                            value={form.password}
                            onChange={handleChange}
                            required
                            minLength={6}
                        />
                    </div>

                    {/* Role picker */}
                    <div className="form-group">
                        <label className="form-label">I am a...</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {ROLES.map((role) => {
                                const active = form.role === role.value;
                                return (
                                    <label
                                        key={role.value}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: 9,
                                            padding: '11px 12px',
                                            border: `1px solid ${active ? 'var(--violet)' : 'var(--border)'}`,
                                            borderRadius: 'var(--r-sm)',
                                            background: active ? 'var(--violet-dim)' : 'var(--navy-4)',
                                            cursor: 'pointer',
                                            transition: 'border-color var(--anim), background var(--anim)',
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="role"
                                            value={role.value}
                                            checked={active}
                                            onChange={handleChange}
                                            style={{ marginTop: 3, accentColor: 'var(--violet)' }}
                                        />
                                        <div>
                                            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>{role.label}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{role.desc}</div>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <button
                        id="reg-submit"
                        type="submit"
                        className="btn btn-primary btn-full btn-lg"
                        disabled={loading}
                        style={{ marginTop: 4 }}
                    >
                        {loading
                            ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Creating account...</>
                            : 'Create Account'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13.5, color: 'var(--text-3)' }}>
                    Already have an account?{' '}
                    <Link to="/login" className="auth-link">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
