import { query } from './connection.js';

// Top 10 Tech Companies
const companies = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Technology' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' },
  { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology' },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Automotive/Tech' },
  { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Technology' },
  { symbol: 'ADBE', name: 'Adobe Inc.', sector: 'Technology' },
  { symbol: 'CRM', name: 'Salesforce Inc.', sector: 'Technology' }
];

// Historical crisis data for comparison
const crisisData = [
  // 2008 Financial Crisis
  { crisis: '2008_Financial_Crisis', date: '2008-09-15', metric: 'VIX', value: 31.70 },
  { crisis: '2008_Financial_Crisis', date: '2008-09-15', metric: '10Y_TREASURY', value: 3.41 },
  { crisis: '2008_Financial_Crisis', date: '2008-09-15', metric: 'SP500', value: 1192.70 },
  { crisis: '2008_Financial_Crisis', date: '2008-10-10', metric: 'VIX', value: 69.95 },
  
  // 2000 Dot-Com Bubble
  { crisis: '2000_DotCom_Bubble', date: '2000-03-10', metric: 'NASDAQ_PE', value: 175 },
  { crisis: '2000_DotCom_Bubble', date: '2000-03-10', metric: 'SP500', value: 1527.46 },
  { crisis: '2000_DotCom_Bubble', date: '2000-03-10', metric: 'VIX', value: 23.50 },
  
  // 1987 Black Monday
  { crisis: '1987_Black_Monday', date: '1987-10-19', metric: 'SP500_CHANGE', value: -20.47 },
  { crisis: '1987_Black_Monday', date: '1987-10-19', metric: 'VIX_EQUIV', value: 150 }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Insert companies
    console.log('Inserting companies...');
    for (const company of companies) {
      await query(
        'INSERT INTO companies (symbol, name, sector) VALUES ($1, $2, $3) ON CONFLICT (symbol) DO NOTHING',
        [company.symbol, company.name, company.sector]
      );
    }
    console.log('✅ Companies inserted');
    
    // Insert crisis comparison data
    console.log('Inserting crisis comparison data...');
    for (const crisis of crisisData) {
      await query(
        'INSERT INTO crisis_comparisons (crisis_name, date, metric_name, value) VALUES ($1, $2, $3, $4)',
        [crisis.crisis, crisis.date, crisis.metric, crisis.value]
      );
    }
    console.log('✅ Crisis data inserted');
    
    // Insert macro indicator names (placeholders)
    const macroIndicators = [
      'SP500', 'VIX', 'GDP', 'FED_FUNDS_RATE', '10Y_TREASURY', '2Y_TREASURY',
      'YIELD_CURVE_SPREAD', 'M2_MONEY_SUPPLY', 'UNEMPLOYMENT_RATE', 'CPI',
      'CORPORATE_BOND_SPREAD', 'REPO_RATE'
    ];
    
    console.log('Inserting macro indicator placeholders...');
    const today = new Date().toISOString().split('T')[0];
    for (const indicator of macroIndicators) {
      await query(
        'INSERT INTO macro_data (date, indicator_name, value) VALUES ($1, $2, $3) ON CONFLICT (date, indicator_name) DO NOTHING',
        [today, indicator, 0]
      );
    }
    console.log('✅ Macro indicators initialized');
    
    console.log('🎉 Database seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();
