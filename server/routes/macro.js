import express from 'express';
import axios from 'axios';
import { query } from '../db/connection.js';
import { fetchAllMacroIndicators, fetchGDPHistory, fetchInterestRateHistory, fetchYieldCurve } from '../services/macroData.js';

const router = express.Router();

// Get all current macro indicators
router.get('/', async (req, res) => {
  try {
    const indicators = await fetchAllMacroIndicators();
    res.json(indicators);
  } catch (error) {
    console.error('Error fetching macro indicators:', error);
    res.status(500).json({ error: 'Failed to fetch macro indicators' });
  }
});

// Get US National Debt (MUST be before /:indicator catch-all)
router.get('/us-debt', async (req, res) => {
  const usPopulation = 335000000;
  const taxpayers = 157000000;
  
  try {
    const FRED_API_KEY = process.env.FRED_API_KEY;
    
    if (FRED_API_KEY) {
      // Fetch REAL data from FRED
      const debtResponse = await axios.get('https://api.stlouisfed.org/fred/series/observations', {
        params: {
          series_id: 'GFDEBTN',
          api_key: FRED_API_KEY,
          file_type: 'json',
          limit: 2,
          sort_order: 'desc'
        }
      });
      
      if (debtResponse.data.observations && debtResponse.data.observations.length >= 2) {
        const latest = parseFloat(debtResponse.data.observations[0].value) * 1e6;
        const previous = parseFloat(debtResponse.data.observations[1].value) * 1e6;
        const change24h = (latest - previous) / 30;
        
        return res.json({
          total: latest,
          perCitizen: latest / usPopulation,
          perTaxpayer: latest / taxpayers,
          change24h: Math.abs(change24h),
          lastUpdated: debtResponse.data.observations[0].date,
          source: 'FRED API (Real)'
        });
      }
    }
    
    // Fallback to mock data
    const totalDebt = 34e12;
    res.json({
      total: totalDebt,
      perCitizen: totalDebt / usPopulation,
      perTaxpayer: totalDebt / taxpayers,
      change24h: 8e9,
      lastUpdated: new Date().toISOString(),
      source: 'Mock Data'
    });
  } catch (error) {
    console.error('Error fetching US debt:', error);
    const totalDebt = 34e12;
    res.json({
      total: totalDebt,
      perCitizen: totalDebt / usPopulation,
      perTaxpayer: totalDebt / taxpayers,
      change24h: 8e9,
      lastUpdated: new Date().toISOString(),
      source: 'Mock Data (Error Fallback)'
    });
  }
});

// Get yield curve
router.get('/yield-curve', async (req, res) => {
  try {
    const yieldCurve = await fetchYieldCurve();
    res.json(yieldCurve);
  } catch (error) {
    console.error('Error fetching yield curve:', error);
    res.status(500).json({ error: 'Failed to fetch yield curve' });
  }
});

// Get GDP history
router.get('/history/gdp', async (req, res) => {
  try {
    const { years = 10 } = req.query;
    const history = await fetchGDPHistory(parseInt(years));
    res.json(history);
  } catch (error) {
    console.error('Error fetching GDP history:', error);
    res.status(500).json({ error: 'Failed to fetch GDP history' });
  }
});

// Get interest rate history
router.get('/history/rates', async (req, res) => {
  try {
    const { days = 365 } = req.query;
    const history = await fetchInterestRateHistory(parseInt(days));
    res.json(history);
  } catch (error) {
    console.error('Error fetching rate history:', error);
    res.status(500).json({ error: 'Failed to fetch rate history' });
  }
});

// Get historical US debt from 2000 onwards
router.get('/history/us-debt', async (req, res) => {
  try {
    const FRED_API_KEY = process.env.FRED_API_KEY;
    
    if (!FRED_API_KEY) {
      // Return mock historical data if no API key
      const mockData = generateMockDebtHistory();
      return res.json(mockData);
    }
    
    // Fetch from FRED API starting from 2000
    const debtResponse = await axios.get('https://api.stlouisfed.org/fred/series/observations', {
      params: {
        series_id: 'GFDEBTN',
        api_key: FRED_API_KEY,
        file_type: 'json',
        observation_start: '2000-01-01',
        sort_order: 'asc'
      }
    });
    
    if (debtResponse.data.observations) {
      const formattedData = debtResponse.data.observations
        .filter(obs => obs.value !== '.')
        .map(obs => ({
          date: obs.date,
          value: parseFloat(obs.value) * 1e6, // Convert millions to actual value
          valueInTrillions: parseFloat(obs.value) / 1e6 // For display
        }));
      
      return res.json(formattedData);
    }
    
    res.json(generateMockDebtHistory());
  } catch (error) {
    console.error('Error fetching historical US debt:', error);
    res.json(generateMockDebtHistory());
  }
});

