import { calculateZScore, calculateDebtToEquity, calculateInterestCoverage, normalizeToScale } from './calculations.js';

// Calculate Big Lie Index (0-100)
// Higher score = Higher systemic risk
export function calculateBigLieIndex(metrics) {
  const {
    debtRisk = 0,
    valuationRisk = 0,
    macroRisk = 0,
    correlationRisk = 0,
    btcLiquidationRisk = 0,
    capitalFlightScore = 0
  } = metrics;
  
  // Weighted formula
  const index = 
    (0.25 * debtRisk) +
    (0.20 * valuationRisk) +
    (0.20 * macroRisk) +
    (0.15 * correlationRisk) +
    (0.10 * btcLiquidationRisk) +
    (0.10 * capitalFlightScore);
  
  return parseFloat(index.toFixed(2));
}

// Calculate Debt Risk Score (0-100)
export function calculateDebtRisk(financials, marketCap) {
  const zScore = calculateZScore(financials, marketCap);
  const debtToEquity = calculateDebtToEquity(financials.totalDebt, financials.totalEquity);
  const interestCoverage = calculateInterestCoverage(financials.ebit, financials.interestExpense);
  
  // Z-Score component (inverted - lower Z = higher risk)
  let zScoreRisk = 0;
  if (zScore < 1.81) zScoreRisk = 100;
  else if (zScore < 2.99) zScoreRisk = 50;
  else zScoreRisk = normalizeToScale(5 - zScore, 0, 3) * 0.2; // Low risk if > 2.99
  
  // Debt-to-Equity component
  let debtEquityRisk = 0;
  if (debtToEquity === null) debtEquityRisk = 50;
  else if (debtToEquity > 2.5) debtEquityRisk = 100;
  else if (debtToEquity > 1.5) debtEquityRisk = 70;
  else if (debtToEquity > 1.0) debtEquityRisk = 40;
  else debtEquityRisk = normalizeToScale(debtToEquity, 0, 1) * 0.2;
  
  // Interest Coverage component (inverted)
  let interestCoverageRisk = 0;
  if (interestCoverage === null) interestCoverageRisk = 50;
  else if (interestCoverage < 1.5) interestCoverageRisk = 100;
  else if (interestCoverage < 3.0) interestCoverageRisk = 60;
  else if (interestCoverage < 5.0) interestCoverageRisk = 30;
  else interestCoverageRisk = 10;
  
  // Weighted average
  const debtRisk = (zScoreRisk * 0.5) + (debtEquityRisk * 0.3) + (interestCoverageRisk * 0.2);
  
  return parseFloat(debtRisk.toFixed(2));
}

// Calculate Valuation Risk Score (0-100)
export function calculateValuationRisk(peRatio, marketCapToGDP) {
  // P/E Ratio component
  let peRisk = 0;
  if (peRatio > 40) peRisk = 100;
  else if (peRatio > 30) peRisk = 80;
  else if (peRatio > 25) peRisk = 60;
  else if (peRatio > 20) peRisk = 40;
  else peRisk = normalizeToScale(peRatio, 10, 20) * 0.4;
  
  // Market Cap to GDP (Buffett Indicator) component
  let buffettRisk = 0;
  if (marketCapToGDP > 200) buffettRisk = 100;
  else if (marketCapToGDP > 150) buffettRisk = 80;
  else if (marketCapToGDP > 120) buffettRisk = 60;
  else if (marketCapToGDP > 100) buffettRisk = 40;
  else buffettRisk = normalizeToScale(marketCapToGDP, 50, 100) * 0.4;
  
  const valuationRisk = (peRisk * 0.6) + (buffettRisk * 0.4);
  
  return parseFloat(valuationRisk.toFixed(2));
}

