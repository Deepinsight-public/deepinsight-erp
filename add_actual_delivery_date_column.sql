-- Add actual_delivery_date column to sales_orders table
-- This column will store the actual delivery date when the order is delivered

-- Check if the column exists before adding it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sales_orders' 
        AND column_name = 'actual_delivery_date'
    ) THEN
        ALTER TABLE sales_orders 
        ADD COLUMN actual_delivery_date DATE;
        
        -- Add a comment to document the column
        COMMENT ON COLUMN sales_orders.actual_delivery_date IS 'Actual delivery date when the order was delivered';
    END IF;
END $$;