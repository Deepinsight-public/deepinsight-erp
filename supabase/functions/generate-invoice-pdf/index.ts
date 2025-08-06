import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get orderId from request body
    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Generating PDF for order:', orderId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch order data
    const { data: order, error } = await supabase
      .from('sales_orders')
      .select(`
        *,
        sales_order_items(
          id,
          product_id,
          quantity,
          unit_price,
          discount_amount,
          total_amount,
          products:product_id(sku, product_name)
        )
      `)
      .eq('id', orderId)
      .single();

    if (error || !order) {
      console.error('Error fetching order:', error);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Transform data for invoice
    const invoiceItems = order.sales_order_items.map((line: any, index: number) => ({
      idx: index + 1,
      type: 'Appliance',
      model: line.products?.product_name || 'Unknown Product',
      serial: line.products?.sku || null,
      price: line.total_amount,
      warrantyTerm: order.warranty_years ? `${order.warranty_years} year${order.warranty_years > 1 ? 's' : ''}` : '1 year'
    }));

    const taxRate = order.sub_total > 0 ? ((order.tax_amount / order.sub_total) * 100) : 0;

    // Create simple HTML invoice
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${order.order_number}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: white; }
    .header { text-align: center; margin-bottom: 30px; }
    .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
    .header p { margin: 2px 0; font-size: 12px; color: #666; }
    .header h2 { margin: 20px 0 5px 0; font-size: 20px; }
    .section { margin: 20px 0; }
    .grid { display: flex; gap: 20px; }
    .grid > div { flex: 1; }
    .label { font-weight: bold; margin-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
    th { background-color: #f5f5f5; font-weight: bold; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .totals { width: 250px; margin-left: auto; border: 1px solid #ccc; padding: 15px; background: #f9f9f9; }
    .totals-row { display: flex; justify-content: space-between; margin: 3px 0; }
    .totals-row.total { font-weight: bold; border-top: 1px solid #ccc; padding-top: 5px; margin-top: 5px; }
    .notes { font-size: 10px; line-height: 1.4; border-top: 1px solid #ccc; padding-top: 15px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>APPLIANCES 4 LESS</h1>
    <p>123 Main Street, Dover, DE 19901</p>
    <p>Phone: (302) 482-3487</p>
    <h2>INVOICE #${order.order_number}</h2>
    <p>${new Date(order.order_date || order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>

  <div class="section">
    <div class="grid">
      <div>
        <div class="label">BILL TO:</div>
        <p>${order.customer_name || 'Customer Name'}</p>
        ${order.customer_first && order.customer_last ? `<p>${order.customer_first} ${order.customer_last}</p>` : ''}
        ${order.addr_street ? `<p>${order.addr_street}</p>` : ''}
        ${(order.addr_city || order.addr_state || order.addr_zipcode) ? 
          `<p>${order.addr_city}${order.addr_city && order.addr_state ? ', ' : ''}${order.addr_state} ${order.addr_zipcode}</p>` : ''}
        ${order.customer_phone ? `<p>${order.customer_phone}</p>` : ''}
        ${order.customer_email ? `<p>${order.customer_email}</p>` : ''}
      </div>
      <div>
        <div class="label">BILL FOR:</div>
        <p>Appliances and Services (listed below)</p>
        ${order.payment_method ? `
        <div style="margin-top: 20px;">
          <div class="label">PAYMENT METHOD:</div>
          <p>${order.payment_method}</p>
        </div>` : ''}
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="text-center">#</th>
        <th>Type</th>
        <th>Model</th>
        <th>A4L / Serial #</th>
        <th class="text-right">Price</th>
        <th>Warranty</th>
      </tr>
    </thead>
    <tbody>
      ${invoiceItems.map(item => `
        <tr>
          <td class="text-center">${item.idx}</td>
          <td>${item.type}</td>
          <td>${item.model}</td>
          <td>${item.serial || '—'}</td>
          <td class="text-right">$${item.price.toFixed(2)}</td>
          <td>${item.warrantyTerm}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>Subtotal:</span>
      <span>$${order.sub_total?.toFixed(2) || order.total_amount.toFixed(2)}</span>
    </div>
    ${order.discount_amount > 0 ? `
    <div class="totals-row" style="color: #dc2626;">
      <span>Discount:</span>
      <span>-$${order.discount_amount.toFixed(2)}</span>
    </div>` : ''}
    <div class="totals-row">
      <span>Tax (${taxRate.toFixed(1)}%):</span>
      <span>$${order.tax_amount.toFixed(2)}</span>
    </div>
    ${order.other_fee && order.other_fee > 0 ? `
    <div class="totals-row">
      <span>Other Fees:</span>
      <span>$${order.other_fee.toFixed(2)}</span>
    </div>` : ''}
    <div class="totals-row total">
      <span>Total:</span>
      <span>$${order.total_amount.toFixed(2)}</span>
    </div>
  </div>

  ${(order.accessory || order.other_services || order.walk_in_delivery) ? `
  <div class="section">
    <div class="label">ADDITIONAL SERVICES:</div>
    ${order.walk_in_delivery && order.walk_in_delivery !== 'walk-in' ? `<p>• Delivery: ${order.walk_in_delivery}</p>` : ''}
    ${order.accessory ? `<p>• Accessories: ${order.accessory}</p>` : ''}
    ${order.other_services ? `<p>• Other Services: ${order.other_services}</p>` : ''}
  </div>` : ''}

  <div class="notes">
    <strong>TERMS AND CONDITIONS:</strong><br><br>
    
    <strong>WARRANTY:</strong> All appliances come with manufacturer's warranty. Extended warranty plans available for purchase. Warranty terms vary by manufacturer and product type. Please retain this invoice as proof of purchase for warranty claims.<br><br>
    
    <strong>RETURNS:</strong> Items may be returned within 30 days of purchase with original receipt and in original condition. Custom orders and special orders are non-returnable. Restocking fees may apply. Appliances must be in original packaging and unused condition.<br><br>
    
    <strong>DELIVERY:</strong> Delivery charges are additional unless otherwise noted. Delivery times are estimates and subject to product availability and scheduling. Customer must be present for delivery and inspection of items.<br><br>
    
    <strong>PAYMENT:</strong> Payment is due upon receipt unless other arrangements have been made. Past due accounts may be subject to finance charges. We accept cash, check, and major credit cards.<br><br>
    
    <strong>LIABILITY:</strong> Our liability is limited to the purchase price of the item. We are not responsible for consequential damages, installation issues, or damages caused by misuse.<br><br>
    
    Thank you for your business! For questions about this invoice, please contact us at (302) 482-3487.
  </div>
</body>
</html>`;

    // For now, return HTML that can be printed as PDF by browser
    // In the future, could use a library like Puppeteer to generate actual PDF
    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="invoice-${order.order_number}.html"`
      }
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});