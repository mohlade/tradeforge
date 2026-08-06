import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useBrokerState } from './hooks/useBrokerState';
import MarketingHome from './components/MarketingHome';
import ComplianceGate from './components/ComplianceGate';
import AboutPage from './components/AboutPage';
import ContactPage from './components/ContactPage';
import AdminPortal from './components/AdminPortal';
import ClientDashboard from './components/ClientDashboard';
import { API_BASE } from './config';

const SESSION_KEY = 'tf_session';

// Map legacy page names to URL paths
const ROUTE_PATHS = {
  MARKETING_HOME: '/',
  ABOUT_PAGE: '/about',
  CONTACT_PAGE: '/contact',
  ADMIN_PORTAL: '/admin',
  CLIENT_AREA: '/portal',
  KYC_GATE: '/portal',
};

function AppRoutes() {
  const broker = useBrokerState();
  const navigate = useNavigate();

  // Global language state shared across all pages
  const [lang, setLang] = useState('EN');
  const [restoringSession, setRestoringSession] = useState(true);

  // On first load, restore a valid persisted session so a refresh
  // keeps the user logged in instead of bouncing back to the home page.
  // Uses sessionStorage: the login survives a refresh in the same tab,
  // but is cleared when the tab/window is closed, so returning visitors
  // must sign in again.
  useEffect(() => {
    let saved;
    try {
      saved = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      setRestoringSession(false);
      return;
    }
    if (!saved || !saved.email || !saved.token) {
      sessionStorage.removeItem(SESSION_KEY);
      setRestoringSession(false);
      return;
    }
    fetch(`${API_BASE}/api/auth/session`, {
      headers: { 'Authorization': `Bearer ${saved.token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          broker.setSession(data.data.email, saved.token);
          broker.hydrateWalletBalance(data.data.buying_power);
        } else {
          sessionStorage.removeItem(SESSION_KEY);
        }
        setRestoringSession(false);
      })
      .catch(() => {
        sessionStorage.removeItem(SESSION_KEY);
        setRestoringSession(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Unified navigation: every page passes legacy route names
  const handleNavigate = (route) => {
    navigate(ROUTE_PATHS[route] || '/');
  };

  // Successful customer sign-in: store session and enter the portal
  const handleVerified = (email, buyingPower, token) => {
    broker.setSession(email, token);
    if (buyingPower != null) broker.hydrateWalletBalance(buyingPower);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email, token }));
    navigate('/portal');
  };

  // Log out: destroy the server-side session, clear local state,
  // then return to the marketing home so the gate protects everything again.
  const handleLogOut = () => {
    let saved;
    try { saved = JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { /* ignore */ }
    if (saved && saved.token) {
      fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${saved.token}` }
      }).catch(() => { /* best-effort */ });
    }
    sessionStorage.removeItem(SESSION_KEY);
    broker.resetBrokerSession();
    navigate('/');
  };

  if (restoringSession) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <img src="/tradeforge_logo.png" alt="TradeForge Pro" style={{ width: '60px', height: '60px', borderRadius: '12px', marginBottom: '16px', boxShadow: '0 0 20px rgba(234, 179, 8, 0.25)' }} />
        <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '700', letterSpacing: '1.5px' }}>
          TRADEFORGE<span style={{ color: '#eab308' }}>.PRO</span>
        </div>
        <div className="mono-font" style={{ marginTop: '14px', fontSize: '11px', color: '#64748b' }}>restoring session…</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Routes>
        <Route path="/" element={<MarketingHome lang={lang} setLang={setLang} onNavigate={handleNavigate} />} />
        <Route path="/about" element={<AboutPage lang={lang} setLang={setLang} onNavigate={handleNavigate} />} />
        <Route path="/contact" element={<ContactPage lang={lang} setLang={setLang} onNavigate={handleNavigate} />} />
        <Route path="/admin" element={<AdminPortal lang={lang} setLang={setLang} onNavigate={handleNavigate} brokerState={broker} />} />

        {/* Protected client area: shows the dashboard only with a valid session */}
        <Route
          path="/portal"
          element={broker.isAuthenticated ? (
            <ClientDashboard
              broker={broker}
              lang={lang}
              setLang={setLang}
              onLogOut={handleLogOut}
            />
          ) : (
            <ComplianceGate lang={lang} setLang={setLang} onVerified={handleVerified} />
          )}
        />

        {/* Unknown URLs fall back to the marketing home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
