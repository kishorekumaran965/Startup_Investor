import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { startupsApi, fundingAppApi, usersApi, notificationsApi, mentorsApi, projectsApi } from '../api';
import {
    Chart as ChartJS,
    ArcElement, Tooltip, Legend,
    CategoryScale, LinearScale,
    BarElement, PointElement, LineElement,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
    ArcElement, Tooltip, Legend,
    CategoryScale, LinearScale,
    BarElement, PointElement, LineElement,
);

// map role → friendly greeting suffix
const ROLE_BLURBS = {
    STARTUP: 'Ready to push your startup forward?',
    INVESTOR: 'Let\'s see what\'s happening in your portfolio.',
    MENTOR: 'Founders are counting on you today.',
    RESEARCHER: 'Your research drives real-world change.',
    ADMIN: 'Platform overview — everything at a glance.',
};

const ROLE_LABELS = {
    STARTUP: 'Founder',
    INVESTOR: 'Investor',
    MENTOR: 'Mentor',
    RESEARCHER: 'Researcher',
    ADMIN: 'Admin',
};

// role → quick action links
const QUICK_LINKS = {
    STARTUP: [
        { label: 'My Ideas', href: '/my-ideas' },
        { label: 'Apply for Funding', href: '/funding-applications' },
        { label: 'Find a Mentor', href: '/mentors' },
        { label: 'Notifications', href: '/notifications' },
    ],
    INVESTOR: [
        { label: 'Explore Startups', href: '/explore' },
        { label: 'My Investments', href: '/my-investments' },
        { label: 'Funding Decisions', href: '/funding-applications' },
        { label: 'Messages', href: '/messages' },
    ],
    MENTOR: [
        { label: 'Startups I\'m Helping', href: '/mentors' },
        { label: 'Explore All', href: '/explore' },
        { label: 'Messages', href: '/messages' },
        { label: 'Notifications', href: '/notifications' },
    ],
    RESEARCHER: [
        { label: 'Explore Ideas', href: '/explore' },
        { label: 'My Research', href: '/research' },
        { label: 'Contact a Team', href: '/messages' },
        { label: 'Notifications', href: '/notifications' },
    ],
    ADMIN: [
        { label: 'Manage Users', href: '/users' },
        { label: 'Admin Panel', href: '/admin-panel' },
        { label: 'Analytics', href: '/analytics' },
        { label: 'Notifications', href: '/notifications' },
    ],
};

function greeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
}

