import express from 'express';
import rateLimit from 'express-rate-limit';
import { query } from '../db/connection.js';
import { fetchStockPrice, fetchHistoricalPrices, fetchCompanyFinancials, fetchBatchFinancials, getDataFreshnessReport, fetchSP500, fetchVIX } from '../services/stockData.js';
import { calculateZScore, calculateDebtToEquity, calculateInterestCoverage } from '../services/calculations.js';

const router = express.Router();

const financialsLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 500 : 100,
  message: {
    error: 'Rate limit exceeded for financials endpoints',
    retryAfter: '10 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Get all companies
router.get('/companies', async (req, res) => {
  try {
    const result = await query('SELECT * FROM companies ORDER BY symbol');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// Get current stock prices for all companies
router.get('/prices', async (req, res) => {
  try {
    const companies = await query('SELECT * FROM companies');
    const symbols = companies.rows.map(c => c.symbol);

    const prices = await Promise.all(
      symbols.map(symbol => fetchStockPrice(symbol))
    );

    const validPrices = prices.filter(p => p !== null);

    res.json(validPrices);
  } catch (error) {
    console.error('Error fetching prices:', error);
    res.status(500).json({ error: 'Failed to fetch prices' });
  }
});

// Get price for specific stock
router.get('/price/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const price = await fetchStockPrice(symbol.toUpperCase());

    if (!price) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    res.json(price);
  } catch (error) {
    console.error('Error fetching price:', error);
    res.status(500).json({ error: 'Failed to fetch price' });
  }
});

// Get historical prices
router.get('/history/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { days = 365 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const history = await fetchHistoricalPrices(symbol.toUpperCase(), startDate);

    res.json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
});

// Get company financials with calculations
router.get('/financials/:symbol', financialsLimiter, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { refresh = 'false' } = req.query; // Allow manual refresh
    const forceRefresh = refresh === 'true';

    // Get company ID
    const companyResult = await query(
      'SELECT id, symbol, name, market_cap FROM companies WHERE symbol = $1',
      [symbol.toUpperCase()]
    );

    if (companyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const company = companyResult.rows[0];

    // Fetch latest financials from database or external API
    let financials = await query(
      'SELECT * FROM financials WHERE company_id = $1 ORDER BY year DESC, quarter DESC LIMIT 1',
      [company.id]
    );

    // If no data in DB or force refresh, fetch from API
    if (financials.rows.length === 0 || forceRefresh) {
      const apiFinancials = await fetchCompanyFinancials(symbol.toUpperCase(), forceRefresh);

      // Insert into DB
      await query(
        `INSERT INTO financials 
        (company_id, quarter, year, total_debt, total_equity, cash_on_hand, total_cash, short_term_investments,
         ebit, interest_expense, free_cash_flow, revenue, net_income, total_assets, current_assets, current_liabilities)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (company_id, quarter, year) DO UPDATE SET
        total_debt = EXCLUDED.total_debt,
        total_equity = EXCLUDED.total_equity,
        cash_on_hand = EXCLUDED.cash_on_hand,
        total_cash = EXCLUDED.total_cash,
        short_term_investments = EXCLUDED.short_term_investments,
        ebit = EXCLUDED.ebit,
        interest_expense = EXCLUDED.interest_expense
        RETURNING *`,
        [company.id, apiFinancials.quarter, apiFinancials.year, apiFinancials.totalDebt,
        apiFinancials.totalEquity, apiFinancials.cashOnHand, apiFinancials.totalCash, apiFinancials.shortTermInvestments,
        apiFinancials.ebit, apiFinancials.interestExpense,
        apiFinancials.freeCashFlow, apiFinancials.revenue, apiFinancials.netIncome,
        apiFinancials.totalAssets, apiFinancials.currentAssets, apiFinancials.currentLiabilities]
      );

      financials = await query(
        'SELECT * FROM financials WHERE company_id = $1 ORDER BY year DESC, quarter DESC LIMIT 1',
        [company.id]
      );
    }

    const financial = financials.rows[0];

    // Calculate metrics
    const zScore = calculateZScore(financial, company.market_cap);
    const debtToEquity = calculateDebtToEquity(financial.total_debt, financial.total_equity);
    const interestCoverage = calculateInterestCoverage(financial.ebit, financial.interest_expense);

    res.json({
      company: {
        symbol: company.symbol,
        name: company.name,
        marketCap: company.market_cap
      },
      financials: financial,
      metrics: {
        zScore,
        debtToEquity,
        interestCoverage
      }
    });
  } catch (error) {
    console.error('Error fetching financials:', error);
    res.status(500).json({ error: 'Failed to fetch financials' });
  }
});

