-- Create after_sales_returns table for the redesigned returns form
CREATE TABLE public.after_sales_returns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL,
  return_date DATE NOT NULL DEFAULT CURRENT_DATE,
  return_type TEXT NOT NULL CHECK (return_type IN ('store', 'warehouse')),
  warehouse_id UUID,
  customer_email TEXT,
  customer_first TEXT,
  customer_last TEXT,
  product_id UUID NOT NULL,
  reason TEXT NOT NULL,
  refund_amount DECIMAL(10,2) NOT NULL CHECK (refund_amount > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.after_sales_returns ENABLE ROW LEVEL SECURITY;

-- Create policies for store-scoped access
CREATE POLICY "Users can view returns for their store" 
ON public.after_sales_returns 
FOR SELECT 
USING (
  store_id IN (
    SELECT store_id FROM public.get_user_profile(auth.uid())
  )
);

CREATE POLICY "Users can create returns for their store" 
ON public.after_sales_returns 
FOR INSERT 
WITH CHECK (
  store_id IN (
    SELECT store_id FROM public.get_user_profile(auth.uid())
  )
);

CREATE POLICY "Users can update returns for their store" 
ON public.after_sales_returns 
FOR UPDATE 
USING (
  store_id IN (
    SELECT store_id FROM public.get_user_profile(auth.uid())
  )
);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_after_sales_returns_updated_at
BEFORE UPDATE ON public.after_sales_returns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_after_sales_returns_store_id ON public.after_sales_returns(store_id);
CREATE INDEX idx_after_sales_returns_return_date ON public.after_sales_returns(return_date);
CREATE INDEX idx_after_sales_returns_return_type ON public.after_sales_returns(return_type);