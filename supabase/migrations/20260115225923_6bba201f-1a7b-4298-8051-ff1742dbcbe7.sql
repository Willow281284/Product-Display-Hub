-- Add product_image column to batch_items table
ALTER TABLE public.batch_items 
ADD COLUMN product_image TEXT;