-- Final migration script for after_sales_returns table
-- Run this in your Supabase SQL Editor

DO $$
BEGIN
    -- Add approval_month column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'after_sales_returns' AND column_name = 'approval_month') THEN
        ALTER TABLE after_sales_returns ADD COLUMN approval_month text;
        COMMENT ON COLUMN after_sales_returns.approval_month IS 'Month when the return was approved (YYYY-MM format)';
    END IF;

    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'after_sales_returns' AND column_name = 'status') THEN
        ALTER TABLE after_sales_returns ADD COLUMN status text DEFAULT 'processing' CHECK (status IN ('processing', 'failed', 'approved'));
        COMMENT ON COLUMN after_sales_returns.status IS 'Return processing status: processing, failed, approved';
    END IF;

    -- Add self_scraped column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'after_sales_returns' AND column_name = 'self_scraped') THEN
        ALTER TABLE after_sales_returns ADD COLUMN self_scraped boolean DEFAULT false;
        COMMENT ON COLUMN after_sales_returns.self_scraped IS 'Whether the item was self-scraped by the customer';
    END IF;

    -- Add map_price column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'after_sales_returns' AND column_name = 'map_price') THEN
        ALTER TABLE after_sales_returns ADD COLUMN map_price numeric;
        COMMENT ON COLUMN after_sales_returns.map_price IS 'Minimum Advertised Price of the returned product';
    END IF;

    -- Add total_amount_paid column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'after_sales_returns' AND column_name = 'total_amount_paid') THEN
        ALTER TABLE after_sales_returns ADD COLUMN total_amount_paid numeric;
        COMMENT ON COLUMN after_sales_returns.total_amount_paid IS 'Total amount originally paid for the order being returned';
    END IF;

END $$;