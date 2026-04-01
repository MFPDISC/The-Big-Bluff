import axios from 'axios';
import yahooFinance from 'yahoo-finance2';
import dotenv from 'dotenv';
import { getCache, setCache, generateCacheKey } from '../utils/cache.js';
import { query } from '../db/connection.js';

dotenv.config();

// Smart Data Hotel - Persistent caching with freshness tracking
class DataHotel {
  constructor() {
    this.refreshThresholds = {
      financials: 7 * 24 * 60 * 60 * 1000, // 7 days (was 4 hours) - stop aggressive re-fetching
      stock_prices: 60 * 60 * 1000,        // 1 hour (was 15 mins)
      debt_maturity: 30 * 24 * 60 * 60 * 1000, // 30 days
    };
  }

  async getCachedFinancials(symbol) {
    const result = await query(
      `SELECT f.*, c.symbol, c.name, c.market_cap,
              f.created_at as last_updated
       FROM financials f
       JOIN companies c ON f.company_id = c.id
       WHERE c.symbol = $1
       ORDER BY f.year DESC, f.quarter DESC
       LIMIT 1`,
      [symbol.toUpperCase()]
    );
    return result.rows[0] || null;
  }

  isDataFresh(lastUpdated, dataType = 'financials') {
    if (!lastUpdated) return false;
    const threshold = this.refreshThresholds[dataType];
    const age = Date.now() - new Date(lastUpdated).getTime();
    return age < threshold;
  }

  getDataAge(lastUpdated) {
    if (!lastUpdated) return 'never';
    const age = Date.now() - new Date(lastUpdated).getTime();
    const hours = Math.floor(age / (60 * 60 * 1000));
    const minutes = Math.floor((age % (60 * 60 * 1000)) / (60 * 1000));
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const dataHotel = new DataHotel();

const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_KEY;
const FMP_KEY = process.env.FMP_API_KEY;

// Fetch stock prices using Yahoo Finance (free, no API key needed)
export async function fetchStockPrice(symbol) {
  try {
    const quote = await yahooFinance.quote(symbol);
    return {
      symbol,
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      volume: quote.regularMarketVolume,
      marketCap: quote.marketCap,
      high: quote.regularMarketDayHigh,
      low: quote.regularMarketDayLow,
      open: quote.regularMarketOpen,
      previousClose: quote.regularMarketPreviousClose
    };
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error.message);
    return null;
  }
}

// Fetch historical prices
export async function fetchHistoricalPrices(symbol, startDate, endDate) {
  try {
    const result = await yahooFinance.historical(symbol, {
      period1: startDate,
      period2: endDate || new Date(),
      interval: '1d'
    });

    return result.map(item => ({
      date: item.date,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume
    }));
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error.message);
    return [];
  }
}

// Smart Fetch: Check database first, then APIs (with intelligent caching)
export async function fetchCompanyFinancials(symbol, forceRefresh = false) {
  try {
    // 1. Check our persistent "hotel" database first
    const cached = await dataHotel.getCachedFinancials(symbol);

    if (!forceRefresh && cached && dataHotel.isDataFresh(cached.last_updated, 'financials')) {
      console.log(`🏨 Serving from data hotel: ${symbol} (${dataHotel.getDataAge(cached.last_updated)} old)`);
      return formatFinancialData(cached);
    }

    // 2. Data is stale or missing - fetch fresh data
    console.log(`🔄 Fetching fresh data for ${symbol}...`);
    const freshData = await fetchFreshFinancials(symbol);

    // 3. Store in database hotel for future use
    await storeFinancialsInHotel(symbol, freshData);

    return freshData;
  } catch (error) {
    console.error(`❌ Error fetching ${symbol}:`, error.message);

    // 4. Fallback to any cached data (even if stale)
    const fallback = await dataHotel.getCachedFinancials(symbol);
    if (fallback) {
      console.log(`⚠️ Using stale data for ${symbol} due to API error`);
      return formatFinancialData(fallback);
    }

    throw error;
  }
}

