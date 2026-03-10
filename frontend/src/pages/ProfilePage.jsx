import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { usersApi, mentorsApi, investorProfilesApi } from '../api';

const ROLE_COLORS = {
    ADMIN: '#e05c5c', STARTUP: '#7c6fcd',
    INVESTOR: '#3dba78', MENTOR: '#e8a838', RESEARCHER: '#3fb9c5',
};

function getInitials(name, email) {
    if (name) {
        const parts = name.trim().split(' ');
        return parts.length > 1
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : name.slice(0, 2).toUpperCase();
    }
    return email ? email[0].toUpperCase() : '?';
}

function compressImage(file, maxPx = 256, quality = 0.82) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (evt) => {
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
                const w = Math.round(img.width * scale);
                const h = Math.round(img.height * scale);
                const canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = reject;
            img.src = evt.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

const SaveIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
    </svg>
);
const CameraIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
    </svg>
);
const LockIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);
const UserIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
);
const BriefcaseIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
);
const StarIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);
const ArrowRightIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
);
const CheckIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

function Toast({ message, type, onDismiss }) {
    return (
        <div
            onClick={onDismiss}
            style={{
                position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
                background: type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                border: `1px solid ${type === 'success' ? '#10b981' : '#ef4444'}`,
                borderLeft: `3px solid ${type === 'success' ? '#10b981' : '#ef4444'}`,
                color: type === 'success' ? '#10b981' : '#ef4444',
                borderRadius: 10, padding: '12px 18px',
                display: 'flex', alignItems: 'center', gap: 10,
                fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                animation: 'slideUp 0.25s ease',
            }}
        >
            {type === 'success' ? <CheckIcon /> : '⚠'} {message}
        </div>
    );
}

