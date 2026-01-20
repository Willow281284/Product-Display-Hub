-- Add pricing attributes to ALL categories that don't have them yet
INSERT INTO category_attributes (category_id, attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
SELECT 
  pc.id,
  'price',
  'Price',
  'number',
  true,
  20,
  'pricing',
  '0.00',
  'The selling price for this product'
FROM product_categories pc
WHERE NOT EXISTS (
  SELECT 1 FROM category_attributes ca 
  WHERE ca.category_id = pc.id AND ca.attribute_key = 'price'
);

-- Add min_price to all categories
INSERT INTO category_attributes (category_id, attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
SELECT 
  pc.id,
  'min_price',
  'Minimum Price',
  'number',
  false,
  21,
  'pricing',
  '0.00',
  'The minimum price you are willing to accept'
FROM product_categories pc
WHERE NOT EXISTS (
  SELECT 1 FROM category_attributes ca 
  WHERE ca.category_id = pc.id AND ca.attribute_key = 'min_price'
);

-- Add max_price to all categories
INSERT INTO category_attributes (category_id, attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
SELECT 
  pc.id,
  'max_price',
  'Maximum Price',
  'number',
  false,
  22,
  'pricing',
  '0.00',
  'The maximum price for this product'
FROM product_categories pc
WHERE NOT EXISTS (
  SELECT 1 FROM category_attributes ca 
  WHERE ca.category_id = pc.id AND ca.attribute_key = 'max_price'
);

-- Add business_price to all categories
INSERT INTO category_attributes (category_id, attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
SELECT 
  pc.id,
  'business_price',
  'Business Price',
  'number',
  false,
  23,
  'pricing',
  '0.00',
  'Special pricing for business customers'
FROM product_categories pc
WHERE NOT EXISTS (
  SELECT 1 FROM category_attributes ca 
  WHERE ca.category_id = pc.id AND ca.attribute_key = 'business_price'
);

-- Add quantity_discounts to all categories
INSERT INTO category_attributes (category_id, attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
SELECT 
  pc.id,
  'quantity_discounts',
  'Quantity Discounts',
  'text',
  false,
  24,
  'pricing',
  NULL,
  'Volume-based pricing tiers for bulk orders'
FROM product_categories pc
WHERE NOT EXISTS (
  SELECT 1 FROM category_attributes ca 
  WHERE ca.category_id = pc.id AND ca.attribute_key = 'quantity_discounts'
);