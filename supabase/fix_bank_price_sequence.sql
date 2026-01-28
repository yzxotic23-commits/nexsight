-- Fix: Reset sequence for bank_price table
-- This will set the sequence to start from the highest existing ID + 1

-- First, check the max ID in the table
SELECT MAX(id) as current_max_id FROM bank_price;

-- Reset the sequence to max ID + 1
SELECT setval(
  'bank_price_id_seq',
  (SELECT COALESCE(MAX(id), 0) FROM bank_price),
  true
);
