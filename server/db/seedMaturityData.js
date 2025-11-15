import { query } from './connection.js';

// Sample debt maturity data for top 10 tech companies
// Based on recent SEC filings and public bond data
const maturityData = [
  // Apple (AAPL)
  { symbol: 'AAPL', debt_type: '3.85% Senior Notes', amount: 4_500_000_000, maturity_date: '2025-08-15', interest_rate: 3.85, refinancing_risk: 'LOW' },
  { symbol: 'AAPL', debt_type: '2.70% Senior Notes', amount: 3_000_000_000, maturity_date: '2026-05-11', interest_rate: 2.70, refinancing_risk: 'LOW' },
  { symbol: 'AAPL', debt_type: '4.25% Senior Notes', amount: 5_500_000_000, maturity_date: '2027-02-09', interest_rate: 4.25, refinancing_risk: 'LOW' },
  { symbol: 'AAPL', debt_type: '3.00% Senior Notes', amount: 7_000_000_000, maturity_date: '2028-06-20', interest_rate: 3.00, refinancing_risk: 'LOW' },
  
  // Microsoft (MSFT)
  { symbol: 'MSFT', debt_type: '2.40% Senior Notes', amount: 2_250_000_000, maturity_date: '2026-08-08', interest_rate: 2.40, refinancing_risk: 'LOW' },
  { symbol: 'MSFT', debt_type: '3.30% Senior Notes', amount: 3_750_000_000, maturity_date: '2027-02-06', interest_rate: 3.30, refinancing_risk: 'LOW' },
  { symbol: 'MSFT', debt_type: '2.92% Senior Notes', amount: 5_000_000_000, maturity_date: '2028-03-17', interest_rate: 2.92, refinancing_risk: 'LOW' },
  
  // Google/Alphabet (GOOGL)
  { symbol: 'GOOGL', debt_type: '1.90% Senior Notes', amount: 1_000_000_000, maturity_date: '2026-08-15', interest_rate: 1.90, refinancing_risk: 'LOW' },
  { symbol: 'GOOGL', debt_type: '2.25% Senior Notes', amount: 2_000_000_000, maturity_date: '2027-05-19', interest_rate: 2.25, refinancing_risk: 'LOW' },
  { symbol: 'GOOGL', debt_type: '3.37% Senior Notes', amount: 3_000_000_000, maturity_date: '2028-03-01', interest_rate: 3.37, refinancing_risk: 'LOW' },
  
  // Amazon (AMZN)
  { symbol: 'AMZN', debt_type: '3.15% Senior Notes', amount: 3_000_000_000, maturity_date: '2026-08-22', interest_rate: 3.15, refinancing_risk: 'MEDIUM' },
  { symbol: 'AMZN', debt_type: '4.10% Senior Notes', amount: 5_000_000_000, maturity_date: '2027-04-13', interest_rate: 4.10, refinancing_risk: 'MEDIUM' },
  { symbol: 'AMZN', debt_type: '3.88% Senior Notes', amount: 4_750_000_000, maturity_date: '2028-08-22', interest_rate: 3.88, refinancing_risk: 'MEDIUM' },
  
  // NVIDIA (NVDA)
  { symbol: 'NVDA', debt_type: '2.85% Senior Notes', amount: 1_250_000_000, maturity_date: '2026-04-01', interest_rate: 2.85, refinancing_risk: 'LOW' },
  { symbol: 'NVDA', debt_type: '3.50% Senior Notes', amount: 1_000_000_000, maturity_date: '2027-04-01', interest_rate: 3.50, refinancing_risk: 'LOW' },
  { symbol: 'NVDA', debt_type: '3.70% Senior Notes', amount: 1_500_000_000, maturity_date: '2029-04-01', interest_rate: 3.70, refinancing_risk: 'LOW' },
  
  // Meta/Facebook (META)
  { symbol: 'META', debt_type: '3.85% Senior Notes', amount: 4_000_000_000, maturity_date: '2026-05-15', interest_rate: 3.85, refinancing_risk: 'LOW' },
  { symbol: 'META', debt_type: '4.45% Senior Notes', amount: 3_500_000_000, maturity_date: '2027-08-15', interest_rate: 4.45, refinancing_risk: 'LOW' },
  { symbol: 'META', debt_type: '4.65% Senior Notes', amount: 5_000_000_000, maturity_date: '2028-05-15', interest_rate: 4.65, refinancing_risk: 'LOW' },
  
  // Tesla (TSLA) - Higher risk due to convertible notes
  { symbol: 'TSLA', debt_type: 'Convertible Senior Notes', amount: 1_800_000_000, maturity_date: '2025-12-01', interest_rate: 2.00, is_convertible: true, conversion_price: 309.83, refinancing_risk: 'HIGH' },
  { symbol: 'TSLA', debt_type: 'Convertible Senior Notes', amount: 1_380_000_000, maturity_date: '2026-06-01', interest_rate: 2.37, is_convertible: true, conversion_price: 359.87, refinancing_risk: 'HIGH' },
  { symbol: 'TSLA', debt_type: '5.30% Senior Notes', amount: 2_000_000_000, maturity_date: '2027-08-15', interest_rate: 5.30, refinancing_risk: 'MEDIUM' },
  { symbol: 'TSLA', debt_type: '5.80% Senior Notes', amount: 1_500_000_000, maturity_date: '2028-03-15', interest_rate: 5.80, refinancing_risk: 'MEDIUM' },
  
  // Netflix (NFLX) - Higher debt load
  { symbol: 'NFLX', debt_type: '5.50% Senior Notes', amount: 1_600_000_000, maturity_date: '2026-02-15', interest_rate: 5.50, refinancing_risk: 'MEDIUM' },
  { symbol: 'NFLX', debt_type: '5.88% Senior Notes', amount: 1_800_000_000, maturity_date: '2026-11-15', interest_rate: 5.88, refinancing_risk: 'MEDIUM' },
  { symbol: 'NFLX', debt_type: '6.38% Senior Notes', amount: 2_200_000_000, maturity_date: '2027-05-15', interest_rate: 6.38, refinancing_risk: 'HIGH' },
  { symbol: 'NFLX', debt_type: '4.88% Senior Notes', amount: 1_900_000_000, maturity_date: '2028-06-15', interest_rate: 4.88, refinancing_risk: 'MEDIUM' },
  
  // Adobe (ADBE)
  { symbol: 'ADBE', debt_type: '2.30% Senior Notes', amount: 1_000_000_000, maturity_date: '2026-02-01', interest_rate: 2.30, refinancing_risk: 'LOW' },
  { symbol: 'ADBE', debt_type: '3.25% Senior Notes', amount: 1_500_000_000, maturity_date: '2027-02-01', interest_rate: 3.25, refinancing_risk: 'LOW' },
  { symbol: 'ADBE', debt_type: '2.75% Senior Notes', amount: 1_250_000_000, maturity_date: '2028-02-01', interest_rate: 2.75, refinancing_risk: 'LOW' },
  
  // Salesforce (CRM)
  { symbol: 'CRM', debt_type: '2.70% Senior Notes', amount: 2_500_000_000, maturity_date: '2026-07-15', interest_rate: 2.70, refinancing_risk: 'MEDIUM' },
  { symbol: 'CRM', debt_type: '3.25% Senior Notes', amount: 1_500_000_000, maturity_date: '2027-04-11', interest_rate: 3.25, refinancing_risk: 'MEDIUM' },
  { symbol: 'CRM', debt_type: '2.90% Senior Notes', amount: 2_000_000_000, maturity_date: '2028-07-15', interest_rate: 2.90, refinancing_risk: 'MEDIUM' },
];

