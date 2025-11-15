import { useEffect, useState } from 'react';
import { Shield, AlertTriangle, TrendingDown, Activity } from 'lucide-react';
import axios from 'axios';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';

export default function RiskDashboard() {
  const [riskIndex, setRiskIndex] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRiskData();
  }, []);

  const fetchRiskData = async () => {
    try {
      const response = await axios.get('/api/bubble/risk-index');
      setRiskIndex(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching risk data:', error);
      setLoading(false);
    }
  };

  const gaugeData = [{
    name: 'Risk',
    value: parseFloat(riskIndex?.compositeScore || 0),
    fill: getGaugeColor(parseFloat(riskIndex?.compositeScore || 0))
  }];

  function getGaugeColor(value) {
    if (value >= 75) return '#ef4444';
    if (value >= 60) return '#f59e0b';
    if (value >= 40) return '#eab308';
    return '#10b981';
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">Risk Dashboard</h1>
        <p className="text-textSecondary mt-2">
          Big Bluff Index and bubble risk analysis
        </p>
      </div>

      {/* Main Gauge */}
      <div className="bg-surface rounded-lg p-8 border border-border">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">The Big Bluff Index</h2>
          <p className="text-textSecondary">
            Composite score measuring bubble risk and market valuation
          </p>
        </div>

        <div className="flex items-center justify-center mb-8">
          <div className="relative">
            <ResponsiveContainer width={400} height={400}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="90%"
                data={gaugeData}
                startAngle={180}
                endAngle={0}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar
                  background
                  dataKey="value"
                  cornerRadius={10}
                  fill={gaugeData[0].fill}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-6xl font-bold mb-2" style={{ color: gaugeData[0].fill }}>
                {riskIndex?.compositeScore || '...'}
              </div>
              <div className="text-lg text-textSecondary">out of 100</div>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg text-center ${
          riskIndex?.riskLevel === 'Bubble Territory' ? 'bg-danger/20' :
          riskIndex?.riskLevel === 'Warning' ? 'bg-warning/20' :
          riskIndex?.riskLevel === 'Caution' ? 'bg-yellow-500/20' :
          'bg-success/20'
        }`}>
          <div className="text-2xl font-bold mb-2">
            {riskIndex?.riskLevel === 'Bubble Territory' ? '🔴 BUBBLE TERRITORY - Extreme valuation levels detected' :
             riskIndex?.riskLevel === 'Warning' ? '🟠 WARNING - Multiple red flags present' :
             riskIndex?.riskLevel === 'Caution' ? '🟡 CAUTION - Some warning signs detected' :
             '🟢 SAFE - Markets appear stable'}
          </div>
          <div className="text-textSecondary">
            {riskIndex?.riskLevel === 'Bubble Territory' ? 'URGENT: Review positions, consider hedging' :
             riskIndex?.riskLevel === 'Warning' ? 'Monitor closely, prepare contingency plans' :
             riskIndex?.riskLevel === 'Caution' ? 'Stay vigilant, review risk metrics regularly' :
             'Continue normal operations'}
          </div>
        </div>
      </div>

      {/* Component Breakdown */}
      <div className="bg-surface rounded-lg p-6 border border-border">
        <h2 className="text-2xl font-bold mb-6">Risk Component Breakdown</h2>
        
        <div className="space-y-4">
          {riskIndex?.components && (
            <>
              <RiskBar 
                label="Valuation Risk (20%)"
                value={riskIndex.components.valuation?.score || 0}
                icon={Activity}
              />
              <RiskBar 
                label="Leverage Risk (20%)"
                value={riskIndex.components.leverage?.score || 0}
                icon={TrendingDown}
              />
              <RiskBar 
                label="Sentiment Risk (20%)"
                value={riskIndex.components.sentiment?.score || 0}
                icon={AlertTriangle}
              />
              <RiskBar 
                label="Momentum Risk (20%)"
                value={riskIndex.components.momentum?.score || 0}
                icon={Activity}
              />
              <RiskBar 
                label="Systemic Risk (20%)"
                value={riskIndex.components.systemic?.score || 0}
                icon={Shield}
              />
            </>
          )}
        </div>
      </div>

      {/* Key Indicators */}
      <div className="bg-surface rounded-lg p-6 border border-border">
        <h2 className="text-2xl font-bold mb-4">Key Bubble Indicators</h2>
        
        <div className="grid grid-cols-3 gap-4">
          {riskIndex?.indicators && (
            <>
              <div className="bg-surfaceHover rounded-lg p-4 border border-border">
                <div className="text-sm text-textSecondary mb-1">CAPE Ratio</div>
                <div className="text-3xl font-bold">{riskIndex.indicators.cape?.value?.toFixed(1) || 'N/A'}</div>
                <div className="text-xs text-textSecondary mt-1">Historical avg: 16-17</div>
              </div>
              
              <div className="bg-surfaceHover rounded-lg p-4 border border-border">
                <div className="text-sm text-textSecondary mb-1">Buffett Indicator</div>
                <div className="text-3xl font-bold">{riskIndex.indicators.buffettIndicator?.value?.toFixed(0) || 'N/A'}%</div>
                <div className="text-xs text-textSecondary mt-1">Market Cap / GDP</div>
              </div>
              
              <div className="bg-surfaceHover rounded-lg p-4 border border-border">
                <div className="text-sm text-textSecondary mb-1">HY Bond Spread</div>
                <div className="text-3xl font-bold">{riskIndex.indicators.hySpread?.value?.toFixed(2) || 'N/A'}%</div>
                <div className="text-xs text-textSecondary mt-1">Credit risk premium</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Historical Context */}
      <div className="bg-surface rounded-lg p-6 border border-border">
        <h2 className="text-2xl font-bold mb-4">Historical Crisis Comparison</h2>
        
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center p-4 bg-surfaceHover rounded-lg">
            <div className="text-textSecondary mb-2">2008 Financial Crisis</div>
            <div className="text-2xl font-bold text-danger">85</div>
            <div className="text-sm text-textSecondary mt-1">Peak risk level</div>
          </div>

          <div className="text-center p-4 bg-surfaceHover rounded-lg">
            <div className="text-textSecondary mb-2">2000 Dot-Com Bubble</div>
            <div className="text-2xl font-bold text-warning">78</div>
            <div className="text-sm text-textSecondary mt-1">Peak risk level</div>
          </div>

          <div className="text-center p-4 bg-surfaceHover rounded-lg border-2 border-primary">
            <div className="text-textSecondary mb-2">Current Level</div>
            <div className="text-2xl font-bold" style={{ color: gaugeData[0].fill }}>
              {riskIndex?.compositeScore || '...'}
            </div>
            <div className="text-sm text-textSecondary mt-1">Today's reading</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RiskBar({ label, value, icon: Icon }) {
  const percentage = Math.min(100, value);
  const color = value >= 70 ? 'bg-danger' : value >= 40 ? 'bg-warning' : 'bg-success';

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-textSecondary" />
          <span className="text-textSecondary">{label}</span>
        </div>
        <span className="font-semibold">{value.toFixed(1)}</span>
      </div>
      <div className="w-full h-3 bg-border rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
