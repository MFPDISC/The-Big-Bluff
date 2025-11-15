import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { AlertTriangle, TrendingUp, TrendingDown, Activity, DollarSign, BarChart3 } from 'lucide-react';
import InfoTooltip from '../components/InfoTooltip';

// Tooltip content for each component
const componentTooltips = {
  valuation: {
    title: 'Valuation Component',
    description: 'Measures if stock prices are too high relative to fundamentals.',
    details: 'Combines CAPE Ratio and Buffett Indicator. Higher scores mean markets are more overvalued.'
  },
  leverage: {
    title: 'Leverage Component',
    description: 'Measures debt levels and credit risk in the financial system.',
    details: 'Based on High Yield Bond Spreads. Lower spreads = higher complacency = higher risk score.'
  },
  sentiment: {
    title: 'Sentiment Component',
    description: 'Measures investor fear and complacency.',
    details: 'Based on VIX (volatility index). Low VIX = complacency = higher risk. High fear = safer.'
  },
  momentum: {
    title: 'Momentum Component',
    description: 'Measures rate of price change and acceleration.',
    details: 'Tracks 3mo, 6mo, 1yr returns. Parabolic moves (>50% in months) indicate mania.'
  },
  systemic: {
    title: 'Systemic Risk Component',
    description: 'Measures interconnected financial system risks.',
    details: 'Includes yield curve inversion, asset correlations, and liquidity metrics.'
  }
};

