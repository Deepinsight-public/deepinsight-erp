/**
 * Test script to check item sales order history functionality
 * Run this in the browser console while on the item detail page
 * or modify it to work with your testing environment
 */

// Test function to check sales order history for an item
async function testItemSalesHistory(itemId) {
  console.log(`🔍 Testing sales history for item: ${itemId}`);
  
  try {
    // Simulate the same query that ItemDetail.tsx uses
    const { createClient } = supabase;
    const supabaseClient = createClient(
      process.env.SUPABASE_URL, 
      process.env.SUPABASE_ANON_KEY
    );

    // 1. Load the item
    console.log('📦 Loading item data...');
    const { data: itemData, error: itemError } = await supabaseClient
      .from('Item')
      .select('*')
      .eq('id', itemId)
      .single();

    if (itemError) {
      console.error('❌ Item query error:', itemError);
      return;
    }

    console.log('✅ Item data:', itemData);

    // 2. Check for sales orders using the same query as ItemDetail.tsx
    console.log('📋 Checking for sales orders...');
    const { data: salesData, error: salesError } = await supabaseClient
      .from('sales_order_items')
      .select(`
        sales_orders(
          id,
          order_number,
          order_date,
          total_amount,
          status,
          customer_first,
          customer_last,
          customer_email
        )
      `)
      .eq('product_id', itemData.productId);

    if (salesError) {
      console.error('❌ Sales query error:', salesError);
    } else {
      console.log('📊 Sales data found:', salesData);
      
      if (salesData && salesData.length > 0) {
        console.log(`✅ Found ${salesData.length} sales order(s) for this item's product`);
        salesData.forEach((sale, index) => {
          const order = sale.sales_orders;
          if (order) {
            console.log(`  Order ${index + 1}:`, {
              orderNumber: order.order_number,
              customer: `${order.customer_first} ${order.customer_last}`,
              amount: order.total_amount,
              date: order.order_date,
              status: order.status
            });
          }
        });
      } else {
        console.log('⚠️  No sales orders found for this item\'s product');
      }
    }

    // 3. Alternative check: Look for direct item_id links
    console.log('🔗 Checking for direct item links...');
    const { data: directSalesData, error: directError } = await supabaseClient
      .from('sales_order_items')
      .select(`
        sales_orders(
          id,
          order_number,
          order_date,
          total_amount,
          status,
          customer_first,
          customer_last,
          customer_email
        )
      `)
      .eq('item_id', itemId);

    if (directError) {
      console.error('❌ Direct sales query error:', directError);
    } else if (directSalesData && directSalesData.length > 0) {
      console.log(`✅ Found ${directSalesData.length} direct item link(s)`);
    } else {
      console.log('ℹ️  No direct item links found');
    }

    return {
      item: itemData,
      productSales: salesData,
      directSales: directSalesData
    };

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Helper function to test multiple items from the search results
async function testMultipleItems() {
  // You'll need to replace these with actual item IDs from your database
  const testItemIds = [
    // Add item IDs here from your search results
  ];

  for (const itemId of testItemIds) {
    console.log('\n' + '='.repeat(50));
    await testItemSalesHistory(itemId);
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Export functions for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testItemSalesHistory, testMultipleItems };
}

console.log('🚀 Test functions ready!');
console.log('Usage:');
console.log('  testItemSalesHistory("item-id-here")');
console.log('  testMultipleItems()');
