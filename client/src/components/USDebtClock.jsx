import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp } from 'lucide-react';
import axios from 'axios';

export default function USDebtClock() {
  const [debt, setDebt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDebt();
    const interval = setInterval(fetchDebt, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const fetchDebt = async () => {
    try {
      const response = await axios.get('/api/macro/us-debt');
      setDebt(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching US debt:', error);
      setLoading(false);
    }
  };

  const formatDebt = (value) => {
    if (!value) return '...';
    return `$${(value / 1e12).toFixed(2)}T`;
  };

  const formatPerCitizen = (value) => {
    if (!value) return '...';
    return `$${(value / 1000).toFixed(0)}K`;
  };

  return (
    <div className="bg-gradient-to-r from-danger/20 via-warning/20 to-danger/20 rounded-lg p-6 border-2 border-danger/50">
      {loading ? (
        <div className="loading-shimmer h-24 rounded-lg" />
      ) : (
        <div className="flex items-center justify-between gap-8">
          {/* Left: Title and Total */}
          <div className="flex items-center gap-6">
            <DollarSign className="w-8 h-8 text-danger flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                🇺🇸 US National Debt
              </h3>
              <div className="text-5xl font-bold text-danger">
                {formatDebt(debt?.total)}
              </div>
            </div>
          </div>

          {/* Center: Per Citizen & Taxpayer */}
          <div className="flex items-center gap-6 border-l border-r border-danger/30 px-6">
            <div className="text-center">
              <div className="text-xs text-textSecondary mb-1">Per Citizen</div>
              <div className="text-2xl font-bold text-warning">
                {formatPerCitizen(debt?.perCitizen)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-textSecondary mb-1">Per Taxpayer</div>
              <div className="text-2xl font-bold text-warning">
                {formatPerCitizen(debt?.perTaxpayer)}
              </div>
            </div>
          </div>

          {/* Right: 24h Change and Info */}
          <div className="text-right">
            {debt?.change24h && (
              <div className="flex items-center gap-2 mb-2 justify-end">
                <TrendingUp className="w-5 h-5 text-danger" />
                <div>
                  <div className="text-xl font-bold text-danger">
                    +${(debt.change24h / 1e9).toFixed(1)}B
                  </div>
                  <div className="text-xs text-textSecondary">in last 24h</div>
                </div>
              </div>
            )}
            <div className="text-xs text-textSecondary mt-3">
              Data from US Treasury • Updated every minute
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