// Calculate Macro Risk Score (0-100)
export function calculateMacroRisk(macroData) {
  const {
    YIELD_CURVE_SPREAD = 0,
    VIX = 15,
    CORPORATE_BOND_SPREAD = 1.0,
    FED_FUNDS_RATE = 5.0
  } = macroData;
  
  // Yield Curve Inversion (2Y > 10Y is bad)
  let yieldCurveRisk = 0;
  if (YIELD_CURVE_SPREAD < -0.5) yieldCurveRisk = 100;
  else if (YIELD_CURVE_SPREAD < -0.2) yieldCurveRisk = 80;
  else if (YIELD_CURVE_SPREAD < 0) yieldCurveRisk = 60;
  else if (YIELD_CURVE_SPREAD < 0.5) yieldCurveRisk = 30;
  else yieldCurveRisk = 10;
  
  // VIX (Volatility)
  let vixRisk = 0;
  if (VIX > 40) vixRisk = 100;
  else if (VIX > 30) vixRisk = 80;
  else if (VIX > 25) vixRisk = 60;
  else if (VIX > 20) vixRisk = 40;
  else vixRisk = normalizeToScale(VIX, 10, 20) * 0.4;
  
  // Corporate Bond Spread (higher = stress)
  let spreadRisk = 0;
  if (CORPORATE_BOND_SPREAD > 4.0) spreadRisk = 100;
  else if (CORPORATE_BOND_SPREAD > 3.0) spreadRisk = 80;
  else if (CORPORATE_BOND_SPREAD > 2.0) spreadRisk = 60;
  else if (CORPORATE_BOND_SPREAD > 1.5) spreadRisk = 40;
  else spreadRisk = normalizeToScale(CORPORATE_BOND_SPREAD, 0.5, 1.5) * 0.4;
  
  // Fed Rate (high rates = refinancing risk)
  let rateRisk = 0;
  if (FED_FUNDS_RATE > 6.0) rateRisk = 90;
  else if (FED_FUNDS_RATE > 5.0) rateRisk = 70;
  else if (FED_FUNDS_RATE > 4.0) rateRisk = 50;
  else if (FED_FUNDS_RATE > 3.0) rateRisk = 30;
  else rateRisk = 10;
  
  const macroRisk = 
    (yieldCurveRisk * 0.35) +
    (vixRisk * 0.30) +
    (spreadRisk * 0.20) +
    (rateRisk * 0.15);
  
  return parseFloat(macroRisk.toFixed(2));
}

// Calculate Correlation Risk Score (0-100)
export function calculateCorrelationRisk(avgCorrelation, maxCorrelation) {
  // High correlation = contagion risk
  let avgRisk = 0;
  if (avgCorrelation > 0.85) avgRisk = 100;
  else if (avgCorrelation > 0.75) avgRisk = 80;
  else if (avgCorrelation > 0.65) avgRisk = 60;
  else if (avgCorrelation > 0.55) avgRisk = 40;
  else avgRisk = normalizeToScale(avgCorrelation, 0.3, 0.55) * 0.4;
  
  let maxRisk = 0;
  if (maxCorrelation > 0.95) maxRisk = 100;
  else if (maxCorrelation > 0.90) maxRisk = 80;
  else if (maxCorrelation > 0.85) maxRisk = 60;
  else maxRisk = normalizeToScale(maxCorrelation, 0.7, 0.85) * 0.6;
  
  const correlationRisk = (avgRisk * 0.6) + (maxRisk * 0.4);
  
  return parseFloat(correlationRisk.toFixed(2));
}

// Calculate BTC Liquidation Risk (0-100)
export function calculateBTCLiquidationRisk(btcHoldings, currentBTCPrice, totalDebt) {
  if (!btcHoldings || btcHoldings.btcAmount === 0) return 0;
  
  const { btcAmount, avgPurchasePrice } = btcHoldings;
  const currentValue = btcAmount * currentBTCPrice;
  const costBasis = btcAmount * avgPurchasePrice;
  const unrealizedPnL = currentValue - costBasis;
  const unrealizedPnLPercent = (unrealizedPnL / costBasis) * 100;
  
  // Calculate distance to liquidation price (assume 30% buffer)
  const liquidationPrice = avgPurchasePrice * 0.7;
  const distanceToLiquidation = ((currentBTCPrice - liquidationPrice) / currentBTCPrice) * 100;
  
  // BTC as % of debt
  const btcToDebtRatio = totalDebt > 0 ? (currentValue / totalDebt) * 100 : 0;
  
  let risk = 0;
  
  // Distance to liquidation risk
  if (distanceToLiquidation < 10) risk += 50;
  else if (distanceToLiquidation < 20) risk += 40;
  else if (distanceToLiquidation < 30) risk += 25;
  else risk += 10;
  
  // BTC exposure relative to debt
  if (btcToDebtRatio > 100) risk += 50; // BTC > debt = extreme exposure
  else if (btcToDebtRatio > 50) risk += 30;
  else if (btcToDebtRatio > 25) risk += 15;
  else risk += 5;
  
  return Math.min(100, risk);
}

