import React, { useEffect, useState } from 'react';
import { documentsApi, usersApi, startupsApi } from '../api';
import { useAuth } from '../context/AuthContext';

function UploadDocumentModal({ startups, onClose, onUpload }) {
    const [form, setForm] = useState({ 
        startupId: startups.length > 0 ? startups[0].id : '', 
        name: '', 
        category: 'Pitch Decks',
        description: '' 
    });
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !form.startupId) return;
        
        setLoading(true);
        const formData = new FormData();
        formData.append('startupId', form.startupId);
        formData.append('name', form.name);
        formData.append('category', form.category);
        formData.append('description', form.description);
        formData.append('file', file);

        try {
            await onUpload(formData);
            onClose();
        } catch (err) { alert(err.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box" style={{ maxWidth: 450 }}>
                <div className="modal-header">
                    <h2 className="modal-title">🔐 Upload Sensitive Document</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Select Startup</label>
                        <select className="form-select" required value={form.startupId} onChange={e => setForm({ ...form, startupId: e.target.value })}>
                            <option value="">-- Choose Startup --</option>
                            {startups.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ marginTop: 12 }}>
                        <label className="form-label">Document Name</label>
                        <input className="form-input" placeholder="e.g. Q4 Financial Statement" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ marginTop: 12 }}>
                        <label className="form-label">Classification</label>
                        <select className="form-select" required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                            <option value="Pitch Decks">Pitch Decks</option>
                            <option value="Financial Reports">Financial Reports</option>
                            <option value="Legal & IP">Legal & IP</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="form-group" style={{ marginTop: 12 }}>
                        <label className="form-label">Synopsis (Optional)</label>
                        <textarea className="form-textarea" placeholder="Briefly describe the document contents..." style={{ height: 60 }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ marginTop: 12 }}>
                        <label className="form-label">File (PDF, PNG, JPG)</label>
                        <input type="file" className="form-input" required onChange={e => setFile(e.target.files[0])} />
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Uploading...' : 'Upload to Vault'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ShareDocumentModal({ document, onClose }) {
    const [investors, setInvestors] = useState([]);
    const [selectedInvestorId, setSelectedInvestorId] = useState('');
    const [expiryDays, setExpiryDays] = useState('7');
    const [loading, setLoading] = useState(true);
    const [sharing, setSharing] = useState(false);

    useEffect(() => {
        usersApi.getAll().then(users => {
            setInvestors(users.filter(u => u.role === 'INVESTOR'));
        }).finally(() => setLoading(false));
    }, []);

    const handleShare = async () => {
        if (!selectedInvestorId) return;
        setSharing(true);
        try {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays));
            
            await documentsApi.grantPermission({
                documentId: document.id,
                investorId: selectedInvestorId,
                expiryDate: expiryDate.toISOString(),
                isTemporary: true
            });
            alert('Access granted successfully!');
            onClose();
        } catch (err) { alert(err.message); }
        finally { setSharing(false); }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box" style={{ maxWidth: 450 }}>
                <div className="modal-header">
                    <h2 className="modal-title">🤝 Grant Temporary Access</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <p style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
                    Granting access to <strong>{document.name}</strong>. The investor will be able to view and download this document until it expires.
                </p>
                {loading ? <div className="spinner" /> : (
                    <>
                        <div className="form-group">
                            <label className="form-label">Select Investor</label>
                            <select className="form-select" value={selectedInvestorId} onChange={e => setSelectedInvestorId(e.target.value)}>
                                <option value="">-- Choose Investor --</option>
                                {investors.map(i => <option key={i.id} value={i.id}>{i.name} ({i.email})</option>)}
                            </select>
                        </div>
                        <div className="form-group" style={{ marginTop: 12 }}>
                            <label className="form-label">Access Duration (Days)</label>
                            <select className="form-select" value={expiryDays} onChange={e => setExpiryDays(e.target.value)}>
                                <option value="1">1 Day</option>
                                <option value="3">3 Days</option>
                                <option value="7">7 Days</option>
                                <option value="14">14 Days</option>
                                <option value="30">30 Days</option>
                            </select>
                        </div>
                    </>
                )}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" disabled={!selectedInvestorId || sharing} onClick={handleShare}>
                        {sharing ? 'Granting...' : 'Grant Access'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function DocumentVaultPage() {
    const { user } = useAuth();
    const [documents, setDocuments] = useState([]);
    const [sharedDocs, setSharedDocs] = useState([]);
    const [myStartups, setMyStartups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const [showUpload, setShowUpload] = useState(false);
    const [shareTarget, setShareTarget] = useState(null);
    const [error, setError] = useState(null);

    const isStartup = user?.role === 'STARTUP';
    const isInvestor = user?.role === 'INVESTOR';

    const loadData = async () => {
        setLoading(true);
        try {
            if (isStartup) {
                const startups = await usersApi.getStartups(user.id);
                setMyStartups(startups);
                if (startups.length > 0) {
                    const docs = await documentsApi.getByStartup(startups[0].id);
                    setDocuments(docs);
                }
            } else if (isInvestor) {
                const docs = await documentsApi.getSharedForInvestor(user.id);
                setSharedDocs(docs);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [user?.id]);

    const handleUpload = async (formData) => {
        await documentsApi.upload(formData);
        loadData();
    };

    const handleDownload = async (docId, fileName) => {
        try {
            const blob = await documentsApi.download(docId, user.id);
            const url = window.URL.createObjectURL(blob);
            const a = window.document.createElement('a');
            a.href = url;
            a.download = fileName;
            window.document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (err) { alert(err.message); }
    };

    const handleDelete = async (docId) => {
        if (!window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) return;
        try {
            await documentsApi.delete(docId);
            loadData();
        } catch (err) { alert(err.message); }
    };

    const categories = ['All', 'Pitch Decks', 'Financial Reports', 'Legal & IP', 'Other'];
    const filteredDocs = activeCategory === 'All' ? documents : documents.filter(d => d.category === activeCategory);
    const filteredSharedDocs = activeCategory === 'All' ? sharedDocs : sharedDocs.filter(d => d.category === activeCategory);

    return (
        <div className="page-container">
            {showUpload && <UploadDocumentModal startups={myStartups} onClose={() => setShowUpload(false)} onUpload={handleUpload} />}
            {shareTarget && <ShareDocumentModal document={shareTarget} onClose={() => setShareTarget(null)} />}

            <div className="hero-section" style={{ 
                marginBottom: 32, 
                padding: '32px',
                borderRadius: 'var(--r-lg)',
                background: 'var(--navy-2)',
                border: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <h1 className="hero-title" style={{ fontSize: '28px', marginBottom: '4px' }}>Document Vault 🔐</h1>
                    <p className="hero-subtitle" style={{ fontSize: '14px', color: 'var(--text-3)' }}>Deep-level security and high-fidelity file management.</p>
                </div>
                {isStartup && (
                    <button className="btn btn-primary" style={{ padding: '12px 24px' }} onClick={() => setShowUpload(true)}>
                        Upload New Asset
                    </button>
                )}
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {loading ? (
                <div className="loading-screen"><div className="spinner" /><p>Accessing vault...</p></div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 32 }}>
                    
                    {/* Vault Sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div className="card" style={{ padding: '16px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-3)', marginBottom: '16px', letterSpacing: '1px' }}>CATEGORIES</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {categories.map(cat => (
                                    <div 
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        style={{ 
                                            padding: '10px 12px', 
                                            borderRadius: '8px', 
                                            background: activeCategory === cat ? 'var(--violet-dim)' : 'transparent', 
                                            color: activeCategory === cat ? 'var(--violet)' : 'var(--text-3)', 
                                            fontWeight: activeCategory === cat ? 'bold' : 'normal', 
                                            fontSize: '13px', 
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {cat}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card" style={{ padding: '16px', background: 'rgba(76, 201, 240, 0.05)', borderColor: 'rgba(76, 201, 240, 0.2)' }}>
                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--teal)', marginBottom: '8px' }}>VAULT STATUS</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Everything is encrypted. Only you and authorized investors can view these assets.</div>
                        </div>
                    </div>

                    {/* Main Vault Content */}
                    <div>
                        {/* Startup view: My Documents */}
                        {isStartup && (
                            <div>
                                {filteredDocs.length === 0 ? (
                                    <div className="empty-state" style={{ padding: '40px 0' }}>
                                        <div className="empty-state-icon">📄</div>
                                        <h3>{activeCategory === 'All' ? 'No documents in vault' : `No ${activeCategory} yet`}</h3>
                                        <p>Start by uploading your Pitch Deck, Financials, or Legal documents.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                                        {filteredDocs.map(doc => (
                                            <div key={doc.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '24px', transition: 'var(--anim)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div style={{ 
                                                        width: 48, 
                                                        height: 48, 
                                                        borderRadius: 12, 
                                                        background: 'var(--violet-dim)', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center', 
                                                        fontSize: 24,
                                                        color: 'var(--violet)'
                                                    }}>
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                                    </div>
                                                    <button 
                                                        className="btn btn-ghost" 
                                                        style={{ padding: '4px 8px', color: 'var(--red)' }}
                                                        onClick={() => handleDelete(doc.id)}
                                                    >Delete</button>
                                                </div>
                                                
                                                <div>
                                                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{doc.name}</h3>
                                                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                                                        {new Date(doc.uploadDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                                                    <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => handleDownload(doc.id, doc.fileName.split('_').slice(1).join('_'))}>Download</button>
                                                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => setShareTarget(doc)}>Share</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Investor view: Shared Documents */}
                        {isInvestor && (
                            <div>
                                {filteredSharedDocs.length === 0 ? (
                                    <div className="empty-state" style={{ padding: '40px 0' }}>
                                        <div className="empty-state-icon">🔒</div>
                                        <h3>{activeCategory === 'All' ? 'No shared documents' : `No shared ${activeCategory}`}</h3>
                                        <p>Documents shared by startups for due diligence will appear here.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                                        {filteredSharedDocs.map(doc => (
                                            <div key={doc.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '24px' }}>
                                                <div style={{ 
                                                    width: 48, 
                                                    height: 48, 
                                                    borderRadius: 12, 
                                                    background: 'rgba(16, 185, 129, 0.1)', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center', 
                                                    fontSize: 24,
                                                    color: 'var(--green)'
                                                }}>
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                                </div>
                                                
                                                <div>
                                                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{doc.name}</h3>
                                                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Shared by <strong>{doc.startupName}</strong></div>
                                                </div>

                                                <button 
                                                    className="btn btn-primary btn-sm" 
                                                    style={{ marginTop: 'auto' }}
                                                    onClick={() => handleDownload(doc.id, doc.fileName.split('_').slice(1).join('_'))}
                                                >
                                                    Secure Download
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
