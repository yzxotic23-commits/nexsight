-- Migration: Add currency column to bank_owner table
-- This script adds the currency column and constraint for existing tables
-- Run this if you already have bank_owner table without currency column

-- Step 1: Add currency column with default value 'SGD' (for existing rows)
ALTER TABLE bank_owner 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'SGD';

-- Step 2: Update existing rows to have 'SGD' (in case default wasn't applied)
UPDATE bank_owner 
SET currency = 'SGD' 
WHERE currency IS NULL;

-- Step 3: Make currency NOT NULL after setting default values
ALTER TABLE bank_owner 
ALTER COLUMN currency SET NOT NULL;

-- Step 4: Set default for future inserts
ALTER TABLE bank_owner 
ALTER COLUMN currency SET DEFAULT 'SGD';

-- Step 5: Drop old unique constraint if exists (check actual constraint name first)
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find and drop the old unique constraint
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'bank_owner'::regclass
    AND contype = 'u'
    AND array_length(conkey, 1) = 2
    AND 'particular' = ANY(
        SELECT attname FROM pg_attribute 
        WHERE attrelid = conrelid AND attnum = ANY(conkey)
    )
    AND 'month' = ANY(
        SELECT attname FROM pg_attribute 
        WHERE attrelid = conrelid AND attnum = ANY(conkey)
    )
    LIMIT 1;
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE bank_owner DROP CONSTRAINT IF EXISTS ' || constraint_name;
    END IF;
END $$;

-- Step 6: Drop check constraint if exists
ALTER TABLE bank_owner 
DROP CONSTRAINT IF EXISTS check_currency_sgd;

-- Step 7: Add constraint to ensure currency is always SGD (only if doesn't exist)
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

-- Step 8: Add new unique constraint with currency (only if doesn't exist)
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

-- Step 9: Add index for currency if not exists
CREATE INDEX IF NOT EXISTS idx_bank_owner_currency ON bank_owner(currency);

-- Step 10: Update comments
COMMENT ON COLUMN bank_owner.currency IS 'Currency (always SGD)';
