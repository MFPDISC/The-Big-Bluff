import express from 'express';
import { fetchHistoricalPrices } from '../services/stockData.js';
import { fetchBitcoinHistorical } from '../services/cryptoData.js';
import { calculateCorrelation, calculateRollingCorrelation } from '../services/calculations.js';
import { query } from '../db/connection.js';

const router = express.Router();

// Get correlation matrix for all tech stocks
router.get('/matrix', async (req, res) => {
  try {
    const { days = 90 } = req.query;
    
    // Get all companies
    const companies = await query('SELECT id, symbol, name FROM companies');
    const symbols = companies.rows.map(c => c.symbol);
    
    // Fetch historical data for all stocks
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const historicalData = await Promise.all(
      symbols.map(async (symbol) => {
        const history = await fetchHistoricalPrices(symbol, startDate);
        return {
          symbol,
          prices: history.map(h => h.close)
        };
      })
    );
    
    // Calculate correlation matrix
    const matrix = {};
    
    for (let i = 0; i < historicalData.length; i++) {
      const stock1 = historicalData[i];
      matrix[stock1.symbol] = {};
      
      for (let j = 0; j < historicalData.length; j++) {
        const stock2 = historicalData[j];
        
        // Align arrays
        const minLength = Math.min(stock1.prices.length, stock2.prices.length);
        const prices1 = stock1.prices.slice(-minLength);
        const prices2 = stock2.prices.slice(-minLength);
        
        const correlation = calculateCorrelation(prices1, prices2);
        matrix[stock1.symbol][stock2.symbol] = correlation;
      }
    }
    
    res.json({
      matrix,
      period: days,
      companies: companies.rows
    });
  } catch (error) {
    console.error('Error calculating correlation matrix:', error);
    res.status(500).json({ error: 'Failed to calculate correlation matrix' });
  }
});

// Get rolling correlations between two assets
router.get('/rolling', async (req, res) => {
  try {
    const { symbol1, symbol2, days = 365, window = 30 } = req.query;
    
    if (!symbol1 || !symbol2) {
      return res.status(400).json({ error: 'Both symbols required' });
    }
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Fetch historical data
    const [history1, history2] = await Promise.all([
      symbol1.toUpperCase() === 'BTC' ? 
        fetchBitcoinHistorical(parseInt(days)) : 
        fetchHistoricalPrices(symbol1.toUpperCase(), startDate),
      symbol2.toUpperCase() === 'BTC' ? 
        fetchBitcoinHistorical(parseInt(days)) : 
        fetchHistoricalPrices(symbol2.toUpperCase(), startDate)
    ]);
    
    const prices1 = symbol1.toUpperCase() === 'BTC' ? 
      history1.map(h => h.price) : 
      history1.map(h => h.close);
    const prices2 = symbol2.toUpperCase() === 'BTC' ? 
      history2.map(h => h.price) : 
      history2.map(h => h.close);
    
    // Calculate rolling correlations
    const rollingCorrelations = [];
    const windowSize = parseInt(window);
    
    for (let i = windowSize; i < Math.min(prices1.length, prices2.length); i++) {
      const slice1 = prices1.slice(i - windowSize, i);
      const slice2 = prices2.slice(i - windowSize, i);
      
      const correlation = calculateCorrelation(slice1, slice2);
      
      rollingCorrelations.push({
        date: history1[i]?.date || history2[i]?.date,
        correlation
      });
    }
    
    res.json({
      symbol1: symbol1.toUpperCase(),
      symbol2: symbol2.toUpperCase(),
      window: windowSize,
      data: rollingCorrelations
    });
  } catch (error) {
    console.error('Error calculating rolling correlation:', error);
    res.status(500).json({ error: 'Failed to calculate rolling correlation' });
  }
});

// Get average correlation (contagion risk indicator)
router.get('/average', async (req, res) => {
  try {
    const { days = 90 } = req.query;
    
    // Get all companies
    const companies = await query('SELECT symbol FROM companies');
    const symbols = companies.rows.map(c => c.symbol);
    
    // Fetch historical data
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const historicalData = await Promise.all(
      symbols.map(async (symbol) => {
        const history = await fetchHistoricalPrices(symbol, startDate);
        return history.map(h => h.close);
      })
    );
    
    // Calculate all pairwise correlations
    const correlations = [];
    
    for (let i = 0; i < historicalData.length; i++) {
      for (let j = i + 1; j < historicalData.length; j++) {
        const minLength = Math.min(historicalData[i].length, historicalData[j].length);
        const prices1 = historicalData[i].slice(-minLength);
        const prices2 = historicalData[j].slice(-minLength);
        
        const correlation = calculateCorrelation(prices1, prices2);
        correlations.push(correlation);
      }
    }
    
    // Calculate statistics
    const avgCorrelation = correlations.reduce((a, b) => a + b, 0) / correlations.length;
    const maxCorrelation = Math.max(...correlations);
    const minCorrelation = Math.min(...correlations);
    
    res.json({
      average: avgCorrelation.toFixed(4),
      max: maxCorrelation.toFixed(4),
      min: minCorrelation.toFixed(4),
      interpretation: avgCorrelation > 0.75 ? 'High contagion risk' : 
                      avgCorrelation > 0.60 ? 'Moderate contagion risk' : 
                      'Low contagion risk',
      period: days
    });
  } catch (error) {
    console.error('Error calculating average correlation:', error);
    res.status(500).json({ error: 'Failed to calculate average correlation' });
  }
});

export default router;
