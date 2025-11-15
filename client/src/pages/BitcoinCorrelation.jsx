import { useEffect, useState, useRef } from 'react';
import { Bitcoin, TrendingUp, ArrowRightLeft, DollarSign, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function BitcoinCorrelation() {
  const [btcPrice, setBtcPrice] = useState(null);
  const [correlations, setCorrelations] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [onChain, setOnChain] = useState(null);
  const [decoupling, setDecoupling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Prevent double fetch in React StrictMode
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchBitcoinData();
    }
  }, []);

  const fetchBitcoinData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const results = await Promise.allSettled([
        axios.get('/api/bitcoin/price'),
        axios.get('/api/bitcoin/correlations?days=90'),
        axios.get('/api/bitcoin/corporate-holdings'),
        axios.get('/api/bitcoin/onchain'),
        axios.get('/api/risk/decoupling')
      ]);
      
      // Handle price (critical)
      if (results[0].status === 'fulfilled') {
        setBtcPrice(results[0].value.data);
      } else {
        throw new Error('Failed to load Bitcoin price');
      }
      
      // Handle correlations (show empty if failed)
      if (results[1].status === 'fulfilled') {
        setCorrelations(results[1].value.data);
      } else {
        console.warn('Correlations failed:', results[1].reason);
        setCorrelations([]);
      }
      
      // Handle holdings (show empty if failed)
      if (results[2].status === 'fulfilled') {
        setHoldings(results[2].value.data);
      } else {
        console.warn('Holdings failed:', results[2].reason);
        setHoldings([]);
      }
      
      // Handle on-chain (show null if failed)
      if (results[3].status === 'fulfilled') {
        setOnChain(results[3].value.data);
      } else {
        console.warn('On-chain metrics failed:', results[3].reason);
        setOnChain(null);
      }
      
      // Handle decoupling (show null if failed)
      if (results[4].status === 'fulfilled') {
        setDecoupling(results[4].value.data);
      } else {
        console.warn('Decoupling failed:', results[4].reason);
        setDecoupling(null);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching Bitcoin data:', error);
      setError(`Failed to load Bitcoin data: ${error.response?.data?.error || error.message}`);
      setLoading(false);
    }
  };

  const avgCorrelation = correlations.length > 0
    ? (correlations.reduce((sum, c) => sum + c.correlation, 0) / correlations.length).toFixed(3)
    : '0';

  const isDecoupled = parseFloat(avgCorrelation) < 0.3;

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-4xl font-bold">Bitcoin Correlation Analysis</h1>
          <p className="text-textSecondary mt-2">
            Track Bitcoin's relationship with tech stocks and capital flows
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <span className="ml-4 text-lg">Loading Bitcoin data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-4xl font-bold">Bitcoin Correlation Analysis</h1>
          <p className="text-textSecondary mt-2">
            Track Bitcoin's relationship with tech stocks and capital flows
          </p>
        </div>
        <div className="bg-danger/10 border border-danger rounded-lg p-6">
          <div className="flex items-center mb-4">
            <AlertCircle className="w-6 h-6 text-danger mr-3" />
            <h2 className="text-xl font-semibold text-danger">Unable to Load Data</h2>
          </div>
          <p className="text-textSecondary mb-4">{error}</p>
          <button 
            onClick={fetchBitcoinData}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/80 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Bitcoin Correlation Analysis</h1>
          <p className="text-textSecondary mt-2">
            Track Bitcoin's relationship with tech stocks and capital flows
          </p>
        </div>
        <button 
          onClick={fetchBitcoinData}
          className="bg-surface border border-border px-4 py-2 rounded-lg hover:bg-surface/80 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-surface rounded-lg p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <span className="text-textSecondary">Bitcoin Price</span>
            <Bitcoin className="w-5 h-5 text-warning" />
          </div>
          <div className="text-3xl font-bold">
            ${btcPrice?.price?.toLocaleString() || '...'}
          </div>
          <div className={`flex items-center gap-1 text-sm mt-2 ${
            btcPrice?.change24h >= 0 ? 'text-success' : 'text-danger'
          }`}>
            <TrendingUp className="w-4 h-4" />
            <span>{btcPrice?.change24h?.toFixed(2) || '0'}%</span>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <span className="text-textSecondary">Avg Correlation</span>
            <ArrowRightLeft className="w-5 h-5 text-primary" />
          </div>
          <div className="text-3xl font-bold">{avgCorrelation}</div>
          <div className={`text-sm mt-2 ${isDecoupled ? 'text-success' : 'text-warning'}`}>
            {isDecoupled ? '✓ Decoupled from tech' : '⚠ Moving with tech'}
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <span className="text-textSecondary">Decoupling Score</span>
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
          <div className="text-3xl font-bold">{decoupling?.score || '...'}</div>
          <div className="text-sm text-textSecondary mt-2">
            {decoupling?.interpretation || 'Loading...'}
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <span className="text-textSecondary">Net Exchange Flow</span>
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <div className={`text-3xl font-bold ${
            onChain?.netFlow > 0 ? 'text-success' : 'text-danger'
          }`}>
            {onChain?.netFlow > 0 ? '+' : ''}{onChain?.netFlow?.toFixed(0) || '...'} BTC
          </div>
          <div className="text-sm text-textSecondary mt-2">
            {onChain?.netFlow > 0 ? 'Outflow (Bullish)' : 'Inflow (Selling)'}
          </div>
        </div>
      </div>

      {/* Correlation Table */}
      <div className="bg-surface rounded-lg p-6 border border-border">
        <h2 className="text-2xl font-bold mb-4">BTC vs Tech Stocks Correlation</h2>
        <p className="text-textSecondary mb-6">
          90-day rolling correlation • Values closer to -1 indicate inverse movement (safe haven)
        </p>
        
        {correlations.length === 0 ? (
          <div className="bg-warning/10 border border-warning rounded-lg p-6 text-center">
            <AlertCircle className="w-8 h-8 text-warning mx-auto mb-3" />
            <p className="text-textSecondary">
              Correlation data is unavailable. This feature requires database access.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-textSecondary font-medium">Company</th>
                  <th className="text-right py-3 px-4 text-textSecondary font-medium">Symbol</th>
                  <th className="text-right py-3 px-4 text-textSecondary font-medium">Correlation</th>
                  <th className="text-right py-3 px-4 text-textSecondary font-medium">Relationship</th>
                </tr>
              </thead>
              <tbody>
                {correlations.map((corr) => (
                <tr key={corr.company.id} className="border-b border-border hover:bg-surfaceHover transition-colors">
                  <td className="py-4 px-4">{corr.company.name}</td>
                  <td className="text-right py-4 px-4 font-semibold">{corr.company.symbol}</td>
                  <td className="text-right py-4 px-4">
                    <span className={
                      corr.correlation < -0.3 ? 'text-success' :
                      corr.correlation > 0.5 ? 'text-danger' :
                      'text-warning'
                    }>
                      {corr.correlation.toFixed(3)}
                    </span>
                  </td>
                  <td className="text-right py-4 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      corr.correlation < -0.3 ? 'bg-success/20 text-success' :
                      corr.correlation < 0.1 ? 'bg-primary/20 text-primary' :
                      corr.correlation < 0.5 ? 'bg-warning/20 text-warning' :
                      'bg-danger/20 text-danger'
                    }`}>
                      {corr.correlation < -0.3 ? 'Inverse' :
                       corr.correlation < 0.1 ? 'Neutral' :
                       corr.correlation < 0.5 ? 'Weak Positive' :
                       'Strong Positive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Corporate Holdings */}
      <div className="bg-surface rounded-lg p-6 border border-border">
        <h2 className="text-2xl font-bold mb-4">Corporate Bitcoin Holdings</h2>
        <p className="text-textSecondary mb-6">
          Tech companies with significant BTC exposure and liquidation risk
        </p>
        
        {holdings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-textSecondary font-medium">Company</th>
                  <th className="text-right py-3 px-4 text-textSecondary font-medium">BTC Amount</th>
                  <th className="text-right py-3 px-4 text-textSecondary font-medium">Avg Price</th>
                  <th className="text-right py-3 px-4 text-textSecondary font-medium">Current Value</th>
                  <th className="text-right py-3 px-4 text-textSecondary font-medium">Unrealized P/L</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding) => (
                  <tr key={holding.id} className="border-b border-border hover:bg-surfaceHover transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-semibold">{holding.name}</div>
                      <div className="text-sm text-textSecondary">{holding.symbol}</div>
                    </td>
                    <td className="text-right py-4 px-4 font-semibold">
                      {holding.btcAmount.toLocaleString()} BTC
                    </td>
                    <td className="text-right py-4 px-4">
                      ${holding.avgPurchasePrice.toLocaleString()}
                    </td>
                    <td className="text-right py-4 px-4">
                      ${(holding.currentValue / 1e6).toFixed(1)}M
                    </td>
                    <td className="text-right py-4 px-4">
                      <span className={holding.unrealizedPnLPercent >= 0 ? 'text-success' : 'text-danger'}>
                        {holding.unrealizedPnLPercent >= 0 ? '+' : ''}
                        {holding.unrealizedPnLPercent.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-textSecondary">
            No corporate Bitcoin holdings found in tracked companies
          </div>
        )}
      </div>

      {/* On-Chain Metrics */}
      <div className="bg-surface rounded-lg p-6 border border-border">
        <h2 className="text-2xl font-bold mb-4">On-Chain Metrics</h2>
        
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-textSecondary mb-2">Exchange Inflow (24h)</div>
            <div className="text-2xl font-bold text-danger">
              {onChain?.exchangeInflow?.toLocaleString() || '...'} BTC
            </div>
          </div>

          <div>
            <div className="text-textSecondary mb-2">Exchange Outflow (24h)</div>
            <div className="text-2xl font-bold text-success">
              {onChain?.exchangeOutflow?.toLocaleString() || '...'} BTC
            </div>
          </div>

          <div>
            <div className="text-textSecondary mb-2">Whale Accumulation</div>
            <div className="text-2xl font-bold">
              {onChain?.whaleAccumulation?.toLocaleString() || '...'} BTC
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
