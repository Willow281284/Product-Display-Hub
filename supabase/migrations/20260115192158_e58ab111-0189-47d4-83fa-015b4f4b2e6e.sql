-- Create batch status enum
CREATE TYPE public.batch_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Create batch item status enum
CREATE TYPE public.batch_item_status AS ENUM ('pending', 'processing', 'success', 'failed');

-- Create marketplace_batches table (stores batch metadata)
CREATE TABLE public.marketplace_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    status public.batch_status NOT NULL DEFAULT 'pending',
    total_items INTEGER NOT NULL DEFAULT 0,
    success_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    selected_marketplaces TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create batch_items table (stores individual product/marketplace combinations)
CREATE TABLE public.batch_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES public.marketplace_batches(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    marketplace TEXT NOT NULL,
    status public.batch_item_status NOT NULL DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_marketplace_batches_user_id ON public.marketplace_batches(user_id);
CREATE INDEX idx_marketplace_batches_status ON public.marketplace_batches(status);
CREATE INDEX idx_batch_items_batch_id ON public.batch_items(batch_id);
CREATE INDEX idx_batch_items_status ON public.batch_items(status);

-- Enable RLS
ALTER TABLE public.marketplace_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_items ENABLE ROW LEVEL SECURITY;

-- Helper function to check batch ownership
CREATE OR REPLACE FUNCTION public.is_batch_owner(batch_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.marketplace_batches
    WHERE id = batch_id
      AND user_id = auth.uid()
  )
$$;

-- RLS Policies for marketplace_batches
CREATE POLICY "Users can view their own batches"
ON public.marketplace_batches
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own batches"
ON public.marketplace_batches
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own batches"
ON public.marketplace_batches
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own batches"
ON public.marketplace_batches
FOR DELETE
USING (user_id = auth.uid());

-- RLS Policies for batch_items
CREATE POLICY "Users can view items in their own batches"
ON public.batch_items
FOR SELECT
USING (public.is_batch_owner(batch_id));

CREATE POLICY "Users can create items in their own batches"
ON public.batch_items
FOR INSERT
WITH CHECK (public.is_batch_owner(batch_id));

CREATE POLICY "Users can update items in their own batches"
ON public.batch_items
FOR UPDATE
USING (public.is_batch_owner(batch_id));

CREATE POLICY "Users can delete items in their own batches"
ON public.batch_items
FOR DELETE
USING (public.is_batch_owner(batch_id));

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_marketplace_batches_updated_at
BEFORE UPDATE ON public.marketplace_batches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_batch_items_updated_at
BEFORE UPDATE ON public.batch_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for batch updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_batches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.batch_items;