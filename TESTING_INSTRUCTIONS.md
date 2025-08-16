# Testing Sales Order History on Item Detail Page

## Step 1: Find Items with Sales History

Run the SQL queries in `find_sold_items.sql` to identify items that have sales order history.

### How to run the queries:

1. **If you have database access**: Run the queries directly in your database console
2. **If using Supabase Dashboard**: 
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the queries from `find_sold_items.sql`
   - Run each section separately

### What to look for:

The queries will show you:
- Total number of sales orders in the system
- Items that have been sold (linked via product_id)
- Recent sales orders with details
- Items with direct sales_order_item links (if any)

## Step 2: Test the Item Detail Page

Once you have item IDs from the SQL results:

### Method 1: Manual Testing
1. Go to `/store/orders/search` in your application
2. Search for one of the items identified in Step 1
3. Click on an item to go to `/store/items/{item-id}`
4. Check if the "Item History" section shows sales order information

### Method 2: Using Browser Console
1. Open your item detail page (`/store/items/{item-id}`)
2. Open browser developer tools (F12)
3. Copy the contents of `test_item_sales_history.js` into the console
4. Run: `testItemSalesHistory("your-item-id-here")`

## Step 3: Expected Behavior

On a working item detail page, you should see:

✅ **Working correctly:**
- Item details load properly
- "Item History" section shows sales order entries
- Sales entries show:
  - Type: "sold" 
  - Description: "Sold to [Customer Name]"
  - Date of sale
  - Order number (clickable)
  - Amount
- Clicking "View [Order Number]" opens invoice modal

❌ **If not working:**
- Item history is empty
- No sales entries appear
- Console shows errors in browser dev tools

## Step 4: Debugging Issues

If sales history isn't showing:

1. **Check the browser console** for errors
2. **Verify the data relationships**:
   - Does the item have a `productId`?
   - Are there sales_order_items with that `product_id`?
   - Do those sales_order_items link to valid sales_orders?

3. **Check the ItemDetail.tsx code** around lines 253-286:
   - Is the query structure correct?
   - Are the field names matching your database schema?

## Common Issues and Fixes

### Issue 1: No sales history appears
**Cause**: The query in ItemDetail.tsx might be looking for the wrong relationship
**Fix**: Check if your sales_order_items table uses `product_id` or `item_id` to link to items

### Issue 2: Console errors about missing tables
**Cause**: Database schema mismatch
**Fix**: Verify table names in the queries match your actual database

### Issue 3: Data loads but doesn't display
**Cause**: Frontend rendering issue
**Fix**: Check the React component state and rendering logic

## Next Steps

1. Run the SQL queries to find test items
2. Test with at least 2-3 different items
3. Document which items work and which don't
4. If issues are found, check the specific error messages and database relationships

## Files Created for Testing

- `find_sold_items.sql` - SQL queries to find items with sales history
- `test_item_sales_history.js` - JavaScript testing functions
- `TESTING_INSTRUCTIONS.md` - This file with testing instructions
