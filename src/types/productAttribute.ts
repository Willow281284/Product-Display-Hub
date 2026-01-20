export interface ProductCategory {
  id: string;
  name: string;
  parent_id: string | null;
  marketplace: string;
  created_at: string;
}

export interface CategoryAttribute {
  id: string;
  category_id: string;
  attribute_name: string;
  attribute_key: string;
  attribute_type: 'text' | 'number' | 'select' | 'multiline' | 'image' | 'bullet_points' | 'aplus_content';
  is_required: boolean;
  validation_rules: Record<string, unknown> | null;
  display_order: number;
  section: 'basic' | 'description' | 'images' | 'pricing' | 'inventory' | 'inventory_pricing' | 'identifiers';
  placeholder: string | null;
  help_text: string | null;
  created_at: string;
}

export interface ProductAttribute {
  id: string;
  batch_item_id: string;
  attribute_key: string;
  attribute_value: string | null;
  is_valid: boolean;
  validation_message: string | null;
  updated_at: string;
}

export interface AttributeValidation {
  key: string;
  name: string;
  isRequired: boolean;
  isValid: boolean;
  isMissing: boolean;
  message: string | null;
  section: string;
}

export type AttributeSection = 'basic' | 'description' | 'images' | 'inventory_pricing' | 'identifiers' | 'variations' | 'extra_attributes';

export const SECTION_LABELS: Record<AttributeSection, string> = {
  basic: 'Basic Information',
  description: 'Description & Bullet Points',
  images: 'Images',
  inventory_pricing: 'Inventory & Price',
  identifiers: 'Product Identifiers',
  variations: 'Variations',
  extra_attributes: 'Extra Attributes',
};
