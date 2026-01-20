import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BatchItem } from '@/types/batch';

export interface ChildVariation {
  id: string;
  name: string;
  sku: string;
  productId: string;
  variationId: string;
  image: string | null;
  marketplace: string;
  attributes: Record<string, string>;
  status: 'pending' | 'processing' | 'success' | 'failed';
  salePrice: number | null;
  stockQty: number | null;
}

// Extract master product ID from product_id or variation patterns
// Examples: "2802" -> "2802", "2802-1" -> "2802", "PROD-2802-VAR-1" -> "PROD-2802"
function extractMasterProductId(productId: string): string {
  // Pattern 1: Simple number with suffix (e.g., "2802-1" -> "2802")
  const simpleMatch = productId.match(/^(\d+)(?:-\d+)?$/);
  if (simpleMatch) {
    return simpleMatch[1];
  }
  
  // Pattern 2: Alphanumeric with variation suffix (e.g., "PROD-2802-VAR-1" -> "PROD-2802")
  const complexMatch = productId.match(/^(.+?)(?:-VAR-\d+|-\d+)$/i);
  if (complexMatch) {
    return complexMatch[1];
  }
  
  // No variation pattern found, return as-is
  return productId;
}

// Check if a product ID is a variation (has suffix)
function isVariationProduct(productId: string): boolean {
  return /^.+-\d+$/.test(productId) || /-VAR-\d+$/i.test(productId);
}

// Extract variation number from product ID
function extractVariationNumber(productId: string): string | null {
  const match = productId.match(/-(\d+)$/);
  return match ? match[1] : null;
}

export function useChildVariations() {
  const [childVariations, setChildVariations] = useState<ChildVariation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [masterProductId, setMasterProductId] = useState<string | null>(null);

  // Fetch all variations for a given batch item
  const fetchChildVariations = useCallback(async (batchItem: BatchItem, batchId: string): Promise<ChildVariation[]> => {
    setIsLoading(true);
    try {
      const currentMasterId = extractMasterProductId(batchItem.product_id);
      setMasterProductId(currentMasterId);

      // Find all batch items in the same batch that share the same master product ID
      const { data: items, error } = await supabase
        .from('batch_items')
        .select('*')
        .eq('batch_id', batchId);

      if (error) throw error;

      // Filter items that belong to the same master product
      const relatedItems = (items || []).filter(item => {
        const itemMasterId = extractMasterProductId(item.product_id);
        return itemMasterId === currentMasterId && item.id !== batchItem.id;
      });

      // Fetch product attributes for each related item
      const variationsWithAttrs = await Promise.all(
        relatedItems.map(async (item) => {
          const { data: attrs } = await supabase
            .from('product_attributes')
            .select('attribute_key, attribute_value')
            .eq('batch_item_id', item.id);

          const attributes: Record<string, string> = {};
          (attrs || []).forEach(attr => {
            if (attr.attribute_value) {
              attributes[attr.attribute_key] = attr.attribute_value;
            }
          });

          // Build a display name from variation attributes
          const variationNum = extractVariationNumber(item.product_id);
          const varDetails = [
            attributes.color,
            attributes.size,
            attributes.material
          ].filter(Boolean).join(' / ');

          const displayName = varDetails 
            ? `${item.product_name} - ${varDetails}`
            : variationNum 
              ? `${item.product_name} - Variation ${variationNum}`
              : item.product_name;

          return {
            id: item.id,
            name: displayName,
            sku: item.product_sku || '',
            productId: item.product_id,
            variationId: variationNum || item.product_id,
            image: item.product_image,
            marketplace: item.marketplace,
            attributes,
            status: item.status as 'pending' | 'processing' | 'success' | 'failed',
            salePrice: item.sale_price,
            stockQty: item.stock_qty,
          };
        })
      );

      setChildVariations(variationsWithAttrs);
      return variationsWithAttrs;
    } catch (error) {
      console.error('Error fetching child variations:', error);
      setChildVariations([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear variations when switching items
  const clearVariations = useCallback(() => {
    setChildVariations([]);
    setMasterProductId(null);
  }, []);

  return {
    childVariations,
    isLoading,
    masterProductId,
    fetchChildVariations,
    clearVariations,
    isVariationProduct,
    extractMasterProductId,
  };
}
