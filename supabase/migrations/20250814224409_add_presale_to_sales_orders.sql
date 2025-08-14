-- Add presale column to sales_orders table
ALTER TABLE sales_orders 
ADD COLUMN presale BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN sales_orders.presale IS 'Indicates if the sales order is a presale order';
