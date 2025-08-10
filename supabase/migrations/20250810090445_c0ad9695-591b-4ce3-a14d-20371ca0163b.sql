-- Add photo URLs column to scrap_headers
ALTER TABLE scrap_headers ADD COLUMN IF NOT EXISTS photo_urls TEXT[];

-- Create system_settings table for disclaimers
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value_zh TEXT,
  value_en TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for system settings (readable by authenticated users)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'system_settings' 
    AND policyname = 'Authenticated users can view system settings'
  ) THEN
    CREATE POLICY "Authenticated users can view system settings" ON system_settings
      FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Create policy for system settings (only managers can modify)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'system_settings' 
    AND policyname = 'Store managers can manage system settings'
  ) THEN
    CREATE POLICY "Store managers can manage system settings" ON system_settings
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE user_id = auth.uid() AND role = 'store_manager'
        )
      );
  END IF;
END $$;

-- Insert default repair disclaimer
INSERT INTO system_settings (key, value_zh, value_en, description) VALUES 
  ('repair_disclaimer', 
   '本维修服务仅限于设备故障维修，不承担因使用不当造成的损失。维修完成后请及时取回设备。',
   'This repair service is limited to device malfunction repair only. We are not responsible for losses caused by improper use. Please collect your device promptly after repair completion.',
   'Repair service disclaimer text displayed at bottom of repair PDFs'
  )
ON CONFLICT (key) DO NOTHING;

-- Add document_url column to repairs table if not exists
ALTER TABLE repairs ADD COLUMN IF NOT EXISTS document_url TEXT;

-- Create logistics table if it doesn't exist (for delivery proofs)
CREATE TABLE IF NOT EXISTS logistics_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  delivery_address TEXT,
  delivery_status TEXT DEFAULT 'pending',
  proof_url TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE,
  delivered_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on logistics_lines
ALTER TABLE logistics_lines ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for logistics_lines
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'logistics_lines' 
    AND policyname = 'Store users can manage logistics for their orders'
  ) THEN
    CREATE POLICY "Store users can manage logistics for their orders" ON logistics_lines
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM sales_orders so
          JOIN profiles p ON p.user_id = auth.uid() AND p.store_id = so.store_id
          WHERE so.id = logistics_lines.order_id
        )
      );
  END IF;
END $$;