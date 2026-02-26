-- Table: bank_price
-- Description: Stores bank account rental price information

CREATE TABLE IF NOT EXISTS bank_price (
  id BIGSERIAL PRIMARY KEY,
  supplier TEXT NOT NULL DEFAULT 'WEALTH+',
  bank_account_name TEXT,
  status TEXT DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, SUSPEND
  department TEXT,
  sell_off TEXT,
  start_date DATE,
  currency TEXT NOT NULL, -- SGD, MYR, USC
  rental_commission DECIMAL(10, 2) DEFAULT 0.00,
  commission DECIMAL(10, 2) DEFAULT 0.00,
  markup DECIMAL(10, 2),
  sales DECIMAL(10, 2),
  addition TEXT,
  remark TEXT,
  payment_total DECIMAL(10, 2) DEFAULT 0.00, -- Auto calculated: rental_commission + commission
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_bank_price_currency ON bank_price(currency);
CREATE INDEX IF NOT EXISTS idx_bank_price_status ON bank_price(status);
CREATE INDEX IF NOT EXISTS idx_bank_price_created_at ON bank_price(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE bank_price ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users (adjust as needed)
CREATE POLICY "Allow all operations for authenticated users" ON bank_price
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_bank_price_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_update_bank_price_updated_at
  BEFORE UPDATE ON bank_price
  FOR EACH ROW
  EXECUTE FUNCTION update_bank_price_updated_at();

-- Function to auto-calculate payment_total
CREATE OR REPLACE FUNCTION calculate_payment_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.payment_total = COALESCE(NEW.rental_commission, 0) + COALESCE(NEW.commission, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate payment_total on INSERT and UPDATE
CREATE TRIGGER trigger_calculate_payment_total
  BEFORE INSERT OR UPDATE ON bank_price
  FOR EACH ROW
  EXECUTE FUNCTION calculate_payment_total();

-- Comments
COMMENT ON TABLE bank_price IS 'Bank account rental price information';
COMMENT ON COLUMN bank_price.supplier IS 'Supplier name (default: WEALTH+)';
COMMENT ON COLUMN bank_price.bank_account_name IS 'Name of the bank account holder';
COMMENT ON COLUMN bank_price.status IS 'Account status: ACTIVE, INACTIVE, or SUSPEND';
COMMENT ON COLUMN bank_price.department IS 'Department code (e.g., NP_INT_SGD)';
COMMENT ON COLUMN bank_price.sell_off IS 'Sell-off status (e.g., OFF)';
COMMENT ON COLUMN bank_price.start_date IS 'Rental start date';
COMMENT ON COLUMN bank_price.currency IS 'Currency: SGD, MYR, or USC';
COMMENT ON COLUMN bank_price.rental_commission IS 'Rental commission amount';
COMMENT ON COLUMN bank_price.commission IS 'Commission amount';
COMMENT ON COLUMN bank_price.markup IS 'Markup amount';
COMMENT ON COLUMN bank_price.sales IS 'Sales amount';
COMMENT ON COLUMN bank_price.addition IS 'Additional information';
COMMENT ON COLUMN bank_price.remark IS 'Remark or notes';
COMMENT ON COLUMN bank_price.payment_total IS 'Total payment (auto-calculated: rental_commission + commission)';
