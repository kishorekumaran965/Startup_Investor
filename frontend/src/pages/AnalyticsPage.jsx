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
            {/* High-Fidelity Hero */}
            <div className="hero-section" style={{ 
                marginBottom: 32, 
                padding: '40px',
                borderRadius: 'var(--r-lg)',
                background: 'var(--navy-2)',
                border: '1px solid var(--border)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--violet)', letterSpacing: '2px', marginBottom: '8px' }}>CORE METRICS</div>
                    <h1 className="hero-title" style={{ fontSize: '32px', marginBottom: '8px' }}>Ecosystem Intelligence</h1>
                    <p className="hero-subtitle" style={{ fontSize: '15px', color: 'var(--text-3)', maxWidth: '600px', lineHeight: '1.6' }}>
                        {user?.role === 'ADMIN' ? 'Full platform monitoring and cross-sector performance analytics.' : 
                         user?.role === 'STARTUP' ? 'Growth trajectory, investor interest, and capital efficiency metrics.' :
                         user?.role === 'INVESTOR' ? 'Market opportunity mapping and portfolio performance monitoring.' :
                         user?.role === 'RESEARCHER' ? 'IP development tracking and high-impact research analytics.' :
                         'Deep dive into platform data and metrics.'}
                    </p>
                </div>

                {/* Decorative Elements */}
                <div style={{ 
                    position: 'absolute', 
                    top: '-20%', 
                    right: '-10%', 
                    width: '300px', 
                    height: '300px', 
                    background: 'var(--violet)', 
                    filter: 'blur(100px)', 
                    opacity: 0.1,
                    borderRadius: '50%'
                }} />
                <div style={{ 
                    position: 'absolute', 
                    bottom: '-10%', 
                    right: '10%', 
                    width: '200px', 
                    height: '200px', 
                    background: 'var(--teal)', 
                    filter: 'blur(80px)', 
                    opacity: 0.08,
                    borderRadius: '50%'
                }} />
            </div>

            {loading ? (
                <div className="loading-screen"><div className="spinner" /><span>Synthesizing data...</span></div>
            ) : (
                <>
                    {/* Role-Tailored Summary Cards */}
                    {/* Premium Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 32 }}>
                        {user?.role === 'ADMIN' ? (
                            <>
                                <div className="card" style={{ padding: '24px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-3)', marginBottom: '8px' }}>TOTAL STARTUPS</div>
                                    <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text)' }}>{startups.length}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--teal)', marginTop: '4px' }}>Active Ecosystem</div>
                                </div>
                                <div className="card" style={{ padding: '24px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-3)', marginBottom: '8px' }}>PLATFORM USERS</div>
                                    <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text)' }}>{users.length}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--violet)', marginTop: '4px' }}>Global Network</div>
                                </div>
                                <div className="card" style={{ padding: '24px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-3)', marginBottom: '8px' }}>CAPITAL VOLUME</div>
                                    <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text)' }}>${(totalFunding/1000).toFixed(0)}K</div>
                                    <div style={{ fontSize: '12px', color: 'var(--pink)', marginTop: '4px' }}>Total Funding Goal</div>
                                </div>
                                <div className="card" style={{ padding: '24px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-3)', marginBottom: '8px' }}>PIPELINE LOAD</div>
                                    <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text)' }}>{applications.length}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--warning)', marginTop: '4px' }}>Active Requests</div>
                                </div>
                            </>
                        ) : (
                            /* Simplified for other roles but still high-fidelity */
                            <>
                                <div className="card" style={{ padding: '24px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-3)', marginBottom: '8px' }}>ENTITIES</div>
                                    <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text)' }}>{startups.length}</div>
                                </div>
                                <div className="card" style={{ padding: '24px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-3)', marginBottom: '8px' }}>PIPELINE</div>
                                    <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text)' }}>{applications.length}</div>
                                </div>
                                <div className="card" style={{ padding: '24px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-3)', marginBottom: '8px' }}>SECURED</div>
                                    <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text)' }}>${(approvedFunding/1000).toFixed(0)}K</div>
                                </div>
                                <div className="card" style={{ padding: '24px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-3)', marginBottom: '8px' }}>NETWORK</div>
                                    <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text)' }}>{mentors.length}</div>
                                </div>
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
