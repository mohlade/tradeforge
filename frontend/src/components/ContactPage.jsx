import React, { useState } from 'react';
import translations from '../i18n/translations';
import LangToggle from './LangToggle';

export default function ContactPage({ onNavigate, lang, setLang }) {
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const t = translations[lang].contact;
  const nav = translations[lang].nav;

  const methods = [
    { icon: t.method1Icon, label: t.method1Label, value: t.method1Value, color: '#eab308' },
    { icon: t.method2Icon, label: t.method2Label, value: t.method2Value, color: '#10b981' },
    { icon: t.method3Icon, label: t.method3Label, value: t.method3Value, color: '#38bdf8' },
    { icon: t.method4Icon, label: t.method4Label, value: t.method4Value, color: '#818cf8' },
  ];

  const faqs = [
    { q: t.faq1Q, a: t.faq1A },
    { q: t.faq2Q, a: t.faq2A },
    { q: t.faq3Q, a: t.faq3A },
    { q: t.faq4Q, a: t.faq4A },
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
      <div style={{ padding: '60px 40px 40px 40px', textAlign: 'center', background: 'radial-gradient(circle at 50% 0%, rgba(234, 179, 8, 0.06) 0%, transparent 50%)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.25)', padding: '6px 14px', borderRadius: '20px', fontSize: '11px', color: '#eab308', fontWeight: '700', marginBottom: '20px' }}>
          <span className="pulse-dot"></span> {t.badge}
        </div>
        <h1 style={{ fontSize: '36px', fontWeight: '800', letterSpacing: '-1px', margin: '0 0 14px 0' }}>{t.title}</h1>
        <p style={{ color: '#94a3b8', fontSize: '15px', maxWidth: '540px', margin: '0 auto' }}>
          {t.subtitle}
        </p>
      </div>

      {/* Contact Methods */}
      <div style={{ padding: '10px 40px 30px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px', maxWidth: '1100px', margin: '0 auto' }}>
          {methods.map((c, i) => (
            <div key={i} className="glass-card" style={{ padding: '22px', textAlign: 'center' }}>
              <div style={{ fontSize: '26px', marginBottom: '10px' }}>{c.icon}</div>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '800', letterSpacing: '1px' }}>{c.label}</div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: c.color, marginTop: '4px' }}>{c.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Form + FAQ */}
      <div style={{ padding: '30px 40px 70px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '28px', maxWidth: '1100px', margin: '0 auto', alignItems: 'start' }}>

          {/* Inquiry Form */}
          <div className="glass-card" style={{ padding: '34px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: '52px', marginBottom: '16px' }}>✉️</div>
                <h3 style={{ color: '#eab308', margin: '0 0 10px 0', fontSize: '22px', fontWeight: '800' }}>{t.successTitle}</h3>
                <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6', maxWidth: '340px', margin: '0 auto' }}>
                  {t.successText}
                </p>
                <button onClick={() => setSubmitted(false)} style={{ marginTop: '24px', padding: '10px 22px', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>
                  {t.sendAnother}
                </button>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
                <h3 style={{ margin: '0 0 22px 0', fontSize: '18px', fontWeight: '800', color: '#ffffff', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px' }}>
                  {t.formTitle}
                </h3>

                <label style={{ display: 'block', fontSize: '10px', color: '#64748b', fontWeight: '800', marginBottom: '6px', textTransform: 'uppercase' }}>{t.subjectLabel}</label>
                <select required defaultValue="" style={inputStyle}>
                  <option value="" disabled>{t.subjectPlaceholder}</option>
                  {t.subjects.map((s, i) => <option key={i}>{s}</option>)}
                </select>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '16px 0' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: '#64748b', fontWeight: '800', marginBottom: '6px', textTransform: 'uppercase' }}>{t.nameLabel}</label>
                    <input type="text" required placeholder={t.namePlaceholder} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: '#64748b', fontWeight: '800', marginBottom: '6px', textTransform: 'uppercase' }}>{t.emailLabel}</label>
                    <input type="email" required placeholder={t.emailPlaceholder} style={inputStyle} />
                  </div>
                </div>

                <label style={{ display: 'block', fontSize: '10px', color: '#64748b', fontWeight: '800', marginBottom: '6px', textTransform: 'uppercase' }}>{t.messageLabel}</label>
                <textarea required rows="5" placeholder={t.messagePlaceholder} style={{ ...inputStyle, fontFamily: 'sans-serif', resize: 'none', marginBottom: '20px' }}></textarea>

                <button type="submit" className="glow-btn-primary" style={{ width: '100%', padding: '14px', fontSize: '13px' }}>
                  {t.sendBtn}
                </button>
              </form>
            )}
          </div>

          {/* FAQ */}
          <div>
            <h3 style={{ margin: '0 0 18px 0', fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>{t.faqTitle}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {faqs.map((f, i) => (
                <div key={i} className="glass-card" style={{ padding: '18px 20px', cursor: 'pointer' }} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontWeight: '700', color: '#ffffff', fontSize: '13px' }}>{f.q}</span>
                    <span style={{ color: '#eab308', fontSize: '16px', fontWeight: '800' }}>{openFaq === i ? '−' : '+'}</span>
                  </div>
                  {openFaq === i && (
                    <p style={{ margin: '12px 0 0 0', color: '#94a3b8', fontSize: '12px', lineHeight: '1.7' }}>{f.a}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#0b0f19', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '30px 40px', color: '#64748b', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/tradeforge_logo.png" alt="Logo" style={{ width: '22px', height: '22px', borderRadius: '4px' }} />
          <span>{t.footer}</span>
        </div>
        <span>{t.footerEmail}</span>
      </footer>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '12px 14px', background: '#0b0f19', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', color: '#ffffff', fontSize: '13px', boxSizing: 'border-box', outline: 'none' };