// Get S&P 500 data
router.get('/sp500', async (req, res) => {
  try {
    const sp500 = await fetchSP500();
    res.json(sp500);
  } catch (error) {
    console.error('Error fetching S&P 500:', error);
    res.status(500).json({ error: 'Failed to fetch S&P 500' });
  }
});

// Get VIX data
router.get('/vix', async (req, res) => {
  try {
    const vix = await fetchVIX();
    res.json(vix);
  } catch (error) {
    console.error('Error fetching VIX:', error);
    res.status(500).json({ error: 'Failed to fetch VIX' });
  }
});

// Compare multiple stocks
router.post('/compare', async (req, res) => {
  try {
    const { symbols, days = 365 } = req.body;

    if (!symbols || symbols.length === 0) {
      return res.status(400).json({ error: 'Symbols required' });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const histories = await Promise.all(
      symbols.map(async (symbol) => {
        const history = await fetchHistoricalPrices(symbol.toUpperCase(), startDate);
        return { symbol: symbol.toUpperCase(), data: history };
      })
    );

    res.json(histories);
  } catch (error) {
    console.error('Error comparing stocks:', error);
    res.status(500).json({ error: 'Failed to compare stocks' });
  }
});

// Smart batch endpoint - gets all financials efficiently
router.get('/financials-batch', financialsLimiter, async (req, res) => {
  try {
    const { symbols, forceRefresh = 'false' } = req.query;
    const refresh = forceRefresh === 'true';

    let symbolList;
    if (symbols) {
      symbolList = symbols.split(',').map(s => s.trim().toUpperCase());
    } else {
      // Get all companies if no symbols specified
      const companies = await query('SELECT symbol FROM companies ORDER BY symbol');
      symbolList = companies.rows.map(c => c.symbol);
    }

    console.log(`🏨 Batch request for ${symbolList.length} companies (refresh: ${refresh})`);

    const batchResults = await fetchBatchFinancials(symbolList, refresh);

    // Format results with metrics
    const enrichedResults = {};
    for (const [symbol, financials] of Object.entries(batchResults)) {
      if (financials) {
        const company = await query(
          'SELECT id, symbol, name, market_cap FROM companies WHERE symbol = $1',
          [symbol]
        );

        if (company.rows.length > 0) {
          const comp = company.rows[0];
          const zScore = calculateZScore(financials, comp.market_cap);
          const debtToEquity = calculateDebtToEquity(financials.totalDebt, financials.totalEquity);
          const interestCoverage = calculateInterestCoverage(financials.ebit, financials.interestExpense);

          enrichedResults[symbol] = {
            company: {
              symbol: comp.symbol,
              name: comp.name,
              marketCap: comp.market_cap
            },
            financials,
            metrics: {
              zScore,
              debtToEquity,
              interestCoverage
            }
          };
        }
      }
    }

    res.json({
      success: true,
      count: Object.keys(enrichedResults).length,
      data: enrichedResults,
      cached: Object.keys(batchResults).length - Object.keys(enrichedResults).filter(k => !batchResults[k]?.lastUpdated || Date.now() - new Date(batchResults[k].lastUpdated).getTime() < 60000).length
    });
  } catch (error) {
    console.error('Error in batch financials:', error);
    res.status(500).json({ error: 'Failed to fetch batch financials' });
  }
});

// Data freshness report endpoint
router.get('/data-status', async (req, res) => {
  try {
    const report = await getDataFreshnessReport();

    const summary = {
      total: report.length,
      fresh: report.filter(r => r.status === 'FRESH').length,
      aging: report.filter(r => r.status === 'AGING').length,
      stale: report.filter(r => r.status === 'STALE').length,
      missing: report.filter(r => r.status === 'MISSING').length
    };

    res.json({
      summary,
      companies: report,
      recommendations: {
        needsRefresh: report.filter(r => r.status === 'STALE' || r.status === 'MISSING').map(r => r.symbol),
        canWait: report.filter(r => r.status === 'FRESH' || r.status === 'AGING').map(r => r.symbol)
      }
    });
  } catch (error) {
    console.error('Error getting data status:', error);
    res.status(500).json({ error: 'Failed to get data status' });
  }
});

export default router;
