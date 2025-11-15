import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

export default function QuarterlyBreakdown({ data }) {
  const [showHistorical, setShowHistorical] = useState(false);
  const currentYear = new Date().getFullYear();
  
  // Filter data to show only current year and forward by default
  const filteredData = showHistorical 
    ? data 
    : data.filter(quarter => {
        const year = parseInt(quarter.quarterLabel.split(' ')[1]);
        return year >= currentYear;
      });

  const getWarningIndicator = (amount, notes) => {
    if (amount > 11e9 || notes >= 5) {
      return { icon: '🔴', color: 'text-danger', bgColor: 'bg-danger/10' };
    }
    if (amount > 8e9 || notes >= 3) {
      return { icon: '⚠️', color: 'text-warning', bgColor: 'bg-warning/10' };
    }
    return { icon: '', color: '', bgColor: '' };
  };

  return (
    <div className="bg-surface rounded-lg p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Quarterly Breakdown</h2>
          <span className="text-sm text-textSecondary">({filteredData.length} quarters)</span>
        </div>
        <button
          onClick={() => setShowHistorical(!showHistorical)}
          className="flex items-center gap-2 px-4 py-2 bg-surfaceHover hover:bg-border rounded-lg transition-all text-sm font-semibold"
        >
          {showHistorical ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Hide Historical Data
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show All Historical ({data.length} quarters)
            </>
          )}
        </button>
      </div>

      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-surface">
            <tr className="border-b-2 border-border">
              <th className="text-left py-3 px-3 text-textSecondary font-semibold">Quarter</th>
              <th className="text-center py-3 px-3 text-textSecondary font-semibold">Notes</th>
              <th className="text-right py-3 px-3 text-textSecondary font-semibold">Amount</th>
              <th className="text-left py-3 px-3 text-textSecondary font-semibold">Companies</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((quarter, index) => {
              const warning = getWarningIndicator(quarter.totalAmount, quarter.maturityCount);
              
              return (
                <tr 
                  key={index}
                  className={`border-b border-border hover:bg-surfaceHover transition-all ${warning.bgColor}`}
                >
                  <td className="py-3 px-3">
                    <div className="font-bold">{quarter.quarterLabel}</div>
                  </td>
                  
                  <td className="text-center py-3 px-3">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-surfaceHover font-semibold text-sm">
                      {quarter.maturityCount}
                    </div>
                  </td>
                  
                  <td className="text-right py-3 px-3">
                    <div className="flex items-center justify-end gap-2">
                      {warning.icon && (
                        <span className="text-lg">{warning.icon}</span>
                      )}
                      <span className={`font-bold ${warning.color || 'text-textPrimary'}`}>
                        ${(quarter.totalAmount / 1e9).toFixed(1)}B
                      </span>
                    </div>
                  </td>
                  
                  <td className="py-3 px-3">
                    <div className="text-xs text-textSecondary">
                      {quarter.companies.slice(0, 10).join(', ')}
                      {quarter.companies.length > 10 && (
                        <span className="text-primary ml-1">
                          +{quarter.companies.length - 10} more
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔴</span>
            <span className="text-textSecondary">Critical Risk (&gt;$11B or 5+ notes)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <span className="text-textSecondary">High Risk (&gt;$8B or 3+ notes)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
