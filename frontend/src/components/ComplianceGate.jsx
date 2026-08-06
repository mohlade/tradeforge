import React, { useState } from 'react';
import translations from '../i18n/translations';
import LangToggle from './LangToggle';
import { API_BASE } from '../config';

export default function ComplianceGate({ onVerified, lang, setLang }) {
  const [authMode, setAuthMode] = useState('LOGIN');
  const [registerStep, setRegisterStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '', 
    password: '', 
    first_name: '', 
    last_name: '', 
    date_of_birth: '', 
    phone: '',
    country: '',
    city: '',
    zip_code: '',
    address: '',
    id_document_type: '',
    documents_received: 'NO'
  });
  const [docFiles, setDocFiles] = useState({ id: null, address: null, selfie: null });
  const [logs, setLogs] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [pendingNotice, setPendingNotice] = useState('');

  const t = translations[lang].auth;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsScanning(true);
    setError('');
    setPendingNotice('');
    setLogs([t.loginStep1]);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.detail || 'Authentication failed.');
      setLogs(prev => [...prev, t.loginStep2]);
      await new Promise(r => setTimeout(r, 450));
      onVerified(result.data.email, result.data.buying_power, result.data.token);
    } catch (err) {
      setError(err.message);
      setIsScanning(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (formData.password.length < 8) { setError(t.errPassword); setIsScanning(false); return; }
    const uploadPayload = { ...formData, documents_received: 'YES' };
    setError('');
    setPendingNotice('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(uploadPayload)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.detail || 'Registration failed.');
      setPendingNotice(result.message || t.registerPending);
    } catch (err) {
      setError(err.message);
    }
  };

  const goNextStep = () => {
    setError('');
    if (registerStep === 1) {
      if (!formData.email) { setError(t.errEmail); return; }
      if (formData.password.length < 8) { setError(t.errPassword); return; }
    }
    if (registerStep === 2 && (!formData.first_name || !formData.last_name || !formData.date_of_birth)) { setError(t.errIdentity); return; }
    if (registerStep === 3 && (!formData.country || !formData.city || !formData.address)) { setError(t.errAddress); return; }
    setRegisterStep(s => s + 1);
  };

  const goBackStep = () => { setError(''); setRegisterStep(s => Math.max(1, s - 1)); };

  const onFilePick = (key) => (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) setDocFiles(prev => ({ ...prev, [key]: file.name }));
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, rgba(30, 41, 59, 0.8) 0%, #0f172a 75%)', padding: '20px', position: 'fixed', left: 0, top: 0, zIndex: 1000, boxSizing: 'border-box', overflowY: 'auto' }}>
      
      <div className="glass-card" style={{ maxWidth: '450px', width: '100%', padding: '38px 32px', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 20px 50px -10px rgba(0,0,0,0.6)' }}>
        
        {/* Lang Toggle Top Right */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <LangToggle lang={lang} setLang={setLang} />
        </div>

        {/* Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <img src="/tradeforge_logo.png" alt="TradeForge Logo" style={{ width: '52px', height: '52px', borderRadius: '12px', objectFit: 'cover', margin: '0 auto 12px auto', display: 'block', boxShadow: '0 0 15px rgba(234, 179, 8, 0.25)' }} />
          <h2 style={{ margin: 0, fontSize: '22px', color: '#ffffff', fontWeight: '800', letterSpacing: '-0.5px' }}>{t.title}</h2>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>{t.subtitle}</p>
        </div>

        {/* Auth Mode Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#0b0f19', padding: '4px', borderRadius: '10px', marginBottom: '22px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <button onClick={() => { setAuthMode('LOGIN'); setError(''); setPendingNotice(''); }} style={{ padding: '9px', background: authMode === 'LOGIN' ? 'rgba(234, 179, 8, 0.15)' : 'transparent', color: authMode === 'LOGIN' ? '#eab308' : '#64748b', border: authMode === 'LOGIN' ? '1px solid rgba(234, 179, 8, 0.3)' : 'none', borderRadius: '7px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', transition: 'all 0.2s' }}>
            {t.tabLogin}
          </button>
          <button onClick={() => { setAuthMode('REGISTER'); setError(''); setPendingNotice(''); setRegisterStep(1); }} style={{ padding: '9px', background: authMode === 'REGISTER' ? 'rgba(234, 179, 8, 0.15)' : 'transparent', color: authMode === 'REGISTER' ? '#eab308' : '#64748b', border: authMode === 'REGISTER' ? '1px solid rgba(234, 179, 8, 0.3)' : 'none', borderRadius: '7px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', transition: 'all 0.2s' }}>
            {t.tabRegister}
          </button>
        </div>

        {/* Scanning Log */}
        {isScanning && (
          <div className="mono-font" style={{ background: '#0b0f19', border: '1px solid rgba(234, 179, 8, 0.25)', padding: '14px', borderRadius: '8px', color: '#eab308', fontSize: '11px', lineHeight: '1.6', marginBottom: '18px' }}>
            {logs.map((log, index) => <div key={index}>{log}</div>)}
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid #ef4444', color: '#fca5a5', padding: '12px', borderRadius: '8px', marginBottom: '18px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠️</span> <span>{error}</span>
          </div>
        )}

        {/* Pending Approval Notice */}
        {pendingNotice && (
          <div style={{ background: 'rgba(234, 179, 8, 0.12)', border: '1px solid #eab308', color: '#fde68a', padding: '14px', borderRadius: '8px', marginBottom: '18px', fontSize: '12px', lineHeight: '1.6', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <span>⏳</span> <span>{pendingNotice}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {!isScanning && authMode === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: '700', marginBottom: '6px' }}>{t.labelEmail}</label>
              <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={inputStyle} />
            </div>
            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: '700', marginBottom: '6px' }}>{t.labelPassword}</label>
              <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={inputStyle} />
            </div>
            <button type="submit" className="glow-btn-primary" style={{ width: '100%', padding: '13px', fontSize: '13px', letterSpacing: '0.5px' }}>
              {t.loginBtn}
            </button>
          </form>
        )}

        {/* REGISTER FORM — MULTI-STEP KYC WIZARD */}
        {!isScanning && authMode === 'REGISTER' && (
          <div>
            {/* Step indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '18px' }}>
              {[
                { num: 1, label: t.wizardAccount },
                { num: 2, label: t.wizardIdentity },
                { num: 3, label: t.wizardAddress },
                { num: 4, label: t.wizardDocuments },
              ].map((step, i) => (
                <React.Fragment key={step.num}>
                  {i > 0 && <div style={{ flex: 1, height: '2px', background: registerStep > i ? '#eab308' : 'rgba(255,255,255,0.1)', borderRadius: '2px' }} />}
                  <div style={{ textAlign: 'center', width: '52px' }}>
                    <div style={{ width: '24px', height: '24px', margin: '0 auto 3px auto', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', background: registerStep === step.num ? '#eab308' : registerStep > step.num ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.07)', color: registerStep === step.num ? '#0f172a' : registerStep > step.num ? '#10b981' : '#64748b', border: registerStep === step.num ? '1px solid #eab308' : registerStep > step.num ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.12)' }}>
                      {registerStep > step.num ? '✓' : step.num}
                    </div>
                    <div style={{ fontSize: '8px', color: registerStep === step.num ? '#eab308' : '#64748b', fontWeight: '700', letterSpacing: '0.3px' }}>{step.label}</div>
                  </div>
                </React.Fragment>
              ))}
            </div>

            <form onSubmit={handleRegisterSubmit}>
              {/* STEP 1 — ACCOUNT */}
              {registerStep === 1 && (
                <div>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: '700', marginBottom: '6px' }}>{t.labelEmail}</label>
                    <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: '22px' }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: '700', marginBottom: '6px' }}>{t.labelPassword}</label>
                    <input type="password" required minLength="8" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={inputStyle} />
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '5px' }}>{t.passwordHint}</div>
                  </div>
                  <button type="button" onClick={goNextStep} className="glow-btn-primary" style={{ width: '100%', padding: '13px', fontSize: '13px', letterSpacing: '0.5px' }}>
                    {t.continueBtn} →
                  </button>
                </div>
              )}

              {/* STEP 2 — IDENTITY */}
              {registerStep === 2 && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>{t.labelFirstName}</label>
                      <input type="text" required value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>{t.labelLastName}</label>
                      <input type="text" required value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>{t.labelDOB}</label>
                      <input type="date" required value={formData.date_of_birth} onChange={e => setFormData({...formData, date_of_birth: e.target.value})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>{t.labelPhone}</label>
                      <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                    <button type="button" onClick={goBackStep} style={{ padding: '13px', background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '7px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>← {t.backBtn}</button>
                    <button type="button" onClick={goNextStep} className="glow-btn-primary" style={{ padding: '13px', fontSize: '13px', letterSpacing: '0.5px' }}>{t.continueBtn} →</button>
                  </div>
                </div>
              )}

              {/* STEP 3 — ADDRESS & EMPLOYMENT */}
              {registerStep === 3 && (
                <div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>{t.labelAddress}</label>
                    <input type="text" required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} style={inputStyle} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>{t.labelCountry}</label>
                      <input type="text" required value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>{t.labelCity}</label>
                      <input type="text" required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>{t.labelZip}</label>
                      <input type="text" required value={formData.zip_code} onChange={e => setFormData({...formData, zip_code: e.target.value})} style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <button type="button" onClick={goBackStep} style={{ padding: '13px', background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '7px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>← {t.backBtn}</button>
                    <button type="button" onClick={goNextStep} className="glow-btn-primary" style={{ padding: '13px', fontSize: '13px', letterSpacing: '0.5px' }}>{t.continueBtn} →</button>
                  </div>
                </div>
              )}

              {/* STEP 4 — DOCUMENTS */}
              {registerStep === 4 && (
                <div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>{t.labelDocType}</label>
                    <select required value={formData.id_document_type} onChange={e => setFormData({...formData, id_document_type: e.target.value})} style={{ ...inputStyle, appearance: 'none' }}>
                      <option value="" disabled>{t.selectPlaceholder}</option>
                      <option value="PASSPORT">{t.docPassport}</option>
                      <option value="NATIONAL_ID">{t.docNationalId}</option>
                      <option value="DRIVERS_LICENSE">{t.docDrivers}</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: '10px', background: 'rgba(255,255,255,0.03)', border: docFiles.id ? '1px solid rgba(16,185,129,0.4)' : '1px dashed rgba(255,255,255,0.18)', borderRadius: '8px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: docFiles.id ? '#10b981' : '#cbd5e1', fontSize: '11px', fontWeight: '700' }}>
                      {docFiles.id ? '✓ ' + docFiles.id : t.docIdLabel}
                    </span>
                    <label style={{ cursor: 'pointer', background: docFiles.id ? 'rgba(16,185,129,0.15)' : 'rgba(234,179,8,0.15)', color: docFiles.id ? '#10b981' : '#eab308', border: docFiles.id ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(234,179,8,0.35)', padding: '6px 12px', borderRadius: '6px', fontWeight: '800', fontSize: '10px' }}>
                      {docFiles.id ? t.docReplaced : t.docUploadBtn}
                      <input type="file" accept="image/*,.pdf" onChange={onFilePick('id')} style={{ display: 'none' }} />
                    </label>
                  </div>
                  <div style={{ fontSize: '9px', color: '#64748b', lineHeight: '1.5', marginBottom: '14px' }}>{t.docNote}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <button type="button" onClick={goBackStep} style={{ padding: '13px', background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '7px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>← {t.backBtn}</button>
                    <button type="submit" className="glow-btn-primary" style={{ padding: '13px', fontSize: '12px', letterSpacing: '0.5px' }}>{t.registerBtn}</button>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}

      </div>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '11px 13px', background: '#0b0f19', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '7px', color: '#ffffff', boxSizing: 'border-box', fontSize: '13px', outline: 'none' };
