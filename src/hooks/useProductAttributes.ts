import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ProductCategory, 
  CategoryAttribute, 
  ProductAttribute,
  AttributeValidation 
} from '@/types/productAttribute';

export function useProductAttributes() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [categoryAttributes, setCategoryAttributes] = useState<CategoryAttribute[]>([]);
  const [productAttributes, setProductAttributes] = useState<ProductAttribute[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch all categories
  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }, []);

  // Fetch attributes for a category
  const fetchCategoryAttributes = useCallback(async (categoryId: string) => {
    try {
      const { data, error } = await supabase
        .from('category_attributes')
        .select('*')
        .eq('category_id', categoryId)
        .order('display_order');

      if (error) throw error;
      setCategoryAttributes(data as CategoryAttribute[] || []);
      return data as CategoryAttribute[] || [];
    } catch (error) {
      console.error('Error fetching category attributes:', error);
      return [];
    }
  }, []);

  // Fetch product attributes for a batch item
  const fetchProductAttributes = useCallback(async (batchItemId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_attributes')
        .select('*')
        .eq('batch_item_id', batchItemId);

      if (error) throw error;
      setProductAttributes(data as ProductAttribute[] || []);
      return data as ProductAttribute[] || [];
    } catch (error) {
      console.error('Error fetching product attributes:', error);
      return [];
    }
  }, []);

  // Save product attributes
  const saveProductAttributes = useCallback(async (
    batchItemId: string,
    attributes: Record<string, string | null>
  ) => {
    setIsLoading(true);
    try {
      // Upsert all attributes
      const upserts = Object.entries(attributes).map(([key, value]) => ({
        batch_item_id: batchItemId,
        attribute_key: key,
        attribute_value: value,
        is_valid: true,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('product_attributes')
        .upsert(upserts, { onConflict: 'batch_item_id,attribute_key' });

      if (error) throw error;

      toast({
        title: 'Attributes saved',
        description: 'Product attributes have been updated',
      });

      return true;
    } catch (error) {
      console.error('Error saving attributes:', error);
      toast({
        title: 'Error saving attributes',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Update batch item category
  const updateBatchItemCategory = useCallback(async (batchItemId: string, categoryId: string) => {
    try {
      const { error } = await supabase
        .from('batch_items')
        .update({ category_id: categoryId })
        .eq('id', batchItemId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: 'Error updating category',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  // Validate attributes against category requirements
  // Uses currentValues (form state) when provided, otherwise falls back to productAttrs (database)
  const validateAttributes = useCallback((
    categoryAttrs: CategoryAttribute[],
    productAttrs: ProductAttribute[],
    currentValues?: Record<string, string>
  ): AttributeValidation[] => {
    const attrMap = new Map(productAttrs.map(a => [a.attribute_key, a]));

    return categoryAttrs.map(catAttr => {
      const prodAttr = attrMap.get(catAttr.attribute_key);
      // Prefer currentValues (live form state) over productAttrs (database state)
      const value = currentValues?.[catAttr.attribute_key] ?? prodAttr?.attribute_value;
      const hasValue = typeof value === 'string' && value.trim() !== '';
      const isMissing = catAttr.is_required && !hasValue;

      // isValid: true only when populated; optional empties should show as incomplete (yellow)
      const isValid = hasValue;

      return {
        key: catAttr.attribute_key,
        name: catAttr.attribute_name,
        isRequired: catAttr.is_required,
        isValid,
        isMissing,
        message: isMissing ? 'Required field is missing' : prodAttr?.validation_message || null,
        section: catAttr.section,
      };
    });
  }, []);

  return {
    categories,
    categoryAttributes,
    productAttributes,
    isLoading,
    fetchCategories,
    fetchCategoryAttributes,
    fetchProductAttributes,
    saveProductAttributes,
    updateBatchItemCategory,
    validateAttributes,
  };
}
