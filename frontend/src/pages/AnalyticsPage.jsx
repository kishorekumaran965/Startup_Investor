import React, { useEffect, useState } from 'react';
import { startupsApi, fundingAppApi, usersApi, mentorsApi, projectsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler } from 'chart.js';
import { Doughnut, Bar, Line, Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler);

export default function AnalyticsPage() {
    const { user } = useAuth();
    const [startups, setStartups] = useState([]);
    const [applications, setApplications] = useState([]);
    const [users, setUsers] = useState([]);
    const [mentors, setMentors] = useState([]);
    const [researchProjects, setResearchProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                let s = [], a = [], u = [], m = [], rp = [];

                if (user?.role === 'ADMIN') {
                    [s, a, u, m, rp] = await Promise.all([
                        startupsApi.getAll().catch(() => []),
                        fundingAppApi.getAll().catch(() => []),
                        usersApi.getAll().catch(() => []),
                        mentorsApi.getAll().catch(() => []),
                        projectsApi.getAll().catch(() => []),
                    ]);
                } else if (user?.role === 'STARTUP') {
                    s = await usersApi.getStartups(user.id).catch(() => []);
                    const allApps = await Promise.all(s.map(startup => fundingAppApi.getByStartup(startup.id).catch(() => [])));
                    a = allApps.flat();
                } else if (user?.role === 'INVESTOR') {
                    [s, a, m] = await Promise.all([
                        startupsApi.getAll().catch(() => []),
                        fundingAppApi.getByInvestor(user.id).catch(() => []),
                        mentorsApi.getAll().catch(() => []),
                    ]);
                } else if (user?.role === 'RESEARCHER') {
                    [s, rp] = await Promise.all([
                        startupsApi.getAll().catch(() => []),
                        projectsApi.getByResearcher(user.id).catch(() => []),
                    ]);
                } else {
                    [s, m] = await Promise.all([
                        startupsApi.getAll().catch(() => []),
                        mentorsApi.getAll().catch(() => []),
                    ]);
                }

                setStartups(s);
                setApplications(a);
                setUsers(u);
                setMentors(m);
                setResearchProjects(rp);
            } finally {
                setLoading(false);
            }
        };
        if (user) load();
    }, [user]);

    // Data Processing
    const stageLabels = ['IDEA', 'MVP', 'GROWTH', 'SCALING'];
    const stageData = {
        labels: stageLabels,
        datasets: [{
            data: stageLabels.map(st => startups.filter(x => x.stage === st).length),
            backgroundColor: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b'],
            borderWidth: 0,
        }]
    };

    const industryMap = {};
    startups.forEach(s => { const ind = s.industry || s.sector || 'Other'; industryMap[ind] = (industryMap[ind] || 0) + 1; });
    const industryData = {
        labels: Object.keys(industryMap),
        datasets: [{
            data: Object.values(industryMap),
            backgroundColor: ['#6366f1', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'],
            borderWidth: 0,
        }]
    };

    const fundingStatus = {
        labels: ['Pending', 'Approved', 'Rejected'],
        datasets: [{
            label: 'Count',
            data: ['PENDING', 'APPROVED', 'REJECTED'].map(st => applications.filter(a => a.status === st).length),
            backgroundColor: ['rgba(245,158,11,0.7)', 'rgba(16,185,129,0.7)', 'rgba(239,68,68,0.7)'],
            borderRadius: 6,
        }]
    };

    const roleMap = {};
    users.forEach(u => { const r = u.role || 'GUEST'; roleMap[r] = (roleMap[r] || 0) + 1; });
    const roleData = {
        labels: Object.keys(roleMap),
        datasets: [{
            data: Object.values(roleMap),
            backgroundColor: ['#ef4444', '#6366f1', '#10b981', '#f59e0b', '#06b6d4'],
            borderWidth: 0,
        }]
    };

    const projectStatusData = {
        labels: ['Pending', 'Ongoing', 'Completed'],
        datasets: [{
            data: ['Pending', 'Ongoing', 'Completed'].map(st => researchProjects.filter(p => p.status === st).length),
            backgroundColor: ['#f59e0b', '#6366f1', '#10b981'],
            borderWidth: 0,
        }]
    };

    const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 }, padding: 12 } } } };
    const barOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { color: '#94a3b8' } }, x: { grid: { display: false }, ticks: { color: '#94a3b8' } } } };

    const totalFunding = applications.reduce((sum, a) => sum + (a.amount || 0), 0);
    const approvedFunding = applications.filter(a => a.status === 'APPROVED').reduce((sum, a) => sum + (a.amount || 0), 0);
    const patentCount = researchProjects.reduce((sum, p) => sum + (p.patents?.length || 0), 0);

    return (
        <div className="page-container">
            <div style={{ marginBottom: 28 }}>
                <h1 className="topbar-title">📊 Personalized Analytics</h1>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                    {user?.role === 'ADMIN' ? 'Full ecosystem health and performance tracking.' : 
                     user?.role === 'STARTUP' ? 'Insights into your venture growth and funding pipeline.' :
                     user?.role === 'INVESTOR' ? 'Portfolio analysis and market opportunity breakdown.' :
                     user?.role === 'RESEARCHER' ? 'Intellectual property and research impact analytics.' :
                     'Deep dive into platform data and metrics.'}
                </p>
            </div>

            {loading ? (
                <div className="loading-screen"><div className="spinner" /><span>Synthesizing data...</span></div>
            ) : (
                <>
                    {/* Role-Tailored Summary Cards */}
                    <div className="stats-grid">
                        {user?.role === 'ADMIN' ? (
                            <>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>🚀</div><div><div className="stat-value">{startups.length}</div><div className="stat-label">Startups</div></div></div>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)' }}>👥</div><div><div className="stat-value">{users.length}</div><div className="stat-label">Total Users</div></div></div>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>💰</div><div><div className="stat-value">${(totalFunding/1000).toFixed(0)}K</div><div className="stat-label">Global Funding</div></div></div>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>📋</div><div><div className="stat-value">{applications.length}</div><div className="stat-label">App Volume</div></div></div>
                            </>
                        ) : user?.role === 'STARTUP' ? (
                            <>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>💡</div><div><div className="stat-value">{startups.length}</div><div className="stat-label">My Startups</div></div></div>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>💰</div><div><div className="stat-value">${(totalFunding/1000).toFixed(0)}K+</div><div className="stat-label">Funding Sought</div></div></div>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>✅</div><div><div className="stat-value">${(approvedFunding/1000).toFixed(0)}K</div><div className="stat-label">Approved</div></div></div>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>📋</div><div><div className="stat-value">{applications.length}</div><div className="stat-label">Applications</div></div></div>
                            </>
                        ) : user?.role === 'INVESTOR' ? (
                            <>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>👜</div><div><div className="stat-value">{applications.length}</div><div className="stat-label">Portfolio Cos</div></div></div>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>💰</div><div><div className="stat-value">${(approvedFunding/1000).toFixed(0)}K</div><div className="stat-label">Total Invested</div></div></div>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>🔍</div><div><div className="stat-value">{startups.length}</div><div className="stat-label">Market Reach</div></div></div>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(6,182,212,0.15)' }}>🎓</div><div><div className="stat-value">{mentors.length}</div><div className="stat-label">Experts</div></div></div>
                            </>
                        ) : user?.role === 'RESEARCHER' ? (
                            <>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(6,182,212,0.15)' }}>🔬</div><div><div className="stat-value">{researchProjects.length}</div><div className="stat-label">Research Repos</div></div></div>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(139,92,246,0.15)' }}>📜</div><div><div className="stat-value">{patentCount}</div><div className="stat-label">IP Portfolio</div></div></div>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>💡</div><div><div className="stat-value">{startups.length}</div><div className="stat-label">Venture Scope</div></div></div>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>💰</div><div><div className="stat-value">${(totalFunding/1000).toFixed(0)}K</div><div className="stat-label">Grants Secured</div></div></div>
                            </>
                        ) : (
                            <>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>🚀</div><div><div className="stat-value">{startups.length}</div><div className="stat-label">Entities</div></div></div>
                                <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(6,182,212,0.15)' }}>✅</div><div><div className="stat-value">Live</div><div className="stat-label">Ecosystem</div></div></div>
                            </>
                        )}
                    </div>

                    {/* Charts Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24, marginTop: 24 }}>
                        {/* Domain/Industry Focus (Relevant for all) */}
                        <div className="card">
                            <div className="section-title">🏢 {user?.role === 'RESEARCHER' ? 'Research Domains' : 'Industry Focus'}</div>
                            <div className="section-subtitle">Categorical distribution across the network</div>
                            <div style={{ height: 260, marginTop: 20 }}><Pie data={industryData} options={chartOpts} /></div>
                        </div>

                        {/* Stage/Status Analysis */}
                        <div className="card">
                            <div className="section-title">{user?.role === 'RESEARCHER' ? '📜 Project Pipeline' : '🎯 Startup Maturity'}</div>
                            <div className="section-subtitle">Lifecycle breakdown</div>
                            <div style={{ height: 260, marginTop: 20 }}>
                                <Doughnut data={user?.role === 'RESEARCHER' ? projectStatusData : stageData} options={chartOpts} />
                            </div>
                        </div>

                        {/* Funding Funnel (Not relevant for Researchers/Mentors usually) */}
                        {(user?.role === 'ADMIN' || user?.role === 'STARTUP' || user?.role === 'INVESTOR') && (
                            <div className="card" style={{ gridColumn: 'span 2' }}>
                                <div className="section-title">💰 Funding Status Breakdown</div>
                                <div className="section-subtitle">Success rate and pending volume analysis</div>
                                <div style={{ height: 280, marginTop: 20 }}><Bar data={fundingStatus} options={barOpts} /></div>
                            </div>
                        )}

                        {/* User Role Stats (Admin only) */}
                        {user?.role === 'ADMIN' && (
                            <div className="card">
                                <div className="section-title">👥 Demographic Mix</div>
                                <div className="section-subtitle">Distribution of user personas</div>
                                <div style={{ height: 260, marginTop: 20 }}><Doughnut data={roleData} options={chartOpts} /></div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