async function seedMaturityData() {
  console.log('🗓️  Starting debt maturity data seeding...');

  try {
    // First, get company IDs
    const companies = await query('SELECT id, symbol FROM companies');
    const companyMap = {};
    companies.rows.forEach(c => {
      companyMap[c.symbol] = c.id;
    });

    // Insert debt maturity data
    for (const maturity of maturityData) {
      const companyId = companyMap[maturity.symbol];
      
      if (!companyId) {
        console.log(`⚠️  Company ${maturity.symbol} not found, skipping...`);
        continue;
      }

      await query(
        `INSERT INTO debt_maturities 
         (company_id, debt_type, amount, maturity_date, interest_rate, is_convertible, conversion_price, refinancing_risk)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT DO NOTHING`,
        [
          companyId,
          maturity.debt_type,
          maturity.amount,
          maturity.maturity_date,
          maturity.interest_rate,
          maturity.is_convertible || false,
          maturity.conversion_price || null,
          maturity.refinancing_risk
        ]
      );
    }

    console.log(`✅ Inserted ${maturityData.length} debt maturity records`);
    console.log('🎉 Debt maturity data seeding complete!');
    
    // Show summary
    const summary = await query(`
      SELECT 
        EXTRACT(YEAR FROM maturity_date) as year,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM debt_maturities
      WHERE maturity_date >= CURRENT_DATE
      GROUP BY EXTRACT(YEAR FROM maturity_date)
      ORDER BY year
    `);

    console.log('\n📊 Debt Maturity Summary:');
    summary.rows.forEach(row => {
      console.log(`   ${row.year}: $${(row.total_amount / 1e9).toFixed(1)}B across ${row.count} notes`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedMaturityData();
