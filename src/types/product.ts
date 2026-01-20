export interface MarketplaceStatus {
  platform: 'amazon' | 'walmart' | 'ebay' | 'newegg' | 'bestbuy' | 'target' | 'etsy' | 'shopify' | 'temu' | 'macys' | 'costco' | 'homedepot' | 'lowes' | 'wayfair' | 'overstock';
  status: 'live' | 'inactive' | 'error' | 'not_listed';
}

export interface ProductVariation {
  variationId: string;
  type: 'color' | 'size' | 'style' | 'material';
  value: string;
}

export type RestockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'reorder_now';

// Product type: single (standalone), kit (bundle of products), variation (part of a variation group)
export type ProductType = 'single' | 'kit' | 'variation';

// Kit component - a product included in a kit with its quantity
export interface KitComponent {
  productId: string;
  quantity: number;
}

export interface Product {
  id: string;
  image: string;
  name: string;
  vendorSku: string;
  manufacturerPart: string;
  asin: string;
  fnsku: string;
  gtin: string;
  ean: string;
  isbn: string;
  inventoryDifference: number;
  productId: string;
  variationId: string | null; // null if no variation, otherwise productId-1, productId-2, etc.
  variation: ProductVariation | null; // null if not a variation product
  vendorName: string;
  brand: string;
  kitProduct: boolean; // deprecated - use productType instead
  productType: ProductType; // 'single', 'kit', or 'variation'
  kitComponents: KitComponent[]; // products included in this kit (only for kit products)
  landedCost: number;
  shippingCost: number;
  salePrice: number;
  purchaseQty: number;
  soldQty: number;
  soldQtyLastMonth: number;
  soldQtyLastQuarter: number;
  soldQtyLastYear: number;
  stockQty: number;
  returnQty: number;
  grossProfitPercent: number;
  grossProfitAmount: number;
  marketplaces: MarketplaceStatus[];
  // Inventory forecasting fields
  velocity: number; // units sold per day
  stockDays: number; // days of stock remaining
  restockStatus: RestockStatus;
  suggestedRestockQty: number;
}

export type SoldPeriod = 'all' | 'lastMonth' | 'lastQuarter' | 'lastYear' | 'custom';

export interface FilterState {
  search: string;
  brand: string[];
  marketplace: string[];
  status: string[];
  priceRange: [number, number];
  stockRange: [number, number];
  soldRange: [number, number];
  soldPeriod: SoldPeriod;
  soldDateRange: [Date | null, Date | null];
  kitProduct: boolean | null;
  hasVariation: boolean | null; // null = all, true = only variations, false = no variations
  tags: string[]; // array of tag IDs
}
