-- Migration: Add currency column to bank_owner table
-- Run this script if bank_owner table already exists without currency column

-- Step 1: Add currency column (nullable first)
ALTER TABLE bank_owner 
ADD COLUMN IF NOT EXISTS currency TEXT;

-- Step 2: Set all existing rows to 'SGD'
UPDATE bank_owner 
SET currency = 'SGD' 
WHERE currency IS NULL;

-- Step 3: Make currency NOT NULL and set default
ALTER TABLE bank_owner 
ALTER COLUMN currency SET NOT NULL,
ALTER COLUMN currency SET DEFAULT 'SGD';

-- Step 4: Drop old unique constraint (try common names)
ALTER TABLE bank_owner 
DROP CONSTRAINT IF EXISTS bank_owner_particular_month_key;

ALTER TABLE bank_owner 
DROP CONSTRAINT IF EXISTS bank_owner_particular_month_unique;

-- Step 5: Drop check constraint if exists
ALTER TABLE bank_owner 
DROP CONSTRAINT IF EXISTS check_currency_sgd;

-- Step 6: Add constraint to ensure currency is always SGD (only if doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_currency_sgd'
    ) THEN
        ALTER TABLE bank_owner 
        ADD CONSTRAINT check_currency_sgd CHECK (currency = 'SGD');
    END IF;
END $$;

-- Step 7: Add new unique constraint with currency (only if doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'bank_owner_particular_month_currency_key'
    ) THEN
        ALTER TABLE bank_owner 
        ADD CONSTRAINT bank_owner_particular_month_currency_key UNIQUE(particular, month, currency);
    END IF;
END $$;

-- Step 8: Add index for currency
CREATE INDEX IF NOT EXISTS idx_bank_owner_currency ON bank_owner(currency);

-- Step 9: Add comment
COMMENT ON COLUMN bank_owner.currency IS 'Currency (always SGD)';
