import express from 'express';
import { query } from '../db/connection.js';

const router = express.Router();

// Get all debt maturities for a company
router.get('/company/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;

    const result = await query(
      `SELECT dm.*, c.name, c.symbol 
       FROM debt_maturities dm
       JOIN companies c ON dm.company_id = c.id
       WHERE c.symbol = $1
       ORDER BY dm.maturity_date ASC`,
      [symbol]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching debt maturities:', error);
    res.status(500).json({ error: 'Failed to fetch debt maturities' });
  }
});

// Get upcoming maturities across all companies
router.get('/upcoming', async (req, res) => {
  try {
    const { months = 12 } = req.query;

    const result = await query(
      `SELECT dm.*, c.name, c.symbol, c.market_cap
       FROM debt_maturities dm
       JOIN companies c ON dm.company_id = c.id
       WHERE dm.maturity_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${months} months'
       ORDER BY dm.maturity_date ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching upcoming maturities:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming maturities' });
  }
});

// Get maturity timeline (grouped by year)
router.get('/timeline', async (req, res) => {
  try {
    const result = await query(
      `SELECT 
         EXTRACT(YEAR FROM dm.maturity_date) as year,
         c.symbol,
         c.name,
         SUM(dm.amount) as total_amount,
         COUNT(*) as debt_count,
         AVG(dm.interest_rate) as avg_rate,
         STRING_AGG(dm.debt_type, ', ') as debt_types
       FROM debt_maturities dm
       JOIN companies c ON dm.company_id = c.id
       WHERE dm.maturity_date >= CURRENT_DATE
       GROUP BY EXTRACT(YEAR FROM dm.maturity_date), c.symbol, c.name
       ORDER BY year ASC, total_amount DESC`
    );

    // Group by year
    const timeline = {};
    result.rows.forEach(row => {
      if (!timeline[row.year]) {
        timeline[row.year] = {
          year: parseInt(row.year),
          totalAmount: 0,
          companies: []
        };
      }
      timeline[row.year].totalAmount += parseFloat(row.total_amount);
      timeline[row.year].companies.push({
        symbol: row.symbol,
        name: row.name,
        amount: parseFloat(row.total_amount),
        debtCount: parseInt(row.debt_count),
        avgRate: parseFloat(row.avg_rate),
        debtTypes: row.debt_types
      });
    });

    res.json(Object.values(timeline));
  } catch (error) {
    console.error('Error fetching maturity timeline:', error);
    res.status(500).json({ error: 'Failed to fetch maturity timeline' });
  }
});

// Get debt wall analysis (concentration of maturities)
router.get('/debt-wall', async (req, res) => {
  try {
    const { period = 'quarter', startYear, endYear, dateRange = 'future', companyFilter = 'all' } = req.query;
    const truncFunction = period === 'month' ? 'month' : 'quarter';
    
    // Determine date filter based on dateRange
    let dateFilter = 'dm.maturity_date >= CURRENT_DATE';
    
    if (dateRange === 'all') {
      dateFilter = `EXTRACT(YEAR FROM dm.maturity_date) BETWEEN 2000 AND 2030`;
    } else if (dateRange === 'custom' && startYear && endYear) {
      dateFilter = `EXTRACT(YEAR FROM dm.maturity_date) BETWEEN ${parseInt(startYear)} AND ${parseInt(endYear)}`;
    }
    
    // Determine company filter
    let companyFilterClause = '';
    if (companyFilter === 'top10') {
      // Top 10 companies by market cap
      const top10Symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.B', 'V', 'UNH'];
      companyFilterClause = `AND c.symbol IN (${top10Symbols.map(s => `'${s}'`).join(', ')})`;
    }
    
    // Find periods with high concentration of maturities
    const result = await query(
      `SELECT 
         DATE_TRUNC('${truncFunction}', dm.maturity_date) as period,
         SUM(dm.amount) as total_amount,
         COUNT(DISTINCT c.id) as company_count,
         COUNT(*) as maturity_count,
         AVG(dm.interest_rate) as avg_rate,
         ARRAY_AGG(DISTINCT c.symbol) as symbols
       FROM debt_maturities dm
       JOIN companies c ON dm.company_id = c.id
       WHERE ${dateFilter} ${companyFilterClause}
       GROUP BY DATE_TRUNC('${truncFunction}', dm.maturity_date)
       ORDER BY period ASC`
    );

    const debtWall = result.rows.map(row => ({
      period: row.period,
      totalAmount: parseFloat(row.total_amount),
      companyCount: parseInt(row.company_count),
      maturityCount: parseInt(row.maturity_count),
      avgRate: parseFloat(row.avg_rate),
      symbols: row.symbols,
      riskLevel: calculateWallRisk(parseFloat(row.total_amount), parseInt(row.company_count)),
      periodType: period
    }));

    res.json(debtWall);
  } catch (error) {
    console.error('Error fetching debt wall:', error);
    res.status(500).json({ error: 'Failed to fetch debt wall analysis' });
  }
});

// Get historical debt maturity view (bird's eye view)
router.get('/historical-view', async (req, res) => {
  try {
    const { startYear = 2020, endYear = 2030 } = req.query;
    
    // Get all maturities including past ones
    const result = await query(
      `SELECT 
         EXTRACT(YEAR FROM dm.maturity_date) as year,
         EXTRACT(QUARTER FROM dm.maturity_date) as quarter,
         c.symbol,
         c.name,
         dm.amount,
         dm.debt_type,
         dm.interest_rate,
         dm.maturity_date,
         dm.issue_date,
         CASE 
           WHEN dm.maturity_date < CURRENT_DATE THEN 'MATURED'
           WHEN dm.maturity_date <= CURRENT_DATE + INTERVAL '12 months' THEN 'IMMINENT'
           WHEN dm.maturity_date <= CURRENT_DATE + INTERVAL '24 months' THEN 'NEAR_TERM'
           ELSE 'FUTURE'
         END as status
       FROM debt_maturities dm
       JOIN companies c ON dm.company_id = c.id
       WHERE EXTRACT(YEAR FROM dm.maturity_date) BETWEEN $1 AND $2
       ORDER BY dm.maturity_date ASC, c.symbol ASC`,
      [startYear, endYear]
    );

    // Group by year and quarter
    const historicalView = {};
    
    result.rows.forEach(row => {
      const yearKey = parseInt(row.year);
      const quarterKey = `Q${row.quarter} ${yearKey}`;
      
      if (!historicalView[yearKey]) {
        historicalView[yearKey] = {
          year: yearKey,
          quarters: {},
          totalAmount: 0,
          companies: new Set(),
          maturities: []
        };
      }
      
      if (!historicalView[yearKey].quarters[quarterKey]) {
        historicalView[yearKey].quarters[quarterKey] = {
          quarter: quarterKey,
          totalAmount: 0,
          companies: [],
          maturities: []
        };
      }
      
      const amount = parseFloat(row.amount);
      historicalView[yearKey].totalAmount += amount;
      historicalView[yearKey].companies.add(row.symbol);
      historicalView[yearKey].quarters[quarterKey].totalAmount += amount;
      
      const maturityData = {
        symbol: row.symbol,
        name: row.name,
        amount: amount,
        debtType: row.debt_type,
        interestRate: parseFloat(row.interest_rate),
        maturityDate: row.maturity_date,
        issueDate: row.issue_date,
        status: row.status
      };
      
      historicalView[yearKey].quarters[quarterKey].maturities.push(maturityData);
      
      // Add to company list for quarter
      const existingCompany = historicalView[yearKey].quarters[quarterKey].companies.find(c => c.symbol === row.symbol);
      if (existingCompany) {
        existingCompany.amount += amount;
        existingCompany.count += 1;
      } else {
        historicalView[yearKey].quarters[quarterKey].companies.push({
          symbol: row.symbol,
          name: row.name,
          amount: amount,
          count: 1
        });
      }
    });

    // Convert to array and format
    const formattedView = Object.values(historicalView).map(year => ({
      year: year.year,
      totalAmount: year.totalAmount,
      companyCount: year.companies.size,
      quarters: Object.values(year.quarters).map(q => ({
        ...q,
        companies: q.companies.sort((a, b) => b.amount - a.amount)
      }))
    }));

    res.json(formattedView);
  } catch (error) {
    console.error('Error fetching historical view:', error);
    res.status(500).json({ error: 'Failed to fetch historical debt view' });
  }
});

// Calculate maturity risk for a company
router.get('/risk/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;

    const result = await query(
      `SELECT 
         c.symbol,
         c.name,
         SUM(CASE WHEN dm.maturity_date <= CURRENT_DATE + INTERVAL '12 months' THEN dm.amount ELSE 0 END) as debt_12m,
         SUM(CASE WHEN dm.maturity_date <= CURRENT_DATE + INTERVAL '24 months' THEN dm.amount ELSE 0 END) as debt_24m,
         SUM(dm.amount) as total_debt,
         COUNT(*) as total_maturities,
         MIN(dm.maturity_date) as next_maturity,
         MAX(dm.interest_rate) as max_rate
       FROM companies c
       LEFT JOIN debt_maturities dm ON c.id = dm.company_id
       WHERE c.symbol = $1 AND dm.maturity_date >= CURRENT_DATE
       GROUP BY c.id, c.symbol, c.name`,
      [symbol]
    );

    if (result.rows.length === 0) {
      return res.json({ 
        symbol,
        riskScore: 0,
        message: 'No upcoming maturities found'
      });
    }

    const data = result.rows[0];
    const riskScore = calculateMaturityRisk(
      parseFloat(data.debt_12m),
      parseFloat(data.debt_24m),
      parseFloat(data.total_debt),
      parseFloat(data.max_rate)
    );

    res.json({
      symbol: data.symbol,
      name: data.name,
      debt12m: parseFloat(data.debt_12m),
      debt24m: parseFloat(data.debt_24m),
      totalDebt: parseFloat(data.total_debt),
      totalMaturities: parseInt(data.total_maturities),
      nextMaturity: data.next_maturity,
      maxRate: parseFloat(data.max_rate),
      riskScore,
      riskLevel: getRiskLevel(riskScore)
    });
  } catch (error) {
    console.error('Error calculating maturity risk:', error);
    res.status(500).json({ error: 'Failed to calculate maturity risk' });
  }
});

// Helper functions
function calculateWallRisk(amount, companyCount) {
  // High concentration = high risk
  if (amount > 100e9 && companyCount >= 5) return 'CRITICAL';
  if (amount > 50e9) return 'HIGH';
  if (amount > 20e9) return 'MEDIUM';
  return 'LOW';
}

function calculateMaturityRisk(debt12m, debt24m, totalDebt, maxRate) {
  let score = 0;

  // Short-term debt concentration (0-40 points)
  const shortTermRatio = debt12m / totalDebt;
  if (shortTermRatio > 0.5) score += 40;
  else if (shortTermRatio > 0.3) score += 30;
  else if (shortTermRatio > 0.15) score += 20;
  else score += 10;

  // Interest rate risk (0-30 points)
  if (maxRate > 8) score += 30;
  else if (maxRate > 6) score += 20;
  else if (maxRate > 4) score += 10;
  else score += 5;

  // Total debt size (0-30 points)
  if (totalDebt > 50e9) score += 30;
  else if (totalDebt > 20e9) score += 20;
  else if (totalDebt > 5e9) score += 10;
  else score += 5;

  return Math.min(100, score);
}

function getRiskLevel(score) {
  if (score >= 75) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}

export default router;
