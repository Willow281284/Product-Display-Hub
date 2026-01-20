export type FilterField = 
  | 'name'
  | 'vendorSku'
  | 'manufacturerPart'
  | 'asin'
  | 'fnsku'
  | 'gtin'
  | 'ean'
  | 'isbn'
  | 'productId'
  | 'vendorName'
  | 'brand'
  | 'salePrice'
  | 'landedCost'
  | 'shippingCost'
  | 'stockQty'
  | 'soldQty'
  | 'soldQtyLastMonth'
  | 'soldQtyLastQuarter'
  | 'soldQtyLastYear'
  | 'purchaseQty'
  | 'returnQty'
  | 'grossProfitPercent'
  | 'grossProfitAmount'
  | 'velocity'
  | 'stockDays'
  | 'restockStatus'
  | 'suggestedRestockQty'
  | 'hasOffer'
  | 'offerStatus'
  | 'offerType'
  | 'marketplace_amazon'
  | 'marketplace_walmart'
  | 'marketplace_ebay'
  | 'marketplace_newegg'
  | 'marketplace_bestbuy'
  | 'marketplace_target'
  | 'marketplace_etsy'
  | 'marketplace_shopify'
  | 'marketplace_temu'
  | 'marketplace_macys'
  | 'marketplace_costco'
  | 'marketplace_homedepot'
  | 'marketplace_lowes'
  | 'marketplace_wayfair'
  | 'marketplace_overstock';

export type FilterOperator =
  | 'is_blank'
  | 'is_not_blank'
  | 'equals'
  | 'not_equals'
  | 'starts_with'
  | 'not_starts_with'
  | 'ends_with'
  | 'not_ends_with'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'between';

export interface FilterCriteria {
  id: string;
  field: FilterField;
  operator: FilterOperator;
  value: string;
}

export interface CustomFilter {
  id: string;
  name: string;
  description: string;
  criteria: FilterCriteria[];
}

export const fieldLabels: Record<FilterField, string> = {
  name: 'Product Name',
  vendorSku: 'Vendor SKU',
  manufacturerPart: 'Manufacturer Part #',
  asin: 'ASIN',
  fnsku: 'FNSKU',
  gtin: 'GTIN',
  ean: 'EAN',
  isbn: 'ISBN',
  productId: 'Product ID',
  vendorName: 'Vendor Name',
  brand: 'Brand',
  salePrice: 'Sale Price',
  landedCost: 'Landed Cost',
  shippingCost: 'Shipping Cost',
  stockQty: 'In Stock',
  soldQty: 'Sold Qty (All Time)',
  soldQtyLastMonth: 'Sold Qty (Last Month)',
  soldQtyLastQuarter: 'Sold Qty (Last Quarter)',
  soldQtyLastYear: 'Sold Qty (Last Year)',
  purchaseQty: 'Purchase Qty',
  returnQty: 'Return Qty',
  grossProfitPercent: 'Profit Margin %',
  grossProfitAmount: 'Profit Amount',
  velocity: 'Velocity (units/day)',
  stockDays: 'Stock Days',
  restockStatus: 'Restock Status',
  suggestedRestockQty: 'Suggested Restock Qty',
  hasOffer: 'Has Active Offer',
  offerStatus: 'Offer Status',
  offerType: 'Offer Type',
  marketplace_amazon: 'Amazon Status',
  marketplace_walmart: 'Walmart Status',
  marketplace_ebay: 'eBay Status',
  marketplace_newegg: 'Newegg Status',
  marketplace_bestbuy: 'Best Buy Status',
  marketplace_target: 'Target Status',
  marketplace_etsy: 'Etsy Status',
  marketplace_shopify: 'Shopify Status',
  marketplace_temu: 'Temu Status',
  marketplace_macys: "Macy's Status",
  marketplace_costco: 'Costco Status',
  marketplace_homedepot: 'Home Depot Status',
  marketplace_lowes: "Lowe's Status",
  marketplace_wayfair: 'Wayfair Status',
  marketplace_overstock: 'Overstock Status',
};

export const operatorLabels: Record<FilterOperator, string> = {
  is_blank: 'Is Blank',
  is_not_blank: 'Is Not Blank',
  equals: 'Equals',
  not_equals: 'Does Not Equal',
  starts_with: 'Starts With',
  not_starts_with: 'Does Not Start With',
  ends_with: 'Ends With',
  not_ends_with: 'Does Not End With',
  contains: 'Contains',
  not_contains: 'Does Not Contain',
  greater_than: 'Greater Than',
  less_than: 'Less Than',
  greater_or_equal: 'Greater Or Equal',
  less_or_equal: 'Less Or Equal',
  between: 'Between (Range)',
};

export const stringOperators: FilterOperator[] = [
  'is_blank',
  'is_not_blank',
  'equals',
  'not_equals',
  'starts_with',
  'not_starts_with',
  'ends_with',
  'not_ends_with',
  'contains',
  'not_contains',
];

export const numericOperators: FilterOperator[] = [
  'is_blank',
  'is_not_blank',
  'equals',
  'not_equals',
  'greater_than',
  'less_than',
  'greater_or_equal',
  'less_or_equal',
  'between',
];

export const marketplaceOperators: FilterOperator[] = [
  'equals',
  'not_equals',
];

export const restockStatusOperators: FilterOperator[] = [
  'equals',
  'not_equals',
];

export const offerOperators: FilterOperator[] = [
  'equals',
  'not_equals',
];

export const booleanOperators: FilterOperator[] = [
  'equals',
];

export function getOperatorsForField(field: FilterField): FilterOperator[] {
  if (field.startsWith('marketplace_')) {
    return marketplaceOperators;
  }
  if (field === 'restockStatus') {
    return restockStatusOperators;
  }
  if (field === 'offerStatus' || field === 'offerType') {
    return offerOperators;
  }
  if (field === 'hasOffer') {
    return booleanOperators;
  }
  const numericFields: FilterField[] = [
    'salePrice',
    'landedCost',
    'shippingCost',
    'stockQty',
    'soldQty',
    'soldQtyLastMonth',
    'soldQtyLastQuarter',
    'soldQtyLastYear',
    'purchaseQty',
    'returnQty',
    'grossProfitPercent',
    'grossProfitAmount',
    'velocity',
    'stockDays',
    'suggestedRestockQty',
  ];
  if (numericFields.includes(field)) {
    return numericOperators;
  }
  return stringOperators;
}

export function needsValueInput(operator: FilterOperator): boolean {
  return operator !== 'is_blank' && operator !== 'is_not_blank';
}

export function needsRangeInput(operator: FilterOperator): boolean {
  return operator === 'between';
}
