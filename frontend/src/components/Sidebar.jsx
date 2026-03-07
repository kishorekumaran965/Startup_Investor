import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
    {
        section: 'Overview', items: [
            { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
            { to: '/admin-panel', icon: '⚙️', label: 'Admin Panel', roles: ['ADMIN'] },
        ]
    },
    {
        section: 'Startup', items: [
            { to: '/startups', icon: '🚀', label: 'Startups', roles: ['STARTUP', 'ADMIN'] },
            { to: '/my-ideas', icon: '💡', label: 'My Ideas', roles: ['STARTUP'] },
            { to: '/funding-applications', icon: '💰', label: 'Funding Apps', roles: ['STARTUP', 'INVESTOR', 'ADMIN'] },
        ]
    },
    {
        section: 'Investment', items: [
            { to: '/explore', icon: '🔍', label: 'Explore Startups', roles: ['INVESTOR', 'RESEARCHER'] },
            { to: '/my-investments', icon: '💰', label: 'My Investments', roles: ['INVESTOR'] },
        ]
    },
    {
        section: 'Research', items: [
            { to: '/research', icon: '🔬', label: 'Research Hub', roles: ['RESEARCHER'] },
        ]
    },
    {
        section: 'Mentorship', items: [
            { to: '/mentors', icon: '🎓', label: 'Mentors', roles: ['STARTUP', 'MENTOR', 'ADMIN'] },
        ]
    },
    {
        section: 'Communication', items: [
            { to: '/messages', icon: '💬', label: 'Messages' },
            { to: '/notifications', icon: '🔔', label: 'Notifications' },
        ]
    },
    {
        section: 'Analytics', items: [
            { to: '/analytics', icon: '📊', label: 'Analytics' },
        ]
    },
];

export default function Sidebar() {
    const { user } = useAuth();

    return (
        <aside className="sidebar">
            <NavLink to="/dashboard" className="sidebar-logo">
                <div className="logo-icon">⚡</div>
                <div>
                    <div className="logo-text">VentureHub</div>
                    <div className="logo-sub">Startup Ecosystem</div>
                </div>
            </NavLink>

            <nav className="sidebar-nav">
                {NAV_ITEMS.map((section) => {
                    const visibleItems = section.items.filter(item =>
                        !item.roles || (user && item.roles.includes(user.role))
                    );
                    if (visibleItems.length === 0) return null;
                    return (
                        <div key={section.section}>
                            <div className="nav-section-title">{section.section}</div>
                            {visibleItems.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                                >
                                    <span className="nav-icon">{item.icon}</span>
                                    {item.to === '/mentors' && user?.role === 'MENTOR' ? 'Available Startups' : item.label}
                                </NavLink>
                            ))}
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
}