// Internal function to fetch fresh data from APIs
async function fetchFreshFinancials(symbol) {
  const cacheKey = generateCacheKey('financials', { symbol });

  if (!FMP_KEY && ALPHA_VANTAGE_KEY) {
    console.log(`📊 Using Alpha Vantage for ${symbol}`);
    return await fetchFromAlphaVantage(symbol, cacheKey);
  }

  if (!FMP_KEY && !ALPHA_VANTAGE_KEY) {
    console.log('⚠️ No API keys - using mock data');
    const mockData = generateMockFinancials(symbol);
    await setCache(cacheKey, mockData, 240);
    return mockData;
  }

  try {
    // Balance Sheet
    const balanceSheet = await axios.get(
      `https://financialmodelingprep.com/api/v3/balance-sheet-statement/${symbol}?period=quarter&limit=4&apikey=${FMP_KEY}`
    );

    // Income Statement
    const income = await axios.get(
      `https://financialmodelingprep.com/api/v3/income-statement/${symbol}?period=quarter&limit=4&apikey=${FMP_KEY}`
    );

    // Cash Flow
    const cashFlow = await axios.get(
      `https://financialmodelingprep.com/api/v3/cash-flow-statement/${symbol}?period=quarter&limit=4&apikey=${FMP_KEY}`
    );

    const bs = balanceSheet.data[0];
    const inc = income.data[0];
    const cf = cashFlow.data[0];

    const financialData = {
      symbol,
      quarter: Math.ceil(new Date(bs.date).getMonth() / 3),
      year: new Date(bs.date).getFullYear(),
      totalDebt: bs.totalDebt || 0,
      totalEquity: bs.totalStockholdersEquity || 0,
      cashOnHand: bs.cashAndCashEquivalents || 0,
      totalCash: (bs.cashAndCashEquivalents || 0) + (bs.shortTermInvestments || 0),
      shortTermInvestments: bs.shortTermInvestments || 0,
      ebit: inc.ebitda || 0,
      interestExpense: inc.interestExpense || 0,
      freeCashFlow: cf.freeCashFlow || 0,
      revenue: inc.revenue || 0,
      netIncome: inc.netIncome || 0,
      totalAssets: bs.totalAssets || 0,
      currentAssets: bs.totalCurrentAssets || 0,
      currentLiabilities: bs.totalCurrentLiabilities || 0
    };

    // Cache for 4 hours
    await setCache(cacheKey, financialData, 240);

    return financialData;
  } catch (error) {
    console.error(`Error fetching financials for ${symbol}:`, error.message);
    const mockData = generateMockFinancials(symbol);
    await setCache(cacheKey, mockData, 240);
    return mockData;
  }
}

// Store financial data in persistent database "hotel"
async function storeFinancialsInHotel(symbol, data) {
  try {
    const companyResult = await query(
      'SELECT id FROM companies WHERE symbol = $1',
      [symbol.toUpperCase()]
    );

    if (companyResult.rows.length === 0) {
      console.log(`⚠️ Company ${symbol} not found in database`);
      return;
    }

    const companyId = companyResult.rows[0].id;

    await query(
      `INSERT INTO financials 
       (company_id, quarter, year, total_debt, total_equity, cash_on_hand, total_cash, 
        short_term_investments, ebit, interest_expense, free_cash_flow, revenue, 
        net_income, total_assets, current_assets, current_liabilities, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
       ON CONFLICT (company_id, quarter, year) 
       DO UPDATE SET
         total_debt = EXCLUDED.total_debt,
         total_equity = EXCLUDED.total_equity,
         cash_on_hand = EXCLUDED.cash_on_hand,
         total_cash = EXCLUDED.total_cash,
         short_term_investments = EXCLUDED.short_term_investments,
         ebit = EXCLUDED.ebit,
         interest_expense = EXCLUDED.interest_expense,
         free_cash_flow = EXCLUDED.free_cash_flow,
         revenue = EXCLUDED.revenue,
         net_income = EXCLUDED.net_income,
         total_assets = EXCLUDED.total_assets,
         current_assets = EXCLUDED.current_assets,
         current_liabilities = EXCLUDED.current_liabilities,
         created_at = NOW()`,
      [companyId, data.quarter, data.year, data.totalDebt, data.totalEquity,
        data.cashOnHand, data.totalCash, data.shortTermInvestments, data.ebit,
        data.interestExpense, data.freeCashFlow, data.revenue, data.netIncome,
        data.totalAssets, data.currentAssets, data.currentLiabilities]
    );

    console.log(`🏨 Stored ${symbol} in data hotel`);
  } catch (error) {
    console.error(`Failed to store ${symbol} in hotel:`, error.message);
  }
}

// Format database row to API format
function formatFinancialData(dbRow) {
  return {
    symbol: dbRow.symbol,
    quarter: dbRow.quarter,
    year: dbRow.year,
    totalDebt: dbRow.total_debt,
    totalEquity: dbRow.total_equity,
    cashOnHand: dbRow.cash_on_hand,
    totalCash: dbRow.total_cash,
    shortTermInvestments: dbRow.short_term_investments,
    ebit: dbRow.ebit,
    interestExpense: dbRow.interest_expense,
    freeCashFlow: dbRow.free_cash_flow,
    revenue: dbRow.revenue,
    netIncome: dbRow.net_income,
    totalAssets: dbRow.total_assets,
    currentAssets: dbRow.current_assets,
    currentLiabilities: dbRow.current_liabilities,
    lastUpdated: dbRow.last_updated
  };
}

