import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// SVG icon components — no emojis
const Icons = {
    Dashboard: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
        </svg>
    ),
    Settings: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    ),
    Rocket: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
            <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
            <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
            <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
        </svg>
    ),
    Lightbulb: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="9" y1="18" x2="15" y2="18" /><line x1="10" y1="22" x2="14" y2="22" />
            <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
        </svg>
    ),
    DollarSign: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    ),
    Lock: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    ),
    Search: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    ),
    TrendingUp: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
        </svg>
    ),
    Flask: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 3h6l3 9-6 9H9L3 12z" /><path d="M6 3h12" />
        </svg>
    ),
    GraduationCap: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
    ),
    MessageSquare: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    ),
    Globe: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    ),
    Bell: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
    ),
    BarChart: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
    ),
    Chevron: ({ open }) => (
        <svg
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
            <polyline points="6 9 12 15 18 9" />
        </svg>
    ),
};

const NAV = [
    {
        section: 'Overview',
        items: [
            { to: '/dashboard', Icon: Icons.Dashboard, label: 'Dashboard' },
            { to: '/admin-panel', Icon: Icons.Settings, label: 'Admin Panel', roles: ['ADMIN'] },
        ],
    },
    {
        section: 'Startup',
        items: [
            { to: '/startups', Icon: Icons.Rocket, label: 'Startups', roles: ['STARTUP', 'ADMIN'] },
            { to: '/my-ideas', Icon: Icons.Lightbulb, label: 'My Ideas', roles: ['STARTUP'] },
            { to: '/funding-applications', Icon: Icons.DollarSign, label: 'Funding', roles: ['STARTUP', 'INVESTOR', 'ADMIN'] },
            { to: '/document-vault', Icon: Icons.Lock, label: 'Documents', roles: ['STARTUP', 'INVESTOR', 'ADMIN'] },
        ],
    },
    {
        section: 'Investing',
        items: [
            { to: '/explore', Icon: Icons.Search, label: 'Explore Startups', roles: ['INVESTOR', 'RESEARCHER'] },
            { to: '/my-investments', Icon: Icons.TrendingUp, label: 'My Investments', roles: ['INVESTOR'] },
        ],
    },
    {
        section: 'Research',
        items: [
            { to: '/research', Icon: Icons.Flask, label: 'Research Hub', roles: ['RESEARCHER'] },
        ],
    },
    {
        section: 'Mentorship',
        items: [
            { to: '/mentors', Icon: Icons.GraduationCap, label: 'Mentors', roles: ['STARTUP', 'MENTOR', 'ADMIN'] },
        ],
    },
    {
        section: 'Community',
        items: [
            { to: '/messages', Icon: Icons.MessageSquare, label: 'Messages' },
            { to: '/forum', Icon: Icons.Globe, label: 'Forum' },
            { to: '/notifications', Icon: Icons.Bell, label: 'Notifications' },
        ],
    },
    {
        section: 'Insights',
        items: [
            { to: '/analytics', Icon: Icons.BarChart, label: 'Analytics' },
        ],
    },
];

export default function Sidebar({ isOpen }) {
    const { user } = useAuth();

    // Track which sections are collapsed (initially all expanded)
    const [collapsed, setCollapsed] = useState({});
    const toggleSection = (section) => {
        setCollapsed(prev => ({ ...prev, [section]: !prev[section] }));
    };

    return (
        <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
            {/* Logo area */}
            <NavLink to="/dashboard" className="sidebar-logo" style={{ padding: '24px 20px', borderBottom: 'none' }}>
                <div className="logo-icon" style={{ 
                    width: 42, height: 42, 
                    background: 'linear-gradient(135deg, var(--violet), var(--teal))',
                    boxShadow: '0 0 20px var(--violet-dim)'
                }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                </div>
                <div>
                    <div className="logo-text" style={{ fontSize: '20px', letterSpacing: '-0.5px' }}>VentureHub</div>
                    <div className="logo-sub" style={{ opacity: 0.6, fontSize: '11px' }}>Global Ecosystem</div>
                </div>
            </NavLink>

            {/* Nav */}
            <nav className="sidebar-nav">
                {NAV.map(({ section, items }) => {
                    const visible = items.filter(
                        item => !item.roles || (user && item.roles.includes(user.role))
                    );
                    if (visible.length === 0) return null;

                    const isOpen = !collapsed[section];

                    return (
                        <div key={section} style={{ marginBottom: 2 }}>
                            {/* Section header — clickable to collapse */}
                            <button
                                onClick={() => toggleSection(section)}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '4px 10px 4px 12px',
                                    background: 'none', border: 'none',
                                    cursor: 'pointer', borderRadius: 6,
                                    transition: 'background 0.15s',
                                    marginBottom: 2,
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                            >
                                <span className="nav-section-title" style={{ margin: 0, padding: 0 }}>
                                    {section}
                                </span>
                                <span style={{ color: 'var(--text-3)', opacity: 0.6 }}>
                                    <Icons.Chevron open={isOpen} />
                                </span>
                            </button>

                            {/* Items — animate open/close */}
                            <div style={{
                                overflow: 'hidden',
                                maxHeight: isOpen ? `${visible.length * 44}px` : '0px',
                                transition: 'max-height 0.22s ease',
                                marginBottom: isOpen ? 4 : 0,
                            }}>
                                {visible.map((item) => (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                                    >
                                        <span className="nav-icon"><item.Icon /></span>
                                        {item.to === '/mentors' && user?.role === 'MENTOR'
                                            ? 'Available Startups'
                                            : item.label}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    );
                })
                }
            </nav>
            {/* User Profile in Sidebar Footer */}
            <div style={{ marginTop: 'auto', padding: '16px' }}>
                <div style={{
                    padding: '12px',
                    borderRadius: 'var(--r-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--violet), var(--teal))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 'bold', fontSize: '12px'
                    }}>
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user?.name || 'User'}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {user?.role}
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
