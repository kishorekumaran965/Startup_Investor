import React, { useEffect, useState } from 'react';
import { capTableApi } from '../api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function CapTableModal({ startup, onClose }) {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        capTableApi.getForStartup(startup.id)
            .then(setEntries)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [startup.id]);

    const chartData = {
        labels: entries.map(e => e.ownerName + (e.ownerType ? ` (${e.ownerType})` : '')),
        datasets: [{
            data: entries.map(e => e.ownershipPercentage),
            backgroundColor: [
                '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899'
            ],
            borderWidth: 0,
        }]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'right',
                labels: { color: '#94a3b8', font: { size: 12 } }
            }
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box" style={{ maxWidth: 800 }}>
                <div className="modal-header">
                    <h2 className="modal-title">📊 Cap Table: {startup.name}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                {loading ? <div className="spinner" /> : (
                    <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 20 }}>
                        {entries.length > 0 ? (
                            <>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-3)', marginBottom: 20, letterSpacing: '1px' }}>OWNERSHIP DISTRIBUTION</div>
                                    <div style={{ height: 300 }}>
                                        <Pie data={chartData} options={chartOptions} />
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-3)', marginBottom: 20, letterSpacing: '1px' }}>SHAREHOLDERS</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {entries.map(e => (
                                            <div key={e.id} style={{ 
                                                padding: '16px', 
                                                background: 'rgba(255,255,255,0.03)', 
                                                borderRadius: '12px', 
                                                border: '1px solid var(--border)',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>{e.ownerName}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase' }}>{e.ownerType}</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontWeight: 900, fontSize: '18px', color: 'var(--teal)' }}>{(e.ownershipPercentage || 0).toFixed(2)}%</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{Number(e.shares || 0).toLocaleString()} Shares</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div style={{ marginTop: 24, padding: '16px', background: 'var(--navy-2)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                                        <div style={{ fontSize: '12px', color: 'var(--text-3)', textAlign: 'center' }}>
                                            Total Authorized Shares: <strong>{Number(startup.totalAuthorizedShares || 10000000).toLocaleString()}</strong>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '64px 0', border: '1px dashed var(--border)', borderRadius: '20px' }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📉</div>
                                <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>No ownership data yet</h3>
                                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Initial equity allocation for this startup is pending initialization.</p>
                            </div>
                        )}
                    </div>
                )}
                
                <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={onClose}>Close Dashboard</button>
                </div>
            </div>
        </div>
    );
}
