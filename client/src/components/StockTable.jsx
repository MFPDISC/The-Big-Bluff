import { TrendingUp, TrendingDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function StockTable({ stocks }) {
  const [enrichedStocks, setEnrichedStocks] = useState([]);

  useEffect(() => {
    if (stocks && stocks.length > 0) {
      enrichStockData();
    }
  }, [stocks]);

  const enrichStockData = async () => {
    try {
      const enriched = await Promise.all(
        stocks.map(async (stock) => {
          try {
            const financials = await axios.get(`/api/stocks/financials/${stock.symbol}`);
            return {
              ...stock,
              zScore: financials.data.metrics.zScore,
              debtToEquity: financials.data.metrics.debtToEquity,
              interestCoverage: financials.data.metrics.interestCoverage,
              cashOnHand: parseFloat(financials.data.financials.cash_on_hand) || null,
              totalCash: parseFloat(financials.data.financials.total_cash) || null,
              totalDebt: parseFloat(financials.data.financials.total_debt) || null
            };
          } catch (error) {
            return stock;
          }
        })
      );
      setEnrichedStocks(enriched);
    } catch (error) {
      console.error('Error enriching stock data:', error);
      setEnrichedStocks(stocks);
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
    if (zScore > 2.99) return 'Low';
    if (zScore >= 1.81) return 'Medium';
    return 'High';
  };

  const displayStocks = enrichedStocks.length > 0 ? enrichedStocks : stocks;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-textSecondary font-medium">Symbol</th>
            <th className="text-right py-3 px-4 text-textSecondary font-medium">Price</th>
            <th className="text-right py-3 px-4 text-textSecondary font-medium">Change</th>
            <th className="text-right py-3 px-4 text-textSecondary font-medium">Cash On Hand</th>
            <th className="text-right py-3 px-4 text-textSecondary font-medium">Debt</th>
            <th className="text-right py-3 px-4 text-textSecondary font-medium">Net Position</th>
            <th className="text-right py-3 px-4 text-textSecondary font-medium">Z-Score</th>
            <th className="text-right py-3 px-4 text-textSecondary font-medium">Risk</th>
          </tr>
        </thead>
        <tbody>
          {displayStocks.map((stock) => (
            <tr
              key={stock.symbol}
              className="border-b border-border hover:bg-surfaceHover transition-colors"
            >
              <td className="py-4 px-4">
                <div className="font-semibold">{stock.symbol}</div>
              </td>
              <td className="text-right py-4 px-4">
                <div className="font-semibold">${stock.price?.toFixed(2)}</div>
              </td>
              <td className="text-right py-4 px-4">
                <div className={`flex items-center justify-end gap-1 ${
                  stock.changePercent >= 0 ? 'text-success' : 'text-danger'
                }`}>
                  {stock.changePercent >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>{Math.abs(stock.changePercent)?.toFixed(2)}%</span>
                </div>
              </td>
              <td className="text-right py-4 px-4">
                <div className="text-success font-semibold">
                  {stock.cashOnHand ? `$${(stock.cashOnHand / 1e9).toFixed(1)}B` : 'N/A'}
                </div>
              </td>
              <td className="text-right py-4 px-4">
                <div className="text-danger font-semibold">
                  {stock.totalDebt ? `$${(stock.totalDebt / 1e9).toFixed(1)}B` : 'N/A'}
                </div>
              </td>
              <td className="text-right py-4 px-4">
                <div className={`font-semibold ${
                  stock.cashOnHand && stock.totalDebt && (stock.cashOnHand - stock.totalDebt) > 0 ? 'text-success' : 'text-danger'
                }`}>
                  {stock.cashOnHand && stock.totalDebt
                    ? `$${((stock.cashOnHand - stock.totalDebt) / 1e9).toFixed(1)}B`
                    : 'N/A'}
                </div>
              </td>
              <td className="text-right py-4 px-4">
                <div className={getRiskColor(stock.zScore)}>
                  {stock.zScore?.toFixed(2) || 'N/A'}
                </div>
              </td>
              <td className="text-right py-4 px-4">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  getRiskLabel(stock.zScore) === 'Low' ? 'bg-success/20 text-success' :
                  getRiskLabel(stock.zScore) === 'Medium' ? 'bg-warning/20 text-warning' :
                  getRiskLabel(stock.zScore) === 'High' ? 'bg-danger/20 text-danger' :
                  'bg-surface text-textSecondary'
                }`}>
                  {getRiskLabel(stock.zScore)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
