import React, { useEffect, useState } from 'react';
import { fundingAppApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function MyInvestmentsPage() {
    const { user } = useAuth();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        if (user?.id) {
            fundingAppApi.getByInvestor(user.id)
                .then(setApplications)
                .catch(() => {
                    // Fallback: get all and filter
                    fundingAppApi.getAll()
                        .then(all => setApplications(all.filter(a => a.investorId === user.id)))
                        .catch(() => setApplications([]));
                })
                .finally(() => setLoading(false));
        }
    }, [user]);

    const filtered = filter === 'ALL' ? applications : applications.filter(a => a.status === filter);
    const totalInvested = applications.reduce((sum, a) => sum + (a.amount || 0), 0);
    const pending = applications.filter(a => a.status === 'PENDING').length;
    const approved = applications.filter(a => a.status === 'APPROVED').length;
    const rejected = applications.filter(a => a.status === 'REJECTED').length;

    const statusData = {
        labels: ['Pending', 'Approved', 'Rejected'],
        datasets: [{
            data: [pending, approved, rejected],
            backgroundColor: ['#f59e0b', '#10b981', '#ef4444'],
            borderWidth: 0,
        }]
    };

    const statusColors = { PENDING: '#f59e0b', APPROVED: '#10b981', REJECTED: '#ef4444' };

    return (
        <div className="page-container">
            <div style={{ marginBottom: 24 }}>
                <h1 className="topbar-title">💰 My Investments</h1>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Track all your funding applications and investments</p>
            </div>

            {loading ? (
                <div className="loading-screen"><div className="spinner" /><p>Loading investments...</p></div>
            ) : (
                <>
                    {/* Summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>💰</div>
                            <div><div className="stat-value">${(totalInvested / 1000).toFixed(0)}K</div><div className="stat-label">Total Invested</div></div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>⏳</div>
                            <div><div className="stat-value">{pending}</div><div className="stat-label">Pending</div></div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>✅</div>
                            <div><div className="stat-value">{approved}</div><div className="stat-label">Approved</div></div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)' }}>❌</div>
                            <div><div className="stat-value">{rejected}</div><div className="stat-label">Rejected</div></div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
                        {/* Applications List */}
                        <div className="card">
                            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                                {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(f => (
                                    <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f)}>
                                        {f}
                                    </button>
                                ))}
                            </div>
                            {filtered.length === 0 ? (
                                <div className="empty-state"><div className="empty-state-icon">💰</div><h3>No applications</h3></div>
                            ) : (
                                <div className="table-wrap">
                                    <table>
                                        <thead>
                                            <tr><th>Startup</th><th>Amount</th><th>Message</th><th>Status</th><th>Date</th></tr>
                                        </thead>
                                        <tbody>
                                            {filtered.map(a => (
                                                <tr key={a.id}>
                                                    <td style={{ fontWeight: 600 }}>{a.startupName || `Startup #${a.startupId}`}</td>
                                                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>${Number(a.amount).toLocaleString()}</td>
                                                    <td style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.message || '—'}</td>
                                                    <td>
                                                        <span className="badge" style={{ background: (statusColors[a.status] || '#6366f1') + '22', color: statusColors[a.status], border: `1px solid ${(statusColors[a.status] || '#6366f1')}44` }}>
                                                            {a.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.applicationDate}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Pie Chart */}
                        <div className="card">
                            <div className="section-title" style={{ marginBottom: 16 }}>Status Breakdown</div>
                            <div style={{ height: 240 }}>
                                <Doughnut data={statusData} options={{
                                    responsive: true, maintainAspectRatio: false,
                                    plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 } } } },
                                }} />
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
