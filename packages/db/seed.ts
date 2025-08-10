import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedDatabase() {
  console.log('🌱 Starting database seed...')

  // Seed stores
  const { data: stores, error: storesError } = await supabase
    .from('stores')
    .upsert([
      {
        id: '00000000-0000-0000-0000-000000000001',
        store_code: 'HQ001',
        store_name: 'Headquarters',
        region: 'Central',
        status: 'active'
      },
      {
        id: '00000000-0000-0000-0000-000000000002', 
        store_code: 'STR001',
        store_name: 'Store 1',
        region: 'North',
        status: 'active'
      }
    ], { onConflict: 'store_code' })

  if (storesError) {
    console.error('Error seeding stores:', storesError)
    return
  }

  // Seed products
  const { data: products, error: productsError } = await supabase
    .from('products')
    .upsert([
      {
        id: '00000000-0000-0000-0000-000000000101',
        sku: 'WASH001',
        product_name: 'LG Front Load Washer',
        brand: 'LG',
        model: 'WF45T6000AW',
        category: 'Washer',
        price: 899.99,
        map_price: 799.99,
        cost: 650.00,
        is_active: true
      },
      {
        id: '00000000-0000-0000-0000-000000000102',
        sku: 'DRY001', 
        product_name: 'Samsung Electric Dryer',
        brand: 'Samsung',
        model: 'DV45H7000EW',
        category: 'Dryer',
        price: 749.99,
        map_price: 649.99,
        cost: 520.00,
        is_active: true
      }
    ], { onConflict: 'sku' })

  if (productsError) {
    console.error('Error seeding products:', productsError)
    return
  }

  // Seed inventory
  const { data: inventory, error: inventoryError } = await supabase
    .from('inventory')
    .upsert([
      {
        product_id: '00000000-0000-0000-0000-000000000101',
        store_id: '00000000-0000-0000-0000-000000000002',
        quantity: 25,
        reserved_quantity: 0,
        reorder_point: 5,
        max_stock: 50
      },
      {
        product_id: '00000000-0000-0000-0000-000000000102',
        store_id: '00000000-0000-0000-0000-000000000002', 
        quantity: 18,
        reserved_quantity: 2,
        reorder_point: 3,
        max_stock: 30
      }
    ], { onConflict: 'product_id,store_id' })

  if (inventoryError) {
    console.error('Error seeding inventory:', inventoryError)
    return
  }

  // Test views
  console.log('🔍 Testing compatibility views...')
  
  const { data: inventoryView, error: inventoryViewError } = await supabase
    .from('vw_inventory')
    .select('*')
    .limit(5)

  if (inventoryViewError) {
    console.error('Error testing inventory view:', inventoryViewError)
  } else {
    console.log(`✅ vw_inventory: ${inventoryView?.length || 0} records`)
  }

  const { data: salesView, error: salesViewError } = await supabase
    .from('vw_sales_orders_list')
    .select('*')
    .limit(5)

  if (salesViewError) {
    console.error('Error testing sales view:', salesViewError)
  } else {
    console.log(`✅ vw_sales_orders_list: ${salesView?.length || 0} records`)
  }

  console.log('🎉 Database seed completed!')
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Seed failed:', error)
      process.exit(1)
    })
}

export { seedDatabase }