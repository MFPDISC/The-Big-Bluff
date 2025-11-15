import { useEffect, useState } from 'react';
import { Network, TrendingUp } from 'lucide-react';
import axios from 'axios';

export default function Correlations() {
  const [matrix, setMatrix] = useState(null);
  const [avgCorrelation, setAvgCorrelation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCorrelations();
  }, []);

  const fetchCorrelations = async () => {
    try {
      const [matrixRes, avgRes] = await Promise.all([
        axios.get('/api/correlations/matrix?days=90'),
        axios.get('/api/correlations/average?days=90')
      ]);
      
      setMatrix(matrixRes.data);
      setAvgCorrelation(avgRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching correlations:', error);
      setLoading(false);
    }
  };

  const getCorrelationColor = (value) => {
    if (value >= 0.8) return 'bg-danger';
    if (value >= 0.6) return 'bg-warning';
    if (value >= 0.4) return 'bg-yellow-500';
    if (value >= 0.2) return 'bg-primary';
    if (value >= -0.2) return 'bg-gray-500';
    if (value >= -0.4) return 'bg-blue-500';
    if (value >= -0.6) return 'bg-cyan-500';
    return 'bg-success';
  };

  const getTextColor = (value) => {
    if (value >= 0.8) return 'text-danger';
    if (value >= 0.6) return 'text-warning';
    if (value >= 0.4) return 'text-yellow-500';
    if (value >= 0.2) return 'text-primary';
    if (value >= -0.2) return 'text-gray-400';
    if (value >= -0.4) return 'text-blue-400';
    if (value >= -0.6) return 'text-cyan-400';
    return 'text-success';
  };

  const symbols = matrix?.companies?.map(c => c.symbol) || [];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">Correlation Analysis</h1>
        <p className="text-textSecondary mt-2">
          Track how tech stocks move together - high correlation = contagion risk
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-surface rounded-lg p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <span className="text-textSecondary">Average Correlation</span>
            <Network className="w-5 h-5 text-primary" />
          </div>
          <div className="text-3xl font-bold">{avgCorrelation?.average || '...'}</div>
          <div className="text-sm text-textSecondary mt-2">
            90-day rolling average
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <span className="text-textSecondary">Maximum Correlation</span>
            <TrendingUp className="w-5 h-5 text-danger" />
          </div>
          <div className="text-3xl font-bold text-danger">{avgCorrelation?.max || '...'}</div>
          <div className="text-sm text-textSecondary mt-2">
            Highest pair correlation
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <span className="text-textSecondary">Contagion Risk</span>
            <Network className="w-5 h-5 text-warning" />
          </div>
          <div className={`text-3xl font-bold ${
            avgCorrelation?.interpretation === 'High contagion risk' ? 'text-danger' :
            avgCorrelation?.interpretation === 'Moderate contagion risk' ? 'text-warning' :
            'text-success'
          }`}>
            {avgCorrelation?.interpretation?.split(' ')[0] || '...'}
          </div>
          <div className="text-sm text-textSecondary mt-2">
            {avgCorrelation?.interpretation || 'Loading...'}
          </div>
        </div>
      </div>

      {/* Correlation Matrix */}
      <div className="bg-surface rounded-lg p-6 border border-border">
        <h2 className="text-2xl font-bold mb-4">Correlation Heat Map</h2>
        <p className="text-textSecondary mb-6">
          90-day rolling correlation between tech stocks • 1.0 = perfect correlation • -1.0 = perfect inverse
        </p>

        {loading ? (
          <div className="loading-shimmer h-96 rounded-lg" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-2 border border-border bg-surfaceHover"></th>
                  {symbols.map(symbol => (
                    <th key={symbol} className="p-2 border border-border bg-surfaceHover font-semibold">
                      {symbol}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {symbols.map(symbol1 => (
                  <tr key={symbol1}>
                    <td className="p-2 border border-border bg-surfaceHover font-semibold">
                      {symbol1}
                    </td>
                    {symbols.map(symbol2 => {
                      const value = matrix?.matrix?.[symbol1]?.[symbol2] || 0;
                      return (
                        <td
                          key={symbol2}
                          className={`p-2 border border-border text-center font-semibold ${getTextColor(value)}`}
                          style={{
                            backgroundColor: `${getCorrelationColor(value).replace('bg-', 'rgba(var(--')}), ${Math.abs(value) * 0.3})`,
                          }}
                        >
                          {value.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-danger rounded"></div>
            <span>High Positive (&gt;0.8)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-warning rounded"></div>
            <span>Moderate (0.6-0.8)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-500 rounded"></div>
            <span>Neutral (-0.2 to 0.2)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-success rounded"></div>
            <span>Inverse (&lt;-0.6)</span>
          </div>
        </div>
      </div>

      {/* Interpretation */}
      <div className="bg-surface rounded-lg p-6 border border-border">
        <h2 className="text-2xl font-bold mb-4">What This Means</h2>
        
        <div className="space-y-4 text-textSecondary">
          <p>
            <span className="font-semibold text-textPrimary">High Correlation (0.7-1.0):</span> Stocks move together strongly. 
            If one fails, others likely follow. This indicates systemic risk and potential contagion.
          </p>
          
          <p>
            <span className="font-semibold text-textPrimary">Moderate Correlation (0.3-0.7):</span> Some relationship exists 
            but stocks maintain independence. Normal for companies in the same sector.
          </p>
          
          <p>
            <span className="font-semibold text-textPrimary">Low/Negative Correlation (&lt;0.3):</span> Stocks move independently 
            or inversely. This provides natural diversification and reduces systemic risk.
          </p>
          
          <p className="text-warning">
            ⚠️ <span className="font-semibold">Warning:</span> When average correlation exceeds 0.75, the market is vulnerable 
            to cascading failures similar to 2008. Individual company problems can trigger sector-wide panic.
          </p>
        </div>
      </div>
    </div>
  );
}