export default function DashboardPage() {
    const { user } = useAuth();

    const [stats, setStats] = useState({ startups: 0, applications: 0, users: 0, pending: 0, approved: 0, rejected: 0, notifications: 0 });
    const [startups, setStartups] = useState([]);
    const [applications, setApplications] = useState([]);
    const [pendingMentors, setPendingMentors] = useState(0);
    const [researchStats, setResearchStats] = useState({ projects: 0, patents: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        loadData();
    }, [user]);

    const loadData = async () => {
        try {
            let s = [], a = [], myP = [];

            if (user.role === 'ADMIN') {
                [s, a] = await Promise.all([
                    startupsApi.getAll().catch(() => []),
                    fundingAppApi.getAll().catch(() => []),
                ]);
            } else if (user.role === 'STARTUP') {
                s = await usersApi.getStartups(user.id).catch(() => []);
                const perStartup = await Promise.all(s.map(st => fundingAppApi.getByStartup(st.id).catch(() => [])));
                a = perStartup.flat();
            } else if (user.role === 'INVESTOR') {
                [s, a] = await Promise.all([
                    startupsApi.getAll().catch(() => []),
                    fundingAppApi.getByInvestor(user.id).catch(() => []),
                ]);
            } else if (user.role === 'RESEARCHER') {
                [s, myP] = await Promise.all([
                    startupsApi.getAll().catch(() => []),
                    projectsApi.getByResearcher(user.id).catch(() => []),
                ]);
                const patents = myP.reduce((sum, p) => sum + (p.patents?.length || 0), 0);
                setResearchStats({ projects: myP.length, patents });
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

            if (user.role === 'ADMIN') {
                const [u, pm] = await Promise.all([
                    usersApi.getAll().catch(() => []),
                    mentorsApi.getPending().catch(() => []),
                ]);
                userCount = u.length;
                setPendingMentors(pm.length);
            }

            if (user.id) {
                const n = await notificationsApi.getUnread(user.id).catch(() => []);
                notifCount = Array.isArray(n) ? n.length : 0;
            }

            setStats({ startups: s.length, applications: a.length, users: userCount, pending, approved, rejected, notifications: notifCount });
        } finally {
            setLoading(false);
        }
    };

    // chart data
    const stages = ['IDEA', 'MVP', 'GROWTH', 'SCALING'];
    const stageData = {
        labels: stages,
        datasets: [{
            data: stages.map(st => startups.filter(x => x.stage === st).length),
            backgroundColor: ['#7c6fcd', '#3fb9c5', '#3dba78', '#e8a838'],
            borderWidth: 0,
        }],
    };

    const fundingData = {
        labels: ['Pending', 'Approved', 'Rejected'],
        datasets: [{
            label: 'Applications',
            data: [stats.pending, stats.approved, stats.rejected],
            backgroundColor: ['rgba(232,168,56,0.7)', 'rgba(61,186,120,0.7)', 'rgba(224,92,92,0.7)'],
            borderRadius: 6,
            borderSkipped: false,
        }],
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
            backgroundColor: ['#7c6fcd', '#ec4899', '#3fb9c5', '#3dba78', '#e8a838', '#e05c5c', '#8b5cf6', '#14b8a6'],
            borderWidth: 0,
        }],
    };

    const donutOpts = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { color: '#8b949e', font: { size: 11 }, padding: 10 },
            },
        },
    };

    const barOpts = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { display: false }, ticks: { color: '#8b949e' } },
            y: { grid: { color: 'rgba(139,148,158,0.1)' }, ticks: { color: '#8b949e', stepSize: 1 } },
        },
    };

    const links = QUICK_LINKS[user?.role] || QUICK_LINKS.STARTUP;

    return (
        <div className="page-container">

            {/* Welcome banner */}
            <div className="hero-section" style={{ marginBottom: 22 }}>
                <div className="hero-greeting">{greeting()}</div>
                <h1 className="hero-title">
                    {user?.role === 'ADMIN'
                        ? <>Admin <span className="gradient-text">Command Center</span></>
                        : <>Welcome to <span className="gradient-text">VentureHub</span></>}
                </h1>
                <p className="hero-subtitle">{ROLE_BLURBS[user?.role]}</p>

                <div style={{ marginTop: 18, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="badge badge-purple">{ROLE_LABELS[user?.role] || user?.role}</span>
                    <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{user?.email}</span>
                    {stats.notifications > 0 && (
                        <a href="/notifications" className="badge badge-amber" style={{ textDecoration: 'none' }}>
                            {stats.notifications} unread
                        </a>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="loading-screen">
                    <div className="spinner" />
                    <span>Loading your dashboard...</span>
                </div>
            ) : (
                <>
                    {/* Stat cards */}
                    <div className="stats-grid">
                        {user?.role === 'ADMIN' && <>
                            <StatCard icon="ST" value={stats.startups} label="Total startups" color="rgba(124,111,205,0.15)" />
                            <StatCard icon="AP" value={stats.applications} label="Applications" color="rgba(61,186,120,0.15)" />
                            <StatCard icon="US" value={stats.users} label="Platform users" color="rgba(224,92,92,0.15)" />
                            <StatCard icon="MN" value={pendingMentors} label="Mentors pending" color="rgba(232,168,56,0.15)" />
                        </>}

                        {user?.role === 'STARTUP' && <>
                            <StatCard icon="PR" value={stats.startups} label="My projects" color="rgba(124,111,205,0.15)" />
                            <StatCard icon="FD" value={stats.applications} label="Funding applied" color="rgba(61,186,120,0.15)" />
                            <StatCard icon="PD" value={stats.pending} label="Pending review" color="rgba(232,168,56,0.15)" />
                            <StatCard icon="OK" value={stats.approved} label="Approved" color="rgba(61,186,120,0.15)" />
                        </>}

                        {user?.role === 'INVESTOR' && <>
                            <StatCard icon="EX" value={stats.startups} label="Available startups" color="rgba(124,111,205,0.15)" />
                            <StatCard icon="PF" value={stats.applications} label="My portfolio" color="rgba(61,186,120,0.15)" />
                            <StatCard icon="PD" value={stats.pending} label="Pending decisions" color="rgba(232,168,56,0.15)" />
                            <StatCard icon="CM" value={stats.approved} label="Committed" color="rgba(61,186,120,0.15)" />
                        </>}

                        {user?.role === 'RESEARCHER' && <>
                            <StatCard icon="RS" value={researchStats.projects} label="My research" color="rgba(63,185,197,0.15)" />
                            <StatCard icon="PT" value={researchStats.patents} label="Total patents" color="rgba(139,92,246,0.15)" />
                            <StatCard icon="ID" value={stats.startups} label="Shared ideas" color="rgba(124,111,205,0.15)" />
                            <StatCard icon="OK" value="Live" label="Status" color="rgba(61,186,120,0.15)" />
                        </>}

                        {user?.role === 'MENTOR' && <>
                            <StatCard icon="ST" value={stats.startups} label="Active startups" color="rgba(124,111,205,0.15)" />
                            <StatCard icon="OK" value="Active" label="Your status" color="rgba(61,186,120,0.15)" />
                        </>}
                    </div>

                    {/* Charts */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18, marginTop: 8 }}>
                        {(user?.role === 'ADMIN' || user?.role === 'INVESTOR') && (
                            <div className="card">
                                <div className="section-title" style={{ marginBottom: 4 }}>Startup stages</div>
                                <div className="section-subtitle">Lifecycle distribution</div>
                                <div style={{ height: 210, marginTop: 16 }}>
                                    <Doughnut data={stageData} options={donutOpts} />
                                </div>
                            </div>
                        )}

                        {(user?.role === 'STARTUP' || user?.role === 'INVESTOR') && (
                            <div className="card">
                                <div className="section-title" style={{ marginBottom: 4 }}>Funding funnel</div>
                                <div className="section-subtitle">Application outcomes</div>
                                <div style={{ height: 210, marginTop: 16 }}>
                                    <Bar data={fundingData} options={barOpts} />
                                </div>
                            </div>
                        )}

                        <div className="card">
                            <div className="section-title" style={{ marginBottom: 4 }}>Industry mix</div>
                            <div className="section-subtitle">Sector breakdown</div>
                            <div style={{ height: 210, marginTop: 16 }}>
                                <Doughnut data={industryData} options={donutOpts} />
                            </div>
                        </div>
                    </div>

                    {/* Quick links */}
                    <div className="card" style={{ marginTop: 18 }}>
                        <div className="section-header">
                            <div>
                                <div className="section-title">Quick actions</div>
                                <div className="section-subtitle">Tailored for your role</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            {links.map(link => (
                                <a key={link.href} href={link.href} className="btn btn-ghost">
                                    {link.label}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Startups table */}
                    <div className="card" style={{ marginTop: 18, paddingBottom: 0 }}>
                        <div className="section-header">
                            <div>
                                <div className="section-title">
                                    {user?.role === 'STARTUP' ? 'My ventures' : 'Ecosystem overview'}
                                </div>
                                <div className="section-subtitle">Recent entries</div>
                            </div>
                            <a href="/startups" className="btn btn-ghost btn-sm">See all →</a>
                        </div>

                        {startups.length === 0 ? (
                            <div className="empty-state" style={{ padding: '48px 0' }}>
                                <h3>Nothing here yet</h3>
                                <p>Start by creating a startup or exploring the platform.</p>
                            </div>
                        ) : (
                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Industry</th>
                                            <th>Stage</th>
                                            <th>Funding goal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {startups.slice(0, 5).map(s => (
                                            <tr key={s.id}>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>{s.name}</div>
                                                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>
                                                        {s.description?.slice(0, 55)}{s.description?.length > 55 ? '...' : ''}
                                                    </div>
                                                </td>
                                                <td><span className="badge badge-purple">{s.industry || s.sector || '—'}</span></td>
                                                <td><span className="badge badge-cyan">{s.stage || 'IDEA'}</span></td>
                                                <td style={{ fontWeight: 600, color: 'var(--green)' }}>
                                                    {s.fundingGoal ? `$${Number(s.fundingGoal).toLocaleString()}` : '—'}
                                                </td>
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

// small helper component so stat cards aren't 3-line JSX inline
function StatCard({ icon, value, label, color }) {
    return (
        <div className="stat-card">
            <div className="stat-icon" style={{ background: color }}>{icon}</div>
            <div>
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
            </div>
        </div>
    );
}
