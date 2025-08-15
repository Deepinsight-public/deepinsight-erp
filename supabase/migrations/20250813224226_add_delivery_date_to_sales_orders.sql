-- Add delivery_date column to sales_orders table
-- This column will store the expected delivery date for delivery orders

-- Check if the column exists before adding it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sales_orders' 
        AND column_name = 'delivery_date'
    ) THEN
        ALTER TABLE sales_orders 
        ADD COLUMN delivery_date DATE;
        
        -- Add a comment to document the column
        COMMENT ON COLUMN sales_orders.delivery_date IS 'Expected delivery date for delivery orders';
    END IF;
END $$;