// Batch fetch with smart rate limiting
export async function fetchBatchFinancials(symbols, forceRefresh = false) {
  const results = {};
  const toFetch = [];

  // Check what we have cached
  for (const symbol of symbols) {
    const cached = await dataHotel.getCachedFinancials(symbol);

    if (!forceRefresh && cached && dataHotel.isDataFresh(cached.last_updated, 'financials')) {
      results[symbol] = formatFinancialData(cached);
    } else {
      toFetch.push(symbol);
    }
  }

  console.log(`🏨 Serving ${Object.keys(results).length} cached, fetching ${toFetch.length} fresh`);

  // Fetch missing data with rate limit protection and exponential backoff
  for (let i = 0; i < toFetch.length; i++) {
    const symbol = toFetch[i];
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount <= maxRetries) {
      try {
        if (i > 0 || retryCount > 0) {
          // Strict delay for Alpha Vantage (max 5 requests/min for free tier)
          const baseDelay = retryCount > 0 ? Math.pow(2, retryCount) * 5000 : 12000;
          await dataHotel.delay(baseDelay);
        }

        results[symbol] = await fetchCompanyFinancials(symbol, false);
        break; // Success, exit retry loop

      } catch (error) {
        console.error(`Failed to fetch ${symbol} (attempt ${retryCount + 1}):`, error.message);

        // If it's a rate limit error and we have retries left
        if (error.response?.status === 429 && retryCount < maxRetries) {
          retryCount++;
          console.log(`🔄 Rate limited on ${symbol}, retrying in ${Math.pow(2, retryCount) * 2}s...`);
          continue;
        }

        // Try stale data as fallback
        const stale = await dataHotel.getCachedFinancials(symbol);
        if (stale) {
          console.log(`📦 Using stale data for ${symbol}`);
          results[symbol] = formatFinancialData(stale);
        } else {
          console.log(`❌ No fallback data available for ${symbol}`);
        }
        break; // Exit retry loop
      }
    }
  }

  return results;
}

// Get data freshness report
export async function getDataFreshnessReport() {
  const result = await query(
    `SELECT c.symbol, c.name,
            f.created_at as last_update,
            EXTRACT(EPOCH FROM (NOW() - f.created_at)) as seconds_old,
            CASE 
              WHEN f.created_at IS NULL THEN 'MISSING'
              WHEN f.created_at < NOW() - INTERVAL '4 hours' THEN 'STALE'
              WHEN f.created_at < NOW() - INTERVAL '1 hour' THEN 'AGING'
              ELSE 'FRESH'
            END as status
     FROM companies c
     LEFT JOIN LATERAL (
       SELECT created_at 
       FROM financials 
       WHERE company_id = c.id 
       ORDER BY year DESC, quarter DESC 
       LIMIT 1
     ) f ON true
     ORDER BY c.symbol`
  );

  return result.rows.map(row => ({
    symbol: row.symbol,
    name: row.name,
    lastUpdate: row.last_update,
    ageInHours: row.seconds_old ? Math.round(row.seconds_old / 3600) : null,
    status: row.status
  }));
}

// Generate realistic mock financial data for testing
function generateMockFinancials(symbol) {
  const mockData = {
    'AAPL': { debt: 106e9, equity: 62e9, cash: 48e9, ebit: 33e9, interest: 3.7e9, fcf: 28e9, revenue: 94e9, netIncome: 25e9 },
    'MSFT': { debt: 47e9, equity: 206e9, cash: 104e9, ebit: 29e9, interest: 1.8e9, fcf: 24e9, revenue: 56e9, netIncome: 22e9 },
    'GOOGL': { debt: 13e9, equity: 256e9, cash: 116e9, ebit: 24e9, interest: 0.3e9, fcf: 21e9, revenue: 76e9, netIncome: 18e9 },
    'AMZN': { debt: 67e9, equity: 138e9, cash: 73e9, ebit: 12e9, interest: 2.4e9, fcf: 8e9, revenue: 143e9, netIncome: 10e9 },
    'NVDA': { debt: 11e9, equity: 42e9, cash: 18e9, ebit: 15e9, interest: 0.3e9, fcf: 12e9, revenue: 18e9, netIncome: 13e9 },
    'META': { debt: 18e9, equity: 125e9, cash: 41e9, ebit: 17e9, interest: 0.4e9, fcf: 14e9, revenue: 32e9, netIncome: 12e9 },
    'TSLA': { debt: 5e9, equity: 30e9, cash: 16e9, ebit: 3e9, interest: 0.5e9, fcf: 2e9, revenue: 24e9, netIncome: 2.7e9 },
    'NFLX': { debt: 14e9, equity: 18e9, cash: 6e9, ebit: 2.5e9, interest: 0.7e9, fcf: 1.5e9, revenue: 8.5e9, netIncome: 1.5e9 },
    'ADBE': { debt: 4e9, equity: 17e9, cash: 7e9, ebit: 2.8e9, interest: 0.1e9, fcf: 2.4e9, revenue: 5e9, netIncome: 1.8e9 },
    'CRM': { debt: 9e9, equity: 73e9, cash: 12e9, ebit: 1.5e9, interest: 0.3e9, fcf: 1.2e9, revenue: 8.4e9, netIncome: 1.1e9 }
  };

  const data = mockData[symbol] || mockData['AAPL'];
  const now = new Date();

  return {
    symbol,
    quarter: Math.ceil((now.getMonth() + 1) / 3),
    year: now.getFullYear(),
    totalDebt: data.debt,
    totalEquity: data.equity,
    cashOnHand: data.cash,
    totalCash: data.cash,
    shortTermInvestments: data.cash * 0.2,
    ebit: data.ebit,
    interestExpense: data.interest,
    freeCashFlow: data.fcf,
    revenue: data.revenue,
    netIncome: data.netIncome,
    totalAssets: data.debt + data.equity,
    currentAssets: (data.debt + data.equity) * 0.4,
    currentLiabilities: data.debt * 0.3
  };
}

