-- Drop existing policies that require auth.uid()
DROP POLICY IF EXISTS "Users can view their own batches" ON public.marketplace_batches;
DROP POLICY IF EXISTS "Users can create their own batches" ON public.marketplace_batches;
DROP POLICY IF EXISTS "Users can update their own batches" ON public.marketplace_batches;
DROP POLICY IF EXISTS "Users can delete their own batches" ON public.marketplace_batches;

DROP POLICY IF EXISTS "Users can view items in their own batches" ON public.batch_items;
DROP POLICY IF EXISTS "Users can create items in their own batches" ON public.batch_items;
DROP POLICY IF EXISTS "Users can update items in their own batches" ON public.batch_items;
DROP POLICY IF EXISTS "Users can delete items in their own batches" ON public.batch_items;

-- Create temporary permissive policies for demo (replace with proper auth later)
CREATE POLICY "Allow all access to marketplace_batches for demo"
ON public.marketplace_batches
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all access to batch_items for demo"
ON public.batch_items
FOR ALL
USING (true)
WITH CHECK (true);