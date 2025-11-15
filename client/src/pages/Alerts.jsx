import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get('/api/alerts');
      setAlerts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setLoading(false);
    }
  };

  const resolveAlert = async (id) => {
    try {
      await axios.patch(`/api/alerts/${id}/resolve`);
      fetchAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    return alert.severity === filter;
  });

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-danger" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-warning" />;
      default:
        return <Info className="w-5 h-5 text-primary" />;
    }
  };

  const getSeverityBg = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-danger/10 border-danger';
      case 'warning':
        return 'bg-warning/10 border-warning';
      default:
        return 'bg-primary/10 border-primary';
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Alerts & Warnings</h1>
          <p className="text-textSecondary mt-2">
            Real-time notifications of market risks and anomalies
          </p>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === 'all'
                ? 'bg-primary text-white'
                : 'bg-surface text-textSecondary hover:bg-surfaceHover'
            }`}
          >
            All ({alerts.length})
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === 'critical'
                ? 'bg-danger text-white'
                : 'bg-surface text-textSecondary hover:bg-surfaceHover'
            }`}
          >
            Critical ({alerts.filter(a => a.severity === 'critical').length})
          </button>
          <button
            onClick={() => setFilter('warning')}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === 'warning'
                ? 'bg-warning text-white'
                : 'bg-surface text-textSecondary hover:bg-surfaceHover'
            }`}
          >
            Warning ({alerts.filter(a => a.severity === 'warning').length})
          </button>
          <button
            onClick={() => setFilter('info')}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === 'info'
                ? 'bg-primary text-white'
                : 'bg-surface text-textSecondary hover:bg-surfaceHover'
            }`}
          >
            Info ({alerts.filter(a => a.severity === 'info').length})
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="loading-shimmer h-32 rounded-lg" />
        ) : filteredAlerts.length === 0 ? (
          <div className="bg-surface rounded-lg p-12 border border-border text-center">
            <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">All Clear</h3>
            <p className="text-textSecondary">No active alerts at this time</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-surface rounded-lg p-6 border-2 ${getSeverityBg(alert.severity)} transition-all hover:shadow-lg`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="mt-1">{getSeverityIcon(alert.severity)}</div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                        alert.severity === 'critical' ? 'bg-danger/20 text-danger' :
                        alert.severity === 'warning' ? 'bg-warning/20 text-warning' :
                        'bg-primary/20 text-primary'
                      }`}>
                        {alert.severity}
                      </span>
                      
                      {alert.category && (
                        <span className="text-sm text-textSecondary">
                          {alert.category}
                        </span>
                      )}
                      
                      {alert.symbol && (
                        <span className="text-sm font-semibold text-primary">
                          {alert.symbol}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-textPrimary mb-3">
                      {alert.message}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-textSecondary">
                      <span>{format(new Date(alert.date), 'MMM dd, yyyy HH:mm')}</span>
                      {alert.name && (
                        <span>• {alert.name}</span>
                      )}
                    </div>
                  </div>
                </div>

                {alert.is_active && (
                  <button
                    onClick={() => resolveAlert(alert.id)}
                    className="ml-4 p-2 hover:bg-surfaceHover rounded-lg transition-colors"
                    title="Mark as resolved"
                  >
                    <X className="w-5 h-5 text-textSecondary" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