// Calculate Capital Flight Score (0-100)
// Higher score = More capital fleeing to Bitcoin
export function calculateCapitalFlightScore(techOutflow, btcInflow, decouplingScore) {
  // Normalize flows (in billions)
  const techOutflowBn = Math.abs(techOutflow) / 1e9;
  const btcInflowBn = btcInflow / 1e9;
  
  // Check if flows are correlated (tech out = btc in)
  const flowRatio = btcInflowBn / Math.max(techOutflowBn, 0.1);
  
  let flowScore = 0;
  if (flowRatio > 0.8) flowScore = 100; // Strong rotation
  else if (flowRatio > 0.6) flowScore = 80;
  else if (flowRatio > 0.4) flowScore = 60;
  else if (flowRatio > 0.2) flowScore = 40;
  else flowScore = 20;
  
  // Factor in decoupling score
  const capitalFlightScore = (flowScore * 0.6) + (decouplingScore * 0.4);
  
  return parseFloat(capitalFlightScore.toFixed(2));
}

// Calculate BTC Decoupling Score (0-100)
// Higher score = BTC acting as safe haven (good for BTC holders)
export function calculateDecouplingScore(btcTechCorrelation, btcDominance, vix, btcPrice) {
  // Inverse correlation component (negative correlation = decoupling)
  let correlationScore = 0;
  if (btcTechCorrelation < -0.5) correlationScore = 100;
  else if (btcTechCorrelation < -0.3) correlationScore = 80;
  else if (btcTechCorrelation < -0.1) correlationScore = 60;
  else if (btcTechCorrelation < 0.1) correlationScore = 40;
  else if (btcTechCorrelation < 0.3) correlationScore = 20;
  else correlationScore = 0;
  
  // BTC Dominance (higher = flight to safety in crypto)
  let dominanceScore = 0;
  if (btcDominance > 60) dominanceScore = 100;
  else if (btcDominance > 55) dominanceScore = 80;
  else if (btcDominance > 50) dominanceScore = 60;
  else if (btcDominance > 45) dominanceScore = 40;
  else dominanceScore = 20;
  
  // VIX divergence (VIX up, BTC up = safe haven)
  let vixScore = vix > 30 ? 80 : vix > 25 ? 60 : vix > 20 ? 40 : 20;
  
  const decouplingScore = 
    (correlationScore * 0.50) +
    (dominanceScore * 0.30) +
    (vixScore * 0.20);
  
  return parseFloat(decouplingScore.toFixed(2));
}

// Interpret Big Lie Index
export function interpretBigLieIndex(index) {
  if (index >= 75) return { 
    level: 'Critical', 
    message: '🔴 SYSTEMIC CRISIS RISK - Multiple red flags detected',
    color: 'red',
    action: 'URGENT: Review positions, consider hedging'
  };
  if (index >= 60) return { 
    level: 'High', 
    message: '🟠 ELEVATED RISK - Significant warning signs present',
    color: 'orange',
    action: 'Monitor closely, prepare contingency plans'
  };
  if (index >= 40) return { 
    level: 'Moderate', 
    message: '🟡 MODERATE RISK - Some concerns detected',
    color: 'yellow',
    action: 'Stay vigilant, review risk metrics regularly'
  };
  return { 
    level: 'Low', 
    message: '🟢 LOW RISK - Markets appear stable',
    color: 'green',
    action: 'Continue normal operations'
  };
}

export default {
  calculateBigLieIndex,
  calculateDebtRisk,
  calculateValuationRisk,
  calculateMacroRisk,
  calculateCorrelationRisk,
  calculateBTCLiquidationRisk,
  calculateCapitalFlightScore,
  calculateDecouplingScore,
  interpretBigLieIndex
};
