import { useEffect, useState, useRef } from 'react';
import { AlertTriangle, TrendingDown, DollarSign } from 'lucide-react';
import axios from 'axios';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Cell } from 'recharts';

export default function DebtAnalysis() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tableFilter, setTableFilter] = useState('top10');
  const [retryInfo, setRetryInfo] = useState(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Prevent double fetch in React StrictMode
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchDebtData();
    }
  }, []);

  const fetchDebtData = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🏨 Using smart batch endpoint to avoid rate limits...');
      
      // Use the new batch endpoint that intelligently caches data
      const batchRes = await axios.get('/api/stocks/financials-batch', {
        timeout: 30000 // 30 second timeout
      });
      
      if (batchRes.data.success) {
        const enrichedData = Object.values(batchRes.data.data).map(item => ({
          id: item.company.symbol, // Add ID for React keys
          symbol: item.company.symbol,
          name: item.company.name,
          market_cap: item.company.marketCap,
          ...item.metrics,
          financials: item.financials
        }));
        
        console.log(`🏨 Loaded ${enrichedData.length} companies (${batchRes.data.cached} from cache)`);
        setCompanies(enrichedData);
      } else {
        throw new Error('Batch request failed');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching debt data:', error);
      
      // Handle rate limiting with exponential backoff
      if (error.response?.status === 429 && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s
        console.log(`🔄 Rate limited. Retrying in ${delay/1000}s... (attempt ${retryCount + 1}/3)`);
        
        setRetryInfo({
          attempt: retryCount + 1,
          maxAttempts: 3,
          delay: delay / 1000
        });
        setError(`Rate limited. Retrying in ${delay/1000} seconds... (attempt ${retryCount + 1}/3)`);
        
        setTimeout(() => {
          setRetryInfo(null);
          fetchDebtData(retryCount + 1);
        }, delay);
        return;
      }
      
      // Fallback to individual requests if batch fails
      console.log('🔄 Falling back to individual requests...');
      try {
        const companiesRes = await axios.get('/api/stocks/companies');
        
        const enrichedData = await Promise.all(
          companiesRes.data.slice(0, 5).map(async (company) => { // Limit to 5 to avoid rate limits
            try {
              const financials = await axios.get(`/api/stocks/financials/${company.symbol}`);
              return {
                ...company,
                ...financials.data.metrics,
                financials: financials.data.financials
              };
            } catch (error) {
              console.warn(`Failed to fetch financials for ${company.symbol}:`, error);
              return company;
            }
          })
        );
        
        setCompanies(enrichedData);
        setLoading(false);
      } catch (fallbackError) {
        const errorMessage = fallbackError.response?.status === 429 
          ? 'Request failed with status code 429' 
          : fallbackError.message;
        setError(`Failed to load debt analysis: ${errorMessage}`);
        setLoading(false);
      }
    }
  };

  const bubbleData = companies.map(company => ({
    name: company.symbol,
    x: company.debtToEquity || 0,
    y: company.interestCoverage || 0,
    z: (company.financials?.total_debt || 0) / 1e9,
    zScore: company.zScore
  }));

  const getColor = (zScore) => {
    if (!zScore) return '#94a3b8';
    if (zScore > 2.99) return '#10b981';
    if (zScore >= 1.81) return '#f59e0b';
    return '#ef4444';
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-4xl font-bold">Debt Analysis</h1>
          <p className="text-textSecondary mt-2">
            Corporate debt levels, leverage ratios, and bankruptcy risk indicators
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <span className="ml-4 text-lg">Loading debt analysis data...</span>
          
          {retryInfo && (
            <div className="mt-4 text-center">
              <div className="text-sm text-warning">
                Rate limited - Retrying in {retryInfo.delay}s (attempt {retryInfo.attempt}/{retryInfo.maxAttempts})
              </div>
              <div className="w-64 bg-surface rounded-full h-2 mt-2">
                <div 
                  className="bg-warning h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${((retryInfo.maxAttempts - retryInfo.attempt + 1) / retryInfo.maxAttempts) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-4xl font-bold">Debt Analysis</h1>
          <p className="text-textSecondary mt-2">
            Corporate debt levels, leverage ratios, and bankruptcy risk indicators
          </p>
        </div>
        <div className="bg-danger/10 border border-danger rounded-lg p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-6 h-6 text-danger mr-3" />
            <h2 className="text-xl font-semibold text-danger">Unable to Load Data</h2>
          </div>
          <p className="text-textSecondary mb-4">{error}</p>
          
          {error.includes('429') && (
            <div className="bg-warning/10 border border-warning rounded-lg p-4 mb-4">
              <div className="flex items-center mb-2">
                <AlertTriangle className="w-5 h-5 text-warning mr-2" />
                <span className="font-semibold text-warning">Rate Limit Information</span>
              </div>
              <p className="text-sm text-textSecondary">
                The financial data API has rate limits to prevent abuse. This error occurs when too many requests are made in a short time. 
                The system will automatically retry with exponential backoff, or you can wait a few minutes and try again.
              </p>
            </div>
          )}
          
          <div className="flex gap-3">
            <button 
              onClick={() => fetchDebtData(0)}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/80 transition-colors"
            >
              Try Again
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="bg-surface border border-border text-textPrimary px-4 py-2 rounded-lg hover:bg-surfaceHover transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">Debt Analysis</h1>
        <p className="text-textSecondary mt-2">
          Corporate debt levels, leverage ratios, and bankruptcy risk indicators
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-surface rounded-lg p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <span className="text-textSecondary">Total Tech Debt</span>
            <DollarSign className="w-5 h-5 text-warning" />
          </div>
          <div className="text-3xl font-bold">
            ${(() => {
              const totalDebt = companies.reduce((sum, c) => sum + (c.financials?.total_debt || 0), 0);
              if (totalDebt >= 1e12) return `${(totalDebt / 1e12).toFixed(2)}T`;
              return `${(totalDebt / 1e9).toFixed(1)}B`;
            })()}
          </div>
          <div className="text-sm text-textSecondary mt-2">
            Across {companies.length} companies
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <span className="text-textSecondary">Avg Debt/Equity</span>
            <TrendingDown className="w-5 h-5 text-primary" />
          </div>
          <div className="text-3xl font-bold">
            {(companies.reduce((sum, c) => sum + (c.debtToEquity || 0), 0) / companies.length).toFixed(2)}
          </div>
          <div className="text-sm text-textSecondary mt-2">
            Industry benchmark: 1.5
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <span className="text-textSecondary">High Risk Companies</span>
            <AlertTriangle className="w-5 h-5 text-danger" />
          </div>
          <div className="text-3xl font-bold text-danger">
            {companies.filter(c => c.zScore < 1.81).length}
          </div>
          <div className="text-sm text-textSecondary mt-2">
            Z-Score &lt; 1.81 (Distress Zone)
          </div>
        </div>
      </div>

      {/* Bubble Chart */}
      <div className="bg-surface rounded-lg p-6 border border-border">
        <h2 className="text-2xl font-bold mb-4">Debt Risk Matrix</h2>
        <p className="text-textSecondary mb-6">
          X-axis: Debt-to-Equity Ratio • Y-axis: Interest Coverage Ratio • Size: Total Debt • Color: Z-Score Risk
        </p>
        
        {loading ? (
          <div className="loading-shimmer h-96 rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height={500}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="Debt/Equity" 
                stroke="#94a3b8"
                label={{ value: 'Debt-to-Equity Ratio', position: 'insideBottom', offset: -10, fill: '#94a3b8' }}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Interest Coverage" 
                stroke="#94a3b8"
                label={{ value: 'Interest Coverage Ratio', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
              />
              <ZAxis type="number" dataKey="z" range={[100, 2000]} name="Debt (B)" />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-surface border border-border rounded-lg p-4">
                        <div className="font-bold text-lg mb-2">{data.name}</div>
                        <div className="text-sm space-y-1">
                          <div>Debt/Equity: {data.x.toFixed(2)}</div>
                          <div>Interest Coverage: {data.y.toFixed(2)}</div>
                          <div>Total Debt: ${data.z.toFixed(1)}B</div>
                          <div>Z-Score: {data.zScore?.toFixed(2) || 'N/A'}</div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter data={bubbleData}>
                {bubbleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColor(entry.zScore)} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Detailed Table */}
      <div className="bg-surface rounded-lg p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Detailed Debt Metrics</h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-textSecondary">Show:</label>
            <select 
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              className="bg-surfaceHover border border-border rounded-lg px-3 py-2 text-textPrimary text-sm"
            >
              <option value="top10">Top 10 Companies</option>
              <option value="all">All Companies ({companies.length})</option>
              <option value="high-risk">High Risk Only</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-surface">
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-textSecondary font-medium">Company</th>
                <th className="text-right py-3 px-4 text-textSecondary font-medium">Total Debt</th>
                <th className="text-right py-3 px-4 text-textSecondary font-medium">Debt/Equity</th>
                <th className="text-right py-3 px-4 text-textSecondary font-medium">Interest Coverage</th>
                <th className="text-right py-3 px-4 text-textSecondary font-medium">Z-Score</th>
                <th className="text-right py-3 px-4 text-textSecondary font-medium">Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {companies
                .filter(company => {
                  if (tableFilter === 'all') return true;
                  if (tableFilter === 'high-risk') return company.zScore && company.zScore < 1.81;
                  return true;
                })
                .slice(0, tableFilter === 'top10' ? 10 : undefined)
                .map((company) => (
                <tr key={company.id} className="border-b border-border hover:bg-surfaceHover transition-colors">
                  <td className="py-4 px-4">
                    <div className="font-semibold">{company.name}</div>
                    <div className="text-sm text-textSecondary">{company.symbol}</div>
                  </td>
                  <td className="text-right py-4 px-4">
                    ${company.financials?.total_debt ? (company.financials.total_debt / 1e9).toFixed(1) : '0'}B
                  </td>
                  <td className="text-right py-4 px-4">
                    <span className={company.debtToEquity > 2 ? 'text-danger' : ''}>
                      {company.debtToEquity?.toFixed(2) || 'N/A'}
                    </span>
                  </td>
                  <td className="text-right py-4 px-4">
                    <span className={company.interestCoverage < 3 ? 'text-warning' : ''}>
                      {company.interestCoverage?.toFixed(2) || 'N/A'}
                    </span>
                  </td>
                  <td className="text-right py-4 px-4">
                    <span className={
                      !company.zScore ? 'text-textSecondary' :
                      company.zScore > 2.99 ? 'text-success' :
                      company.zScore >= 1.81 ? 'text-warning' :
                      'text-danger'
                    }>
                      {company.zScore?.toFixed(2) || 'N/A'}
                    </span>
                  </td>
                  <td className="text-right py-4 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      !company.zScore ? 'bg-surface text-textSecondary' :
                      company.zScore > 2.99 ? 'bg-success/20 text-success' :
                      company.zScore >= 1.81 ? 'bg-warning/20 text-warning' :
                      'bg-danger/20 text-danger'
                    }`}>
                      {!company.zScore ? 'N/A' :
                       company.zScore > 2.99 ? 'Low Risk' :
                       company.zScore >= 1.81 ? 'Moderate' :
                       'High Risk'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
