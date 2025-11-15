import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const FRED_API_KEY = process.env.FRED_API_KEY;
const FRED_BASE_URL = 'https://api.stlouisfed.org/fred/series/observations';

// FRED series IDs for macro indicators
const FRED_SERIES = {
  GDP: 'GDP',                           // Gross Domestic Product
  FED_FUNDS: 'FEDFUNDS',               // Federal Funds Rate
  TREASURY_10Y: 'DGS10',               // 10-Year Treasury
  TREASURY_2Y: 'DGS2',                 // 2-Year Treasury
  M2_SUPPLY: 'M2SL',                   // M2 Money Supply
  UNEMPLOYMENT: 'UNRATE',              // Unemployment Rate
  CPI: 'CPIAUCSL',                     // Consumer Price Index
  CORPORATE_SPREAD: 'BAMLC0A0CMEY',    // Corporate Bond Spread
  CAPE: 'CAPE',                        // Shiller P/E Ratio (Cyclically Adjusted)
  WILSHIRE_5000: 'WILL5000INDFC',      // Wilshire 5000 Total Market Index
  HY_SPREAD: 'BAMLH0A0HYM2',           // High Yield Bond Spread
};

// Fetch data from FRED API
async function fetchFREDData(seriesId, limit = 1) {
  if (!FRED_API_KEY) {
    console.log(`⚠️  FRED API key not set - using mock data for ${seriesId}`);
    return getMockMacroData(seriesId);
  }
  
  try {
    const response = await axios.get(FRED_BASE_URL, {
      params: {
        series_id: seriesId,
        api_key: FRED_API_KEY,
        file_type: 'json',
        sort_order: 'desc',
        limit: limit
      }
    });
    
    return response.data.observations;
  } catch (error) {
    console.error(`Error fetching FRED data for ${seriesId}:`, error.message);
    return getMockMacroData(seriesId);
  }
}

// Fetch all macro indicators
export async function fetchAllMacroIndicators() {
  try {
    const [gdp, fedFunds, treasury10y, treasury2y, m2, unemployment, cpi, corporateSpread] = await Promise.all([
      fetchFREDData(FRED_SERIES.GDP),
      fetchFREDData(FRED_SERIES.FED_FUNDS),
      fetchFREDData(FRED_SERIES.TREASURY_10Y),
      fetchFREDData(FRED_SERIES.TREASURY_2Y),
      fetchFREDData(FRED_SERIES.M2_SUPPLY),
      fetchFREDData(FRED_SERIES.UNEMPLOYMENT),
      fetchFREDData(FRED_SERIES.CPI),
      fetchFREDData(FRED_SERIES.CORPORATE_SPREAD)
    ]);
    
    const data = {
      GDP: parseFloat(gdp[0]?.value) || 27000,
      FED_FUNDS_RATE: parseFloat(fedFunds[0]?.value) || 5.33,
      '10Y_TREASURY': parseFloat(treasury10y[0]?.value) || 4.25,
      '2Y_TREASURY': parseFloat(treasury2y[0]?.value) || 4.65,
      YIELD_CURVE_SPREAD: parseFloat(treasury10y[0]?.value) - parseFloat(treasury2y[0]?.value) || -0.40,
      M2_MONEY_SUPPLY: parseFloat(m2[0]?.value) || 21000,
      UNEMPLOYMENT_RATE: parseFloat(unemployment[0]?.value) || 3.8,
      CPI: parseFloat(cpi[0]?.value) || 314,
      CORPORATE_BOND_SPREAD: parseFloat(corporateSpread[0]?.value) || 1.5,
      date: new Date()
    };
    
    return data;
  } catch (error) {
    console.error('Error fetching macro indicators:', error);
    return getMockMacroData();
  }
}

// Fetch historical GDP
export async function fetchGDPHistory(years = 10) {
  const limit = years * 4; // Quarterly data
  const data = await fetchFREDData(FRED_SERIES.GDP, limit);
  
  return data.map(item => ({
    date: item.date,
    value: parseFloat(item.value)
  })).reverse();
}

// Fetch interest rate history
export async function fetchInterestRateHistory(days = 365) {
  const data = await fetchFREDData(FRED_SERIES.FED_FUNDS, days);
  
  return data.map(item => ({
    date: item.date,
    value: parseFloat(item.value)
  })).reverse();
}

// Fetch yield curve data
export async function fetchYieldCurve() {
  const [y2, y5, y10, y30] = await Promise.all([
    fetchFREDData('DGS2'),
    fetchFREDData('DGS5'),
    fetchFREDData('DGS10'),
    fetchFREDData('DGS30')
  ]);
  
  return {
    '2Y': parseFloat(y2[0]?.value) || 4.65,
    '5Y': parseFloat(y5[0]?.value) || 4.35,
    '10Y': parseFloat(y10[0]?.value) || 4.25,
    '30Y': parseFloat(y30[0]?.value) || 4.40,
    isInverted: (parseFloat(y2[0]?.value) || 0) > (parseFloat(y10[0]?.value) || 0),
    spread: (parseFloat(y10[0]?.value) || 0) - (parseFloat(y2[0]?.value) || 0)
  };
}

