import { query } from './connection.js';

// Generate historical debt maturity data from 2000-2030
// This creates realistic debt patterns for all 100 companies
async function generateHistoricalMaturityData() {
  console.log('🗓️  Generating historical debt maturity data (2000-2030)...');

  try {
    // Get all companies
    const companies = await query('SELECT id, symbol, name, sector FROM companies');
    console.log(`📊 Found ${companies.rows.length} companies`);

    const maturityRecords = [];
    const currentYear = new Date().getFullYear();

    // For each company, generate debt maturities across years
    for (const company of companies.rows) {
      const companyId = company.id;
      const symbol = company.symbol;
      const sector = company.sector;

      // Determine debt characteristics based on sector
      const sectorProfile = getSectorProfile(sector);
      
      // Generate maturities from 2000 to 2030
      for (let year = 2000; year <= 2030; year++) {
        // Number of debt instruments per year (varies by company size and sector)
        const numInstruments = Math.floor(Math.random() * sectorProfile.maxInstruments) + 1;
        
        for (let i = 0; i < numInstruments; i++) {
          // Random quarter
          const quarter = Math.floor(Math.random() * 4) + 1;
          const month = quarter * 3;
          const day = Math.floor(Math.random() * 28) + 1;
          const maturityDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

          // Debt amount varies by company size and year
          const baseAmount = sectorProfile.baseAmount;
          const yearMultiplier = 1 + ((year - 2000) / 30) * 0.5; // Debt grows over time
          const amount = Math.floor((baseAmount + Math.random() * baseAmount) * yearMultiplier);

          // Interest rate varies by year (higher in early 2000s, lower 2010s, higher again 2020s)
          const interestRate = getHistoricalInterestRate(year) + (Math.random() * 2 - 1);

          // Debt type
          const debtTypes = [
            'Senior Notes',
            'Senior Unsecured Notes',
            'Term Loan',
            'Revolving Credit Facility',
            'Convertible Notes'
          ];
          const debtType = `${interestRate.toFixed(2)}% ${debtTypes[Math.floor(Math.random() * debtTypes.length)]}`;

          // Refinancing risk
          const isPast = year < currentYear;
          const isNearTerm = year <= currentYear + 2;
          let refinancingRisk;
          
          if (isPast) {
            refinancingRisk = 'MATURED';
          } else if (isNearTerm && interestRate > 5) {
            refinancingRisk = 'HIGH';
          } else if (isNearTerm) {
            refinancingRisk = 'MEDIUM';
          } else {
            refinancingRisk = 'LOW';
          }

          maturityRecords.push({
            companyId,
            symbol,
            debtType,
            amount,
            maturityDate,
            interestRate: parseFloat(interestRate.toFixed(2)),
            refinancingRisk
          });
        }
      }
    }

    console.log(`📝 Generated ${maturityRecords.length} maturity records`);
    console.log('💾 Inserting into database...');

    // Insert in batches
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < maturityRecords.length; i += batchSize) {
      const batch = maturityRecords.slice(i, i + batchSize);
      
      for (const record of batch) {
        try {
          await query(
            `INSERT INTO debt_maturities 
             (company_id, debt_type, amount, maturity_date, interest_rate, refinancing_risk)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT DO NOTHING`,
            [
              record.companyId,
              record.debtType,
              record.amount,
              record.maturityDate,
              record.interestRate,
              record.refinancingRisk
            ]
          );
          inserted++;
        } catch (error) {
          console.error(`Error inserting record for ${record.symbol}:`, error.message);
        }
      }

      if ((i + batchSize) % 500 === 0) {
        console.log(`   Inserted ${i + batchSize}/${maturityRecords.length} records...`);
      }
    }

    console.log(`✅ Successfully inserted ${inserted} debt maturity records`);

    // Show summary by year
    const summary = await query(`
      SELECT 
        EXTRACT(YEAR FROM maturity_date) as year,
        COUNT(*) as count,
        SUM(amount) as total_amount,
        COUNT(DISTINCT company_id) as company_count
      FROM debt_maturities
      GROUP BY EXTRACT(YEAR FROM maturity_date)
      ORDER BY year
    `);

    console.log('\n📊 Debt Maturity Summary by Year:');
    summary.rows.forEach(row => {
      console.log(`   ${row.year}: $${(row.total_amount / 1e9).toFixed(1)}B across ${row.count} notes (${row.company_count} companies)`);
    });

    console.log('\n🎉 Historical debt maturity data seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

// Helper functions
function getSectorProfile(sector) {
  const profiles = {
    'Technology': { baseAmount: 2e9, maxInstruments: 4 },
    'Finance': { baseAmount: 5e9, maxInstruments: 5 },
    'Healthcare': { baseAmount: 3e9, maxInstruments: 3 },
    'Consumer': { baseAmount: 2.5e9, maxInstruments: 3 },
    'Industrials': { baseAmount: 3e9, maxInstruments: 3 },
    'Energy': { baseAmount: 4e9, maxInstruments: 4 },
    'Telecom': { baseAmount: 6e9, maxInstruments: 4 },
    'Media': { baseAmount: 3e9, maxInstruments: 3 },
    'Automotive': { baseAmount: 4e9, maxInstruments: 3 }
  };

  return profiles[sector] || { baseAmount: 2e9, maxInstruments: 3 };
}

function getHistoricalInterestRate(year) {
  // Approximate historical interest rate environment
  if (year >= 2000 && year <= 2001) return 6.5; // Dot-com era
  if (year >= 2002 && year <= 2006) return 4.5; // Post dot-com recovery
  if (year >= 2007 && year <= 2008) return 5.5; // Pre-crisis
  if (year >= 2009 && year <= 2015) return 2.5; // Post-crisis low rates
  if (year >= 2016 && year <= 2019) return 3.5; // Gradual increase
  if (year >= 2020 && year <= 2021) return 2.0; // COVID low rates
  if (year >= 2022 && year <= 2024) return 5.0; // Inflation fighting
  return 4.5; // Future projection
}

function calculateIssueDate(maturityDate) {
  // Typical corporate bonds are 5-10 years
  const maturity = new Date(maturityDate);
  const yearsToMaturity = 5 + Math.floor(Math.random() * 5);
  const issueDate = new Date(maturity);
  issueDate.setFullYear(issueDate.getFullYear() - yearsToMaturity);
  return issueDate.toISOString().split('T')[0];
}

generateHistoricalMaturityData();
