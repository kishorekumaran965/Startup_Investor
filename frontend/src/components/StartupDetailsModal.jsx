import React from 'react';

export default function StartupDetailsModal({ startup, onClose, onExpressInterest, onViewTimeline, onOpenChat, isInvestor }) {
  if (!startup) return null;

  const formatCurrency = (val) => {
    if (val == null || isNaN(val)) return '—';
    const num = Number(val);
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}k`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const getTierBadge = (tier) => {
    switch (tier) {
      case 'HIGH_POTENTIAL':
      case 'HIGH':
        return { label: 'High Potential', color: 'var(--green, #00f5d4)', bg: 'rgba(0, 245, 212, 0.12)', border: 'rgba(0, 245, 212, 0.25)' };
      case 'MODERATE_POTENTIAL':
      case 'MODERATE':
        return { label: 'Moderate Potential', color: 'var(--amber, #fca311)', bg: 'rgba(252, 163, 17, 0.12)', border: 'rgba(252, 163, 17, 0.25)' };
      case 'LOW_POTENTIAL':
      case 'LOW':
        return { label: 'Low Potential', color: 'var(--red, #f72585)', bg: 'rgba(247, 37, 133, 0.12)', border: 'rgba(247, 37, 133, 0.25)' };
      default:
        return null;
    }
  };

  const tierInfo = getTierBadge(startup.investmentPotentialTier);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, #12121c 0%, #0c0c14 100%)',
          border: '1px solid var(--border, rgba(255, 255, 255, 0.12))',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(247, 37, 133, 0.08)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 28px',
            borderBottom: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(247, 37, 133, 0.25), rgba(76, 201, 240, 0.25))',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '26px'
              }}
            >
              🚀
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
                  {startup.name}
                </h2>
                {startup.stage && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '3px 9px',
                      borderRadius: '20px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: 'var(--text-muted, #94a3b8)',
                      letterSpacing: '0.04em'
                    }}
                  >
                    {startup.stage}
                  </span>
                )}
                {startup.sector && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '3px 9px',
                      borderRadius: '20px',
                      background: 'rgba(76, 201, 240, 0.12)',
                      color: 'var(--teal, #4cc9f0)',
                      border: '1px solid rgba(76, 201, 240, 0.25)'
                    }}
                  >
                    {startup.sector}
                  </span>
                )}
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
                Founder: <span style={{ color: '#fff', fontWeight: 500 }}>{startup.founder?.name || 'Venture Founder'}</span>
                {startup.founder?.email && ` (${startup.founder.email})`}
                {startup.location && ` • 📍 ${startup.location}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              color: 'var(--text-muted, #94a3b8)',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              transition: 'background 0.2s, color 0.2s'
            }}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Content body */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Business Summary */}
          <div>
            <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted, #94a3b8)' }}>
              Executive Summary
            </h4>
            <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.6', color: '#e2e8f0', whiteSpace: 'pre-wrap' }}>
              {startup.description || 'No detailed pitch provided yet.'}
            </p>
          </div>

          {/* AI Investment Prediction Section */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(247, 37, 133, 0.06), rgba(76, 201, 240, 0.06))',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '16px 20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>🤖</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', letterSpacing: '0.02em' }}>
                  AI Investment Analysis
                </span>
              </div>
              {tierInfo ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '16px',
                      color: tierInfo.color,
                      backgroundColor: tierInfo.bg,
                      border: `1px solid ${tierInfo.border}`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: tierInfo.color }} />
                    {tierInfo.label}
                  </span>
                  {startup.investmentPotentialScore != null && (
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--teal, #4cc9f0)' }}>
                      {(startup.investmentPotentialScore * 100).toFixed(1)}% Confidence
                    </span>
                  )}
                </div>
              ) : (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>Pending Evaluation</span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.82rem' }}>
              <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '10px 14px', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-muted, #94a3b8)', marginBottom: '4px' }}>Match Score</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: startup.matchScore >= 70 ? 'var(--green, #00f5d4)' : '#fff' }}>
                  {startup.matchScore != null ? `${startup.matchScore}%` : '85%'}
                </div>
              </div>
              <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '10px 14px', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-muted, #94a3b8)', marginBottom: '4px' }}>Key Growth Drivers</div>
                <div style={{ color: '#e2e8f0' }}>
                  {startup.matchReasons && startup.matchReasons.length > 0
                    ? startup.matchReasons.join(', ')
                    : 'Strong domain alignment, viable unit economics'}
                </div>
              </div>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div>
            <h4 style={{ margin: '0 0 12px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted, #94a3b8)' }}>
              Financial & Round Overview
            </h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '12px'
              }}
            >
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>Funding Goal</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--teal, #4cc9f0)', marginTop: '4px' }}>
                  {formatCurrency(startup.fundingGoal)}
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>Company Valuation</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
                  {formatCurrency(startup.companyValuation)}
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>Equity Offered</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--violet, #f72585)', marginTop: '4px' }}>
                  {startup.availableEquity != null ? `${startup.availableEquity}%` : '—'}
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>Annual Revenue</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
                  {formatCurrency(startup.annualRevenue)}
                </div>
              </div>

              {startup.runwayMonths != null && (
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>Runway</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
                    {startup.runwayMonths} Months
                  </div>
                </div>
              )}

              {startup.monthlyExpenses != null && (
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>Monthly Burn</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
                    {formatCurrency(startup.monthlyExpenses)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div
          style={{
            padding: '18px 28px',
            borderTop: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
            background: 'rgba(0, 0, 0, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <button
            onClick={() => {
              onClose();
              if (onViewTimeline) onViewTimeline(startup);
            }}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            ⏱️ View Timeline
          </button>

          <button
            onClick={() => {
              onClose();
              if (onOpenChat) onOpenChat(startup);
            }}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              background: 'rgba(76, 201, 240, 0.12)',
              border: '1px solid rgba(76, 201, 240, 0.25)',
              color: 'var(--teal, #4cc9f0)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            💬 Chat Founder
          </button>

          {isInvestor && (
            <button
              onClick={() => {
                onClose();
                if (onExpressInterest) onExpressInterest(startup);
              }}
              style={{
                padding: '9px 20px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--violet, #f72585), #7209b7)',
                border: 'none',
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(247, 37, 133, 0.35)'
              }}
            >
              💰 Express Interest
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
