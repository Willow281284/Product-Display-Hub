-- Create product categories table
CREATE TABLE public.product_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES public.product_categories(id),
  marketplace TEXT NOT NULL, -- 'amazon', 'walmart', 'all'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create category attributes table (defines required/optional fields per category)
CREATE TABLE public.category_attributes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE CASCADE,
  attribute_name TEXT NOT NULL,
  attribute_key TEXT NOT NULL, -- machine-readable key
  attribute_type TEXT NOT NULL DEFAULT 'text', -- text, number, select, multiline, image, bullet_points
  is_required BOOLEAN NOT NULL DEFAULT false,
  validation_rules JSONB, -- min/max length, allowed values, etc.
  display_order INTEGER NOT NULL DEFAULT 0,
  section TEXT NOT NULL DEFAULT 'basic', -- basic, description, images, pricing, inventory, identifiers
  placeholder TEXT,
  help_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category_id, attribute_key)
);

-- Create product attributes table (stores actual attribute values)
CREATE TABLE public.product_attributes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_item_id UUID NOT NULL REFERENCES public.batch_items(id) ON DELETE CASCADE,
  attribute_key TEXT NOT NULL,
  attribute_value TEXT,
  is_valid BOOLEAN DEFAULT true,
  validation_message TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(batch_item_id, attribute_key)
);

-- Add category_id to batch_items
ALTER TABLE public.batch_items 
ADD COLUMN category_id UUID REFERENCES public.product_categories(id);

-- Enable RLS
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;

-- Public read access for categories (they're shared reference data)
CREATE POLICY "Anyone can read categories" ON public.product_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can read category attributes" ON public.category_attributes FOR SELECT USING (true);

-- Product attributes follow batch item access (demo mode for now)
CREATE POLICY "Allow all access to product_attributes for demo" ON public.product_attributes FOR ALL USING (true) WITH CHECK (true);

-- Insert sample categories
INSERT INTO public.product_categories (name, marketplace) VALUES
  ('Electronics', 'all'),
  ('Clothing & Accessories', 'all'),
  ('Home & Kitchen', 'all'),
  ('Sports & Outdoors', 'all'),
  ('Health & Beauty', 'all'),
  ('Toys & Games', 'all'),
  ('Books', 'all'),
  ('Automotive', 'all'),
  ('Grocery', 'all'),
  ('Pet Supplies', 'all');

-- Insert sample attributes for Electronics category
INSERT INTO public.category_attributes (category_id, attribute_name, attribute_key, attribute_type, is_required, section, display_order, placeholder, help_text)
SELECT 
  id,
  unnest(ARRAY['Product Title', 'Brand', 'Manufacturer', 'Model Number', 'UPC/EAN', 'Description', 'Bullet Point 1', 'Bullet Point 2', 'Bullet Point 3', 'Bullet Point 4', 'Bullet Point 5', 'Main Image', 'Additional Image 1', 'Additional Image 2', 'Additional Image 3', 'Price', 'Quantity', 'Condition', 'Warranty']),
  unnest(ARRAY['title', 'brand', 'manufacturer', 'model_number', 'upc', 'description', 'bullet_1', 'bullet_2', 'bullet_3', 'bullet_4', 'bullet_5', 'main_image', 'image_2', 'image_3', 'image_4', 'price', 'quantity', 'condition', 'warranty']),
  unnest(ARRAY['text', 'text', 'text', 'text', 'text', 'multiline', 'text', 'text', 'text', 'text', 'text', 'image', 'image', 'image', 'image', 'number', 'number', 'select', 'text']),
  unnest(ARRAY[true, true, false, false, true, true, true, true, false, false, false, true, false, false, false, true, true, true, false]),
  unnest(ARRAY['basic', 'basic', 'basic', 'basic', 'identifiers', 'description', 'description', 'description', 'description', 'description', 'description', 'images', 'images', 'images', 'images', 'pricing', 'inventory', 'basic', 'basic']),
  generate_series(1, 19),
  unnest(ARRAY['Enter product title (max 200 chars)', 'Brand name', 'Manufacturer name', 'Model #', 'UPC or EAN code', 'Detailed product description', 'Key feature 1', 'Key feature 2', 'Key feature 3', 'Key feature 4', 'Key feature 5', 'Main product image URL', 'Additional image URL', 'Additional image URL', 'Additional image URL', '0.00', '0', 'New/Used/Refurbished', 'Warranty info']),
  unnest(ARRAY['Keep under 200 characters. Include key features.', 'The brand name of the product', 'Company that manufactures the product', 'Manufacturer model number', 'Required for most categories', 'Detailed description. Min 100 characters recommended.', 'Highlight key benefit or feature', 'Second most important feature', 'Additional feature', 'Optional feature', 'Optional feature', 'Must be at least 1000x1000px, white background', 'Additional angles or details', 'Additional angles or details', 'Additional angles or details', 'Sale price in USD', 'Available inventory count', 'Product condition', 'Warranty duration and coverage'])
FROM public.product_categories WHERE name = 'Electronics';

-- Insert sample attributes for Clothing category  
INSERT INTO public.category_attributes (category_id, attribute_name, attribute_key, attribute_type, is_required, section, display_order, placeholder, help_text)
SELECT 
  id,
  unnest(ARRAY['Product Title', 'Brand', 'Size', 'Color', 'Material', 'UPC/EAN', 'Description', 'Bullet Point 1', 'Bullet Point 2', 'Bullet Point 3', 'Main Image', 'Additional Image 1', 'Additional Image 2', 'Price', 'Quantity', 'Gender', 'Age Group']),
  unnest(ARRAY['title', 'brand', 'size', 'color', 'material', 'upc', 'description', 'bullet_1', 'bullet_2', 'bullet_3', 'main_image', 'image_2', 'image_3', 'price', 'quantity', 'gender', 'age_group']),
  unnest(ARRAY['text', 'text', 'text', 'text', 'text', 'text', 'multiline', 'text', 'text', 'text', 'image', 'image', 'image', 'number', 'number', 'select', 'select']),
  unnest(ARRAY[true, true, true, true, true, true, true, true, true, false, true, false, false, true, true, true, false]),
  unnest(ARRAY['basic', 'basic', 'basic', 'basic', 'basic', 'identifiers', 'description', 'description', 'description', 'description', 'images', 'images', 'images', 'pricing', 'inventory', 'basic', 'basic']),
  generate_series(1, 17),
  unnest(ARRAY['Enter product title', 'Brand name', 'S/M/L/XL or numeric', 'Primary color', 'Cotton, Polyester, etc.', 'UPC or EAN code', 'Product description', 'Key feature', 'Key feature', 'Key feature', 'Main image URL', 'Additional image', 'Additional image', '0.00', '0', 'Male/Female/Unisex', 'Adult/Kids/Baby']),
  unnest(ARRAY['Include size and color in title', 'The brand name', 'Size of the item', 'Primary color name', 'Fabric composition', 'Required identifier', 'Detailed description', 'Highlight key benefit', 'Second feature', 'Third feature', 'White background, model wearing', 'Different angle', 'Detail shot', 'Sale price', 'Stock count', 'Target gender', 'Target age range'])
FROM public.product_categories WHERE name = 'Clothing & Accessories';

-- Create index for faster lookups
CREATE INDEX idx_category_attributes_category ON public.category_attributes(category_id);
CREATE INDEX idx_product_attributes_batch_item ON public.product_attributes(batch_item_id);
CREATE INDEX idx_batch_items_category ON public.batch_items(category_id);