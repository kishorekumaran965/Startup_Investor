import React, { useEffect, useState, useRef } from 'react';
import { messagesApi, usersApi, notificationsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

export default function MessagesPage() {
    const { user } = useAuth();
    const location = useLocation();
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(true);
    const [chatLoading, setChatLoading] = useState(false);
    const [searchUser, setSearchUser] = useState('');
    const [unreadCounts, setUnreadCounts] = useState({});
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const [recentUsers, allUsers] = await Promise.all([
                    messagesApi.getRecentConversations().catch(() => []),
                    usersApi.getAll().catch(() => [])
                ]);

                const recentIds = new Set(recentUsers.map(u => u.id));
                const otherUsers = allUsers.filter(u => !recentIds.has(u.id) && u.id !== user?.id);

                const combinedList = [...recentUsers, ...otherUsers];
                setUsers(combinedList);

                // Handle navigation from notifications
                if (location.state?.selectedUserId) {
                    const target = combinedList.find(u => u.id === location.state.selectedUserId);
                    if (target) loadConversation(target);
                }
            } catch (err) {
                console.error("Failed to fetch users", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user, location.state]);

    const loadConversation = async (u) => {
        setSelectedUser(u);
        setChatLoading(true);
        try {
            const conv = await messagesApi.getConversation(u.id);
            setMessages(conv || []);
        } catch { setMessages([]); }
        finally { setChatLoading(false); }
    };

    // Polling for real-time messages
    useEffect(() => {
        let interval;
        if (selectedUser) {
            interval = setInterval(async () => {
                try {
                    const conv = await messagesApi.getConversation(selectedUser.id);
                    setMessages(conv || []);

                    if (user?.id) {
                        try {
                            // Mark notifications as read
                            const notifs = await notificationsApi.getByUser(user.id);
                            const unreadFromUser = notifs.filter(n => n.type === 'NEW_MESSAGE' && n.relatedId == selectedUser.id && !n.isRead && !n.read);
                            for (const n of unreadFromUser) {
                                await notificationsApi.markRead(n.id).catch(() => { });
                            }

                            // Mark messages as read in backend
                            const unreadMsgs = conv.filter(m => m.receiverId === user.id && !m.read);
                            for (const m of unreadMsgs) {
                                await messagesApi.markRead(m.id).catch(() => { });
                            }
                        } catch (err) { }
                    }
                } catch { }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [selectedUser, user]);

    // Poll for unread counts
    useEffect(() => {
        const fetchUnread = async () => {
            if (!user?.id) return;
            try {
                const notifs = await notificationsApi.getByUser(user.id);
                const counts = {};
                notifs.filter(n => !n.isRead && !n.read && n.type === 'NEW_MESSAGE' && n.relatedId).forEach(n => {
                    counts[n.relatedId] = (counts[n.relatedId] || 0) + 1;
                });
                setUnreadCounts(counts);
            } catch (e) { }
        };
        fetchUnread();
        const intervalId = setInterval(fetchUnread, 3000);
        return () => clearInterval(intervalId);
    }, [user]);

    const handleSend = async () => {
        if (!msg.trim() || !selectedUser) return;
        try {
            const sent = await messagesApi.send({ receiverId: selectedUser.id, content: msg });
            setMessages(prev => [...prev, sent]);
            setMsg('');
        } catch (e) { console.error(e); }
    };

    const filteredUsers = users.filter(u =>
        (u.name?.toLowerCase().includes(searchUser.toLowerCase()) || u.email?.toLowerCase().includes(searchUser.toLowerCase()))
    );

    const roleColors = { ADMIN: '#ef4444', STARTUP: '#6366f1', INVESTOR: '#10b981', MENTOR: '#f59e0b', RESEARCHER: '#06b6d4' };

    return (
        <div className="page-container" style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header section in its own bento block or hero */}
            <div className="hero-section" style={{ 
                marginBottom: 24, 
                padding: '24px 32px',
                borderRadius: 'var(--r-lg)',
                background: 'var(--navy-2)',
                border: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <h1 className="hero-title" style={{ fontSize: '24px', marginBottom: '4px' }}>Ecosystem Direct</h1>
                    <p className="hero-subtitle" style={{ fontSize: '13px', color: 'var(--text-3)' }}>Secure end-to-end messaging across the platform</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                   <div style={{ background: 'var(--bg-card)', padding: '8px 16px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '12px', fontWeight: 'bold', color: 'var(--teal)' }}>ENCRYPTED</div>
                </div>
            </div>

            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, minHeight: 0 }}>
                {/* Users List - Detached Glass Brick */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px', overflow: 'hidden' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-3)', marginBottom: '16px', letterSpacing: '1px' }}>CONTACTS</div>
                    <div style={{ position: 'relative', marginBottom: '20px' }}>
                        <input 
                            className="form-input" 
                            style={{ paddingLeft: '40px', height: '44px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }} 
                            placeholder="Search contacts..." 
                            value={searchUser} 
                            onChange={e => setSearchUser(e.target.value)} 
                        />
                        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>🔍</span>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {loading ? <div className="spinner" style={{ margin: '20px auto' }} /> :
                            filteredUsers.map(u => (
                                <div
                                    key={u.id}
                                    onClick={() => loadConversation(u)}
                                    style={{
                                        display: 'flex', gap: 12, alignItems: 'center', padding: '12px',
                                        borderRadius: '12px', cursor: 'pointer',
                                        background: selectedUser?.id === u.id ? 'var(--violet-dim)' : 'transparent',
                                        border: selectedUser?.id === u.id ? '1px solid var(--violet-border)' : '1px solid transparent',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    }}
                                >
                                    <div style={{
                                        width: 44, height: 44, borderRadius: '12px',
                                        background: `linear-gradient(135deg, ${roleColors[u.role] || '#6366f1'}, #6366f1)`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#fff', fontSize: 16, fontWeight: 800, flexShrink: 0,
                                        boxShadow: selectedUser?.id === u.id ? `0 0 15px ${roleColors[u.role]}33` : 'none'
                                    }}>
                                        {(u.name || u.email || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '14px', fontWeight: '700', color: selectedUser?.id === u.id ? 'var(--text)' : 'var(--text-2)', marginBottom: '2px' }}>
                                            {u.name || u.email}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {u.role}
                                        </div>
                                    </div>
                                    {unreadCounts[u.id] > 0 && selectedUser?.id !== u.id && (
                                        <div style={{
                                            background: 'var(--violet)', color: 'white', borderRadius: '50%',
                                            width: 18, height: 18, fontSize: '10px', fontWeight: 'bold',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: '0 0 10px var(--violet)'
                                        }}>
                                            {unreadCounts[u.id]}
                                        </div>
                                    )}
                                </div>
                            ))
                        }
                    </div>
                </div>

                {/* Chat Area */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {!selectedUser ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                            <p style={{ fontSize: 14 }}>Select a conversation to view messages</p>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '24px', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'rgba(255,255,255,0.01)' }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: '14px',
                                    background: `linear-gradient(135deg, ${roleColors[selectedUser.role] || '#6366f1'}, #6366f1)`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontSize: 18, fontWeight: 800,
                                }}>
                                    {(selectedUser.name || selectedUser.email || '?').charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 800, fontSize: '18px', color: 'var(--text)', marginBottom: '2px' }}>{selectedUser.name || selectedUser.email}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--teal)', boxShadow: '0 0 8px var(--teal)' }}></span>
                                        <span style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 'bold' }}>{selectedUser.role}</span>
                                    </div>
                                </div>
                                <button className="btn btn-ghost" onClick={() => setSelectedUser(null)}>Archive Chat</button>
                            </div>

                            {/* Messages Container */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(0,0,0,0.1)' }}>
                                {chatLoading ? <div className="spinner" style={{ margin: '40px auto' }} /> :
                                    messages.length === 0 ? (
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', opacity: 0.5 }}>
                                            <div style={{ fontSize: '32px', marginBottom: '8px' }}>👋</div>
                                            <p style={{ fontSize: '13px' }}>Start a secure conversation</p>
                                        </div>
                                    ) : messages.map((m, i) => (
                                        <div key={m.id || i} style={{
                                            alignSelf: m.senderId === user?.id ? 'flex-end' : 'flex-start',
                                            background: m.senderId === user?.id ? 'linear-gradient(135deg, var(--violet), var(--pink))' : 'rgba(255,255,255,0.04)',
                                            color: '#fff',
                                            padding: '12px 20px', 
                                            borderRadius: m.senderId === user?.id ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                            maxWidth: '70%', 
                                            fontSize: '14px', 
                                            lineHeight: 1.6,
                                            border: m.senderId === user?.id ? 'none' : '1px solid var(--border)',
                                            boxShadow: m.senderId === user?.id ? '0 10px 25px -10px var(--violet)' : 'none',
                                            position: 'relative',
                                            animation: 'slideUp 0.3s ease-out'
                                        }}>
                                            {m.content}
                                            <div style={{
                                                fontSize: '10px',
                                                opacity: 0.6,
                                                marginTop: 6,
                                                display: 'flex',
                                                justifyContent: 'flex-end',
                                                gap: 6
                                            }}>
                                                {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                {m.senderId === user?.id && (
                                                    <span style={{ fontWeight: 'bold' }}>{m.read ? 'READ' : 'SENT'}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                }
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Form */}
                            <div style={{ padding: '24px', borderTop: '1px solid var(--border)', flexShrink: 0, background: 'rgba(255,255,255,0.01)' }}>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <input 
                                        className="form-input" 
                                        style={{ flex: 1, padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }} 
                                        placeholder="Transmit message..." 
                                        value={msg}
                                        onChange={e => setMsg(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSend()} 
                                    />
                                    <button 
                                        className="btn btn-primary" 
                                        style={{ padding: '0 24px', borderRadius: '12px' }} 
                                        onClick={handleSend} 
                                        disabled={!msg.trim()}
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
