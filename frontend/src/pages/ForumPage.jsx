import React, { useEffect, useState } from 'react';
import { forumApi } from '../api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
    { id: 'General', name: '🌍 Global Lounge', roles: ['ADMIN', 'STARTUP', 'INVESTOR', 'MENTOR', 'RESEARCHER'] },
    { id: 'Founders', name: '🚀 Founders Lounge', roles: ['ADMIN', 'STARTUP'] },
    { id: 'Investors', name: '💰 Investor Syndicate', roles: ['ADMIN', 'INVESTOR'] },
    { id: 'Mentors', name: '🎓 Mentor Circle', roles: ['ADMIN', 'MENTOR'] },
    { id: 'Researchers', name: '🔬 Science Hub', roles: ['ADMIN', 'RESEARCHER'] },
];

function PostDetailModal({ post, onClose, currentUserId }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const loadComments = async () => {
        setLoading(true);
        try {
            const data = await forumApi.getComments(post.id);
            setComments(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadComments(); }, [post.id]);

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setSubmitting(true);
        try {
            await forumApi.addComment({
                content: newComment,
                authorId: currentUserId,
                postId: post.id
            });
            setNewComment('');
            loadComments();
        } catch (e) { alert(e.message); }
        finally { setSubmitting(false); }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box" style={{ maxWidth: 700, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '85vh' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                    <div className="flex-between">
                        <span className="badge badge-purple" style={{ marginBottom: 12 }}>{post.category}</span>
                        <button className="modal-close" onClick={onClose}>✕</button>
                    </div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>{post.title}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-glow)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                            {post.authorName?.charAt(0)}
                        </div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{post.authorName}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(post.createdAt).toLocaleString()} • {post.authorRole}</div>
                        </div>
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                    <div style={{ fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 32, paddingBottom: 32, borderBottom: '1px solid var(--border)' }}>
                        {post.content}
                    </div>

                    <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Comments ({comments.length})</h4>
                    
                    {loading ? <div className="spinner" /> : comments.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No comments yet. Start the conversation!</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {comments.map(c => (
                                <div key={c.id} style={{ display: 'flex', gap: 12 }}>
                                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                                        {c.authorName?.charAt(0)}
                                    </div>
                                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '0 12px 12px 12px', border: '1px solid var(--border)' }}>
                                        <div className="flex-between" style={{ marginBottom: 4 }}>
                                            <span style={{ fontSize: 12, fontWeight: 700 }}>{c.authorName}</span>
                                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{c.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border)' }}>
                    <form onSubmit={handleAddComment} style={{ display: 'flex', gap: 12 }}>
                        <input 
                            className="form-input" 
                            placeholder="Write a comment..." 
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary" disabled={submitting || !newComment.trim()}>
                            {submitting ? '...' : 'Reply'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

function CreatePostModal({ onClose, onCreated, currentUserId, initialCategory }) {
    const [form, setForm] = useState({ title: '', content: '', category: initialCategory || 'General' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await forumApi.createPost({
                ...form,
                authorId: currentUserId
            });
            onCreated();
            onClose();
        } catch (e) { alert(e.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box">
                <div className="modal-header">
                    <h2 className="modal-title">📝 New Discussion</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Category</label>
                        <select className="form-select" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                            {CATEGORIES.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Title</label>
                        <input className="form-input" placeholder="What's on your mind?" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Content</label>
                        <textarea className="form-textarea" rows={6} placeholder="Share your thoughts, questions, or resources..." required value={form.content} onChange={e => setForm({...form, content: e.target.value})} />
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Posting...' : 'Post Discussion'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ForumPage() {
    const { user } = useAuth();
    const [activeCategory, setActiveCategory] = useState('General');
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);

    const loadPosts = async () => {
        setLoading(true);
        try {
            const data = await forumApi.getPosts(activeCategory === 'General' ? '' : activeCategory);
            setPosts(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadPosts(); }, [activeCategory]);

    const filteredPosts = posts.filter(p => 
        p.title.toLowerCase().includes(search.toLowerCase()) || 
        p.content.toLowerCase().includes(search.toLowerCase())
    );

    const allowedCategories = CATEGORIES.filter(c => c.roles.includes(user?.role));

    return (
        <div className="page-container">
            {showCreate && <CreatePostModal onClose={() => setShowCreate(false)} onCreated={loadPosts} currentUserId={user?.id} initialCategory={activeCategory} />}
            {selectedPost && <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} currentUserId={user?.id} />}

            <div className="hero-section" style={{ padding: '32px 40px', marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div className="hero-greeting">Community Discussions</div>
                        <h1 className="hero-title" style={{ fontSize: 32, marginBottom: 8 }}>The Network Hub</h1>
                        <p className="hero-subtitle" style={{ maxWidth: 500 }}>Connect with founders, investors, and mentors. Share knowledge and grow together.</p>
                    </div>
                    <button className="btn btn-primary btn-lg" style={{ height: 'fit-content', borderRadius: 12 }} onClick={() => setShowCreate(true)}>
                        + Start Discussion
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 32 }}>
                {/* Sidebar Categories */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Channels</div>
                    {allowedCategories.map(cat => (
                        <button 
                            key={cat.id} 
                            onClick={() => setActiveCategory(cat.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, border: 'none', textAlign: 'left', cursor: 'pointer', transition: '0.2s',
                                background: activeCategory === cat.id ? 'var(--accent-glow)' : 'transparent',
                                color: activeCategory === cat.id ? 'var(--accent)' : 'var(--text-secondary)',
                                fontWeight: activeCategory === cat.id ? 700 : 500,
                                boxShadow: activeCategory === cat.id ? 'inset 0 0 0 1px var(--border-accent)' : 'none'
                            }}
                        >
                            <span style={{ fontSize: 18 }}>{cat.name.split(' ')[0]}</span>
                            <span style={{ fontSize: 14 }}>{cat.name.split(' ').slice(1).join(' ')}</span>
                        </button>
                    ))}
                </div>

                {/* Main Feed */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ position: 'relative' }}>
                        <input 
                            className="form-input" 
                            style={{ paddingLeft: 44, height: 48, borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)' }} 
                            placeholder="Search discussions..." 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                    </div>

                    {loading ? (
                        <div style={{ padding: '60px 0', textAlign: 'center' }}><div className="spinner" /></div>
                    ) : filteredPosts.length === 0 ? (
                        <div className="card" style={{ padding: '80px 40px', textAlign: 'center' }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
                            <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>No discussions yet</h3>
                            <p style={{ color: 'var(--text-muted)' }}>Be the first to start a conversation in {activeCategory} Lounge!</p>
                            <button className="btn btn-secondary" style={{ marginTop: 24 }} onClick={() => setShowCreate(true)}>Create First Post</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {filteredPosts.map(post => (
                                <div 
                                    key={post.id} 
                                    className="card" 
                                    style={{ 
                                        padding: 24, cursor: 'pointer', transition: '0.2s', border: '1px solid var(--border)'
                                    }}
                                    onClick={() => setSelectedPost(post)}
                                >
                                    <div style={{ display: 'flex', gap: 20 }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                                <span className="badge badge-purple" style={{ fontSize: 10 }}>{post.category}</span>
                                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>• {new Date(post.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>{post.title}</h3>
                                            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 16 }}>
                                                {post.content}
                                            </p>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent-3))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                                                        {post.authorName?.charAt(0)}
                                                    </div>
                                                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>{post.authorName}</span>
                                                    <span className="badge" style={{ fontSize: 9, background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>{post.authorRole}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>
                                                    <span>💬</span> {post.commentCount} comments
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
