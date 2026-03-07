import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { startupsApi, fundingAppApi, usersApi, notificationsApi, mentorsApi, projectsApi } from '../api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement);

const roleColors = { ADMIN: '#ef4444', STARTUP: '#6366f1', INVESTOR: '#10b981', MENTOR: '#f59e0b', RESEARCHER: '#06b6d4' };

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ startups: 0, applications: 0, users: 0, pending: 0, approved: 0, rejected: 0, notifications: 0 });
    const [startups, setStartups] = useState([]);
    const [applications, setApplications] = useState([]);
    const [pendingMentorsCount, setPendingMentorsCount] = useState(0);
    const [researchStats, setResearchStats] = useState({ projects: 0, patents: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                let s = [];
                let a = [];
                let myP = [];

                if (user?.role === 'ADMIN') {
                    [s, a] = await Promise.all([
                        startupsApi.getAll().catch(() => []),
                        fundingAppApi.getAll().catch(() => []),
                    ]);
                } else if (user?.role === 'STARTUP') {
                    s = await usersApi.getStartups(user.id).catch(() => []);
                    const allApps = await Promise.all(s.map(startup => fundingAppApi.getByStartup(startup.id).catch(() => [])));
                    a = allApps.flat();
                } else if (user?.role === 'INVESTOR') {
                    [s, a] = await Promise.all([
                        startupsApi.getAll().catch(() => []),
                        fundingAppApi.getByInvestor(user.id).catch(() => []),
                    ]);
                } else if (user?.role === 'RESEARCHER') {
                    [s, myP] = await Promise.all([
                        startupsApi.getAll().catch(() => []),
                        projectsApi.getByResearcher(user.id).catch(() => []),
                    ]);
                    const patentCount = myP.reduce((acc, p) => acc + (p.patents?.length || 0), 0);
                    setResearchStats({ projects: myP.length, patents: patentCount });
                } else {
                    s = await startupsApi.getAll().catch(() => []);
                }

                setStartups(s);
                setApplications(a);

                const pending = a.filter(x => x.status === 'PENDING').length;
                const approved = a.filter(x => x.status === 'APPROVED').length;
                const rejected = a.filter(x => x.status === 'REJECTED').length;

                let userCount = 0;
                let notifCount = 0;

                if (user?.role === 'ADMIN') {
                    const [u, pm] = await Promise.all([
                        usersApi.getAll().catch(() => []),
                        mentorsApi.getPending().catch(() => []),
                    ]);
                    userCount = u.length;
                    setPendingMentorsCount(pm.length);
                }

                if (user?.id) {
                    const n = await notificationsApi.getUnread(user.id).catch(() => []);
                    notifCount = Array.isArray(n) ? n.length : 0;
                }

                setStats({
                    startups: s.length,
                    applications: a.length,
                    users: userCount,
                    pending,
                    approved,
                    rejected,
                    notifications: notifCount
                });
            } finally {
                setLoading(false);
            }
        };
        if (user) load();
    }, [user]);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    const stageData = {
        labels: ['IDEA', 'MVP', 'GROWTH', 'SCALING'],
        datasets: [{
            data: ['IDEA', 'MVP', 'GROWTH', 'SCALING'].map(s => startups.filter(x => x.stage === s).length),
            backgroundColor: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b'],
            borderWidth: 0,
        }]
    };

    const fundingStatusData = {
        labels: ['Pending', 'Approved', 'Rejected'],
        datasets: [{
            label: 'Applications',
            data: [stats.pending, stats.approved, stats.rejected],
            backgroundColor: ['rgba(245,158,11,0.7)', 'rgba(16,185,129,0.7)', 'rgba(239,68,68,0.7)'],
            borderRadius: 8,
            borderSkipped: false,
        }]
    };

    const industryMap = {};
    startups.forEach(s => {
        const ind = s.industry || s.sector || 'Other';
        industryMap[ind] = (industryMap[ind] || 0) + 1;
    });
    const industryData = {
        labels: Object.keys(industryMap),
        datasets: [{
            data: Object.values(industryMap),
            backgroundColor: ['#6366f1', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'],
            borderWidth: 0,
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 }, padding: 12 } } },
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
            y: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { color: '#94a3b8', stepSize: 1 } },
        },
    };

    const roleLabel = { STARTUP: '🚀 Founder', INVESTOR: '💰 Investor', MENTOR: '🎓 Mentor', RESEARCHER: '🔬 Researcher', ADMIN: '⚙️ Admin' };

    const quickActions = {
        STARTUP: [{ label: '💡 My Ideas', href: '/my-ideas' }, { label: '📊 Analytics', href: '/analytics' }, { label: '🎓 Find Mentors', href: '/mentors' }, { label: '🔔 Notifications', href: '/notifications' }],
        INVESTOR: [{ label: '🔍 Explore Startups', href: '/explore' }, { label: '💰 My Investments', href: '/my-investments' }, { label: '📊 Analytics', href: '/analytics' }, { label: '💬 Messages', href: '/messages' }],
        MENTOR: [{ label: '🚀 Available Startups', href: '/mentors' }, { label: '🔍 Explore All', href: '/explore' }, { label: '💬 Messages', href: '/messages' }, { label: '🔔 Notifications', href: '/notifications' }],
        RESEARCHER: [{ label: '🔍 Explore Ideas', href: '/explore' }, { label: '🔬 Research Hub', href: '/research' }, { label: '💬 Contact Teams', href: '/messages' }, { label: '🔔 Notifications', href: '/notifications' }],
        ADMIN: [{ label: '👥 Manage Users', href: '/users' }, { label: '⚙️ Admin Panel', href: '/admin-panel' }, { label: '📊 Analytics', href: '/analytics' }, { label: '🔔 Notifications', href: '/notifications' }],
    };

    return (
        <div className="page-container">
            <div className="hero-section" style={{ marginBottom: 28 }}>
                <div className="hero-greeting">{greeting} 👋</div>
                <h1 className="hero-title">
                    {user?.role === 'ADMIN' ? 'Admin ' : 'Welcome to '}
                    <span className="gradient-text">{user?.role === 'ADMIN' ? 'Command Center' : 'VentureHub'}</span>
                </h1>
                <p className="hero-subtitle">
                    {user?.role === 'STARTUP' && 'Scale your ideas, track funding, and grow your team.'}
                    {user?.role === 'INVESTOR' && 'Track your portfolio and discover the next big thing.'}
                    {user?.role === 'MENTOR' && 'Expert guidance for the next generation of founders.'}
                    {user?.role === 'RESEARCHER' && 'Bridge the gap between research and commercial success.'}
                    {user?.role === 'ADMIN' && 'Comprehensive platform oversight and ecosystem management.'}
                </p>
                <div style={{ marginTop: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span className="badge badge-purple">{roleLabel[user?.role] || user?.role}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user?.email}</span>
                    {stats.notifications > 0 && (
                        <a href="/notifications" className="badge badge-amber" style={{ textDecoration: 'none' }}>
                            🔔 {stats.notifications} unread notification{stats.notifications > 1 ? 's' : ''}
                        </a>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="loading-screen"><div className="spinner" /><span>Assembling your dashboard...</span></div>
            ) : (
                <>
                    {/* Role-Specific Stats Grid */}
                    <div className="stats-grid">
                        {user?.role === 'ADMIN' ? (
                            <>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>🚀</div><div><div className="stat-value">{stats.startups}</div><div className="stat-label">Total Startups</div></div></div>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>💰</div><div><div className="stat-value">{stats.applications}</div><div className="stat-label">Total Applications</div></div></div>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)' }}>👥</div><div><div className="stat-value">{stats.users}</div><div className="stat-label">Platform Users</div></div></div>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>🎓</div><div><div className="stat-value">{pendingMentorsCount}</div><div className="stat-label">Pending Mentors</div></div></div>
                            </>
                        ) : user?.role === 'STARTUP' ? (
                            <>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>💡</div><div><div className="stat-value">{stats.startups}</div><div className="stat-label">My Projects</div></div></div>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>💰</div><div><div className="stat-value">{stats.applications}</div><div className="stat-label">Funding Applied</div></div></div>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>⏳</div><div><div className="stat-value">{stats.pending}</div><div className="stat-label">Pending Apps</div></div></div>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>✅</div><div><div className="stat-value">{stats.approved}</div><div className="stat-label">Approved Funding</div></div></div>
                            </>
                        ) : user?.role === 'INVESTOR' ? (
                            <>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>🔍</div><div><div className="stat-value">{stats.startups}</div><div className="stat-label">Available Startups</div></div></div>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>👜</div><div><div className="stat-value">{stats.applications}</div><div className="stat-label">My Portfolio</div></div></div>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>⏳</div><div><div className="stat-value">{stats.pending}</div><div className="stat-label">Pending Reviews</div></div></div>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>🤝</div><div><div className="stat-value">{stats.approved}</div><div className="stat-label">Committed Funds</div></div></div>
                            </>
                        ) : user?.role === 'RESEARCHER' ? (
                            <>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(6,182,212,0.15)' }}>🔬</div><div><div className="stat-value">{researchStats.projects}</div><div className="stat-label">My Research</div></div></div>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(139,92,246,0.15)' }}>📜</div><div><div className="stat-value">{researchStats.patents}</div><div className="stat-label">Total Patents</div></div></div>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>💡</div><div><div className="stat-value">{stats.startups}</div><div className="stat-label">Shared Ideas</div></div></div>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>✅</div><div><div className="stat-value">Live</div><div className="stat-label">Status</div></div></div>
                            </>
                        ) : (
                            <>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>🚀</div><div><div className="stat-value">{stats.startups}</div><div className="stat-label">Total Startups</div></div></div>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(6,182,212,0.15)' }}>✅</div><div><div className="stat-value">Active</div><div className="stat-label">Platform</div></div></div>
                            </>
                        )}
                    </div>

                    {/* Charts & Analytics */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginTop: 24 }}>
                        {(user?.role === 'ADMIN' || user?.role === 'INVESTOR') && (
                            <div className="card">
                                <div className="section-title">📊 Ecosystem Progress</div>
                                <div className="section-subtitle">Startup lifecycle distribution</div>
                                <div style={{ height: 220, marginTop: 20 }}><Doughnut data={stageData} options={chartOptions} /></div>
                            </div>
                        )}
                        {(user?.role === 'STARTUP' || user?.role === 'INVESTOR') && (
                            <div className="card">
                                <div className="section-title">💰 Funding Funnel</div>
                                <div className="section-subtitle">Application approval metrics</div>
                                <div style={{ height: 220, marginTop: 20 }}><Bar data={fundingStatusData} options={barOptions} /></div>
                            </div>
                        )}
                        <div className="card">
                            <div className="section-title">🏢 Industry Focus</div>
                            <div className="section-subtitle">Sector-wise concentration</div>
                            <div style={{ height: 220, marginTop: 20 }}><Doughnut data={industryData} options={chartOptions} /></div>
                        </div>
                    </div>

                    {/* Quick Actions Row */}
                    <div className="card" style={{ marginTop: 24 }}>
                        <div className="section-header">
                            <div><div className="section-title">⚡ Targeted Actions</div><div className="section-subtitle">Shortcuts tailored for your role</div></div>
                        </div>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
                            {(quickActions[user?.role] || quickActions.STARTUP).map(a => (
                                <a key={a.href} href={a.href} className="btn btn-secondary">{a.label}</a>
                            ))}
                        </div>
                    </div>

                    {/* Detailed Data Row */}
                    <div className="card" style={{ marginTop: 24, paddingBottom: 0 }}>
                        <div className="section-header">
                            <div>
                                <div className="section-title">
                                    {user?.role === 'STARTUP' ? 'My Ventures' : user?.role === 'INVESTOR' ? 'Explore Opportunities' : 'Ecosystem Overview'}
                                </div>
                                <div className="section-subtitle">Detailed breakdown of current entities</div>
                            </div>
                            <a href="/startups" className="btn btn-secondary btn-sm">View Full List →</a>
                        </div>
                        
                        {startups.length === 0 ? (
                            <div className="empty-state" style={{ padding: '60px 0' }}>
                                <div className="empty-state-icon">📁</div>
                                <h3>Nothing to show yet</h3>
                                <p>Get started by exploring the platform or creating a entry.</p>
                            </div>
                        ) : (
                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Entity Name</th>
                                            <th>Category</th>
                                            <th>Status / Stage</th>
                                            <th>Key Metric</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {startups.slice(0, 5).map((s) => (
                                            <tr key={s.id}>
                                                <td><div style={{ fontWeight: 600 }}>{s.name}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.description?.slice(0, 50)}...</div></td>
                                                <td><span className="badge badge-purple">{s.industry || s.sector || 'N/A'}</span></td>
                                                <td><span className="badge badge-cyan">{s.stage || 'IDEA'}</span></td>
                                                <td style={{ fontWeight: 600, color: 'var(--success)' }}>{s.fundingGoal ? `$${Number(s.fundingGoal).toLocaleString()}` : '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
