import React, { useState, useEffect } from 'react';
import TradingConsole from './TradingConsole';
import VaultWallet from './VaultWallet';
import LangToggle from './LangToggle';
import translations from '../i18n/translations';
import useMediaQuery from '../hooks/useMediaQuery';
import { API_BASE } from '../config';

const getPayoutActionMessage = (failureReason, t) => {
  if (!failureReason) return null;
  const reason = failureReason.toLowerCase();
  if (reason.includes('valid trc-20') || reason.includes('address')) {
    return t.payoutActionInvalid;
  }
  if (reason.includes('exceeds') || reason.includes('limit')) {
    return t.payoutActionInvalid;
  }
  if (reason.includes('provider') || reason.includes('4021')) {
    return t.payoutActionProvider;
  }
  return t.payoutActionInvalid;
};

export default function ClientDashboard({ broker, onLogOut, lang, setLang }) {
  const isMobile = useMediaQuery('(max-width: 820px)');
  const [activeClientTab, setActiveClientTab] = useState('OVERVIEW');
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [myWithdrawals, setMyWithdrawals] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [profileError, setProfileError] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passForm, setPassForm] = useState({ current: '', next: '', confirm: '' });

  const userEmail = broker.activeUser || 'jane.doe@propfirm.com';
  const userName = userEmail.split('@')[0].replace('.', ' ').toUpperCase();
  const t = translations[lang].dashboard;

  useEffect(() => {
    fetchWithdrawals();
    if (activeClientTab === 'PROFILE') fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail, activeClientTab]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        headers: { 'Authorization': `Bearer ${broker.sessionToken}` }
      });
      const data = await res.json();
      if (res.ok && data.data) setProfileData(data.data);
      else setProfileError(t.profileLoadError);
    } catch {
      setProfileError(t.profileLoadError);
    }
  };

  const handleSyncBalance = () => {
    if (!profileData) return;
    broker.hydrateWalletBalance(profileData.cash_balance);
    setProfileError('');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMsg('');
    setProfileError('');
    if (passForm.next !== passForm.confirm) {
      setProfileError(t.profilePassMismatch);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${broker.sessionToken}`
        },
        body: JSON.stringify({ current_password: passForm.current, new_password: passForm.next })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Password update failed');
      setPassMsg(t.profilePassSuccess);
      setPassForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      setProfileError(err.message);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/withdrawals/my-requests`, {
        headers: { 'Authorization': `Bearer ${broker.sessionToken}` }
      });
      const data = await res.json();
      if (res.ok && data.data) setMyWithdrawals(data.data);
    } catch (e) { console.error(e); }
  };

  const tabStyle = (tab) => ({
    padding: '14px 20px',
    background: 'transparent',
    color: activeClientTab === tab ? '#eab308' : '#94a3b8',
    border: 'none',
    borderBottom: activeClientTab === tab ? '3px solid #eab308' : '3px solid transparent',
    cursor: 'pointer',
    fontWeight: '800',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  });

  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc', display: 'flex', flexDirection: 'column', width: '100vw', overflowX: 'hidden' }}>
      
      {/* Header */}
      <header style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', padding: isMobile ? '12px 16px' : '12px 35px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: isMobile ? 'auto' : '60px', boxSizing: 'border-box', position: 'sticky', top: 0, zIndex: 200, gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <img src="/tradeforge_logo.png" alt="Logo" style={{ width: '34px', height: '34px', borderRadius: '8px', boxShadow: '0 0 12px rgba(234, 179, 8, 0.25)' }} />
          <div>
            <div style={{ fontWeight: '800', fontSize: '16px', color: '#ffffff', letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>
              TRADEFORGE<span style={{ color: '#eab308' }}>.PRO</span>
            </div>
            <div style={{ fontSize: '9px', color: '#64748b', fontWeight: '700', letterSpacing: '0.8px', display: isMobile ? 'none' : 'block' }}>{t.portalLabel}</div>
          </div>
        </div>

        <div style={{ display: isMobile ? 'none' : 'flex', gap: '25px', alignItems: 'center' }}>
          <div>
            <span style={{ color: '#64748b', fontSize: '10px', fontWeight: '700' }}>{t.walletLabel}</span>{' '}
            <strong className="mono-font" style={{ color: '#ffffff', fontSize: '13px' }}>${broker.walletBalance.toLocaleString('en-US', {minimumFractionDigits: 2})} USDT</strong>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '10px', fontWeight: '700' }}>{t.equityLabel}</span>{' '}
            <strong className="mono-font" style={{ color: '#10b981', fontSize: '13px' }}>${broker.netEquity.toLocaleString('en-US', {minimumFractionDigits: 2})} USDT</strong>
          </div>
          <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '3px 10px', borderRadius: '12px', fontWeight: '800' }}>
            {t.accountVerified}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <LangToggle lang={lang} setLang={setLang} />
          <div style={{ textAlign: 'right', display: isMobile ? 'none' : 'block' }}>
            <div style={{ fontWeight: '700', fontSize: '12px', color: '#ffffff' }}>{userName}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>{userEmail}</div>
          </div>
          <button onClick={onLogOut} style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.12)', padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '11px' }}>
            {t.logOut}
          </button>
        </div>
      </header>

      {/* Tab Bar */}
      <div style={{ background: '#0b0f19', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', padding: isMobile ? '0 12px' : '0 35px', display: 'flex', gap: '8px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        <button onClick={() => setActiveClientTab('OVERVIEW')} style={tabStyle('OVERVIEW')}>{t.tab1}</button>
        <button onClick={() => setActiveClientTab('TERMINAL')} style={tabStyle('TERMINAL')}>{t.tab2}</button>
        <button onClick={() => setActiveClientTab('STATEMENTS')} style={tabStyle('STATEMENTS')}>{t.tab4}</button>
        <button onClick={() => setActiveClientTab('PROFILE')} style={tabStyle('PROFILE')}>{t.tab5}</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* OVERVIEW */}
        {activeClientTab === 'OVERVIEW' && (
          <div style={{ padding: isMobile ? '20px 16px' : '35px', maxWidth: '1280px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
            
            <div className="glass-card" style={{ padding: isMobile ? '22px' : '30px', marginBottom: '30px', background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.1) 0%, rgba(30, 41, 59, 0.6) 100%)', border: '1px solid rgba(234, 179, 8, 0.25)', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '16px' }}>
              <div>
                <h1 style={{ margin: '0 0 8px 0', fontSize: isMobile ? '22px' : '28px', fontWeight: '800', color: '#ffffff' }}>
                  {t.welcomeTitle}, {userName}!
                </h1>
                <p style={{ margin: 0, color: '#cbd5e1', fontSize: '14px' }}>{t.welcomeText}</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button onClick={() => setActiveClientTab('TERMINAL')} className="glow-btn-primary" style={{ padding: '12px 24px', fontSize: '13px' }}>{t.viewMonitorBtn}</button>
                <button onClick={() => setIsWalletOpen(true)} className="glow-btn-cyan" style={{ padding: '12px 20px', fontSize: '13px' }}>{t.depositBtn}</button>
              </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '20px', marginBottom: '35px' }}>
              <div className="glass-card" style={{ padding: '22px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>{t.card1Label}</div>
                <div className="mono-font" style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', marginTop: '6px' }}>${broker.walletBalance.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px', fontWeight: '700' }}>{t.card1Sub}</div>
              </div>
              <div className="glass-card" style={{ padding: '22px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>{t.card2Label}</div>
                <div className="mono-font" style={{ fontSize: '24px', fontWeight: '800', color: '#10b981', marginTop: '6px' }}>${broker.netEquity.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{t.card2Sub}</div>
              </div>
              <div className="glass-card" style={{ padding: '22px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>{t.card3Label}</div>
                <div className="mono-font" style={{ fontSize: '24px', fontWeight: '800', color: '#eab308', marginTop: '6px' }}>${broker.totalDeposited.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                <div style={{ fontSize: '11px', color: '#eab308', marginTop: '4px', fontWeight: '700' }}>{t.card3Sub}</div>
              </div>
              <div className="glass-card" style={{ padding: '22px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>{t.card4Label}</div>
                <div className="mono-font" style={{ fontSize: '24px', fontWeight: '800', color: '#818cf8', marginTop: '6px' }}>{broker.activePositions.length} Position(s)</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{t.card4Sub} ${broker.marginInUse.toLocaleString()}</div>
              </div>
            </div>

            {/* Withdrawals Tracker */}
            {myWithdrawals.length > 0 && (
              <div className="glass-card" style={{ padding: '25px', marginBottom: '30px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', color: '#ffffff' }}>{t.withdrawalsTitle}</h3>
                {myWithdrawals.some(w => w.payout_status === 'FAILED') && (
                  <div style={{ background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.4)', color: '#f59e0b', borderRadius: '8px', padding: '10px 12px', fontSize: '11px', fontWeight: '700', marginBottom: '14px', lineHeight: 1.5 }}>
                    ⚠ {t.payoutFailedBanner}
                  </div>
                )}
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#64748b', fontSize: '11px' }}>
                      <th style={{ padding: '10px' }}>{t.withdrawalReqId}</th>
                      <th style={{ padding: '10px' }}>{t.withdrawalAmount}</th>
                      <th style={{ padding: '10px' }}>{t.withdrawalAddress}</th>
                      <th style={{ padding: '10px' }}>{t.withdrawalDate}</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>{t.withdrawalStatus}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myWithdrawals.map(w => (
                      <tr key={w.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td className="mono-font" style={{ padding: '12px 10px', color: '#94a3b8' }}>#{w.id}</td>
                        <td className="mono-font" style={{ padding: '12px 10px', fontWeight: '800', color: '#eab308' }}>${w.amount.toLocaleString()} USDT</td>
                        <td className="mono-font" style={{ padding: '12px 10px', color: '#cbd5e1', fontSize: '11px' }}>{w.address}</td>
                        <td style={{ padding: '12px 10px', color: '#64748b', fontSize: '11px' }}>{w.created_at || 'Today'}</td>
                        <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                          {w.payout_status === 'FAILED' ? (
                            <>
                              <span style={{ background: 'rgba(234,179,8,0.15)', color: '#eab308', border: '1px solid #eab308', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '800' }}>
                                {t.payoutPendingAction || 'PENDING — ACTION REQUIRED'}
                              </span>
                              <div style={{ color: '#f59e0b', fontSize: '10px', marginTop: '6px', maxWidth: '260px', marginLeft: 'auto', lineHeight: 1.5 }}>
                                {getPayoutActionMessage(w.failure_reason, t)}
                                <div style={{ color: '#94a3b8', marginTop: '2px' }}>{t.payoutNotDebited}</div>
                              </div>
                            </>
                          ) : (
                            <>
                              <span style={{ background: w.status === 'APPROVED' ? 'rgba(16,185,129,0.15)' : w.status === 'REJECTED' ? 'rgba(239,68,68,0.15)' : 'rgba(234,179,8,0.15)', color: w.status === 'APPROVED' ? '#10b981' : w.status === 'REJECTED' ? '#ef4444' : '#eab308', border: `1px solid ${w.status === 'APPROVED' ? '#10b981' : w.status === 'REJECTED' ? '#ef4444' : '#eab308'}`, padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '800' }}>
                                {w.status}
                              </span>
                              {w.payout_status === 'FAILED' && (
                                <div style={{ color: '#f87171', fontSize: '10px', marginTop: '6px', maxWidth: '240px', marginLeft: 'auto', lineHeight: 1.5 }}>
                                  <strong>{t.payoutFailedLead}</strong> {w.failure_reason}
                                  <div style={{ color: '#94a3b8', marginTop: '2px' }}>{t.payoutNotDebited}</div>
                                </div>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Activity + Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr', gap: '25px' }}>
              <div className="glass-card" style={{ padding: '25px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', color: '#ffffff' }}>{t.activityTitle}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { title: t.activity1Title, sub: t.activity1Sub, status: t.activity1Status, color: '#10b981' },
                    { title: t.activity2Title, sub: t.activity2Sub, status: t.activity2Status, color: '#eab308' },
                    { title: t.activity3Title, sub: t.activity3Sub, status: t.activity3Status, color: '#10b981' },
                  ].map((item, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: '700', color: '#ffffff', fontSize: '13px' }}>{item.title}</div>
                        <div style={{ color: '#64748b', fontSize: '11px' }}>{item.sub}</div>
                      </div>
                      <span style={{ color: item.color, fontWeight: '800', fontSize: '12px' }}>{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-card" style={{ padding: '25px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', color: '#ffffff' }}>{t.summaryTitle}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#cbd5e1' }}>
                  {[
                    { label: t.summaryTier, value: t.summaryTierValue, color: '#eab308' },
                    { label: t.summaryStatus, value: t.summaryStatusValue, color: '#10b981' },
                    { label: t.summaryMargin, value: t.summaryMarginValue, color: '#ffffff' },
                    { label: t.summaryServer, value: t.summaryServerValue, color: '#818cf8' },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none', paddingBottom: '8px' }}>
                      <span>{row.label}</span> <strong style={{ color: row.color }}>{row.value}</strong>
                    </div>
                  ))}
                </div>
                <button onClick={() => setActiveClientTab('PROFILE')} style={{ width: '100%', padding: '12px', marginTop: '20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>
                  {t.manageProfile}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TERMINAL */}
        {activeClientTab === 'TERMINAL' && (
          <div style={{ flex: 1, display: 'flex' }}>
            <TradingConsole 
              balance={broker.walletBalance}
              equity={broker.netEquity}
              marginUsed={broker.marginInUse}
              pnl={broker.unrealizedPnL}
              rates={broker.marketRates}
              positions={broker.activePositions}
              onCloseOut={broker.liquidateContract}
              onOpenDeposit={() => setIsWalletOpen(true)}
              onGoBackToStats={() => setActiveClientTab('OVERVIEW')}
              lang={lang}
            />
          </div>
        )}

        {/* STATEMENTS — Withdrawal & Payout History */}
        {activeClientTab === 'STATEMENTS' && (
          <div style={{ padding: isMobile ? '20px 16px' : '35px', maxWidth: '1100px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
            <div className="glass-card" style={{ padding: isMobile ? '22px' : '35px', background: 'rgba(15, 23, 42, 0.95)' }}>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '20px', marginBottom: '25px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>{t.statementsWithdrawalsTitle}</h2>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{t.statementsWithdrawalsSub}</span>
                </div>
                <button onClick={() => window.print()} style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.3)', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>
                  {t.downloadBtn}
                </button>
              </div>

              {myWithdrawals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 0', color: '#64748b', fontSize: '13px' }}>
                  {t.statementsNoWithdrawals}
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px' }}>{t.withdrawalReqId}</th>
                      <th style={{ padding: '12px' }}>{t.withdrawalAmount}</th>
                      <th style={{ padding: '12px' }}>{t.withdrawalAddress}</th>
                      <th style={{ padding: '12px' }}>{t.withdrawalDate}</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>{t.withdrawalStatus}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myWithdrawals.map(w => (
                      <tr key={w.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td className="mono-font" style={{ padding: '14px 12px', color: '#94a3b8' }}>#{w.id}</td>
                        <td className="mono-font" style={{ padding: '14px 12px', fontWeight: '800', color: '#eab308' }}>${w.amount.toLocaleString()} USDT</td>
                        <td className="mono-font" style={{ padding: '14px 12px', color: '#cbd5e1', fontSize: '11px' }}>{w.address}</td>
                        <td style={{ padding: '14px 12px', color: '#64748b', fontSize: '11px' }}>{w.created_at || 'Today'}</td>
                        <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                          {w.payout_status === 'FAILED' ? (
                            <>
                              <span style={{ background: 'rgba(234,179,8,0.15)', color: '#eab308', border: '1px solid #eab308', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '800' }}>
                                {t.payoutPendingAction || 'PENDING — ACTION REQUIRED'}
                              </span>
                              <div style={{ color: '#f59e0b', fontSize: '10px', marginTop: '6px', maxWidth: '260px', marginLeft: 'auto', lineHeight: 1.5 }}>
                                {getPayoutActionMessage(w.failure_reason, t)}
                                <div style={{ color: '#94a3b8', marginTop: '2px' }}>{t.payoutNotDebited}</div>
                              </div>
                            </>
                          ) : (
                            <>
                              <span style={{ background: w.status === 'APPROVED' ? 'rgba(16,185,129,0.15)' : w.status === 'REJECTED' ? 'rgba(239,68,68,0.15)' : 'rgba(234,179,8,0.15)', color: w.status === 'APPROVED' ? '#10b981' : w.status === 'REJECTED' ? '#ef4444' : '#eab308', border: `1px solid ${w.status === 'APPROVED' ? '#10b981' : w.status === 'REJECTED' ? '#ef4444' : '#eab308'}`, padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '800' }}>
                                {w.status}
                              </span>
                              {w.payout_status === 'FAILED' && (
                                <div style={{ color: '#f87171', fontSize: '10px', marginTop: '6px', maxWidth: '240px', marginLeft: 'auto', lineHeight: 1.5 }}>
                                  <strong>{t.payoutFailedLead}</strong> {w.failure_reason}
                                  <div style={{ color: '#94a3b8', marginTop: '2px' }}>{t.payoutNotDebited}</div>
                                </div>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* PROFILE */}
        {activeClientTab === 'PROFILE' && (
          <div style={{ padding: isMobile ? '20px 16px' : '35px', maxWidth: '1100px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
            <div className="glass-card" style={{ padding: isMobile ? '22px' : '35px', background: 'rgba(15, 23, 42, 0.95)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '20px', marginBottom: '25px' }}>
                <div style={{ width: '48px', height: '48px', background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>👤</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>{t.profileTitle}</h2>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{t.profileSubtitle}</span>
                </div>
              </div>

              {profileError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '12px' }}>
                  ⚠️ {profileError}
                </div>
              )}
              {passMsg && (
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#6ee7b7', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '12px', fontWeight: '700' }}>
                  {passMsg}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                {/* Identity & Verification */}
                <div style={{ background: '#0b0f19', padding: '22px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '11px', color: '#eab308', fontWeight: '800', letterSpacing: '1px', marginBottom: '18px' }}>🪪 {t.profileSubtitle}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                      { label: t.profileHolder, value: profileData ? `${profileData.first_name} ${profileData.last_name}`.toUpperCase() : userName },
                      { label: t.profileEmail, value: userEmail, gold: true },
                      { label: t.profileStatus, value: profileData ? profileData.kyc_status : t.profileStatusValue, green: true },
                      { label: t.profileMemberSince, value: profileData ? profileData.created_at : '—' },
                    ].map((row, i) => (
                      <div key={i}>
                        <div style={{ color: '#64748b', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>{row.label}</div>
                        <div className={row.gold || row.green ? 'mono-font' : ''} style={{ fontSize: row.gold ? '13px' : '15px', fontWeight: '800', color: row.gold ? '#eab308' : row.green ? '#10b981' : '#fff', marginTop: '3px' }}>{row.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* KYC & Wallet */}
                <div style={{ background: '#0b0f19', padding: '22px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '800', letterSpacing: '1px', marginBottom: '18px' }}>🔐 KYC & WALLET DATA</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                      { label: t.profileDOB, value: profileData ? profileData.dob : '—' },
                      { label: t.profilePhone, value: profileData ? (profileData.phone || '—') : '—' },
                      { label: t.profileCountry, value: profileData ? (profileData.country || '—') : '—' },
                      { label: t.profileAddress, value: profileData ? (profileData.address || '—') : '—' },
                    ].map((row, i) => (
                      <div key={i}>
                        <div style={{ color: '#64748b', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>{row.label}</div>
                        <div className="mono-font" style={{ fontSize: '14px', fontWeight: '800', color: '#fff', marginTop: '3px' }}>{row.value}</div>
                      </div>
                    ))}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                      <div style={{ color: '#64748b', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>{t.profileServerBalance}</div>
                      <div className="mono-font" style={{ fontSize: '20px', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
                        {profileData ? `$${Number(profileData.cash_balance).toLocaleString('en-US', {minimumFractionDigits: 2})} USDT` : '—'}
                      </div>
                      <button onClick={handleSyncBalance} style={{ marginTop: '12px', width: '100%', padding: '11px', background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.35)', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>
                        {t.profileSyncBtn}
                      </button>
                    </div>
                  </div>
                </div>

                {/* KYC & Compliance Status */}
                <div style={{ background: '#0b0f19', padding: '22px', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '800', letterSpacing: '1px', marginBottom: '18px' }}>🛡️ {t.kycCardTitle}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ color: '#64748b', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>{t.kycLevelLabel}</div>
                    <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.35)', padding: '3px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: '800' }}>{t.kycLevelValue}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      t.kycCheck1, t.kycCheck2, t.kycCheck3, t.kycCheck4, t.kycCheck5,
                    ].map((check, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)', padding: '9px 12px', borderRadius: '7px' }}>
                        <span style={{ color: '#cbd5e1', fontSize: '11px', fontWeight: '600', flex: 1 }}>{check}</span>
                        <span style={{ color: '#10b981', fontWeight: '800', fontSize: '11px', whiteSpace: 'nowrap' }}>✓ {t.kycVerified}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '14px', lineHeight: '1.5' }}>{t.kycNote}</div>
                </div>

                {/* Change Password */}
                <div style={{ gridColumn: '1 / -1', background: '#0b0f19', padding: '22px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '11px', color: '#eab308', fontWeight: '800', letterSpacing: '1px', marginBottom: '18px' }}>🔑 {t.profilePasswordTitle}</div>
                  <form onSubmit={handleChangePassword}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px', marginBottom: '18px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '10px', color: '#64748b', fontWeight: '800', marginBottom: '5px' }}>{t.profileCurrentPass}</label>
                        <input type="password" required value={passForm.current} onChange={e => setPassForm({ ...passForm, current: e.target.value })} style={profileInputStyle} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '10px', color: '#64748b', fontWeight: '800', marginBottom: '5px' }}>{t.profileNewPass}</label>
                        <input type="password" required minLength="8" value={passForm.next} onChange={e => setPassForm({ ...passForm, next: e.target.value })} style={profileInputStyle} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '10px', color: '#64748b', fontWeight: '800', marginBottom: '5px' }}>{t.profileConfirmPass}</label>
                        <input type="password" required value={passForm.confirm} onChange={e => setPassForm({ ...passForm, confirm: e.target.value })} style={profileInputStyle} />
                      </div>
                    </div>
                    <button type="submit" className="glow-btn-primary" style={{ padding: '11px 24px', fontSize: '12px' }}>{t.profileUpdatePass}</button>
                  </form>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>

      <VaultWallet 
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        onDepositConfirmed={(amount) => broker.processVaultDeposit(amount)}
        sessionToken={broker.sessionToken}
        lang={lang}
      />
    </div>
  );
}

const profileInputStyle = { width: '100%', padding: '11px 13px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '7px', color: '#ffffff', fontSize: '13px', boxSizing: 'border-box', outline: 'none' };