// Fetch bubble indicators
export async function fetchBubbleIndicators() {
  try {
    const [cape, wilshire, gdp, hySpread] = await Promise.all([
      fetchFREDData(FRED_SERIES.CAPE),
      fetchFREDData(FRED_SERIES.WILSHIRE_5000),
      fetchFREDData(FRED_SERIES.GDP),
      fetchFREDData(FRED_SERIES.HY_SPREAD)
    ]);
    
    const capeValue = parseFloat(cape[0]?.value) || 30;
    // Wilshire 5000 is in millions, GDP is in billions - normalize both to trillions
    const wilshireValue = parseFloat(wilshire[0]?.value) / 1e6 || 45; // Convert millions to trillions
    const gdpValue = parseFloat(gdp[0]?.value) / 1e3 || 27; // Convert billions to trillions
    const hySpreadValue = parseFloat(hySpread[0]?.value) || 4.5;
    
    // Calculate Buffett Indicator (Market Cap to GDP ratio)
    const buffettIndicator = (wilshireValue / gdpValue) * 100;
    
    return {
      cape: {
        value: capeValue,
        warning: capeValue > 30,
        critical: capeValue > 35,
        interpretation: capeValue > 35 ? 'Extremely Overvalued' : 
                       capeValue > 30 ? 'Overvalued' : 
                       capeValue > 20 ? 'Fair Value' : 'Undervalued'
      },
      buffettIndicator: {
        value: buffettIndicator,
        warning: buffettIndicator > 150,
        critical: buffettIndicator > 200,
        interpretation: buffettIndicator > 200 ? 'Extremely Overvalued' : 
                       buffettIndicator > 150 ? 'Overvalued' : 
                       buffettIndicator > 100 ? 'Fair Value' : 'Undervalued'
      },
      hySpread: {
        value: hySpreadValue,
        warning: hySpreadValue < 4,
        critical: hySpreadValue < 3,
        interpretation: hySpreadValue < 3 ? 'Extreme Complacency' : 
                       hySpreadValue < 4 ? 'Low Risk Premium' : 
                       hySpreadValue < 6 ? 'Normal' : 'High Risk'
      },
      date: new Date()
    };
  } catch (error) {
    console.error('Error fetching bubble indicators:', error);
    return {
      cape: { value: 30, warning: false, critical: false, interpretation: 'Fair Value' },
      buffettIndicator: { value: 180, warning: true, critical: false, interpretation: 'Overvalued' },
      hySpread: { value: 4.5, warning: false, critical: false, interpretation: 'Normal' },
      date: new Date()
    };
  }
}

// Mock macro data for testing
function getMockMacroData(seriesId) {
  const mockData = {
    GDP: [{ date: new Date().toISOString().split('T')[0], value: '27000' }],
    FEDFUNDS: [{ date: new Date().toISOString().split('T')[0], value: '5.33' }],
    DGS10: [{ date: new Date().toISOString().split('T')[0], value: '4.25' }],
    DGS2: [{ date: new Date().toISOString().split('T')[0], value: '4.65' }],
    M2SL: [{ date: new Date().toISOString().split('T')[0], value: '21000' }],
    UNRATE: [{ date: new Date().toISOString().split('T')[0], value: '3.8' }],
    CPIAUCSL: [{ date: new Date().toISOString().split('T')[0], value: '314' }],
    BAMLC0A0CMEY: [{ date: new Date().toISOString().split('T')[0], value: '1.5' }],
    CAPE: [{ date: new Date().toISOString().split('T')[0], value: '27.5' }],
    WILL5000INDFC: [{ date: new Date().toISOString().split('T')[0], value: '45000000' }], // 45 trillion in millions
    BAMLH0A0HYM2: [{ date: new Date().toISOString().split('T')[0], value: '3.8' }]
  };
  
  if (seriesId) {
    return mockData[seriesId] || mockData.GDP;
  }
  
  return {
    GDP: 27000,
    FED_FUNDS_RATE: 5.33,
    '10Y_TREASURY': 4.25,
    '2Y_TREASURY': 4.65,
    YIELD_CURVE_SPREAD: -0.40,
    M2_MONEY_SUPPLY: 21000,
    UNEMPLOYMENT_RATE: 3.8,
    CPI: 314,
    CORPORATE_BOND_SPREAD: 1.5,
    date: new Date()
  };
}

export default {
  fetchAllMacroIndicators,
  fetchGDPHistory,
  fetchInterestRateHistory,
  fetchYieldCurve
};
