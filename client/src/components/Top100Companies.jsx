import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Search, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import axios from 'axios';

export default function Top100Companies() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('marketCap'); // marketCap, debt, risk

  useEffect(() => {
    if (isExpanded && companies.length === 0) {
      fetchTop100Companies();
    }
  }, [isExpanded]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = companies.filter(c => 
        c.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCompanies(filtered);
    } else {
      setFilteredCompanies(companies);
    }
  }, [searchTerm, companies]);

  const fetchTop100Companies = async () => {
    setLoading(true);
    try {
      const top100Symbols = getTop100Symbols();
      const batchSize = 10;
      const allCompanies = [];
      
      // Fetch in batches to avoid overwhelming the server
      for (let i = 0; i < top100Symbols.length; i += batchSize) {
        const batch = top100Symbols.slice(i, i + batchSize);
        
        const batchResults = await Promise.allSettled(
          batch.map(async (symbol) => {
            try {
              const [priceRes, financialRes] = await Promise.all([
                axios.get(`/api/stocks/price/${symbol}`),
                axios.get(`/api/stocks/financials/${symbol}`)
              ]);
              
              return {
                symbol: symbol,
                name: financialRes.data.company.name,
                price: priceRes.data.price,
                change: priceRes.data.changePercent,
                marketCap: financialRes.data.company.marketCap,
                debt: financialRes.data.financials.total_debt,
                cash: financialRes.data.financials.cash_on_hand,
                zScore: financialRes.data.metrics.zScore,
                debtToEquity: financialRes.data.metrics.debtToEquity
              };
            } catch (error) {
              console.log(`Failed to fetch ${symbol}:`, error.message);
              return null;
            }
          })
        );
        
        // Extract successful results
        const validResults = batchResults
          .filter(result => result.status === 'fulfilled' && result.value !== null)
          .map(result => result.value);
        
        allCompanies.push(...validResults);
        
        // Update UI with progress
        setCompanies([...allCompanies]);
        setFilteredCompanies([...allCompanies]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setLoading(false);
    }
  };

  const sortCompanies = (companies) => {
    const sorted = [...companies];
    switch (sortBy) {
      case 'marketCap':
        return sorted.sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));
      case 'debt':
        return sorted.sort((a, b) => (b.debt || 0) - (a.debt || 0));
      case 'risk':
        return sorted.sort((a, b) => (a.zScore || 999) - (b.zScore || 999));
      default:
        return sorted;
    }
  };

  const getRiskColor = (zScore) => {
    if (!zScore) return 'text-textSecondary';
    if (zScore > 2.99) return 'text-success';
    if (zScore >= 1.81) return 'text-warning';
    return 'text-danger';
  };

  const getRiskLabel = (zScore) => {
    if (!zScore) return 'N/A';
    if (zScore > 2.99) return 'Safe';
    if (zScore >= 1.81) return 'Caution';
    return 'Risk';
  };

  return (
    <div className="bg-surface rounded-lg border border-border">
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-surfaceHover transition-colors"
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-primary" />
          <div className="text-left">
            <h2 className="text-2xl font-bold">Top 100 Companies - Deep Dive</h2>
            <p className="text-textSecondary text-sm mt-1">
              Comprehensive financial data for the largest US companies
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-6 h-6 text-textSecondary" />
        ) : (
          <ChevronDown className="w-6 h-6 text-textSecondary" />
        )}
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="border-t border-border p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <span className="ml-4 text-lg">Loading company data...</span>
            </div>
          ) : (
            <>
              {/* Search and Filter Controls */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-textSecondary" />
                  <input
                    type="text"
                    placeholder="Search by symbol or company name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-surfaceHover border border-border rounded-lg text-textPrimary focus:outline-none focus:border-primary"
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setSortBy('marketCap')}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      sortBy === 'marketCap'
                        ? 'bg-primary text-white'
                        : 'bg-surfaceHover text-textSecondary hover:text-textPrimary'
                    }`}
                  >
                    Market Cap
                  </button>
                  <button
                    onClick={() => setSortBy('debt')}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      sortBy === 'debt'
                        ? 'bg-primary text-white'
                        : 'bg-surfaceHover text-textSecondary hover:text-textPrimary'
                    }`}
                  >
                    Debt
                  </button>
                  <button
                    onClick={() => setSortBy('risk')}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      sortBy === 'risk'
                        ? 'bg-primary text-white'
                        : 'bg-surfaceHover text-textSecondary hover:text-textPrimary'
                    }`}
                  >
                    Risk
                  </button>
                </div>
              </div>

              {/* Compact Table */}
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-surface border-b border-border">
                    <tr>
                      <th className="text-left py-2 px-3 text-textSecondary font-medium">#</th>
                      <th className="text-left py-2 px-3 text-textSecondary font-medium">Symbol</th>
                      <th className="text-left py-2 px-3 text-textSecondary font-medium">Company</th>
                      <th className="text-right py-2 px-3 text-textSecondary font-medium">Price</th>
                      <th className="text-right py-2 px-3 text-textSecondary font-medium">Change</th>
                      <th className="text-right py-2 px-3 text-textSecondary font-medium">Market Cap</th>
                      <th className="text-right py-2 px-3 text-textSecondary font-medium">Debt</th>
                      <th className="text-right py-2 px-3 text-textSecondary font-medium">Cash</th>
                      <th className="text-right py-2 px-3 text-textSecondary font-medium">D/E</th>
                      <th className="text-right py-2 px-3 text-textSecondary font-medium">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortCompanies(filteredCompanies).map((company, index) => (
                      <tr
                        key={company.symbol}
                        className="border-b border-border hover:bg-surfaceHover transition-colors"
                      >
                        <td className="py-2 px-3 text-textSecondary">{index + 1}</td>
                        <td className="py-2 px-3 font-semibold">{company.symbol}</td>
                        <td className="py-2 px-3 text-textSecondary truncate max-w-xs">
                          {company.name}
                        </td>
                        <td className="text-right py-2 px-3">${company.price?.toFixed(2)}</td>
                        <td className="text-right py-2 px-3">
                          <span className={company.change >= 0 ? 'text-success' : 'text-danger'}>
                            {company.change >= 0 ? '+' : ''}{company.change?.toFixed(2)}%
                          </span>
                        </td>
                        <td className="text-right py-2 px-3">
                          ${(company.marketCap / 1e9).toFixed(1)}B
                        </td>
                        <td className="text-right py-2 px-3 text-danger">
                          ${(company.debt / 1e9).toFixed(1)}B
                        </td>
                        <td className="text-right py-2 px-3 text-success">
                          ${(company.cash / 1e9).toFixed(1)}B
                        </td>
                        <td className="text-right py-2 px-3">
                          {company.debtToEquity?.toFixed(2)}
                        </td>
                        <td className="text-right py-2 px-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            getRiskLabel(company.zScore) === 'Safe' ? 'bg-success/20 text-success' :
                            getRiskLabel(company.zScore) === 'Caution' ? 'bg-warning/20 text-warning' :
                            'bg-danger/20 text-danger'
                          }`}>
                            {getRiskLabel(company.zScore)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-center">
                <div className="text-sm text-textSecondary">
                  Showing {filteredCompanies.length} of {companies.length} companies
                </div>
                {companies.length < 100 && (
                  <div className="mt-2 text-xs text-warning">
                    ⚠️ Only {companies.length} companies have financial data available in the database.
                    The full top 100 list requires additional company data to be seeded.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Top 100 US companies by market cap (representative list)
function getTop100Symbols() {
  return [
    // Top 10 Tech Giants
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AVGO', 'ORCL', 'ADBE',
    // More Tech
    'CRM', 'CSCO', 'ACN', 'INTC', 'AMD', 'IBM', 'QCOM', 'TXN', 'INTU', 'NOW',
    // Finance
    'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'BLK', 'SCHW', 'AXP', 'USB',
    // Healthcare
    'UNH', 'JNJ', 'LLY', 'ABBV', 'MRK', 'PFE', 'TMO', 'ABT', 'DHR', 'BMY',
    // Consumer
    'WMT', 'HD', 'PG', 'KO', 'PEP', 'COST', 'MCD', 'NKE', 'SBUX', 'TGT',
    // Industrials
    'BA', 'CAT', 'GE', 'HON', 'UPS', 'RTX', 'LMT', 'DE', 'MMM', 'UNP',
    // Energy
    'XOM', 'CVX', 'COP', 'SLB', 'EOG', 'MPC', 'PSX', 'VLO', 'OXY', 'HAL',
    // Telecom/Media
    'VZ', 'T', 'CMCSA', 'NFLX', 'DIS', 'TMUS', 'CHTR', 'PARA', 'WBD', 'FOXA',
    // Pharma/Biotech
    'GILD', 'AMGN', 'REGN', 'VRTX', 'BIIB', 'ISRG', 'MRNA', 'ILMN', 'ALXN', 'CELG',
    // Retail/E-commerce
    'BABA', 'JD', 'MELI', 'EBAY', 'ETSY', 'W', 'SHOP', 'SQ', 'PYPL', 'V'
  ];
}
