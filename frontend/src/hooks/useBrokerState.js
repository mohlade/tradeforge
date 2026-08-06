import { useState, useEffect } from 'react';
import { API_BASE } from '../config';

export function useBrokerState() {
  // Navigation Router & Session states
  const [currentPage, setCurrentPage] = useState('KYC_GATE'); // KYC_GATE, PROP_EVAL, TERMINAL
  const [activeUser, setActiveUser] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  
  // High-Leverage USDT Core Financial Database States
  const [walletBalance, setWalletBalance] = useState(100000.00);
  const [totalDeposited, setTotalDeposited] = useState(100000.00);
  const [activePositions, setActivePositions] = useState([]);
  
  // Real-Time Live Ticker Feed States
  const [marketRates, setMarketRates] = useState({
    BTCUSDT: 64250.00, ETHUSDT: 3450.00, EURUSDT: 1.0852, GBPUSDT: 1.2740
  });

  // Background High-Speed Market Tick Price Engine Loop (Ticks every 1 second)
  useEffect(() => {
    const tickInterval = setInterval(() => {
      setMarketRates(prev => {
        const nextRates = { ...prev };
        Object.keys(nextRates).forEach(symbol => {
          const shift = (Math.random() * 0.08) - 0.038;
          nextRates[symbol] = nextRates[symbol] * (1 + shift / 100);
        });
        return nextRates;
      });
    }, 1000);
    return () => clearInterval(tickInterval);
  }, []);

  // Compute Core Trading Desk Values Dynamically
  const marginInUse = activePositions.reduce((sum, pos) => sum + (pos.lots * 1000), 0);
  
  const unrealizedPnL = activePositions.reduce((sum, pos) => {
    const spot = marketRates[pos.pair] || pos.entry;
    const diff = pos.dir === 'LONG' ? (spot - pos.entry) : (pos.entry - spot);
    const scale = pos.pair.includes('EUR') || pos.pair.includes('GBP') ? 15000 : 0.85;
    return sum + (diff * scale * pos.lots);
  }, 0);

  const netEquity = walletBalance + unrealizedPnL;

  // Trading Actions Engine Rules
  const executeMarketOrder = (pair, dir, lots) => {
    const costRequirement = lots * 1000;
    if (walletBalance < costRequirement) {
      alert("⚠️ Margin Call: Insufficient free capital reserves to clear position lot allocations.");
      return false;
    }
    setWalletBalance(prev => prev - costRequirement);
    setActivePositions(prev => [
      ...prev,
      { pair, dir, lots, entry: marketRates[pair], id: Date.now(), accumulatedPnL: 0.00 }
    ]);
    return true;
  };

  const liquidateContract = (id) => {
    const target = activePositions.find(p => p.id === id);
    if (!target) return;

    const spot = marketRates[target.pair] || target.entry;
    const diff = target.dir === 'LONG' ? (spot - target.entry) : (target.entry - spot);
    const scale = target.pair.includes('EUR') || target.pair.includes('GBP') ? 15000 : 0.85;
    const finalPnL = diff * scale * target.lots;

    setWalletBalance(wallet => wallet + (target.lots * 1000) + finalPnL);
    setActivePositions(prev => prev.filter(p => p.id !== id));

    if (activeUser && sessionToken) {
      fetch(`${API_BASE}/api/trades/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          pair: target.pair,
          direction: target.dir,
          lots: target.lots,
          entry_price: target.entry,
          exit_price: spot,
          pnl: finalPnL
        })
      }).catch(err => console.error('Failed to record closed trade:', err));
    }
  };

  const processVaultDeposit = (amount) => {
    setWalletBalance(prev => prev + amount);
    setTotalDeposited(prev => prev + amount);
  };

  const processVaultWithdraw = (amount) => {
    if (walletBalance < amount) {
      alert("⚠️ Operation Denied: Transaction volume exceeds net free equity holdings.");
      return;
    }
    setWalletBalance(prev => prev - amount);
    setTotalDeposited(prev => prev - amount);
  };

  // ADMIN ACTION HANDLERS
  const hydrateWalletBalance = (balance) => {
    setWalletBalance(balance);
    setTotalDeposited(balance);
  };

  const setSession = (email, token) => {
    setActiveUser(email);
    setSessionToken(token);
  };

  const updateUserBalanceByAdmin = (newBalance) => {
    setWalletBalance(newBalance);
    setTotalDeposited(newBalance);
  };

  const overrideMarketRateByAdmin = (symbol, newRate) => {
    setMarketRates(prev => ({
      ...prev,
      [symbol]: newRate
    }));
  };

  const resetBrokerSession = () => {
    setActiveUser(null);
    setSessionToken(null);
    setWalletBalance(100000.00);
    setTotalDeposited(100000.00);
    setActivePositions([]);
    setCurrentPage('KYC_GATE');
  };

  const isAuthenticated = Boolean(activeUser && sessionToken);

  return {
    currentPage, setCurrentPage, activeUser, setActiveUser, sessionToken, setSession,
    isAuthenticated, walletBalance, netEquity, 
    marginInUse, unrealizedPnL, totalDeposited, marketRates, activePositions, 
    executeMarketOrder, liquidateContract, processVaultDeposit, processVaultWithdraw, 
    updateUserBalanceByAdmin, hydrateWalletBalance, overrideMarketRateByAdmin, resetBrokerSession
  };
}
