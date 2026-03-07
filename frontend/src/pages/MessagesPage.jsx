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
        <div className="page-container" style={{ height: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: 16 }}>
                <h1 className="topbar-title">💬 Messages</h1>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Chat with anyone in the ecosystem</p>
            </div>

            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, minHeight: 0, overflow: 'hidden' }}>
                {/* Users List */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <input className="form-input" style={{ marginBottom: 12, flexShrink: 0 }} placeholder="🔍 Search users..." value={searchUser} onChange={e => setSearchUser(e.target.value)} />
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {loading ? <div className="spinner" style={{ margin: '20px auto' }} /> :
                            filteredUsers.map(u => (
                                <div
                                    key={u.id}
                                    onClick={() => loadConversation(u)}
                                    style={{
                                        display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px',
                                        borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                                        background: selectedUser?.id === u.id ? 'rgba(99,102,241,0.12)' : 'transparent',
                                        border: selectedUser?.id === u.id ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                                        transition: 'var(--transition-fast)', marginBottom: 4,
                                    }}
                                >
                                    <div style={{
                                        width: 36, height: 36, borderRadius: '50%',
                                        background: `linear-gradient(135deg, ${roleColors[u.role] || '#6366f1'}, #6366f1)`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#fff', fontSize: 14, fontWeight: 700, flexShrink: 0,
                                    }}>
                                        {(u.name || u.email || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {u.name || u.email}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                                                {u.lastMessage || u.role}
                                            </div>
                                            {u.lastMessageTime && (
                                                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                                    {new Date(u.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {unreadCounts[u.id] > 0 && selectedUser?.id !== u.id && (
                                        <div style={{
                                            background: 'var(--success)', color: 'white', borderRadius: '50%',
                                            width: 20, height: 20, minWidth: 20, fontSize: 12, fontWeight: 'bold',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 8
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
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: '50%',
                                    background: `linear-gradient(135deg, ${roleColors[selectedUser.role] || '#6366f1'}, #6366f1)`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontSize: 16, fontWeight: 700,
                                }}>
                                    {(selectedUser.name || selectedUser.email || '?').charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>{selectedUser.name || selectedUser.email}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selectedUser.role} · {selectedUser.email}</div>
                                </div>
                                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedUser(null)}>✕ Close</button>
                            </div>

                            {/* Messages */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {chatLoading ? <div className="spinner" style={{ margin: '40px auto' }} /> :
                                    messages.length === 0 ? (
                                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 40 }}>No messages yet. Say hello! 👋</p>
                                    ) : messages.map((m, i) => (
                                        <div key={m.id || i} style={{
                                            alignSelf: m.senderId === user?.id ? 'flex-end' : 'flex-start',
                                            background: m.senderId === user?.id ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--surface)',
                                            color: m.senderId === user?.id ? '#fff' : 'var(--text-primary)',
                                            padding: '10px 16px', borderRadius: '18px 18px ' + (m.senderId === user?.id ? '2px 18px' : '18px 2px'),
                                            maxWidth: '70%', fontSize: 14, lineHeight: 1.5,
                                            border: m.senderId === user?.id ? 'none' : '1px solid var(--border)',
                                            boxShadow: m.senderId === user?.id ? '0 4px 12px rgba(99,102,241,0.2)' : 'none',
                                            position: 'relative'
                                        }}>
                                            {m.content}
                                            <div style={{
                                                fontSize: 10,
                                                opacity: 0.7,
                                                marginTop: 4,
                                                display: 'flex',
                                                justifyContent: 'flex-end',
                                                alignItems: 'center',
                                                gap: 4
                                            }}>
                                                {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                {m.senderId === user?.id && (
                                                    <span>{m.read ? '✔✔' : '✔'}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                }
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12, flexShrink: 0 }}>
                                <input className="form-input" style={{ flex: 1 }} placeholder="Type a message..." value={msg}
                                    onChange={e => setMsg(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSend()} />
                                <button className="btn btn-primary" onClick={handleSend} disabled={!msg.trim()}>Send →</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
