import React from 'react';
import translations from '../i18n/translations';
import LangToggle from './LangToggle';
import useMediaQuery from '../hooks/useMediaQuery';

export default function MarketingHome({ onNavigate, lang, setLang }) {
  const t = translations[lang].home;
  const tn = translations[lang].nav;
  const isMobile = useMediaQuery('(max-width: 820px)');

  const tickerItems = [
    { symbol: 'BTC/USDT', price: '64,250.00', change: '+3.42%', up: true },
    { symbol: 'ETH/USDT', price: '3,450.20', change: '+2.18%', up: true },
    { symbol: 'EUR/USDT', price: '1.0852', change: '-0.14%', up: false },
    { symbol: 'GBP/USDT', price: '1.2740', change: '+0.45%', up: true },
    { symbol: 'SOL/USDT', price: '148.75', change: '+6.12%', up: true },
    { symbol: 'NVDA/USDT', price: '124.30', change: '+4.88%', up: true }
  ];

  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      
      {/* Ticker Tape */}
      <div style={{ background: '#0b0f19', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', padding: '6px 0', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        <div className="animate-ticker" style={{ display: 'inline-flex', gap: '40px', fontSize: '11px' }}>
          {[...tickerItems, ...tickerItems].map((item, idx) => (
            <div key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: '700', color: '#94a3b8' }}>{item.symbol}</span>
              <span className="mono-font" style={{ fontWeight: '600', color: '#ffffff' }}>${item.price}</span>
              <span className="mono-font" style={{ fontWeight: '700', color: item.up ? '#10b981' : '#ef4444', background: item.up ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                {item.change}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Navbar */}
      <nav style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', padding: isMobile ? '14px 20px' : '16px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, gap: '10px' }}>
        <div onClick={() => onNavigate('MARKETING_HOME')} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', minWidth: 0 }}>
          <img src="/tradeforge_logo.png" alt="TradeForge Pro Logo" style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover', boxShadow: '0 0 15px rgba(234, 179, 8, 0.2)' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: '800', fontSize: isMobile ? '17px' : '20px', letterSpacing: '-0.5px', color: '#ffffff', whiteSpace: 'nowrap' }}>
              {tn.platformName}<span style={{ color: '#eab308' }}>.PRO</span>
            </span>
            <span style={{ fontSize: '9px', color: '#64748b', fontWeight: '700', letterSpacing: '1px', display: isMobile ? 'none' : 'block' }}>{tn.tagline}</span>
          </div>
        </div>

        <div style={{ display: isMobile ? 'none' : 'flex', gap: '30px', fontSize: '13px', fontWeight: '600' }}>
          <span onClick={() => onNavigate('MARKETING_HOME')} style={{ color: '#eab308', cursor: 'pointer' }}>{tn.home}</span>
          <span onClick={() => onNavigate('ABOUT_PAGE')} style={{ color: '#94a3b8', cursor: 'pointer' }}>{tn.about}</span>
          <span onClick={() => onNavigate('CONTACT_PAGE')} style={{ color: '#94a3b8', cursor: 'pointer' }}>{tn.contact}</span>
          <span onClick={() => onNavigate('ADMIN_PORTAL')} style={{ color: '#eab308', cursor: 'pointer', fontWeight: '700' }}>{tn.adminPortal}</span>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <LangToggle lang={lang} setLang={setLang} />
          <button onClick={() => onNavigate('KYC_GATE')} style={{ background: 'transparent', color: '#e2e8f0', border: '1px solid rgba(255, 255, 255, 0.15)', padding: '9px 20px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: isMobile ? 'none' : 'inline-block' }}>
            {tn.signIn}
          </button>
          <button onClick={() => onNavigate('KYC_GATE')} className="glow-btn-primary" style={{ padding: isMobile ? '8px 16px' : '9px 24px', fontSize: '13px', whiteSpace: 'nowrap' }}>
            {tn.getStarted}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div style={{ padding: isMobile ? '48px 20px' : '80px 60px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr', gap: isMobile ? '36px' : '60px', alignItems: 'center', background: 'radial-gradient(circle at 10% 20%, rgba(234, 179, 8, 0.06) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(56, 189, 248, 0.06) 0%, transparent 40%)' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.25)', padding: '6px 14px', borderRadius: '20px', fontSize: '11px', color: '#eab308', fontWeight: '700', marginBottom: '25px' }}>
            <span className="pulse-dot"></span>
            {t.tickerTagline}
          </div>
          <h1 style={{ fontSize: isMobile ? '32px' : '54px', fontWeight: '800', lineHeight: '1.12', letterSpacing: '-1.5px', margin: '0 0 24px 0', color: '#ffffff' }}>
            {t.heroTitle}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '16px', lineHeight: '1.65', margin: '0 0 35px 0', maxWidth: '520px' }}>
            {t.heroSubtitle}
          </p>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => onNavigate('KYC_GATE')} className="glow-btn-primary" style={{ padding: '14px 34px', fontSize: '14px' }}>
              {t.launchPortal}
            </button>
            <button onClick={() => onNavigate('ABOUT_PAGE')} style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '14px 28px', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
              {t.learnMore}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '55px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '30px' }}>
            <div>
              <div className="mono-font" style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff' }}>{t.metric1Value}</div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>{t.metric1Label}</div>
            </div>
            <div>
              <div className="mono-font" style={{ fontSize: '24px', fontWeight: '800', color: '#eab308' }}>{t.metric2Value}</div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>{t.metric2Label}</div>
            </div>
            <div>
              <div className="mono-font" style={{ fontSize: '24px', fontWeight: '800', color: '#10b981' }}>{t.metric3Value}</div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>{t.metric3Label}</div>
            </div>
          </div>
        </div>

        {/* Right Glass Dashboard Mockup */}
        <div className="glass-card float-animation" style={{ padding: '24px', background: 'rgba(30, 41, 59, 0.6)', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '14px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="/tradeforge_logo.png" alt="Logo" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>{t.mockupTitle}</span>
            </div>
            <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '3px 8px', borderRadius: '4px', fontWeight: '700' }}>
              {t.mockupBadge}
            </span>
          </div>
          <div style={{ background: '#0b0f19', borderRadius: '10px', padding: '16px', border: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '10px', fontWeight: '700' }}>ASSET PAIR</span>
                <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: '800' }}>{t.mockupPair}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: '#64748b', fontSize: '10px', fontWeight: '700' }}>{t.mockupLiveRate}</span>
                <div className="mono-font" style={{ color: '#10b981', fontSize: '16px', fontWeight: '800' }}>$64,250.00</div>
              </div>
            </div>
            <div style={{ width: '100%', height: '100px', background: 'linear-gradient(to top, rgba(234, 179, 8, 0.08), transparent)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
              <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 50">
                <path d="M0,45 Q15,35 30,38 T60,20 T80,25 T100,5" fill="none" stroke="#eab308" strokeWidth="2.5" />
              </svg>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>{t.mockupEquityLabel}</div>
              <div className="mono-font" style={{ fontSize: '16px', fontWeight: '800', color: '#10b981', marginTop: '2px' }}>$104,250.00</div>
            </div>
            <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.2)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>{t.mockupStatusLabel}</div>
              <div className="mono-font" style={{ fontSize: '16px', fontWeight: '800', color: '#eab308', marginTop: '2px' }}>{t.mockupStatus}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div style={{ padding: isMobile ? '48px 20px' : '80px 60px', background: '#0b0f19', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2 style={{ fontSize: isMobile ? '26px' : '34px', fontWeight: '800', margin: '0 0 12px 0', color: '#ffffff' }}>{t.featuresTitle}</h2>
          <p style={{ color: '#94a3b8', fontSize: '15px', maxWidth: '600px', margin: '0 auto' }}>{t.featuresSubtitle}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '24px', maxWidth: '1240px', margin: '0 auto' }}>
          {[
            { icon: '⚡', title: t.feature1Title, desc: t.feature1Desc, color: '#eab308' },
            { icon: '🛡️', title: t.feature2Title, desc: t.feature2Desc, color: '#38bdf8' },
            { icon: '📊', title: t.feature3Title, desc: t.feature3Desc, color: '#818cf8' },
            { icon: '💎', title: t.feature4Title, desc: t.feature4Desc, color: '#10b981' },
          ].map((f, i) => (
            <div key={i} className="glass-card" style={{ padding: '30px 24px' }}>
              <div style={{ width: '48px', height: '48px', background: `${f.color}22`, border: `1px solid ${f.color}55`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '20px' }}>{f.icon}</div>
              <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: '0 0 10px 0' }}>{f.title}</h4>
              <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6', margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Plans */}
      <div style={{ padding: isMobile ? '48px 20px' : '90px 60px', background: '#0f172a' }}>
        <div style={{ textAlign: 'center', marginBottom: '55px' }}>
          <h2 style={{ fontSize: isMobile ? '26px' : '34px', fontWeight: '800', margin: '0 0 12px 0', color: '#ffffff' }}>{t.plansTitle}</h2>
          <p style={{ color: '#94a3b8', fontSize: '15px' }}>{t.plansSubtitle}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '30px', maxWidth: '1150px', margin: '0 auto' }}>
          {[
            { name: t.plan1Name, deposit: t.plan1Deposit, alloc: t.plan1Allocation, target: t.plan1Target, daily: t.plan1DailyLimit, draw: t.plan1Drawdown, cta: t.plan1CTA, highlight: false, badge: null },
            { name: t.plan2Name, deposit: t.plan2Deposit, alloc: t.plan2Allocation, target: t.plan2Target, daily: t.plan2DailyLimit, draw: t.plan2Drawdown, cta: t.plan2CTA, highlight: true, badge: t.plan2Badge },
            { name: t.plan3Name, deposit: t.plan3Deposit, alloc: t.plan3Allocation, target: t.plan3Target, daily: t.plan3DailyLimit, draw: t.plan3Drawdown, cta: t.plan3CTA, highlight: false, badge: null },
          ].map((plan, i) => (
            <div key={i} className="glass-card" style={{ padding: '35px 30px', position: 'relative', border: plan.highlight ? '1px solid #eab308' : undefined, boxShadow: plan.highlight ? '0 0 25px rgba(234, 179, 8, 0.15)' : undefined }}>
              {plan.badge && <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: '#eab308', color: '#0f172a', fontSize: '10px', fontWeight: '800', padding: '4px 14px', borderRadius: '12px' }}>{plan.badge}</div>}
              <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', margin: '0 0 15px 0' }}>{plan.name}</h3>
              <div className="mono-font" style={{ fontSize: '32px', fontWeight: '800', color: '#eab308', marginBottom: '20px' }}>{plan.deposit} <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '400' }}>{t.depositLabel}</span></div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '20px 0', margin: '0 0 25px 0', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#cbd5e1' }}>
                <div>✓ {t.allocationLabel} <strong>{plan.alloc}</strong></div>
                <div>✓ {t.targetLabel} <strong>{plan.target}</strong></div>
                <div>✓ {t.dailyLabel} <strong>{plan.daily}</strong></div>
                <div>✓ {t.drawdownLabel} <strong>{plan.draw}</strong></div>
              </div>
              {plan.highlight
                ? <button onClick={() => onNavigate('KYC_GATE')} className="glow-btn-primary" style={{ width: '100%', padding: '13px' }}>{plan.cta}</button>
                : <button onClick={() => onNavigate('KYC_GATE')} style={{ width: '100%', padding: '13px', background: 'rgba(255,255,255,0.08)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>{plan.cta}</button>
              }
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#0b0f19', borderTop: '1px solid rgba(255,255,255,0.06)', padding: isMobile ? '24px 20px' : '40px 60px', color: '#64748b', fontSize: '12px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '10px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/tradeforge_logo.png" alt="Logo" style={{ width: '24px', height: '24px', borderRadius: '4px' }} />
          <span>{t.footerCopy}</span>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <span onClick={() => onNavigate('ADMIN_PORTAL')} style={{ color: '#eab308', cursor: 'pointer', fontWeight: '700' }}>{tn.adminPortal}</span>
          <span>{t.footerRisk}</span>
        </div>
      </footer>
    </div>
  );
}