// Helper function to generate mock historical debt data
function generateMockDebtHistory() {
  const data = [];
  const startYear = 2000;
  const endYear = 2024;
  
  // Real approximate values for key years
  const keyPoints = {
    2000: 5.7,    // Dot-com bubble
    2001: 5.8,
    2002: 6.2,
    2003: 6.8,
    2004: 7.4,
    2005: 7.9,
    2006: 8.5,
    2007: 9.0,    // Pre-financial crisis
    2008: 10.0,   // Financial crisis begins
    2009: 11.9,   // Crisis peak
    2010: 13.6,
    2011: 14.8,
    2012: 16.1,
    2013: 16.7,
    2014: 17.8,
    2015: 18.2,
    2016: 19.6,
    2017: 20.2,
    2018: 21.5,
    2019: 22.7,
    2020: 27.7,   // COVID-19 pandemic
    2021: 28.4,
    2022: 30.9,
    2023: 33.2,
    2024: 36.0
  };
  
  for (let year = startYear; year <= endYear; year++) {
    // Generate quarterly data
    for (let quarter = 1; quarter <= 4; quarter++) {
      const baseValue = keyPoints[year] || 5;
      const month = quarter * 3;
      const date = `${year}-${String(month).padStart(2, '0')}-01`;
      const value = baseValue * 1e12; // Convert to actual value
      
      data.push({
        date,
        value,
        valueInTrillions: baseValue
      });
    }
  }
  
  return data;
}

// Get Dollar Index (DXY) current value
router.get('/dxy/current', async (req, res) => {
  try {
    // Try Yahoo Finance for DXY data
    const response = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/DX-Y.NYB');
    const data = response.data.chart.result[0];
    const currentPrice = data.meta.regularMarketPrice;
    const previousClose = data.meta.previousClose;
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;
    
    res.json({
      value: currentPrice,
      change: change,
      changePercent: changePercent,
      previousClose: previousClose,
      timestamp: new Date(),
      source: 'Yahoo Finance'
    });
  } catch (error) {
    console.error('Error fetching DXY:', error);
    res.json({
      value: 104.25, // Mock DXY value
      change: 0.15,
      changePercent: 0.14,
      previousClose: 104.10,
      timestamp: new Date(),
      source: 'Mock Data'
    });
  }
});

// Get Dollar Index historical data
router.get('/dxy/history', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    // Try to get historical data from Yahoo Finance
    const period1 = Math.floor(startDate.getTime() / 1000);
    const period2 = Math.floor(endDate.getTime() / 1000);
    
    const response = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/DX-Y.NYB', {
      params: {
        period1: period1,
        period2: period2,
        interval: '1d'
      }
    });
    
    const data = response.data.chart.result[0];
    const timestamps = data.timestamp;
    const closes = data.indicators.quote[0].close;
    
    const historicalData = timestamps.map((timestamp, index) => ({
      date: new Date(timestamp * 1000).toISOString().split('T')[0],
      value: closes[index]
    })).filter(item => item.value !== null);
    
    res.json({
      data: historicalData,
      period: `${days} days`,
      timestamp: new Date(),
      source: 'Yahoo Finance'
    });
  } catch (error) {
    console.error('Error fetching DXY history:', error);
    
    // Generate mock historical data
    const mockData = [];
    const baseValue = 104.25;
    for (let i = parseInt(req.query.days || 30); i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const randomVariation = (Math.random() - 0.5) * 2; // ±1 point variation
      mockData.push({
        date: date.toISOString().split('T')[0],
        value: baseValue + randomVariation
      });
    }
    
    res.json({
      data: mockData,
      period: `${req.query.days || 30} days`,
      timestamp: new Date(),
      source: 'Mock Data'
    });
  }
});

// Get Dollar strength analysis
router.get('/dxy/strength', async (req, res) => {
  try {
    // Get current DXY
    const dxyResponse = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/DX-Y.NYB');
    const dxyData = dxyResponse.data.chart.result[0];
    const currentDXY = dxyData.meta.regularMarketPrice;
    
    // Calculate strength metrics
    const dxyStrength = {
      current: currentDXY,
      level: getDXYStrengthLevel(currentDXY),
      trend: getDXYTrend(currentDXY),
      impact: getDollarImpactAnalysis(currentDXY)
    };
    
    res.json({
      ...dxyStrength,
      timestamp: new Date(),
      source: 'Yahoo Finance'
    });
  } catch (error) {
    console.error('Error fetching dollar strength:', error);
    res.json({
      current: 104.25,
      level: 'Strong',
      trend: 'Rising',
      impact: {
        stocks: 'Negative pressure on exports',
        bonds: 'Supportive for Treasury demand',
        commodities: 'Bearish for gold and oil',
        emerging: 'Pressure on EM currencies'
      },
      timestamp: new Date(),
      source: 'Mock Data'
    });
  }
});

