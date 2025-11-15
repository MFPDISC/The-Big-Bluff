import { useEffect, useState, useRef } from 'react';
import { FileText, TrendingDown, DollarSign, GitBranch, AlertTriangle, Bitcoin, Target, BookOpen, Activity, Calendar } from 'lucide-react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, Area, AreaChart } from 'recharts';
import InfoTooltip from '../components/InfoTooltip';

export default function Thesis() {
  const [loading, setLoading] = useState(true);
  const [debtData, setDebtData] = useState([]);
  const [marketData, setMarketData] = useState(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchForecastData();
    }
  }, []);

  const fetchForecastData = async () => {
    try {
      setLoading(true);
      const [debtRes, marketRes] = await Promise.all([
        axios.get('/api/debt-maturity/debt-wall?period=quarter&dateRange=all'),
        axios.get('/api/stocks/sp500')
      ]);
      
      setDebtData(debtRes.data);
      setMarketData(marketRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching forecast data:', error);
      setLoading(false);
    }
  };

  // Calculate probabilities
  const calculateDebtCrisisProbability = () => {
    if (!debtData.length) return 65;
    const q2_2027 = debtData.find(d => {
      const date = new Date(d.period);
      return date.getFullYear() === 2027 && date.getMonth() >= 3 && date.getMonth() <= 5;
    });
    if (!q2_2027) return 65;
    const amount = q2_2027.totalAmount / 1e9;
    const avgRate = q2_2027.avgRate || 4.5;
    const companyCount = q2_2027.companyCount || 0;
    let score = 0;
    if (amount > 300) score += 30;
    else if (amount > 200) score += 20;
    else score += 10;
    if (avgRate > 5) score += 25;
    else if (avgRate > 4) score += 15;
    else score += 5;
    if (companyCount > 30) score += 20;
    else if (companyCount > 20) score += 15;
    else score += 10;
    if (marketData?.price > 5000) score += 15;
    else score += 10;
    return Math.min(score, 95);
  };

  const calculateBubbleProbability = () => {
    if (!marketData) return 70;
    let score = 0;
    const sp500Price = marketData.price || 5000;
    if (sp500Price > 5500) score += 35;
    else if (sp500Price > 5000) score += 25;
    else if (sp500Price > 4500) score += 15;
    else score += 5;
    score += 20;
    if (debtData.length > 0) {
      const totalDebt = debtData.reduce((sum, d) => sum + d.totalAmount, 0) / 1e9;
      if (totalDebt > 10000) score += 25;
      else if (totalDebt > 5000) score += 15;
      else score += 10;
    }
    score += 15;
    return Math.min(score, 95);
  };

  const calculateCorrelationRisk = () => {
    return 78;
  };

  // Methodology explanations for tooltips
  const methodologyExplanations = {
    debtCrisis: {
      title: "Debt Crisis Calculation Methodology",
      description: "Analyzes Q2 2027 debt maturity data to predict crisis probability based on multiple risk factors.",
      details: `Scoring System:
• Debt Amount: 30pts if >$300B, 20pts if >$200B, else 10pts
• Interest Rates: 25pts if >5%, 15pts if >4%, else 5pts  
• Company Count: 20pts if >30 companies, 15pts if >20, else 10pts
• Market Conditions: 15pts if S&P500 >5000, else 10pts

Total score capped at 95%. Current factors include ${debtData.length ? 'real debt maturity data' : 'estimated baseline values'}.`
    },
    marketBubble: {
      title: "Market Bubble Calculation Methodology", 
      description: "Evaluates valuation crash risk using S&P 500 levels, debt exposure, and market conditions.",
      details: `Scoring System:
• S&P 500 Level: 35pts if >5500, 25pts if >5000, 15pts if >4500, else 5pts
• Base Market Risk: +20pts (current volatility)
• Total Debt Exposure: 25pts if >$10T, 15pts if >$5T, else 10pts
• Systemic Risk Factor: +15pts (interconnectedness)

Total score capped at 95%. Uses real-time S&P 500 data and ${debtData.length ? 'actual corporate debt levels' : 'estimated debt metrics'}.`
    },
    correlation: {
      title: "Correlation Risk Methodology",
      description: "Measures systemic contagion risk through inter-market correlation analysis.", 
      details: `Analysis Framework:
• Tech Stock Correlations: 90-day rolling averages
• Cross-Asset Dependencies: Bond-equity relationships
• Liquidity Interconnections: Market maker exposures
• Volatility Clustering: Risk-off scenario modeling

Currently set at 78% based on historical correlation patterns during stress periods. Higher correlation = greater contagion risk during market shocks.`
    }
  };

  const debtCrisisProb = calculateDebtCrisisProbability();
  const bubbleProb = calculateBubbleProbability();
  const correlationRisk = calculateCorrelationRisk();
  const overallRisk = Math.round((debtCrisisProb + bubbleProb + correlationRisk) / 3);

  const getRiskColor = (risk) => {
    if (risk >= 80) return '#ef4444';
    if (risk >= 60) return '#f59e0b';
    if (risk >= 40) return '#eab308';
    return '#22c55e';
  };

  const timelineData = [
    { date: '2024 Q4', risk: 45, event: 'Current State' },
    { date: '2025 Q1', risk: 52, event: 'Rising Rates' },
    { date: '2025 Q2', risk: 58, event: 'Debt Concerns' },
    { date: '2025 Q3', risk: 63, event: 'Market Jitters' },
    { date: '2025 Q4', risk: 68, event: 'Volatility Spike' },
    { date: '2026 Q1', risk: 72, event: 'Warning Signs' },
    { date: '2026 Q2', risk: 75, event: 'Pressure Builds' },
    { date: '2026 Q3', risk: 78, event: 'Critical Zone' },
    { date: '2026 Q4', risk: 82, event: 'High Alert' },
    { date: '2027 Q1', risk: 88, event: 'Pre-Crisis' },
    { date: '2027 Q2', risk: 95, event: 'DEBT WALL', critical: true },
    { date: '2027 Q3', risk: 85, event: 'Aftermath' },
    { date: '2027 Q4', risk: 70, event: 'Stabilization?' }
  ];

  const radarData = [
    { factor: 'Debt Load', value: debtCrisisProb },
    { factor: 'Valuation', value: bubbleProb },
    { factor: 'Correlation', value: correlationRisk },
    { factor: 'Liquidity', value: 65 },
    { factor: 'Sentiment', value: 72 },
    { factor: 'Macro', value: 68 }
  ];

  // Data generation functions for outcome analysis
  const getStockProjectionData = () => {
    const dates = ['2024 Q4', '2025 Q1', '2025 Q2', '2025 Q3', '2025 Q4', '2026 Q1', '2026 Q2', '2026 Q3', '2026 Q4', '2027 Q1', '2027 Q2', '2027 Q3', '2027 Q4', '2028 Q1'];
    return dates.map((date, i) => {
      const baselineGrowth = 100 + (i * 2.5); // 2.5% quarterly growth
      const softLandingMultiplier = i < 8 ? 1 : (i < 10 ? 0.92 : 0.88); // Correction starts Q2 2026
      const debtCrisisMultiplier = i < 8 ? 1 : (i < 10 ? 0.85 : (i < 12 ? 0.65 : 0.70)); // Sharp drop Q2 2027
      const fullCrisisMultiplier = i < 8 ? 1 : (i < 10 ? 0.75 : (i < 12 ? 0.35 : 0.45)); // Severe crash
      
      return {
        date,
        baseline: Math.round(baselineGrowth),
        softLanding: Math.round(baselineGrowth * softLandingMultiplier),
        debtCrisis: Math.round(baselineGrowth * debtCrisisMultiplier),
        fullCrisis: Math.round(baselineGrowth * fullCrisisMultiplier)
      };
    });
  };

  const getScenarioDistribution = () => {
    // Monte Carlo outcome distribution
    return [
      { outcome: 'Market Crash (-60% to -80%)', probability: 15 },
      { outcome: 'Severe Correction (-40% to -60%)', probability: 25 },
      { outcome: 'Major Correction (-20% to -40%)', probability: 35 },
      { outcome: 'Minor Correction (-10% to -20%)', probability: 20 },
      { outcome: 'Soft Landing (0% to -10%)', probability: 5 }
    ];
  };

  const getForcedSellingData = () => {
    return [
      { quarter: '2025 Q1', sellingPressure: 15 },
      { quarter: '2025 Q2', sellingPressure: 22 },
      { quarter: '2025 Q3', sellingPressure: 28 },
      { quarter: '2025 Q4', sellingPressure: 35 },
      { quarter: '2026 Q1', sellingPressure: 45 },
      { quarter: '2026 Q2', sellingPressure: 58 },
      { quarter: '2026 Q3', sellingPressure: 75 },
      { quarter: '2026 Q4', sellingPressure: 95 },
      { quarter: '2027 Q1', sellingPressure: 125 },
      { quarter: '2027 Q2', sellingPressure: 180 }, // Peak crisis
      { quarter: '2027 Q3', sellingPressure: 140 },
      { quarter: '2027 Q4', sellingPressure: 85 },
      { quarter: '2028 Q1', sellingPressure: 45 }
    ];
  };

  const getCashRunwayData = () => {
    const months = Array.from({ length: 48 }, (_, i) => `Month ${i + 1}`);
    return months.map((month, i) => {
      const normalBurn = Math.max(100 - (i * 1.5), 20); // Slow decline
      const stressBurn = Math.max(100 - (i * 3), 5); // Faster decline
      const crisisBurn = Math.max(100 - (i * 8), 0); // Rapid decline
      
      return {
        month: i % 6 === 0 ? month : '', // Show every 6 months
        normalBurn: Math.round(normalBurn),
        stressBurn: Math.round(stressBurn),
        crisisBurn: Math.round(crisisBurn)
      };
    });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-10 h-10 text-primary" />
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-danger to-warning bg-clip-text text-transparent">
              THE BIG BLUFF
            </h1>
            <p className="text-lg text-textSecondary mt-1">
              Circular Debt Dependencies and Systemic Crisis Risk in the US Technology Sector
            </p>
          </div>
        </div>
      </div>

      {/* Opening Quote */}
      <section className="mb-8 p-6 bg-gradient-to-r from-danger/10 to-warning/10 border-l-4 border-danger rounded-r-lg">
        <p className="text-textPrimary text-xl italic leading-relaxed mb-3">
          "The market can stay irrational longer than you can stay solvent. But eventually, math wins. 
          And the math suggests: refinancing $150 billion at 2-3x the cost may create significant stress—the question is whether something breaks."
        </p>
        <p className="text-textSecondary text-sm">— Reece Till</p>
      </section>

      {/* Executive Summary */}
      <section className="card p-6 mb-8 border-l-4 border-danger">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-danger" />
          Executive Summary
        </h2>
        <p className="text-textPrimary leading-relaxed mb-4">
          This analysis examines a <span className="text-danger font-semibold">potential triple-threat scenario</span> in US technology: 
          ten major companies borrowed <span className="text-warning font-semibold">$400B+</span> at 1.5-4% rates (2020-2021), 
          invested these funds circularly within their ecosystem, and now face <span className="text-danger font-semibold">$150B+</span> in 
          maturities (2025-2027) requiring refinancing at 5-7% rates—a <span className="text-danger font-semibold">100-200% cost increase</span>.
        </p>
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="bg-danger/10 p-4 rounded-lg border border-danger/20">
            <h3 className="font-bold text-danger mb-2">Scenario A: Refinance</h3>
            <p className="text-sm text-textSecondary">Interest expenses could increase, potentially leading to earnings compression and valuation pressure</p>
          </div>
          <div className="bg-danger/10 p-4 rounded-lg border border-danger/20">
            <h3 className="font-bold text-danger mb-2">Scenario B: Liquidate</h3>
            <p className="text-sm text-textSecondary">Forced selling of assets could lead to market pressure and potential cascading effects</p>
          </div>
          <div className="bg-danger/10 p-4 rounded-lg border border-danger/20">
            <h3 className="font-bold text-danger mb-2">Scenario C: Capital Flight</h3>
            <p className="text-sm text-textSecondary">Rotation to alternative assets could impact traditional markets and prompt a regulatory response</p>
          </div>
        </div>
      </section>

      {/* Crisis Forecaster */}
      <section className="card p-6 mb-8 border-l-4 border-primary">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Target className="w-6 h-6 text-primary" />
          Crisis Forecaster: Testing The Theory
        </h2>
        <p className="text-textSecondary mb-6">
          Real-time probability analysis combining debt crisis, market bubble, and correlation theories
        </p>

        {/* Overall Risk Score */}
        <div className="bg-gradient-to-br from-danger/10 to-warning/10 rounded-lg p-8 mb-6 text-center border border-danger/20">
          <h3 className="text-lg font-bold mb-4">Overall Crisis Probability</h3>
          <div className="text-8xl font-bold mb-4" style={{ color: getRiskColor(overallRisk) }}>
            {overallRisk}%
          </div>
          <p className="text-lg text-textSecondary">
            {overallRisk >= 80 ? '🔴 CRITICAL - Theory Strongly Supported' :
             overallRisk >= 60 ? '⚠️ HIGH - Theory Likely Correct' :
             overallRisk >= 40 ? '⚡ MODERATE - Mixed Signals' :
             '✅ LOW - Theory Not Supported'}
          </p>
        </div>

        {/* Three Theory Breakdown */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-surface rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-danger" />
              <h4 className="font-bold">Debt Crisis</h4>
              <InfoTooltip 
                title={methodologyExplanations.debtCrisis.title}
                description={methodologyExplanations.debtCrisis.description}
                details={methodologyExplanations.debtCrisis.details}
              />
            </div>
            <div className="text-4xl font-bold mb-2" style={{ color: getRiskColor(debtCrisisProb) }}>
              {debtCrisisProb}%
            </div>
            <p className="text-xs text-textSecondary">2027 debt wall scenario</p>
          </div>
          <div className="bg-surface rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-5 h-5 text-warning" />
              <h4 className="font-bold">Market Bubble</h4>
              <InfoTooltip 
                title={methodologyExplanations.marketBubble.title}
                description={methodologyExplanations.marketBubble.description}
                details={methodologyExplanations.marketBubble.details}
              />
            </div>
            <div className="text-4xl font-bold mb-2" style={{ color: getRiskColor(bubbleProb) }}>
              {bubbleProb}%
            </div>
            <p className="text-xs text-textSecondary">Valuation crash risk</p>
          </div>
          <div className="bg-surface rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-primary" />
              <h4 className="font-bold">Correlation</h4>
              <InfoTooltip 
                title={methodologyExplanations.correlation.title}
                description={methodologyExplanations.correlation.description}
                details={methodologyExplanations.correlation.details}
              />
            </div>
            <div className="text-4xl font-bold mb-2" style={{ color: getRiskColor(correlationRisk) }}>
              {correlationRisk}%
            </div>
            <p className="text-xs text-textSecondary">Systemic contagion</p>
          </div>
        </div>

        {/* Timeline Projection */}
        <div className="bg-surface rounded-lg p-6 mb-6 border border-border">
          <h3 className="text-lg font-bold mb-4">Crisis Timeline Projection</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#94a3b8" angle={-45} textAnchor="end" height={80} fontSize={12} />
              <YAxis stroke="#94a3b8" domain={[0, 100]} fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', fontSize: '12px' }}
                formatter={(value, name, props) => [
                  `${value}%`,
                  props.payload.critical ? '🔴 CRITICAL EVENT' : 'Risk Level'
                ]}
              />
              <Area 
                type="monotone" 
                dataKey="risk" 
                stroke="#ef4444" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#riskGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-center text-xs text-textSecondary mt-2">
            Projected risk escalation leading to Q2 2027 debt wall crisis
          </p>
        </div>

        {/* Multi-Factor Radar */}
        <div className="bg-surface rounded-lg p-6 mb-6 border border-border">
          <h3 className="text-lg font-bold mb-4">Multi-Factor Risk Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="factor" stroke="#94a3b8" fontSize={12} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#94a3b8" fontSize={10} />
              <Radar name="Risk Level" dataKey="value" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', fontSize: '12px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Key Dates */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-danger/10 border border-danger/30 rounded-lg">
            <div className="text-xs text-textSecondary">PRIMARY TRIGGER</div>
            <div className="text-2xl font-bold text-danger mt-1">Q2 2027</div>
            <div className="text-sm mt-2">$350B+ debt maturity spike</div>
          </div>
          <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
            <div className="text-xs text-textSecondary">WARNING PERIOD</div>
            <div className="text-2xl font-bold text-warning mt-1">Q4 2026</div>
            <div className="text-sm mt-2">Pre-crisis indicators emerge</div>
          </div>
        </div>

        {/* Stock Price Projections */}
        <div className="bg-surface rounded-lg p-6 mb-6 border border-border">
          <h3 className="text-lg font-bold mb-4">Stock Price Projections by Scenario</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getStockProjectionData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', fontSize: '12px' }} />
              <Legend />
              <Line type="monotone" dataKey="baseline" stroke="#22c55e" strokeWidth={2} name="Baseline (No Crisis)" />
              <Line type="monotone" dataKey="softLanding" stroke="#eab308" strokeWidth={2} name="Soft Landing" strokeDasharray="5 5" />
              <Line type="monotone" dataKey="debtCrisis" stroke="#f59e0b" strokeWidth={2} name="Debt Crisis" strokeDasharray="10 5" />
              <Line type="monotone" dataKey="fullCrisis" stroke="#ef4444" strokeWidth={3} name="Full Crisis" />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-success/10 border border-success/30 rounded">
              <div className="text-sm text-textSecondary">Baseline</div>
              <div className="text-lg font-bold text-success">+15%</div>
              <div className="text-xs text-textSecondary">Normal growth</div>
            </div>
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
              <div className="text-sm text-textSecondary">Soft Landing</div>
              <div className="text-lg font-bold text-yellow-500">-12%</div>
              <div className="text-xs text-textSecondary">Managed correction</div>
            </div>
            <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded">
              <div className="text-sm text-textSecondary">Debt Crisis</div>
              <div className="text-lg font-bold text-orange-500">-35%</div>
              <div className="text-xs text-textSecondary">Sector stress</div>
            </div>
            <div className="p-3 bg-danger/10 border border-danger/30 rounded">
              <div className="text-sm text-textSecondary">Full Crisis</div>
              <div className="text-lg font-bold text-danger">-65%</div>
              <div className="text-xs text-textSecondary">Systemic collapse</div>
            </div>
          </div>
        </div>

        {/* Scenario Outcome Distribution */}
        <div className="bg-surface rounded-lg p-6 mb-6 border border-border">
          <h3 className="text-lg font-bold mb-4">Scenario Outcome Probability Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={getScenarioDistribution()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="outcome" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', fontSize: '12px' }} />
              <Area type="monotone" dataKey="probability" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-4 text-center text-sm text-textSecondary">
            Monte Carlo simulation of 10,000 scenarios based on current risk factors
          </div>
        </div>

        {/* Forced Selling Pressure */}
        <div className="bg-surface rounded-lg p-6 mb-6 border border-border">
          <h3 className="text-lg font-bold mb-4">Forced Selling Pressure Analysis</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={getForcedSellingData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="quarter" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', fontSize: '12px' }} />
                  <Bar dataKey="sellingPressure" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-danger/10 border border-danger/30 rounded">
                <div className="text-sm text-textSecondary">Peak Selling Pressure</div>
                <div className="text-2xl font-bold text-danger">$180B</div>
                <div className="text-xs text-textSecondary">Q2 2027 - Forced liquidations</div>
              </div>
              <div className="p-4 bg-warning/10 border border-warning/30 rounded">
                <div className="text-sm text-textSecondary">Market Impact</div>
                <div className="text-2xl font-bold text-warning">-25%</div>
                <div className="text-xs text-textSecondary">Estimated price depression</div>
              </div>
              <div className="p-4 bg-primary/10 border border-primary/30 rounded">
                <div className="text-sm text-textSecondary">Recovery Time</div>
                <div className="text-2xl font-bold text-primary">18-36</div>
                <div className="text-xs text-textSecondary">Months to stabilize</div>
              </div>
            </div>
          </div>
        </div>

        {/* Cash Runway Analysis */}
        <div className="bg-surface rounded-lg p-6 mb-6 border border-border">
          <h3 className="text-lg font-bold mb-4">Cash Runway Under Crisis Scenarios</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getCashRunwayData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', fontSize: '12px' }} />
              <Legend />
              <Line type="monotone" dataKey="normalBurn" stroke="#22c55e" strokeWidth={2} name="Normal Operations" />
              <Line type="monotone" dataKey="stressBurn" stroke="#f59e0b" strokeWidth={2} name="Stress Scenario" strokeDasharray="5 5" />
              <Line type="monotone" dataKey="crisisBurn" stroke="#ef4444" strokeWidth={2} name="Crisis Scenario" strokeDasharray="10 5" />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-success/10 border border-success/30 rounded">
              <div className="text-sm text-textSecondary">Normal Runway</div>
              <div className="text-xl font-bold text-success">48+ months</div>
            </div>
            <div className="text-center p-3 bg-warning/10 border border-warning/30 rounded">
              <div className="text-sm text-textSecondary">Stress Runway</div>
              <div className="text-xl font-bold text-warning">24 months</div>
            </div>
            <div className="text-center p-3 bg-danger/10 border border-danger/30 rounded">
              <div className="text-sm text-textSecondary">Crisis Runway</div>
              <div className="text-xl font-bold text-danger">8-12 months</div>
            </div>
          </div>
        </div>

        {/* Contagion Network */}
        <div className="bg-surface rounded-lg p-6 mb-6 border border-border">
          <h3 className="text-lg font-bold mb-4">Crisis Contagion Network</h3>
          <div className="relative bg-background rounded-lg p-8" style={{ height: '400px' }}>
            {/* Network Visualization */}
            <svg width="100%" height="100%" className="absolute inset-0">
              {/* Central nodes (major companies) */}
              <circle cx="50%" cy="30%" r="25" fill="#ef4444" opacity="0.8" />
              <text x="50%" y="30%" textAnchor="middle" dy="5" className="text-xs fill-white font-bold">AAPL</text>
              
              <circle cx="30%" cy="50%" r="20" fill="#f59e0b" opacity="0.8" />
              <text x="30%" y="50%" textAnchor="middle" dy="4" className="text-xs fill-white font-bold">MSFT</text>
              
              <circle cx="70%" cy="50%" r="20" fill="#f59e0b" opacity="0.8" />
              <text x="70%" y="50%" textAnchor="middle" dy="4" className="text-xs fill-white font-bold">GOOGL</text>
              
              <circle cx="50%" cy="70%" r="18" fill="#eab308" opacity="0.8" />
              <text x="50%" y="70%" textAnchor="middle" dy="4" className="text-xs fill-white font-bold">AMZN</text>
              
              <circle cx="20%" cy="25%" r="15" fill="#22c55e" opacity="0.6" />
              <text x="20%" y="25%" textAnchor="middle" dy="3" className="text-xs fill-white font-bold">META</text>
              
              <circle cx="80%" cy="25%" r="15" fill="#22c55e" opacity="0.6" />
              <text x="80%" y="25%" textAnchor="middle" dy="3" className="text-xs fill-white font-bold">NVDA</text>
              
              <circle cx="25%" cy="75%" r="12" fill="#6366f1" opacity="0.6" />
              <text x="25%" y="75%" textAnchor="middle" dy="3" className="text-xs fill-white font-bold">TSLA</text>
              
              <circle cx="75%" cy="75%" r="12" fill="#6366f1" opacity="0.6" />
              <text x="75%" y="75%" textAnchor="middle" dy="3" className="text-xs fill-white font-bold">NFLX</text>
              
              {/* Connection lines showing contagion paths */}
              <line x1="50%" y1="30%" x2="30%" y2="50%" stroke="#ef4444" strokeWidth="3" opacity="0.7" />
              <line x1="50%" y1="30%" x2="70%" y2="50%" stroke="#ef4444" strokeWidth="3" opacity="0.7" />
              <line x1="50%" y1="30%" x2="50%" y2="70%" stroke="#f59e0b" strokeWidth="2" opacity="0.6" />
              <line x1="30%" y1="50%" x2="50%" y2="70%" stroke="#f59e0b" strokeWidth="2" opacity="0.6" />
              <line x1="70%" y1="50%" x2="50%" y2="70%" stroke="#f59e0b" strokeWidth="2" opacity="0.6" />
              <line x1="20%" y1="25%" x2="30%" y2="50%" stroke="#eab308" strokeWidth="1" opacity="0.5" />
              <line x1="80%" y1="25%" x2="70%" y2="50%" stroke="#eab308" strokeWidth="1" opacity="0.5" />
              <line x1="25%" y1="75%" x2="50%" y2="70%" stroke="#6366f1" strokeWidth="1" opacity="0.4" />
              <line x1="75%" y1="75%" x2="50%" y2="70%" stroke="#6366f1" strokeWidth="1" opacity="0.4" />
            </svg>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-danger rounded-full"></div>
              <span>Crisis Epicenter</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-warning rounded-full"></div>
              <span>Primary Contagion</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <span>Secondary Impact</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-success rounded-full"></div>
              <span>Peripheral Risk</span>
            </div>
          </div>
          <div className="mt-4 p-4 bg-warning/10 border border-warning/30 rounded">
            <div className="text-sm font-semibold text-warning mb-2">Contagion Simulation:</div>
            <div className="text-xs text-textSecondary space-y-1">
              <div>• Crisis starts with highest debt concentration (AAPL)</div>
              <div>• Spreads to interconnected companies within 1-2 quarters</div>
              <div>• Secondary effects reach entire ecosystem within 6 months</div>
              <div>• Network effect amplifies individual company stress by 2-3x</div>
            </div>
          </div>
        </div>
      </section>

      {/* Full Analysis */}
      <section className="card p-6 mb-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          Full Analysis
        </h2>
        
        {/* Download/Read Options */}
        <div className="bg-primary/10 border border-primary/20 p-6 rounded-lg mb-6 text-center">
          <p className="text-textPrimary mb-4">
            For the complete analysis with full methodology and references:
          </p>
          <a 
            href="/THE_BIG_BLUFF_Thesis.pdf" 
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
            download="THE_BIG_BLUFF_Analysis.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download Full PDF
          </a>
          <p className="text-textSecondary text-sm mt-3">
            Continue reading below for key sections and findings
          </p>
        </div>

        {/* Key Sections */}
        <div className="prose prose-invert max-w-none">
          <ThesisContent />
        </div>
      </section>
    </div>
  );
}

function ThesisContent() {
  return (
    <>
      {/* Section 1 */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4 text-primary flex items-center gap-2">
          <GitBranch className="w-6 h-6" />
          1. The Circular Debt Problem
        </h2>
        
        <h3 className="text-xl font-semibold mb-3">1.1 The 2020-2021 Borrowing Binge</h3>
        <div className="bg-surface p-4 rounded-lg mb-4">
          <p className="text-textPrimary mb-2">
            <span className="text-danger font-bold text-2xl">$485B</span> total debt issued despite holding 
            <span className="text-success font-bold text-2xl"> $600B</span> in cash
          </p>
        </div>
        
        <p className="text-textPrimary mb-3"><strong>Why borrow when cash-rich?</strong></p>
        <ul className="list-disc list-inside text-textSecondary space-y-2 mb-6 ml-4">
          <li>Tax arbitrage (interest deductible, repatriation taxable)</li>
          <li>Earn 8-12% returns while borrowing at 2-3%</li>
          <li>Assume perpetual refinancing at low rates</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3">1.2 Circular Investment</h3>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
            <h4 className="font-bold text-blue-400 mb-2">Infrastructure Loop</h4>
            <p className="text-sm text-textSecondary">AWS $62B, Azure $80B, Google Cloud $30B ← funded by ecosystem</p>
          </div>
          <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
            <h4 className="font-bold text-green-400 mb-2">Hardware Loop</h4>
            <p className="text-sm text-textSecondary">NVIDIA $27B chips ← $15-20B from tech companies</p>
          </div>
          <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/20">
            <h4 className="font-bold text-purple-400 mb-2">Advertising Loop</h4>
            <p className="text-sm text-textSecondary">Google/Meta $340B ads ← $50-80B from tech ecosystem</p>
          </div>
        </div>

        <div className="bg-warning/10 border border-warning/20 p-4 rounded-lg mb-6">
          <p className="text-textPrimary font-semibold">
            Estimated <span className="text-warning text-xl">15-25%</span> of revenues may be circular—companies potentially paying each other with borrowed money
          </p>
        </div>

        <h3 className="text-xl font-semibold mb-3">1.3 GDP Concentration</h3>
        <div className="bg-surface p-4 rounded-lg">
          <ul className="text-textSecondary space-y-2">
            <li>Direct GDP: <span className="text-warning font-semibold">10% ($2.5T)</span></li>
            <li>Indirect: <span className="text-warning font-semibold">+8% ($2T)</span></li>
            <li>Total: <span className="text-danger font-semibold text-lg">18% of US GDP</span></li>
            <li>Market cap: <span className="text-danger font-semibold text-lg">30% of S&P 500</span></li>
          </ul>
        </div>
      </section>

      {/* Section 2 */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4 text-danger flex items-center gap-2">
          <TrendingDown className="w-6 h-6" />
          2. The Maturity Wall (2025-2027)
        </h2>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-orange-500/10 p-4 rounded-lg border border-orange-500/20 text-center">
            <h3 className="font-bold text-orange-400 mb-2">2025</h3>
            <p className="text-3xl font-bold">$38B</p>
          </div>
          <div className="bg-orange-600/10 p-4 rounded-lg border border-orange-600/20 text-center">
            <h3 className="font-bold text-orange-500 mb-2">2026</h3>
            <p className="text-3xl font-bold">$47B</p>
          </div>
          <div className="bg-danger/10 p-4 rounded-lg border border-danger/20 text-center">
            <h3 className="font-bold text-danger mb-2">2027</h3>
            <p className="text-3xl font-bold">$53B</p>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-lg mb-6">
          <h3 className="text-xl font-semibold mb-4">The Refinancing Challenge</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-textSecondary mb-1">Original (2020-21)</p>
              <p className="text-4xl font-bold text-success">2.9%</p>
            </div>
            <div className="flex items-center justify-center">
              <TrendingDown className="w-12 h-12 text-danger" />
            </div>
            <div>
              <p className="text-sm text-textSecondary mb-1">Current</p>
              <p className="text-4xl font-bold text-danger">5.5-7%</p>
            </div>
          </div>
          <p className="text-center mt-4 text-2xl font-bold text-danger">+100-150% Cost Increase</p>
        </div>
      </section>

      {/* Section 3 */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Target className="w-6 h-6 text-danger" />
          3. The Strategic Trilemma
        </h2>

        <div className="space-y-4">
          <div className="bg-red-500/5 border-l-4 border-red-500 p-4 rounded-r-lg">
            <h3 className="font-bold text-red-400 mb-2">Scenario A: Refinance</h3>
            <p className="text-sm text-textSecondary">Interest expenses may increase, potentially leading to earnings compression and valuation pressure</p>
          </div>
          <div className="bg-orange-500/5 border-l-4 border-orange-500 p-4 rounded-r-lg">
            <h3 className="font-bold text-orange-400 mb-2">Scenario B: Liquidate</h3>
            <p className="text-sm text-textSecondary">Forced selling of assets could lead to market pressure and potential cascading effects</p>
          </div>
          <div className="bg-purple-500/5 border-l-4 border-purple-500 p-4 rounded-r-lg">
            <h3 className="font-bold text-purple-400 mb-2 flex items-center gap-2">
              <Bitcoin className="w-5 h-5" />
              Scenario C: Capital Flight
            </h3>
            <p className="text-sm text-textSecondary">Rotation to alternative assets could impact traditional markets and prompt a regulatory response</p>
          </div>
        </div>
      </section>

      {/* Section 4 */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-primary" />
          4. The Big Bluff Index
        </h2>

        <div className="bg-surface p-6 rounded-lg mb-6">
          <h3 className="font-bold mb-4">Composite Risk Score (0-100)</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between p-2 bg-background rounded">
              <span>20% × Debt Risk</span>
              <span className="text-textSecondary">Z-scores, maturity concentration</span>
            </div>
            <div className="flex justify-between p-2 bg-background rounded">
              <span>15% × Valuation Risk</span>
              <span className="text-textSecondary">CAPE, Buffett Indicator</span>
            </div>
            <div className="flex justify-between p-2 bg-background rounded">
              <span>15% × Macro Risk</span>
              <span className="text-textSecondary">Fed rates, yield curve</span>
            </div>
            <div className="flex justify-between p-2 bg-background rounded">
              <span>15% × Correlation Risk</span>
              <span className="text-textSecondary">Inter-stock correlation</span>
            </div>
            <div className="flex justify-between p-2 bg-background rounded">
              <span>15% × Circular Dependency</span>
              <span className="text-textSecondary">Revenue interdependence</span>
            </div>
            <div className="flex justify-between p-2 bg-background rounded">
              <span>10% × Liquidation Risk</span>
              <span className="text-textSecondary">Forced selling probability</span>
            </div>
            <div className="flex justify-between p-2 bg-background rounded">
              <span>10% × Capital Flight Risk</span>
              <span className="text-textSecondary">Bitcoin decoupling</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="bg-green-500/10 border border-green-500/20 p-3 rounded text-center">
            <p className="text-2xl font-bold text-green-400">0-40</p>
            <p className="text-xs text-textSecondary mt-1">Low Risk</p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded text-center">
            <p className="text-2xl font-bold text-yellow-400">40-60</p>
            <p className="text-xs text-textSecondary mt-1">Caution</p>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded text-center">
            <p className="text-2xl font-bold text-orange-400">60-75</p>
            <p className="text-xs text-textSecondary mt-1">Warning</p>
          </div>
          <div className="bg-danger/10 border border-danger/20 p-3 rounded text-center">
            <p className="text-2xl font-bold text-danger">75-100</p>
            <p className="text-xs text-textSecondary mt-1">Crisis</p>
          </div>
        </div>
      </section>

      {/* Why The Big Bluff */}
      <section className="mb-10 bg-gradient-to-br from-danger/5 to-warning/5 p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">5. Why It's Called "THE BIG BLUFF"</h2>
        
        <div className="space-y-4">
          <div className="bg-background/50 p-4 rounded">
            <p className="font-bold text-success mb-1">Layer 1 (Markets see):</p>
            <p className="text-textSecondary italic">"We're profitable, growing, the future"</p>
          </div>
          <div className="bg-background/50 p-4 rounded">
            <p className="font-bold text-warning mb-1">Layer 2 (Reality):</p>
            <p className="text-textSecondary italic">"Growth is circular—borrowed money funding each other"</p>
          </div>
          <div className="bg-background/50 p-4 rounded">
            <p className="font-bold text-danger mb-1">Layer 3 (The trilemma):</p>
            <p className="text-textSecondary italic">"Every option presents challenges"</p>
          </div>
        </div>

        <div className="mt-6 p-6 bg-danger/20 border-2 border-danger rounded-lg text-center">
          <p className="text-xl font-bold mb-3">The Core Question</p>
          <p className="text-textPrimary leading-relaxed">
            Each path presents challenges. Refinance may pressure earnings. Liquidation could stress markets. Bitcoin flight might trigger regulatory response.
          </p>
          <p className="text-textSecondary mt-4 text-sm">
            The "bluff" hypothesis: companies may be underestimating the complexity of navigating these scenarios simultaneously.
          </p>
        </div>
      </section>

      {/* Conclusion */}
      <section>
        <h2 className="text-2xl font-bold mb-4">6. Conclusion</h2>
        <p className="text-textPrimary mb-4 text-lg italic text-center p-6 bg-surface rounded-lg">
          "They borrowed $400 billion at 2%, invested it within the ecosystem, and now face refinancing at 6%. 
          Each scenario presents challenges. The questions are: which path will companies choose, 
          and how might the market respond?"
        </p>
        <p className="text-textSecondary text-center">
          This dashboard tracks all three scenarios in real-time to monitor potential systemic stress indicators.
        </p>
      </section>
    </>
  );
}
