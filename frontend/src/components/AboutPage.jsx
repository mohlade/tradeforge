import React from 'react';
import translations from '../i18n/translations';
import LangToggle from './LangToggle';

export default function AboutPage({ onNavigate, lang, setLang }) {
  const t = translations[lang].about;
  const nav = translations[lang].nav;

  const stats = [
    { value: t.stat1Value, label: t.stat1Label, color: '#ffffff' },
    { value: t.stat2Value, label: t.stat2Label, color: '#eab308' },
    { value: t.stat3Value, label: t.stat3Label, color: '#10b981' },
    { value: t.stat4Value, label: t.stat4Label, color: '#38bdf8' },
  ];

  const values = [
    { icon: t.value1Icon, title: t.value1Title, desc: t.value1Desc, color: '#10b981' },
    { icon: t.value2Icon, title: t.value2Title, desc: t.value2Desc, color: '#eab308' },
    { icon: t.value3Icon, title: t.value3Title, desc: t.value3Desc, color: '#38bdf8' },
    { icon: t.value4Icon, title: t.value4Title, desc: t.value4Desc, color: '#818cf8' },
  ];

  const steps = [
    { step: t.step1Num, title: t.step1Title, desc: t.step1Desc },
    { step: t.step2Num, title: t.step2Title, desc: t.step2Desc },
    { step: t.step3Num, title: t.step3Title, desc: t.step3Desc },
  ];

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#f8fafc', overflowX: 'hidden' }}>
      
      {/* Sticky Header */}
      <nav style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', padding: '14px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div onClick={() => onNavigate('MARKETING_HOME')} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <img src="/tradeforge_logo.png" alt="TradeForge Pro Logo" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover', boxShadow: '0 0 15px rgba(234, 179, 8, 0.2)' }} />
          <div>
            <span style={{ fontWeight: '800', fontSize: '18px', letterSpacing: '-0.5px', color: '#ffffff' }}>
              {nav.platformName}<span style={{ color: '#eab308' }}>.PRO</span>
            </span>
            <div style={{ fontSize: '9px', color: '#64748b', fontWeight: '700', letterSpacing: '1px' }}>{nav.tagline}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <LangToggle lang={lang} setLang={setLang} />
          <button onClick={() => onNavigate('MARKETING_HOME')} style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.12)', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>
            {t.backBtn}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ padding: '80px 40px', textAlign: 'center', background: 'radial-gradient(circle at 15% 20%, rgba(234, 179, 8, 0.06) 0%, transparent 40%), radial-gradient(circle at 85% 80%, rgba(56, 189, 248, 0.06) 0%, transparent 40%)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.25)', padding: '6px 14px', borderRadius: '20px', fontSize: '11px', color: '#eab308', fontWeight: '700', marginBottom: '22px' }}>
          <span className="pulse-dot"></span> {t.badge}
        </div>
        <h1 style={{ fontSize: '42px', fontWeight: '800', letterSpacing: '-1.5px', margin: '0 0 16px 0' }}>
          {t.title1} <span style={{ color: '#eab308' }}>{t.title2}</span>
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '16px', lineHeight: '1.7', maxWidth: '640px', margin: '0 auto 0 auto' }}>
          {t.subtitle}
        </p>
      </div>

      {/* Stats Band */}
      <div style={{ padding: '35px 40px', background: '#0b0f19', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          {stats.map((s, i) => (
            <div key={i}>
              <div className="mono-font" style={{ fontSize: '26px', fontWeight: '800', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mission + Values */}
      <div style={{ padding: '80px 40px', maxWidth: '1150px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 12px 0' }}>{t.valuesTitle}</h2>
          <p style={{ color: '#94a3b8', fontSize: '15px', maxWidth: '560px', margin: '0 auto' }}>
            {t.valuesSub}
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
          {values.map((v, i) => (
            <div key={i} className="glass-card" style={{ padding: '28px', display: 'flex', gap: '18px' }}>
              <div style={{ width: '52px', height: '52px', minWidth: '52px', background: `${v.color}22`, border: `1px solid ${v.color}55`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>{v.icon}</div>
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: '700', color: '#ffffff' }}>{v.title}</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '1.65' }}>{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div style={{ padding: '80px 40px', background: '#0b0f19', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 12px 0' }}>{t.howTitle}</h2>
            <p style={{ color: '#94a3b8', fontSize: '15px' }}>{t.howSub}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {steps.map((s, i) => (
              <div key={i} className="glass-card" style={{ padding: '30px', position: 'relative' }}>
                <div className="mono-font" style={{ fontSize: '38px', fontWeight: '800', color: 'rgba(234, 179, 8, 0.25)', marginBottom: '14px' }}>{s.step}</div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '17px', fontWeight: '700' }}>{s.title}</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '1.65' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '70px 40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 12px 0' }}>{t.ctaTitle}</h2>
        <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 28px 0' }}>{t.ctaText}</p>
        <button onClick={() => onNavigate('KYC_GATE')} className="glow-btn-primary" style={{ padding: '14px 36px', fontSize: '14px' }}>
          {t.ctaBtn}
        </button>
      </div>

      {/* Footer */}
      <footer style={{ background: '#0b0f19', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '30px 40px', color: '#64748b', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/tradeforge_logo.png" alt="Logo" style={{ width: '22px', height: '22px', borderRadius: '4px' }} />
          <span>{t.footer}</span>
        </div>
        <span>{t.footerSub}</span>
      </footer>
    </div>
  );
}
