import { supabase } from '@/integrations/supabase/client';
import type { SalesOrderDTO, SalesOrderLineDTO, ProductLookupItem, StockLevel, ListParams, KPIData } from '../types';

export const createSalesOrder = async (dto: SalesOrderDTO): Promise<SalesOrderDTO> => {
  const profile = await getUserProfile();
  
  // If status is 'submitted', implement stock deduction manually
  if (dto.status === 'submitted' && dto.lines && dto.lines.length > 0) {
    try {
      // Check stock availability first
      for (const line of dto.lines) {
        const { data: inventory } = await supabase
          .from('inventory')
          .select('quantity, reserved_quantity')
          .eq('product_id', line.productId)
          .eq('store_id', profile.store_id)
          .single();
        
        if (!inventory) {
          throw new Error(`INSUFFICIENT_STOCK: Product ${line.sku} not found in inventory`);
        }
        
        const availableStock = inventory.quantity - inventory.reserved_quantity;
        if (availableStock < line.quantity) {
          throw new Error(`INSUFFICIENT_STOCK: Insufficient stock for ${line.sku}. Available: ${availableStock}, Requested: ${line.quantity}`);
        }
      }
      
      // Create the order first
      const orderData = {
        order_number: dto.orderNumber || `ORD-${Date.now()}`,
        customer_name: dto.customerName,
        customer_email: dto.customerEmail,
        customer_phone: dto.customerPhone,
        customer_first: dto.customerFirst,
        customer_last: dto.customerLast,
        addr_country: dto.addrCountry,
        addr_state: dto.addrState,
        addr_city: dto.addrCity,
        addr_street: dto.addrStreet,
        addr_zipcode: dto.addrZipcode,
        order_date: dto.orderDate,
        status: dto.status,
        total_amount: dto.totalAmount,
        discount_amount: dto.discountAmount,
        tax_amount: dto.taxAmount,
        warranty_years: dto.warrantyYears,
        warranty_amount: dto.warrantyAmount,
        walk_in_delivery: dto.walkInDelivery,
        accessory: dto.accessory,
        other_services: dto.otherServices,
        other_fee: dto.otherFee,
        payment_method: dto.paymentMethod,
        payment_note: dto.paymentNote,
        customer_source: dto.customerSource,
        cashier_id: dto.cashierId,
        store_id: profile.store_id,
        created_by: profile.user_id
      };

      const { data: order, error: orderError } = await supabase
        .from('sales_orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert line items
      const lineItems = dto.lines.map(line => ({
        sales_order_id: order.id,
        product_id: line.productId,
        quantity: line.quantity,
        unit_price: line.unitPrice,
        discount_amount: line.unitPrice * line.quantity * line.discountPercent / 100,
        total_amount: line.subTotal
      }));

      const { error: lineItemsError } = await supabase
        .from('sales_order_items')
        .insert(lineItems);

      if (lineItemsError) throw lineItemsError;

      // Deduct stock for each line item
      for (const line of dto.lines) {
        // First get current inventory
        const { data: currentInventory } = await supabase
          .from('inventory')
          .select('quantity')
          .eq('product_id', line.productId)
          .eq('store_id', profile.store_id)
          .single();
        
        if (!currentInventory) continue;
        
        const { error: stockError } = await supabase
          .from('inventory')
          .update({ 
            quantity: currentInventory.quantity - line.quantity,
            updated_at: new Date().toISOString()
          })
          .eq('product_id', line.productId)
          .eq('store_id', profile.store_id);
        
        if (stockError) throw stockError;
      }

      return mapDatabaseToDTO(order, dto.lines || []);
    } catch (error) {
      console.error('Error creating sales order with stock deduction:', error);
      throw error;
    }
  }

  // For draft orders, no stock deduction
  const orderData = {
    order_number: dto.orderNumber || `ORD-${Date.now()}`,
    customer_name: dto.customerName,
    customer_email: dto.customerEmail,
    customer_phone: dto.customerPhone,
    customer_first: dto.customerFirst,
    customer_last: dto.customerLast,
    addr_country: dto.addrCountry,
    addr_state: dto.addrState,
    addr_city: dto.addrCity,
    addr_street: dto.addrStreet,
    addr_zipcode: dto.addrZipcode,
    order_date: dto.orderDate,
    status: dto.status,
    total_amount: dto.totalAmount,
    discount_amount: dto.discountAmount,
    tax_amount: dto.taxAmount,
    warranty_years: dto.warrantyYears,
    warranty_amount: dto.warrantyAmount,
    walk_in_delivery: dto.walkInDelivery,
    accessory: dto.accessory,
    other_services: dto.otherServices,
    other_fee: dto.otherFee,
    payment_method: dto.paymentMethod,
    payment_note: dto.paymentNote,
    customer_source: dto.customerSource,
    cashier_id: dto.cashierId,
    store_id: profile.store_id,
    created_by: profile.user_id
  };

  const { data: order, error } = await supabase
    .from('sales_orders')
    .insert(orderData)
    .select()
    .single();

  if (error) throw error;

  // Insert line items
  if (dto.lines && dto.lines.length > 0) {
    const lineItems = dto.lines.map(line => ({
      sales_order_id: order.id,
      product_id: line.productId,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      discount_amount: line.unitPrice * line.quantity * line.discountPercent / 100,
      total_amount: line.subTotal
    }));

    const { error: lineItemsError } = await supabase
      .from('sales_order_items')
      .insert(lineItems);

    if (lineItemsError) throw lineItemsError;
  }

  return mapDatabaseToDTO(order, dto.lines || []);
};

export const updateSalesOrder = async (id: string, dto: SalesOrderDTO): Promise<SalesOrderDTO> => {
  const profile = await getUserProfile();
  
  // Check if we're updating to 'submitted' status and need stock deduction
  if (dto.status === 'submitted' && dto.lines && dto.lines.length > 0) {
    // Get current order status to check if it was draft before
    const { data: currentOrder } = await supabase
      .from('sales_orders')
      .select('status')
      .eq('id', id)
      .single();
    
    // If transitioning from draft to submitted, we need to deduct stock
    if (currentOrder?.status === 'draft') {
      try {
        // Use a different approach: manually deduct stock for each line item
        for (const line of dto.lines) {
          // Check stock availability first
          const { data: inventory } = await supabase
            .from('inventory')
            .select('quantity, reserved_quantity')
            .eq('product_id', line.productId)
            .eq('store_id', profile.store_id)
            .single();
          
          if (!inventory) {
            throw new Error(`INSUFFICIENT_STOCK: Product ${line.sku} not found in inventory`);
          }
          
          const availableStock = inventory.quantity - inventory.reserved_quantity;
          if (availableStock < line.quantity) {
            throw new Error(`INSUFFICIENT_STOCK: Insufficient stock for ${line.sku}. Available: ${availableStock}, Requested: ${line.quantity}`);
          }
          
          // Deduct stock
          const { error: stockError } = await supabase
            .from('inventory')
            .update({ 
              quantity: inventory.quantity - line.quantity,
              updated_at: new Date().toISOString()
            })
            .eq('product_id', line.productId)
            .eq('store_id', profile.store_id);
          
          if (stockError) throw stockError;
        }
      } catch (error) {
        console.error('Error deducting stock during order update:', error);
        throw error;
      }
    }
  }
  
  const orderData = {
    customer_name: dto.customerName,
    customer_email: dto.customerEmail,
    customer_phone: dto.customerPhone,
    customer_first: dto.customerFirst,
    customer_last: dto.customerLast,
    addr_country: dto.addrCountry,
    addr_state: dto.addrState,
    addr_city: dto.addrCity,
    addr_street: dto.addrStreet,
    addr_zipcode: dto.addrZipcode,
    order_date: dto.orderDate,
    status: dto.status,
    total_amount: dto.totalAmount,
    discount_amount: dto.discountAmount,
    tax_amount: dto.taxAmount,
    warranty_years: dto.warrantyYears,
    warranty_amount: dto.warrantyAmount,
    walk_in_delivery: dto.walkInDelivery,
    accessory: dto.accessory,
    other_services: dto.otherServices,
    other_fee: dto.otherFee,
    payment_method: dto.paymentMethod,
    payment_note: dto.paymentNote,
    customer_source: dto.customerSource,
    cashier_id: dto.cashierId,
    updated_at: new Date().toISOString()
  };

  const { data: order, error } = await supabase
    .from('sales_orders')
    .update(orderData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Delete existing line items
  const { error: deleteError } = await supabase
    .from('sales_order_items')
    .delete()
    .eq('sales_order_id', id);

  if (deleteError) throw deleteError;

  // Insert updated line items
  if (dto.lines && dto.lines.length > 0) {
    const lineItems = dto.lines.map(line => ({
      sales_order_id: id,
      product_id: line.productId,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      discount_amount: line.unitPrice * line.quantity * line.discountPercent / 100,
      total_amount: line.subTotal
    }));

    const { error: lineItemsError } = await supabase
      .from('sales_order_items')
      .insert(lineItems);

    if (lineItemsError) throw lineItemsError;
  }

  return mapDatabaseToDTO(order, dto.lines || []);
};

export const fetchSalesOrders = async (params: ListParams = {}): Promise<SalesOrderDTO[]> => {
  let query = supabase
    .from('sales_orders')
    .select(`
      *,
      sales_order_items (
        id,
        product_id,
        quantity,
        unit_price,
        discount_amount,
        total_amount,
        products:product_id (
          sku,
          product_name
        )
      )
    `)
    .order('created_at', { ascending: false });

  // Apply filters
  if (params.search) {
    query = query.or(`order_number.ilike.%${params.search}%,customer_name.ilike.%${params.search}%,customer_email.ilike.%${params.search}%`);
  }

  if (params.status && params.status.length > 0) {
    query = query.in('status', params.status);
  }

  if (params.dateFrom) {
    query = query.gte('order_date', params.dateFrom);
  }

  if (params.dateTo) {
    query = query.lte('order_date', params.dateTo);
  }

  // Apply pagination
  if (params.page && params.limit) {
    const offset = (params.page - 1) * params.limit;
    query = query.range(offset, offset + params.limit - 1);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(order => {
    const lines: SalesOrderLineDTO[] = (order.sales_order_items || []).map((item: any) => ({
      id: item.id,
      productId: item.product_id,
      sku: item.products?.sku || '',
      productName: item.products?.product_name || '',
      quantity: item.quantity,
      unitPrice: item.unit_price,
      discountPercent: item.discount_amount > 0 ? (item.discount_amount / (item.unit_price * item.quantity)) * 100 : 0,
      subTotal: item.total_amount
    }));

    return mapDatabaseToDTO(order, lines);
  });
};

export const fetchSalesOrder = async (id: string): Promise<SalesOrderDTO> => {
  const { data: order, error } = await supabase
    .from('sales_orders')
    .select(`
      *,
      sales_order_items (
        id,
        product_id,
        quantity,
        unit_price,
        discount_amount,
        total_amount,
        products:product_id (
          sku,
          product_name
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  if (!order) throw new Error('Sales order not found');

  const lines: SalesOrderLineDTO[] = (order.sales_order_items || []).map((item: any) => ({
    id: item.id,
    productId: item.product_id,
    sku: item.products?.sku || '',
    productName: item.products?.product_name || '',
    quantity: item.quantity,
    unitPrice: item.unit_price,
    discountPercent: item.discount_amount > 0 ? (item.discount_amount / (item.unit_price * item.quantity)) * 100 : 0,
    subTotal: item.total_amount
  }));

  return mapDatabaseToDTO(order, lines);
};

export const fetchProductLookup = async (search: string): Promise<ProductLookupItem[]> => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      sku,
      product_name,
      price,
      inventory (
        quantity,
        reserved_quantity
      )
    `)
    .or(`sku.ilike.%${search}%,product_name.ilike.%${search}%`)
    .eq('is_active', true)
    .limit(20);

  if (error) throw error;

  const dbProducts = (data || []).map(product => ({
    id: product.id,
    sku: product.sku,
    productName: product.product_name,
    price: product.price || 0,
    availableStock: (product.inventory?.[0]?.quantity || 0) - (product.inventory?.[0]?.reserved_quantity || 0)
  }));

  // If no database results, return sample products for testing
  if (dbProducts.length === 0) {
    return [
      {
        id: 'sample-1',
        sku: 'REF001',
        productName: '双门冰箱 (Double Door Refrigerator)',
        price: 899.99,
        availableStock: 5
      },
      {
        id: 'sample-2',
        sku: 'WM001',
        productName: '洗衣机 (Washing Machine)',
        price: 599.99,
        availableStock: 3
      },
      {
        id: 'sample-3',
        sku: 'TV001',
        productName: '智能电视 (Smart TV)',
        price: 799.99,
        availableStock: 8
      }
    ].filter(p => 
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.productName.toLowerCase().includes(search.toLowerCase())
    );
  }

  return dbProducts;
};

export const fetchStockLevel = async (sku: string): Promise<StockLevel> => {
  // Handle sample products
  if (sku.startsWith('REF') || sku.startsWith('WM') || sku.startsWith('TV')) {
    const sampleStock = {
      'REF001': { availableStock: 5, reservedQuantity: 0 },
      'WM001': { availableStock: 3, reservedQuantity: 1 },
      'TV001': { availableStock: 8, reservedQuantity: 2 }
    };
    const stock = sampleStock[sku as keyof typeof sampleStock] || { availableStock: 0, reservedQuantity: 0 };
    return {
      sku,
      availableStock: stock.availableStock,
      reservedQuantity: stock.reservedQuantity
    };
  }

  const { data, error } = await supabase
    .from('inventory')
    .select('quantity, reserved_quantity')
    .eq('product_id', (
      await supabase
        .from('products')
        .select('id')
        .eq('sku', sku)
        .single()
    ).data?.id)
    .single();

  if (error) throw error;

  return {
    sku,
    availableStock: (data?.quantity || 0) - (data?.reserved_quantity || 0),
    reservedQuantity: data?.reserved_quantity || 0
  };
};

export const fetchKPIData = async (date?: string): Promise<KPIData> => {
  const targetDate = date || new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('sales_orders')
    .select('total_amount')
    .gte('order_date', `${targetDate}T00:00:00.000Z`)
    .lt('order_date', `${targetDate}T23:59:59.999Z`)
    .eq('status', 'completed');

  if (error) throw error;

  const todaySales = (data || []).reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const todayOrderCount = data?.length || 0;

  return {
    todaySales,
    todayOrderCount
  };
};

// Helper function to get user profile
const getUserProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('store_id, user_id')
    .eq('user_id', user.id)
    .single();

  if (!profile) throw new Error('User profile not found');

  return {
    user_id: profile.user_id,
    store_id: profile.store_id
  };
};

// Helper function to map database record to DTO
const mapDatabaseToDTO = (dbOrder: any, lines: SalesOrderLineDTO[]): SalesOrderDTO => {
  return {
    id: dbOrder.id,
    orderNumber: dbOrder.order_number,
    customerName: dbOrder.customer_name,
    customerEmail: dbOrder.customer_email,
    customerPhone: dbOrder.customer_phone,
    customerFirst: dbOrder.customer_first,
    customerLast: dbOrder.customer_last,
    addrCountry: dbOrder.addr_country,
    addrState: dbOrder.addr_state,
    addrCity: dbOrder.addr_city,
    addrStreet: dbOrder.addr_street,
    addrZipcode: dbOrder.addr_zipcode,
    orderDate: dbOrder.order_date,
    orderType: 'retail',
    status: dbOrder.status,
    subTotal: lines.reduce((sum, line) => sum + line.subTotal, 0),
    discountAmount: dbOrder.discount_amount || 0,
    taxAmount: dbOrder.tax_amount || 0,
    totalAmount: dbOrder.total_amount || 0,
    lines,
    warrantyYears: dbOrder.warranty_years,
    warrantyAmount: dbOrder.warranty_amount,
    walkInDelivery: dbOrder.walk_in_delivery,
    accessory: dbOrder.accessory,
    otherServices: dbOrder.other_services,
    otherFee: dbOrder.other_fee,
    paymentMethod: dbOrder.payment_method,
    paymentNote: dbOrder.payment_note,
    customerSource: dbOrder.customer_source,
    cashierId: dbOrder.cashier_id,
    createdAt: dbOrder.created_at,
    updatedAt: dbOrder.updated_at,
    createdBy: dbOrder.created_by,
    storeId: dbOrder.store_id
  };
};