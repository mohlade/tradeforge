import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';
import useMediaQuery from '../hooks/useMediaQuery';

export default function AdminPortal({ onNavigate, brokerState }) {
  const isMobile = useMediaQuery('(max-width: 820px)');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [adminAuthData, setAdminAuthData] = useState({ email: '', password: '' });
  const [adminError, setAdminError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('CUSTOMERS'); // 'CUSTOMERS', 'WITHDRAWALS', 'RATES'
  const [userList, setUserList] = useState([]);
  const [withdrawalsList, setWithdrawalsList] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');

  // Selected customer for balance edit
  const [selectedUser, setSelectedUser] = useState(null);
  const [newBalanceInput, setNewBalanceInput] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');

  // Rate override state
  const [rateInputs, setRateInputs] = useState({});

  // Create customer account state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAccountForm, setNewAccountForm] = useState({
    first_name: '', last_name: '', email: '', password: '', initial_balance: 100000, kyc_status: 'APPROVED'
  });

  // Customer account read-only preview state
  const [viewAccount, setViewAccount] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Pending approval state
  const [approveUser, setApproveUser] = useState(null);
  const [approveBalance, setApproveBalance] = useState(100000);

  // Restore a previously issued admin session on page refresh
  useEffect(() => {
    const token = localStorage.getItem('tf_admin_token');
    if (!token) {
      setIsCheckingSession(false);
      return;
    }
    fetch(`${API_BASE}/api/admin/session`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setIsAdminAuthenticated(true);
          fetchUsersList();
          fetchWithdrawalsList();
        } else {
          localStorage.removeItem('tf_admin_token');
        }
      })
      .catch(() => localStorage.removeItem('tf_admin_token'))
      .finally(() => setIsCheckingSession(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const adminHeaders = (withJson = true) => ({
    ...(withJson ? { 'Content-Type': 'application/json' } : {}),
    'Authorization': `Bearer ${localStorage.getItem('tf_admin_token') || ''}`
  });

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setAdminError('');

    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminAuthData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Admin authentication failed');

      localStorage.setItem('tf_admin_token', data.data.token);
      setIsAdminAuthenticated(true);
      fetchUsersList();
      fetchWithdrawalsList();
    } catch (err) {
      setAdminError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogout = async () => {
    const token = localStorage.getItem('tf_admin_token');
    if (token) {
      try {
        await fetch(`${API_BASE}/api/admin/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch { /* best-effort */ }
    }
    localStorage.removeItem('tf_admin_token');
    setIsAdminAuthenticated(false);
    setUserList([]);
    setWithdrawalsList([]);
    setActiveTab('CUSTOMERS');
    onNavigate('MARKETING_HOME');
  };

  const fetchUsersList = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`, { headers: adminHeaders(false) });
      const result = await res.json();
      if (res.ok && result.data) {
        setUserList(result.data);
      } else if (res.status === 401) {
        handleAdminLogout();
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const fetchWithdrawalsList = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/withdrawals`, { headers: adminHeaders(false) });
      const result = await res.json();
      if (res.ok && result.data) {
        setWithdrawalsList(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch withdrawals:", err);
    }
  };

  const handleSaveUserBalance = async (email, balanceValue) => {
    const val = parseFloat(balanceValue);
    if (isNaN(val) || val < 0) {
      alert("Invalid balance figure entered.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/admin/users/update-balance`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ email, new_balance: val })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.detail || 'Failed to update balance');

      setUpdateMessage(`✅ Account balance for ${email} updated to $${val.toLocaleString()} USDT`);
      fetchUsersList();

      if (brokerState && (brokerState.activeUser === email || !brokerState.activeUser)) {
        brokerState.updateUserBalanceByAdmin(val);
      }

      setTimeout(() => setUpdateMessage(''), 4000);
      setSelectedUser(null);
    } catch (err) {
      alert(`Error updating balance: ${err.message}`);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!newAccountForm.first_name || !newAccountForm.last_name || !newAccountForm.email || !newAccountForm.password) {
      alert("Please fill in all required customer fields.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/create`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify(newAccountForm)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.detail || 'Failed to create account');

      setUpdateMessage(`✅ ${result.message}`);
      fetchUsersList();
      setIsCreateModalOpen(false);
      setNewAccountForm({ first_name: '', last_name: '', email: '', password: '', initial_balance: 100000, kyc_status: 'APPROVED' });
      setTimeout(() => setUpdateMessage(''), 5000);
    } catch (err) {
      alert(`Error creating account: ${err.message}`);
    }
  };

  const openAccountView = async (email) => {
    setViewLoading(true);
    setViewAccount(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${encodeURIComponent(email)}`, {
        headers: adminHeaders(false)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.detail || 'Failed to load account');
      setViewAccount(result.data);
    } catch (err) {
      alert(`Error loading account: ${err.message}`);
    } finally {
      setViewLoading(false);
    }
  };

  const handleDeleteUser = async (email) => {
    if (!window.confirm(`Delete customer account ${email}? This will permanently remove the account, its statements, and its withdrawal history.`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/delete`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ email })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.detail || 'Failed to delete account');
      setUpdateMessage(`🗑️ ${result.message}`);
      fetchUsersList();
      setTimeout(() => setUpdateMessage(''), 5000);
    } catch (err) {
      alert(`Error deleting account: ${err.message}`);
    }
  };

  const handleApproveUser = async (e) => {
    e.preventDefault();
    const val = parseFloat(approveBalance);
    if (isNaN(val) || val < 0) {
      alert("Please enter a valid funding balance.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/approve`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ email: approveUser, new_balance: val })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.detail || 'Failed to approve account');

      setUpdateMessage(`✅ ${result.message}`);
      fetchUsersList();
      setApproveUser(null);
      setApproveBalance(100000);
      setTimeout(() => setUpdateMessage(''), 5000);
    } catch (err) {
      alert(`Error approving account: ${err.message}`);
    }
  };

  const handleWithdrawalAction = async (withdrawalId, actionStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/withdrawals/action`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ withdrawal_id: withdrawalId, status: actionStatus })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.detail || 'Failed to process withdrawal action');

      setUpdateMessage(`✅ Withdrawal #${withdrawalId} ${actionStatus}`);
      fetchWithdrawalsList();
      fetchUsersList();
      setTimeout(() => setUpdateMessage(''), 4000);
    } catch (err) {
      alert(`Error processing withdrawal: ${err.message}`);
    }
  };

  const handleOverrideRate = async (symbol) => {
    const targetRate = parseFloat(rateInputs[symbol]);
    if (isNaN(targetRate) || targetRate <= 0) {
      alert("Please enter a valid price rate.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/admin/rates/update`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ symbol, new_rate: targetRate })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.detail || 'Failed to update rate');

      if (brokerState) {
        brokerState.overrideMarketRateByAdmin(symbol, targetRate);
      }

      setUpdateMessage(`⚡ Market rate for ${symbol} set to $${targetRate}`);
      setTimeout(() => setUpdateMessage(''), 4000);
    } catch (err) {
      alert(`Error overriding rate: ${err.message}`);
    }
  };

  const filteredUsers = userList.filter(u => 
    u.email.toLowerCase().includes(searchFilter.toLowerCase()) || 
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc', padding: isMobile ? '20px 14px' : '30px 40px', boxSizing: 'border-box' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '20px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img src="/tradeforge_logo.png" alt="Logo" style={{ width: '40px', height: '40px', borderRadius: '10px', boxShadow: '0 0 15px rgba(234, 179, 8, 0.25)' }} />
          <div>
            <h2 style={{ margin: 0, fontSize: isMobile ? '18px' : '22px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.5px' }}>TradeForge Admin Portal</h2>
            <span style={{ fontSize: '11px', color: '#eab308', fontWeight: '700' }}>CUSTOMER ACCOUNTS & WITHDRAWAL MANAGEMENT DECK</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {isAdminAuthenticated && (
            <button onClick={handleAdminLogout} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.35)', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>
              🚪 Log Out
            </button>
          )}
          <button onClick={() => onNavigate('MARKETING_HOME')} style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.12)', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>
            ← Back to Site
          </button>
        </div>
      </div>

      {/* SESSION RESTORE CHECK */}
      {isCheckingSession ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px', color: '#64748b', fontSize: '13px' }}>
          Restoring admin session...
        </div>
      ) : !isAdminAuthenticated ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '40px' }}>
          <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '40px 35px', background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
              <div style={{ background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.3)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 12px auto' }}>🔐</div>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>Admin Sign In</h3>
              <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '12px' }}>Administrative Portal Access</p>
            </div>

            {adminError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px 14px', borderRadius: '6px', marginBottom: '18px', fontSize: '12px' }}>
                ⚠️ {adminError}
              </div>
            )}

            <form onSubmit={handleAdminLogin}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase' }}>ADMIN EMAIL</label>
                <input 
                  type="email" 
                  required 
                  value={adminAuthData.email} 
                  onChange={e => setAdminAuthData({...adminAuthData, email: e.target.value})} 
                  style={inputStyle} 
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase' }}>ADMIN PASSWORD</label>
                <input 
                  type="password" 
                  required 
                  value={adminAuthData.password} 
                  onChange={e => setAdminAuthData({...adminAuthData, password: e.target.value})} 
                  style={inputStyle} 
                />
              </div>

              <button type="submit" className="glow-btn-primary" style={{ width: '100%', padding: '14px', fontSize: '13px' }}>
                {isLoading ? 'VERIFYING CREDENTIALS...' : 'AUTHORIZE ADMIN ACCESS →'}
              </button>
            </form>

          </div>
        </div>
      ) : (
        /* ADMIN DASHBOARD WORKSPACE */
        <div>
          {/* Notification Banner */}
          {updateMessage && (
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#6ee7b7', padding: '14px 20px', borderRadius: '10px', marginBottom: '24px', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>⚡</span> <span>{updateMessage}</span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '25px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setActiveTab('CUSTOMERS')} 
              style={{ padding: '12px 24px', background: activeTab === 'CUSTOMERS' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(255, 255, 255, 0.05)', color: activeTab === 'CUSTOMERS' ? '#eab308' : '#94a3b8', border: activeTab === 'CUSTOMERS' ? '1px solid #eab308' : '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '13px' }}>
              👤 Customer Accounts ({userList.length})
            </button>
            <button 
              onClick={() => setActiveTab('WITHDRAWALS')} 
              style={{ padding: '12px 24px', background: activeTab === 'WITHDRAWALS' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(255, 255, 255, 0.05)', color: activeTab === 'WITHDRAWALS' ? '#eab308' : '#94a3b8', border: activeTab === 'WITHDRAWALS' ? '1px solid #eab308' : '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '13px' }}>
              💸 Pending Withdrawals Queue ({withdrawalsList.filter(w => w.status === 'PENDING').length})
            </button>
            <button 
              onClick={() => setActiveTab('RATES')} 
              style={{ padding: '12px 24px', background: activeTab === 'RATES' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(255, 255, 255, 0.05)', color: activeTab === 'RATES' ? '#eab308' : '#94a3b8', border: activeTab === 'RATES' ? '1px solid #eab308' : '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '13px' }}>
              📈 Market Rates Controller
            </button>
          </div>

          {/* TAB 1: CUSTOMER ACCOUNTS */}
          {activeTab === 'CUSTOMERS' && (
            <div className="glass-card" style={{ padding: '30px', background: 'rgba(15, 23, 42, 0.95)' }}>
              
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '14px', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#ffffff' }}>CUSTOMER ACCOUNTS & BALANCE OVERRIDE</h3>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px', alignItems: isMobile ? 'stretch' : 'center', width: isMobile ? '100%' : 'auto' }}>
                  <button onClick={() => setIsCreateModalOpen(true)} className="glow-btn-primary" style={{ padding: '10px 18px', fontSize: '12px' }}>
                    ＋ Create New Account
                  </button>
                  <input 
                    type="text" 
                    placeholder="Filter by customer name or email..." 
                    value={searchFilter} 
                    onChange={e => setSearchFilter(e.target.value)} 
                    style={{ width: isMobile ? '100%' : '280px', padding: '10px 14px', background: '#0b0f19', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#fff', fontSize: '12px', outline: 'none' }} 
                  />
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px' }}>Customer Name</th>
                    <th style={{ padding: '12px' }}>Email Address</th>
                    <th style={{ padding: '12px' }}>KYC Status</th>
                    <th style={{ padding: '12px' }}>Current Balance (USDT)</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.email} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '14px 12px', fontWeight: '700', color: '#ffffff' }}>
                        {user.first_name} {user.last_name}
                      </td>
                      <td style={{ padding: '14px 12px', color: '#94a3b8' }}>{user.email}</td>
                      <td style={{ padding: '14px 12px' }}>
                        {user.kyc_status === 'APPROVED' ? (
                          <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '800' }}>
                            ✓ {user.kyc_status}
                          </span>
                        ) : (
                          <span style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.3)', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '800' }}>
                            ⏳ {user.kyc_status}
                          </span>
                        )}
                      </td>
                      <td className="mono-font" style={{ padding: '14px 12px', fontWeight: '800', color: '#eab308', fontSize: '15px' }}>
                        ${user.cash_balance.toLocaleString('en-US', {minimumFractionDigits: 2})} USDT
                      </td>
                      <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          {user.kyc_status !== 'APPROVED' && (
                            <button 
                              onClick={() => { setApproveUser(user.email); setApproveBalance(100000); }} 
                              className="glow-btn-primary" 
                              style={{ padding: '6px 14px', fontSize: '11px' }}>
                              ✓ Approve & Fund
                            </button>
                          )}
                          <button 
                            onClick={() => openAccountView(user.email)} 
                            style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '11px' }}>
                            👁️ View Account
                          </button>
                          <button 
                            onClick={() => { setSelectedUser(user.email); setNewBalanceInput(user.cash_balance); }} 
                            style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.3)', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '11px' }}>
                            ✏️ Edit Balance
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.email)} 
                            style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.35)', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '11px' }}>
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* INLINE MODAL FOR EDITING CUSTOMER BALANCE */}
              {selectedUser && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box' }}>
                  <div className="glass-card" style={{ background: '#0b0f19', padding: isMobile ? '24px' : '30px', borderRadius: '14px', maxWidth: '420px', width: '100%', border: '1px solid #eab308' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '17px', fontWeight: '800' }}>Edit Customer Balance</h3>
                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 20px 0' }}>Updating balance for: <strong style={{ color: '#fff' }}>{selectedUser}</strong></p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                      {[50000, 100000, 250000].map(amt => (
                        <button key={amt} onClick={() => setNewBalanceInput(amt)} style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', color: '#eab308', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}>
                          ${amt / 1000}k USDT
                        </button>
                      ))}
                    </div>

                    <input 
                      type="number" 
                      value={newBalanceInput} 
                      onChange={e => setNewBalanceInput(e.target.value)} 
                      className="mono-font" 
                      style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', fontSize: '16px', fontWeight: '800', marginBottom: '22px', boxSizing: 'border-box', outline: 'none' }} 
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <button onClick={() => handleSaveUserBalance(selectedUser, newBalanceInput)} className="glow-btn-primary" style={{ padding: '12px', fontSize: '12px' }}>
                        Confirm New Balance
                      </button>
                      <button onClick={() => setSelectedUser(null)} style={{ padding: '12px', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* CREATE CUSTOMER ACCOUNT MODAL */}
              {isCreateModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box' }}>
                  <form onSubmit={handleCreateAccount} className="glass-card" style={{ background: '#0b0f19', padding: isMobile ? '24px 18px' : '32px', borderRadius: '14px', maxWidth: '460px', width: '100%', border: '1px solid #eab308', maxHeight: '90vh', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h3 style={{ margin: 0, color: '#fff', fontSize: '17px', fontWeight: '800' }}>＋ Create Customer Account</h3>
                      <button type="button" onClick={() => setIsCreateModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '20px', cursor: 'pointer', fontWeight: '800' }}>✕</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '10px', color: '#64748b', fontWeight: '800', marginBottom: '4px' }}>FIRST NAME</label>
                        <input type="text" required value={newAccountForm.first_name} onChange={e => setNewAccountForm({...newAccountForm, first_name: e.target.value})} style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '10px', color: '#64748b', fontWeight: '800', marginBottom: '4px' }}>LAST NAME</label>
                        <input type="text" required value={newAccountForm.last_name} onChange={e => setNewAccountForm({...newAccountForm, last_name: e.target.value})} style={inputStyle} />
                      </div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '10px', color: '#64748b', fontWeight: '800', marginBottom: '4px' }}>EMAIL ADDRESS</label>
                      <input type="email" required value={newAccountForm.email} onChange={e => setNewAccountForm({...newAccountForm, email: e.target.value})} style={inputStyle} />
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '10px', color: '#64748b', fontWeight: '800', marginBottom: '4px' }}>ACCOUNT PASSWORD</label>
                      <input type="text" required value={newAccountForm.password} onChange={e => setNewAccountForm({...newAccountForm, password: e.target.value})} style={inputStyle} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '10px', color: '#64748b', fontWeight: '800', marginBottom: '4px' }}>INITIAL BALANCE (USDT)</label>
                        <input type="number" min="0" value={newAccountForm.initial_balance} onChange={e => setNewAccountForm({...newAccountForm, initial_balance: parseFloat(e.target.value) || 0})} className="mono-font" style={{ ...inputStyle, fontWeight: '800', color: '#eab308' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '10px', color: '#64748b', fontWeight: '800', marginBottom: '4px' }}>KYC STATUS</label>
                        <select value={newAccountForm.kyc_status} onChange={e => setNewAccountForm({...newAccountForm, kyc_status: e.target.value})} style={{ ...inputStyle, appearance: 'none' }}>
                          <option value="APPROVED">APPROVED</option>
                          <option value="PENDING">PENDING</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px' }}>
                      {[25000, 100000, 250000].map(amt => (
                        <button type="button" key={amt} onClick={() => setNewAccountForm({...newAccountForm, initial_balance: amt})} style={{ padding: '8px', background: newAccountForm.initial_balance === amt ? 'rgba(234,179,8,0.2)' : 'rgba(255,255,255,0.05)', color: newAccountForm.initial_balance === amt ? '#eab308' : '#94a3b8', border: newAccountForm.initial_balance === amt ? '1px solid #eab308' : '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}>
                          ${amt / 1000}k USDT
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <button type="submit" className="glow-btn-primary" style={{ padding: '12px', fontSize: '12px' }}>
                        Create Account
                      </button>
                      <button type="button" onClick={() => setIsCreateModalOpen(false)} style={{ padding: '12px', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* APPROVE & FUND PENDING ACCOUNT MODAL */}
              {approveUser && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box' }}>
                  <form onSubmit={handleApproveUser} className="glass-card" style={{ background: '#0b0f19', padding: isMobile ? '24px' : '30px', borderRadius: '14px', maxWidth: '420px', width: '100%', border: '1px solid #10b981' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '17px', fontWeight: '800' }}>✓ Approve & Fund Account</h3>
                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 20px 0' }}>
                      Granting portal access to: <strong style={{ color: '#fff' }}>{approveUser}</strong><br />
                      <span style={{ color: '#eab308' }}>Set the funding balance this customer will see in their account.</span>
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                      {[25000, 100000, 250000].map(amt => (
                        <button type="button" key={amt} onClick={() => setApproveBalance(amt)} style={{ padding: '8px', background: approveBalance === amt ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)', color: approveBalance === amt ? '#10b981' : '#94a3b8', border: approveBalance === amt ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}>
                          ${amt / 1000}k USDT
                        </button>
                      ))}
                    </div>

                    <input 
                      type="number" 
                      value={approveBalance} 
                      onChange={e => setApproveBalance(parseFloat(e.target.value) || 0)} 
                      className="mono-font" 
                      style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#10b981', fontSize: '16px', fontWeight: '800', marginBottom: '22px', boxSizing: 'border-box', outline: 'none' }} 
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <button type="submit" className="glow-btn-primary" style={{ padding: '12px', fontSize: '12px' }}>
                        Approve & Fund
                      </button>
                      <button type="button" onClick={() => setApproveUser(null)} style={{ padding: '12px', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* CUSTOMER ACCOUNT READ-ONLY PREVIEW MODAL */}
              {viewAccount && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box' }}>
                  <div style={{ background: '#0f172a', border: '1px solid rgba(56, 189, 248, 0.35)', borderRadius: '14px', maxWidth: '760px', width: '100%', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 30px 60px -15px rgba(0,0,0,0.9)' }}>
                    
                    {/* Preview header */}
                    <div style={{ padding: '22px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#0f172a', zIndex: 5 }}>
                      <div>
                        <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: '800', letterSpacing: '1px' }}>CUSTOMER ACCOUNT PREVIEW</div>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>{viewAccount.user.first_name} {viewAccount.user.last_name}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{viewAccount.user.email}</div>
                      </div>
                      <button onClick={() => setViewAccount(null)} style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '11px' }}>✕ Close</button>
                    </div>

                    {/* Overview cards */}
                    <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '14px' }}>
                      <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '10px', padding: '16px' }}>
                        <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>WALLET BALANCE</div>
                        <div className="mono-font" style={{ fontSize: '20px', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>${viewAccount.user.cash_balance.toLocaleString('en-US', {minimumFractionDigits: 2})} USDT</div>
                      </div>
                      <div style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.25)', borderRadius: '10px', padding: '16px' }}>
                        <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>KYC STATUS</div>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: viewAccount.user.kyc_status === 'APPROVED' ? '#eab308' : '#ef4444', marginTop: '4px' }}>{viewAccount.user.kyc_status}</div>
                      </div>
                      <div style={{ background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.25)', borderRadius: '10px', padding: '16px' }}>
                        <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>TRADE COUNT</div>
                        <div className="mono-font" style={{ fontSize: '20px', fontWeight: '800', color: '#818cf8', marginTop: '4px' }}>{viewAccount.trades.length}</div>
                      </div>
                    </div>

                    {/* Trade statements */}
                    <div style={{ padding: '0 28px 10px 28px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>📜 Account Statements</div>
                      {viewAccount.trades.length === 0 ? (
                        <div style={{ color: '#64748b', fontSize: '12px', padding: '20px 0', textAlign: 'center' }}>No closed trade records for this customer.</div>
                      ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}>
                              <th style={{ padding: '8px' }}>Trade ID</th>
                              <th style={{ padding: '8px' }}>Pair</th>
                              <th style={{ padding: '8px' }}>Dir</th>
                              <th style={{ padding: '8px' }}>Lots</th>
                              <th style={{ padding: '8px' }}>Entry</th>
                              <th style={{ padding: '8px' }}>Exit</th>
                              <th style={{ padding: '8px', textAlign: 'right' }}>PnL</th>
                            </tr>
                          </thead>
                          <tbody>
                            {viewAccount.trades.map(trade => (
                              <tr key={trade.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td className="mono-font" style={{ padding: '10px 8px', color: '#94a3b8', fontSize: '11px' }}>#{trade.id}</td>
                                <td style={{ padding: '10px 8px', fontWeight: '700', color: '#fff', fontSize: '12px' }}>{trade.pair}</td>
                                <td style={{ padding: '10px 8px', color: trade.direction === 'LONG' ? '#10b981' : '#ef4444', fontWeight: '800', fontSize: '11px' }}>{trade.direction}</td>
                                <td className="mono-font" style={{ padding: '10px 8px', color: '#cbd5e1', fontSize: '11px' }}>{trade.lots}</td>
                                <td className="mono-font" style={{ padding: '10px 8px', color: '#94a3b8', fontSize: '11px' }}>${trade.entry_price.toLocaleString()}</td>
                                <td className="mono-font" style={{ padding: '10px 8px', color: '#94a3b8', fontSize: '11px' }}>${trade.exit_price.toLocaleString()}</td>
                                <td className="mono-font" style={{ padding: '10px 8px', textAlign: 'right', fontWeight: '800', color: trade.pnl >= 0 ? '#10b981' : '#ef4444', fontSize: '11px' }}>{trade.pnl >= 0 ? '+' : ''}${trade.pnl.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {/* Withdrawals */}
                    <div style={{ padding: '10px 28px 28px 28px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>💸 Withdrawal Requests</div>
                      {viewAccount.withdrawals.length === 0 ? (
                        <div style={{ color: '#64748b', fontSize: '12px', padding: '20px 0', textAlign: 'center' }}>No withdrawal requests from this customer.</div>
                      ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}>
                              <th style={{ padding: '8px' }}>Req ID</th>
                              <th style={{ padding: '8px' }}>Amount</th>
                              <th style={{ padding: '8px' }}>Address</th>
                              <th style={{ padding: '8px', textAlign: 'right' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {viewAccount.withdrawals.map(w => (
                              <tr key={w.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td className="mono-font" style={{ padding: '10px 8px', color: '#94a3b8', fontSize: '11px' }}>#{w.id}</td>
                                <td className="mono-font" style={{ padding: '10px 8px', fontWeight: '800', color: '#eab308', fontSize: '11px' }}>${w.amount.toLocaleString()} USDT</td>
                                <td className="mono-font" style={{ padding: '10px 8px', color: '#cbd5e1', fontSize: '10px' }}>{w.address}</td>
                                <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                                  <span style={{ background: w.status === 'APPROVED' ? 'rgba(16,185,129,0.15)' : w.status === 'REJECTED' ? 'rgba(239,68,68,0.15)' : 'rgba(234,179,8,0.15)', color: w.status === 'APPROVED' ? '#10b981' : w.status === 'REJECTED' ? '#ef4444' : '#eab308', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '800' }}>{w.status}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {viewLoading && (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>Loading customer account preview...</div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: PENDING WITHDRAWALS QUEUE */}
          {activeTab === 'WITHDRAWALS' && (
            <div className="glass-card" style={{ padding: '30px', background: 'rgba(15, 23, 42, 0.95)' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '800', color: '#ffffff' }}>CUSTOMER WITHDRAWAL REQUESTS QUEUE</h3>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 25px 0' }}>Review and process customer TRC-20 crypto payout requests.</p>

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px' }}>Req ID</th>
                    <th style={{ padding: '12px' }}>Customer Email</th>
                    <th style={{ padding: '12px' }}>Amount (USDT)</th>
                    <th style={{ padding: '12px' }}>Destination TRC-20 Address</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawalsList.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No pending withdrawal requests found.</td>
                    </tr>
                  ) : (
                    withdrawalsList.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td className="mono-font" style={{ padding: '14px 12px', color: '#94a3b8' }}>#{item.id}</td>
                        <td style={{ padding: '14px 12px', fontWeight: '700', color: '#ffffff' }}>{item.user_email}</td>
                        <td className="mono-font" style={{ padding: '14px 12px', fontWeight: '800', color: '#eab308', fontSize: '15px' }}>
                          ${item.amount.toLocaleString()} USDT
                        </td>
                        <td className="mono-font" style={{ padding: '14px 12px', color: '#cbd5e1', fontSize: '11px' }}>{item.address}</td>
                        <td style={{ padding: '14px 12px' }}>
                          <span style={{ 
                            background: item.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.15)' : item.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)', 
                            color: item.status === 'APPROVED' ? '#10b981' : item.status === 'REJECTED' ? '#ef4444' : '#eab308', 
                            border: `1px solid ${item.status === 'APPROVED' ? '#10b981' : item.status === 'REJECTED' ? '#ef4444' : '#eab308'}`, 
                            padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '800' 
                          }}>
                            {item.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                          {item.status === 'PENDING' ? (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button onClick={() => handleWithdrawalAction(item.id, 'APPROVED')} className="glow-btn-primary" style={{ padding: '6px 12px', fontSize: '11px' }}>
                                ✓ Approve
                              </button>
                              <button onClick={() => handleWithdrawalAction(item.id, 'REJECTED')} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '11px' }}>
                                ✕ Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#64748b' }}>Processed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: MARKET RATES OVERRIDE CONTROLLER */}
          {activeTab === 'RATES' && (
            <div className="glass-card" style={{ padding: '30px', background: 'rgba(15, 23, 42, 0.95)' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '800', color: '#ffffff' }}>LIVE MARKET TICKER PRICE CONTROLLER</h3>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 25px 0' }}>Manually override live market prices. Connected trading monitors will update rates instantly.</p>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px' }}>
                {Object.keys(brokerState ? brokerState.marketRates : {}).map(symbol => {
                  const currentRate = brokerState.marketRates[symbol];
                  return (
                    <div key={symbol} style={{ background: '#0b0f19', border: '1px solid rgba(255,255,255,0.08)', padding: '20px', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontWeight: '800', color: '#ffffff', fontSize: '15px' }}>{symbol}</span>
                        <span className="mono-font" style={{ fontWeight: '800', color: '#10b981', fontSize: '15px' }}>
                          Current: ${currentRate.toFixed(symbol.includes('USDT') ? 2 : 4)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input 
                          type="number" 
                          placeholder={`Enter new ${symbol} price...`}
                          value={rateInputs[symbol] || ''} 
                          onChange={e => setRateInputs({ ...rateInputs, [symbol]: e.target.value })} 
                          className="mono-font"
                          style={{ flex: 1, padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#fff', fontSize: '13px', outline: 'none' }} 
                        />
                        <button onClick={() => handleOverrideRate(symbol)} className="glow-btn-primary" style={{ padding: '10px 16px', fontSize: '11px' }}>
                          Set Rate
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

const inputStyle = { width: '100%', padding: '12px 14px', background: '#0b0f19', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', color: '#ffffff', fontSize: '13px', boxSizing: 'border-box', outline: 'none' };
