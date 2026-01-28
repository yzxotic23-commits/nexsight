-- Migration: Convert start_date from TEXT to DATE in bank_price table
-- This script will:
-- 1. Add a new DATE column
-- 2. Migrate existing data (parse TEXT to DATE)
-- 3. Drop the old TEXT column
-- 4. Rename the new column to start_date

-- Step 1: Add new DATE column (temporary name)
ALTER TABLE bank_price
ADD COLUMN IF NOT EXISTS start_date_new DATE;

-- Step 2: Migrate existing data from TEXT to DATE
-- Try to parse various date formats from start_date TEXT column
UPDATE bank_price
SET start_date_new = CASE
  -- Format: DD-MMM or D-MMM (e.g., "1-Jan", "24-Jan", "01-Jan")
  -- Parse format like "1-Jan" to "01/01/2026" (using year 2026)
  WHEN start_date ~ '^\d{1,2}-[A-Za-z]{3}$' THEN 
    CASE
      WHEN UPPER(start_date) LIKE '%-JAN%' THEN 
        TO_DATE(LPAD(SPLIT_PART(start_date, '-', 1), 2, '0') || '/01/2026', 'DD/MM/YYYY')
      WHEN UPPER(start_date) LIKE '%-FEB%' THEN 
        TO_DATE(LPAD(SPLIT_PART(start_date, '-', 1), 2, '0') || '/02/2026', 'DD/MM/YYYY')
      WHEN UPPER(start_date) LIKE '%-MAR%' THEN 
        TO_DATE(LPAD(SPLIT_PART(start_date, '-', 1), 2, '0') || '/03/2026', 'DD/MM/YYYY')
      WHEN UPPER(start_date) LIKE '%-APR%' THEN 
        TO_DATE(LPAD(SPLIT_PART(start_date, '-', 1), 2, '0') || '/04/2026', 'DD/MM/YYYY')
      WHEN UPPER(start_date) LIKE '%-MAY%' THEN 
        TO_DATE(LPAD(SPLIT_PART(start_date, '-', 1), 2, '0') || '/05/2026', 'DD/MM/YYYY')
      WHEN UPPER(start_date) LIKE '%-JUN%' THEN 
        TO_DATE(LPAD(SPLIT_PART(start_date, '-', 1), 2, '0') || '/06/2026', 'DD/MM/YYYY')
      WHEN UPPER(start_date) LIKE '%-JUL%' THEN 
        TO_DATE(LPAD(SPLIT_PART(start_date, '-', 1), 2, '0') || '/07/2026', 'DD/MM/YYYY')
      WHEN UPPER(start_date) LIKE '%-AUG%' THEN 
        TO_DATE(LPAD(SPLIT_PART(start_date, '-', 1), 2, '0') || '/08/2026', 'DD/MM/YYYY')
      WHEN UPPER(start_date) LIKE '%-SEP%' THEN 
        TO_DATE(LPAD(SPLIT_PART(start_date, '-', 1), 2, '0') || '/09/2026', 'DD/MM/YYYY')
      WHEN UPPER(start_date) LIKE '%-OCT%' THEN 
        TO_DATE(LPAD(SPLIT_PART(start_date, '-', 1), 2, '0') || '/10/2026', 'DD/MM/YYYY')
      WHEN UPPER(start_date) LIKE '%-NOV%' THEN 
        TO_DATE(LPAD(SPLIT_PART(start_date, '-', 1), 2, '0') || '/11/2026', 'DD/MM/YYYY')
      WHEN UPPER(start_date) LIKE '%-DEC%' THEN 
        TO_DATE(LPAD(SPLIT_PART(start_date, '-', 1), 2, '0') || '/12/2026', 'DD/MM/YYYY')
      ELSE NULL
    END
  -- Format: YYYY-MM-DD
  WHEN start_date ~ '^\d{4}-\d{2}-\d{2}$' THEN start_date::DATE
  -- Format: DD/MM/YYYY
  WHEN start_date ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN TO_DATE(start_date, 'DD/MM/YYYY')
  -- Format: DD-MM-YYYY
  WHEN start_date ~ '^\d{1,2}-\d{1,2}-\d{4}$' THEN TO_DATE(start_date, 'DD-MM-YYYY')
  -- Format: YYYY/MM/DD
  WHEN start_date ~ '^\d{4}/\d{1,2}/\d{1,2}$' THEN TO_DATE(start_date, 'YYYY/MM/DD')
  -- Try direct casting as fallback
  ELSE 
    CASE 
      WHEN start_date IS NOT NULL AND start_date != '' THEN 
        start_date::DATE
      ELSE NULL
    END
END
WHERE start_date IS NOT NULL AND start_date != '';

-- Step 3: Drop the old TEXT column
ALTER TABLE bank_price
DROP COLUMN IF EXISTS start_date;

-- Step 4: Rename the new column to start_date
ALTER TABLE bank_price
RENAME COLUMN start_date_new TO start_date;

-- Step 5: Add comment
COMMENT ON COLUMN bank_price.start_date IS 'Rental start date (DATE type)';

-- Step 6: Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_bank_price_start_date ON bank_price(start_date);

-- Verification query (uncomment to check results)
-- SELECT id, start_date, created_at FROM bank_price ORDER BY created_at DESC LIMIT 10;