export default function BubbleWatch() {
  const [riskIndex, setRiskIndex] = useState(null);
  const [indicators, setIndicators] = useState(null);
  const [historicalComparisons, setHistoricalComparisons] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Prevent double fetch in React StrictMode
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchBubbleData();
    }
  }, []);

  const fetchBubbleData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [riskRes, indicatorsRes, historicalRes] = await Promise.all([
        axios.get('/api/bubble/risk-index'),
        axios.get('/api/bubble/indicators'),
        axios.get('/api/bubble/historical-comparisons')
      ]);
      
      setRiskIndex(riskRes.data);
      setIndicators(indicatorsRes.data);
      setHistoricalComparisons(historicalRes.data);
    } catch (error) {
      console.error('Error fetching bubble data:', error);
      setError(`Failed to load bubble data: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score) => {
    if (score <= 30) return 'text-success';
    if (score <= 60) return 'text-warning';
    if (score <= 80) return 'text-orange-500';
    return 'text-danger';
  };

  const getRiskBgColor = (score) => {
    if (score <= 30) return 'bg-success/20 border-success';
    if (score <= 60) return 'bg-warning/20 border-warning';
    if (score <= 80) return 'bg-orange-500/20 border-orange-500';
    return 'bg-danger/20 border-danger';
  };

  const getIndicatorColor = (indicator) => {
    if (indicator.critical) return 'text-danger';
    if (indicator.warning) return 'text-warning';
    return 'text-success';
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">🔴 Bubble Watch</h1>
          <p className="text-textSecondary">
            Real-time market bubble risk assessment using multiple indicators
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <span className="ml-4 text-lg">Loading bubble indicators...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">🔴 Bubble Watch</h1>
          <p className="text-textSecondary">
            Real-time market bubble risk assessment using multiple indicators
          </p>
        </div>
        <div className="bg-danger/10 border border-danger rounded-lg p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-6 h-6 text-danger mr-3" />
            <h2 className="text-xl font-semibold text-danger">Unable to Load Data</h2>
          </div>
          <p className="text-textSecondary mb-4">{error}</p>
          <button 
            onClick={fetchBubbleData}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/80 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!riskIndex || !indicators || !historicalComparisons) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">🔴 Bubble Watch</h1>
          <p className="text-textSecondary">
            Real-time market bubble risk assessment using multiple indicators
          </p>
        </div>
        <div className="bg-warning/10 border border-warning rounded-lg p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-6 h-6 text-warning mr-3" />
            <h2 className="text-xl font-semibold text-warning">No Data Available</h2>
          </div>
          <p className="text-textSecondary mb-4">The bubble indicators data is not available at this time.</p>
          <button 
            onClick={fetchBubbleData}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/80 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">🔴 Bubble Watch</h1>
          <p className="text-textSecondary">
            Real-time market bubble risk assessment using multiple indicators
          </p>
        </div>
        <button
          onClick={fetchBubbleData}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {/* Composite Risk Score - Big Dial */}
      <div className={`rounded-lg p-8 border-2 ${getRiskBgColor(riskIndex?.compositeScore)}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Activity className="w-6 h-6" />
              Composite Bubble Risk Index
              <InfoTooltip 
                title="Composite Bubble Risk Index"
                description="Overall market bubble risk score from 0-100, combining 5 weighted indicators."
                details="0-30: Safe | 31-60: Caution | 61-80: Warning | 81-100: Bubble Territory. Each component contributes 20% to the final score."
              />
            </h2>
            <p className="text-textSecondary mb-6">
              Combines valuation, leverage, sentiment, momentum, and systemic risk indicators
            </p>
            
            {/* Risk Score Dial */}
            <div className="flex items-center gap-8">
              <div className="relative">
                <svg className="w-48 h-48 transform -rotate-90">
                  {/* Background circle */}
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="currentColor"
                    strokeWidth="16"
                    fill="none"
                    className="text-border"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="currentColor"
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 80}`}
                    strokeDashoffset={`${2 * Math.PI * 80 * (1 - riskIndex?.compositeScore / 100)}`}
                    className={getRiskColor(riskIndex?.compositeScore)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <div className={`text-5xl font-bold ${getRiskColor(riskIndex?.compositeScore)}`}>
                    {riskIndex?.compositeScore}
                  </div>
                  <div className="text-sm text-textSecondary">/ 100</div>
                </div>
              </div>

              <div className="flex-1">
                <div className="text-3xl font-bold mb-2">{riskIndex?.riskLevel}</div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-success" />
                    <span>0-30: Safe</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-warning" />
                    <span>31-60: Caution</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span>61-80: Warning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-danger" />
                    <span>81-100: Bubble Territory</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Component Scores */}
      <div className="grid grid-cols-5 gap-4">
        {riskIndex?.components && Object.entries(riskIndex.components).map(([key, component]) => (
          <div key={key} className="bg-surface rounded-lg p-4 border border-border">
            <div className="text-xs text-textSecondary uppercase mb-2 flex items-center">
              {key}
              {componentTooltips[key] && (
                <InfoTooltip 
                  title={componentTooltips[key].title}
                  description={componentTooltips[key].description}
                  details={componentTooltips[key].details}
                />
              )}
            </div>
            <div className={`text-3xl font-bold mb-2 ${getRiskColor(component.score)}`}>
              {component.score}
            </div>
            <div className="text-xs text-textSecondary">{component.weight}% weight</div>
            <div className="mt-3 space-y-1">
              {component.indicators?.map((ind, idx) => (
                <div key={idx} className="text-xs text-textSecondary">• {ind}</div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Individual Indicators */}
      <div className="grid grid-cols-3 gap-6">
        {/* CAPE Ratio */}
        <div className={`bg-surface rounded-lg p-6 border-2 ${
          indicators?.cape.critical ? 'border-danger' : 
          indicators?.cape.warning ? 'border-warning' : 'border-success'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <h3 className="text-lg font-bold">Shiller P/E (CAPE)</h3>
              <InfoTooltip 
                title="Shiller P/E (CAPE) Ratio"
                description="Cyclically Adjusted Price-to-Earnings ratio. Compares stock prices to average earnings over the past 10 years, adjusted for inflation."
                details="Created by Nobel Prize winner Robert Shiller. Values above 30 have historically preceded major market corrections. The 2000 dot-com bubble peaked at 44."
              />
            </div>
            <BarChart3 className={`w-6 h-6 ${getIndicatorColor(indicators?.cape)}`} />
          </div>
          <div className={`text-4xl font-bold mb-2 ${getIndicatorColor(indicators?.cape)}`}>
            {indicators?.cape.value.toFixed(2)}
          </div>
          <div className="text-sm text-textSecondary mb-4">
            {indicators?.cape.interpretation}
          </div>
          <div className="text-xs text-textSecondary space-y-1">
            <div>• &lt;20: Undervalued</div>
            <div>• 20-30: Fair Value</div>
            <div>• 30-35: Overvalued</div>
            <div>• &gt;35: Extremely Overvalued</div>
          </div>
        </div>

        {/* Buffett Indicator */}
        <div className={`bg-surface rounded-lg p-6 border-2 ${
          indicators?.buffettIndicator.critical ? 'border-danger' : 
          indicators?.buffettIndicator.warning ? 'border-warning' : 'border-success'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <h3 className="text-lg font-bold">Buffett Indicator</h3>
              <InfoTooltip 
                title="Buffett Indicator"
                description="Total stock market capitalization divided by GDP. Shows if stocks are overvalued relative to economic output."
                details="Warren Buffett's favorite metric. Above 200% = extremely overvalued. The 2021 COVID bubble peaked at 215%."
              />
            </div>
            <DollarSign className={`w-6 h-6 ${getIndicatorColor(indicators?.buffettIndicator)}`} />
          </div>
          <div className={`text-4xl font-bold mb-2 ${getIndicatorColor(indicators?.buffettIndicator)}`}>
            {indicators?.buffettIndicator.value.toFixed(1)}%
          </div>
          <div className="text-sm text-textSecondary mb-4">
            Market Cap / GDP
          </div>
          <div className="text-xs text-textSecondary space-y-1">
            <div>• &lt;100%: Undervalued</div>
            <div>• 100-150%: Fair Value</div>
            <div>• 150-200%: Overvalued</div>
            <div>• &gt;200%: Extremely Overvalued</div>
          </div>
        </div>

        {/* High Yield Spread */}
        <div className={`bg-surface rounded-lg p-6 border-2 ${
          indicators?.hySpread.critical ? 'border-danger' : 
          indicators?.hySpread.warning ? 'border-warning' : 'border-success'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <h3 className="text-lg font-bold">HY Bond Spread</h3>
              <InfoTooltip 
                title="High Yield Bond Spread"
                description="Difference between risky 'junk bond' yields and safe Treasury yields. Shows how much extra return investors demand for taking risk."
                details="LOWER spread = MORE risk! When spreads narrow below 3%, it means investors are ignoring risk and becoming complacent - a classic bubble sign."
              />
            </div>
            <Activity className={`w-6 h-6 ${getIndicatorColor(indicators?.hySpread)}`} />
          </div>
          <div className={`text-4xl font-bold mb-2 ${getIndicatorColor(indicators?.hySpread)}`}>
            {indicators?.hySpread.value.toFixed(2)}%
          </div>
          <div className="text-sm text-textSecondary mb-4">
            {indicators?.hySpread.interpretation}
          </div>
          <div className="text-xs text-textSecondary space-y-1">
            <div>• &lt;3%: Extreme Complacency</div>
            <div>• 3-4%: Low Risk Premium</div>
            <div>• 4-6%: Normal</div>
            <div>• &gt;6%: High Risk</div>
          </div>
        </div>
      </div>

      {/* Historical Comparisons */}
      <div className="bg-surface rounded-lg p-6 border border-border">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-warning" />
          Historical Bubble Comparisons
        </h2>
        
        <div className="grid grid-cols-4 gap-6">
          {historicalComparisons && Object.entries(historicalComparisons).map(([key, data]) => (
            <div key={key} className={`p-4 rounded-lg ${
              key === 'current' ? 'bg-primary/20 border-2 border-primary' : 'bg-background'
            }`}>
              <div className="font-bold mb-2">
                {key === 'dotComBubble2000' && '💥 Dot-Com Bubble'}
                {key === 'financialCrisis2008' && '🏚️ Financial Crisis'}
                {key === 'covidBubble2021' && '💉 COVID Bubble'}
                {key === 'current' && '📊 Current Market'}
              </div>
              <div className="text-xs text-textSecondary mb-3">{data.description}</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-textSecondary">CAPE:</span>
                  <span className="font-bold">{data.cape}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-textSecondary">Buffett:</span>
                  <span className="font-bold">{data.buffettIndicator}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Warning Message */}
      {riskIndex?.compositeScore > 60 && (
        <div className="bg-warning/20 border-2 border-warning rounded-lg p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-warning flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold mb-2">⚠️ Elevated Bubble Risk Detected</h3>
              <p className="text-textSecondary">
                Multiple indicators suggest the market may be overvalued. Consider:
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>• Reducing exposure to high-valuation assets</li>
                <li>• Increasing cash positions</li>
                <li>• Diversifying into defensive sectors</li>
                <li>• Reviewing stop-loss levels</li>
                <li>• Monitoring debt levels closely</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
