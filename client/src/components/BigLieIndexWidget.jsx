import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Activity, TrendingUp, AlertTriangle, ChevronRight } from 'lucide-react';

export default function BigLieIndexWidget() {
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRiskData();
  }, []);

  const fetchRiskData = async () => {
    try {
      const response = await axios.get('/api/bubble/risk-index');
      setRiskData(response.data);
    } catch (error) {
      console.error('Error fetching risk index:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score) => {
    if (score <= 30) return 'success';
    if (score <= 60) return 'warning';
    if (score <= 80) return 'orange-500';
    return 'danger';
  };

  const getRiskIcon = (score) => {
    if (score <= 30) return '🟢';
    if (score <= 60) return '🟡';
    if (score <= 80) return '🟠';
    return '🔴';
  };

  const getRiskMessage = (score) => {
    if (score <= 30) return 'Markets appear stable';
    if (score <= 60) return 'Some warning signs present';
    if (score <= 80) return 'Multiple red flags detected';
    return 'Extreme risk conditions';
  };

  if (loading) {
    return (
      <div className="bg-surface rounded-lg p-6 border border-border">
        <div className="loading-shimmer h-24 rounded-lg" />
      </div>
    );
  }

  const riskColor = getRiskColor(riskData?.compositeScore);
  const riskIcon = getRiskIcon(riskData?.compositeScore);
  const riskMessage = getRiskMessage(riskData?.compositeScore);

  return (
    <div 
      onClick={() => navigate('/bubble-watch')}
      className={`bg-gradient-to-r from-${riskColor}/20 via-${riskColor}/10 to-${riskColor}/20 rounded-lg p-6 border-2 border-${riskColor} cursor-pointer hover:border-${riskColor} hover:shadow-lg transition-all`}
    >
      <div className="flex items-center justify-between">
        {/* Left: Title and Score */}
        <div className="flex items-center gap-6">
          <Activity className={`w-8 h-8 text-${riskColor} flex-shrink-0`} />
          <div>
            <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
              {riskIcon} The Big Bluff Index
            </h3>
            <div className={`text-5xl font-bold text-${riskColor}`}>
              {riskData?.compositeScore}
              <span className="text-xl text-textSecondary ml-2">/ 100</span>
            </div>
          </div>
        </div>

        {/* Center: Risk Level */}
        <div className="flex flex-col items-center px-8 border-l border-r border-border">
          <div className={`text-3xl font-bold text-${riskColor} mb-2`}>
            {riskData?.riskLevel?.toUpperCase()}
          </div>
          <div className="text-sm text-textSecondary">
            {riskMessage}
          </div>
        </div>

        {/* Right: Component Scores */}
        <div className="flex items-center gap-6">
          <div className="grid grid-cols-5 gap-3">
            {riskData?.components && Object.entries(riskData.components).slice(0, 5).map(([key, component]) => (
              <div key={key} className="text-center">
                <div className="text-xs text-textSecondary uppercase mb-1">
                  {key.slice(0, 3)}
                </div>
                <div className={`text-2xl font-bold text-${getRiskColor(component.score)}`}>
                  {component.score}
                </div>
              </div>
            ))}
          </div>
          <ChevronRight className="w-6 h-6 text-textSecondary ml-4" />
        </div>
      </div>

      {/* Bottom: Quick Info */}
      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
        <div className="flex items-center gap-6 text-textSecondary">
          <span>• Composite score from 5 indicators</span>
          <span>• Real-time market valuation</span>
          <span>• Click for full analysis</span>
        </div>
        <div className="text-xs text-textSecondary">
          Updated: {new Date(riskData?.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
