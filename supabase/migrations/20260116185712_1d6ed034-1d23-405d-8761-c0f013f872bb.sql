-- Add Inventory Adjustment Qty to all categories
INSERT INTO category_attributes (category_id, attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
SELECT 
  pc.id,
  'inventory_adjustment_qty',
  'Inventory Adjustment Qty',
  'number',
  false,
  40,
  'inventory',
  '0',
  'Manual adjustments to inventory count'
FROM product_categories pc
WHERE NOT EXISTS (
  SELECT 1 FROM category_attributes ca 
  WHERE ca.category_id = pc.id AND ca.attribute_key = 'inventory_adjustment_qty'
);

-- Add Purchase Qty to all categories
INSERT INTO category_attributes (category_id, attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
SELECT 
  pc.id,
  'purchase_qty',
  'Purchase Qty',
  'number',
  false,
  41,
  'inventory',
  '0',
  'Total quantity purchased from suppliers'
FROM product_categories pc
WHERE NOT EXISTS (
  SELECT 1 FROM category_attributes ca 
  WHERE ca.category_id = pc.id AND ca.attribute_key = 'purchase_qty'
);

-- Add Sold Qty to all categories
INSERT INTO category_attributes (category_id, attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
SELECT 
  pc.id,
  'sold_qty',
  'Sold Qty',
  'number',
  false,
  42,
  'inventory',
  '0',
  'Total quantity sold'
FROM product_categories pc
WHERE NOT EXISTS (
  SELECT 1 FROM category_attributes ca 
  WHERE ca.category_id = pc.id AND ca.attribute_key = 'sold_qty'
);

-- Add Return Resellable Qty to all categories
INSERT INTO category_attributes (category_id, attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
SELECT 
  pc.id,
  'return_resellable_qty',
  'Return Resellable Qty',
  'number',
  false,
  43,
  'inventory',
  '0',
  'Returned items that can be resold'
FROM product_categories pc
WHERE NOT EXISTS (
  SELECT 1 FROM category_attributes ca 
  WHERE ca.category_id = pc.id AND ca.attribute_key = 'return_resellable_qty'
);

-- Add Allocated Qty to all categories
INSERT INTO category_attributes (category_id, attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
SELECT 
  pc.id,
  'allocated_qty',
  'Allocated Qty',
  'number',
  false,
  44,
  'inventory',
  '0',
  'Quantity allocated to pending orders'
FROM product_categories pc
WHERE NOT EXISTS (
  SELECT 1 FROM category_attributes ca 
  WHERE ca.category_id = pc.id AND ca.attribute_key = 'allocated_qty'
);

-- Add Reserve Qty to all categories
INSERT INTO category_attributes (category_id, attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
SELECT 
  pc.id,
  'reserve_qty',
  'Reserve Qty',
  'number',
  false,
  45,
  'inventory',
  '0',
  'Quantity held in reserve (safety stock)'
FROM product_categories pc
WHERE NOT EXISTS (
  SELECT 1 FROM category_attributes ca 
  WHERE ca.category_id = pc.id AND ca.attribute_key = 'reserve_qty'
);

-- Add Damage Qty to all categories
INSERT INTO category_attributes (category_id, attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
SELECT 
  pc.id,
  'damage_qty',
  'Damage Qty',
  'number',
  false,
  46,
  'inventory',
  '0',
  'Quantity damaged and unsellable'
FROM product_categories pc
WHERE NOT EXISTS (
  SELECT 1 FROM category_attributes ca 
  WHERE ca.category_id = pc.id AND ca.attribute_key = 'damage_qty'
);

-- Add Available Stock to all categories
INSERT INTO category_attributes (category_id, attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
SELECT 
  pc.id,
  'available_stock',
  'Available Stock',
  'number',
  true,
  47,
  'inventory',
  '0',
  'Stock available for immediate sale'
FROM product_categories pc
WHERE NOT EXISTS (
  SELECT 1 FROM category_attributes ca 
  WHERE ca.category_id = pc.id AND ca.attribute_key = 'available_stock'
);

-- Add On Hand Qty to all categories
INSERT INTO category_attributes (category_id, attribute_key, attribute_name, attribute_type, is_required, display_order, section, placeholder, help_text)
SELECT 
  pc.id,
  'on_hand_qty',
  'On Hand Qty',
  'number',
  false,
  48,
  'inventory',
  '0',
  'Total physical inventory in warehouse'
FROM product_categories pc
WHERE NOT EXISTS (
  SELECT 1 FROM category_attributes ca 
  WHERE ca.category_id = pc.id AND ca.attribute_key = 'on_hand_qty'
);