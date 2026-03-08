import React, { useEffect, useState } from 'react';
import { documentsApi, usersApi, startupsApi } from '../api';
import { useAuth } from '../context/AuthContext';

function UploadDocumentModal({ startups, onClose, onUpload }) {
    const [form, setForm] = useState({ 
        startupId: startups.length > 0 ? startups[0].id : '', 
        name: '', 
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
                        <label className="form-label">Description (Optional)</label>
                        <textarea className="form-textarea" placeholder="Briefly describe the document contents..." style={{ height: 80 }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
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

    return (
        <div className="page-container">
            {showUpload && <UploadDocumentModal startups={myStartups} onClose={() => setShowUpload(false)} onUpload={handleUpload} />}
            {shareTarget && <ShareDocumentModal document={shareTarget} onClose={() => setShareTarget(null)} />}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                <div>
                    <h1 className="topbar-title">Document Vault 🔐</h1>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                        Secure area for sensitive due diligence documents and permission control
                    </p>
                </div>
                {isStartup && (
                    <button className="btn btn-primary" onClick={() => setShowUpload(true)}>Upload Document</button>
                )}
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {loading ? (
                <div className="loading-screen"><div className="spinner" /><p>Accessing vault...</p></div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Startup view: My Documents */}
                    {isStartup && (
                        <div>
                            <div className="section-header" style={{ marginBottom: 16 }}>
                                <h2 style={{ fontSize: 18, fontWeight: 700 }}>My Secure Documents</h2>
                            </div>
                            {documents.length === 0 ? (
                                <div className="empty-state" style={{ padding: '40px 0' }}>
                                    <div className="empty-state-icon">📄</div>
                                    <h3>No documents in vault</h3>
                                    <p>Start by uploading your Pitch Deck, Financials, or Legal documents.</p>
                                </div>
                            ) : (
                                <div className="grid-auto">
                                    {documents.map(doc => (
                                        <div key={doc.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                                <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📁</div>
                                                <div style={{ flex: 1 }}>
                                                    <h3 style={{ fontSize: 15, fontWeight: 700 }}>{doc.name}</h3>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{doc.fileName.split('_').slice(1).join('_')} • {new Date(doc.uploadDate).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            {doc.description && <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{doc.description}"</p>}
                                            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => handleDownload(doc.id, doc.fileName.split('_').slice(1).join('_'))}>Download</button>
                                                <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => setShareTarget(doc)}>Share 🤝</button>
                                                <button className="btn btn-danger btn-sm" style={{ padding: '0 10px' }} onClick={() => handleDelete(doc.id)}>✕</button>
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
                            <div className="section-header" style={{ marginBottom: 16 }}>
                                <h2 style={{ fontSize: 18, fontWeight: 700 }}>Documents Shared with You</h2>
                            </div>
                            {sharedDocs.length === 0 ? (
                                <div className="empty-state" style={{ padding: '40px 0' }}>
                                    <div className="empty-state-icon">🔒</div>
                                    <h3>No shared documents</h3>
                                    <p>Documents shared by startups for due diligence will appear here.</p>
                                </div>
                            ) : (
                                <div className="grid-auto">
                                    {sharedDocs.map(doc => (
                                        <div key={doc.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                                <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📑</div>
                                                <div style={{ flex: 1 }}>
                                                    <h3 style={{ fontSize: 15, fontWeight: 700 }}>{doc.name}</h3>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>From {doc.startupName}</div>
                                                </div>
                                            </div>
                                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Type: {doc.fileType}</div>
                                            <button className="btn btn-primary btn-sm" onClick={() => handleDownload(doc.id, doc.fileName.split('_').slice(1).join('_'))}>Download Securely</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
