-- Add default attributes for all categories that don't have them yet
-- These are the standard marketplace fields needed for listings

-- First, let's add attributes for Toys & Games (9bf50269-3fbf-4845-bd0c-38f59029a1fc)
INSERT INTO category_attributes (category_id, attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
SELECT 
  '9bf50269-3fbf-4845-bd0c-38f59029a1fc', attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text
FROM (VALUES
  ('title', 'Product Title', 'text', true, 1, 'basic', 'Enter product title', 'Keep under 200 characters'),
  ('brand', 'Brand', 'text', true, 2, 'basic', 'Brand name', 'The brand of the product'),
  ('manufacturer', 'Manufacturer', 'text', false, 3, 'basic', 'Manufacturer name', 'Company that makes the product'),
  ('description', 'Description', 'multiline', true, 4, 'description', 'Detailed product description', 'Min 100 characters recommended'),
  ('bullet_1', 'Bullet Point 1', 'text', true, 5, 'description', 'Key feature 1', 'Highlight key benefit'),
  ('bullet_2', 'Bullet Point 2', 'text', true, 6, 'description', 'Key feature 2', 'Second important feature'),
  ('bullet_3', 'Bullet Point 3', 'text', false, 7, 'description', 'Key feature 3', 'Additional feature'),
  ('bullet_4', 'Bullet Point 4', 'text', false, 8, 'description', 'Key feature 4', 'Optional feature'),
  ('bullet_5', 'Bullet Point 5', 'text', false, 9, 'description', 'Key feature 5', 'Optional feature'),
  ('keywords', 'Search Keywords', 'text', false, 10, 'basic', 'keyword1, keyword2, keyword3', 'Comma-separated keywords'),
  ('upc', 'UPC/EAN', 'text', true, 11, 'identifiers', 'UPC or EAN code', 'Required for most categories'),
  ('main_image', 'Main Image', 'image', true, 12, 'images', 'Main product image URL', 'Min 1000x1000px recommended')
) AS t(attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
WHERE NOT EXISTS (SELECT 1 FROM category_attributes WHERE category_id = '9bf50269-3fbf-4845-bd0c-38f59029a1fc');

-- Add attributes for Automotive
INSERT INTO category_attributes (category_id, attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
SELECT 
  'ffc0f557-cb5a-45bd-9f18-d51d5b01c245', attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text
FROM (VALUES
  ('title', 'Product Title', 'text', true, 1, 'basic', 'Enter product title', 'Keep under 200 characters'),
  ('brand', 'Brand', 'text', true, 2, 'basic', 'Brand name', 'The brand of the product'),
  ('manufacturer', 'Manufacturer', 'text', false, 3, 'basic', 'Manufacturer name', 'Company that makes the product'),
  ('description', 'Description', 'multiline', true, 4, 'description', 'Detailed product description', 'Min 100 characters recommended'),
  ('bullet_1', 'Bullet Point 1', 'text', true, 5, 'description', 'Key feature 1', 'Highlight key benefit'),
  ('bullet_2', 'Bullet Point 2', 'text', true, 6, 'description', 'Key feature 2', 'Second important feature'),
  ('bullet_3', 'Bullet Point 3', 'text', false, 7, 'description', 'Key feature 3', 'Additional feature'),
  ('bullet_4', 'Bullet Point 4', 'text', false, 8, 'description', 'Key feature 4', 'Optional feature'),
  ('bullet_5', 'Bullet Point 5', 'text', false, 9, 'description', 'Key feature 5', 'Optional feature'),
  ('keywords', 'Search Keywords', 'text', false, 10, 'basic', 'keyword1, keyword2, keyword3', 'Comma-separated keywords'),
  ('upc', 'UPC/EAN', 'text', true, 11, 'identifiers', 'UPC or EAN code', 'Required for most categories'),
  ('main_image', 'Main Image', 'image', true, 12, 'images', 'Main product image URL', 'Min 1000x1000px recommended')
) AS t(attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
WHERE NOT EXISTS (SELECT 1 FROM category_attributes WHERE category_id = 'ffc0f557-cb5a-45bd-9f18-d51d5b01c245');

-- Add attributes for Books
INSERT INTO category_attributes (category_id, attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
SELECT 
  '232bf79a-04c2-4449-8f88-13672a0ec3f1', attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text
FROM (VALUES
  ('title', 'Product Title', 'text', true, 1, 'basic', 'Enter product title', 'Keep under 200 characters'),
  ('brand', 'Brand', 'text', true, 2, 'basic', 'Publisher/Brand name', 'The publisher or brand'),
  ('manufacturer', 'Manufacturer', 'text', false, 3, 'basic', 'Publisher name', 'Publisher of the book'),
  ('description', 'Description', 'multiline', true, 4, 'description', 'Detailed product description', 'Min 100 characters recommended'),
  ('bullet_1', 'Bullet Point 1', 'text', true, 5, 'description', 'Key feature 1', 'Highlight key benefit'),
  ('bullet_2', 'Bullet Point 2', 'text', true, 6, 'description', 'Key feature 2', 'Second important feature'),
  ('bullet_3', 'Bullet Point 3', 'text', false, 7, 'description', 'Key feature 3', 'Additional feature'),
  ('bullet_4', 'Bullet Point 4', 'text', false, 8, 'description', 'Key feature 4', 'Optional feature'),
  ('bullet_5', 'Bullet Point 5', 'text', false, 9, 'description', 'Key feature 5', 'Optional feature'),
  ('keywords', 'Search Keywords', 'text', false, 10, 'basic', 'keyword1, keyword2, keyword3', 'Comma-separated keywords'),
  ('upc', 'ISBN/UPC', 'text', true, 11, 'identifiers', 'ISBN or UPC code', 'Required for books'),
  ('main_image', 'Main Image', 'image', true, 12, 'images', 'Book cover image URL', 'Min 1000x1000px recommended')
) AS t(attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
WHERE NOT EXISTS (SELECT 1 FROM category_attributes WHERE category_id = '232bf79a-04c2-4449-8f88-13672a0ec3f1');

-- Add attributes for Clothing & Accessories
INSERT INTO category_attributes (category_id, attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
SELECT 
  '9d280f95-74ee-424d-8139-8ef3e8a560b4', attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text
FROM (VALUES
  ('title', 'Product Title', 'text', true, 1, 'basic', 'Enter product title', 'Keep under 200 characters'),
  ('brand', 'Brand', 'text', true, 2, 'basic', 'Brand name', 'The brand of the product'),
  ('manufacturer', 'Manufacturer', 'text', false, 3, 'basic', 'Manufacturer name', 'Company that makes the product'),
  ('description', 'Description', 'multiline', true, 4, 'description', 'Detailed product description', 'Min 100 characters recommended'),
  ('bullet_1', 'Bullet Point 1', 'text', true, 5, 'description', 'Key feature 1', 'Highlight key benefit'),
  ('bullet_2', 'Bullet Point 2', 'text', true, 6, 'description', 'Key feature 2', 'Second important feature'),
  ('bullet_3', 'Bullet Point 3', 'text', false, 7, 'description', 'Key feature 3', 'Additional feature'),
  ('bullet_4', 'Bullet Point 4', 'text', false, 8, 'description', 'Key feature 4', 'Optional feature'),
  ('bullet_5', 'Bullet Point 5', 'text', false, 9, 'description', 'Key feature 5', 'Optional feature'),
  ('keywords', 'Search Keywords', 'text', false, 10, 'basic', 'keyword1, keyword2, keyword3', 'Comma-separated keywords'),
  ('upc', 'UPC/EAN', 'text', true, 11, 'identifiers', 'UPC or EAN code', 'Required for most categories'),
  ('main_image', 'Main Image', 'image', true, 12, 'images', 'Main product image URL', 'Min 1000x1000px recommended')
) AS t(attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
WHERE NOT EXISTS (SELECT 1 FROM category_attributes WHERE category_id = '9d280f95-74ee-424d-8139-8ef3e8a560b4');

-- Add attributes for Grocery
INSERT INTO category_attributes (category_id, attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
SELECT 
  '663d0e3c-586a-48e0-a786-69b97c05b47f', attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text
FROM (VALUES
  ('title', 'Product Title', 'text', true, 1, 'basic', 'Enter product title', 'Keep under 200 characters'),
  ('brand', 'Brand', 'text', true, 2, 'basic', 'Brand name', 'The brand of the product'),
  ('manufacturer', 'Manufacturer', 'text', false, 3, 'basic', 'Manufacturer name', 'Company that makes the product'),
  ('description', 'Description', 'multiline', true, 4, 'description', 'Detailed product description', 'Min 100 characters recommended'),
  ('bullet_1', 'Bullet Point 1', 'text', true, 5, 'description', 'Key feature 1', 'Highlight key benefit'),
  ('bullet_2', 'Bullet Point 2', 'text', true, 6, 'description', 'Key feature 2', 'Second important feature'),
  ('bullet_3', 'Bullet Point 3', 'text', false, 7, 'description', 'Key feature 3', 'Additional feature'),
  ('bullet_4', 'Bullet Point 4', 'text', false, 8, 'description', 'Key feature 4', 'Optional feature'),
  ('bullet_5', 'Bullet Point 5', 'text', false, 9, 'description', 'Key feature 5', 'Optional feature'),
  ('keywords', 'Search Keywords', 'text', false, 10, 'basic', 'keyword1, keyword2, keyword3', 'Comma-separated keywords'),
  ('upc', 'UPC/EAN', 'text', true, 11, 'identifiers', 'UPC or EAN code', 'Required for food items'),
  ('main_image', 'Main Image', 'image', true, 12, 'images', 'Main product image URL', 'Min 1000x1000px recommended')
) AS t(attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
WHERE NOT EXISTS (SELECT 1 FROM category_attributes WHERE category_id = '663d0e3c-586a-48e0-a786-69b97c05b47f');

-- Add attributes for Health & Beauty
INSERT INTO category_attributes (category_id, attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
SELECT 
  '073ca073-1e54-4274-9ce5-4beafa4d72db', attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text
FROM (VALUES
  ('title', 'Product Title', 'text', true, 1, 'basic', 'Enter product title', 'Keep under 200 characters'),
  ('brand', 'Brand', 'text', true, 2, 'basic', 'Brand name', 'The brand of the product'),
  ('manufacturer', 'Manufacturer', 'text', false, 3, 'basic', 'Manufacturer name', 'Company that makes the product'),
  ('description', 'Description', 'multiline', true, 4, 'description', 'Detailed product description', 'Min 100 characters recommended'),
  ('bullet_1', 'Bullet Point 1', 'text', true, 5, 'description', 'Key feature 1', 'Highlight key benefit'),
  ('bullet_2', 'Bullet Point 2', 'text', true, 6, 'description', 'Key feature 2', 'Second important feature'),
  ('bullet_3', 'Bullet Point 3', 'text', false, 7, 'description', 'Key feature 3', 'Additional feature'),
  ('bullet_4', 'Bullet Point 4', 'text', false, 8, 'description', 'Key feature 4', 'Optional feature'),
  ('bullet_5', 'Bullet Point 5', 'text', false, 9, 'description', 'Key feature 5', 'Optional feature'),
  ('keywords', 'Search Keywords', 'text', false, 10, 'basic', 'keyword1, keyword2, keyword3', 'Comma-separated keywords'),
  ('upc', 'UPC/EAN', 'text', true, 11, 'identifiers', 'UPC or EAN code', 'Required for most categories'),
  ('main_image', 'Main Image', 'image', true, 12, 'images', 'Main product image URL', 'Min 1000x1000px recommended')
) AS t(attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
WHERE NOT EXISTS (SELECT 1 FROM category_attributes WHERE category_id = '073ca073-1e54-4274-9ce5-4beafa4d72db');

-- Add attributes for Home & Kitchen
INSERT INTO category_attributes (category_id, attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
SELECT 
  'bc28db9d-cfff-472d-ad3b-ff02a1be42fd', attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text
FROM (VALUES
  ('title', 'Product Title', 'text', true, 1, 'basic', 'Enter product title', 'Keep under 200 characters'),
  ('brand', 'Brand', 'text', true, 2, 'basic', 'Brand name', 'The brand of the product'),
  ('manufacturer', 'Manufacturer', 'text', false, 3, 'basic', 'Manufacturer name', 'Company that makes the product'),
  ('description', 'Description', 'multiline', true, 4, 'description', 'Detailed product description', 'Min 100 characters recommended'),
  ('bullet_1', 'Bullet Point 1', 'text', true, 5, 'description', 'Key feature 1', 'Highlight key benefit'),
  ('bullet_2', 'Bullet Point 2', 'text', true, 6, 'description', 'Key feature 2', 'Second important feature'),
  ('bullet_3', 'Bullet Point 3', 'text', false, 7, 'description', 'Key feature 3', 'Additional feature'),
  ('bullet_4', 'Bullet Point 4', 'text', false, 8, 'description', 'Key feature 4', 'Optional feature'),
  ('bullet_5', 'Bullet Point 5', 'text', false, 9, 'description', 'Key feature 5', 'Optional feature'),
  ('keywords', 'Search Keywords', 'text', false, 10, 'basic', 'keyword1, keyword2, keyword3', 'Comma-separated keywords'),
  ('upc', 'UPC/EAN', 'text', true, 11, 'identifiers', 'UPC or EAN code', 'Required for most categories'),
  ('main_image', 'Main Image', 'image', true, 12, 'images', 'Main product image URL', 'Min 1000x1000px recommended')
) AS t(attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
WHERE NOT EXISTS (SELECT 1 FROM category_attributes WHERE category_id = 'bc28db9d-cfff-472d-ad3b-ff02a1be42fd');

-- Add attributes for Pet Supplies
INSERT INTO category_attributes (category_id, attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
SELECT 
  '889e2f44-78a6-4d1f-abc1-faf438f31f0e', attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text
FROM (VALUES
  ('title', 'Product Title', 'text', true, 1, 'basic', 'Enter product title', 'Keep under 200 characters'),
  ('brand', 'Brand', 'text', true, 2, 'basic', 'Brand name', 'The brand of the product'),
  ('manufacturer', 'Manufacturer', 'text', false, 3, 'basic', 'Manufacturer name', 'Company that makes the product'),
  ('description', 'Description', 'multiline', true, 4, 'description', 'Detailed product description', 'Min 100 characters recommended'),
  ('bullet_1', 'Bullet Point 1', 'text', true, 5, 'description', 'Key feature 1', 'Highlight key benefit'),
  ('bullet_2', 'Bullet Point 2', 'text', true, 6, 'description', 'Key feature 2', 'Second important feature'),
  ('bullet_3', 'Bullet Point 3', 'text', false, 7, 'description', 'Key feature 3', 'Additional feature'),
  ('bullet_4', 'Bullet Point 4', 'text', false, 8, 'description', 'Key feature 4', 'Optional feature'),
  ('bullet_5', 'Bullet Point 5', 'text', false, 9, 'description', 'Key feature 5', 'Optional feature'),
  ('keywords', 'Search Keywords', 'text', false, 10, 'basic', 'keyword1, keyword2, keyword3', 'Comma-separated keywords'),
  ('upc', 'UPC/EAN', 'text', true, 11, 'identifiers', 'UPC or EAN code', 'Required for most categories'),
  ('main_image', 'Main Image', 'image', true, 12, 'images', 'Main product image URL', 'Min 1000x1000px recommended')
) AS t(attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
WHERE NOT EXISTS (SELECT 1 FROM category_attributes WHERE category_id = '889e2f44-78a6-4d1f-abc1-faf438f31f0e');

-- Add attributes for Sports & Outdoors
INSERT INTO category_attributes (category_id, attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
SELECT 
  'b433a1e5-3b27-469c-9cac-b237e59d6f29', attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text
FROM (VALUES
  ('title', 'Product Title', 'text', true, 1, 'basic', 'Enter product title', 'Keep under 200 characters'),
  ('brand', 'Brand', 'text', true, 2, 'basic', 'Brand name', 'The brand of the product'),
  ('manufacturer', 'Manufacturer', 'text', false, 3, 'basic', 'Manufacturer name', 'Company that makes the product'),
  ('description', 'Description', 'multiline', true, 4, 'description', 'Detailed product description', 'Min 100 characters recommended'),
  ('bullet_1', 'Bullet Point 1', 'text', true, 5, 'description', 'Key feature 1', 'Highlight key benefit'),
  ('bullet_2', 'Bullet Point 2', 'text', true, 6, 'description', 'Key feature 2', 'Second important feature'),
  ('bullet_3', 'Bullet Point 3', 'text', false, 7, 'description', 'Key feature 3', 'Additional feature'),
  ('bullet_4', 'Bullet Point 4', 'text', false, 8, 'description', 'Key feature 4', 'Optional feature'),
  ('bullet_5', 'Bullet Point 5', 'text', false, 9, 'description', 'Key feature 5', 'Optional feature'),
  ('keywords', 'Search Keywords', 'text', false, 10, 'basic', 'keyword1, keyword2, keyword3', 'Comma-separated keywords'),
  ('upc', 'UPC/EAN', 'text', true, 11, 'identifiers', 'UPC or EAN code', 'Required for most categories'),
  ('main_image', 'Main Image', 'image', true, 12, 'images', 'Main product image URL', 'Min 1000x1000px recommended')
) AS t(attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
WHERE NOT EXISTS (SELECT 1 FROM category_attributes WHERE category_id = 'b433a1e5-3b27-469c-9cac-b237e59d6f29');