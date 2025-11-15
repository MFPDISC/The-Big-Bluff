// Bubble Risk Scoring System
// Combines multiple indicators to create a composite 0-100 risk score

import { fetchBubbleIndicators } from './macroData.js';
import { fetchVIX } from './stockData.js';
import axios from 'axios';

// Dollar Index data source
const YAHOO_FINANCE_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

/**
 * Calculate Composite Bubble Risk Index (0-100)
 * 
 * Components:
 * - 16.67% Valuation (CAPE, Buffett Indicator)
 * - 16.67% Leverage (HY Spread, Debt levels)
 * - 16.67% Sentiment (VIX, Fear/Greed proxy)
 * - 16.67% Momentum (Rate of change)
 * - 16.67% Systemic Risk (Yield curve, correlations)
 * - 16.67% DXY Risk (Dollar strength, volatility, global impact)
 * 
 * Score Interpretation:
 * 0-30: Safe
 * 31-60: Caution
 * 61-80: Warning
 * 81-100: Bubble Territory
 */
async function calculateBubbleRiskIndex() {
  try {
    const bubbleIndicators = await fetchBubbleIndicators();
    
    // 1. VALUATION SCORE (0-100) - 16.67% weight
    const valuationScore = calculateValuationScore(bubbleIndicators);
    
    // 2. LEVERAGE SCORE (0-100) - 16.67% weight
    const leverageScore = calculateLeverageScore(bubbleIndicators);
    
    // 3. SENTIMENT SCORE (0-100) - 16.67% weight
    const sentimentScore = await calculateSentimentScore();
    
    // 4. MOMENTUM SCORE (0-100) - 16.67% weight
    const momentumScore = calculateMomentumScore(bubbleIndicators);
    
    // 5. SYSTEMIC RISK SCORE (0-100) - 16.67% weight
    const systemicScore = calculateSystemicScore(bubbleIndicators);
    
    // 6. DXY RISK SCORE (0-100) - 16.67% weight
    const dxyScore = await calculateDXYRiskScore();
    
    // Calculate weighted composite score
    const compositeScore = (
      valuationScore * 0.1667 +
      leverageScore * 0.1667 +
      sentimentScore * 0.1667 +
      momentumScore * 0.1667 +
      systemicScore * 0.1667 +
      dxyScore * 0.1667
    );
    
    return {
      compositeScore: Math.round(compositeScore),
      riskLevel: getRiskLevel(compositeScore),
      components: {
        valuation: {
          score: Math.round(valuationScore),
          weight: 16.67,
          indicators: ['CAPE Ratio', 'Buffett Indicator']
        },
        leverage: {
          score: Math.round(leverageScore),
          weight: 16.67,
          indicators: ['HY Bond Spread', 'Corporate Debt']
        },
        sentiment: {
          score: Math.round(sentimentScore),
          weight: 16.67,
          indicators: ['VIX', 'Market Sentiment']
        },
        momentum: {
          score: Math.round(momentumScore),
          weight: 16.67,
          indicators: ['Rate of Change', 'Volume Trends']
        },
        systemic: {
          score: Math.round(systemicScore),
          weight: 16.67,
          indicators: ['Yield Curve', 'Correlations']
        },
        dxy: {
          score: Math.round(dxyScore),
          weight: 16.67,
          indicators: ['Dollar Strength', 'DXY Volatility', 'Global Impact']
        }
      },
      indicators: bubbleIndicators,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error calculating bubble risk:', error);
    return {
      compositeScore: 50,
      riskLevel: 'Caution',
      components: {},
      indicators: {},
      timestamp: new Date()
    };
  }
}

// Calculate Valuation Score (CAPE + Buffett Indicator)
function calculateValuationScore(indicators) {
  const { cape, buffettIndicator } = indicators;
  
  // CAPE Score (0-100)
  // <15 = 0, 15-20 = 20, 20-25 = 40, 25-30 = 60, 30-35 = 80, >35 = 100
  let capeScore = 0;
  if (cape.value < 15) capeScore = 0;
  else if (cape.value < 20) capeScore = 20;
  else if (cape.value < 25) capeScore = 40;
  else if (cape.value < 30) capeScore = 60;
  else if (cape.value < 35) capeScore = 80;
  else capeScore = 100;
  
  // Buffett Indicator Score (0-100)
  // <100 = 0, 100-125 = 25, 125-150 = 50, 150-175 = 75, >200 = 100
  let buffettScore = 0;
  if (buffettIndicator.value < 100) buffettScore = 0;
  else if (buffettIndicator.value < 125) buffettScore = 25;
  else if (buffettIndicator.value < 150) buffettScore = 50;
  else if (buffettIndicator.value < 175) buffettScore = 75;
  else if (buffettIndicator.value < 200) buffettScore = 90;
  else buffettScore = 100;
  
  // Average the two
  return (capeScore + buffettScore) / 2;
}

// Calculate Leverage Score (HY Spread)
function calculateLeverageScore(indicators) {
  const { hySpread } = indicators;
  
  // High Yield Spread Score (inverted - lower spread = higher risk)
  // >6% = 0 (safe), 4-6% = 40, 3-4% = 70, <3% = 100 (danger)
  let spreadScore = 0;
  if (hySpread.value > 6) spreadScore = 0;
  else if (hySpread.value > 4) spreadScore = 40;
  else if (hySpread.value > 3) spreadScore = 70;
  else spreadScore = 100;
  
  return spreadScore;
}

// Calculate Sentiment Score (VIX-based)
async function calculateSentimentScore() {
  try {
    const vix = await fetchVIX();
    const vixValue = vix?.current_price || 15;
    
    // VIX Score (inverted - low VIX = complacency = high risk)
    // >30 = 0 (fear = safe), 20-30 = 30, 15-20 = 50, 10-15 = 75, <10 = 100 (complacency)
    let vixScore = 0;
    if (vixValue > 30) vixScore = 0;
    else if (vixValue > 20) vixScore = 30;
    else if (vixValue > 15) vixScore = 50;
    else if (vixValue > 10) vixScore = 75;
    else vixScore = 100;
    
    return vixScore;
  } catch (error) {
    return 50; // Default moderate risk
  }
}

// Calculate Momentum Score (placeholder - needs historical data)
function calculateMomentumScore(indicators) {
  // For now, use a moderate score
  // In production, this would analyze:
  // - 3mo, 6mo, 1yr returns
  // - Acceleration/deceleration
  // - Volume trends
  return 50;
}

// Calculate Systemic Risk Score (yield curve)
function calculateSystemicScore(indicators) {
  // For now, use moderate score
  // In production, this would analyze:
  // - Yield curve inversion
  // - Asset correlations
  // - Liquidity metrics
  return 50;
}

// Get risk level interpretation
function getRiskLevel(score) {
  if (score <= 30) return 'Safe';
  if (score <= 60) return 'Caution';
  if (score <= 80) return 'Warning';
  return 'Bubble Territory';
}

// Get historical bubble comparisons
function getHistoricalBubbleComparisons(currentIndicators) {
  return {
    dotComBubble2000: {
      cape: 44,
      buffettIndicator: 190,
      description: 'Tech bubble peak - March 2000'
    },
    financialCrisis2008: {
      cape: 27,
      buffettIndicator: 135,
      description: 'Housing bubble peak - October 2007'
    },
    covidBubble2021: {
      cape: 38,
      buffettIndicator: 215,
      description: 'Pandemic stimulus peak - December 2021'
    },
    current: {
      cape: currentIndicators.cape.value,
      buffettIndicator: currentIndicators.buffettIndicator.value,
      description: 'Current market conditions'
    }
  };
}

// DXY Risk Calculation Functions

/**
 * Fetch Dollar Index (DXY) data
 */
async function fetchDXYData() {
  try {
    const response = await axios.get(`${YAHOO_FINANCE_BASE}/DX-Y.NYB`);
    const data = response.data.chart.result[0];
    const currentPrice = data.meta.regularMarketPrice;
    const previousClose = data.meta.previousClose;
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;
    
    return {
      current: currentPrice,
      previousClose: previousClose,
      change: change,
      changePercent: changePercent,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error fetching DXY data:', error.message);
    return {
      current: 104.25,
      previousClose: 104.10,
      change: 0.15,
      changePercent: 0.14,
      timestamp: new Date()
    };
  }
}

/**
 * Calculate DXY Risk Score (0-100)
 * Higher DXY can cause global financial instability
 */
async function calculateDXYRiskScore() {
  try {
    const dxyData = await fetchDXYData();
    const currentDXY = dxyData.current;
    const changePercent = dxyData.changePercent;
    
    let riskScore = 0;
    
    // 1. Extreme strength risk (0-40 points)
    // Very high DXY can cause global instability, EM currency crises
    if (currentDXY > 115) riskScore += 40;
    else if (currentDXY > 110) riskScore += 30;
    else if (currentDXY > 105) riskScore += 20;
    else if (currentDXY > 100) riskScore += 10;
    else riskScore += 5;
    
    // 2. Volatility risk (0-30 points)
    const absChangePercent = Math.abs(changePercent);
    if (absChangePercent > 2) riskScore += 30;
    else if (absChangePercent > 1) riskScore += 20;
    else if (absChangePercent > 0.5) riskScore += 10;
    else riskScore += 5;
    
    // 3. Global impact risk (0-30 points)
    // Strong dollar creates stress in emerging markets and commodities
    if (currentDXY > 108) riskScore += 30; // High EM stress
    else if (currentDXY > 104) riskScore += 15;
    else riskScore += 5;
    
    return Math.min(riskScore, 100);
  } catch (error) {
    console.error('Error calculating DXY risk score:', error);
    return 50; // Default moderate risk
  }
}

/**
 * Get DXY strength level
 */
function getDXYStrengthLevel(dxy) {
  if (dxy > 110) return 'Very Strong';
  if (dxy > 105) return 'Strong';
  if (dxy > 100) return 'Moderate';
  if (dxy > 95) return 'Weak';
  return 'Very Weak';
}

export {
  calculateBubbleRiskIndex,
  getHistoricalBubbleComparisons,
  fetchDXYData,
  calculateDXYRiskScore,
  getDXYStrengthLevel
};
