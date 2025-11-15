// Financial calculations and risk metrics

// Calculate Altman Z-Score (bankruptcy predictor)
// Z = 1.2X1 + 1.4X2 + 3.3X3 + 0.6X4 + 1.0X5
// Where:
// X1 = Working Capital / Total Assets
// X2 = Retained Earnings / Total Assets  
// X3 = EBIT / Total Assets
// X4 = Market Cap / Total Liabilities
// X5 = Sales / Total Assets
export function calculateZScore(financials, marketCap) {
  // Convert string values to numbers (database returns strings)
  const currentAssets = parseFloat(financials.currentAssets || financials.current_assets || 0);
  const currentLiabilities = parseFloat(financials.currentLiabilities || financials.current_liabilities || 0);
  const totalAssets = parseFloat(financials.totalAssets || financials.total_assets || 1);
  const totalDebt = parseFloat(financials.totalDebt || financials.total_debt || 0);
  const ebit = parseFloat(financials.ebit || 0);
  const revenue = parseFloat(financials.revenue || 0);
  const totalEquity = parseFloat(financials.totalEquity || financials.total_equity || 0);
  const marketCapNum = parseFloat(marketCap || 0);
  
  // Prevent division by zero
  if (totalAssets === 0) return 0;
  
  const workingCapital = currentAssets - currentLiabilities;
  const totalLiabilities = totalDebt;
  
  // Simplified retained earnings (using equity as proxy)
  const retainedEarnings = totalEquity * 0.7;
  
  // Calculate components
  const X1 = workingCapital / totalAssets;
  const X2 = retainedEarnings / totalAssets;
  const X3 = ebit / totalAssets;
  
  // X4 is the tricky one - use market cap if available, otherwise equity
  // Cap the ratio at 10 to prevent extreme outliers
  let X4 = 5; // Default safe value
  if (totalLiabilities > 0) {
    const equityValue = marketCapNum > 0 ? marketCapNum : totalEquity;
    const ratio = equityValue / totalLiabilities;
    // Cap at 10 to prevent Z-Score explosion
    X4 = Math.min(ratio, 10);
  }
  
  const X5 = revenue / totalAssets;
  
  const zScore = 1.2 * X1 + 1.4 * X2 + 3.3 * X3 + 0.6 * X4 + 1.0 * X5;
  
  return parseFloat(zScore.toFixed(2));
}

// Interpret Z-Score
export function interpretZScore(zScore) {
  if (zScore > 2.99) return { risk: 'Low', zone: 'Safe', color: 'green' };
  if (zScore >= 1.81) return { risk: 'Medium', zone: 'Grey', color: 'yellow' };
  return { risk: 'High', zone: 'Distress', color: 'red' };
}

// Calculate Debt-to-Equity Ratio
export function calculateDebtToEquity(totalDebt, totalEquity) {
  if (totalEquity === 0) return null;
  return parseFloat((totalDebt / totalEquity).toFixed(4));
}

// Calculate Interest Coverage Ratio (ICR)
// ICR = EBIT / Interest Expense
export function calculateInterestCoverage(ebit, interestExpense) {
  if (interestExpense === 0 || interestExpense === null) return null;
  return parseFloat((ebit / interestExpense).toFixed(4));
}

// Calculate Debt Service Coverage Ratio (DSCR)
// DSCR = Operating Income / Total Debt Service
export function calculateDebtServiceCoverage(ebit, totalDebtPayments) {
  if (totalDebtPayments === 0) return null;
  return parseFloat((ebit / totalDebtPayments).toFixed(4));
}

// Calculate correlation between two arrays of values
export function calculateCorrelation(array1, array2) {
  if (array1.length !== array2.length || array1.length === 0) {
    return 0;
  }
  
  const n = array1.length;
  const mean1 = array1.reduce((a, b) => a + b, 0) / n;
  const mean2 = array2.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let sum1Sq = 0;
  let sum2Sq = 0;
  
  for (let i = 0; i < n; i++) {
    const diff1 = array1[i] - mean1;
    const diff2 = array2[i] - mean2;
    numerator += diff1 * diff2;
    sum1Sq += diff1 * diff1;
    sum2Sq += diff2 * diff2;
  }
  
  const denominator = Math.sqrt(sum1Sq * sum2Sq);
  
  if (denominator === 0) return 0;
  
  return parseFloat((numerator / denominator).toFixed(4));
}

// Calculate rolling correlation
export function calculateRollingCorrelation(prices1, prices2, window) {
  if (prices1.length < window || prices2.length < window) {
    return calculateCorrelation(prices1, prices2);
  }
  
  const recent1 = prices1.slice(-window);
  const recent2 = prices2.slice(-window);
  
  return calculateCorrelation(recent1, recent2);
}

// Calculate percentage change
export function calculatePercentChange(oldValue, newValue) {
  if (oldValue === 0) return 0;
  return parseFloat((((newValue - oldValue) / oldValue) * 100).toFixed(2));
}

// Calculate moving average
export function calculateMovingAverage(values, period) {
  if (values.length < period) return null;
  
  const slice = values.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / period;
}

// Calculate standard deviation
export function calculateStandardDeviation(values) {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  
  return Math.sqrt(variance);
}

// Calculate volatility (annualized)
export function calculateVolatility(dailyReturns) {
  const stdDev = calculateStandardDeviation(dailyReturns);
  return stdDev * Math.sqrt(252); // 252 trading days per year
}

// Calculate Value at Risk (VaR) - 95% confidence
export function calculateVaR(returns, confidenceLevel = 0.95) {
  const sorted = [...returns].sort((a, b) => a - b);
  const index = Math.floor((1 - confidenceLevel) * sorted.length);
  return sorted[index] || 0;
}

// Calculate Sharpe Ratio
export function calculateSharpeRatio(returns, riskFreeRate = 0.04) {
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdDev = calculateStandardDeviation(returns);
  
  if (stdDev === 0) return 0;
  
  return (avgReturn - riskFreeRate / 252) / stdDev;
}

// Calculate Beta (relative to market)
export function calculateBeta(stockReturns, marketReturns) {
  const correlation = calculateCorrelation(stockReturns, marketReturns);
  const stockStdDev = calculateStandardDeviation(stockReturns);
  const marketStdDev = calculateStandardDeviation(marketReturns);
  
  if (marketStdDev === 0) return 1;
  
  return correlation * (stockStdDev / marketStdDev);
}

// Normalize value to 0-100 scale
export function normalizeToScale(value, min, max) {
  if (max === min) return 50;
  const normalized = ((value - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, normalized));
}

// Calculate trend direction (-1 down, 0 flat, 1 up)
export function calculateTrend(values, threshold = 0.02) {
  if (values.length < 2) return 0;
  
  const first = values[0];
  const last = values[values.length - 1];
  const change = (last - first) / first;
  
  if (change > threshold) return 1;
  if (change < -threshold) return -1;
  return 0;
}

export default {
  calculateZScore,
  interpretZScore,
  calculateDebtToEquity,
  calculateInterestCoverage,
  calculateDebtServiceCoverage,
  calculateCorrelation,
  calculateRollingCorrelation,
  calculatePercentChange,
  calculateMovingAverage,
  calculateStandardDeviation,
  calculateVolatility,
  calculateVaR,
  calculateSharpeRatio,
  calculateBeta,
  normalizeToScale,
  calculateTrend
};
