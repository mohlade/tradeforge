import React from 'react';

export default function LangToggle({ lang, setLang }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        background: '#0b0f19',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '8px',
        padding: '3px',
        gap: '2px',
        userSelect: 'none',
      }}
    >
      <button
        onClick={() => setLang('EN')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '5px 11px',
          background: lang === 'EN' ? 'rgba(234, 179, 8, 0.2)' : 'transparent',
          border: lang === 'EN' ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid transparent',
          borderRadius: '6px',
          color: lang === 'EN' ? '#eab308' : '#64748b',
          fontWeight: '700',
          fontSize: '11px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        🇺🇸 EN
      </button>
      <button
        onClick={() => setLang('ES')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '5px 11px',
          background: lang === 'ES' ? 'rgba(234, 179, 8, 0.2)' : 'transparent',
          border: lang === 'ES' ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid transparent',
          borderRadius: '6px',
          color: lang === 'ES' ? '#eab308' : '#64748b',
          fontWeight: '700',
          fontSize: '11px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        🇪🇸 ES
      </button>
    </div>
  );
}
