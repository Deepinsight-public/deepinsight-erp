-- Get sample item IDs for testing the detail page
SELECT 
    'Sample Item IDs for Testing:' as info;

SELECT 
    id,
    "a4lCode", 
    "productId",
    "currentStoreId",
    status,
    "createdAt"
FROM "Item" 
WHERE (delete IS NULL OR delete = false)
ORDER BY "createdAt" DESC
LIMIT 5;
