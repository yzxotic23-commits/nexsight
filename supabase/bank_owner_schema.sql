-- Table: bank_owner
-- Description: Stores bank owner data with daily values per month

CREATE TABLE IF NOT EXISTS bank_owner (
  id BIGSERIAL PRIMARY KEY,
  particular TEXT NOT NULL DEFAULT 'Bank Owner',
  month TEXT NOT NULL, -- Format: YYYY-MM (e.g., 2024-01)
  currency TEXT NOT NULL DEFAULT 'SGD', -- Only SGD allowed
  date_values JSONB DEFAULT '{}'::jsonb, -- Stores date values like {"01-Jan": "912.52", "05-Jan": "738.52"}
  total DECIMAL(10, 2) DEFAULT 0.00, -- Auto calculated from date_values
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT,
  UNIQUE(particular, month, currency) -- One record per particular per month per currency
);

-- Add constraint to ensure currency is always SGD
ALTER TABLE bank_owner ADD CONSTRAINT check_currency_sgd CHECK (currency = 'SGD');

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_bank_owner_month ON bank_owner(month);
CREATE INDEX IF NOT EXISTS idx_bank_owner_particular ON bank_owner(particular);
CREATE INDEX IF NOT EXISTS idx_bank_owner_currency ON bank_owner(currency);
CREATE INDEX IF NOT EXISTS idx_bank_owner_created_at ON bank_owner(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE bank_owner ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users (adjust as needed)
CREATE POLICY "Allow all operations for authenticated users" ON bank_owner
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_bank_owner_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_update_bank_owner_updated_at
  BEFORE UPDATE ON bank_owner
  FOR EACH ROW
  EXECUTE FUNCTION update_bank_owner_updated_at();

-- Function to auto-calculate total from date_values
CREATE OR REPLACE FUNCTION calculate_bank_owner_total()
RETURNS TRIGGER AS $$
DECLARE
  total_value DECIMAL(10, 2) := 0;
  date_key TEXT;
  date_value TEXT;
BEGIN
  -- Loop through all date values in JSONB and sum them
  FOR date_key, date_value IN SELECT * FROM jsonb_each_text(NEW.date_values)
  LOOP
    -- Only sum if value is not empty and not '-'
    IF date_value IS NOT NULL AND date_value != '' AND date_value != '-' THEN
      BEGIN
        total_value := total_value + COALESCE(date_value::DECIMAL, 0);
      EXCEPTION WHEN OTHERS THEN
        -- Skip invalid numeric values
        NULL;
      END;
    END IF;
  END LOOP;
  
  NEW.total := total_value;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate total on INSERT and UPDATE
CREATE TRIGGER trigger_calculate_bank_owner_total
  BEFORE INSERT OR UPDATE ON bank_owner
  FOR EACH ROW
  EXECUTE FUNCTION calculate_bank_owner_total();

-- Comments
COMMENT ON TABLE bank_owner IS 'Bank owner data with daily values per month (SGD only)';
COMMENT ON COLUMN bank_owner.particular IS 'Particular name (e.g., Bank Owner)';
COMMENT ON COLUMN bank_owner.month IS 'Month in YYYY-MM format (e.g., 2024-01)';
COMMENT ON COLUMN bank_owner.currency IS 'Currency (always SGD)';
COMMENT ON COLUMN bank_owner.date_values IS 'JSONB object storing date values like {"01-Jan": "912.52", "05-Jan": "738.52"}';
COMMENT ON COLUMN bank_owner.total IS 'Total amount (auto-calculated from date_values)';
