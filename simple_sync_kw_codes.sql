-- Simple version: Sync kw_code from products table to Item table
-- This ensures all items have the same kw_code as their parent product

-- Show current state
SELECT 'Current inconsistencies:' as info;
SELECT 
    COUNT(*) as total_items_with_mismatched_kw_codes
FROM "Item" i
JOIN products p ON i."productId" = p.id
WHERE i.kw_code IS DISTINCT FROM p.kw_code;

-- Update all items to match their product's kw_code
UPDATE "Item" 
SET kw_code = p.kw_code
FROM products p
WHERE "Item"."productId" = p.id
  AND "Item".kw_code IS DISTINCT FROM p.kw_code;

-- Verify the fix
SELECT 'After sync:' as info;
SELECT 
    COUNT(*) as remaining_mismatched_items
FROM "Item" i
JOIN products p ON i."productId" = p.id
WHERE i.kw_code IS DISTINCT FROM p.kw_code;

-- Show sample results
SELECT 'Sample verified items:' as info;
SELECT 
    i."a4lCode",
    p.product_name,
    i.kw_code as item_kw_code,
    p.kw_code as product_kw_code,
    CASE WHEN i.kw_code = p.kw_code THEN '✓ MATCH' ELSE '✗ MISMATCH' END as status
FROM "Item" i
JOIN products p ON i."productId" = p.id
ORDER BY p.product_name, i."a4lCode"
LIMIT 10;
