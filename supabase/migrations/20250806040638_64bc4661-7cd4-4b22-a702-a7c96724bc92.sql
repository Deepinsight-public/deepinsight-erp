-- Fix the function return types to match the actual table structure
CREATE OR REPLACE FUNCTION public.create_sales_order_with_stock_deduction(order_data jsonb, line_items jsonb[])
 RETURNS TABLE(
   id uuid, 
   order_number character varying, 
   customer_name character varying, 
   customer_email character varying, 
   customer_phone character varying, 
   customer_first character varying, 
   customer_last character varying, 
   addr_country character varying, 
   addr_state character varying, 
   addr_city character varying, 
   addr_street character varying, 
   addr_zipcode character varying, 
   order_date timestamp with time zone, 
   status character varying, 
   total_amount numeric, 
   discount_amount numeric, 
   tax_amount numeric, 
   warranty_years integer, 
   warranty_amount numeric, 
   walk_in_delivery character varying, 
   accessory text, 
   other_services text, 
   other_fee numeric, 
   payment_method character varying, 
   payment_note text, 
   customer_source character varying, 
   cashier_id uuid, 
   store_id uuid, 
   created_by uuid, 
   created_at timestamp with time zone, 
   updated_at timestamp with time zone
 )
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  new_order_id uuid;
  line_item jsonb;
  inv_record record;
  target_store_id uuid;
BEGIN
  -- Generate new order ID and extract store_id
  new_order_id := gen_random_uuid();
  target_store_id := (order_data->>'store_id')::uuid;
  
  -- Check stock availability for all items first
  FOR i IN 1..array_length(line_items, 1) LOOP
    line_item := line_items[i];
    
    SELECT quantity, reserved_quantity INTO inv_record
    FROM inventory 
    WHERE product_id = (line_item->>'product_id')::uuid
      AND inventory.store_id = target_store_id;
    
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
    target_store_id,
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
      AND inventory.store_id = target_store_id;
  END LOOP;
  
  -- Return the created order (fully qualified column names)
  RETURN QUERY
  SELECT 
    sales_orders.id, 
    sales_orders.order_number, 
    sales_orders.customer_name, 
    sales_orders.customer_email, 
    sales_orders.customer_phone,
    sales_orders.customer_first, 
    sales_orders.customer_last, 
    sales_orders.addr_country, 
    sales_orders.addr_state, 
    sales_orders.addr_city,
    sales_orders.addr_street, 
    sales_orders.addr_zipcode, 
    sales_orders.order_date, 
    sales_orders.status, 
    sales_orders.total_amount,
    sales_orders.discount_amount, 
    sales_orders.tax_amount, 
    sales_orders.warranty_years, 
    sales_orders.warranty_amount,
    sales_orders.walk_in_delivery, 
    sales_orders.accessory, 
    sales_orders.other_services, 
    sales_orders.other_fee,
    sales_orders.payment_method, 
    sales_orders.payment_note, 
    sales_orders.customer_source, 
    sales_orders.cashier_id,
    sales_orders.store_id, 
    sales_orders.created_by, 
    sales_orders.created_at, 
    sales_orders.updated_at
  FROM sales_orders
  WHERE sales_orders.id = new_order_id;
END;
$function$;