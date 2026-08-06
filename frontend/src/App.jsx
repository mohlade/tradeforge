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

  // On first load, restore a valid persisted session so a refresh
  // keeps the user logged in instead of bouncing back to the home page.
  useEffect(() => {
    let saved;
    try {
      saved = JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return;
    }
    if (!saved || !saved.email || !saved.token) {
      localStorage.removeItem(SESSION_KEY);
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
          localStorage.removeItem(SESSION_KEY);
        }
      })
      .catch(() => localStorage.removeItem(SESSION_KEY));
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
    localStorage.setItem(SESSION_KEY, JSON.stringify({ email, token }));
    navigate('/portal');
  };

  // Log out: destroy the server-side session, clear local state,
  // then return to the marketing home so the gate protects everything again.
  const handleLogOut = () => {
    let saved;
    try { saved = JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { /* ignore */ }
    if (saved && saved.token) {
      fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${saved.token}` }
      }).catch(() => { /* best-effort */ });
    }
    localStorage.removeItem(SESSION_KEY);
    broker.resetBrokerSession();
    navigate('/');
  };

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
