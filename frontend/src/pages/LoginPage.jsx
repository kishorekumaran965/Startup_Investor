import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authApi } from '../api';

export default function LoginPage() {
    const { login } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await authApi.login(form);
            login(data);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
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
            {/* Background blobs */}
            <div className="auth-bg-blob" style={{ width: 500, height: 500, background: 'var(--accent)', top: '-100px', left: '-150px' }} />
            <div className="auth-bg-blob" style={{ width: 400, height: 400, background: 'var(--accent-3)', bottom: '-100px', right: '-100px' }} />

            <div className="auth-card">
                <div className="auth-logo">
                    <div className="logo-icon" style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>⚡</div>
                    <div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>VentureHub</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Startup Ecosystem</div>
                    </div>
                </div>

                <h1 className="auth-title">Welcome back</h1>
                <p className="auth-sub">Sign in to access your VentureHub dashboard</p>

                {error && <div className="alert alert-error">⚠ {error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            id="login-email"
                            name="email"
                            type="email"
                            className="form-input"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            id="login-password"
                            name="password"
                            type="password"
                            className="form-input"
                            placeholder="Enter your password"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <button id="login-submit" type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                        {loading ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in...</> : '→ Sign In'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-muted)' }}>
                    Don&apos;t have an account?{' '}
                    <Link to="/register" className="auth-link">Create one free</Link>
                </p>
            </div>
        </div>
    );
}
