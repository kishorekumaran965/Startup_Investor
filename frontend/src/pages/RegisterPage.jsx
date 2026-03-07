import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authApi } from '../api';

const ROLES = [
    { value: 'STARTUP', label: '🚀 Startup Founder', desc: 'Build and grow your startup' },
    { value: 'INVESTOR', label: '💰 Investor', desc: 'Fund promising startups' },
    { value: 'MENTOR', label: '🎓 Mentor', desc: 'Guide early-stage startups' },
    { value: 'RESEARCHER', label: '🔬 Researcher', desc: 'Share research & patents' },
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
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <button
                onClick={toggleTheme}
                style={{
                    position: 'absolute',
                    top: 24,
                    right: 24,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: 20,
                    zIndex: 100,
                    boxShadow: 'var(--shadow-md)'
                }}
            >
                {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <div className="auth-bg-blob" style={{ width: 400, height: 400, background: 'var(--accent-2)', top: '-50px', right: '-50px' }} />
            <div className="auth-bg-blob" style={{ width: 350, height: 350, background: 'var(--accent)', bottom: '-80px', left: '-80px' }} />

            <div className="auth-card" style={{ maxWidth: 520 }}>
                <div className="auth-logo">
                    <div className="logo-icon" style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>⚡</div>
                    <div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>VentureHub</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Startup Ecosystem</div>
                    </div>
                </div>

                <h1 className="auth-title">Create your account</h1>
                <p className="auth-sub">Join the ecosystem — connect with startups, investors, and mentors</p>

                {error && <div className="alert alert-error">⚠ {error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input id="reg-name" name="name" type="text" className="form-input" placeholder="John Doe" value={form.name} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input id="reg-email" name="email" type="email" className="form-input" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input id="reg-password" name="password" type="password" className="form-input" placeholder="Min. 8 characters" value={form.password} onChange={handleChange} required minLength={6} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Your Role</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {ROLES.map((role) => (
                                <label key={role.value} style={{
                                    display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px',
                                    border: `1px solid ${form.role === role.value ? 'var(--accent)' : 'var(--border)'}`,
                                    borderRadius: 'var(--radius-sm)',
                                    background: form.role === role.value ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                                    cursor: 'pointer', transition: 'var(--transition-fast)',
                                }}>
                                    <input type="radio" name="role" value={role.value} checked={form.role === role.value} onChange={handleChange} style={{ marginTop: 3 }} />
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{role.label}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{role.desc}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <button id="reg-submit" type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: 8 }}>
                        {loading ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Creating account...</> : '→ Create Account'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
                    Already have an account?{' '}
                    <Link to="/login" className="auth-link">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
