import React, { useEffect, useState } from 'react';
import { usersApi } from '../api';

const ROLE_COLORS = {
    ADMIN: 'badge-red',
    STARTUP: 'badge-purple',
    INVESTOR: 'badge-green',
    MENTOR: 'badge-amber',
    RESEARCHER: 'badge-cyan',
};

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('ALL');

    const fetchUsers = async () => {
        setLoading(true);
        try { setUsers(await usersApi.getAll()); }
        catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this user? This action cannot be undone.')) return;
        await usersApi.delete(id);
        fetchUsers();
    };

    const roles = ['ALL', 'ADMIN', 'STARTUP', 'INVESTOR', 'MENTOR', 'RESEARCHER'];
    const filtered = users.filter(u =>
        (u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())) &&
        (filterRole === 'ALL' || u.role === filterRole)
    );

    const getInitials = (name, email) => {
        if (name) return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        if (email) return email[0].toUpperCase();
        return '?';
    };

    const roleGradients = {
        ADMIN: 'linear-gradient(135deg, #ef4444, #f97316)',
        STARTUP: 'linear-gradient(135deg, #6366f1, #a855f7)',
        INVESTOR: 'linear-gradient(135deg, #10b981, #06b6d4)',
        MENTOR: 'linear-gradient(135deg, #f59e0b, #ef4444)',
        RESEARCHER: 'linear-gradient(135deg, #06b6d4, #6366f1)',
    };

    return (
        <div className="page-container">
            <div style={{ marginBottom: 24 }}>
                <h1 className="topbar-title">👥 User Management</h1>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Manage all registered platform users</p>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                {roles.slice(1).map(r => {
                    const count = users.filter(u => u.role === r).length;
                    return (
                        <div key={r} style={{
                            padding: '8px 16px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 13,
                            display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{count}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{r}</span>
                        </div>
                    );
                })}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <input
                    className="form-input"
                    style={{ maxWidth: 280 }}
                    placeholder="🔍 Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select className="form-select" style={{ maxWidth: 160 }} value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>

            {loading ? (
                <div className="loading-screen"><div className="spinner" /><p>Loading users...</p></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">👥</div>
                    <h3>No users found</h3>
                    <p>Try adjusting your search filters</p>
                </div>
            ) : (
                <div className="card">
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>ID</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((u) => (
                                    <tr key={u.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{
                                                    width: 36, height: 36,
                                                    background: roleGradients[u.role] || 'linear-gradient(135deg, #6366f1, #a855f7)',
                                                    borderRadius: '50%',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontWeight: 700, fontSize: 13, color: 'white', flexShrink: 0,
                                                }}>
                                                    {getInitials(u.name, u.email)}
                                                </div>
                                                <div style={{ fontWeight: 600 }}>{u.name || 'Unknown'}</div>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{u.email}</td>
                                        <td>
                                            <span className={`badge ${ROLE_COLORS[u.role] || 'badge-purple'}`}>{u.role}</span>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{u.id}</td>
                                        <td>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}>
                                                🗑 Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--text-muted)' }}>
                        {filtered.length} user{filtered.length !== 1 ? 's' : ''} shown
                    </div>
                </div>
            )}
        </div>
    );
}
