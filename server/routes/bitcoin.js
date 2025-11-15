import express from 'express';
import { query } from '../db/connection.js';
import { 
  fetchBitcoinPrice, 
  fetchBitcoinHistorical, 
  fetchOnChainMetrics,
  getCorporateBTCExposure,
  fetchBitcoinETFFlows
} from '../services/cryptoData.js';
import { calculateCorrelation } from '../services/calculations.js';

const router = express.Router();

// Get current Bitcoin price
router.get('/price', async (req, res) => {
  try {
    const btcPrice = await fetchBitcoinPrice();
    res.json(btcPrice);
  } catch (error) {
    console.error('Error fetching Bitcoin price:', error);
    res.status(500).json({ error: 'Failed to fetch Bitcoin price' });
  }
});

// Get Bitcoin historical prices
router.get('/history', async (req, res) => {
  try {
    const { days = 90 } = req.query;
    const history = await fetchBitcoinHistorical(parseInt(days));
    res.json(history);
  } catch (error) {
    console.error('Error fetching Bitcoin history:', error);
    res.status(500).json({ error: 'Failed to fetch Bitcoin history' });
  }
});

// Get on-chain metrics
router.get('/onchain', async (req, res) => {
  try {
    const metrics = await fetchOnChainMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching on-chain metrics:', error);
    res.status(500).json({ error: 'Failed to fetch on-chain metrics' });
  }
});

// Get corporate Bitcoin holdings
router.get('/corporate-holdings', async (req, res) => {
  try {
    const companies = await query('SELECT id, symbol, name FROM companies');
    const currentBTCPrice = await fetchBitcoinPrice();
    
    const holdings = companies.rows.map(company => {
      const holding = getCorporateBTCExposure(company.symbol);
      
      if (!holding) return null;
      
      const currentValue = holding.btcAmount * currentBTCPrice.price;
      const costBasis = holding.btcAmount * holding.avgPurchasePrice;
      const unrealizedPnL = currentValue - costBasis;
      const unrealizedPnLPercent = (unrealizedPnL / costBasis) * 100;
      
      return {
        ...company,
        btcAmount: holding.btcAmount,
        avgPurchasePrice: holding.avgPurchasePrice,
        currentValue,
        unrealizedPnL,
        unrealizedPnLPercent,
        currentBTCPrice: currentBTCPrice.price
      };
    }).filter(h => h !== null);
    
    res.json(holdings);
  } catch (error) {
    console.error('Error fetching corporate holdings:', error);
    res.status(500).json({ error: 'Failed to fetch corporate holdings' });
  }
});

// Get specific company's Bitcoin holdings
router.get('/corporate-holdings/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const holding = getCorporateBTCExposure(symbol.toUpperCase());
    
    if (!holding) {
      return res.status(404).json({ error: 'No Bitcoin holdings found for this company' });
    }
    
    const currentBTCPrice = await fetchBitcoinPrice();
    const currentValue = holding.btcAmount * currentBTCPrice.price;
    const costBasis = holding.btcAmount * holding.avgPurchasePrice;
    const unrealizedPnL = currentValue - costBasis;
    const unrealizedPnLPercent = (unrealizedPnL / costBasis) * 100;
    
    res.json({
      symbol: symbol.toUpperCase(),
      ...holding,
      currentValue,
      unrealizedPnL,
      unrealizedPnLPercent,
      currentBTCPrice: currentBTCPrice.price
    });
  } catch (error) {
    console.error('Error fetching company Bitcoin holdings:', error);
    res.status(500).json({ error: 'Failed to fetch holdings' });
  }
});

// Get Bitcoin ETF flows
router.get('/etf-flows', async (req, res) => {
  try {
    const flows = await fetchBitcoinETFFlows();
    res.json(flows);
  } catch (error) {
    console.error('Error fetching ETF flows:', error);
    res.status(500).json({ error: 'Failed to fetch ETF flows' });
  }
});

// Get Bitcoin correlations with tech stocks
router.get('/correlations', async (req, res) => {
  try {
    const { days = 90 } = req.query;
    
    // Fetch Bitcoin history
    const btcHistory = await fetchBitcoinHistorical(parseInt(days));
    const btcPrices = btcHistory.map(h => h.price);
    
    // Fetch all companies
    const companies = await query('SELECT id, symbol, name FROM companies');
    
    // Import stock data service
    const { fetchHistoricalPrices } = await import('../services/stockData.js');
    
    // Calculate correlations
    const correlations = await Promise.all(
      companies.rows.map(async (company) => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        
        const stockHistory = await fetchHistoricalPrices(company.symbol, startDate);
        const stockPrices = stockHistory.map(h => h.close);
        
        // Align arrays (take minimum length)
        const minLength = Math.min(btcPrices.length, stockPrices.length);
        const alignedBTC = btcPrices.slice(-minLength);
        const alignedStock = stockPrices.slice(-minLength);
        
        const correlation = calculateCorrelation(alignedBTC, alignedStock);
        
        return {
          company: {
            id: company.id,
            symbol: company.symbol,
            name: company.name
          },
          correlation,
          period: days
        };
      })
    );
    
    res.json(correlations);
  } catch (error) {
    console.error('Error calculating Bitcoin correlations:', error);
    res.status(500).json({ error: 'Failed to calculate correlations' });
  }
});

export default router;
