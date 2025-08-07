import { supabase } from '@/integrations/supabase/client';
import type { 
  WarrantyValidationResult, 
  WarrantyValidationRequest, 
  ProductWarrantyInfo,
  WarrantyValidationError
} from '../types/warrantyValidation';

/**
 * Validates warranty status for a product return request
 */
export const validateWarrantyForReturn = async (
  request: WarrantyValidationRequest
): Promise<WarrantyValidationResult> => {
  try {
    // First, validate the product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, product_name, sku')
      .eq('id', request.productId)
      .eq('is_active', true)
      .maybeSingle();

    if (productError) {
      throw productError;
    }

    if (!product) {
      return {
        isValid: false,
        status: 'invalid_product',
        errorMessage: 'Product not found or inactive'
      };
    }

    // Look for warranty information based on the request
    let warrantyInfo: ProductWarrantyInfo | null = null;

    // Strategy 1: Search by sales order ID if provided
    if (request.salesOrderId) {
      warrantyInfo = await findWarrantyBySalesOrder(request.salesOrderId, request.productId);
    }

    // Strategy 2: Search by customer email and product if no sales order
    if (!warrantyInfo && request.customerEmail) {
      warrantyInfo = await findWarrantyByCustomerAndProduct(request.customerEmail, request.productId);
    }

    // Strategy 3: Search warranty claims for the product
    if (!warrantyInfo) {
      warrantyInfo = await findWarrantyFromClaims(request.productId);
    }

    if (!warrantyInfo) {
      return {
        isValid: false,
        status: 'not_found',
        errorMessage: 'No warranty information found for this product'
      };
    }

    // Validate warranty status
    const now = new Date();
    const expiryDate = warrantyInfo.warrantyExpiry ? new Date(warrantyInfo.warrantyExpiry) : null;

    if (!expiryDate) {
      // If no expiry date, calculate from invoice date and standard warranty period (1 year)
      const invoiceDate = warrantyInfo.invoiceDate ? new Date(warrantyInfo.invoiceDate) : null;
      if (invoiceDate) {
        const standardWarrantyDays = warrantyInfo.warrantyPeriodDays || 365;
        const calculatedExpiry = new Date(invoiceDate.getTime() + (standardWarrantyDays * 24 * 60 * 60 * 1000));
        
        if (now > calculatedExpiry) {
          return {
            isValid: false,
            status: 'expired',
            expiryDate: calculatedExpiry.toISOString(),
            remainingDays: 0,
            salesOrderId: warrantyInfo.salesOrderId,
            invoiceDate: warrantyInfo.invoiceDate,
            errorMessage: 'Warranty has expired'
          };
        }

        const remainingDays = Math.ceil((calculatedExpiry.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        
        return {
          isValid: true,
          status: 'valid',
          expiryDate: calculatedExpiry.toISOString(),
          remainingDays,
          salesOrderId: warrantyInfo.salesOrderId,
          invoiceDate: warrantyInfo.invoiceDate
        };
      } else {
        return {
          isValid: false,
          status: 'not_found',
          errorMessage: 'No warranty date information available'
        };
      }
    }

    // Check if warranty is expired
    if (now > expiryDate) {
      return {
        isValid: false,
        status: 'expired',
        expiryDate: warrantyInfo.warrantyExpiry,
        remainingDays: 0,
        salesOrderId: warrantyInfo.salesOrderId,
        invoiceDate: warrantyInfo.invoiceDate,
        errorMessage: 'Warranty has expired'
      };
    }

    // Calculate remaining days
    const remainingDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

    return {
      isValid: true,
      status: 'valid',
      expiryDate: warrantyInfo.warrantyExpiry,
      remainingDays,
      salesOrderId: warrantyInfo.salesOrderId,
      invoiceDate: warrantyInfo.invoiceDate
    };

  } catch (error) {
    console.error('Error validating warranty:', error);
    return {
      isValid: false,
      status: 'not_found',
      errorMessage: 'Error validating warranty status'
    };
  }
};

/**
 * Find warranty information by sales order ID
 */
const findWarrantyBySalesOrder = async (
  salesOrderId: string, 
  productId: string
): Promise<ProductWarrantyInfo | null> => {
  const { data: salesOrder, error } = await supabase
    .from('sales_orders')
    .select(`
      id,
      order_date,
      warranty_years,
      customer_email,
      sales_order_items!inner (
        product_id
      )
    `)
    .eq('id', salesOrderId)
    .eq('sales_order_items.product_id', productId)
    .maybeSingle();

  if (error || !salesOrder) {
    return null;
  }

  const invoiceDate = salesOrder.order_date;
  const warrantyYears = salesOrder.warranty_years || 1;
  const warrantyDays = warrantyYears * 365;
  
  if (invoiceDate) {
    const expiry = new Date(new Date(invoiceDate).getTime() + (warrantyDays * 24 * 60 * 60 * 1000));
    
    return {
      productId,
      salesOrderId: salesOrder.id,
      invoiceDate,
      warrantyPeriodDays: warrantyDays,
      warrantyExpiry: expiry.toISOString(),
      warrantyType: 'std',
      status: new Date() <= expiry ? 'active' : 'expired'
    };
  }

  return null;
};

/**
 * Find warranty information by customer email and product
 */
const findWarrantyByCustomerAndProduct = async (
  customerEmail: string, 
  productId: string
): Promise<ProductWarrantyInfo | null> => {
  const { data: salesOrders, error } = await supabase
    .from('sales_orders')
    .select(`
      id,
      order_date,
      warranty_years,
      customer_email,
      sales_order_items!inner (
        product_id
      )
    `)
    .eq('customer_email', customerEmail)
    .eq('sales_order_items.product_id', productId)
    .order('order_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !salesOrders) {
    return null;
  }

  return findWarrantyBySalesOrder(salesOrders.id, productId);
};

/**
 * Find warranty information from warranty claims
 */
const findWarrantyFromClaims = async (productId: string): Promise<ProductWarrantyInfo | null> => {
  const { data: warrantyClaims, error } = await supabase
    .from('warranty_headers')
    .select(`
      id,
      invoice_date,
      warranty_expiry,
      sales_order_id
    `)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !warrantyClaims) {
    return null;
  }

  // Get warranty lines separately
  const { data: warrantyLines } = await supabase
    .from('warranty_lines')
    .select('product_id, warranty_type')
    .eq('header_id', warrantyClaims.id)
    .eq('product_id', productId)
    .limit(1)
    .maybeSingle();

  if (!warrantyLines) {
    return null;
  }
  
  return {
    productId,
    salesOrderId: warrantyClaims.sales_order_id || undefined,
    invoiceDate: warrantyClaims.invoice_date || undefined,
    warrantyPeriodDays: 365, // Default to 1 year
    warrantyExpiry: warrantyClaims.warranty_expiry || undefined,
    warrantyType: warrantyLines.warranty_type as 'std' | 'ext',
    status: warrantyClaims.warranty_expiry && new Date() <= new Date(warrantyClaims.warranty_expiry) ? 'active' : 'expired'
  };
};

/**
 * Get warranty information for a specific product without validation
 */
export const getProductWarrantyInfo = async (productId: string): Promise<ProductWarrantyInfo[]> => {
  const warranties: ProductWarrantyInfo[] = [];

  try {
    // Get from sales orders
    const { data: salesOrderItems, error: salesError } = await supabase
      .from('sales_order_items')
      .select(`
        product_id,
        sales_orders!inner (
          id,
          order_date,
          warranty_years,
          customer_email
        )
      `)
      .eq('product_id', productId);

    if (!salesError && salesOrderItems) {
      for (const item of salesOrderItems) {
        const salesOrder = item.sales_orders;
        const warrantyYears = salesOrder.warranty_years || 1;
        const warrantyDays = warrantyYears * 365;
        
        if (salesOrder.order_date) {
          const expiry = new Date(new Date(salesOrder.order_date).getTime() + (warrantyDays * 24 * 60 * 60 * 1000));
          
          warranties.push({
            productId,
            salesOrderId: salesOrder.id,
            invoiceDate: salesOrder.order_date,
            warrantyPeriodDays: warrantyDays,
            warrantyExpiry: expiry.toISOString(),
            warrantyType: 'std',
            status: new Date() <= expiry ? 'active' : 'expired'
          });
        }
      }
    }

    // Get from warranty claims
    const { data: warrantyLines, error: warrantyError } = await supabase
      .from('warranty_lines')
      .select(`
        product_id,
        warranty_type,
        header_id
      `)
      .eq('product_id', productId);

    if (!warrantyError && warrantyLines) {
      // Get header data for each warranty line
      const headerIds = warrantyLines.map(line => line.header_id);
      const { data: headers } = await supabase
        .from('warranty_headers')
        .select('id, invoice_date, warranty_expiry, sales_order_id')
        .in('id', headerIds);

      for (const line of warrantyLines) {
        const header = headers?.find(h => h.id === line.header_id);
        if (header) {
          warranties.push({
            productId,
            salesOrderId: header.sales_order_id || undefined,
            invoiceDate: header.invoice_date || undefined,
            warrantyPeriodDays: 365,
            warrantyExpiry: header.warranty_expiry || undefined,
            warrantyType: line.warranty_type as 'std' | 'ext',
            status: header.warranty_expiry && new Date() <= new Date(header.warranty_expiry) ? 'active' : 'expired'
          });
        }
      }
    }

  } catch (error) {
    console.error('Error fetching warranty info:', error);
  }

  return warranties;
};