-- Fix the remaining function's search path
CREATE OR REPLACE FUNCTION public.initialize_order_pool()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  store_ids UUID[];
  sample_order_code TEXT;
BEGIN
  -- 获取所有门店ID
  SELECT ARRAY(SELECT id FROM public.stores ORDER BY store_name) INTO store_ids;
  
  -- 生成示例订单编号
  sample_order_code := 'ORD-' || EXTRACT(EPOCH FROM NOW())::INTEGER;
  
  -- 插入示例抢单订单
  INSERT INTO public.order_pool (
    order_code,
    current_priority_list,
    current_turn_store_id,
    turn_start_time,
    status
  ) VALUES (
    sample_order_code,
    store_ids,
    store_ids[1],
    NOW(),
    'waiting'
  );
END;
$function$;