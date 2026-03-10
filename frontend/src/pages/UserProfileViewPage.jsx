import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usersApi, mentorsApi, investorProfilesApi } from '../api';
import { useAuth } from '../context/AuthContext';

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

const BackIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
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

const InfoRow = ({ label, value }) => {
    if (!value && value !== 0) return null;
    return (
        <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
            <span style={{ fontSize: 12.5, color: 'var(--text-2)', fontWeight: 500, minWidth: 140 }}>{label}</span>
            <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600, textAlign: 'right', flex: 1, marginLeft: 12 }}>{value}</span>
        </div>
    );
};

export default function UserProfileViewPage() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const [profileUser, setProfileUser] = useState(null);
    const [mentorProfile, setMentorProfile] = useState(null);
    const [investorProfile, setInvestorProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!userId) return;
        const id = parseInt(userId);
        setLoading(true);
        setError(null);

        // If viewing own profile, redirect to /profile
        if (currentUser?.id === id) {
            navigate('/profile', { replace: true });
            return;
        }

        usersApi.getById(id)
            .then(async (userData) => {
                setProfileUser(userData);
                // Load role-specific profile
                if (userData.role === 'MENTOR') {
                    try {
                        const mp = await mentorsApi.getByUserId(id);
                        setMentorProfile(mp);
                    } catch { /* no mentor profile */ }
                } else if (userData.role === 'INVESTOR') {
                    try {
                        const ip = await investorProfilesApi.getByUserId(id);
                        setInvestorProfile(ip);
                    } catch { /* no investor profile */ }
                }
            })
            .catch(err => setError(err.message || 'User not found'))
            .finally(() => setLoading(false));
    }, [userId, currentUser?.id]);

    if (loading) return (
        <div className="loading-screen">
            <div className="spinner" />
            <p>Loading profile...</p>
        </div>
    );

    if (error) return (
        <div className="page-container" style={{ maxWidth: 680, margin: '0 auto' }}>
            <div className="alert alert-error">⚠ {error}</div>
            <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Go Back</button>
        </div>
    );

    if (!profileUser) return null;

    const roleColor = ROLE_COLORS[profileUser.role] || '#7c6fcd';
    const avatarSrc = profileUser.profilePhotoUrl;
    const avatarBg = avatarSrc
        ? `url(${avatarSrc}) center/cover no-repeat`
        : `linear-gradient(135deg, ${roleColor}, #7c6fcd)`;

    return (
        <div className="page-container" style={{ maxWidth: 700, margin: '0 auto' }}>
            {/* Back button */}
            <button
                onClick={() => navigate(-1)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'none', border: 'none', color: 'var(--text-2)',
                    cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 20,
                    padding: '6px 10px', borderRadius: 8,
                    transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--text)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-2)'; }}
            >
                <BackIcon /> Back
            </button>

            {/* Hero card */}
            <div className="card" style={{ marginBottom: 18, padding: '28px 28px' }}>
                <div style={{ display: 'flex', gap: 22, alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Avatar */}
                    <div style={{
                        width: 90, height: 90, borderRadius: '50%',
                        background: avatarBg,
                        border: `3px solid ${roleColor}55`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 28, fontWeight: 700, color: '#fff',
                        boxShadow: `0 0 0 4px ${roleColor}1a`,
                        overflow: 'hidden', flexShrink: 0,
                    }}>
                        {!avatarSrc && getInitials(profileUser.name, profileUser.email)}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                            {profileUser.name || 'Unknown User'}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 10 }}>
                            {profileUser.email}
                        </div>
                        <span style={{
                            display: 'inline-block', padding: '4px 12px', borderRadius: 99,
                            fontSize: 11, fontWeight: 700,
                            background: roleColor + '22', color: roleColor,
                            border: `1px solid ${roleColor}44`, letterSpacing: '0.04em',
                        }}>
                            {profileUser.role}
                        </span>
                    </div>
                </div>

                {/* Bio */}
                {profileUser.bio && (
                    <div style={{
                        marginTop: 20, padding: '14px 16px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)',
                        fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.7,
                        fontStyle: 'italic',
                    }}>
                        "{profileUser.bio}"
                    </div>
                )}
            </div>

            {/* Investor Profile */}
            {profileUser.role === 'INVESTOR' && (
                <div className="card" style={{ marginBottom: 18, padding: '22px 28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 9,
                            background: 'rgba(61,186,120,0.12)', color: '#3dba78',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <BriefcaseIcon />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Investor Profile</div>
                            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Investment details and focus areas</div>
                        </div>
                    </div>

                    {!investorProfile ? (
                        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-3)', fontSize: 13 }}>
                            No investment profile set up yet.
                        </div>
                    ) : (
                        <div>
                            <InfoRow label="Firm / Organization" value={investorProfile.firmName} />
                            <InfoRow label="Investment Focus" value={investorProfile.investmentFocus} />
                            <InfoRow
                                label="Investment Range"
                                value={
                                    investorProfile.minInvestmentSize != null && investorProfile.maxInvestmentSize != null
                                        ? `$${Number(investorProfile.minInvestmentSize).toLocaleString()} – $${Number(investorProfile.maxInvestmentSize).toLocaleString()}`
                                        : investorProfile.minInvestmentSize != null
                                            ? `From $${Number(investorProfile.minInvestmentSize).toLocaleString()}`
                                            : investorProfile.maxInvestmentSize != null
                                                ? `Up to $${Number(investorProfile.maxInvestmentSize).toLocaleString()}`
                                                : null
                                }
                            />
                            {investorProfile.bio && (
                                <div style={{ marginTop: 14 }}>
                                    <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>About</div>
                                    <p style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.7 }}>{investorProfile.bio}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Mentor Profile */}
            {profileUser.role === 'MENTOR' && (
                <div className="card" style={{ marginBottom: 18, padding: '22px 28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 9,
                            background: 'rgba(232,168,56,0.12)', color: '#e8a838',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <StarIcon />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Mentor Profile</div>
                            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Expertise & mentorship details</div>
                        </div>
                    </div>

                    {!mentorProfile ? (
                        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-3)', fontSize: 13 }}>
                            No mentor profile available.
                        </div>
                    ) : (
                        <div>
                            <InfoRow label="Current Title" value={mentorProfile.currentTitle} />
                            <InfoRow label="Years of Experience" value={mentorProfile.yearsOfExperience != null ? `${mentorProfile.yearsOfExperience} years` : null} />
                            <InfoRow label="Contact Number" value={mentorProfile.contactNumber} />
                            <InfoRow label="Status" value={mentorProfile.status} />

                            {mentorProfile.expertise && (
                                <div style={{ marginTop: 14, marginBottom: 14 }}>
                                    <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Expertise Areas</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {mentorProfile.expertise.split(',').map((tag, i) => (
                                            <span key={i} style={{
                                                padding: '5px 12px',
                                                background: 'rgba(232,168,56,0.1)',
                                                color: '#e8a838',
                                                border: '1px solid rgba(232,168,56,0.25)',
                                                borderRadius: 20, fontSize: 12, fontWeight: 600,
                                            }}>{tag.trim()}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {mentorProfile.bio && (
                                <div style={{ marginTop: 14 }}>
                                    <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Mentorship Pitch</div>
                                    <p style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.7 }}>{mentorProfile.bio}</p>
                                </div>
                            )}

                            {mentorProfile.startups?.length > 0 && (
                                <div style={{ marginTop: 14 }}>
                                    <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                        Mentoring {mentorProfile.startups.length} Startup{mentorProfile.startups.length > 1 ? 's' : ''}
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {mentorProfile.startups.map(s => (
                                            <span key={s.id} style={{
                                                padding: '5px 12px',
                                                background: 'rgba(124,111,205,0.1)',
                                                color: 'var(--violet)',
                                                border: '1px solid rgba(124,111,205,0.25)',
                                                borderRadius: 20, fontSize: 12, fontWeight: 600,
                                            }}>🚀 {s.name}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
