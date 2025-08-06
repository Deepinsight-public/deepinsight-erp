-- Fix ambiguous column reference in create_sales_order_with_stock_deduction function
CREATE OR REPLACE FUNCTION public.create_sales_order_with_stock_deduction(order_data jsonb, line_items jsonb[])
 RETURNS TABLE(id uuid, order_number text, customer_name text, customer_email text, customer_phone text, customer_first text, customer_last text, addr_country text, addr_state text, addr_city text, addr_street text, addr_zipcode text, order_date timestamp with time zone, status text, total_amount numeric, discount_amount numeric, tax_amount numeric, warranty_years integer, warranty_amount numeric, walk_in_delivery text, accessory text, other_services text, other_fee numeric, payment_method text, payment_note text, customer_source text, cashier_id uuid, store_id uuid, created_by uuid, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  new_order_id uuid;
  line_item jsonb;
  inv_record record;
  order_store_id uuid;
BEGIN
  -- Generate new order ID
  new_order_id := gen_random_uuid();
  order_store_id := (order_data->>'store_id')::uuid;
  
  -- Check stock availability for all items first
  FOR i IN 1..array_length(line_items, 1) LOOP
    line_item := line_items[i];
    
    SELECT inv.quantity, inv.reserved_quantity INTO inv_record
    FROM inventory inv
    WHERE inv.product_id = (line_item->>'product_id')::uuid
      AND inv.store_id = order_store_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK: Product not found in inventory: %', line_item->>'sku';
    END IF;
    
    IF (inv_record.quantity - inv_record.reserved_quantity) < (line_item->>'quantity')::integer THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK: Insufficient stock for %', line_item->>'sku';
    END IF;
  END LOOP;
  
  -- Create the sales order
  INSERT INTO sales_orders (
    id, order_number, customer_name, customer_email, customer_phone,
    customer_first, customer_last, addr_country, addr_state, addr_city,
    addr_street, addr_zipcode, order_date, status, total_amount,
    discount_amount, tax_amount, warranty_years, warranty_amount,
    walk_in_delivery, accessory, other_services, other_fee,
    payment_method, payment_note, customer_source, cashier_id,
    store_id, created_by
  ) VALUES (
    new_order_id,
    order_data->>'order_number',
    order_data->>'customer_name',
    order_data->>'customer_email',
    order_data->>'customer_phone',
    order_data->>'customer_first',
    order_data->>'customer_last',
    order_data->>'addr_country',
    order_data->>'addr_state',
    order_data->>'addr_city',
    order_data->>'addr_street',
    order_data->>'addr_zipcode',
    (order_data->>'order_date')::timestamptz,
    order_data->>'status',
    (order_data->>'total_amount')::numeric,
    (order_data->>'discount_amount')::numeric,
    (order_data->>'tax_amount')::numeric,
    (order_data->>'warranty_years')::integer,
    (order_data->>'warranty_amount')::numeric,
    order_data->>'walk_in_delivery',
    order_data->>'accessory',
    order_data->>'other_services',
    (order_data->>'other_fee')::numeric,
    order_data->>'payment_method',
    order_data->>'payment_note',
    order_data->>'customer_source',
    (order_data->>'cashier_id')::uuid,
    order_store_id,
    (order_data->>'created_by')::uuid
  );
  
  -- Create line items and deduct stock
  FOR i IN 1..array_length(line_items, 1) LOOP
    line_item := line_items[i];
    
    -- Insert line item
    INSERT INTO sales_order_items (
      sales_order_id, product_id, quantity, unit_price, discount_amount, total_amount
    ) VALUES (
      new_order_id,
      (line_item->>'product_id')::uuid,
      (line_item->>'quantity')::integer,
      (line_item->>'unit_price')::numeric,
      (line_item->>'discount_amount')::numeric,
      (line_item->>'total_amount')::numeric
    );
    
    -- Deduct stock from inventory
    UPDATE inventory 
    SET quantity = quantity - (line_item->>'quantity')::integer,
        updated_at = now()
    WHERE product_id = (line_item->>'product_id')::uuid
      AND store_id = order_store_id;
  END LOOP;
  
  -- Return the created order
  RETURN QUERY
  SELECT 
    so.id, so.order_number, so.customer_name, so.customer_email, so.customer_phone,
    so.customer_first, so.customer_last, so.addr_country, so.addr_state, so.addr_city,
    so.addr_street, so.addr_zipcode, so.order_date, so.status, so.total_amount,
    so.discount_amount, so.tax_amount, so.warranty_years, so.warranty_amount,
    so.walk_in_delivery, so.accessory, so.other_services, so.other_fee,
    so.payment_method, so.payment_note, so.customer_source, so.cashier_id,
    so.store_id, so.created_by, so.created_at, so.updated_at
  FROM sales_orders so
  WHERE so.id = new_order_id;
END;
$function$