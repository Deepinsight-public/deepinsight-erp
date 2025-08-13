-- Create a generic "Custom Product" placeholder for repairs with custom products
INSERT INTO products (sku, product_name, brand, is_active, price) 
VALUES ('CUSTOM-PLACEHOLDER', 'Custom Product', 'Various', true, 0.00)
ON CONFLICT (sku) DO NOTHING;