import React, { useState, useEffect } from 'react';
import translations from '../i18n/translations';

export default function TradingConsole({ 
  balance, equity, marginUsed, pnl, rates, positions, onCloseOut, onOpenDeposit, onGoBackToStats, lang
}) {
  const [selectedAsset, setSelectedAsset] = useState('BTCUSDT');
  const [points, setPoints] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const t = translations[lang || 'EN'].terminal;

  useEffect(() => {
    let width = 700, height = 260, steps = 18, pointsArray = [];
    for (let i = 0; i <= steps; i++) {
      let x = (width / steps) * i;
      let wave = Math.sin(i + (Date.now() / 6000)) * 40;
      let y = (height / 2) + wave + (Math.random() * 14 - 7);
      pointsArray.push(`${x},${y}`);
    }
    setPoints(pointsArray.join(' '));
  }, [rates, selectedAsset]);

  const filteredRates = Object.keys(rates).filter(symbol => 
    symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const positionPnl = (pos) => {
    const spot = rates[pos.pair] || pos.entry;
    const diff = pos.dir === 'LONG' ? (spot - pos.entry) : (pos.entry - spot);
    const scale = pos.pair.includes('EUR') || pos.pair.includes('GBP') ? 15000 : 0.85;
    return diff * scale * pos.lots;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontSize: '12px' }}>
      
      {/* Header */}
      <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '52px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/tradeforge_logo.png" alt="Logo" style={{ width: '30px', height: '30px', borderRadius: '6px' }} />
          <span style={{ fontWeight: '800', fontSize: '15px', color: '#ffffff' }}>TradeForge<span style={{ color: '#eab308' }}>.pro</span></span>
          <span style={{ fontSize: '10px', background: 'rgba(234,179,8,0.15)', color: '#eab308', border: '1px solid rgba(234,179,8,0.3)', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>{t.badge}</span>
        </div>
        <div style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
          {[
            { label: t.walletLabel, value: `$${balance.toLocaleString('en-US', {minimumFractionDigits:2})} USDT`, color: '#ffffff' },
            { label: t.equityLabel, value: `$${equity.toLocaleString('en-US', {minimumFractionDigits:2})} USDT`, color: '#10b981' },
            { label: t.marginLabel, value: `$${marginUsed.toLocaleString('en-US', {minimumFractionDigits:2})} USDT`, color: '#eab308' },
            { label: t.pnlLabel, value: `${pnl >= 0 ? '+' : ''}$${pnl.toLocaleString('en-US', {minimumFractionDigits:2})} USDT`, color: pnl >= 0 ? '#10b981' : '#ef4444' },
          ].map((m, i) => (
            <div key={i}>
              <span style={{ color: '#64748b', fontSize: '10px', fontWeight: '700' }}>{m.label}</span>{' '}
              <strong className="mono-font" style={{ color: m.color, fontSize: '13px' }}>{m.value}</strong>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onGoBackToStats} style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '11px' }}>{t.evalBtn}</button>
          <button onClick={onOpenDeposit} className="glow-btn-primary" style={{ padding: '6px 14px', fontSize: '11px' }}>{t.depositBtn}</button>
        </div>
      </div>

      {/* Main Layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Left: Watchlist */}
        <div style={{ width: '250px', backgroundColor: '#0b0f19', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '8px 10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '11px', outline: 'none' }} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredRates.map(symbol => (
              <div key={symbol} onClick={() => setSelectedAsset(symbol)} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', backgroundColor: selectedAsset === symbol ? 'rgba(234,179,8,0.1)' : 'transparent', borderLeft: selectedAsset === symbol ? '3px solid #eab308' : '3px solid transparent', cursor: 'pointer' }}>
                <div>
                  <span style={{ fontWeight: '700', color: '#fff', display: 'block' }}>{symbol}</span>
                  <span style={{ fontSize: '9px', color: '#64748b' }}>{t.assetLabel}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="mono-font" style={{ fontWeight: '700', color: '#10b981', display: 'block' }}>{rates[symbol].toFixed(symbol.includes('USDT') ? 2 : 4)}</span>
                  <span className="mono-font" style={{ fontSize: '9px', color: '#10b981' }}>+2.4%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Chart */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0b0f19' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15,23,42,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#fff' }}>{selectedAsset} {t.liveFeed}</h2>
              <span className="mono-font" style={{ fontSize: '16px', fontWeight: '800', color: '#10b981' }}>${(rates[selectedAsset] || 0).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['1M', '5M', '15M', '1H', '4H', '1D'].map((tf, i) => (
                <span key={tf} style={{ padding: '4px 8px', background: i === 2 ? 'rgba(234,179,8,0.2)' : 'rgba(255,255,255,0.05)', color: i === 2 ? '#eab308' : '#94a3b8', borderRadius: '4px', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>{tf}</span>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, width: '100%', position: 'relative', background: 'radial-gradient(circle at bottom, rgba(234,179,8,0.06) 0%, transparent 70%)', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', width: '100%', height: '100%', display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gridTemplateRows: 'repeat(4,1fr)' }}>
              {[...Array(24)].map((_, i) => <div key={i} style={{ borderRight: '1px dashed rgba(255,255,255,0.03)', borderBottom: '1px dashed rgba(255,255,255,0.03)' }}></div>)}
            </div>
            <svg width="100%" height="100%" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, top: 0 }}>
              <defs><linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#eab308" stopOpacity="0.3" /><stop offset="100%" stopColor="#eab308" stopOpacity="0" /></linearGradient></defs>
              <polyline fill="url(#chartGlow)" stroke="#eab308" strokeWidth="2.5" points={points} />
            </svg>
          </div>

          {/* Active Trades */}
          <div style={{ height: '215px', backgroundColor: '#0b0f19', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontWeight: '800', fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
              <span>{t.activeTradesTitle}</span>
              <span style={{ color: '#10b981' }}>{t.feedActive}</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '8px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}>
                    <th>{t.colPair}</th><th>{t.colDir}</th><th>{t.colLots}</th><th>{t.colMargin}</th><th>{t.colReturn}</th><th style={{ textAlign: 'right' }}>{t.colStatus}</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', color: '#64748b', padding: '45px 0' }}>{t.noTrades}</td></tr>
                  ) : (
                    positions.map(pos => {
                      const rowPnl = positionPnl(pos);
                      return (
                        <tr key={pos.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '10px 4px', fontWeight: '800', color: '#fff' }}>{pos.pair}</td>
                          <td><span style={{ color: pos.dir === 'LONG' ? '#10b981' : '#ef4444', background: pos.dir === 'LONG' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', padding: '2px 6px', borderRadius: '4px', fontWeight: '700', fontSize: '10px' }}>{pos.dir}</span></td>
                          <td className="mono-font">{pos.lots} Lot(s)</td>
                          <td className="mono-font" style={{ color: '#94a3b8' }}>${(pos.lots * 1000).toLocaleString()}.00 USDT</td>
                          <td className="mono-font" style={{ color: rowPnl >= 0 ? '#10b981' : '#ef4444', fontWeight: '800' }}>{rowPnl >= 0 ? '+' : ''}${rowPnl.toLocaleString('en-US', {minimumFractionDigits:2})} USDT</td>
                          <td style={{ textAlign: 'right' }}>
                            <button onClick={() => onCloseOut(pos.id)} style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.4)', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: '700', fontSize: '10px' }}>{t.closeBtn}</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Managed Account Panel */}
        <div style={{ width: '280px', backgroundColor: '#0b0f19', borderLeft: '1px solid rgba(255,255,255,0.08)', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px', fontWeight: '800' }}>{t.sidebarTitle}</h3>
            <div style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.25)', padding: '14px', borderRadius: '8px', marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: '#eab308', fontWeight: '800', marginBottom: '4px' }}>{t.sidebarBadge}</div>
              <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.5' }}>{t.sidebarText}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
              {[
                { label: t.sidebarStatus, value: t.sidebarStatusValue, color: '#10b981' },
                { label: t.sidebarFeed, value: t.sidebarFeedValue, color: '#ffffff' },
                { label: t.sidebarSecurity, value: t.sidebarSecurityValue, color: '#eab308' },
              ].map((item, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: '#64748b', fontSize: '10px', fontWeight: '700', display: 'block' }}>{item.label}</span>
                  <span style={{ color: item.color, fontWeight: '800' }}>{item.value}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.25)', borderRadius: '6px', fontSize: '10px', color: '#a5b4fc', lineHeight: '1.6' }}>{t.orderNote}</div>
          </div>
          <button onClick={onOpenDeposit} className="glow-btn-primary" style={{ width: '100%', padding: '14px', fontSize: '12px', letterSpacing: '0.5px' }}>
            {t.depositCTA}
          </button>
        </div>

      </div>
    </div>
  );
}
