import { useEffect, useState, useRef } from 'react';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';

export default function MacroIndicators() {
  const [macroData, setMacroData] = useState(null);
  const [yieldCurve, setYieldCurve] = useState(null);
  const [gdpHistory, setGdpHistory] = useState([]);
  const [rateHistory, setRateHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Prevent double fetch in React StrictMode during development
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchMacroData();
    }
  }, []);

  const fetchMacroData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [macro, yieldCurveRes, gdp, rates] = await Promise.all([
        axios.get('/api/macro'),
        axios.get('/api/macro/yield-curve'),
        axios.get('/api/macro/history/gdp?years=5'),
        axios.get('/api/macro/history/rates?days=365')
      ]);
      
      setMacroData(macro.data);
      setYieldCurve(yieldCurveRes.data);
      setGdpHistory(gdp.data);
      setRateHistory(rates.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching macro data:', error);
      setError(`Failed to load macro indicators: ${error.response?.data?.error || error.message}`);
      setLoading(false);
    }
  };

  const yieldCurveData = yieldCurve ? [
    { maturity: '2Y', rate: yieldCurve['2Y'] },
    { maturity: '5Y', rate: yieldCurve['5Y'] },
    { maturity: '10Y', rate: yieldCurve['10Y'] },
    { maturity: '30Y', rate: yieldCurve['30Y'] }
  ] : [];

  // Loading state
  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-4xl font-bold">Macro Economic Indicators</h1>
          <p className="text-textSecondary mt-2">
            Federal Reserve data, interest rates, GDP, and economic health metrics
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <span className="ml-4 text-lg">Loading macro indicators...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-4xl font-bold">Macro Economic Indicators</h1>
          <p className="text-textSecondary mt-2">
            Federal Reserve data, interest rates, GDP, and economic health metrics
          </p>
        </div>
        <div className="bg-danger/10 border border-danger rounded-lg p-6">
          <div className="flex items-center mb-4">
            <AlertCircle className="w-6 h-6 text-danger mr-3" />
            <h2 className="text-xl font-semibold text-danger">Unable to Load Data</h2>
          </div>
          <p className="text-textSecondary mb-4">{error}</p>
          <button 
            onClick={fetchMacroData}
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
          <h1 className="text-4xl font-bold">Macro Economic Indicators</h1>
          <p className="text-textSecondary mt-2">
            Federal Reserve data, interest rates, GDP, and economic health metrics
          </p>
        </div>
        <button 
          onClick={fetchMacroData}
          className="bg-surface border border-border px-4 py-2 rounded-lg hover:bg-surface/80 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Key Indicators */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-surface rounded-lg p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <span className="text-textSecondary">Fed Funds Rate</span>
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <div className="text-3xl font-bold">
            {macroData?.FED_FUNDS_RATE?.toFixed(2) || '...'}%
          </div>
          <div className="text-sm text-textSecondary mt-2">
            Target rate by Federal Reserve
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <span className="text-textSecondary">10Y Treasury</span>
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
          <div className="text-3xl font-bold">
            {macroData?.['10Y_TREASURY']?.toFixed(2) || '...'}%
          </div>
          <div className="text-sm text-textSecondary mt-2">
            Benchmark long-term rate
          </div>
        </div>

        <div className={`bg-surface rounded-lg p-6 border ${
          yieldCurve?.isInverted ? 'border-danger' : 'border-border'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-textSecondary">Yield Curve</span>
            {yieldCurve?.isInverted ? (
              <AlertCircle className="w-5 h-5 text-danger" />
            ) : (
              <TrendingUp className="w-5 h-5 text-success" />
            )}
          </div>
          <div className={`text-3xl font-bold ${
            yieldCurve?.isInverted ? 'text-danger' : 'text-success'
          }`}>
            {yieldCurve?.spread?.toFixed(2) || '...'}%
          </div>
          <div className={`text-sm mt-2 ${
            yieldCurve?.isInverted ? 'text-danger' : 'text-textSecondary'
          }`}>
            {yieldCurve?.isInverted ? '⚠️ INVERTED - Recession signal' : 'Normal slope'}
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <span className="text-textSecondary">GDP</span>
            <TrendingDown className="w-5 h-5 text-primary" />
          </div>
          <div className="text-3xl font-bold">
            ${macroData?.GDP?.toLocaleString() || '...'}B
          </div>
          <div className="text-sm text-textSecondary mt-2">
            US Gross Domestic Product
          </div>
        </div>
      </div>

      {/* Yield Curve Chart */}
      <div className="bg-surface rounded-lg p-6 border border-border">
        <h2 className="text-2xl font-bold mb-4">Treasury Yield Curve</h2>
        <p className="text-textSecondary mb-6">
          {yieldCurve?.isInverted ? (
            <span className="text-danger">⚠️ Inverted yield curve detected - historically precedes recessions</span>
          ) : (
            'Normal yield curve - longer maturity bonds have higher yields'
          )}
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={yieldCurveData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="maturity" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" label={{ value: 'Yield (%)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#131318', border: '1px solid #1e293b', borderRadius: '8px' }}
              labelStyle={{ color: '#f8fafc' }}
            />
            <Line 
              type="monotone" 
              dataKey="rate" 
              stroke={yieldCurve?.isInverted ? '#ef4444' : '#3b82f6'} 
              strokeWidth={3}
              dot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* GDP History */}
      <div className="bg-surface rounded-lg p-6 border border-border">
        <h2 className="text-2xl font-bold mb-4">GDP Growth (5 Years)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={gdpHistory}>
            <defs>
              <linearGradient id="gdpGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" label={{ value: 'GDP (Billions)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#131318', border: '1px solid #1e293b', borderRadius: '8px' }}
              labelStyle={{ color: '#f8fafc' }}
            />
            <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#gdpGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Interest Rate History */}
      <div className="bg-surface rounded-lg p-6 border border-border">
        <h2 className="text-2xl font-bold mb-4">Federal Funds Rate (1 Year)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={rateHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" label={{ value: 'Rate (%)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#131318', border: '1px solid #1e293b', borderRadius: '8px' }}
              labelStyle={{ color: '#f8fafc' }}
            />
            <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-surface rounded-lg p-6 border border-border">
          <div className="text-textSecondary mb-2">Unemployment Rate</div>
          <div className="text-2xl font-bold">{macroData?.UNEMPLOYMENT_RATE?.toFixed(1) || '...'}%</div>
        </div>

        <div className="bg-surface rounded-lg p-6 border border-border">
          <div className="text-textSecondary mb-2">M2 Money Supply</div>
          <div className="text-2xl font-bold">${macroData?.M2_MONEY_SUPPLY?.toLocaleString() || '...'}B</div>
        </div>

        <div className="bg-surface rounded-lg p-6 border border-border">
          <div className="text-textSecondary mb-2">Corporate Bond Spread</div>
          <div className="text-2xl font-bold">{macroData?.CORPORATE_BOND_SPREAD?.toFixed(2) || '...'}%</div>
        </div>
      </div>
    </div>
  );
}
