import { useState, useCallback } from 'react';
import { CustomFilter, FilterCriteria, FilterField } from '@/types/customFilter';
import { Product } from '@/types/product';

const STORAGE_KEY = 'product-custom-filters';

function loadFilters(): CustomFilter[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveFilters(filters: CustomFilter[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
}

export function useCustomFilters() {
  const [customFilters, setCustomFilters] = useState<CustomFilter[]>(loadFilters);
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);

  const addFilter = useCallback((filter: CustomFilter) => {
    setCustomFilters((prev) => {
      const exists = prev.find((f) => f.id === filter.id);
      const updated = exists
        ? prev.map((f) => (f.id === filter.id ? filter : f))
        : [...prev, filter];
      saveFilters(updated);
      return updated;
    });
  }, []);

  const deleteFilter = useCallback((filterId: string) => {
    setCustomFilters((prev) => {
      const updated = prev.filter((f) => f.id !== filterId);
      saveFilters(updated);
      return updated;
    });
    if (activeFilterId === filterId) {
      setActiveFilterId(null);
    }
  }, [activeFilterId]);

  const toggleActiveFilter = useCallback((filterId: string) => {
    setActiveFilterId((prev) => (prev === filterId ? null : filterId));
  }, []);

  const clearActiveFilter = useCallback(() => {
    setActiveFilterId(null);
  }, []);

  return {
    customFilters,
    activeFilterId,
    activeFilter: customFilters.find((f) => f.id === activeFilterId) || null,
    addFilter,
    deleteFilter,
    toggleActiveFilter,
    clearActiveFilter,
  };
}

function getFieldValue(product: Product, field: FilterField): string | number | null {
  if (field.startsWith('marketplace_')) {
    const platform = field.replace('marketplace_', '') as Product['marketplaces'][0]['platform'];
    const marketplace = product.marketplaces.find((m) => m.platform === platform);
    // Return 'not_listed' if marketplace not found (means product is not on that marketplace)
    return marketplace?.status ?? 'not_listed';
  }

  switch (field) {
    case 'name':
      return product.name;
    case 'vendorSku':
      return product.vendorSku;
    case 'manufacturerPart':
      return product.manufacturerPart;
    case 'asin':
      return product.asin || '';
    case 'fnsku':
      return product.fnsku || '';
    case 'gtin':
      return product.gtin || '';
    case 'ean':
      return product.ean || '';
    case 'isbn':
      return product.isbn || '';
    case 'productId':
      return product.productId;
    case 'vendorName':
      return product.vendorName;
    case 'brand':
      return product.brand;
    case 'salePrice':
      return product.salePrice;
    case 'landedCost':
      return product.landedCost;
    case 'shippingCost':
      return product.shippingCost;
    case 'stockQty':
      return product.stockQty;
    case 'soldQty':
      return product.soldQty;
    case 'soldQtyLastMonth':
      return product.soldQtyLastMonth;
    case 'soldQtyLastQuarter':
      return product.soldQtyLastQuarter;
    case 'soldQtyLastYear':
      return product.soldQtyLastYear;
    case 'purchaseQty':
      return product.purchaseQty;
    case 'returnQty':
      return product.returnQty;
    case 'grossProfitPercent':
      return product.grossProfitPercent;
    case 'grossProfitAmount':
      return product.grossProfitAmount;
    default:
      return null;
  }
}

function matchesCriteria(product: Product, criteria: FilterCriteria): boolean {
  const fieldValue = getFieldValue(product, criteria.field);
  const compareValue = criteria.value.toLowerCase();

  switch (criteria.operator) {
    case 'is_blank':
      return fieldValue === null || fieldValue === '' || fieldValue === 0;
    case 'is_not_blank':
      return fieldValue !== null && fieldValue !== '' && fieldValue !== 0;
    case 'equals':
      if (typeof fieldValue === 'number') {
        return fieldValue === parseFloat(criteria.value);
      }
      return String(fieldValue).toLowerCase() === compareValue;
    case 'not_equals':
      if (typeof fieldValue === 'number') {
        return fieldValue !== parseFloat(criteria.value);
      }
      return String(fieldValue).toLowerCase() !== compareValue;
    case 'starts_with':
      return String(fieldValue).toLowerCase().startsWith(compareValue);
    case 'not_starts_with':
      return !String(fieldValue).toLowerCase().startsWith(compareValue);
    case 'ends_with':
      return String(fieldValue).toLowerCase().endsWith(compareValue);
    case 'not_ends_with':
      return !String(fieldValue).toLowerCase().endsWith(compareValue);
    case 'contains':
      return String(fieldValue).toLowerCase().includes(compareValue);
    case 'not_contains':
      return !String(fieldValue).toLowerCase().includes(compareValue);
    case 'greater_than':
      return typeof fieldValue === 'number' && fieldValue > parseFloat(criteria.value);
    case 'less_than':
      return typeof fieldValue === 'number' && fieldValue < parseFloat(criteria.value);
    case 'greater_or_equal':
      return typeof fieldValue === 'number' && fieldValue >= parseFloat(criteria.value);
    case 'less_or_equal':
      return typeof fieldValue === 'number' && fieldValue <= parseFloat(criteria.value);
    case 'between':
      if (typeof fieldValue === 'number') {
        const [min, max] = criteria.value.split(',').map(v => parseFloat(v.trim()));
        return !isNaN(min) && !isNaN(max) && fieldValue >= min && fieldValue <= max;
      }
      return false;
    default:
      return true;
  }
}

export function applyCustomFilter(
  products: Product[],
  filter: CustomFilter | null
): Product[] {
  if (!filter || filter.criteria.length === 0) {
    return products;
  }

  return products.filter((product) =>
    filter.criteria.every((criteria) => matchesCriteria(product, criteria))
  );
}
