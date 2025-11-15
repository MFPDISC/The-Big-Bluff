-- The Big Lie Dashboard - Database Schema
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE TABLES
-- ============================================

-- Companies (Top 10 Tech Stocks)
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    sector VARCHAR(100) DEFAULT 'Technology',
    market_cap BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock Prices (Time-Series)
CREATE TABLE stock_prices (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    open DECIMAL(12, 4),
    high DECIMAL(12, 4),
    low DECIMAL(12, 4),
    close DECIMAL(12, 4) NOT NULL,
    volume BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, date)
);

-- Company Financials (Quarterly)
CREATE TABLE financials (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    quarter INTEGER CHECK (quarter BETWEEN 1 AND 4),
    year INTEGER,
    total_debt BIGINT,
    total_equity BIGINT,
    ebit BIGINT,
    interest_expense BIGINT,
    free_cash_flow BIGINT,
    revenue BIGINT,
    net_income BIGINT,
    total_assets BIGINT,
    current_assets BIGINT,
    current_liabilities BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, quarter, year)
);

-- Debt Metrics (Calculated Daily)
CREATE TABLE debt_metrics (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    debt_to_equity DECIMAL(10, 4),
    interest_coverage DECIMAL(10, 4),
    z_score DECIMAL(10, 4),
    debt_maturity_1y BIGINT,
    debt_maturity_5y BIGINT,
    altman_score DECIMAL(10, 4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, date)
);

-- Debt Maturity Schedule (When debt comes due)
CREATE TABLE debt_maturities (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    debt_type VARCHAR(100) NOT NULL, -- e.g., 'Senior Notes', 'Convertible Bonds', 'Term Loan'
    amount BIGINT NOT NULL, -- Amount in dollars
    maturity_date DATE NOT NULL,
    interest_rate DECIMAL(6, 4), -- Annual interest rate (e.g., 5.25%)
    currency VARCHAR(3) DEFAULT 'USD',
    is_convertible BOOLEAN DEFAULT false,
    conversion_price DECIMAL(10, 2), -- For convertible bonds
    refinancing_risk VARCHAR(20), -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_debt_maturity_company ON debt_maturities(company_id, maturity_date);
CREATE INDEX idx_debt_maturity_date ON debt_maturities(maturity_date);

-- ============================================
-- MACRO INDICATORS
-- ============================================

CREATE TABLE macro_data (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    indicator_name VARCHAR(50) NOT NULL,
    value DECIMAL(15, 6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, indicator_name)
);

-- Create index for faster queries
CREATE INDEX idx_macro_indicator ON macro_data(indicator_name, date DESC);

-- ============================================
-- BITCOIN TABLES
-- ============================================

-- Bitcoin Prices
CREATE TABLE btc_prices (
    id SERIAL PRIMARY KEY,
    date TIMESTAMP NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    volume BIGINT,
    market_cap BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date)
);

-- Corporate Bitcoin Holdings
CREATE TABLE corporate_btc (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    btc_amount DECIMAL(12, 8),
    avg_purchase_price DECIMAL(12, 2),
    current_value BIGINT,
    unrealized_pnl BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, date)
);

-- On-Chain Metrics
CREATE TABLE onchain_data (
    id SERIAL PRIMARY KEY,
    date TIMESTAMP NOT NULL,
    exchange_inflow DECIMAL(15, 8),
    exchange_outflow DECIMAL(15, 8),
    net_flow DECIMAL(15, 8),
    whale_accumulation DECIMAL(15, 8),
    mvrv_ratio DECIMAL(10, 4),
    reserve_risk DECIMAL(10, 4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date)
);

-- BTC Correlations with Tech Stocks
CREATE TABLE btc_correlations (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    correlation_30d DECIMAL(6, 4),
    correlation_90d DECIMAL(6, 4),
    correlation_1y DECIMAL(6, 4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, company_id)
);

-- ============================================
-- RISK & ANALYSIS
-- ============================================

-- Risk Scores (Big Lie Index)
CREATE TABLE risk_scores (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    debt_risk DECIMAL(5, 2),
    valuation_risk DECIMAL(5, 2),
    macro_risk DECIMAL(5, 2),
    correlation_risk DECIMAL(5, 2),
    btc_liquidation_risk DECIMAL(5, 2),
    capital_flight_score DECIMAL(5, 2),
    composite_score DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, date)
);

-- Capital Flows
CREATE TABLE capital_flows (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    tech_net_flow BIGINT,
    btc_net_flow BIGINT,
    gold_net_flow BIGINT,
    bonds_net_flow BIGINT,
    rotation_score DECIMAL(5, 2),
    decoupling_score DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date)
);

-- ETF Flows
CREATE TABLE etf_flows (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    etf_name VARCHAR(100),
    etf_type VARCHAR(50),
    inflow BIGINT,
    outflow BIGINT,
    net_flow BIGINT,
    aum BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Historical Crisis Comparisons
CREATE TABLE crisis_comparisons (
    id SERIAL PRIMARY KEY,
    crisis_name VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    value DECIMAL(15, 6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alerts
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    severity VARCHAR(20) CHECK (severity IN ('critical', 'warning', 'info')),
    category VARCHAR(50),
    message TEXT NOT NULL,
    company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    resolved_at TIMESTAMP
);

CREATE INDEX idx_alerts_active ON alerts(is_active, date DESC);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_stock_prices_date ON stock_prices(company_id, date DESC);
CREATE INDEX idx_btc_prices_date ON btc_prices(date DESC);
CREATE INDEX idx_debt_metrics_date ON debt_metrics(company_id, date DESC);
CREATE INDEX idx_risk_scores_date ON risk_scores(company_id, date DESC);
CREATE INDEX idx_capital_flows_date ON capital_flows(date DESC);

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Latest Risk Scores View
CREATE VIEW latest_risk_scores AS
SELECT DISTINCT ON (company_id)
    company_id,
    date,
    debt_risk,
    valuation_risk,
    macro_risk,
    correlation_risk,
    btc_liquidation_risk,
    capital_flight_score,
    composite_score
FROM risk_scores
ORDER BY company_id, date DESC;

-- Latest Stock Prices View
CREATE VIEW latest_stock_prices AS
SELECT DISTINCT ON (company_id)
    sp.company_id,
    c.symbol,
    c.name,
    sp.date,
    sp.close as price,
    sp.volume
FROM stock_prices sp
JOIN companies c ON sp.company_id = c.id
ORDER BY sp.company_id, sp.date DESC;

-- Latest BTC Correlation View
CREATE VIEW latest_btc_correlations AS
SELECT DISTINCT ON (company_id)
    bc.company_id,
    c.symbol,
    bc.date,
    bc.correlation_30d,
    bc.correlation_90d,
    bc.correlation_1y
FROM btc_correlations bc
JOIN companies c ON bc.company_id = c.id
ORDER BY bc.company_id, bc.date DESC;
