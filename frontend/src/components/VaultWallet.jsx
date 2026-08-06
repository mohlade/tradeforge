import React, { useState } from 'react';
import translations from '../i18n/translations';
import { API_BASE } from '../config';

export default function VaultWallet({ isOpen, onClose, onDepositConfirmed, sessionToken, lang }) {
  const [walletTab, setWalletTab] = useState('DEPOSIT');
  const [amount, setAmount] = useState(25000);
  const [withdrawAmount, setWithdrawAmount] = useState(5000);
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawMessage, setWithdrawMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const t = translations[lang || 'EN'].vault;

  if (!isOpen) return null;

  const handleWithdrawalSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setWithdrawMessage('');
    if (!withdrawAddress || withdrawAddress.length < 10) {
      setErrorMsg("Please enter a valid destination TRC-20 wallet address.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/withdrawals/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken || ''}`
        },
        body: JSON.stringify({ amount: parseFloat(withdrawAmount), address: withdrawAddress })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.detail || 'Withdrawal submission failed');
      setWithdrawMessage(t.successText);
      setTimeout(() => { setWithdrawMessage(''); onClose(); }, 2500);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box' }}>
      
      <div className="glass-card" style={{ background: 'rgba(15, 23, 42, 0.97)', border: '1px solid rgba(255, 255, 255, 0.12)', width: '440px', padding: '30px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 30px 60px -15px rgba(0,0,0,0.9), 0 0 30px rgba(234,179,8,0.15)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '14px' }}>
          <img src="/tradeforge_logo.png" alt="Logo" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
          <h3 style={{ margin: 0, color: '#ffffff', fontSize: '18px', fontWeight: '800' }}>USDT TRC-20 Capital Vault</h3>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#0b0f19', padding: '4px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={() => setWalletTab('DEPOSIT')} style={{ padding: '8px', background: walletTab === 'DEPOSIT' ? 'rgba(234,179,8,0.2)' : 'transparent', color: walletTab === 'DEPOSIT' ? '#eab308' : '#64748b', border: walletTab === 'DEPOSIT' ? '1px solid rgba(234,179,8,0.4)' : 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '800', fontSize: '12px' }}>
            {t.depositTab}
          </button>
          <button onClick={() => setWalletTab('WITHDRAW')} style={{ padding: '8px', background: walletTab === 'WITHDRAW' ? 'rgba(234,179,8,0.2)' : 'transparent', color: walletTab === 'WITHDRAW' ? '#eab308' : '#64748b', border: walletTab === 'WITHDRAW' ? '1px solid rgba(234,179,8,0.4)' : 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '800', fontSize: '12px' }}>
            {t.withdrawTab}
          </button>
        </div>

        {/* DEPOSIT VIEW */}
        {walletTab === 'DEPOSIT' && (
          <div>
            <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 4px 0', fontWeight: '700', textAlign: 'left' }}>{t.depositAddressLabel}</p>
            
            <div style={{ background: '#ffffff', padding: '10px', width: '130px', height: '130px', margin: '10px auto 16px auto', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=TYuG9x7WbMcA3kZfP8nQ2vR6hS1tJ5yL4x" alt="USDT Deposit QR" style={{ width: '110px', height: '110px' }} />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input type="text" readOnly value="TYuG9x7WbMcA3kZfP8nQ2vR6hS1tJ5yL4x" className="mono-font" style={{ flex: 1, padding: '9px', background: '#0b0f19', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', borderRadius: '6px', fontSize: '11px', textAlign: 'center', outline: 'none' }} />
              <button onClick={() => { navigator.clipboard.writeText('TYuG9x7WbMcA3kZfP8nQ2vR6hS1tJ5yL4x'); }} style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', padding: '0 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '11px' }}>Copy</button>
            </div>

            <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 14px 0', background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', padding: '8px', borderRadius: '6px', lineHeight: '1.5' }}>
              ⚠️ {t.depositWarning}
            </p>

            <div style={{ textAlign: 'left', marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '10px', color: '#64748b', fontWeight: '800', marginBottom: '4px' }}>{t.depositAmountLabel}</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '10px' }}>
                {[5000, 10000, 25000, 50000].map(val => (
                  <button key={val} onClick={() => setAmount(val)} style={{ padding: '6px 0', background: amount === val ? 'rgba(234,179,8,0.2)' : 'rgba(255,255,255,0.05)', color: amount === val ? '#eab308' : '#94a3b8', border: amount === val ? '1px solid #eab308' : '1px solid transparent', borderRadius: '4px', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>
                    ${val / 1000}k
                  </button>
                ))}
              </div>
              <input type="number" value={amount} min="1000" step="5000" onChange={e => setAmount(parseFloat(e.target.value) || 0)} className="mono-font" style={{ width: '100%', padding: '11px', background: '#0b0f19', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#fff', fontWeight: '800', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button onClick={() => { onDepositConfirmed(amount); onClose(); }} className="glow-btn-primary" style={{ padding: '12px', fontSize: '12px' }}>
                {t.depositBtn}
              </button>
              <button onClick={onClose} style={{ padding: '12px', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>
                {t.closeBtn}
              </button>
            </div>
          </div>
        )}

        {/* WITHDRAWAL VIEW */}
        {walletTab === 'WITHDRAW' && (
          <form onSubmit={handleWithdrawalSubmit}>
            <h4 style={{ color: '#eab308', margin: '0 0 12px 0', fontSize: '14px', fontWeight: '800', textAlign: 'left' }}>{t.withdrawTitle}</h4>

            {withdrawMessage && (
              <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid #10b981', color: '#6ee7b7', padding: '10px', borderRadius: '6px', marginBottom: '14px', fontSize: '12px' }}>
                {t.successTitle} {withdrawMessage}
              </div>
            )}
            {errorMsg && (
              <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px', borderRadius: '6px', marginBottom: '14px', fontSize: '12px' }}>
                ⚠️ {errorMsg}
              </div>
            )}

            <div style={{ textAlign: 'left', marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '10px', color: '#64748b', fontWeight: '800', marginBottom: '4px' }}>{t.withdrawAmountLabel}</label>
              <input type="number" value={withdrawAmount} min="100" onChange={e => setWithdrawAmount(e.target.value)} className="mono-font" style={{ width: '100%', padding: '10px', background: '#0b0f19', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#fff', fontSize: '14px', fontWeight: '800', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div style={{ textAlign: 'left', marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '10px', color: '#64748b', fontWeight: '800', marginBottom: '4px' }}>{t.withdrawAddressLabel}</label>
              <input type="text" placeholder="T..." value={withdrawAddress} onChange={e => setWithdrawAddress(e.target.value)} className="mono-font" style={{ width: '100%', padding: '10px', background: '#0b0f19', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#fff', fontSize: '11px', boxSizing: 'border-box', outline: 'none' }} />
              <p style={{ color: '#64748b', fontSize: '10px', margin: '5px 0 0 0', textAlign: 'left' }}>{t.withdrawNote}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button type="submit" className="glow-btn-primary" style={{ padding: '12px', fontSize: '12px' }}>{t.withdrawBtn}</button>
              <button type="button" onClick={onClose} style={{ padding: '12px', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>{t.closeBtn}</button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
