import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersApi, aiApi } from '../api';

// ─── Simple markdown bold renderer ───────────────────────────────────────────
function RenderMarkdown({ text }) {
    if (!text) return null;
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return (
        <>
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i}>{part.slice(2, -2)}</strong>;
                }
                return <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
            })}
        </>
    );
}

// ─── Suggested questions ──────────────────────────────────────────────────────
const SUGGESTED = [
    'Explain my startup\'s business model',
    'What are our revenue streams?',
    'What are the weaknesses in my pitch deck?',
    'What financial risks are mentioned in my documents?',
    'What should I improve before approaching investors?',
    'Summarize my financial report',
];

// ─── Status dot ──────────────────────────────────────────────────────────────
function StatusDot({ status }) {
    const colors = {
        COMPLETED: 'var(--green)',
        PROCESSING: '#fca311',
        FAILED: 'var(--red)',
        UPLOADED: '#fca311',
    };
    return (
        <span style={{
            display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
            background: colors[status] || 'var(--text-3)',
            flexShrink: 0,
            boxShadow: status === 'PROCESSING' ? '0 0 6px #fca311' : 'none',
        }} title={status} />
    );
}

// ─── Source card ─────────────────────────────────────────────────────────────
function SourceCard({ source }) {
    return (
        <div style={{
            padding: '8px 12px',
            background: 'rgba(76,201,240,0.06)',
            border: '1px solid rgba(76,201,240,0.2)',
            borderRadius: 'var(--r-sm)',
            fontSize: 12,
            marginBottom: 6,
        }}>
            <div style={{ fontWeight: 700, color: 'var(--teal)', marginBottom: 3 }}>
                📄 {source.doc_name}
                {source.page_number != null && ` — Page ${source.page_number}`}
            </div>
            {source.excerpt && (
                <div style={{ color: 'var(--text-2)', fontStyle: 'italic', lineHeight: 1.5 }}>
                    "{source.excerpt}"
                </div>
            )}
        </div>
    );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
    const [showSources, setShowSources] = useState(false);
    const isUser = msg.role === 'USER';
    const sources = msg.sources || [];

    if (isUser) {
        return (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                <div style={{
                    maxWidth: '70%',
                    padding: '12px 16px',
                    borderRadius: '18px 18px 4px 18px',
                    background: 'linear-gradient(135deg, var(--violet), #7c3aed)',
                    color: '#fff',
                    fontSize: 14,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                }}>
                    {msg.content}
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'flex-start' }}>
            {/* AI avatar */}
            <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: 'linear-gradient(135deg, var(--violet), var(--teal))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.07-4.14A3 3 0 0 1 2 12a3 3 0 0 1 4-2.83 2.5 2.5 0 0 1 4.5-1.17z"/>
                    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.07-4.14A3 3 0 0 0 22 12a3 3 0 0 0-4-2.83 2.5 2.5 0 0 0-4.5-1.17z"/>
                </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    padding: '14px 16px',
                    background: 'rgba(20,20,30,0.7)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px 18px 18px 18px',
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: 'var(--text)',
                }}>
                    <RenderMarkdown text={msg.content} />
                </div>

                {/* Metadata row */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
                    {msg.usedContext && (
                        <span style={{
                            fontSize: 11, padding: '2px 8px', borderRadius: 20,
                            background: 'rgba(0,245,212,0.08)', color: 'var(--green)',
                            border: '1px solid rgba(0,245,212,0.2)',
                        }}>
                            ✓ {msg.retrievedChunks || 0} chunks retrieved
                        </span>
                    )}
                    {!msg.usedContext && (
                        <span style={{
                            fontSize: 11, padding: '2px 8px', borderRadius: 20,
                            background: 'rgba(255,255,255,0.04)', color: 'var(--text-3)',
                            border: '1px solid var(--border)',
                        }}>
                            No documents retrieved
                        </span>
                    )}
                    {sources.length > 0 && (
                        <button
                            onClick={() => setShowSources(s => !s)}
                            style={{
                                background: 'none', cursor: 'pointer',
                                fontSize: 11, color: 'var(--teal)',
                                padding: '2px 8px', borderRadius: 20,
                                border: '1px solid rgba(76,201,240,0.2)',
                            }}
                        >
                            {showSources ? '▲ Hide' : '▼ Show'} {sources.length} source{sources.length !== 1 ? 's' : ''}
                        </button>
                    )}
                </div>

                {showSources && sources.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                        {sources.map((s, i) => <SourceCard key={i} source={s} />)}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Loading dots ─────────────────────────────────────────────────────────────
function LoadingDots() {
    return (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'flex-start' }}>
            <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: 'linear-gradient(135deg, var(--violet), var(--teal))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.07-4.14A3 3 0 0 1 2 12a3 3 0 0 1 4-2.83 2.5 2.5 0 0 1 4.5-1.17z"/>
                    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.07-4.14A3 3 0 0 0 22 12a3 3 0 0 0-4-2.83 2.5 2.5 0 0 0-4.5-1.17z"/>
                </svg>
            </div>
            <div style={{
                padding: '14px 20px',
                background: 'rgba(20,20,30,0.7)',
                border: '1px solid var(--border)',
                borderRadius: '4px 18px 18px 18px',
                display: 'flex', gap: 6, alignItems: 'center',
            }}>
                {[0, 1, 2].map(i => (
                    <div key={i} style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: 'var(--text-3)',
                        animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                ))}
            </div>
        </div>
    );
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────
function UploadModal({ onClose, onUploaded, startupId }) {
    const [name, setName] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const ALLOWED = ['.pdf', '.docx', '.pptx', '.txt'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !name.trim()) return;
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!ALLOWED.includes(ext)) {
            setError(`Unsupported file type. Allowed: ${ALLOWED.join(', ')}`);
            return;
        }
        setLoading(true);
        setError('');
        try {
            await aiApi.uploadDocument(startupId, name.trim(), file);
            onUploaded();
            onClose();
        } catch (err) {
            setError(err.message || 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-box" style={{ maxWidth: 420 }}>
                <div className="modal-header">
                    <h2 className="modal-title">Upload Document for AI Analysis</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: 14 }}>
                        <label className="form-label">Document Name</label>
                        <input
                            className="form-input"
                            placeholder="e.g. Q4 Pitch Deck 2024"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 14 }}>
                        <label className="form-label">File (PDF, DOCX, PPTX, TXT)</label>
                        <input
                            type="file"
                            className="form-input"
                            accept=".pdf,.docx,.pptx,.txt"
                            onChange={e => setFile(e.target.files[0])}
                            required
                        />
                    </div>
                    {error && (
                        <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{error}</div>
                    )}
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || !file || !name.trim()}
                        >
                            {loading ? 'Uploading & Processing…' : 'Upload'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AiAdvisorPage() {
    const { user } = useAuth();

    const [myStartups, setMyStartups] = useState([]);
    const [startupId, setStartupId] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [activeConv, setActiveConv] = useState(null);   // { id, title, messages[] }
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const [docsExpanded, setDocsExpanded] = useState(true);
    const [showUpload, setShowUpload] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState('');

    const chatEndRef = useRef(null);
    const textareaRef = useRef(null);
    const pollRef = useRef(null);

    const isStartup = user?.role === 'STARTUP';
    const isAdmin = user?.role === 'ADMIN';
    const canUse = isStartup || isAdmin;

    // ── Load startups ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!canUse || !user?.id) { setPageLoading(false); return; }
        usersApi.getStartups(user.id)
            .then(s => {
                setMyStartups(s);
                if (s.length > 0) setStartupId(s[0].id);
            })
            .catch(e => setError(e.message))
            .finally(() => setPageLoading(false));
    }, [user?.id]);

    // ── Load docs + conversations when startup changes ───────────────────────
    const loadDocuments = useCallback(async () => {
        if (!startupId) return;
        try {
            const docs = await aiApi.getDocuments(startupId);
            setDocuments(docs);
        } catch { /* ignore */ }
    }, [startupId]);

    const loadConversations = useCallback(async () => {
        if (!startupId) return;
        try {
            const convs = await aiApi.getConversations(startupId);
            setConversations(convs);
        } catch { /* ignore */ }
    }, [startupId]);

    useEffect(() => {
        if (!startupId) return;
        loadDocuments();
        loadConversations();
    }, [startupId, loadDocuments, loadConversations]);

    // ── Poll document status while any is PROCESSING ─────────────────────────
    useEffect(() => {
        if (pollRef.current) clearInterval(pollRef.current);
        const anyProcessing = documents.some(d => d.status === 'PROCESSING' || d.status === 'UPLOADED');
        if (anyProcessing) {
            pollRef.current = setInterval(loadDocuments, 8000);
        }
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [documents, loadDocuments]);

    // ── Auto-scroll ───────────────────────────────────────────────────────────
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, sending]);

    // ── Select conversation ───────────────────────────────────────────────────
    const selectConversation = async (convId) => {
        try {
            const full = await aiApi.getConversation(convId);
            setActiveConv({ id: full.id, title: full.title });
            setMessages(full.messages || []);
        } catch (e) { setError(e.message); }
    };

    // ── New chat ──────────────────────────────────────────────────────────────
    const startNewChat = () => {
        setActiveConv(null);
        setMessages([]);
        setInputText('');
    };

    // ── Send message ──────────────────────────────────────────────────────────
    const sendMessage = async (text) => {
        const q = (text || inputText).trim();
        if (!q || !startupId) return;
        setInputText('');
        setSending(true);
        setError('');

        // Optimistic user message
        const userMsg = { id: Date.now(), role: 'USER', content: q, sources: [], usedContext: false };
        setMessages(prev => [...prev, userMsg]);

        try {
            const res = await aiApi.chat({
                startupId,
                conversationId: activeConv?.id ?? null,
                question: q,
            });

            // Update active conversation
            if (!activeConv) {
                setActiveConv({ id: res.conversationId, title: res.conversationTitle });
                await loadConversations();
            }

            // Replace optimistic message + add assistant
            setMessages(prev => {
                const without = prev.filter(m => m.id !== userMsg.id);
                return [...without, res.userMessage, res.assistantMessage];
            });
        } catch (e) {
            setError(e.message || 'Failed to get AI response');
            setMessages(prev => prev.filter(m => m.id !== userMsg.id));
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const deleteDocument = async (docId) => {
        if (!window.confirm('Delete this document? Its vectors will also be removed.')) return;
        try {
            await aiApi.deleteDocument(docId);
            await loadDocuments();
        } catch (e) { alert(e.message); }
    };

    const deleteConversation = async (convId, e) => {
        e.stopPropagation();
        if (!window.confirm('Delete this conversation?')) return;
        try {
            await aiApi.deleteConversation(convId);
            await loadConversations();
            if (activeConv?.id === convId) startNewChat();
        } catch (e) { alert(e.message); }
    };

    // ─── Not-startup view ────────────────────────────────────────────────────
    if (!canUse) {
        return (
            <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ textAlign: 'center', maxWidth: 480 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
                    <h2 style={{ marginBottom: 10 }}>AI Document Intelligence</h2>
                    <p style={{ color: 'var(--text-2)' }}>
                        AI Document Intelligence is available for <strong>startup founders</strong>. Upload your pitch decks, business plans, and financial reports to get AI-powered insights.
                    </p>
                </div>
            </div>
        );
    }

    if (pageLoading) {
        return <div className="loading-screen"><div className="spinner" /><p>Loading AI Advisor…</p></div>;
    }

    if (myStartups.length === 0) {
        return (
            <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ textAlign: 'center', maxWidth: 480 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
                    <h2 style={{ marginBottom: 10 }}>No Startups Found</h2>
                    <p style={{ color: 'var(--text-2)' }}>Create a startup in "My Ideas" to unlock the AI Advisor.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 65px)', overflow: 'hidden' }}>
            {/* pulse animation */}
            <style>{`
                @keyframes pulse { 0%,100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.1); } }
            `}</style>

            {showUpload && startupId && (
                <UploadModal
                    startupId={startupId}
                    onClose={() => setShowUpload(false)}
                    onUploaded={loadDocuments}
                />
            )}

            {/* ── LEFT PANEL ── */}
            <div style={{
                width: 272,
                flexShrink: 0,
                borderRight: '1px solid var(--border)',
                background: 'rgba(10,10,16,0.7)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: 'linear-gradient(135deg, var(--violet), var(--teal))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.07-4.14A3 3 0 0 1 2 12a3 3 0 0 1 4-2.83 2.5 2.5 0 0 1 4.5-1.17z"/>
                                <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.07-4.14A3 3 0 0 0 22 12a3 3 0 0 0-4-2.83 2.5 2.5 0 0 0-4.5-1.17z"/>
                            </svg>
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 15 }}>AI Advisor</div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>VentureConnect Intelligence</div>
                        </div>
                    </div>

                    <button
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '9px 0', fontSize: 13 }}
                        onClick={startNewChat}
                    >
                        + New Conversation
                    </button>

                    {/* Startup selector */}
                    {myStartups.length > 1 && (
                        <select
                            className="form-select"
                            style={{ marginTop: 10, fontSize: 12 }}
                            value={startupId || ''}
                            onChange={e => { setStartupId(Number(e.target.value)); startNewChat(); }}
                        >
                            {myStartups.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Scrollable body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>

                    {/* Conversations */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '1px', padding: '0 8px', marginBottom: 8 }}>
                            CONVERSATIONS
                        </div>
                        {conversations.length === 0 && (
                            <div style={{ fontSize: 12, color: 'var(--text-3)', padding: '4px 8px' }}>
                                No conversations yet
                            </div>
                        )}
                        {conversations.map(conv => (
                            <div
                                key={conv.id}
                                onClick={() => selectConversation(conv.id)}
                                style={{
                                    padding: '9px 10px',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 6,
                                    background: activeConv?.id === conv.id ? 'var(--violet-dim)' : 'transparent',
                                    borderLeft: activeConv?.id === conv.id ? '2px solid var(--violet)' : '2px solid transparent',
                                    marginBottom: 2,
                                    transition: 'all 0.15s',
                                }}
                            >
                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                    <svg style={{ verticalAlign: 'middle', marginRight: 6, color: 'var(--text-3)' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    </svg>
                                    {conv.title || 'Untitled'}
                                </div>
                                <button
                                    onClick={e => deleteConversation(conv.id, e)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: '2px 4px', borderRadius: 4, fontSize: 12, flexShrink: 0 }}
                                    title="Delete"
                                >×</button>
                            </div>
                        ))}
                    </div>

                    {/* Documents */}
                    <div>
                        <div
                            style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '1px', padding: '0 8px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                            onClick={() => setDocsExpanded(e => !e)}
                        >
                            <span>DOCUMENTS ({documents.length})</span>
                            <span style={{ transform: docsExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
                        </div>
                        {docsExpanded && (
                            <>
                                <button
                                    className="btn btn-secondary"
                                    style={{ width: '100%', fontSize: 12, padding: '7px 0', marginBottom: 6 }}
                                    onClick={() => setShowUpload(true)}
                                >
                                    + Upload Document
                                </button>
                                {documents.length === 0 && (
                                    <div style={{ fontSize: 12, color: 'var(--text-3)', padding: '4px 8px' }}>No documents yet</div>
                                )}
                                {documents.map(doc => (
                                    <div
                                        key={doc.id}
                                        style={{
                                            padding: '7px 10px',
                                            borderRadius: 8,
                                            fontSize: 12,
                                            marginBottom: 2,
                                            background: 'rgba(255,255,255,0.02)',
                                            border: '1px solid var(--border)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 7,
                                        }}
                                    >
                                        <StatusDot status={doc.status} />
                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>
                                                {doc.name}
                                            </div>
                                            <div style={{ color: 'var(--text-3)', fontSize: 10, marginTop: 1 }}>
                                                {doc.fileType?.toUpperCase()} · {doc.status}
                                                {doc.chunksCreated ? ` · ${doc.chunksCreated} chunks` : ''}
                                            </div>
                                            {doc.status === 'FAILED' && doc.errorMessage && (
                                                <div style={{ color: 'var(--red)', fontSize: 10, marginTop: 2 }} title={doc.errorMessage}>
                                                    ⚠ {doc.errorMessage.slice(0, 60)}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => deleteDocument(doc.id)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: '2px 4px', borderRadius: 4, fontSize: 12, flexShrink: 0 }}
                                            title="Delete"
                                        >×</button>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ── CHAT AREA ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* Topbar */}
                <div style={{
                    padding: '14px 24px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', gap: 12,
                }}>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>
                            {activeConv ? activeConv.title : 'New Conversation'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                            {myStartups.find(s => s.id === startupId)?.name || ''}
                        </div>
                    </div>
                </div>

                {error && (
                    <div style={{ background: 'rgba(255,51,102,0.1)', borderBottom: '1px solid rgba(255,51,102,0.3)', padding: '10px 24px', fontSize: 13, color: 'var(--red)' }}>
                        ⚠ {error}
                        <button onClick={() => setError('')} style={{ marginLeft: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)' }}>✕</button>
                    </div>
                )}

                {/* Messages / Welcome */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                    {messages.length === 0 && !sending ? (
                        // Welcome screen
                        <div style={{ maxWidth: 680, margin: '0 auto' }}>
                            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                                <div style={{
                                    width: 64, height: 64, borderRadius: 18, margin: '0 auto 16px',
                                    background: 'linear-gradient(135deg, var(--violet), var(--teal))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.07-4.14A3 3 0 0 1 2 12a3 3 0 0 1 4-2.83 2.5 2.5 0 0 1 4.5-1.17z"/>
                                        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.07-4.14A3 3 0 0 0 22 12a3 3 0 0 0-4-2.83 2.5 2.5 0 0 0-4.5-1.17z"/>
                                    </svg>
                                </div>
                                <h2 style={{ marginBottom: 8 }}>VentureConnect AI Advisor</h2>
                                <p style={{ color: 'var(--text-2)', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
                                    Upload your startup documents and ask me anything. I'll analyze your pitch decks, financial reports, and business plans to provide evidence-based insights.
                                </p>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                                {SUGGESTED.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(q)}
                                        style={{
                                            padding: '14px 16px',
                                            background: 'rgba(20,20,30,0.6)',
                                            border: '1px solid var(--border)',
                                            borderRadius: 'var(--r-sm)',
                                            color: 'var(--text)',
                                            fontSize: 13,
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            lineHeight: 1.5,
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--violet)'; e.currentTarget.style.background = 'var(--violet-dim)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'rgba(20,20,30,0.6)'; }}
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div style={{ maxWidth: 800, margin: '0 auto' }}>
                            {messages.map((msg, i) => (
                                <MessageBubble key={msg.id || i} msg={msg} />
                            ))}
                            {sending && <LoadingDots />}
                            <div ref={chatEndRef} />
                        </div>
                    )}
                </div>

                {/* Input area */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid var(--border)',
                    background: 'rgba(10,10,16,0.5)',
                }}>
                    <div style={{
                        display: 'flex',
                        gap: 10,
                        maxWidth: 800,
                        margin: '0 auto',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--r-md)',
                        padding: '10px 14px',
                    }}>
                        <textarea
                            ref={textareaRef}
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about your startup documents… (Enter to send, Shift+Enter for new line)"
                            disabled={sending}
                            rows={1}
                            style={{
                                flex: 1,
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                color: 'var(--text)',
                                fontSize: 14,
                                resize: 'none',
                                minHeight: 24,
                                maxHeight: 160,
                                lineHeight: 1.6,
                                fontFamily: 'inherit',
                            }}
                            onInput={e => {
                                e.target.style.height = 'auto';
                                e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
                            }}
                        />
                        <button
                            onClick={() => sendMessage()}
                            disabled={sending || !inputText.trim()}
                            style={{
                                width: 38, height: 38,
                                borderRadius: 10, border: 'none',
                                background: sending || !inputText.trim()
                                    ? 'rgba(255,255,255,0.08)'
                                    : 'linear-gradient(135deg, var(--violet), var(--teal))',
                                cursor: sending || !inputText.trim() ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, alignSelf: 'flex-end',
                                transition: 'background 0.2s',
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                        </button>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: 'var(--text-3)' }}>
                        AI answers are grounded in your uploaded documents. Always verify critical figures.
                    </div>
                </div>
            </div>
        </div>
    );
}
