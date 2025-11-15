import express from 'express';
import { query } from '../db/connection.js';
import { fetchCompanyFinancials, fetchStockPrice } from '../services/stockData.js';
import { fetchAllMacroIndicators } from '../services/macroData.js';
import { fetchBitcoinPrice } from '../services/cryptoData.js';
import { calculateZScore } from '../services/calculations.js';
import {
  calculateBigLieIndex,
  calculateDebtRisk,
  calculateValuationRisk,
  calculateMacroRisk,
  calculateCorrelationRisk,
  calculateBTCLiquidationRisk,
  calculateDecouplingScore,
  interpretBigLieIndex
} from '../services/riskScorer.js';

const router = express.Router();

// Get Big Lie Index for all companies
router.get('/big-lie-index', async (req, res) => {
  try {
    const companies = await query('SELECT * FROM companies');
    const macroData = await fetchAllMacroIndicators();
    const btcPrice = await fetchBitcoinPrice();
    
    const indices = await Promise.all(
      companies.rows.map(async (company) => {
        try {
          // Fetch data
          const financials = await fetchCompanyFinancials(company.symbol);
          const stockPrice = await fetchStockPrice(company.symbol);
          
          // Calculate risk components
          const debtRisk = calculateDebtRisk(financials, company.market_cap);
          const valuationRisk = calculateValuationRisk(25, 150); // Mock P/E and market cap to GDP
          const macroRisk = calculateMacroRisk({
            YIELD_CURVE_SPREAD: macroData.YIELD_CURVE_SPREAD,
            VIX: 20, // Would fetch from VIX API
            CORPORATE_BOND_SPREAD: macroData.CORPORATE_BOND_SPREAD,
            FED_FUNDS_RATE: macroData.FED_FUNDS_RATE
          });
          
          // Calculate Big Lie Index
          const index = calculateBigLieIndex({
            debtRisk,
            valuationRisk,
            macroRisk,
            correlationRisk: 40,
            btcLiquidationRisk: 0,
            capitalFlightScore: 20
          });
          
          const interpretation = interpretBigLieIndex(index);
          
          return {
            company: {
              id: company.id,
              symbol: company.symbol,
              name: company.name
            },
            index,
            interpretation,
            components: {
              debtRisk,
              valuationRisk,
              macroRisk
            }
          };
        } catch (error) {
          console.error(`Error calculating index for ${company.symbol}:`, error);
          return null;
        }
      })
    );
    
    const validIndices = indices.filter(i => i !== null);
    
    // Calculate average index
    const avgIndex = validIndices.reduce((sum, i) => sum + i.index, 0) / validIndices.length;
    
    res.json({
      averageIndex: avgIndex.toFixed(2),
      interpretation: interpretBigLieIndex(avgIndex),
      companies: validIndices
    });
  } catch (error) {
    console.error('Error calculating Big Lie Index:', error);
    res.status(500).json({ error: 'Failed to calculate Big Lie Index' });
  }
});

// Get risk score for specific company
router.get('/company/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    // Get company
    const companyResult = await query(
      'SELECT * FROM companies WHERE symbol = $1',
      [symbol.toUpperCase()]
    );
    
    if (companyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const company = companyResult.rows[0];
    
    // Fetch data
    const financials = await fetchCompanyFinancials(symbol);
    const macroData = await fetchAllMacroIndicators();
    
    // Calculate risk components
    const debtRisk = calculateDebtRisk(financials, company.market_cap);
    const valuationRisk = calculateValuationRisk(25, 150);
    const macroRisk = calculateMacroRisk({
      YIELD_CURVE_SPREAD: macroData.YIELD_CURVE_SPREAD,
      VIX: 20,
      CORPORATE_BOND_SPREAD: macroData.CORPORATE_BOND_SPREAD,
      FED_FUNDS_RATE: macroData.FED_FUNDS_RATE
    });
    
    const index = calculateBigLieIndex({
      debtRisk,
      valuationRisk,
      macroRisk,
      correlationRisk: 40,
      btcLiquidationRisk: 0,
      capitalFlightScore: 20
    });
    
    const interpretation = interpretBigLieIndex(index);
    const zScore = calculateZScore(financials, company.market_cap);
    
    res.json({
      company: {
        symbol: company.symbol,
        name: company.name
      },
      index,
      interpretation,
      components: {
        debtRisk,
        valuationRisk,
        macroRisk,
        correlationRisk: 40,
        btcLiquidationRisk: 0,
        capitalFlightScore: 20
      },
      metrics: {
        zScore,
        debtToEquity: financials.totalDebt / financials.totalEquity,
        interestCoverage: financials.ebit / financials.interestExpense
      }
    });
  } catch (error) {
    console.error('Error calculating company risk:', error);
    res.status(500).json({ error: 'Failed to calculate risk score' });
  }
});

// Get decoupling score (BTC vs Tech)
router.get('/decoupling', async (req, res) => {
  try {
    const btcTechCorrelation = -0.2; // Would calculate from actual data
    const btcDominance = 55; // Would fetch from crypto API
    const vix = 20; // Would fetch from VIX API
    const btcPrice = await fetchBitcoinPrice();
    
    const score = calculateDecouplingScore(btcTechCorrelation, btcDominance, vix, btcPrice.price);
    
    res.json({
      score,
      interpretation: score > 70 ? 'BTC acting as safe haven' : 
                      score > 40 ? 'Partial decoupling' : 
                      'BTC moving with tech (risk-on)',
      metrics: {
        btcTechCorrelation,
        btcDominance,
        vix
      }
    });
  } catch (error) {
    console.error('Error calculating decoupling score:', error);
    res.status(500).json({ error: 'Failed to calculate decoupling score' });
  }
});

export default router;
