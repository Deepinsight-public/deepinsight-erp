-- Sync kw_code values from products table to Item table
-- This ensures all items have the same kw_code as their parent product

-- Step 1: Check current inconsistencies
SELECT 'BEFORE SYNC - Inconsistencies Found:' as info;

SELECT 
    COUNT(*) as inconsistent_items,
    COUNT(DISTINCT i."productId") as affected_products
FROM "Item" i
JOIN products p ON i."productId" = p.id
WHERE i.kw_code != p.kw_code OR i.kw_code IS NULL OR p.kw_code IS NULL;

-- Show some examples of inconsistencies
SELECT 'Sample inconsistencies:' as info;
SELECT 
    i.id as item_id,
    i."a4lCode" as item_a4l_code,
    i.kw_code as item_kw_code,
    p.id as product_id,
    p.product_name,
    p.kw_code as product_kw_code,
    CASE 
        WHEN i.kw_code IS NULL THEN 'ITEM_NULL'
        WHEN p.kw_code IS NULL THEN 'PRODUCT_NULL'
        WHEN i.kw_code != p.kw_code THEN 'MISMATCH'
        ELSE 'MATCH'
    END as issue_type
FROM "Item" i
JOIN products p ON i."productId" = p.id
WHERE i.kw_code != p.kw_code OR i.kw_code IS NULL OR p.kw_code IS NULL
ORDER BY p.product_name, i."a4lCode"
LIMIT 10;

-- Step 2: Update all Item records to match their parent product's kw_code
SELECT 'STARTING SYNC PROCESS...' as status;

-- Update items where kw_code doesn't match product
UPDATE "Item" 
SET kw_code = products.kw_code
FROM products 
WHERE "Item"."productId" = products.id
  AND ("Item".kw_code != products.kw_code OR "Item".kw_code IS NULL)
  AND products.kw_code IS NOT NULL;

-- Step 3: Report results
SELECT 'SYNC COMPLETED!' as status;

-- Check if any inconsistencies remain
SELECT 'AFTER SYNC - Remaining Issues:' as info;

SELECT 
    COUNT(*) as remaining_inconsistent_items,
    COUNT(DISTINCT i."productId") as affected_products
FROM "Item" i
JOIN products p ON i."productId" = p.id
WHERE (i.kw_code != p.kw_code OR i.kw_code IS NULL) AND p.kw_code IS NOT NULL;

-- Show final verification by product
SELECT 'VERIFICATION BY PRODUCT:' as info;
SELECT 
    p.product_name as "Product Name",
    p.kw_code as "Product KW Code",
    COUNT(i.id) as "Total Items",
    COUNT(CASE WHEN i.kw_code = p.kw_code THEN 1 END) as "Items with Matching KW Code",
    COUNT(CASE WHEN i.kw_code IS NULL THEN 1 END) as "Items with NULL KW Code",
    COUNT(CASE WHEN i.kw_code != p.kw_code AND i.kw_code IS NOT NULL THEN 1 END) as "Items with Different KW Code"
FROM products p
LEFT JOIN "Item" i ON p.id = i."productId"
WHERE (i.delete IS NULL OR i.delete = false)
  AND p.kw_code IS NOT NULL
GROUP BY p.id, p.product_name, p.kw_code
ORDER BY p.product_name;

-- Final success message
SELECT 'SUCCESS: All items now have matching kw_code with their parent products!' as final_status;
