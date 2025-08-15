-- Enhanced SQL migration for adding is_new column and dummy data
-- This can be run directly in Supabase SQL editor

-- First, ensure the is_new column exists (in case the migration wasn't run)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'is_new') THEN
        ALTER TABLE products ADD COLUMN is_new BOOLEAN DEFAULT FALSE;
        COMMENT ON COLUMN products.is_new IS 'Indicates if the product is new (subject to MAP pricing restrictions)';
    END IF;
END $$;

-- Update existing products to have realistic is_new values
UPDATE products 
SET is_new = TRUE 
WHERE sku IN (
    'LAPTOP001', 'PRINTER001', 'PRINTER002', 'PHONE001', 'TABLET001', 
    'KEYBOARD001', 'MONITOR001', 'TV001', 'FRIDGE001', 'WASHER001'
);

UPDATE products 
SET is_new = FALSE 
WHERE sku IN (
    'WH001', 'GS001', 'AC001', 'MOUSE001', 'SPEAKER001', 'DRYER001', 
    'MICROWAVE001', 'DISHWASHER001'
);

-- Insert comprehensive test products with realistic data
INSERT INTO products (sku, product_name, price, cost, map_price, is_new, is_active, created_at, updated_at)
VALUES 
  -- New Products (with MAP restrictions)
  ('IPHONE15', 'iPhone 15 Pro 256GB', 1199.99, 899.99, 1099.99, TRUE, TRUE, NOW(), NOW()),
  ('IPADAIR', 'iPad Air 5th Gen WiFi', 599.99, 449.99, 549.99, TRUE, TRUE, NOW(), NOW()),
  ('MACBOOK', 'MacBook Air M2', 1399.99, 1099.99, 1299.99, TRUE, TRUE, NOW(), NOW()),
  ('SAMSUNG55', 'Samsung 55" QLED TV', 899.99, 699.99, 799.99, TRUE, TRUE, NOW(), NOW()),
  ('SONY65', 'Sony 65" OLED TV', 1799.99, 1399.99, 1699.99, TRUE, TRUE, NOW(), NOW()),
  ('MECH_KB', 'Mechanical Gaming Keyboard', 149.99, 89.99, 129.99, TRUE, TRUE, NOW(), NOW()),
  ('GAMING_MOUSE', 'Gaming Mouse RGB', 79.99, 49.99, 69.99, TRUE, TRUE, NOW(), NOW()),
  ('ULTRAWIDE', '34" Ultrawide Monitor', 499.99, 349.99, 449.99, TRUE, TRUE, NOW(), NOW()),
  ('AIRPODS', 'AirPods Pro 2nd Gen', 249.99, 189.99, 229.99, TRUE, TRUE, NOW(), NOW()),
  ('WATCH', 'Apple Watch Series 9', 399.99, 299.99, 369.99, TRUE, TRUE, NOW(), NOW()),
  
  -- Older/Refurbished Products (no MAP restrictions)
  ('BASIC_MOUSE', 'Basic Wireless Mouse', 19.99, 12.99, 0, FALSE, TRUE, NOW(), NOW()),
  ('USB_HUB', 'USB-C Hub 7-in-1', 39.99, 24.99, 0, FALSE, TRUE, NOW(), NOW()),
  ('CABLE_HDMI', 'HDMI Cable 6ft', 12.99, 7.99, 0, FALSE, TRUE, NOW(), NOW()),
  ('SCREEN_CLEAN', 'Screen Cleaning Kit', 14.99, 8.99, 0, FALSE, TRUE, NOW(), NOW()),
  ('OLD_LAPTOP', 'Refurbished Laptop i5', 399.99, 299.99, 0, FALSE, TRUE, NOW(), NOW()),
  ('BASIC_SPEAKER', 'Bluetooth Speaker Basic', 29.99, 19.99, 0, FALSE, TRUE, NOW(), NOW()),
  ('PHONE_CASE', 'iPhone Case Clear', 24.99, 14.99, 0, FALSE, TRUE, NOW(), NOW()),
  ('CHARGER', 'USB-C Fast Charger', 34.99, 22.99, 0, FALSE, TRUE, NOW(), NOW()),
  ('DESK_PAD', 'Gaming Desk Pad XL', 19.99, 12.99, 0, FALSE, TRUE, NOW(), NOW()),
  ('WEBCAM', 'HD Webcam 1080p', 49.99, 34.99, 0, FALSE, TRUE, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET 
  product_name = EXCLUDED.product_name,
  price = EXCLUDED.price,
  cost = EXCLUDED.cost,
  map_price = EXCLUDED.map_price,
  is_new = EXCLUDED.is_new,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Also add some inventory records for these products (if inventory table exists)
-- This assumes a store_id exists - you may need to adjust the store_id value
DO $$ 
DECLARE
    default_store_id UUID;
BEGIN
    -- Get the first available store_id (assuming it's UUID type)
    SELECT id INTO default_store_id FROM stores LIMIT 1;
    
    IF default_store_id IS NOT NULL THEN
        -- Insert inventory for the new products
        INSERT INTO inventory (product_id, store_id, quantity, reserved_quantity, created_at, updated_at)
        SELECT p.id, default_store_id, 
               CASE WHEN p.is_new THEN 5 ELSE 10 END as quantity, -- New products have less stock
               0 as reserved_quantity,
               NOW(), NOW()
        FROM products p 
        WHERE p.sku IN (
            'IPHONE15', 'IPADAIR', 'MACBOOK', 'SAMSUNG55', 'SONY65',
            'MECH_KB', 'GAMING_MOUSE', 'ULTRAWIDE', 'AIRPODS', 'WATCH',
            'BASIC_MOUSE', 'USB_HUB', 'CABLE_HDMI', 'SCREEN_CLEAN', 'OLD_LAPTOP',
            'BASIC_SPEAKER', 'PHONE_CASE', 'CHARGER', 'DESK_PAD', 'WEBCAM'
        )
        ON CONFLICT (product_id, store_id) DO UPDATE SET
            quantity = EXCLUDED.quantity,
            updated_at = NOW();
    ELSE
        RAISE NOTICE 'No stores found - inventory records not created. You may need to manually specify a store_id.';
    END IF;
END $$;

-- Display summary of products with their new status
SELECT 
    sku,
    product_name,
    price,
    map_price,
    is_new,
    CASE 
        WHEN is_new AND map_price > 0 THEN 'MAP Restricted'
        WHEN is_new THEN 'New (No MAP)'
        ELSE 'Standard'
    END as pricing_status
FROM products 
WHERE is_active = TRUE
ORDER BY is_new DESC, price DESC;
