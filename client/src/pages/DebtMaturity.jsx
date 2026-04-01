import { useEffect, useState, useRef } from 'react';
import { Calendar, AlertTriangle, DollarSign, Clock } from 'lucide-react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import QuarterlyBreakdown from '../components/QuarterlyBreakdown';

export default function DebtMaturity() {
  const [timeline, setTimeline] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [debtWall, setDebtWall] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyMaturities, setCompanyMaturities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [periodView, setPeriodView] = useState('quarter'); // 'month' or 'quarter'
  const [viewMode, setViewMode] = useState('current'); // 'current' or 'historical'
  const [historicalData, setHistoricalData] = useState([]);
  const [historicalLoading, setHistoricalLoading] = useState(false);
  const [dateRange, setDateRange] = useState('future'); // 'future', 'all', 'custom'
  const [startYear, setStartYear] = useState(2000);
  const [endYear, setEndYear] = useState(2030);
  const [companyFilter, setCompanyFilter] = useState('all'); // 'all' or 'top10'
  const hasFetched = useRef(false);

  useEffect(() => {
    // Prevent double fetch in React StrictMode
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchMaturityData();
    }
  }, []);

  useEffect(() => {
    if (periodView !== 'quarter' && debtWall.length > 0) {
      fetchMaturityData();
    }
  }, [periodView]);

  useEffect(() => {
    if (selectedCompany) {
      fetchCompanyMaturities(selectedCompany);
    }
  }, [selectedCompany]);

  const fetchMaturityData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build debt wall URL with date range and company filter parameters
      let debtWallUrl = `/api/debt-maturity/debt-wall?period=${periodView}&dateRange=${dateRange}&companyFilter=${companyFilter}`;
      if (dateRange === 'custom') {
        debtWallUrl += `&startYear=${startYear}&endYear=${endYear}`;
      }
      
      const [timelineRes, upcomingRes, wallRes] = await Promise.all([
        axios.get('/api/debt-maturity/timeline'),
        axios.get('/api/debt-maturity/upcoming?months=24'),
        axios.get(debtWallUrl)
      ]);
      
      setTimeline(timelineRes.data);
      setUpcoming(upcomingRes.data);
      setDebtWall(wallRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching maturity data:', error);
      setError(`Failed to load debt maturity data: ${error.response?.data?.error || error.message}`);
      setLoading(false);
    }
  };

  const fetchCompanyMaturities = async (symbol) => {
    try {
      console.log('🏨 Fetching debt maturity data from smart cache...');
      
      // First check data freshness
      try {
        const statusRes = await axios.get('/api/stocks/data-status');
        console.log('📊 Data freshness:', statusRes.data.summary);
      } catch (statusError) {
        console.log('Could not check data status:', statusError.message);
      }
      
      const response = await axios.get(`/api/debt-maturity/company/${symbol}`);
      setCompanyMaturities(response.data);
    } catch (error) {
      console.error('Error fetching company maturities:', error);
    }
  };

  const fetchHistoricalView = async () => {
    try {
      setHistoricalLoading(true);
      const response = await axios.get('/api/debt-maturity/historical-view?startYear=2020&endYear=2030');
      setHistoricalData(response.data);
      setHistoricalLoading(false);
    } catch (error) {
      console.error('Error fetching historical view:', error);
      setHistoricalLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'historical' && historicalData.length === 0) {
      fetchHistoricalView();
    }
  }, [viewMode]);

  const totalUpcoming = upcoming.reduce((sum, m) => sum + parseFloat(m.amount), 0);
  const criticalPeriods = debtWall.filter(w => w.riskLevel === 'CRITICAL' || w.riskLevel === 'HIGH').length;

  const getRiskColor = (level) => {
    switch (level) {
      case 'CRITICAL': return '#ef4444';
      case 'HIGH': return '#f59e0b';
      case 'MEDIUM': return '#eab308';
      default: return '#10b981';
    }
  };

  if (loading && debtWall.length === 0) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Debt Maturity Timeline</h1>
          <p className="text-textSecondary mt-1 md:mt-2 text-sm md:text-base">
            Track when corporate debt comes due and assess refinancing risk
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <span className="ml-4 text-lg">Loading debt maturity data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Debt Maturity Timeline</h1>
          <p className="text-textSecondary mt-1 md:mt-2 text-sm md:text-base">
            Track when corporate debt comes due and assess refinancing risk
          </p>
        </div>
        <div className="bg-danger/10 border border-danger rounded-lg p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-6 h-6 text-danger mr-3" />
            <h2 className="text-xl font-semibold text-danger">Unable to Load Data</h2>
          </div>
          <p className="text-textSecondary mb-4">{error}</p>
          <button 
            onClick={fetchMaturityData}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/80 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (debtWall.length === 0 && !loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Debt Maturity Timeline</h1>
          <p className="text-textSecondary mt-1 md:mt-2 text-sm md:text-base">
            Track when corporate debt comes due and assess refinancing risk
          </p>
        </div>
        <div className="bg-warning/10 border border-warning rounded-lg p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-6 h-6 text-warning mr-3" />
            <h2 className="text-xl font-semibold text-warning">No Maturity Data Available</h2>
          </div>
          <p className="text-textSecondary mb-4">
            The debt maturity schedule is empty. This data needs to be seeded first.
          </p>
          <p className="text-textSecondary text-sm">
            Run: <code className="bg-surface px-2 py-1 rounded">npm run seed:maturity</code> on the server
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Debt Maturity Timeline</h1>
        <p className="text-textSecondary mt-1 md:mt-2 text-sm md:text-base">
          Track when corporate debt comes due and assess refinancing risk
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
        <div className="bg-surface rounded-lg p-4 md:p-5 lg:p-6 border border-border">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <span className="text-textSecondary text-xs md:text-sm truncate pr-2">Next 24 Months</span>
            <Clock className="w-4 md:w-5 h-4 md:h-5 text-warning flex-shrink-0" />
          </div>
          <div className="text-2xl md:text-3xl font-bold truncate">
            ${(totalUpcoming / 1e9).toFixed(1)}B
          </div>
          <div className="text-xs md:text-sm text-textSecondary mt-1 md:mt-2">
            Debt coming due
          </div>
        </div>

        <div className="bg-surface rounded-lg p-4 md:p-5 lg:p-6 border border-border">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <span className="text-textSecondary text-xs md:text-sm truncate pr-2">Upcoming Maturities</span>
            <Calendar className="w-4 md:w-5 h-4 md:h-5 text-primary flex-shrink-0" />
          </div>
          <div className="text-2xl md:text-3xl font-bold">{upcoming.length}</div>
          <div className="text-xs md:text-sm text-textSecondary mt-1 md:mt-2">
            Individual debt instruments
          </div>
        </div>

        <div className="bg-surface rounded-lg p-4 md:p-5 lg:p-6 border border-danger">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <span className="text-textSecondary text-xs md:text-sm truncate pr-2">Critical Periods</span>
            <AlertTriangle className="w-4 md:w-5 h-4 md:h-5 text-danger flex-shrink-0" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-danger">{criticalPeriods}</div>
          <div className="text-xs md:text-sm text-danger mt-1 md:mt-2 truncate">
            High concentration quarters
          </div>
        </div>

        <div className="bg-surface rounded-lg p-4 md:p-5 lg:p-6 border border-border">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <span className="text-textSecondary text-xs md:text-sm truncate pr-2">Companies at Risk</span>
            <DollarSign className="w-4 md:w-5 h-4 md:h-5 text-warning flex-shrink-0" />
          </div>
          <div className="text-2xl md:text-3xl font-bold">
            {new Set(upcoming.map(u => u.symbol)).size}
          </div>
          <div className="text-xs md:text-sm text-textSecondary mt-1 md:mt-2">
            With near-term debt
          </div>
        </div>
      </div>

      {/* Current Data Summary */}
      {debtWall.length > 0 && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <div className="font-semibold text-primary mb-1">
                Current {periodView === 'month' ? 'Monthly' : 'Quarterly'} Breakdown
              </div>
              <div className="text-sm text-textSecondary">
                {debtWall.length} {periodView === 'month' ? 'months' : 'quarters'} with upcoming maturities • 
                Peak period: {new Date(debtWall.reduce((max, item) => 
                  item.totalAmount > max.totalAmount ? item : max, debtWall[0]
                )?.period).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} with $
                {(debtWall.reduce((max, item) => 
                  item.totalAmount > max.totalAmount ? item : max, debtWall[0]
                )?.totalAmount / 1e9).toFixed(1)}B
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debt Wall Chart */}
      <div className="bg-surface rounded-lg p-6 border border-border">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Debt Wall Analysis</h2>
              <p className="text-textSecondary mt-1">
                Concentration of debt maturities - spikes indicate refinancing pressure
              </p>
            </div>
            
            {/* Period Toggle Buttons */}
            <div className="flex gap-2 bg-surfaceHover rounded-lg p-1">
              <button
                onClick={() => setPeriodView('month')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  periodView === 'month'
                    ? 'bg-primary text-white'
                    : 'text-textSecondary hover:text-textPrimary'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setPeriodView('quarter')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  periodView === 'quarter'
                    ? 'bg-primary text-white'
                    : 'text-textSecondary hover:text-textPrimary'
                }`}
              >
                Quarterly
              </button>
            </div>
          </div>

          {/* Date Range and Company Filter Controls */}
          <div className="flex items-center gap-4 p-4 bg-surfaceHover rounded-lg flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-textSecondary">Time Range:</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-surface border border-border rounded-lg px-3 py-2 text-textPrimary text-sm"
              >
                <option value="future">Future Only (Current Date +)</option>
                <option value="all">All Time (2000-2030)</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {dateRange === 'custom' && (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-textSecondary">From:</label>
                  <input
                    type="number"
                    min="2000"
                    max="2030"
                    value={startYear}
                    onChange={(e) => setStartYear(parseInt(e.target.value))}
                    className="bg-surface border border-border rounded-lg px-3 py-2 text-textPrimary text-sm w-24"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-textSecondary">To:</label>
                  <input
                    type="number"
                    min="2000"
                    max="2030"
                    value={endYear}
                    onChange={(e) => setEndYear(parseInt(e.target.value))}
                    className="bg-surface border border-border rounded-lg px-3 py-2 text-textPrimary text-sm w-24"
                  />
                </div>
                <button
                  onClick={() => fetchMaturityData()}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-all text-sm font-semibold"
                >
                  Apply Range
                </button>
              </>
            )}

            {dateRange === 'all' && (
              <button
                onClick={() => {
                  setStartYear(2000);
                  setEndYear(2030);
                  fetchMaturityData();
                }}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-all text-sm font-semibold"
              >
                Load All Historical Data
              </button>
            )}

            {/* Company Filter Toggle */}
            <div className="flex items-center gap-2 ml-auto">
              <label className="text-sm font-semibold text-textSecondary">Companies:</label>
              <div className="flex gap-2 bg-surface rounded-lg p-1">
                <button
                  onClick={() => {
                    setCompanyFilter('all');
                    setTimeout(() => fetchMaturityData(), 100);
                  }}
                  className={`px-3 py-1 rounded-lg transition-all text-sm ${
                    companyFilter === 'all'
                      ? 'bg-primary text-white'
                      : 'text-textSecondary hover:text-textPrimary'
                  }`}
                >
                  All Companies
                </button>
                <button
                  onClick={() => {
                    setCompanyFilter('top10');
                    setTimeout(() => fetchMaturityData(), 100);
                  }}
                  className={`px-3 py-1 rounded-lg transition-all text-sm ${
                    companyFilter === 'top10'
                      ? 'bg-primary text-white'
                      : 'text-textSecondary hover:text-textPrimary'
                  }`}
                >
                  Top 10 Only
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="loading-shimmer h-96 rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={debtWall}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis 
                dataKey="period" 
                stroke="#94a3b8"
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', 
                  periodView === 'month' 
                    ? { month: 'short', year: '2-digit' }
                    : { month: 'short', year: 'numeric' }
                )}
              />
              <YAxis 
                stroke="#94a3b8"
                tickFormatter={(value) => `$${(value / 1e9).toFixed(0)}B`}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const companies = data.symbols || [];
                    const top10 = companies.slice(0, 10);
                    const remaining = companies.length - 10;
                    
                    return (
                      <div className="bg-surface border border-border rounded-lg p-4 max-w-md">
                        <div className="font-bold mb-2">
                          {new Date(data.period).toLocaleDateString('en-US', 
                            periodView === 'month'
                              ? { month: 'long', year: 'numeric' }
                              : { month: 'long', year: 'numeric' }
                          )}
                        </div>
                        <div className="text-sm space-y-1 mb-3">
                          <div>Amount: ${(data.totalAmount / 1e9).toFixed(2)}B</div>
                          <div>Maturities: {data.maturityCount}</div>
                          <div>Companies: {data.companyCount}</div>
                          <div>Avg Rate: {data.avgRate?.toFixed(2)}%</div>
                          <div className={`font-semibold ${
                            data.riskLevel === 'CRITICAL' ? 'text-danger' :
                            data.riskLevel === 'HIGH' ? 'text-warning' :
                            'text-textPrimary'
                          }`}>
                            Risk: {data.riskLevel}
                          </div>
                        </div>
                        
                        {companies.length > 0 && (
                          <div className="border-t border-border pt-2 mt-2">
                            <div className="text-xs font-semibold text-textSecondary mb-1">
                              TOP 10 COMPANIES:
                            </div>
                            <div className="text-xs text-textSecondary">
                              {top10.join(', ')}
                            </div>
                            {remaining > 0 && (
                              <div className="text-xs text-primary mt-1">
                                +{remaining} more companies
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="totalAmount">
                {debtWall.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getRiskColor(entry.riskLevel)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Quarterly Breakdown Table */}
      {debtWall.length > 0 && periodView === 'quarter' && (
        <QuarterlyBreakdown 
          data={debtWall.map(item => {
            const date = new Date(item.period);
            const year = date.getFullYear();
            const quarter = Math.ceil((date.getMonth() + 1) / 3);
            return {
              quarterLabel: `Q${quarter} ${year}`,
              maturityCount: item.maturityCount,
              totalAmount: item.totalAmount,
              companies: item.symbols || []
            };
          })}
        />
      )}

      {/* Annual Timeline */}
      <div className="bg-surface rounded-lg p-6 border border-border">
        <h2 className="text-2xl font-bold mb-4">Annual Maturity Schedule</h2>
        
        <div className="space-y-4">
          {timeline.map((year) => (
            <div key={year.year} className="bg-surfaceHover rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold">{year.year}</h3>
                  <p className="text-textSecondary">
                    ${(year.totalAmount / 1e9).toFixed(1)}B across {year.companies.length} companies
                  </p>
                </div>
                {year.year <= new Date().getFullYear() + 2 && (
                  <span className="px-3 py-1 bg-warning/20 text-warning rounded-lg text-sm font-semibold">
                    ⚠️ NEAR TERM
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {year.companies.map((company) => (
                  <div
                    key={company.symbol}
                    className="bg-surface rounded-lg p-4 border border-border hover:border-primary/50 transition-all cursor-pointer"
                    onClick={() => setSelectedCompany(company.symbol)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-semibold">{company.name}</div>
                        <div className="text-sm text-textSecondary">{company.symbol}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">${(company.amount / 1e9).toFixed(2)}B</div>
                        <div className="text-sm text-textSecondary">{company.debtCount} notes</div>
                      </div>
                    </div>
                    <div className="text-xs text-textSecondary mt-2">
                      Avg Rate: {company.avgRate?.toFixed(2)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Company Detail Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedCompany(null)}>
          <div className="bg-surface rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{selectedCompany} Debt Schedule</h2>
              <button 
                onClick={() => setSelectedCompany(null)}
                className="text-textSecondary hover:text-textPrimary"
              >
                ✕
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-textSecondary font-medium">Debt Type</th>
                    <th className="text-right py-3 px-4 text-textSecondary font-medium">Amount</th>
                    <th className="text-right py-3 px-4 text-textSecondary font-medium">Maturity Date</th>
                    <th className="text-right py-3 px-4 text-textSecondary font-medium">Rate</th>
                    <th className="text-right py-3 px-4 text-textSecondary font-medium">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {companyMaturities.map((maturity) => (
                    <tr key={maturity.id} className="border-b border-border hover:bg-surfaceHover">
                      <td className="py-4 px-4">
                        <div className="font-semibold">{maturity.debt_type}</div>
                        {maturity.is_convertible && (
                          <div className="text-xs text-primary">Convertible @ ${maturity.conversion_price}</div>
                        )}
                      </td>
                      <td className="text-right py-4 px-4">
                        ${(maturity.amount / 1e9).toFixed(2)}B
                      </td>
                      <td className="text-right py-4 px-4">
                        {new Date(maturity.maturity_date).toLocaleDateString()}
                      </td>
                      <td className="text-right py-4 px-4">
                        {maturity.interest_rate?.toFixed(2)}%
                      </td>
                      <td className="text-right py-4 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          maturity.refinancing_risk === 'CRITICAL' ? 'bg-danger/20 text-danger' :
                          maturity.refinancing_risk === 'HIGH' ? 'bg-warning/20 text-warning' :
                          maturity.refinancing_risk === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-success/20 text-success'
                        }`}>
                          {maturity.refinancing_risk || 'LOW'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
