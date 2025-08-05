-- Add UPDATE policy for sales_orders table so users can update orders in their store
CREATE POLICY "Store users can update their store orders" 
ON public.sales_orders 
FOR UPDATE 
USING (EXISTS ( 
  SELECT 1
  FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.store_id = sales_orders.store_id))
));

-- Add UPDATE and DELETE policies for sales_order_items table
CREATE POLICY "Store users can update their store order items" 
ON public.sales_order_items 
FOR UPDATE 
USING (EXISTS ( 
  SELECT 1
  FROM (sales_orders so
    JOIN profiles p ON (((p.user_id = auth.uid()) AND (p.store_id = so.store_id))))
  WHERE (so.id = sales_order_items.sales_order_id)
));

CREATE POLICY "Store users can delete their store order items" 
ON public.sales_order_items 
FOR DELETE 
USING (EXISTS ( 
  SELECT 1
  FROM (sales_orders so
    JOIN profiles p ON (((p.user_id = auth.uid()) AND (p.store_id = so.store_id))))
  WHERE (so.id = sales_order_items.sales_order_id)
));