-- Add SKU to all categories
INSERT INTO category_attributes (category_id, attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
SELECT 
  pc.id,
  'sku',
  'SKU',
  'text',
  false,
  30,
  'identifiers',
  'Enter product SKU',
  'Stock Keeping Unit - your internal product identifier'
FROM product_categories pc
WHERE NOT EXISTS (
  SELECT 1 FROM category_attributes ca 
  WHERE ca.category_id = pc.id AND ca.attribute_key = 'sku'
);

-- Add Barcode to all categories
INSERT INTO category_attributes (category_id, attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
SELECT 
  pc.id,
  'barcode',
  'Barcode',
  'text',
  false,
  31,
  'identifiers',
  'Enter barcode',
  'The product barcode number'
FROM product_categories pc
WHERE NOT EXISTS (
  SELECT 1 FROM category_attributes ca 
  WHERE ca.category_id = pc.id AND ca.attribute_key = 'barcode'
);

-- Add GTIN to all categories
INSERT INTO category_attributes (category_id, attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
SELECT 
  pc.id,
  'gtin',
  'GTIN',
  'text',
  false,
  32,
  'identifiers',
  'Enter GTIN',
  'Global Trade Item Number (8, 12, 13, or 14 digits)'
FROM product_categories pc
WHERE NOT EXISTS (
  SELECT 1 FROM category_attributes ca 
  WHERE ca.category_id = pc.id AND ca.attribute_key = 'gtin'
);

-- Add EAN to all categories
INSERT INTO category_attributes (category_id, attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
SELECT 
  pc.id,
  'ean',
  'EAN',
  'text',
  false,
  33,
  'identifiers',
  'Enter EAN',
  'European Article Number (13 digits)'
FROM product_categories pc
WHERE NOT EXISTS (
  SELECT 1 FROM category_attributes ca 
  WHERE ca.category_id = pc.id AND ca.attribute_key = 'ean'
);

-- Add ISBN to all categories
INSERT INTO category_attributes (category_id, attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
SELECT 
  pc.id,
  'isbn',
  'ISBN',
  'text',
  false,
  34,
  'identifiers',
  'Enter ISBN',
  'International Standard Book Number (10 or 13 digits)'
FROM product_categories pc
WHERE NOT EXISTS (
  SELECT 1 FROM category_attributes ca 
  WHERE ca.category_id = pc.id AND ca.attribute_key = 'isbn'
);

-- Add ASIN to all categories
INSERT INTO category_attributes (category_id, attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
SELECT 
  pc.id,
  'asin',
  'ASIN',
  'text',
  false,
  35,
  'identifiers',
  'Enter ASIN',
  'Amazon Standard Identification Number (10 characters)'
FROM product_categories pc
WHERE NOT EXISTS (
  SELECT 1 FROM category_attributes ca 
  WHERE ca.category_id = pc.id AND ca.attribute_key = 'asin'
);

-- Add FNSKU to all categories
INSERT INTO category_attributes (category_id, attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
SELECT 
  pc.id,
  'fnsku',
  'FNSKU',
  'text',
  false,
  36,
  'identifiers',
  'Enter FNSKU',
  'Fulfillment Network SKU - Amazon FBA identifier'
FROM product_categories pc
WHERE NOT EXISTS (
  SELECT 1 FROM category_attributes ca 
  WHERE ca.category_id = pc.id AND ca.attribute_key = 'fnsku'
);

-- Add Manufacturer Number to all categories
INSERT INTO category_attributes (category_id, attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
SELECT 
  pc.id,
  'manufacturer_number',
  'Manufacturer Number',
  'text',
  false,
  37,
  'identifiers',
  'Enter MPN',
  'Manufacturer Part Number assigned by the manufacturer'
FROM product_categories pc
WHERE NOT EXISTS (
  SELECT 1 FROM category_attributes ca 
  WHERE ca.category_id = pc.id AND ca.attribute_key = 'manufacturer_number'
);