// Fetch S&P 500 data
export async function fetchSP500() {
  try {
    const quote = await yahooFinance.quote('^GSPC');
    return {
      symbol: 'SP500',
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent
    };
  } catch (error) {
    console.error('Error fetching S&P 500:', error.message);
    return null;
  }
}

// Fetch VIX (Volatility Index)
export async function fetchVIX() {
  try {
    const quote = await yahooFinance.quote('^VIX');
    return {
      symbol: 'VIX',
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent
    };
  } catch (error) {
    console.error('Error fetching VIX:', error.message);
    return null;
  }
}

export default {
  fetchStockPrice,
  fetchHistoricalPrices,
  fetchCompanyFinancials,
  fetchSP500,
  fetchVIX
};

// Fetch from Alpha Vantage as fallback
async function fetchFromAlphaVantage(symbol, cacheKey) {
  try {
    console.log(`📊 Fetching ${symbol} from Alpha Vantage...`);

    // Get balance sheet, income statement, and cash flow in parallel
    const [balanceSheet, income, cashFlow] = await Promise.all([
      axios.get(`https://www.alphavantage.co/query`, {
        params: {
          function: 'BALANCE_SHEET',
          symbol: symbol,
          apikey: ALPHA_VANTAGE_KEY
        }
      }),
      axios.get(`https://www.alphavantage.co/query`, {
        params: {
          function: 'INCOME_STATEMENT',
          symbol: symbol,
          apikey: ALPHA_VANTAGE_KEY
        }
      }),
      axios.get(`https://www.alphavantage.co/query`, {
        params: {
          function: 'CASH_FLOW',
          symbol: symbol,
          apikey: ALPHA_VANTAGE_KEY
        }
      })
    ]);

    const bs = balanceSheet.data.quarterlyReports?.[0];
    const inc = income.data.quarterlyReports?.[0];
    const cf = cashFlow.data.quarterlyReports?.[0];

    if (!bs || !inc || !cf) {
      throw new Error('Incomplete data from Alpha Vantage');
    }

    const financialData = {
      symbol,
      quarter: Math.ceil(new Date(bs.fiscalDateEnding).getMonth() / 3),
      year: new Date(bs.fiscalDateEnding).getFullYear(),
      totalDebt: parseFloat(bs.longTermDebt || 0) + parseFloat(bs.shortTermDebt || 0),
      totalEquity: parseFloat(bs.totalShareholderEquity || 0),
      cashOnHand: parseFloat(bs.cashAndCashEquivalentsAtCarryingValue || 0),
      totalCash: parseFloat(bs.cashAndCashEquivalentsAtCarryingValue || 0) + parseFloat(bs.shortTermInvestments || 0),
      shortTermInvestments: parseFloat(bs.shortTermInvestments || 0),
      ebit: parseFloat(inc.ebitda || 0),
      interestExpense: parseFloat(inc.interestExpense || 0),
      freeCashFlow: parseFloat(cf.operatingCashflow || 0) - parseFloat(cf.capitalExpenditures || 0),
      revenue: parseFloat(inc.totalRevenue || 0),
      netIncome: parseFloat(inc.netIncome || 0),
      totalAssets: parseFloat(bs.totalAssets || 0),
      currentAssets: parseFloat(bs.totalCurrentAssets || 0),
      currentLiabilities: parseFloat(bs.totalCurrentLiabilities || 0)
    };

    await setCache(cacheKey, financialData, 240);
    return financialData;
  } catch (error) {
    console.error(`Error fetching from Alpha Vantage for ${symbol}:`, error.message);
    const mockData = generateMockFinancials(symbol);
    await setCache(cacheKey, mockData, 240);
    return mockData;
  }
}
