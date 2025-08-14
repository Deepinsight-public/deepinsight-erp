-- Simplified version - Products only (no inventory)
-- Run this if you encounter any issues with the main script

-- First, ensure the is_new column exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'is_new') THEN
        ALTER TABLE products ADD COLUMN is_new BOOLEAN DEFAULT FALSE;
        COMMENT ON COLUMN products.is_new IS 'Indicates if the product is new (subject to MAP pricing restrictions)';
    END IF;
END $$;

-- Insert test products with realistic data
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

-- Display summary
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
