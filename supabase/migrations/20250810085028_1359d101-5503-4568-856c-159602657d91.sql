-- Add triggers and enable RLS for security

-- Trigger A: Update Item when ReturnLine.restockStatus changes to IN_STOCK
CREATE OR REPLACE FUNCTION handle_return_restock()
RETURNS TRIGGER AS $$
BEGIN
  -- Only act when restockStatus changes to 'IN_STOCK'
  IF NEW."restockStatus" = 'IN_STOCK' AND (OLD."restockStatus" IS NULL OR OLD."restockStatus" != 'IN_STOCK') THEN
    -- Get the return order's store ID
    UPDATE "Item" 
    SET 
      status = 'in_stock',
      "currentStoreId" = (
        SELECT "storeId" 
        FROM "ReturnOrder" 
        WHERE id = NEW."orderId"
      ),
      "updatedAt" = NOW()
    WHERE id = NEW."itemId";
    
    -- Create ItemEvent for tracking
    INSERT INTO "ItemEvent" (
      "itemId",
      type,
      "docType",
      "docId",
      "docNo",
      "storeId",
      payload,
      "createdById"
    ) VALUES (
      NEW."itemId",
      'RETURN_RESTOCKED',
      'RETURN',
      NEW."orderId",
      (SELECT "docNo" FROM "ReturnOrder" WHERE id = NEW."orderId"),
      (SELECT "storeId" FROM "ReturnOrder" WHERE id = NEW."orderId"),
      jsonb_build_object(
        'returnLineId', NEW.id,
        'restockStatus', NEW."restockStatus",
        'restockedOn', NEW."restockedOn"
      ),
      NEW."restockedById"
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for return restocking
DROP TRIGGER IF EXISTS trigger_return_restock ON "ReturnLine";
CREATE TRIGGER trigger_return_restock
  AFTER UPDATE ON "ReturnLine"
  FOR EACH ROW
  EXECUTE FUNCTION handle_return_restock();

-- Trigger B: Auto-maintain price calculations on RetailLine (if it exists in existing tables)
-- First check if we need to add these columns to sales_order_items
DO $$
BEGIN
  -- Add missing columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_order_items' AND column_name = 'map_at_sale') THEN
    ALTER TABLE sales_order_items ADD COLUMN map_at_sale NUMERIC DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_order_items' AND column_name = 'price_map_rate') THEN
    ALTER TABLE sales_order_items ADD COLUMN price_map_rate NUMERIC DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_order_items' AND column_name = 'unit_cost_at_sale') THEN
    ALTER TABLE sales_order_items ADD COLUMN unit_cost_at_sale NUMERIC DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_order_items' AND column_name = 'gross_profit') THEN
    ALTER TABLE sales_order_items ADD COLUMN gross_profit NUMERIC DEFAULT 0;
  END IF;
END $$;

-- Trigger to auto-calculate price metrics
CREATE OR REPLACE FUNCTION calculate_price_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate price/MAP rate
  IF NEW.map_at_sale > 0 THEN
    NEW.price_map_rate = NEW.unit_price / NEW.map_at_sale;
  ELSE
    NEW.price_map_rate = 0;
  END IF;
  
  -- Calculate gross profit
  IF NEW.unit_cost_at_sale IS NOT NULL THEN
    NEW.gross_profit = NEW.unit_price - NEW.unit_cost_at_sale;
  ELSE
    NEW.gross_profit = 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for sales order items
DROP TRIGGER IF EXISTS trigger_calculate_price_metrics ON sales_order_items;
CREATE TRIGGER trigger_calculate_price_metrics
  BEFORE INSERT OR UPDATE ON sales_order_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_price_metrics();

-- Enable RLS on new tables
ALTER TABLE "PurchaseRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PurchaseRequestLine" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Item" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TransferOrder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TransferLine" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReturnOrder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReturnLine" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ScanLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ItemEvent" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for PurchaseRequest
CREATE POLICY "Store users can view their store purchase requests" ON "PurchaseRequest"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND store_id::text = "PurchaseRequest"."storeId"
    )
  );

CREATE POLICY "Store users can create purchase requests for their store" ON "PurchaseRequest"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND store_id::text = "PurchaseRequest"."storeId"
    )
  );

-- Create RLS policies for TransferOrder
CREATE POLICY "Store users can view transfers involving their store" ON "TransferOrder"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND (store_id::text = "TransferOrder"."fromStoreId" OR store_id::text = "TransferOrder"."toStoreId")
    )
  );

CREATE POLICY "Store users can create transfers from their store" ON "TransferOrder"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND store_id::text = "TransferOrder"."fromStoreId"
    )
  );

-- Create RLS policies for Item
CREATE POLICY "Store users can view items in their store" ON "Item"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND store_id::text = "Item"."currentStoreId"
    )
  );

-- Create RLS policies for ReturnOrder
CREATE POLICY "Store users can view returns for their store" ON "ReturnOrder"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND store_id::text = "ReturnOrder"."storeId"
    )
  );

CREATE POLICY "Store users can create returns for their store" ON "ReturnOrder"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND store_id::text = "ReturnOrder"."storeId"
    )
  );

-- Create RLS policies for ScanLog and ItemEvent
CREATE POLICY "Store users can view scan logs for their store" ON "ScanLog"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND store_id::text = "ScanLog"."storeId"
    )
  );

CREATE POLICY "Store users can create scan logs for their store" ON "ScanLog"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND store_id::text = "ScanLog"."storeId"
    )
  );

CREATE POLICY "Store users can view item events for their store" ON "ItemEvent"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND store_id::text = "ItemEvent"."storeId"
    )
  );