/* ─── Investor Profile Section ─── */
function InvestorProfileSection({ userId, roleColor }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ firmName: '', investmentFocus: '', minInvestmentSize: '', maxInvestmentSize: '', bio: '' });
    const [toast, setToast] = useState(null);

    useEffect(() => {
        investorProfilesApi.getByUserId(userId)
            .then(p => {
                setProfile(p);
                setForm({
                    firmName: p.firmName || '',
                    investmentFocus: p.investmentFocus || '',
                    minInvestmentSize: p.minInvestmentSize ?? '',
                    maxInvestmentSize: p.maxInvestmentSize ?? '',
                    bio: p.bio || '',
                });
            })
            .catch(() => setProfile(null))
            .finally(() => setLoading(false));
    }, [userId]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                firmName: form.firmName,
                investmentFocus: form.investmentFocus,
                minInvestmentSize: form.minInvestmentSize !== '' ? parseFloat(form.minInvestmentSize) : null,
                maxInvestmentSize: form.maxInvestmentSize !== '' ? parseFloat(form.maxInvestmentSize) : null,
                bio: form.bio,
            };
            const updated = await investorProfilesApi.updateByUserId(userId, payload);
            setProfile(updated);
            showToast('Investor profile saved!');
        } catch (err) {
            showToast(err.message || 'Failed to save', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="card" style={{ marginBottom: 18, padding: '22px 28px' }}>
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{
                    width: 32, height: 32, borderRadius: 9,
                    background: 'rgba(61,186,120,0.12)', color: '#3dba78',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <BriefcaseIcon />
                </div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Investor Profile</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Visible to startups and other users</div>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}><div className="spinner" /></div>
            ) : (
                <form onSubmit={handleSave}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                        <div className="form-group">
                            <label className="form-label">Firm / Organization</label>
                            <input className="form-input" placeholder="e.g. Sequoia Capital" value={form.firmName} onChange={e => setForm({ ...form, firmName: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Investment Focus</label>
                            <input className="form-input" placeholder="e.g. Fintech, AI, Healthcare" value={form.investmentFocus} onChange={e => setForm({ ...form, investmentFocus: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                        <div className="form-group">
                            <label className="form-label">Min Investment ($)</label>
                            <input className="form-input" type="number" placeholder="10000" value={form.minInvestmentSize} onChange={e => setForm({ ...form, minInvestmentSize: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Max Investment ($)</label>
                            <input className="form-input" type="number" placeholder="500000" value={form.maxInvestmentSize} onChange={e => setForm({ ...form, maxInvestmentSize: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 18 }}>
                        <label className="form-label">About / Investment Philosophy</label>
                        <textarea className="form-textarea" rows={3} placeholder="Describe your investment thesis and what you look for in startups…" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} style={{ resize: 'vertical', minHeight: 80 }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#3dba78', borderColor: '#3dba78' }}>
                            <SaveIcon />{saving ? 'Saving…' : 'Save Investor Profile'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

/* ─── Mentor Profile Section ─── */
function MentorProfileSection({ userId }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ expertise: '', bio: '', contactNumber: '', yearsOfExperience: '', currentTitle: '' });
    const [toast, setToast] = useState(null);

    useEffect(() => {
        mentorsApi.getByUserId(userId)
            .then(p => {
                setProfile(p);
                setForm({
                    expertise: p.expertise || '',
                    bio: p.bio || '',
                    contactNumber: p.contactNumber || '',
                    yearsOfExperience: p.yearsOfExperience ?? '',
                    currentTitle: p.currentTitle || '',
                });
            })
            .catch(() => setProfile(null))
            .finally(() => setLoading(false));
    }, [userId]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!profile?.id) {
            showToast('No mentor profile found to update.', 'error');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                ...form,
                yearsOfExperience: form.yearsOfExperience !== '' ? parseInt(form.yearsOfExperience) : null,
            };
            const updated = await mentorsApi.update(profile.id, payload);
            setProfile(updated);
            showToast('Mentor profile saved!');
        } catch (err) {
            showToast(err.message || 'Failed to save', 'error');
        } finally {
            setSaving(false);
        }
    };

    const statusColors = { APPROVED: '#10b981', PENDING: '#f59e0b', REJECTED: '#ef4444' };

    return (
        <div className="card" style={{ marginBottom: 18, padding: '22px 28px' }}>
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 9,
                        background: 'rgba(232,168,56,0.12)', color: '#e8a838',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <StarIcon />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Mentor Profile</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Visible to startups seeking guidance</div>
                    </div>
                </div>
                {profile?.status && (
                    <span style={{
                        padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                        background: (statusColors[profile.status] || '#f59e0b') + '22',
                        color: statusColors[profile.status] || '#f59e0b',
                        border: `1px solid ${(statusColors[profile.status] || '#f59e0b')}44`,
                    }}>{profile.status}</span>
                )}
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}><div className="spinner" /></div>
            ) : !profile ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-3)', fontSize: 13 }}>
                    No mentor profile found. Apply to become a mentor from the <strong>Mentors</strong> page.
                </div>
            ) : (
                <form onSubmit={handleSave}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                        <div className="form-group">
                            <label className="form-label">Professional Title</label>
                            <input className="form-input" placeholder="e.g. Senior Architect" value={form.currentTitle} onChange={e => setForm({ ...form, currentTitle: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Years of Experience</label>
                            <input className="form-input" type="number" placeholder="10" value={form.yearsOfExperience} onChange={e => setForm({ ...form, yearsOfExperience: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                        <div className="form-group">
                            <label className="form-label">Mentorship Expertise</label>
                            <input className="form-input" placeholder="e.g. Scaling, AI, Marketing" value={form.expertise} onChange={e => setForm({ ...form, expertise: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Contact Number</label>
                            <input className="form-input" placeholder="+1 234 567 890" value={form.contactNumber} onChange={e => setForm({ ...form, contactNumber: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 18 }}>
                        <label className="form-label">Mentorship Pitch (Bio)</label>
                        <textarea className="form-textarea" rows={3} placeholder="Why should startups choose you as a mentor?" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} style={{ resize: 'vertical', minHeight: 80 }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#e8a838', borderColor: '#e8a838', color: '#000' }}>
                            <SaveIcon />{saving ? 'Saving…' : 'Save Mentor Profile'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

/* ─── Main Profile Page ─── */
export default function ProfilePage() {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const roleColor = ROLE_COLORS[user?.role] || '#7c6fcd';

    const [name, setName] = useState(user?.name || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [photoPreview, setPhotoPreview] = useState(user?.profilePhotoUrl || null);
    const [photoData, setPhotoData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const fileRef = useRef(null);

    const avatarSrc = photoPreview;
    const avatarBg = avatarSrc
        ? `url(${avatarSrc}) center/cover no-repeat`
        : `linear-gradient(135deg, ${roleColor}, #7c6fcd)`;

    const handleFilePick = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setToast({ message: 'Please choose an image file.', type: 'error' });
            setTimeout(() => setToast(null), 3000);
            return;
        }
        try {
            const compressed = await compressImage(file, 256, 0.85);
            setPhotoPreview(compressed);
            setPhotoData(compressed);
        } catch {
            setToast({ message: 'Could not process image.', type: 'error' });
            setTimeout(() => setToast(null), 3000);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!user?.id) return;
        setLoading(true);
        try {
            const updatedPhotoUrl = photoData ?? user?.profilePhotoUrl ?? '';
            await usersApi.update(user.id, {
                name,
                email: user.email,
                bio,
                profilePhotoUrl: updatedPhotoUrl,
                role: user.role,
            });
            updateUser({ name, bio, profilePhotoUrl: updatedPhotoUrl });
            setPhotoData(null);
            setToast({ message: 'Profile saved!', type: 'success' });
            setTimeout(() => setToast(null), 3000);
        } catch (err) {
            setToast({ message: err.message || 'Failed to save.', type: 'error' });
            setTimeout(() => setToast(null), 3500);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container" style={{ maxWidth: 680, margin: '0 auto' }}>
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

            {/* Page title */}
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 21, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Profile Settings</h1>
                <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
                    Update your display name, photo, bio, and role-specific profile.
                </p>
            </div>

            {/* Avatar hero */}
            <div className="card" style={{ marginBottom: 18, padding: '26px 28px' }}>
                <div style={{ display: 'flex', gap: 22, alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Avatar + camera button */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{
                            width: 86, height: 86, borderRadius: '50%',
                            background: avatarBg,
                            border: `3px solid ${roleColor}55`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 26, fontWeight: 700, color: '#fff',
                            boxShadow: `0 0 0 4px ${roleColor}1a`,
                            overflow: 'hidden',
                        }}>
                            {!avatarSrc && getInitials(user?.name, user?.email)}
                        </div>
                        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFilePick} />
                        <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            style={{
                                position: 'absolute', bottom: 0, right: 0,
                                width: 28, height: 28, borderRadius: '50%',
                                background: 'var(--violet)', border: '2px solid var(--navy)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: '#fff',
                            }}
                            title="Upload photo"
                        >
                            <CameraIcon />
                        </button>
                    </div>

                    {/* User meta */}
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>
                            {user?.name || 'Your Name'}
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: 8 }}>{user?.email}</div>
                        <span style={{
                            display: 'inline-block', padding: '3px 10px', borderRadius: 99,
                            fontSize: 11, fontWeight: 700,
                            background: roleColor + '22', color: roleColor,
                            border: `1px solid ${roleColor}44`, letterSpacing: '0.04em',
                        }}>
                            {user?.role}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 7,
                            padding: '8px 14px', borderRadius: 8,
                            background: 'var(--violet-dim)', color: 'var(--violet)',
                            border: '1px solid rgba(124,111,205,0.3)',
                            cursor: 'pointer', fontSize: 13, fontWeight: 600,
                            transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,111,205,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--violet-dim)'}
                    >
                        <CameraIcon /> Change photo
                    </button>
                </div>
                {photoData && (
                    <div style={{
                        marginTop: 12, padding: '8px 12px', borderRadius: 8,
                        background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)',
                        fontSize: 12, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        <CheckIcon /> New photo selected — click <strong>Save changes</strong> to apply.
                    </div>
                )}
            </div>

            {/* Personal info form */}
            <div className="card" style={{ marginBottom: 18, padding: '22px 28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                    <div style={{
                        width: 30, height: 30, borderRadius: 8,
                        background: 'var(--violet-dim)', color: 'var(--violet)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <UserIcon />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text)' }}>Personal Info</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Name and bio visible to others on the platform</div>
                    </div>
                </div>

                <form onSubmit={handleSave}>
                    <div className="form-group" style={{ marginBottom: 14 }}>
                        <label className="form-label" htmlFor="pf-name">Display Name</label>
                        <input
                            id="pf-name"
                            className="form-input"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Your name"
                            required
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: 20 }}>
                        <label className="form-label" htmlFor="pf-bio">Bio</label>
                        <textarea
                            id="pf-bio"
                            className="form-textarea"
                            rows={3}
                            value={bio}
                            onChange={e => setBio(e.target.value)}
                            placeholder="Tell the community about yourself…"
                            style={{ resize: 'vertical', minHeight: 80 }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                            style={{ display: 'flex', alignItems: 'center', gap: 7 }}
                        >
                            <SaveIcon />
                            {loading ? 'Saving…' : 'Save changes'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Role-specific profile sections */}
            {user?.role === 'INVESTOR' && user?.id && (
                <InvestorProfileSection userId={user.id} roleColor={ROLE_COLORS.INVESTOR} />
            )}
            {user?.role === 'MENTOR' && user?.id && (
                <MentorProfileSection userId={user.id} />
            )}

            {/* Change password link-card */}
            <div
                className="card"
                style={{
                    padding: '20px 28px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                }}
                onClick={() => navigate('/change-password')}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = ''}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 30, height: 30, borderRadius: 8,
                        background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <LockIcon />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text)' }}>Change Password</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Update your account password</div>
                    </div>
                </div>
                <span style={{ color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}>
                    <ArrowRightIcon />
                </span>
            </div>
        </div>
    );
}
