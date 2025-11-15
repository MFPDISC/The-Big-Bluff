import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GLASSNODE_KEY = process.env.GLASSNODE_API_KEY;

// Fetch Bitcoin price from Binance (FREE - No API key needed!)
export async function fetchBitcoinPrice() {
  try {
    // Binance 24hr ticker - completely free, no auth
    const response = await axios.get('https://api.binance.com/api/v3/ticker/24hr', {
      params: {
        symbol: 'BTCUSDT'
      }
    });
    
    const data = response.data;
    
    return {
      price: parseFloat(data.lastPrice),
      marketCap: null, // Binance doesn't provide market cap
      volume24h: parseFloat(data.volume) * parseFloat(data.lastPrice),
      change24h: parseFloat(data.priceChangePercent),
      high24h: parseFloat(data.highPrice),
      low24h: parseFloat(data.lowPrice),
      openPrice: parseFloat(data.openPrice)
    };
  } catch (error) {
    console.error('Error fetching Bitcoin price from Binance:', error.message);
    // Fallback to mock data
    return {
      price: 104842,
      marketCap: 2.05e12,
      volume24h: 45e9,
      change24h: 2.84,
      high24h: 106000,
      low24h: 103500,
      openPrice: 102000
    };
  }
}

// Fetch Bitcoin historical prices from Binance (FREE!)
export async function fetchBitcoinHistorical(days = 90) {
  try {
    // Binance klines (candlestick) endpoint - free, no auth
    const interval = days > 30 ? '1d' : '1h';
    const limit = days > 30 ? days : days * 24;
    
    const response = await axios.get('https://api.binance.com/api/v3/klines', {
      params: {
        symbol: 'BTCUSDT',
        interval: interval,
        limit: Math.min(limit, 1000)
      }
    });
    
    return response.data.map(candle => ({
      date: new Date(candle[0]),
      price: parseFloat(candle[4]),
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      volume: parseFloat(candle[5])
    }));
  } catch (error) {
    console.error('Error fetching Bitcoin historical data from Binance:', error.message);
    return [];
  }
}

// Fetch on-chain metrics from Glassnode
export async function fetchOnChainMetrics() {
  if (!GLASSNODE_KEY) {
    console.log('⚠️  Glassnode API key not set - using mock data');
    return generateMockOnChainData();
  }
  
  try {
    // Exchange flows
    const inflowResponse = await axios.get('https://api.glassnode.com/v1/metrics/transactions/transfers_volume_to_exchanges_sum', {
      params: {
        a: 'BTC',
        api_key: GLASSNODE_KEY,
        s: Math.floor(Date.now() / 1000) - 86400,
        i: '24h'
      }
    });
    
    const outflowResponse = await axios.get('https://api.glassnode.com/v1/metrics/transactions/transfers_volume_from_exchanges_sum', {
      params: {
        a: 'BTC',
        api_key: GLASSNODE_KEY,
        s: Math.floor(Date.now() / 1000) - 86400,
        i: '24h'
      }
    });
    
    const inflow = inflowResponse.data[0]?.v || 0;
    const outflow = outflowResponse.data[0]?.v || 0;
    
    return {
      exchangeInflow: inflow,
      exchangeOutflow: outflow,
      netFlow: outflow - inflow, // Positive = net outflow (bullish)
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error fetching on-chain metrics:', error.message);
    return generateMockOnChainData();
  }
}

// Generate mock on-chain data
function generateMockOnChainData() {
  const baseInflow = 15000 + Math.random() * 5000;
  const baseOutflow = 18000 + Math.random() * 5000;
  
  return {
    exchangeInflow: baseInflow,
    exchangeOutflow: baseOutflow,
    netFlow: baseOutflow - baseInflow,
    whaleAccumulation: Math.random() * 1000,
    mvrvRatio: 2.1 + Math.random() * 0.5,
    reserveRisk: 0.003 + Math.random() * 0.002,
    timestamp: new Date()
  };
}

// Corporate Bitcoin holdings (public data)
export const corporateBitcoinHoldings = {
  'MSTR': { // MicroStrategy
    btcAmount: 190000,
    avgPurchasePrice: 30159,
    lastUpdated: '2024-Q3'
  },
  'TSLA': { // Tesla
    btcAmount: 10500,
    avgPurchasePrice: 31620,
    lastUpdated: '2024-Q2'
  },
  'COIN': { // Coinbase (not in top 10 but relevant)
    btcAmount: 9000,
    avgPurchasePrice: 28000,
    lastUpdated: '2024-Q3'
  },
  'SQ': { // Block (Square)
    btcAmount: 8000,
    avgPurchasePrice: 22500,
    lastUpdated: '2024-Q2'
  }
};

// Calculate corporate BTC exposure for our tech companies
export function getCorporateBTCExposure(symbol) {
  return corporateBitcoinHoldings[symbol] || null;
}

// Fetch ETF flows (simplified - would need Bloomberg or similar for real data)
export async function fetchBitcoinETFFlows() {
  // Mock data for major Bitcoin ETFs
  return [
    {
      name: 'BlackRock iShares Bitcoin Trust (IBIT)',
      type: 'bitcoin',
      netFlow: 150000000 + Math.random() * 50000000, // $150M+ daily
      aum: 40000000000 // $40B
    },
    {
      name: 'Fidelity Wise Origin Bitcoin Fund (FBTC)',
      type: 'bitcoin',
      netFlow: 80000000 + Math.random() * 30000000,
      aum: 15000000000
    },
    {
      name: 'Grayscale Bitcoin Trust (GBTC)',
      type: 'bitcoin',
      netFlow: -50000000 + Math.random() * 20000000, // Often outflows
      aum: 25000000000
    }
  ];
}

export default {
  fetchBitcoinPrice,
  fetchBitcoinHistorical,
  fetchOnChainMetrics,
  getCorporateBTCExposure,
  fetchBitcoinETFFlows
};
