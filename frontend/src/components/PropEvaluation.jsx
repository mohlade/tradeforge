import React from 'react';
import translations from '../i18n/translations';
import useMediaQuery from '../hooks/useMediaQuery';

export default function PropEvaluation({ equity, totalDeposited, onProceedToTerminal, lang }) {
  const t = translations[lang || 'EN'].eval;
  const isMobile = useMediaQuery('(max-width: 820px)');
  const profitTarget = 10000.00;
  const currentProfit = Math.max(0, equity - totalDeposited);
  const completionPercentage = Math.min(100, (currentProfit / profitTarget) * 100);

  return (
    <div style={{ background: 'radial-gradient(circle at center, rgba(30, 41, 59, 0.8) 0%, #0f172a 80%)', minHeight: '100vh', color: '#f8fafc', padding: isMobile ? '16px 12px' : '40px 20px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-card" style={{ maxWidth: '680px', width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.08)', padding: isMobile ? '24px 18px' : '40px', boxShadow: '0 20px 50px -10px rgba(0,0,0,0.6)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '18px', marginBottom: '25px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/tradeforge_logo.png" alt="Logo" style={{ width: '36px', height: '36px', borderRadius: '8px' }} />
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#fff' }}>{t.platformLabel}</h2>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>{t.platformSub}</span>
            </div>
          </div>
          <span style={{ fontSize: '10px', background: 'rgba(234,179,8,0.15)', color: '#eab308', border: '1px solid rgba(234,179,8,0.3)', padding: '4px 10px', borderRadius: '6px', fontWeight: '800' }}>
            {t.phaseBadge}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
          <div style={{ background: '#0b0f19', border: '1px solid rgba(255,255,255,0.08)', padding: '20px', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>{t.profitLabel}</div>
            <div className="mono-font" style={{ fontSize: '24px', fontWeight: '800', color: '#10b981', marginTop: '6px' }}>+${currentProfit.toFixed(2)} USDT</div>
          </div>
          <div style={{ background: '#0b0f19', border: '1px solid rgba(255,255,255,0.08)', padding: '20px', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>{t.targetLabel}</div>
            <div className="mono-font" style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', marginTop: '6px' }}>+${profitTarget.toLocaleString()}.00 USDT</div>
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: '600' }}>
            <span>{t.progressLabel}</span>
            <span className="mono-font" style={{ color: '#eab308', fontWeight: '700' }}>{completionPercentage.toFixed(1)}% {t.progressComplete}</span>
          </div>
          <div style={{ width: '100%', height: '10px', background: '#0b0f19', borderRadius: '5px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ width: `${completionPercentage}%`, height: '100%', background: 'linear-gradient(90deg, #eab308, #10b981)', borderRadius: '5px', transition: 'width 0.5s ease' }}></div>
          </div>
        </div>

        <div style={{ background: '#0b0f19', border: '1px solid rgba(255,255,255,0.08)', padding: '20px', borderRadius: '10px', fontSize: '12px', lineHeight: '1.7', marginBottom: '30px' }}>
          <div style={{ color: '#fff', fontWeight: '800', marginBottom: '10px' }}>{t.rulesTitle}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.06)', paddingBottom: '6px', marginBottom: '6px', color: '#94a3b8' }}>
            <span>{t.dailyRule}</span>
            <span style={{ color: '#10b981', fontWeight: '800' }}>{t.compliantStatus}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
            <span>{t.overallRule}</span>
            <span style={{ color: '#10b981', fontWeight: '800' }}>{t.compliantStatus}</span>
          </div>
        </div>

        <button onClick={onProceedToTerminal} className="glow-btn-primary" style={{ width: '100%', padding: '15px', fontSize: '14px', letterSpacing: '0.5px' }}>
          {t.proceedBtn}
        </button>

      </div>
    </div>
  );
}
