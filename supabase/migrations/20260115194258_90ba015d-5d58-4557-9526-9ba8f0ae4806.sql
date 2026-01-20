-- Add additional product fields to batch_items table
ALTER TABLE public.batch_items
ADD COLUMN IF NOT EXISTS product_sku TEXT,
ADD COLUMN IF NOT EXISTS stock_qty INTEGER,
ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(5,2);