import { supabase } from '@/integrations/supabase/client';
import { SalesOrderDTO, SalesOrderLineDTO, ProductLookupItem, StockLevel, ListParams, KPIData } from '../types';

export const createSalesOrder = async (dto: SalesOrderDTO): Promise<SalesOrderDTO> => {
  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .insert({
      order_number: dto.orderNumber || `SO-${Date.now()}`,
      customer_name: dto.customerName,
      customer_email: dto.customerEmail,
      customer_phone: dto.customerPhone,
      status: dto.status,
      total_amount: dto.totalAmount,
      discount_amount: dto.discountAmount,
      tax_amount: dto.taxAmount,
      created_by: (await supabase.auth.getUser()).data.user?.id,
      store_id: (await getUserProfile())?.store_id
    })
    .select()
    .single();

  if (orderError) throw orderError;

  // Insert order lines
  if (dto.lines.length > 0) {
    const { error: linesError } = await supabase
      .from('sales_order_items')
      .insert(
        dto.lines.map(line => ({
          sales_order_id: order.id,
          product_id: line.productId,
          quantity: line.quantity,
          unit_price: line.unitPrice,
          discount_amount: (line.unitPrice * line.quantity * line.discountPercent) / 100,
          total_amount: line.subTotal
        }))
      );

    if (linesError) throw linesError;
  }

  return { ...dto, id: order.id };
};

export const updateSalesOrder = async (id: string, dto: SalesOrderDTO): Promise<SalesOrderDTO> => {
  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .update({
      customer_name: dto.customerName,
      customer_email: dto.customerEmail,
      customer_phone: dto.customerPhone,
      status: dto.status,
      total_amount: dto.totalAmount,
      discount_amount: dto.discountAmount,
      tax_amount: dto.taxAmount
    })
    .eq('id', id)
    .select()
    .single();

  if (orderError) throw orderError;

  // Delete existing lines and insert new ones
  await supabase.from('sales_order_items').delete().eq('sales_order_id', id);
  
  if (dto.lines.length > 0) {
    const { error: linesError } = await supabase
      .from('sales_order_items')
      .insert(
        dto.lines.map(line => ({
          sales_order_id: id,
          product_id: line.productId,
          quantity: line.quantity,
          unit_price: line.unitPrice,
          discount_amount: (line.unitPrice * line.quantity * line.discountPercent) / 100,
          total_amount: line.subTotal
        }))
      );

    if (linesError) throw linesError;
  }

  return dto;
};

export const fetchSalesOrders = async (params: ListParams = {}) => {
  let query = supabase
    .from('sales_orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (params.search) {
    query = query.or(`order_number.ilike.%${params.search}%,customer_name.ilike.%${params.search}%`);
  }

  if (params.status && params.status.length > 0) {
    query = query.in('status', params.status);
  }

  if (params.dateFrom) {
    query = query.gte('created_at', params.dateFrom);
  }

  if (params.dateTo) {
    query = query.lte('created_at', params.dateTo);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data || [];
};

export const fetchSalesOrder = async (id: string): Promise<SalesOrderDTO> => {
  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .select('*')
    .eq('id', id)
    .single();

  if (orderError) throw orderError;

  const { data: lines, error: linesError } = await supabase
    .from('sales_order_items')
    .select(`
      *,
      products (
        sku,
        product_name
      )
    `)
    .eq('sales_order_id', id);

  if (linesError) throw linesError;

  return {
    id: order.id,
    orderNumber: order.order_number,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    orderDate: order.created_at,
    orderType: 'retail', // Default for now
    status: order.status as SalesOrderDTO['status'],
    subTotal: order.total_amount - order.tax_amount + order.discount_amount,
    discountAmount: order.discount_amount,
    taxAmount: order.tax_amount,
    totalAmount: order.total_amount,
    lines: (lines || []).map(line => ({
      id: line.id,
      productId: line.product_id,
      sku: line.products?.sku || '',
      productName: line.products?.product_name || '',
      quantity: line.quantity,
      unitPrice: line.unit_price,
      discountPercent: line.discount_amount > 0 ? (line.discount_amount / (line.unit_price * line.quantity)) * 100 : 0,
      subTotal: line.total_amount
    }))
  };
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

  // If no database results, provide sample electronic products
  if (dbProducts.length === 0) {
    const sampleProducts = [
      {
        id: 'sample-1',
        sku: 'FRIDGE001',
        productName: '三星双门冰箱',
        price: 3299.99,
        availableStock: 8
      },
      {
        id: 'sample-2', 
        sku: 'LAPTOP001',
        productName: '联想ThinkPad笔记本电脑',
        price: 5899.99,
        availableStock: 12
      },
      {
        id: 'sample-3',
        sku: 'PRINTER001', 
        productName: '惠普激光打印机',
        price: 1299.99,
        availableStock: 15
      },
      {
        id: 'sample-4',
        sku: 'FRIDGE002',
        productName: 'LG多门冰箱',
        price: 4599.99,
        availableStock: 6
      },
      {
        id: 'sample-5',
        sku: 'DESKTOP001',
        productName: '戴尔台式电脑',
        price: 3799.99,
        availableStock: 10
      },
      {
        id: 'sample-6',
        sku: 'PRINTER002',
        productName: '佳能彩色打印机',
        price: 1899.99,
        availableStock: 20
      }
    ];
    
    return sampleProducts.filter(p => 
      p.productName.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
    );
  }

  return dbProducts;
};

export const fetchStockLevel = async (sku: string): Promise<StockLevel> => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      sku,
      inventory (
        quantity,
        reserved_quantity
      )
    `)
    .eq('sku', sku)
    .single();

  if (error) throw error;

  return {
    sku: data.sku,
    availableStock: (data.inventory?.[0]?.quantity || 0) - (data.inventory?.[0]?.reserved_quantity || 0),
    reservedQuantity: data.inventory?.[0]?.reserved_quantity || 0
  };
};

export const fetchKPIData = async (): Promise<KPIData> => {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('sales_orders')
    .select('total_amount')
    .gte('created_at', `${today}T00:00:00`)
    .lt('created_at', `${today}T23:59:59`)
    .neq('status', 'cancelled');

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
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('store_id')
    .eq('user_id', user.id)
    .single();

  return data;
};