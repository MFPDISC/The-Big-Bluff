-- Update cash on hand for existing financial records
UPDATE financials SET 
  cash_on_hand = 48000000000,
  total_cash = 48000000000,
  short_term_investments = 9600000000
WHERE company_id = (SELECT id FROM companies WHERE symbol = 'AAPL');

UPDATE financials SET 
  cash_on_hand = 104000000000,
  total_cash = 104000000000,
  short_term_investments = 20800000000
WHERE company_id = (SELECT id FROM companies WHERE symbol = 'MSFT');

UPDATE financials SET 
  cash_on_hand = 116000000000,
  total_cash = 116000000000,
  short_term_investments = 23200000000
WHERE company_id = (SELECT id FROM companies WHERE symbol = 'GOOGL');

UPDATE financials SET 
  cash_on_hand = 73000000000,
  total_cash = 73000000000,
  short_term_investments = 14600000000
WHERE company_id = (SELECT id FROM companies WHERE symbol = 'AMZN');

UPDATE financials SET 
  cash_on_hand = 18000000000,
  total_cash = 18000000000,
  short_term_investments = 3600000000
WHERE company_id = (SELECT id FROM companies WHERE symbol = 'NVDA');

UPDATE financials SET 
  cash_on_hand = 41000000000,
  total_cash = 41000000000,
  short_term_investments = 8200000000
WHERE company_id = (SELECT id FROM companies WHERE symbol = 'META');

UPDATE financials SET 
  cash_on_hand = 16000000000,
  total_cash = 16000000000,
  short_term_investments = 3200000000
WHERE company_id = (SELECT id FROM companies WHERE symbol = 'TSLA');

UPDATE financials SET 
  cash_on_hand = 6000000000,
  total_cash = 6000000000,
  short_term_investments = 1200000000
WHERE company_id = (SELECT id FROM companies WHERE symbol = 'NFLX');
