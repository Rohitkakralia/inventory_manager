-- Migration: Add account_id column to payments table
-- This allows linking payments to specific bank accounts or cash accounts

ALTER TABLE payments 
ADD COLUMN account_id INT NULL AFTER payment_method,
ADD INDEX idx_payments_account_id (account_id);

-- Note: We don't add foreign key constraints because account_id can reference
-- either Banks table or cashInHand table depending on payment_method