// Get Dollar Index risk assessment
router.get('/dxy/risk', async (req, res) => {
  try {
    // Get current DXY data
    const dxyResponse = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/DX-Y.NYB');
    const dxyData = dxyResponse.data.chart.result[0];
    const currentDXY = dxyData.meta.regularMarketPrice;
    const change = dxyData.meta.regularMarketPrice - dxyData.meta.previousClose;
    const changePercent = (change / dxyData.meta.previousClose) * 100;
    
    // Calculate DXY risk score (0-100)
    let riskScore = 0;
    
    // 1. Extreme strength risk (very high DXY can cause global instability)
    if (currentDXY > 115) riskScore += 40;
    else if (currentDXY > 110) riskScore += 30;
    else if (currentDXY > 105) riskScore += 20;
    else if (currentDXY > 100) riskScore += 10;
    else riskScore += 5;
    
    // 2. Volatility risk
    const absChangePercent = Math.abs(changePercent);
    if (absChangePercent > 2) riskScore += 30;
    else if (absChangePercent > 1) riskScore += 20;
    else if (absChangePercent > 0.5) riskScore += 10;
    else riskScore += 5;
    
    // 3. Global impact risk (strong dollar hurts emerging markets)
    if (currentDXY > 108) riskScore += 30; // High EM stress
    else if (currentDXY > 104) riskScore += 15;
    else riskScore += 5;
    
    const riskLevel = riskScore > 70 ? 'High' : riskScore > 40 ? 'Medium' : 'Low';
    
    res.json({
      riskScore: Math.min(riskScore, 100),
      riskLevel,
      metrics: {
        currentDXY,
        change,
        changePercent,
        strengthLevel: getDXYStrengthLevel(currentDXY),
        volatility: absChangePercent,
        globalImpact: currentDXY > 105 ? 'High' : 'Moderate'
      },
      indicators: [
        `DXY at ${currentDXY.toFixed(2)} (${getDXYStrengthLevel(currentDXY)})`,
        `Daily change: ${changePercent.toFixed(2)}%`,
        `Global impact: ${currentDXY > 105 ? 'High stress on EM' : 'Moderate pressure'}`
      ],
      timestamp: new Date(),
      source: 'Yahoo Finance'
    });
  } catch (error) {
    console.error('Error calculating DXY risk:', error);
    res.json({
      riskScore: 45,
      riskLevel: 'Medium',
      metrics: {
        currentDXY: 104.25,
        change: 0.15,
        changePercent: 0.14,
        strengthLevel: 'Strong',
        volatility: 0.14,
        globalImpact: 'Moderate'
      },
      indicators: [
        'DXY at 104.25 (Strong)',
        'Daily change: 0.14%',
        'Global impact: Moderate pressure'
      ],
      timestamp: new Date(),
      source: 'Mock Data'
    });
  }
});

// Helper functions for DXY analysis
function getDXYStrengthLevel(dxy) {
  if (dxy > 110) return 'Very Strong';
  if (dxy > 105) return 'Strong';
  if (dxy > 100) return 'Moderate';
  if (dxy > 95) return 'Weak';
  return 'Very Weak';
}

function getDXYTrend(dxy) {
  // Simplified trend analysis - in production would use historical data
  if (dxy > 104) return 'Rising';
  if (dxy > 102) return 'Stable';
  return 'Declining';
}

function getDollarImpactAnalysis(dxy) {
  const isStrong = dxy > 105;
  return {
    stocks: isStrong ? 'Negative pressure on exports' : 'Supportive for multinationals',
    bonds: isStrong ? 'Supportive for Treasury demand' : 'Reduced foreign demand',
    commodities: isStrong ? 'Bearish for gold and oil' : 'Bullish for commodities',
    emerging: isStrong ? 'Pressure on EM currencies' : 'Relief for emerging markets'
  };
}

// Get specific indicator (catch-all route - must be last)
router.get('/:indicator', async (req, res) => {
  try {
    const { indicator } = req.params;
    const result = await query(
      'SELECT * FROM macro_data WHERE indicator_name = $1 ORDER BY date DESC LIMIT 1',
      [indicator.toUpperCase()]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Indicator not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching indicator:', error);
    res.status(500).json({ error: 'Failed to fetch indicator' });
  }
});

export default router;
