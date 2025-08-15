-- Add is_new column to products table
ALTER TABLE products 
ADD COLUMN is_new BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN products.is_new IS 'Indicates if the product is new (subject to MAP pricing restrictions)';

-- Update some existing products to be 'new' for testing
UPDATE products SET is_new = TRUE WHERE sku IN ('LAPTOP001', 'PRINTER001', 'PRINTER002');
UPDATE products SET is_new = FALSE WHERE sku IN ('WH001', 'GS001', 'AC001');

-- Insert some additional test products if they don't exist
INSERT INTO products (sku, product_name, price, cost, map_price, is_new, created_at, updated_at)
VALUES 
  ('PHONE001', 'iPhone 15 Pro', 1199.99, 899.99, 1099.99, TRUE, NOW(), NOW()),
  ('TABLET001', 'iPad Air', 599.99, 449.99, 549.99, TRUE, NOW(), NOW()),
  ('MOUSE001', 'Wireless Mouse', 29.99, 15.99, 24.99, FALSE, NOW(), NOW()),
  ('KEYBOARD001', 'Mechanical Keyboard', 149.99, 89.99, 129.99, TRUE, NOW(), NOW()),
  ('MONITOR001', '4K Monitor', 399.99, 299.99, 349.99, TRUE, NOW(), NOW()),
  ('SPEAKER001', 'Bluetooth Speaker', 79.99, 49.99, 69.99, FALSE, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
  price = EXCLUDED.price,
  cost = EXCLUDED.cost,
  map_price = EXCLUDED.map_price,
  is_new = EXCLUDED.is_new,
  updated_at = NOW();
