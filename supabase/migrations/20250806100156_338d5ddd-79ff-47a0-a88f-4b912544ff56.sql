-- Create warehouse_store_sequence table for HQ-controlled store ordering
CREATE TABLE warehouse_store_sequence (
  warehouse_id UUID NOT NULL,
  store_id UUID NOT NULL,
  seq INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (warehouse_id, store_id)
);

-- Create index for ordering by sequence
CREATE INDEX idx_warehouse_store_sequence_order ON warehouse_store_sequence(warehouse_id, seq);

-- Enable RLS
ALTER TABLE warehouse_store_sequence ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Store users can view warehouse store sequences"
ON warehouse_store_sequence FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid() AND profiles.store_id IS NOT NULL
));

-- Seed initial sequence data based on existing stores
INSERT INTO warehouse_store_sequence (warehouse_id, store_id, seq)
SELECT 
  '11111111-1111-1111-1111-111111111111' as warehouse_id,
  id as store_id,
  ROW_NUMBER() OVER (ORDER BY created_at ASC) as seq
FROM stores
WHERE NOT EXISTS (
  SELECT 1 FROM warehouse_store_sequence 
  WHERE warehouse_id = '11111111-1111-1111-1111-111111111111'
);