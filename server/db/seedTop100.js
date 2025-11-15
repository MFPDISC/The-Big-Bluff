import { query } from './connection.js';

// Top 100 US companies by market cap across all sectors
const top100Companies = [
  // Top 10 Tech Giants (already in DB)
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Technology' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' },
  { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology' },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Automotive' },
  { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Technology' },
  { symbol: 'ADBE', name: 'Adobe Inc.', sector: 'Technology' },
  { symbol: 'CRM', name: 'Salesforce Inc.', sector: 'Technology' },
  
  // More Tech (11-30)
  { symbol: 'AVGO', name: 'Broadcom Inc.', sector: 'Technology' },
  { symbol: 'ORCL', name: 'Oracle Corporation', sector: 'Technology' },
  { symbol: 'CSCO', name: 'Cisco Systems Inc.', sector: 'Technology' },
  { symbol: 'ACN', name: 'Accenture plc', sector: 'Technology' },
  { symbol: 'INTC', name: 'Intel Corporation', sector: 'Technology' },
  { symbol: 'AMD', name: 'Advanced Micro Devices Inc.', sector: 'Technology' },
  { symbol: 'IBM', name: 'International Business Machines', sector: 'Technology' },
  { symbol: 'QCOM', name: 'QUALCOMM Incorporated', sector: 'Technology' },
  { symbol: 'TXN', name: 'Texas Instruments Inc.', sector: 'Technology' },
  { symbol: 'INTU', name: 'Intuit Inc.', sector: 'Technology' },
  { symbol: 'NOW', name: 'ServiceNow Inc.', sector: 'Technology' },
  { symbol: 'AMAT', name: 'Applied Materials Inc.', sector: 'Technology' },
  { symbol: 'MU', name: 'Micron Technology Inc.', sector: 'Technology' },
  { symbol: 'LRCX', name: 'Lam Research Corporation', sector: 'Technology' },
  { symbol: 'KLAC', name: 'KLA Corporation', sector: 'Technology' },
  { symbol: 'SNPS', name: 'Synopsys Inc.', sector: 'Technology' },
  { symbol: 'CDNS', name: 'Cadence Design Systems', sector: 'Technology' },
  { symbol: 'PANW', name: 'Palo Alto Networks Inc.', sector: 'Technology' },
  { symbol: 'CRWD', name: 'CrowdStrike Holdings Inc.', sector: 'Technology' },
  { symbol: 'ADSK', name: 'Autodesk Inc.', sector: 'Technology' },
  
  // Finance (31-45)
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Finance' },
  { symbol: 'BAC', name: 'Bank of America Corporation', sector: 'Finance' },
  { symbol: 'WFC', name: 'Wells Fargo & Company', sector: 'Finance' },
  { symbol: 'GS', name: 'The Goldman Sachs Group Inc.', sector: 'Finance' },
  { symbol: 'MS', name: 'Morgan Stanley', sector: 'Finance' },
  { symbol: 'C', name: 'Citigroup Inc.', sector: 'Finance' },
  { symbol: 'BLK', name: 'BlackRock Inc.', sector: 'Finance' },
  { symbol: 'SCHW', name: 'The Charles Schwab Corporation', sector: 'Finance' },
  { symbol: 'AXP', name: 'American Express Company', sector: 'Finance' },
  { symbol: 'USB', name: 'U.S. Bancorp', sector: 'Finance' },
  { symbol: 'PNC', name: 'The PNC Financial Services Group', sector: 'Finance' },
  { symbol: 'TFC', name: 'Truist Financial Corporation', sector: 'Finance' },
  { symbol: 'COF', name: 'Capital One Financial Corporation', sector: 'Finance' },
  { symbol: 'BK', name: 'The Bank of New York Mellon', sector: 'Finance' },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Finance' },
  
  // Healthcare (46-60)
  { symbol: 'UNH', name: 'UnitedHealth Group Inc.', sector: 'Healthcare' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
  { symbol: 'LLY', name: 'Eli Lilly and Company', sector: 'Healthcare' },
  { symbol: 'ABBV', name: 'AbbVie Inc.', sector: 'Healthcare' },
  { symbol: 'MRK', name: 'Merck & Co. Inc.', sector: 'Healthcare' },
  { symbol: 'PFE', name: 'Pfizer Inc.', sector: 'Healthcare' },
  { symbol: 'TMO', name: 'Thermo Fisher Scientific Inc.', sector: 'Healthcare' },
  { symbol: 'ABT', name: 'Abbott Laboratories', sector: 'Healthcare' },
  { symbol: 'DHR', name: 'Danaher Corporation', sector: 'Healthcare' },
  { symbol: 'BMY', name: 'Bristol-Myers Squibb Company', sector: 'Healthcare' },
  { symbol: 'AMGN', name: 'Amgen Inc.', sector: 'Healthcare' },
  { symbol: 'GILD', name: 'Gilead Sciences Inc.', sector: 'Healthcare' },
  { symbol: 'CVS', name: 'CVS Health Corporation', sector: 'Healthcare' },
  { symbol: 'CI', name: 'The Cigna Group', sector: 'Healthcare' },
  { symbol: 'ISRG', name: 'Intuitive Surgical Inc.', sector: 'Healthcare' },
  
  // Consumer (61-75)
  { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Consumer' },
  { symbol: 'HD', name: 'The Home Depot Inc.', sector: 'Consumer' },
  { symbol: 'PG', name: 'The Procter & Gamble Company', sector: 'Consumer' },
  { symbol: 'KO', name: 'The Coca-Cola Company', sector: 'Consumer' },
  { symbol: 'PEP', name: 'PepsiCo Inc.', sector: 'Consumer' },
  { symbol: 'COST', name: 'Costco Wholesale Corporation', sector: 'Consumer' },
  { symbol: 'MCD', name: 'McDonald\'s Corporation', sector: 'Consumer' },
  { symbol: 'NKE', name: 'NIKE Inc.', sector: 'Consumer' },
  { symbol: 'SBUX', name: 'Starbucks Corporation', sector: 'Consumer' },
  { symbol: 'TGT', name: 'Target Corporation', sector: 'Consumer' },
  { symbol: 'LOW', name: 'Lowe\'s Companies Inc.', sector: 'Consumer' },
  { symbol: 'TJX', name: 'The TJX Companies Inc.', sector: 'Consumer' },
  { symbol: 'PM', name: 'Philip Morris International Inc.', sector: 'Consumer' },
  { symbol: 'MO', name: 'Altria Group Inc.', sector: 'Consumer' },
  { symbol: 'CL', name: 'Colgate-Palmolive Company', sector: 'Consumer' },
  
  // Industrials (76-85)
  { symbol: 'BA', name: 'The Boeing Company', sector: 'Industrials' },
  { symbol: 'CAT', name: 'Caterpillar Inc.', sector: 'Industrials' },
  { symbol: 'GE', name: 'General Electric Company', sector: 'Industrials' },
  { symbol: 'HON', name: 'Honeywell International Inc.', sector: 'Industrials' },
  { symbol: 'UPS', name: 'United Parcel Service Inc.', sector: 'Industrials' },
  { symbol: 'RTX', name: 'RTX Corporation', sector: 'Industrials' },
  { symbol: 'LMT', name: 'Lockheed Martin Corporation', sector: 'Industrials' },
  { symbol: 'DE', name: 'Deere & Company', sector: 'Industrials' },
  { symbol: 'MMM', name: '3M Company', sector: 'Industrials' },
  { symbol: 'UNP', name: 'Union Pacific Corporation', sector: 'Industrials' },
  
  // Energy (86-92)
  { symbol: 'XOM', name: 'Exxon Mobil Corporation', sector: 'Energy' },
  { symbol: 'CVX', name: 'Chevron Corporation', sector: 'Energy' },
  { symbol: 'COP', name: 'ConocoPhillips', sector: 'Energy' },
  { symbol: 'SLB', name: 'Schlumberger Limited', sector: 'Energy' },
  { symbol: 'EOG', name: 'EOG Resources Inc.', sector: 'Energy' },
  { symbol: 'MPC', name: 'Marathon Petroleum Corporation', sector: 'Energy' },
  { symbol: 'PSX', name: 'Phillips 66', sector: 'Energy' },
  
  // Telecom/Media (93-100)
  { symbol: 'VZ', name: 'Verizon Communications Inc.', sector: 'Telecom' },
  { symbol: 'T', name: 'AT&T Inc.', sector: 'Telecom' },
  { symbol: 'CMCSA', name: 'Comcast Corporation', sector: 'Media' },
  { symbol: 'TMUS', name: 'T-Mobile US Inc.', sector: 'Telecom' },
  { symbol: 'DIS', name: 'The Walt Disney Company', sector: 'Media' },
  { symbol: 'CHTR', name: 'Charter Communications Inc.', sector: 'Media' },
  { symbol: 'WBD', name: 'Warner Bros. Discovery Inc.', sector: 'Media' },
  { symbol: 'NXPI', name: 'NXP Semiconductors N.V.', sector: 'Technology' }
];

async function seedTop100() {
  try {
    console.log('🌱 Starting Top 100 Companies seeding...');
    console.log(`📊 Total companies to seed: ${top100Companies.length}`);
    
    let inserted = 0;
    let skipped = 0;
    
    for (const company of top100Companies) {
      try {
        const result = await query(
          'INSERT INTO companies (symbol, name, sector) VALUES ($1, $2, $3) ON CONFLICT (symbol) DO NOTHING RETURNING *',
          [company.symbol, company.name, company.sector]
        );
        
        if (result.rows.length > 0) {
          inserted++;
          console.log(`✅ Inserted: ${company.symbol} - ${company.name}`);
        } else {
          skipped++;
          console.log(`⏭️  Skipped (already exists): ${company.symbol}`);
        }
      } catch (error) {
        console.error(`❌ Error inserting ${company.symbol}:`, error.message);
      }
    }
    
    console.log('\n📈 Seeding Summary:');
    console.log(`   ✅ Inserted: ${inserted} companies`);
    console.log(`   ⏭️  Skipped: ${skipped} companies`);
    console.log(`   📊 Total: ${top100Companies.length} companies`);
    console.log('\n🎉 Top 100 Companies seeding complete!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedTop100();
