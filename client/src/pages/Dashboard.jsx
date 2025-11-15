import { useEffect, useState, useRef } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Activity, RefreshCw, ChevronDown, ChevronUp, ChevronRight, AlertTriangle, TrendingUp as TrendUp } from 'lucide-react';
import axios from 'axios';
import StockTable from '../components/StockTable';
import TradingViewChart from '../components/TradingViewChart';
import USDebtClock from '../components/USDebtClock';
import BigLieIndexWidget from '../components/BigLieIndexWidget';
import HistoricalDebtChart from '../components/HistoricalDebtChart';
import HistoricalParallels from '../components/HistoricalParallels';
import Top100Companies from '../components/Top100Companies';
import InfoTooltip from '../components/InfoTooltip';
import useStore from '../store/useStore';

export default function Dashboard() {
  const { stockPrices, macroData, bitcoinPrice, riskIndex } = useStore();
  const [sp500, setSp500] = useState(null);
  const [vix, setVix] = useState(null);
  const [dxyData, setDxyData] = useState(null);
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    marketDeepDive: false,
    historicalContext: false,
    companyAnalysis: false,
    debtAnalysis: false
  });
  const hasFetched = useRef(false);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    // Prevent double fetch in React StrictMode
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchMarketData();
    }
    const interval = setInterval(fetchMarketData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchMarketData = async () => {
    try {
      const [sp500Res, vixRes, dxyRes] = await Promise.all([
        axios.get('/api/stocks/sp500'),
        axios.get('/api/stocks/vix'),
        axios.get('/api/macro/dxy/current')
      ]);
      setSp500(sp500Res.data);
      setVix(vixRes.data);
      setDxyData(dxyRes.data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching market data:', error);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchMarketData();
      // Also refresh cached financial data
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const marketCards = [
    {
      title: 'S&P 500',
      value: sp500?.price?.toFixed(2) || '...',
      change: sp500?.changePercent?.toFixed(2) || '0',
      icon: Activity,
      color: sp500?.change >= 0 ? 'success' : 'danger'
    },
    {
      title: 'VIX (Fear Index)',
      value: vix?.price?.toFixed(2) || '...',
      change: vix?.changePercent?.toFixed(2) || '0',
      icon: TrendingUp,
      color: vix?.price > 30 ? 'danger' : vix?.price > 20 ? 'warning' : 'success'
    },
    {
      title: 'Bitcoin',
      value: bitcoinPrice?.price ? `$${bitcoinPrice.price.toLocaleString()}` : '...',
      change: bitcoinPrice?.change24h?.toFixed(2) || '0',
      icon: DollarSign,
      color: bitcoinPrice?.change24h >= 0 ? 'success' : 'danger'
    },
    {
      title: '10Y Treasury',
      value: macroData?.['10Y_TREASURY']?.toFixed(2) + '%' || '...',
      change: '0',
      icon: TrendingDown,
      color: 'primary'
    }
  ];

  // Generate key insights based on current data
  const keyInsights = [
    {
      icon: AlertTriangle,
      severity: 'critical',
      message: 'High debt concentration in Q2 2027 - $350B+ maturing',
      action: 'View Debt Maturity'
    },
    {
      icon: TrendUp,
      severity: vix?.price > 30 ? 'warning' : 'info',
      message: `VIX at ${vix?.price?.toFixed(1) || '...'} - ${vix?.price > 30 ? 'Elevated' : vix?.price > 20 ? 'Moderate' : 'Low'} market fear`,
      action: 'Monitor Volatility'
    },
    {
      icon: Activity,
      severity: 'info',
      message: `${stockPrices.length} tech companies tracked with real-time risk analysis`,
      action: 'View Companies'
    },
    {
      icon: DollarSign,
      severity: dxyData?.value > 110 ? 'warning' : 'info',
      message: `Dollar Index at ${dxyData?.value?.toFixed(2) || '104.25'} - ${dxyData?.value > 110 ? 'Very Strong' : dxyData?.value > 105 ? 'Strong' : 'Moderate'} dollar strength`,
      action: 'View DXY Data'
    }
  ];

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'critical': return 'text-danger';
      case 'warning': return 'text-warning';
      default: return 'text-primary';
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Market Overview</h1>
          <p className="text-textSecondary mt-1 md:mt-2 text-sm md:text-base">
            Real-time analysis of US tech sector and economic indicators
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="text-left sm:text-right">
            <div className="text-xs md:text-sm text-textSecondary">Last updated</div>
            <div className="text-base md:text-lg font-semibold">
              {lastRefresh ? lastRefresh.toLocaleTimeString() : 'Loading...'}
            </div>
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="px-3 md:px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 text-sm md:text-base whitespace-nowrap"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
            <span className="sm:hidden">Refresh</span>
          </button>
        </div>
      </div>

      {/* Market Cards - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {marketCards.map((card, index) => (
          <div key={index} className="bg-surface rounded-lg p-3 md:p-4 border border-border hover:border-primary/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-textSecondary text-xs md:text-sm truncate pr-2">{card.title}</span>
              <card.icon className={`w-4 md:w-5 h-4 md:h-5 text-${card.color} flex-shrink-0`} />
            </div>
            <div className="text-xl md:text-2xl font-bold mb-1 truncate">{card.value}</div>
            <div className={`flex items-center gap-1 text-xs md:text-sm ${
              parseFloat(card.change) >= 0 ? 'text-success' : 'text-danger'
            }`}>
              {parseFloat(card.change) >= 0 ? (
                <TrendingUp className="w-3 md:w-4 h-3 md:h-4" />
              ) : (
                <TrendingDown className="w-3 md:w-4 h-3 md:h-4" />
              )}
              <span>{Math.abs(parseFloat(card.change))}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Dollar Index (DXY) Widget */}
      <div className="bg-gradient-to-r from-green-500/20 via-emerald-500/10 to-green-500/20 rounded-lg p-4 md:p-6 border-2 border-green-500/50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-0">
          <div className="flex items-center gap-4">
            <DollarSign className="w-8 h-8 text-green-400 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                💵 Dollar Index (DXY)
                <InfoTooltip 
                  title="US Dollar Index (DXY)"
                  description="The DXY measures the value of the US dollar against a basket of six major foreign currencies: Euro (57.6%), Japanese Yen (13.6%), British Pound (11.9%), Canadian Dollar (9.1%), Swedish Krona (4.2%), and Swiss Franc (3.6%)."
                  details="📊 Historical Context: • 1973-1985: Ranged 80-165 (peak during Volcker era) • 1985-2008: Generally declined from 165 to 70s • 2008-2017: Rose from 70s to 100+ (post-crisis strength) • 2017-2020: Ranged 88-103 • 2020-2022: Surged to 114+ (pandemic/inflation response) • 2023-Present: Moderating around 100-110 📈 Interpretation: • 80-90: Weak dollar (good for exports, commodities) • 90-100: Moderate strength • 100-110: Strong dollar (pressure on EM, commodities) • 110+: Very strong (potential global stress) 🌍 Global Impact: High DXY creates headwinds for emerging markets, commodities, and US multinationals while supporting Treasury demand."
                />
              </h3>
              <div className="text-3xl font-bold text-green-400">
                {dxyData?.value?.toFixed(2) || '104.25'}
                <span className="text-lg text-textSecondary ml-2">DXY</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center px-8 border-l border-r border-border">
            <div className={`text-2xl font-bold mb-2 ${
              dxyData?.changePercent >= 0 ? 'text-success' : 'text-danger'
            }`}>
              {dxyData?.changePercent >= 0 ? '+' : ''}{dxyData?.changePercent?.toFixed(2) || '+0.14'}%
            </div>
            <div className="text-sm text-textSecondary text-center">
              Daily Change
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-xs text-textSecondary uppercase mb-1">
                Strength
              </div>
              <div className="text-2xl font-bold text-green-400">
                {dxyData?.value > 105 ? 'STRONG' : dxyData?.value > 100 ? 'MOD' : 'WEAK'}
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-textSecondary ml-4" />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
          <div className="flex items-center gap-6 text-textSecondary">
            <span>• US Dollar strength vs major currencies</span>
            <span>• Global market impact indicator</span>
            <span>• Real-time currency risk assessment</span>
          </div>
          <div className="text-xs text-textSecondary">
            Updated: {dxyData?.timestamp ? new Date(dxyData.timestamp).toLocaleTimeString() : 'Loading...'}
          </div>
        </div>
      </div>

      {/* Big Lie Index - Primary Risk Indicator */}
      <BigLieIndexWidget />

      {/* Key Insights */}
      <div className="bg-surface rounded-lg p-6 border border-border">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning" />
          Key Insights
        </h2>
        <div className="space-y-3">
          {keyInsights.map((insight, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-surfaceHover rounded-lg hover:bg-border transition-all">
              <insight.icon className={`w-5 h-5 mt-0.5 ${getSeverityColor(insight.severity)}`} />
              <div className="flex-1">
                <p className="text-sm text-textPrimary">{insight.message}</p>
              </div>
              <button className="text-xs text-primary hover:underline whitespace-nowrap">
                {insight.action} →
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Collapsible Section: Market Deep Dive */}
      <div className="bg-surface rounded-lg border border-border overflow-hidden">
        <button
          onClick={() => toggleSection('marketDeepDive')}
          className="w-full flex items-center justify-between p-6 hover:bg-surfaceHover transition-all"
        >
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-primary" />
            <div className="text-left">
              <h2 className="text-xl font-bold">Market Deep Dive</h2>
              <p className="text-sm text-textSecondary">Price charts and top 10 tech stocks</p>
            </div>
          </div>
          {expandedSections.marketDeepDive ? (
            <ChevronUp className="w-5 h-5 text-textSecondary" />
          ) : (
            <ChevronDown className="w-5 h-5 text-textSecondary" />
          )}
        </button>
        
        {expandedSections.marketDeepDive && (
          <div className="p-6 pt-0 space-y-6 border-t border-border">
            {/* Price Chart */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Price Chart</h3>
                <select
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  className="bg-surfaceHover border border-border rounded-lg px-4 py-2 text-textPrimary text-sm"
                >
                  <option value="AAPL">Apple (AAPL)</option>
                  <option value="MSFT">Microsoft (MSFT)</option>
                  <option value="GOOGL">Alphabet (GOOGL)</option>
                  <option value="AMZN">Amazon (AMZN)</option>
                  <option value="NVDA">NVIDIA (NVDA)</option>
                  <option value="META">Meta (META)</option>
                  <option value="TSLA">Tesla (TSLA)</option>
                  <option value="NFLX">Netflix (NFLX)</option>
                  <option value="ADBE">Adobe (ADBE)</option>
                  <option value="CRM">Salesforce (CRM)</option>
                </select>
              </div>
              <TradingViewChart symbol={selectedSymbol} height={400} />
            </div>

            {/* Top 10 Stocks */}
            <div>
              <h3 className="text-lg font-bold mb-4">Top 10 Tech Stocks</h3>
              <StockTable stocks={stockPrices.slice(0, 10)} />
            </div>
          </div>
        )}
      </div>

      {/* Collapsible Section: Historical Context */}
      <div className="bg-surface rounded-lg border border-border overflow-hidden">
        <button
          onClick={() => toggleSection('historicalContext')}
          className="w-full flex items-center justify-between p-6 hover:bg-surfaceHover transition-all"
        >
          <div className="flex items-center gap-3">
            <TrendUp className="w-6 h-6 text-primary" />
            <div className="text-left">
              <h2 className="text-xl font-bold">Historical Context</h2>
              <p className="text-sm text-textSecondary">US debt trends and crisis parallels since 2000</p>
            </div>
          </div>
          {expandedSections.historicalContext ? (
            <ChevronUp className="w-5 h-5 text-textSecondary" />
          ) : (
            <ChevronDown className="w-5 h-5 text-textSecondary" />
          )}
        </button>
        
        {expandedSections.historicalContext && (
          <div className="p-6 pt-0 space-y-6 border-t border-border">
            <HistoricalDebtChart />
            <HistoricalParallels />
          </div>
        )}
      </div>

      {/* Collapsible Section: Company Analysis */}
      <div className="bg-surface rounded-lg border border-border overflow-hidden">
        <button
          onClick={() => toggleSection('companyAnalysis')}
          className="w-full flex items-center justify-between p-6 hover:bg-surfaceHover transition-all"
        >
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-primary" />
            <div className="text-left">
              <h2 className="text-xl font-bold">Company Analysis</h2>
              <p className="text-sm text-textSecondary">Deep dive into top 100 US companies</p>
            </div>
          </div>
          {expandedSections.companyAnalysis ? (
            <ChevronUp className="w-5 h-5 text-textSecondary" />
          ) : (
            <ChevronDown className="w-5 h-5 text-textSecondary" />
          )}
        </button>
        
        {expandedSections.companyAnalysis && (
          <div className="p-6 pt-0 border-t border-border">
            <Top100Companies />
          </div>
        )}
      </div>

      {/* Collapsible Section: US Debt Analysis */}
      <div className="bg-surface rounded-lg border border-border overflow-hidden">
        <button
          onClick={() => toggleSection('debtAnalysis')}
          className="w-full flex items-center justify-between p-6 hover:bg-surfaceHover transition-all"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-primary" />
            <div className="text-left">
              <h2 className="text-xl font-bold">US Debt Analysis</h2>
              <p className="text-sm text-textSecondary">National debt clock and trends</p>
            </div>
          </div>
          {expandedSections.debtAnalysis ? (
            <ChevronUp className="w-5 h-5 text-textSecondary" />
          ) : (
            <ChevronDown className="w-5 h-5 text-textSecondary" />
          )}
        </button>
        
        {expandedSections.debtAnalysis && (
          <div className="p-6 pt-0 border-t border-border">
            <USDebtClock />
          </div>
        )}
      </div>
    </div>
  );
}
