import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import axios from 'axios';

export default function HistoricalDebtChart() {
  const [debtHistory, setDebtHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDebtHistory();
  }, []);

  const fetchDebtHistory = async () => {
    try {
      const response = await axios.get('/api/macro/history/us-debt');
      setDebtHistory(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching debt history:', error);
      setLoading(false);
    }
  };

  const crisisMarkers = [
    { date: '2000-03-01', label: 'Dot-com Bubble Peak', color: '#f59e0b' },
    { date: '2008-09-01', label: '2008 Financial Crisis', color: '#ef4444' },
    { date: '2020-03-01', label: 'COVID-19 Pandemic', color: '#ef4444' }
  ];

  return (
    <div className="bg-surface rounded-lg p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-danger" />
            US National Debt: Historical Trajectory (2000-2024)
          </h2>
          <p className="text-textSecondary mt-1">
            Tracking debt growth through major economic crises
          </p>
        </div>
      </div>

      {loading ? (
        <div className="loading-shimmer h-96 rounded-lg" />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={debtHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8"
                tickFormatter={(date) => new Date(date).getFullYear()}
                interval={15}
              />
              <YAxis 
                stroke="#94a3b8"
                tickFormatter={(value) => `$${(value / 1e12).toFixed(0)}T`}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-surface border border-border rounded-lg p-4">
                        <div className="font-bold mb-2">
                          {new Date(data.date).toLocaleDateString('en-US', { 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </div>
                        <div className="text-danger text-lg font-semibold">
                          ${data.valueInTrillions.toFixed(2)} Trillion
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              
              {/* Crisis markers */}
              {crisisMarkers.map((marker, idx) => (
                <ReferenceLine 
                  key={idx}
                  x={marker.date} 
                  stroke={marker.color}
                  strokeDasharray="3 3"
                  label={{ 
                    value: marker.label, 
                    position: 'top',
                    fill: marker.color,
                    fontSize: 12
                  }}
                />
              ))}
              
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#ef4444" 
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Key Insights */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                <div className="text-sm font-semibold text-warning">2000-2008</div>
              </div>
              <div className="text-xs text-textSecondary">
                Debt grew from $5.7T to $10T (+75%) during dot-com recovery and pre-crisis expansion
              </div>
            </div>
            
            <div className="bg-danger/10 border border-danger/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-danger" />
                <div className="text-sm font-semibold text-danger">2008-2012</div>
              </div>
              <div className="text-xs text-textSecondary">
                Financial crisis response: Debt surged from $10T to $16.1T (+61%) in just 4 years
              </div>
            </div>
            
            <div className="bg-danger/10 border border-danger/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-danger" />
                <div className="text-sm font-semibold text-danger">2020-2024</div>
              </div>
              <div className="text-xs text-textSecondary">
                COVID response & aftermath: Debt exploded from $22.7T to $36T (+58%) - fastest growth rate
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
