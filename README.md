# The Big Bluff Dashboard 📉

> **Predicting the next tech sector crisis through economic analysis and Bitcoin correlation**

A professional-grade economic analysis dashboard that tracks systemic risk in the US tech sector by analyzing debt levels, macro indicators, Bitcoin correlations, and capital flows. Built to identify warning signals similar to the 2008 financial crisis but focused on tech leverage.

![Dashboard Preview](https://img.shields.io/badge/Status-Production%20Ready-success)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## 🎯 Features

### Core Analytics
- **Big Bluff Index** - Composite risk score (0-100) measuring systemic risk
- **Top 10 Tech Stocks** - Real-time tracking with debt metrics
- **Debt Maturity Timeline** - Track when corporate debt comes due (monthly/quarterly)
- **Debt Wall Analysis** - Identify concentration periods of refinancing risk
- **Altman Z-Score** - Bankruptcy prediction for each company
- **Macro Indicators** - Fed rates, GDP, yield curve, unemployment
- **Bitcoin Correlation** - Track decoupling from tech stocks
- **Corporate BTC Holdings** - Liquidation risk analysis
- **Correlation Matrix** - Contagion risk detection
- **Real-time Alerts** - Automated warnings for critical events

### Technical Features
- 🎨 **Dark Mode** - Professional TradingView-style interface
- 📊 **Interactive Charts** - Lightweight Charts & Recharts
- 🔄 **Real-time Updates** - WebSocket integration
- 📱 **Responsive Design** - Works on all devices
- 💾 **PostgreSQL Database** - Time-series data storage
- ⚡ **Redis Caching** - 60s cache for API calls
- 🐳 **Docker Support** - One-command deployment

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 15+
- Redis 7+
- (Optional) Docker & Docker Compose

### Option 1: Docker (Recommended)

```bash
cd "/Users/on-set/Local-Coding-Repo/The Big Bluff"

# Copy environment file
cp .env.example .env

# Edit .env and add your API keys
nano .env

# Start everything
docker-compose up -d

# View logs
docker-compose logs -f backend
```

**Access the app:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Option 2: Manual Setup

#### 1. Backend Setup

```bash
# Install dependencies
npm install

# Setup PostgreSQL database
createdb biglie_db

# Run migrations
psql biglie_db < server/db/schema.sql

# Seed initial data
npm run seed

# Copy and configure environment
cp .env.example .env
nano .env  # Add your API keys

# Start backend
npm run dev
```

#### 2. Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

#### 3. Access the App

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

---

## 🔑 API Keys Required

### Free APIs (No Credit Card)

1. **Alpha Vantage** (Stock Data)
   - Get key: https://www.alphavantage.co/support/#api-key
   - Limit: 5 calls/min
   - Add to `.env`: `ALPHA_VANTAGE_KEY=your_key`

2. **FRED** (Federal Reserve Data)
   - Get key: https://fred.stlouisfed.org/docs/api/api_key.html
   - Limit: Unlimited
   - Add to `.env`: `FRED_API_KEY=your_key`

### Optional Paid APIs

3. **Financial Modeling Prep** ($15/mo)
   - Get key: https://site.financialmodelingprep.com/developer/docs
   - Better debt/financial data
   - Add to `.env`: `FMP_API_KEY=your_key`

4. **Glassnode** ($39/mo)
   - Get key: https://glassnode.com
   - On-chain Bitcoin metrics
   - Add to `.env`: `GLASSNODE_API_KEY=your_key`

**Note:** App works with free APIs only. Mock data is used as fallback.

---

## 📊 Dashboard Pages

### 1. Main Dashboard (`/`)
- Market overview cards (S&P 500, VIX, Bitcoin, 10Y Treasury)
- Interactive TradingView chart with zoom/pan
- Top 10 tech stocks table with debt metrics

### 2. Debt Analysis (`/debt`)
- Bubble chart (Debt/Equity vs Interest Coverage)
- Total tech sector debt calculation
- Z-Score analysis per company
- Detailed debt metrics table

### 3. Macro Indicators (`/macro`)
- Federal Funds Rate, 10Y/2Y Treasury
- Yield curve visualization (inversion detection)
- GDP growth history (5 years)
- Interest rate trends (1 year)

### 4. Bitcoin Correlation (`/bitcoin`)
- BTC price tracking
- Correlation with each tech stock
- Decoupling score (0-100)
- Corporate Bitcoin holdings
- On-chain metrics (exchange flows)

### 5. Risk Dashboard (`/risk`)
- Big Bluff Index gauge (0-100)
- Risk component breakdown
- Individual company scores
- Historical crisis comparison (2008, 2000)

### 6. Correlations (`/correlations`)
- Correlation heat map matrix
- Average correlation tracking
- Contagion risk indicators

### 7. Alerts (`/alerts`)
- Real-time warning system
- Filter by severity (Critical/Warning/Info)
- Auto-refresh every 30s

---

## 🧮 The Big Bluff Index Formula

```javascript
Big Bluff Index (0-100) = 
  (25% × Debt Risk) +           // Z-scores, debt/equity ratios
  (20% × Valuation Risk) +      // P/E ratios, market cap/GDP
  (20% × Macro Risk) +          // Yield curve, VIX, rates
  (15% × Correlation Risk) +    // Inter-stock correlations
  (10% × BTC Liquidation Risk) + // Corporate BTC exposure
  (10% × Capital Flight Score)  // Tech → BTC rotation
```

**Interpretation:**
- **0-40** 🟢 Low Risk - Markets stable
- **40-60** 🟡 Moderate Risk - Stay vigilant  
- **60-75** 🟠 High Risk - Elevated warnings
- **75-100** 🔴 Critical - Systemic crisis risk

---

## 🛠️ Tech Stack

### Backend
- **Node.js + Express** - REST API server
- **PostgreSQL** - Time-series database
- **Redis** - API response caching
- **Socket.io** - Real-time updates
- **Node-Cron** - Scheduled data fetching
- **Yahoo Finance** - Free stock data
- **Axios** - HTTP requests

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool & dev server
- **TailwindCSS** - Styling (dark mode)
- **Lightweight Charts** - TradingView-style charts
- **Recharts** - Additional visualizations
- **Zustand** - State management
- **React Router** - Navigation
- **Axios** - API calls

---

## 📂 Project Structure

```
/The Big Bluff
├── server/
│   ├── index.js              # Express server
│   ├── db/
│   │   ├── connection.js     # PostgreSQL pool
│   │   ├── schema.sql        # Database schema
│   │   └── seed.js           # Initial data
│   ├── routes/
│   │   ├── stocks.js         # Stock endpoints
│   │   ├── bitcoin.js        # Crypto endpoints
│   │   ├── macro.js          # Macro indicators
│   │   ├── risk.js           # Risk scoring
│   │   ├── alerts.js         # Alert management
│   │   └── correlations.js   # Correlation analysis
│   └── services/
│       ├── stockData.js      # Yahoo Finance integration
│       ├── cryptoData.js     # Bitcoin data fetching
│       ├── macroData.js      # FRED API integration
│       ├── calculations.js   # Z-score, correlations
│       └── riskScorer.js     # Big Bluff Index logic
├── client/
│   ├── src/
│   │   ├── App.jsx           # Main app
│   │   ├── store/
│   │   │   └── useStore.js   # Zustand state
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── TradingViewChart.jsx
│   │   │   └── StockTable.jsx
│   │   └── pages/
│   │       ├── Dashboard.jsx
│   │       ├── DebtAnalysis.jsx
│   │       ├── MacroIndicators.jsx
│   │       ├── BitcoinCorrelation.jsx
│   │       ├── RiskDashboard.jsx
│   │       ├── Correlations.jsx
│   │       └── Alerts.jsx
│   ├── index.html
│   └── package.json
├── docker-compose.yml
├── package.json
└── README.md
```

---

## 🔧 Configuration

### Environment Variables

```env
# Server
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/biglie_db

# Redis
REDIS_URL=redis://localhost:6379

# API Keys
ALPHA_VANTAGE_KEY=your_key_here
FRED_API_KEY=your_key_here
FMP_API_KEY=your_key_here          # Optional
COINGECKO_API_KEY=your_key_here    # Optional
GLASSNODE_API_KEY=your_key_here    # Optional

# Data Refresh (milliseconds)
MARKET_HOURS_REFRESH=900000     # 15 minutes
AFTER_HOURS_REFRESH=3600000     # 1 hour
CACHE_TTL=60                    # 60 seconds
```

---

## 📡 API Endpoints

### Stocks
```
GET  /api/stocks/companies          # List all companies
GET  /api/stocks/prices             # Current prices
GET  /api/stocks/price/:symbol      # Single stock price
GET  /api/stocks/history/:symbol    # Historical data
GET  /api/stocks/financials/:symbol # Balance sheet + metrics
GET  /api/stocks/sp500              # S&P 500 data
GET  /api/stocks/vix                # VIX volatility index
POST /api/stocks/compare            # Compare multiple stocks
```

### Bitcoin
```
GET /api/bitcoin/price              # Current BTC price
GET /api/bitcoin/history            # Historical BTC prices
GET /api/bitcoin/onchain            # On-chain metrics
GET /api/bitcoin/corporate-holdings # Corporate BTC holdings
GET /api/bitcoin/correlations       # BTC vs tech correlations
GET /api/bitcoin/etf-flows          # ETF inflows/outflows
```

### Macro
```
GET /api/macro                      # All macro indicators
GET /api/macro/:indicator           # Specific indicator
GET /api/macro/history/gdp          # GDP history
GET /api/macro/history/rates        # Rate history
GET /api/macro/yield-curve          # Yield curve data
```

### Risk
```
GET /api/risk/big-lie-index         # Overall index + companies
GET /api/risk/company/:symbol       # Company risk score
GET /api/risk/decoupling            # BTC decoupling score
```

### Alerts
```
GET    /api/alerts                  # Get all active alerts
POST   /api/alerts                  # Create new alert
PATCH  /api/alerts/:id/resolve      # Mark as resolved
DELETE /api/alerts/:id              # Delete alert
```

### Correlations
```
GET /api/correlations/matrix        # Full correlation matrix
GET /api/correlations/rolling       # Rolling correlation
GET /api/correlations/average       # Average correlation
```

---

## 🎓 Understanding the Analysis

### Altman Z-Score
- **> 2.99** = Safe Zone (Low bankruptcy risk)
- **1.81 - 2.99** = Grey Zone (Medium risk)
- **< 1.81** = Distress Zone (High risk)

### Debt-to-Equity Ratio
- **< 1.0** = Conservative leverage
- **1.0 - 2.0** = Moderate leverage
- **> 2.0** = High leverage (risky)

### Interest Coverage Ratio
- **> 5.0** = Comfortable
- **3.0 - 5.0** = Adequate
- **< 3.0** = Struggling to pay interest

### Correlation Analysis
- **> 0.8** = Contagion risk (stocks move together)
- **0.3 - 0.8** = Normal sector correlation
- **< 0.3** = Diversified (independent movement)

---

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port in .env
PORT=5001
```

### Database Connection Error
```bash
# Check PostgreSQL is running
pg_isready

# Restart PostgreSQL (Mac)
brew services restart postgresql@15
```

### Redis Connection Error
```bash
# Check Redis is running
redis-cli ping

# Should return: PONG

# Restart Redis (Mac)
brew services restart redis
```

### API Rate Limits
- Alpha Vantage: 5 calls/min (free tier)
- Solution: Add `FMP_API_KEY` for unlimited calls ($15/mo)

---

## 📈 Future Enhancements

- [ ] Machine learning predictions
- [ ] Email/SMS alert system
- [ ] PDF report generation
- [ ] Historical crisis playback
- [ ] Options market analysis
- [ ] Insider trading tracking
- [ ] Mobile app (React Native)

---

## 📝 License

MIT License - feel free to use for analysis or education.

---

## ⚠️ Disclaimer

This dashboard is for **educational and informational purposes only**. It does not constitute financial advice. Always do your own research and consult with licensed financial advisors before making investment decisions.

---

## 🙏 Acknowledgments

- **Data Sources:** Yahoo Finance, Federal Reserve (FRED), CoinGecko
- **Inspired By:** "The Big Short" by Michael Lewis
- **Built With:** React, Node.js, PostgreSQL, TailwindCSS

---

**Built to predict the next crisis. Stay vigilant. 🔍**
# The-Big-Bluff
