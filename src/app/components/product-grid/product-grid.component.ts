import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  HostListener,
  OnInit,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { brands, marketplacePlatforms, mockProducts } from '@/data/mockProducts';
import { FilterState, Product, SoldPeriod, ProductType, KitComponent, MarketplaceStatus } from '@/types/product';
import { Tag, tagColors } from '@/types/tag';
import { TagService } from '@/app/services/tag.service';
import { CreateOfferDialogComponent } from '@/app/components/create-offer-dialog/create-offer-dialog.component';
import * as XLSX from 'xlsx';
import {
  Offer,
  OfferScope,
  formatOfferDiscount,
  getOfferDaysRemaining,
  getOfferStatus,
  offerStatusConfig,
  offerTypeLabels,
} from '@/types/offer';
import { OfferService } from '@/app/services/offer.service';

type ColumnId =
  | 'image'
  | 'name'
  | 'productType'
  | 'tags'
  | 'offers'
  | 'sku'
  | 'brand'
  | 'productId'
  | 'variationId'
  | 'vendor'
  | 'mpn'
  | 'asin'
  | 'fnsku'
  | 'gtin'
  | 'ean'
  | 'isbn'
  | 'landedCost'
  | 'shippingCost'
  | 'salePrice'
  | 'purchaseQty'
  | 'soldQty'
  | 'stockQty'
  | 'returnQty'
  | 'profitMargin'
  | 'profitAmount'
  | 'velocity'
  | 'stockDays'
  | 'restockStatus'
  | 'suggestedRestockQty'
  | 'marketplaces'
  | 'actions';

type SortKey = ColumnId;

type SortDirection = 'asc' | 'desc';

type StatusFilter = 'live' | 'inactive' | 'error' | 'not_listed';

type BulkListingStep = 'configure' | 'preview';
type BulkPublishMethod = 'ai' | 'upc' | 'manual';

interface CsvFieldConfig {
  id: string;
  label: string;
  description?: string;
  required?: boolean;
}

interface ProductInput {
  [key: string]: string | undefined;
  name?: string;
  vendorSku?: string;
  brand?: string;
  productId?: string;
  vendorName?: string;
  manufacturerPart?: string;
  asin?: string;
  fnsku?: string;
  gtin?: string;
  ean?: string;
  isbn?: string;
  landedCost?: string;
  shippingCost?: string;
  salePrice?: string;
  purchaseQty?: string;
  soldQty?: string;
  stockQty?: string;
  returnQty?: string;
  image?: string;
  productType?: string;
}

interface ManualFieldConfig {
  id: string;
  label: string;
  placeholder: string;
  required?: boolean;
  type?: string;
}

interface BulkListingItemData {
  sku: string;
  stockQty: number | null;
  salePrice: number | null;
  msrp: number | null;
  shippingCost: number | null;
  condition: string;
}

interface CustomFilterRule {
  field: string;
  condition: string;
  value: string;
}

interface CustomFilter {
  id: string;
  name: string;
  description: string;
  rules: CustomFilterRule[];
}

const csvFields: CsvFieldConfig[] = [
  { id: 'name', label: 'Product Name', required: true },
  { id: 'vendorSku', label: 'SKU', required: true },
  { id: 'brand', label: 'Brand' },
  { id: 'productId', label: 'Product ID' },
  { id: 'vendorName', label: 'Vendor' },
  { id: 'manufacturerPart', label: 'MPN' },
  { id: 'asin', label: 'ASIN' },
  { id: 'fnsku', label: 'FNSKU' },
  { id: 'gtin', label: 'GTIN' },
  { id: 'ean', label: 'EAN' },
  { id: 'isbn', label: 'ISBN' },
  { id: 'landedCost', label: 'Landed Cost' },
  { id: 'shippingCost', label: 'Shipping Cost' },
  { id: 'salePrice', label: 'Sale Price' },
  { id: 'purchaseQty', label: 'Purchased Qty' },
  { id: 'soldQty', label: 'Sold Qty' },
  { id: 'stockQty', label: 'Stock Qty' },
  { id: 'returnQty', label: 'Return Qty' },
];

const csvIdentifierOptions: CsvFieldConfig[] = [
  { id: 'vendorSku', label: 'SKU', description: 'Vendor Stock Keeping Unit' },
  { id: 'productId', label: 'Product ID', description: 'Internal product identifier' },
  { id: 'gtin', label: 'UPC/GTIN', description: 'Universal Product Code' },
  { id: 'asin', label: 'ASIN', description: 'Amazon Standard ID' },
  { id: 'fnsku', label: 'FNSKU', description: 'Fulfillment Network SKU' },
  { id: 'ean', label: 'EAN', description: 'European Article Number' },
  { id: 'isbn', label: 'ISBN', description: 'International Standard Book Number' },
  { id: 'manufacturerPart', label: 'MPN', description: 'Manufacturer Part Number' },
];

const marketplaceLabelMap: Record<string, string> = {
  amazon: 'Amazon',
  walmart: 'Walmart',
  ebay: 'eBay',
  newegg: 'Newegg',
  bestbuy: 'Best Buy',
  target: 'Target',
  etsy: 'Etsy',
  shopify: 'Shopify',
  temu: 'Temu',
  macys: "Macy's",
  costco: 'Costco',
  homedepot: 'Home Depot',
  lowes: "Lowe's",
  wayfair: 'Wayfair',
  overstock: 'Overstock',
};

const marketplaceBadgeMap: Record<string, string> = {
  amazon: 'amz',
  walmart: 'wmt',
  ebay: 'ebay',
  newegg: 'ne',
  bestbuy: 'bby',
  target: 'tgt',
  etsy: 'etsy',
  shopify: 'shop',
  temu: 'temu',
  macys: 'mcy',
  costco: 'cost',
  homedepot: 'hd',
  lowes: 'low',
  wayfair: 'wf',
  overstock: 'os',
};

const marketplaceBadgeClassMap: Record<string, string> = {
  amazon: 'bg-amber-500 text-black',
  walmart: 'bg-blue-600 text-white',
  ebay: 'bg-slate-700 text-white',
  newegg: 'bg-orange-600 text-white',
  bestbuy: 'bg-blue-500 text-white',
  target: 'bg-red-600 text-white',
  etsy: 'bg-orange-500 text-white',
  shopify: 'bg-emerald-600 text-white',
  temu: 'bg-orange-500 text-white',
  macys: 'bg-rose-600 text-white',
  costco: 'bg-red-700 text-white',
  homedepot: 'bg-orange-600 text-white',
  lowes: 'bg-blue-700 text-white',
  wayfair: 'bg-indigo-600 text-white',
  overstock: 'bg-slate-600 text-white',
};

const bulkListingMethods = [
  {
    id: 'ai' as BulkPublishMethod,
    label: 'AI Auto-Fill',
    description: 'Use AI to generate optimized titles, descriptions & attributes',
    icon: 'sparkles',
  },
  {
    id: 'upc' as BulkPublishMethod,
    label: 'UPC Match',
    description: 'Match products using UPC/barcode to existing marketplace listings',
    icon: 'barcode',
  },
  {
    id: 'manual' as BulkPublishMethod,
    label: 'Manual Publish',
    description: 'Publish with existing product data as-is',
    icon: 'upload',
  },
];

const bulkConditionOptions = [
  'New',
  'Refurbished',
  'Used - Like New',
  'Used - Good',
  'Used - Acceptable',
];

const csvSampleProducts: Record<string, string>[] = [
  {
    name: 'Wireless Bluetooth Headphones',
    vendorSku: 'WBH-001',
    brand: 'TechSound',
    productId: 'PROD-001',
    vendorName: 'Tech Distributors Inc',
    manufacturerPart: 'TS-WBH-2024',
    asin: 'B0EXAMPLE01',
    fnsku: 'X0EXAMPLE01',
    gtin: '0123456789012',
    ean: '1234567890123',
    isbn: '',
    landedCost: '45.99',
    shippingCost: '5.99',
    salePrice: '89.99',
    purchaseQty: '500',
    soldQty: '125',
    stockQty: '375',
    returnQty: '8',
  },
  {
    name: 'USB-C Fast Charging Cable 6ft',
    vendorSku: 'USB-C-6FT',
    brand: 'PowerLink',
    productId: 'PROD-002',
    vendorName: 'Cable World LLC',
    manufacturerPart: 'PL-USBC-6',
    asin: 'B0EXAMPLE02',
    fnsku: 'X0EXAMPLE02',
    gtin: '0123456789013',
    ean: '1234567890124',
    isbn: '',
    landedCost: '3.50',
    shippingCost: '1.00',
    salePrice: '12.99',
    purchaseQty: '1000',
    soldQty: '450',
    stockQty: '550',
    returnQty: '12',
  },
];

const manualBasicFields: ManualFieldConfig[] = [
  { id: 'name', label: 'Product Name', required: true, placeholder: 'Enter product name' },
  { id: 'vendorSku', label: 'SKU', required: true, placeholder: 'Enter SKU' },
  { id: 'brand', label: 'Brand', placeholder: 'Enter brand' },
  { id: 'vendorName', label: 'Vendor', placeholder: 'Enter vendor name' },
];

const manualIdentifierFields: ManualFieldConfig[] = [
  { id: 'asin', label: 'ASIN', placeholder: 'Amazon Standard Identification Number' },
  { id: 'fnsku', label: 'FNSKU', placeholder: 'Fulfillment Network SKU' },
  { id: 'gtin', label: 'GTIN', placeholder: 'Global Trade Item Number' },
  { id: 'ean', label: 'EAN', placeholder: 'European Article Number' },
  { id: 'isbn', label: 'ISBN', placeholder: 'International Standard Book Number' },
  { id: 'manufacturerPart', label: 'MPN', placeholder: 'Manufacturer Part Number' },
];

const manualPricingFields: ManualFieldConfig[] = [
  { id: 'landedCost', label: 'Landed Cost', placeholder: '0.00', type: 'number' },
  { id: 'shippingCost', label: 'Shipping Cost', placeholder: '0.00', type: 'number' },
  { id: 'salePrice', label: 'Sale Price', placeholder: '0.00', type: 'number' },
];

const manualInventoryFields: ManualFieldConfig[] = [
  { id: 'purchaseQty', label: 'Purchase Qty', placeholder: '0', type: 'number' },
  { id: 'stockQty', label: 'Stock Qty', placeholder: '0', type: 'number' },
  { id: 'soldQty', label: 'Sold Qty', placeholder: '0', type: 'number' },
  { id: 'returnQty', label: 'Return Qty', placeholder: '0', type: 'number' },
];

const manualTabOptions = ['basic', 'type', 'identifiers', 'pricing', 'inventory'] as const;
type ManualTab = (typeof manualTabOptions)[number];

interface MarketplaceRow {
  platform: string;
  status: MarketplaceStatus['status'];
  soldQty: number;
  revenue: number;
  msrpPrice: number;
  currentSalePrice: number;
  priceAutoSync: boolean;
  currentStock: number;
  inventoryAutoSync: boolean;
}

interface ColumnConfig {
  id: ColumnId;
  label: string;
  visible: boolean;
  sortable?: boolean;
  align?: 'left' | 'right';
}

const columnTooltips: Record<ColumnId, string> = {
  image: 'Product image thumbnail',
  name: 'Full product name or title',
  tags: 'Product tags for categorization',
  offers: 'Active promotions and discounts for this product',
  productType: 'Product type: Single, Kit, or Variation',
  sku: 'Vendor Stock Keeping Unit - unique identifier from your vendor',
  brand: 'Product brand or manufacturer name',
  productId: 'Internal product identifier in your system',
  variationId: 'Variation ID for products with color/size variants',
  vendor: 'Name of the vendor or supplier',
  mpn: 'Manufacturer Part Number',
  asin: 'Amazon Standard Identification Number',
  fnsku: 'Fulfillment Network Stock Keeping Unit',
  gtin: 'Global Trade Item Number (includes UPC, EAN)',
  ean: 'European Article Number',
  isbn: 'International Standard Book Number',
  landedCost: 'Total cost including product, shipping, and handling',
  shippingCost: 'Cost to ship the product to customer',
  salePrice: 'Current selling price of the product',
  purchaseQty: 'Total quantity purchased from vendor',
  soldQty: 'Total quantity sold to customers',
  stockQty: 'Current inventory quantity in stock',
  returnQty: 'Number of units returned by customers',
  profitMargin: 'Gross profit as a percentage of sale price',
  profitAmount: 'Gross profit amount in dollars',
  velocity: 'Average units sold per day (last 30 days)',
  stockDays: 'Estimated days of stock remaining',
  restockStatus: 'Current restock status',
  suggestedRestockQty: 'Recommended quantity to reorder',
  marketplaces: 'Sales channels where the product is listed',
  actions: 'Available actions for this product',
};

interface ColumnPreferences {
  order: string[];
  visibility: Record<string, boolean>;
}

@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [CommonModule, FormsModule, CreateOfferDialogComponent],
  template: `
  <section class="w-full flex flex-col h-screen bg-background">
    <div class="flex min-h-[calc(100vh-140px)] flex-col gap-0 rounded-2xl border border-border bg-card shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-card/95 px-4 py-4">
      
      <div class="flex items-center gap-3">
        <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package w-5 h-5 text-primary"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"></path><path d="M12 22V12"></path><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"></path><path d="m7.5 4.27 9 5.15"></path></svg></div>  
        <div class="flex flex-col">
          <h2 class="text-lg font-semibold text-foreground">Products</h2>
          <p class="text-xs text-muted-foreground">
            {{ filteredProducts().length }} of {{ products.length }} products
          </p>
        </div>  
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-[34px] px-2 py-2 gap-2"
            title="Marketplace integrations"
            (click)="goToMarketplaceIntegrations()"
          >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-link2 w-4 h-4"><path d="M9 17H7A5 5 0 0 1 7 7h2"></path><path d="M15 7h2a5 5 0 1 1 0 10h-2"></path><line x1="8" x2="16" y1="12" y2="12"></line></svg>
            Marketplace Integrations
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-[34px] px-2 py-2 gap-2"
            title="Create offer"
            (click)="openBulkOffer()"
          >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tag w-4 h-4"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"></path><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"></circle></svg>
            Create Offer
            <span class="rounded-md bg-primary/20 px-2 py-0.5 text-[10px] text-primary">
              {{ offers.length }}
            </span>
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-[34px] px-2 py-2 gap-2"
            title="Offer analytics"
          >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chart-column w-4 h-4"><path d="M3 3v16a2 2 0 0 0 2 2h16"></path><path d="M18 17V9"></path><path d="M13 17V5"></path><path d="M8 17v-3"></path></svg>
            Offer Analytics
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-[34px] px-2 py-2 gap-2"
            title="Batch management"
          >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-history w-4 h-4"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M12 7v5l4 2"></path></svg>
            Batch Management
            <span class="rounded-md bg-primary/20 px-2 py-0.5 text-[10px] text-primary">
              9
            </span>
          </button>
        </div>
      </div>

      <div
        class="relative z-40 flex flex-col border-b border-border bg-card/95 px-3 py-3 shadow-sm backdrop-blur"
      >
        <div class="flex flex-wrap items-center gap-2">
          <details
            class="relative"
            data-dropdown="brand"
            [open]="openDropdownId === 'brand'"
          >
            <summary
              class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-[34px] px-2 py-2"
              title="Filter by brand"
              data-tooltip="Filter by brand"
              (click)="$event.preventDefault(); $event.stopPropagation(); toggleDropdown('brand')"
            >
              <span class="inline-flex h-5 w-5 items-center justify-center text-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building2 w-3.5 h-3.5 sm:w-4 sm:h-4"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"></path><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"></path><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"></path><path d="M10 6h4"></path><path d="M10 10h4"></path><path d="M10 14h4"></path><path d="M10 18h4"></path></svg>
              </span>
              
              <span class="text-muted-foreground hidden">
              Brand  ({{ filters.brand.length || 'all' }})
              </span>
              <span class="ml-1 inline-flex h-5 w-5 items-center justify-center text-foreground">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3" stroke-width="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </summary>
            <div
              data-dropdown-panel
              class="absolute z-50 dropdown-panel mt-2 max-h-64 w-56 overflow-y-auto rounded-lg border border-border bg-card/95 p-3 shadow-xl backdrop-blur"
            >
              <label
                *ngFor="let brand of brands"
                class="flex items-center gap-2 py-1 text-xs"
              >
                <input
                  type="checkbox"
                  class="h-4 w-4"
                  [checked]="filters.brand.includes(brand)"
                  (change)="toggleBrand(brand)"
                />
                <span>{{ brand }}</span>
              </label>
            </div>
          </details>

          <details
            class="relative"
            data-dropdown="marketplace"
            [open]="openDropdownId === 'marketplace'"
          >
            <summary
              class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-[34px] px-2 py-2 gap-1"
              title="Filter by marketplace"
              data-tooltip="Filter by marketplace"
              (click)="$event.preventDefault(); $event.stopPropagation(); toggleDropdown('marketplace')"
            >
              <span class="inline-flex h-5 w-5 items-center justify-center text-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-store w-3.5 h-3.5 sm:w-4 sm:h-4"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"></path><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"></path><path d="M2 7h20"></path><path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"></path></svg>
              </span>
              
              <span class="text-foreground hidden xs:inline">
             Marketplace   
             <!-- ({{ filters.marketplace.length || 'all' }}) -->
              </span>
              <span class="ml-1 inline-flex h-5 w-5 items-center justify-center text-foreground">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3" stroke-width="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </summary>
            <div
              data-dropdown-panel
              class="absolute z-50 dropdown-panel mt-2 max-h-64 w-56 overflow-y-auto rounded-lg border border-border bg-card/95 p-3 shadow-xl backdrop-blur"
            >
              <label
                *ngFor="let platform of marketplaces"
                class="flex items-center gap-2 py-1 text-xs capitalize"
              >
                <input
                  type="checkbox"
                  class="h-4 w-4"
                  [checked]="filters.marketplace.includes(platform)"
                  (change)="toggleMarketplace(platform)"
                />
                <span>{{ platform }}</span>
              </label>
            </div>
          </details>

          <details
            class="relative"
            data-dropdown="status"
            [open]="openDropdownId === 'status'">
            <summary
              class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-[34px] px-2 py-2"
              title="Filter by status"
              data-tooltip="Filter by status"
              (click)="$event.preventDefault(); $event.stopPropagation(); toggleDropdown('status')"
            >
              <span class="inline-flex h-5 w-5 items-center justify-center text-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-activity w-3.5 h-3.5 sm:w-4 sm:h-4"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"></path></svg>
              </span>
              
              <span class="text-muted-foreground hidden">
             Status   ({{ filters.status.length || 'all' }})
              </span>
              <span class="ml-1 inline-flex h-5 w-5 items-center justify-center text-foreground">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3" stroke-width="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </summary>
            <div
              data-dropdown-panel
              class="absolute z-50 dropdown-panel mt-2 w-48 rounded-lg border border-border bg-card/95 p-3 shadow-xl backdrop-blur"
            >
              <label
                *ngFor="let status of statusOptions"
                class="flex items-center gap-2 py-1 text-xs"
              >
                <input
                  type="checkbox"
                  class="h-4 w-4"
                  [checked]="filters.status.includes(status)"
                  (change)="toggleStatus(status)"
                />
                <span class="flex-1 capitalize">{{ statusLabel(status) }}</span>
                <span class="text-[10px] text-muted-foreground">
                  {{ statusCount(status) }}
                </span>
              </label>
            </div>
          </details>

          <details
            class="relative"
            data-dropdown="price"
            [open]="openDropdownId === 'price'"
          >
            <summary
              class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-[34px] px-2 py-2"
              title="Filter by price"
              data-tooltip="Filter by price"
              (click)="$event.preventDefault(); $event.stopPropagation(); toggleDropdown('price')"
            >
              <span class="inline-flex h-5 w-5 items-center justify-center text-foreground">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                  <path d="M12 1v22" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </span>
             
              <span class="text-muted-foreground hidden">
               Price  {{
                  filters.priceRange[0] > 0 || filters.priceRange[1] < 10000
                    ? '$' + filters.priceRange[0] + ' - ' + filters.priceRange[1]
                    : 'all'
                }}
              </span>
              <span class="ml-1 inline-flex h-5 w-5 items-center justify-center text-foreground">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3" stroke-width="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </summary>
            <div
              data-dropdown-panel
              class="absolute z-50 dropdown-panel mt-2 w-64 rounded-lg border border-border bg-card/95 p-3 shadow-xl backdrop-blur"
            >
              <div class="grid grid-cols-2 gap-3">
                <label class="text-xs text-muted-foreground">
                  Min
                  <input
                    type="number"
                    class="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-xs"
                    [ngModel]="filters.priceRange[0]"
                    (ngModelChange)="updateRange('priceRange', $event, filters.priceRange[1])"
                  />
                </label>
                <label class="text-xs text-muted-foreground">
                  Max
                  <input
                    type="number"
                    class="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-xs"
                    [ngModel]="filters.priceRange[1]"
                    (ngModelChange)="updateRange('priceRange', filters.priceRange[0], $event)"
                  />
                </label>
              </div>
            </div>
          </details>

          <details
            class="relative"
            data-dropdown="stock"
            [open]="openDropdownId === 'stock'"
          >
            <summary
              class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-[34px] px-2 py-2"
              title="Filter by stock"
              data-tooltip="Filter by stock"
              (click)="$event.preventDefault(); $event.stopPropagation(); toggleDropdown('stock')"
            >
              <span class="inline-flex h-5 w-5 items-center justify-center text-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-box w-3.5 h-3.5 sm:w-4 sm:h-4"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg>
              </span>
             
              <span class="text-muted-foreground hidden">
              Stock   {{
                  filters.stockRange[0] > 0 || filters.stockRange[1] < 10000
                    ? filters.stockRange[0] + ' - ' + filters.stockRange[1]
                    : 'all'
                }}
              </span>
              <span class="ml-1 inline-flex h-5 w-5 items-center justify-center text-foreground">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3" stroke-width="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </summary>
            <div
              data-dropdown-panel
              class="absolute z-50 dropdown-panel mt-2 w-64 rounded-lg border border-border bg-card/95 p-3 shadow-xl backdrop-blur"
            >
              <div class="grid grid-cols-2 gap-3">
                <label class="text-xs text-muted-foreground">
                  Min
                  <input
                    type="number"
                    class="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-xs"
                    [ngModel]="filters.stockRange[0]"
                    (ngModelChange)="updateRange('stockRange', $event, filters.stockRange[1])"
                  />
                </label>
                <label class="text-xs text-muted-foreground">
                  Max
                  <input
                    type="number"
                    class="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-xs"
                    [ngModel]="filters.stockRange[1]"
                    (ngModelChange)="updateRange('stockRange', filters.stockRange[0], $event)"
                  />
                </label>
              </div>
            </div>
          </details>

          <details
            class="relative"
            data-dropdown="sold"
            [open]="openDropdownId === 'sold'"
          >
            <summary
              class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 sm:h-8 px-2 sm:px-3 gap-1 sm:gap-2"
              title="Filter by sold units"
              data-tooltip="Filter by sold units"
              (click)="$event.preventDefault(); $event.stopPropagation(); toggleDropdown('sold')"
            >
              <span class="inline-flex h-5 w-5 items-center justify-center text-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trending-up w-3.5 h-3.5 sm:w-4 sm:h-4"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
              </span>
              
              <span class="hidden xs:inline text-muted-foreground">Sold</span>
              <span
                *ngIf="soldFilterActive()"
                class="ml-0.5 sm:ml-1 inline-flex items-center rounded-full border border-transparent bg-secondary text-secondary-foreground h-4 sm:h-5 px-1 sm:px-1.5 text-[10px] sm:text-xs"
              >
                <span class="hidden sm:inline">{{ soldFilterBadgeLabel() }}</span>
                <span class="sm:hidden">✓</span>
              </span>
              <span class="ml-1 inline-flex h-5 w-5 items-center justify-center text-foreground">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3" stroke-width="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </summary>
            <div
              data-dropdown-panel
              class="absolute z-50 dropdown-panel mt-2 w-72 rounded-lg border border-border bg-card/95 p-4 shadow-xl backdrop-blur"
            >
              <div class="space-y-4">
                <div>
                  <label class="text-xs text-muted-foreground mb-2 block font-medium">Time Period</label>
                  <div class="grid grid-cols-2 gap-2">
                    <button
                      *ngFor="let option of soldPeriods"
                      type="button"
                      class="h-8 text-xs rounded-md border"
                      [ngClass]="filters.soldPeriod === option.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/50'"
                      (click)="setSoldPeriod(option.value)"
                    >
                      {{ option.label }}
                    </button>
                    <button
                      type="button"
                      class="h-8 text-xs rounded-md border col-span-2"
                      [ngClass]="filters.soldPeriod === 'custom' ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/50'"
                      (click)="setSoldPeriod('custom')"
                    >
                      Custom
                    </button>
                  </div>
                </div>

                <div *ngIf="filters.soldPeriod === 'custom'" class="space-y-3 border-t border-border pt-3">
                  <label class="text-xs text-muted-foreground block font-medium">Date Range</label>
                  <div class="flex items-center gap-2">
                    <div class="flex-1">
                      <input
                        type="date"
                        class="h-9 w-full rounded-md border border-border bg-background px-2 text-xs"
                        [ngModel]="soldDateInput(filters.soldDateRange[0])"
                        (ngModelChange)="updateSoldDateRange(0, $event)"
                      />
                    </div>
                    <span class="text-muted-foreground">–</span>
                    <div class="flex-1">
                      <input
                        type="date"
                        class="h-9 w-full rounded-md border border-border bg-background px-2 text-xs"
                        [ngModel]="soldDateInput(filters.soldDateRange[1])"
                        (ngModelChange)="updateSoldDateRange(1, $event)"
                      />
                    </div>
                  </div>
                  <p class="text-xs text-muted-foreground italic">
                    Note: Custom date filtering requires sales date data
                  </p>
                </div>

                <div [ngClass]="filters.soldPeriod === 'custom' ? 'border-t border-border pt-3' : ''">
                  <label class="text-xs text-muted-foreground mb-2 block font-medium">Quantity Range</label>
                  <div class="flex items-center gap-2">
                    <div class="flex-1">
                      <label class="text-xs text-muted-foreground mb-1 block">From</label>
                      <input
                        type="number"
                        min="0"
                        class="h-9 w-full rounded-md border border-border bg-background px-2 text-xs"
                        [ngModel]="filters.soldRange[0]"
                        (ngModelChange)="updateRange('soldRange', $event, filters.soldRange[1])"
                        placeholder="0"
                      />
                    </div>
                    <span class="text-muted-foreground mt-5">–</span>
                    <div class="flex-1">
                      <label class="text-xs text-muted-foreground mb-1 block">To</label>
                      <input
                        type="number"
                        min="0"
                        class="h-9 w-full rounded-md border border-border bg-background px-2 text-xs"
                        [ngModel]="filters.soldRange[1]"
                        (ngModelChange)="updateRange('soldRange', filters.soldRange[0], $event)"
                        placeholder="10000"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </details>

          <details
            class="relative"
            data-dropdown="type"
            [open]="openDropdownId === 'type'"
          >
            <summary
              class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-[34px] px-2 py-2 gap-2"
              title="Filter by product type"
              data-tooltip="Filter by product type"
              (click)="$event.preventDefault(); $event.stopPropagation(); toggleDropdown('type')"
            >
              <span class="inline-flex h-5 w-5 items-center justify-center text-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-box w-3.5 h-3.5 sm:w-4 sm:h-4"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg>
              </span>
             
              <span class="text-foreground hidden xs:inline">
             Type    
             <span class="inline-flex items-center rounded-full border py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 ml-1 h-5 px-1.5">
             {{
                  filters.kitProduct === null
                    ? 'all'
                    : filters.kitProduct
                      ? 'kit'
                      : 'single'
                }}
                </span>
              </span>
              <span class="ml-1 inline-flex h-5 w-5 items-center justify-center text-foreground">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3" stroke-width="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </summary>
            <div
              data-dropdown-panel
              class="absolute z-50 dropdown-panel mt-2 w-48 rounded-lg border border-border bg-card/95 p-3 shadow-xl backdrop-blur"
            >
              <p class="text-[10px] uppercase tracking-wide text-muted-foreground">
                Product type
              </p>
              <div class="mt-2 grid gap-1">
                <label class="flex items-center gap-2 py-1 text-xs">
                  <input
                    type="checkbox"
                    name="kitFilter"
                    class="h-4 w-4 rounded-full border border-emerald-500/70 bg-background text-emerald-500 accent-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
                    [checked]="filters.kitProduct === null"
                    (change)="setKitFilter(null)"
                  />
                  <span>All products</span>
                </label>
                <label class="flex items-center gap-2 py-1 text-xs">
                  <input
                    type="checkbox"
                    name="kitFilter"
                    class="h-4 w-4 rounded-full border border-emerald-500/70 bg-background text-emerald-500 accent-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
                    [checked]="filters.kitProduct === true"
                    (change)="setKitFilter(true)"
                  />
                  <span>Kit products</span>
                </label>
                <label class="flex items-center gap-2 py-1 text-xs">
                  <input
                    type="checkbox"
                    name="kitFilter"
                    class="h-4 w-4 rounded-full border border-emerald-500/70 bg-background text-emerald-500 accent-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
                    [checked]="filters.kitProduct === false"
                    (change)="setKitFilter(false)"
                  />
                  <span>Single products</span>
                </label>
              </div>
              <div class="my-2 border-t border-border"></div>
              <p class="text-[10px] uppercase tracking-wide text-muted-foreground">
                Variations
              </p>
              <div class="mt-2 grid gap-1">
                <label class="flex items-center gap-2 py-1 text-xs">
                  <input
                    type="checkbox"
                    name="variationFilter"
                    class="h-4 w-4 rounded-full border border-emerald-500/70 bg-background text-emerald-500 accent-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
                    [checked]="filters.hasVariation === null"
                    (change)="setVariationFilter(null)"
                  />
                  <span>All products</span>
                </label>
                <label class="flex items-center gap-2 py-1 text-xs">
                  <input
                    type="checkbox"
                    name="variationFilter"
                    class="h-4 w-4 rounded-full border border-emerald-500/70 bg-background text-emerald-500 accent-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
                    [checked]="filters.hasVariation === true"
                    (change)="setVariationFilter(true)"
                  />
                  <span>With variations</span>
                </label>
                <label class="flex items-center gap-2 py-1 text-xs">
                  <input
                    type="checkbox"
                    name="variationFilter"
                    class="h-4 w-4 rounded-full border border-emerald-500/70 bg-background text-emerald-500 accent-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
                    [checked]="filters.hasVariation === false"
                    (change)="setVariationFilter(false)"
                  />
                  <span>No variations</span>
                </label>
              </div>
            </div>
          </details>

          <details
            class="relative"
            data-dropdown="tags"
            [open]="openDropdownId === 'tags'"
          >
            <summary
              class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-[34px] px-2 py-2 gap-1"
              title="Filter by tags"
              data-tooltip="Filter by tags"
              (click)="$event.preventDefault(); $event.stopPropagation(); toggleDropdown('tags')"
            >
              <span class="inline-flex h-5 w-5 items-center justify-center text-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tags w-4 h-4"><path d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19"></path><path d="M9.586 5.586A2 2 0 0 0 8.172 5H3a1 1 0 0 0-1 1v5.172a2 2 0 0 0 .586 1.414L8.29 18.29a2.426 2.426 0 0 0 3.42 0l3.58-3.58a2.426 2.426 0 0 0 0-3.42z"></path><circle cx="6.5" cy="9.5" r=".5" fill="currentColor"></circle></svg>
              </span>
             
              <span class="text-foreground hidden xs:inline">
             Tags    
             ({{ filters.tags.length || 'all' }})
              </span>
              <span class="ml-1 inline-flex h-5 w-5 items-center justify-center text-foreground">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3" stroke-width="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </summary>
            <div
              data-dropdown-panel
              class="absolute z-50 dropdown-panel mt-2 w-64 rounded-lg border border-border bg-card/95 p-3 shadow-xl backdrop-blur"
            >
              <div class="flex items-center justify-between border-b border-border/70 pb-2">
                <span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Filter by tags
                </span>
                <button
                  type="button"
                  class="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground rounded-md h-6 px-2 text-xs"
                  (click)="openTagForm()"
                >
                  <span class="inline-flex h-4 w-4 items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                      <path d="M12 5v14" />
                      <path d="M5 12h14" />
                    </svg>
                  </span>
                  New Tag
                </button>
              </div>
              <p *ngIf="tags.length === 0" class="mt-3 text-xs text-muted-foreground">
                No tags yet.
              </p>
              <div class="mt-3 space-y-1" *ngIf="tags.length > 0">
                <div
                  *ngFor="let tag of tags"
                  class="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition hover:bg-muted/60"
                >
                  <input
                    type="checkbox"
                    class="h-4 w-4 accent-emerald-500"
                    [checked]="filters.tags.includes(tag.id)"
                    (change)="toggleTagFilter(tag.id)"
                    [id]="'tag-filter-' + tag.id"
                  />
                  <label
                    class="flex flex-1 items-center gap-2 cursor-pointer"
                    [for]="'tag-filter-' + tag.id"
                  >
                    <span
                      class="h-2.5 w-2.5 rounded-full"
                      [style.backgroundColor]="tag.color"
                    ></span>
                    <span class="text-foreground">{{ tag.name }}</span>
                    <span class="text-muted-foreground">
                      ({{ tagUsageCount(tag.id) }})
                    </span>
                  </label>
                  <div class="ml-auto flex items-center gap-2 text-muted-foreground">
                    <button
                      type="button"
                      class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground rounded-md h-6 w-6 p-0"
                      title="Edit tag"
                      (click)="editTag(tag)"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil w-3 h-3"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path><path d="m15 5 4 4"></path></svg>
                    </button>
                    <button
                      type="button"
                      class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent rounded-md h-6 w-6 p-0 text-destructive hover:text-destructive"
                      title="Delete tag"
                      (click)="deleteTag(tag)"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2 w-3 h-3"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" x2="10" y1="11" y2="17"></line><line x1="14" x2="14" y1="11" y2="17"></line></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </details>

          <div class="ml-auto flex flex-1 items-center gap-2">
            <div class="relative w-full max-w-[420px] min-w-[200px]">
              <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.3-4.3" />
                </svg>
              </span>
              <input
                type="search"
                class="w-full rounded-md border border-border bg-background px-9 py-2 text-xs transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Search products..."
                [(ngModel)]="filters.search"
                (ngModelChange)="onFilterChange()"
              />
            </div>
            <button
              *ngIf="hasActiveFilters()"
              type="button"
              class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent h-9 rounded-md px-3 text-muted-foreground hover:text-foreground gap-1.5"
              (click)="resetFilters()"
              title="Reset filters"
            >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rotate-ccw w-3.5 h-3.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
              Reset
            </button>
            <details
              class="relative"
              data-dropdown="custom-filters"
              [open]="openDropdownId === 'custom-filters'"
            >
              <summary
                class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground px-2 py-2 h-[34px] gap-2"
                [ngClass]="{
                  'bg-primary text-primary-foreground border-primary': !!activeCustomFilterId
                }"
                title="Custom filters"
                data-tooltip="Custom filters"
                (click)="$event.preventDefault(); $event.stopPropagation(); toggleDropdown('custom-filters')"
              >
                <span class="inline-flex h-5 w-5 items-center justify-center text-foreground">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                    <path d="M3 4h18l-7 8v6l-4 2v-8L3 4z" />
                  </svg>
                </span>
                Custom Filters
              </summary>
              <div
                data-dropdown-panel
                class="absolute z-50 dropdown-panel mt-2 w-64 rounded-lg border border-border bg-card/95 p-3 shadow-xl backdrop-blur"
              >
                <button
                  type="button"
                  class="flex w-full items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                  (click)="openCustomFilterModal()"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                  </svg>
                  Create New Filter
                </button>
                <div class="mt-3">
                  <p class="text-[11px] font-semibold uppercase text-muted-foreground">Saved Filters</p>
                  <div *ngIf="customFilters.length === 0" class="mt-2 rounded-md border border-border bg-background/40 p-3 text-center text-xs text-muted-foreground">
                    <div class="mb-2 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                        <path d="M3 4h18l-7 8v6l-4 2v-8L3 4z" />
                      </svg>
                    </div>
                    No custom filters yet
                  </div>
                  <button
                    *ngFor="let filter of customFilters; let i = index"
                    type="button"
                    class="mt-2 flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-left text-xs hover:bg-muted"
                    [ngClass]="{
                      'border-primary bg-primary/10': activeCustomFilterId === filter.id
                    }"
                    (click)="toggleCustomFilter(filter.id)"
                  >
                    <div>
                      <p class="font-semibold">{{ filter.name }}</p>
                      <p class="text-[10px] text-muted-foreground">
                        {{ filter.rules.length }} criteria
                      </p>
                    </div>
                    <span class="flex items-center gap-2">
                      <button
                        type="button"
                        class="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted"
                        title="Edit"
                        (click)="editCustomFilter(filter); $event.stopPropagation()"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3" stroke-width="2">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        class="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border text-destructive hover:bg-muted"
                        title="Delete"
                        (click)="deleteCustomFilter(filter.id); $event.stopPropagation()"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3" stroke-width="2">
                          <path d="M3 6h18" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </span>
                  </button>
                </div>
              </div>
            </details>
            <details
              *ngIf="customFilters.length > 0"
              class="relative"
              data-dropdown="saved-filters"
              [open]="openDropdownId === 'saved-filters'"
            >
              <summary
                class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground px-2 py-2 h-[34px] gap-2"
                [ngClass]="{
                  'bg-primary text-primary-foreground border-primary': !!activeCustomFilterId
                }"
                title="Saved filters"
                data-tooltip="Saved filters"
                (click)="$event.preventDefault(); $event.stopPropagation(); toggleDropdown('saved-filters')"
              >
                <span class="inline-flex h-5 w-5 items-center justify-center text-foreground">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                </span>
                Saved
                <span class="rounded-full border border-border px-2 py-0.5 text-xs">
                  {{ customFilters.length }}
                </span>
              </summary>
              <div
                data-dropdown-panel
                class="absolute z-50 dropdown-panel mt-2 w-64 rounded-lg border border-border bg-card/95 p-3 shadow-xl backdrop-blur"
              >
                <p class="text-[11px] font-semibold uppercase text-muted-foreground">Saved Filters</p>
                <button
                  *ngFor="let filter of customFilters"
                  type="button"
                  class="mt-2 flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-left text-xs hover:bg-muted"
                  [ngClass]="{
                    'border-primary bg-primary/10': activeCustomFilterId === filter.id
                  }"
                  (click)="toggleCustomFilter(filter.id)"
                >
                  <div class="flex items-center gap-2">
                    <span class="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border">
                      <svg
                        *ngIf="activeCustomFilterId === filter.id"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        class="h-3 w-3 text-primary"
                        stroke-width="2"
                      >
                        <path d="M20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span class="font-semibold">{{ filter.name }}</span>
                    <span class="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                      {{ filter.rules.length }}
                    </span>
                  </div>
                </button>
              </div>
            </details>
            <details
              class="relative"
              data-dropdown="columns"
              [open]="openDropdownId === 'columns'"
            >
              <summary
                class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground px-2 py-2 h-[34px] gap-2"
                title="Columns"
                data-tooltip="Columns"
                (click)="$event.preventDefault(); $event.stopPropagation(); toggleDropdown('columns')"
              >
                <span class="inline-flex h-5 w-5 items-center justify-center text-foreground">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                    <rect x="3" y="4" width="7" height="16" />
                    <rect x="14" y="4" width="7" height="16" />
                  </svg>
                </span>
                Columns
                <span class="ml-1 inline-flex h-5 w-5 items-center justify-center text-foreground">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3" stroke-width="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </summary>
                <div
                  data-dropdown-panel
                  class="absolute right-0 z-50 dropdown-panel mt-2 w-56 rounded-lg border border-border bg-card/95 p-3 shadow-xl backdrop-blur"
                >
                <label
                  *ngFor="let column of columns"
                  class="flex items-center gap-2 py-1 text-xs"
                >
                  <input
                    type="checkbox"
                    class="h-4 w-4"
                    [checked]="column.visible"
                    (change)="toggleColumn(column.id)"
                  />
                  <span>{{ column.label }}</span>
                </label>
              </div>
            </details>
            <button
            type="button"
            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-2 py-2 gap-2"
            (click)="openCsvDialog('update')"
            title="Update via CSV"
            data-tooltip="Update via CSV"
          >
            <span class="inline-flex h-5 w-5 items-center justify-center text-foreground">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                <path d="M3 12a9 9 0 0 1 15.5-6.4" />
                <path d="M21 3v6h-6" />
                <path d="M21 12a9 9 0 0 1-15.5 6.4" />
                <path d="M3 21v-6h6" />
              </svg>
            </span>
            Update via CSV
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-2 py-2 gap-2"
            (click)="resetFilters()"
            title="Clear all filters"
            data-tooltip="Clear all filters"
          >
            <span class="inline-flex h-5 w-5 items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2 w-4 h-4"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" x2="10" y1="11" y2="17"></line><line x1="14" x2="14" y1="11" y2="17"></line></svg>
            </span>
            Clear all
          </button>
    
    <details
            class="relative"
            data-dropdown="create"
            [open]="openDropdownId === 'create'"
          >
            <summary
              class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-md px-3 gap-2"
              (click)="$event.preventDefault(); $event.stopPropagation(); toggleDropdown('create')"
            >
              <span class="inline-flex h-5 w-5 items-center justify-center text-primary-foreground">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              </span>
              Create Product
              <span class="ml-1 inline-flex h-5 w-5 items-center justify-center text-primary-foreground/80">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3" stroke-width="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </summary>
            <div
              data-dropdown-panel
              class="absolute z-50 dropdown-panel mt-2 w-56 rounded-lg border border-border bg-card/95 p-2 shadow-xl backdrop-blur"
            >
            <div class="px-2 py-1.5 text-sm font-semibold">Add New Products</div>
            <div role="separator" aria-orientation="horizontal" class="-mx-1 my-1 h-px bg-muted"></div>
              <button
                type="button"
                class="relative flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground gap-2 cursor-pointer"
                (click)="openManualDialog('single')"
              >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus w-4 h-4"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg> 
              Manual entry
              </button>
              <button
                type="button"
                class="relative flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground gap-2 cursor-pointer"
                (click)="openManualDialog('kit')"
              >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package w-4 h-4"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"></path><path d="M12 22V12"></path><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"></path><path d="m7.5 4.27 9 5.15"></path></svg>
                Create kit product
                
              </button>
              <button
                type="button"
                class="relative flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground gap-2 cursor-pointer"
                (click)="openCsvDialog('create')"
              >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-spreadsheet w-4 h-4"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M8 13h2"></path><path d="M14 13h2"></path><path d="M8 17h2"></path><path d="M14 17h2"></path></svg>
                CSV or Excel
                
              </button>
              <div class="my-2 border-t border-border"></div>
              <div class="px-2 py-1.5 font-semibold text-xs text-muted-foreground">Import from Marketplace</div>
              <button
                type="button"
                class="relative flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground gap-2 cursor-pointer"
                (click)="importMarketplace('Amazon')"
              >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shopping-cart w-4 h-4 text-orange-500"><circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path></svg> 
              Import from Amazon
              </button>
              <button
                type="button"
                class="relative flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground gap-2 cursor-pointer"
                (click)="importMarketplace('Shopify')"
              >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-store w-4 h-4 text-green-500"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"></path><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"></path><path d="M2 7h20"></path><path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"></path></svg>
                Import from Shopify
              </button>
            </div>
          </details>
          <!-- <label class="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            Rows
            <select
              class="rounded-md border border-border bg-background px-2 py-1 text-xs"
              [(ngModel)]="pageSize"
              (ngModelChange)="onPageSizeChange()"
            >
              <option [value]="10">10</option>
              <option [value]="25">25</option>
              <option [value]="50">50</option>
            </select>
          </label> -->
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
         
          
        </div>
      </div>

      <div
        *ngIf="tagFormOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in"
      >
        <div class="w-full max-w-lg rounded-xl bg-card p-5 shadow-xl animate-in zoom-in-95">
          <div class="flex items-center justify-between border-b border-border pb-4">
            <h3 class="text-lg font-semibold">
              {{ editingTag ? 'Edit tag' : 'Create tag' }}
            </h3>
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              (click)="cancelTagForm()"
              title="Close"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="mt-5 grid gap-5">
            <label class="grid gap-2 text-sm font-medium text-foreground">
              Tag Name
              <input
                type="text"
                class="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
                [(ngModel)]="tagName"
                placeholder="Enter tag name..."
                maxlength="30"
              />
            </label>

            <div>
              <p class="text-sm font-medium text-foreground">Color</p>
              <div class="mt-3 grid grid-cols-6 gap-3">
                <button
                  *ngFor="let color of tagColors"
                  type="button"
                  class="h-8 w-8 rounded-full border border-border"
                  [style.backgroundColor]="color.value"
                  [class.ring-2]="tagColor === color.value"
                  [class.ring-offset-2]="tagColor === color.value"
                  (click)="setTagColor(color.value)"
                  [attr.aria-label]="color.name"
                ></button>
              </div>
              <div class="mt-4 flex items-center gap-3">
                <span class="text-xs text-muted-foreground">Custom:</span>
                <input
                  type="color"
                  class="h-9 w-9 cursor-pointer rounded-md border border-border"
                  [value]="tagColor"
                  (input)="setTagColor($any($event.target).value)"
                />
                <input
                  type="text"
                  class="h-9 w-24 rounded-md border border-border bg-background px-2 text-xs text-foreground"
                  [value]="tagColor"
                  (input)="setTagColor($any($event.target).value)"
                />
              </div>
            </div>

            <div>
              <p class="text-sm font-medium text-foreground">Preview</p>
              <div class="mt-2">
                <span
                  class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white"
                  [style.backgroundColor]="tagColor || '#64748b'"
                >
                  {{ tagName || 'Tag Name' }}
                </span>
              </div>
            </div>
          </div>

          <div class="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              class="h-9 rounded-md border border-border px-4 text-sm text-foreground hover:bg-muted"
              (click)="cancelTagForm()"
            >
              Cancel
            </button>
            <button
              type="button"
              class="h-9 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              [disabled]="!tagName.trim() || !tagColor"
              (click)="saveTag()"
            >
              {{ editingTag ? 'Save Tag' : 'Create Tag' }}
            </button>
          </div>
        </div>
      </div>

      <div
        *ngIf="customFilterModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in"
        (click)="closeCustomFilterModal()"
      >
        <div
          class="w-full max-w-3xl rounded-2xl bg-card p-0 shadow-xl animate-in zoom-in-95"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-start justify-between border-b border-border px-6 py-5">
            <div class="flex items-start gap-3">
              <div class="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                  <path d="M3 4h18l-7 8v6l-4 2v-8L3 4z" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold">Create Custom Filter</h3>
                <p class="text-xs text-muted-foreground">
                  Build advanced filters to find specific products
                </p>
              </div>
            </div>
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              (click)="closeCustomFilterModal()"
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="max-h-[65vh] overflow-y-auto px-6 py-5">
            <div class="text-xs font-semibold text-muted-foreground">FILTER DETAILS</div>
            <p class="mt-1 text-xs text-muted-foreground">Give your filter a name</p>

            <label class="mt-3 block text-sm font-semibold text-foreground">
              Filter Name <span class="text-destructive">*</span>
            </label>
            <input
              type="text"
              class="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="e.g., Low Stock, Amazon Errors"
              [(ngModel)]="customFilterForm.name"
              [ngModelOptions]="{ standalone: true }"
            />

            <label class="mt-4 block text-sm font-semibold text-foreground">
              Description <span class="text-muted-foreground">(optional)</span>
            </label>
            <input
              type="text"
              class="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="What does this filter find?"
              [(ngModel)]="customFilterForm.description"
              [ngModelOptions]="{ standalone: true }"
            />

            <div class="mt-6 flex items-center justify-between">
              <div class="text-xs font-semibold text-muted-foreground">
                FILTER RULES
                <span class="ml-2 rounded-full border border-border px-2 py-0.5 text-xs">
                  {{ customFilterForm.rules.length }} rule{{ customFilterForm.rules.length === 1 ? '' : 's' }}
                </span>
              </div>
              <button
                type="button"
                class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                (click)="toggleCustomFilterMatchAll()"
              >
                Matches <span class="font-semibold">ALL</span> rules
              </button>
            </div>

            <div
              *ngFor="let rule of customFilterForm.rules; let i = index"
              class="mt-4 rounded-xl border border-border bg-background p-4"
            >
              <div class="flex items-center justify-between">
                <span class="rounded-md bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Rule {{ i + 1 }}
                </span>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
                  (click)="removeCustomFilterRule(i)"
                  [disabled]="customFilterForm.rules.length === 1"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                    <path d="M3 6h18" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Remove
                </button>
              </div>
              <div class="mt-4 grid gap-3 md:grid-cols-3">
                <div>
                  <label class="text-xs text-muted-foreground">Field</label>
                  <select
                    class="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    [(ngModel)]="rule.field"
                    [ngModelOptions]="{ standalone: true }"
                  >
                    <option *ngFor="let field of customFilterFields" [value]="field">
                      {{ field }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="text-xs text-muted-foreground">Condition</label>
                  <select
                    class="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    [(ngModel)]="rule.condition"
                    [ngModelOptions]="{ standalone: true }"
                  >
                    <option *ngFor="let condition of customFilterConditions" [value]="condition">
                      {{ condition }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="text-xs text-muted-foreground">Value</label>
                  <input
                    type="text"
                    class="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Enter value..."
                    [(ngModel)]="rule.value"
                    [ngModelOptions]="{ standalone: true }"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              class="mt-4 w-full rounded-xl border border-dashed border-border bg-background py-3 text-sm font-semibold text-muted-foreground hover:bg-muted"
              (click)="addCustomFilterRule()"
            >
              + Add Another Rule
            </button>
            <p class="mt-4 text-xs text-muted-foreground">Saved locally in your browser</p>
          </div>

          <div class="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
            <button
              type="button"
              class="rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              (click)="closeCustomFilterModal()"
            >
              Cancel
            </button>
            <button
              type="button"
              class="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
              [disabled]="!customFilterForm.name.trim()"
              (click)="saveCustomFilter()"
            >
              Save Filter
            </button>
          </div>
        </div>
      </div>

      <div
        *ngIf="manualDialogOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in"
      >
        <div class="flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-xl bg-card shadow-xl animate-in zoom-in-95">
          <div class="border-b border-border px-6 py-4">
            <h3 class="text-lg font-semibold">Create New Product</h3>
            <p class="text-xs text-muted-foreground">
              Enter product details manually. Required fields are marked with an asterisk.
            </p>
          </div>

          <div class="px-6 pt-4">
            <div class="grid w-full grid-cols-5 gap-2 rounded-lg border border-border bg-muted/30 p-1">
              <button
                *ngFor="let tab of manualTabs"
                type="button"
                class="rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground transition hover:bg-background hover:text-foreground"
                [class.bg-background]="manualTab === tab"
                [class.text-foreground]="manualTab === tab"
                (click)="manualTab = tab"
              >
                {{ manualTabLabel(tab) }}
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto px-6 py-4">
            <div *ngIf="manualTab === 'basic'" class="grid gap-4">
              <label *ngFor="let field of manualBasicFields" class="grid gap-2">
                <span class="flex items-center gap-1 text-sm font-medium">
                  {{ field.label }} <span *ngIf="field.required" class="text-destructive">*</span>
                </span>
                <input
                  [type]="field.type || 'text'"
                  class="h-9 rounded-md border border-border bg-background px-3 text-sm"
                  [placeholder]="field.placeholder"
                  [(ngModel)]="manualForm[field.id]"
                />
              </label>
            </div>

            <div *ngIf="manualTab === 'type'" class="space-y-6">
              <div class="space-y-4">
                <p class="text-base font-semibold">Product Type</p>
                <div class="grid gap-3">
                  <div
                    class="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    (click)="manualProductType = 'single'"
                  >
                    <input
                      type="radio"
                      name="manualProductType"
                      class="h-4 w-4"
                      [checked]="manualProductType === 'single'"
                      (change)="manualProductType = 'single'"
                    />
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-5 w-5 text-muted-foreground" stroke-width="2">
                          <path d="M3 7l9-4 9 4-9 4-9-4z" />
                          <path d="M3 7v10l9 4 9-4V7" />
                        </svg>
                        <span class="font-medium">Single Product</span>
                      </div>
                      <p class="mt-1 text-sm text-muted-foreground">
                        A standalone product that is sold individually
                      </p>
                    </div>
                  </div>

                  <div
                    class="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    (click)="manualProductType = 'kit'"
                  >
                    <input
                      type="radio"
                      name="manualProductType"
                      class="h-4 w-4"
                      [checked]="manualProductType === 'kit'"
                      (change)="manualProductType = 'kit'"
                    />
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-5 w-5 text-primary" stroke-width="2">
                          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                          <path d="m3.3 7 8.7 5 8.7-5" />
                          <path d="M12 22V12" />
                        </svg>
                        <span class="font-medium">Kit Product</span>
                        <span class="rounded-full bg-secondary px-2 py-0.5 text-[10px]">Bundle</span>
                      </div>
                      <p class="mt-1 text-sm text-muted-foreground">
                        A bundle of multiple products sold together as one unit
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center space-x-3 rounded-lg border p-4 opacity-60">
                    <input type="radio" name="manualProductType" class="h-4 w-4" disabled />
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-5 w-5 text-blue-500" stroke-width="2">
                          <path d="M12 2l9 5-9 5-9-5 9-5z" />
                          <path d="M3 12l9 5 9-5" />
                          <path d="M3 17l9 5 9-5" />
                        </svg>
                        <span class="font-medium">Variation Product</span>
                        <span class="rounded-full border px-2 py-0.5 text-[10px]">Auto-created</span>
                      </div>
                      <p class="mt-1 text-sm text-muted-foreground">
                        Variations are created automatically when adding product options
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div *ngIf="manualProductType === 'kit'" class="space-y-4 border-t pt-4">
                <div>
                  <p class="text-base font-semibold">Kit Mapping</p>
                  <p class="text-sm text-muted-foreground">
                    Add products to include in this kit
                  </p>
                </div>
                <div class="space-y-3 rounded-lg border bg-muted/30 p-4">
                  <div class="grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                    <label class="text-xs text-muted-foreground">
                      Product
                      <select
                        class="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-xs"
                        [(ngModel)]="kitProductId"
                      >
                        <option value="">Select product</option>
                        <option *ngFor="let product of products" [value]="product.id">
                          {{ product.name }}
                        </option>
                      </select>
                    </label>
                    <label class="text-xs text-muted-foreground">
                      Qty
                      <input
                        type="number"
                        class="mt-1 w-20 rounded-md border border-border bg-background px-2 py-1 text-xs"
                        [(ngModel)]="kitQuantity"
                        min="1"
                      />
                    </label>
                    <button
                      type="button"
                      class="rounded-md border border-border px-3 py-1 text-xs"
                      (click)="addKitComponent()"
                    >
                      Add Products
                    </button>
                  </div>
                  <div *ngIf="kitComponents.length > 0" class="space-y-2">
                    <div class="text-sm font-medium">
                      {{ kitComponents.length }} product{{ kitComponents.length !== 1 ? 's' : '' }} in kit
                    </div>
                    <div class="space-y-1">
                      <div
                        *ngFor="let component of kitComponents; let i = index"
                        class="flex items-center justify-between rounded-md border border-border px-2 py-1 text-xs"
                      >
                        <span>
                          • {{ kitProductName(component.productId) }} ×
                          <span class="rounded-full bg-secondary px-2 py-0.5 text-[10px]">
                            {{ component.quantity }}
                          </span>
                        </span>
                        <button
                          type="button"
                          class="text-destructive"
                          (click)="removeKitComponent(i)"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div *ngIf="manualTab === 'identifiers'" class="grid gap-4">
              <label *ngFor="let field of manualIdentifierFields" class="grid gap-2">
                <span class="text-sm font-medium text-foreground">{{ field.label }}</span>
                <input
                  [type]="field.type || 'text'"
                  class="h-9 rounded-md border border-border bg-background px-3 text-sm"
                  [placeholder]="field.placeholder"
                  [(ngModel)]="manualForm[field.id]"
                />
              </label>
            </div>

            <div *ngIf="manualTab === 'pricing'" class="grid gap-4">
              <label *ngFor="let field of manualPricingFields" class="grid gap-2">
                <span class="text-sm font-medium text-foreground">{{ field.label }}</span>
                <input
                  [type]="field.type || 'text'"
                  class="h-9 rounded-md border border-border bg-background px-3 text-sm"
                  [placeholder]="field.placeholder"
                  [(ngModel)]="manualForm[field.id]"
                />
              </label>
            </div>

            <div *ngIf="manualTab === 'inventory'" class="grid gap-4">
              <label *ngFor="let field of manualInventoryFields" class="grid gap-2">
                <span class="text-sm font-medium text-foreground">{{ field.label }}</span>
                <input
                  [type]="field.type || 'text'"
                  class="h-9 rounded-md border border-border bg-background px-3 text-sm"
                  [placeholder]="field.placeholder"
                  [(ngModel)]="manualForm[field.id]"
                />
              </label>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
            <button
              type="button"
              class="h-9 rounded-md border border-border px-4 text-sm"
              (click)="closeManualDialog()"
            >
              Cancel
            </button>
            <button
              type="button"
              class="h-9 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
              (click)="saveManualProduct()"
            >
              Save product
            </button>
          </div>
        </div>
      </div>

      <div
        *ngIf="csvDialogOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in"
      >
        <div class="w-full max-w-3xl rounded-xl bg-card p-4 shadow-xl animate-in zoom-in-95">
          <div class="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 class="text-lg font-semibold">
                {{ csvMode === 'create' ? 'Import Products from CSV/Excel' : 'Update Products from CSV/Excel' }}
              </h3>
              <p class="text-xs text-muted-foreground">
                <ng-container *ngIf="csvStep === 'upload'; else csvMappingHint">
                  {{
                    csvMode === 'update'
                      ? 'Upload a CSV or Excel file to update existing products.'
                      : 'Upload a CSV or Excel file to create new products.'
                  }}
                </ng-container>
                <ng-template #csvMappingHint>
                  Map CSV columns to product fields.
                </ng-template>
              </p>
            </div>
            <button
              type="button"
              class="rounded-md border border-border px-3 py-1 text-xs"
              (click)="closeCsvDialog()"
            >
              Close
            </button>
          </div>

          <div *ngIf="csvStep === 'upload'" class="mt-4 space-y-4">
            <div class="rounded-xl border border-border bg-muted/30 p-4">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p class="text-sm font-semibold">Need a template?</p>
                  <p class="text-xs text-muted-foreground">
                    Download a sample CSV file with the correct column headers and example data.
                  </p>
                </div>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold"
                  (click)="downloadCsvTemplate()"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                    <path d="M12 3v12" />
                    <path d="m7 10 5 5 5-5" />
                    <path d="M5 21h14" />
                  </svg>
                  Download Template
                </button>
              </div>
            </div>

            <div class="rounded-xl border border-border bg-card/60 p-4">
              <div>
                <p class="text-sm font-semibold">
                  {{ csvMode === 'update' ? 'Match products by (select one or more):' : 'Identifiers in file' }}
                </p>
                <p class="text-xs text-muted-foreground">
                  Products will be matched using any of the selected identifiers
                </p>
              </div>
              <div class="mt-4 grid gap-3 sm:grid-cols-2">
                <label
                  *ngFor="let field of csvIdentifierOptions"
                  class="group flex items-start gap-3 rounded-lg border border-border bg-background/60 p-3 text-xs transition hover:border-muted-foreground/60"
                  [ngClass]="{
                    'border-emerald-500/60 bg-emerald-500/10': csvMatchFields.includes(field.id)
                  }"
                >
                  <input
                    type="checkbox"
                    class="mt-0.5 h-4 w-4 rounded border-border text-emerald-500 focus:ring-emerald-500/40"
                    [checked]="csvMatchFields.includes(field.id)"
                    (change)="toggleCsvMatchField(field.id)"
                  />
                  <span>
                    <span class="block font-semibold text-foreground">{{ field.label }}</span>
                    <span class="text-[10px] text-muted-foreground">{{ field.description }}</span>
                  </span>
                </label>
              </div>
            </div>

            <div class="rounded-xl border border-dashed border-border bg-background/40 p-6 text-center">
              <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted/40">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-6 w-6" stroke-width="2">
                  <path d="M12 16v-8" />
                  <path d="M8 12h8" />
                  <path d="M4 6a2 2 0 0 1 2-2h9l5 5v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
                </svg>
              </div>
              <p class="mt-3 text-xs text-muted-foreground">
                Drag and drop a CSV or Excel file, or click to browse
              </p>
              <button
                type="button"
                class="mt-4 inline-flex items-center gap-2 rounded-md bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-600"
                (click)="csvFileInput.click()"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                  <path d="M12 16v-8" />
                  <path d="M8 12h8" />
                  <path d="M4 6a2 2 0 0 1 2-2h9l5 5v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
                </svg>
                Select File
              </button>
              <p class="mt-3 text-[10px] text-muted-foreground">Supported formats: CSV, XLSX, XLS</p>
              <p *ngIf="csvFileName" class="mt-2 text-xs text-muted-foreground">
                {{ csvFileName }}
              </p>
              <p *ngIf="csvError" class="mt-2 text-xs text-destructive">{{ csvError }}</p>
              <input
                #csvFileInput
                type="file"
                accept=".csv,.xlsx,.xls"
                class="hidden"
                (change)="onCsvFileChange($event)"
              />
            </div>
          </div>

          <div *ngIf="csvStep === 'mapping'" class="mt-4 max-h-[55vh] overflow-y-auto pr-2">
            <div class="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs">
              <span>{{ csvFileName }}</span>
              <span class="text-muted-foreground">{{ csvRows.length }} rows</span>
            </div>
            <div class="mt-3 space-y-2">
              <div
                *ngFor="let field of csvFields"
                class="flex items-center gap-3"
              >
                <div class="w-40 text-xs font-medium">
                  {{ field.label }}
                  <span *ngIf="csvFieldRequired(field.id)" class="text-destructive">*</span>
                </div>
                <select
                  class="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs"
                  [ngModel]="csvFieldMapping[field.id] || '_skip'"
                  (ngModelChange)="setCsvFieldMapping(field.id, $event)"
                >
                  <option value="_skip">Skip</option>
                  <option *ngFor="let header of csvHeaders" [value]="header">
                    {{ header }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div class="mt-4 flex items-center justify-end gap-2 border-t border-border pt-3">
            <button
              type="button"
              class="rounded-md border border-border px-3 py-1 text-xs"
              (click)="csvStep === 'mapping' ? resetCsvDialog() : closeCsvDialog()"
            >
              {{ csvStep === 'mapping' ? 'Back' : 'Cancel' }}
            </button>
            <button
              *ngIf="csvStep === 'mapping'"
              type="button"
              class="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
              [disabled]="!csvCanImport"
              (click)="importCsvData()"
            >
              {{ csvMode === 'create' ? 'Create products' : 'Update products' }}
            </button>
          </div>
        </div>
      </div>

      <div
        *ngIf="productDialogOpen && selectedProduct"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in"
      >
        <div class="flex w-full max-w-[98vw] flex-col overflow-hidden rounded-xl bg-card shadow-xl animate-in zoom-in-95 md:max-w-5xl lg:max-w-6xl max-h-[95vh]">
          <div class="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
            <div class="flex items-center gap-4">
              <img
                [src]="selectedProduct.image"
                [alt]="selectedProduct.name"
                class="h-16 w-16 rounded-lg border border-border bg-muted object-cover"
              />
              <div>
                <h3 class="text-xl font-semibold">
                  {{ selectedProduct.name }}
                </h3>
                <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span class="inline-flex items-center gap-1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                      <path d="M12 2v20" />
                      <path d="M5 7h14" />
                    </svg>
                    {{ selectedProduct.productId }}
                  </span>
                  <span
                    *ngIf="selectedProduct.variationId"
                    class="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px]"
                  >
                    Variation: {{ selectedProduct.variationId }}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              class="rounded-md border border-border px-3 py-1 text-xs"
              (click)="closeProductDialog()"
            >
              Close
            </button>
          </div>

          <div class="border-b border-border px-6 pt-3">
            <div class="flex flex-wrap gap-2 pb-3 text-xs">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs"
                [class.bg-muted]="productDialogTab === 'overview'"
                (click)="productDialogTab = 'overview'"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                  <path d="M3 12h18" />
                  <path d="M12 3v18" />
                </svg>
                Overview
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs"
                [class.bg-muted]="productDialogTab === 'inventory'"
                (click)="productDialogTab = 'inventory'"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                  <path d="M3 7l9-4 9 4-9 4-9-4z" />
                  <path d="M3 7v10l9 4 9-4V7" />
                </svg>
                Inventory
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs"
                [class.bg-muted]="productDialogTab === 'marketplaces'"
                (click)="productDialogTab = 'marketplaces'"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                  <path d="M3 9l2-5h14l2 5" />
                  <path d="M5 9v11h14V9" />
                  <path d="M9 20V9h6v11" />
                </svg>
                Marketplaces
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto px-6 py-4">
            <div *ngIf="productDialogTab === 'overview'" class="grid gap-6 lg:grid-cols-2">
              <div class="space-y-4">
                <h4 class="text-sm font-semibold text-foreground">Basic Information</h4>
                <div class="grid gap-4 rounded-lg bg-muted/30 p-4">
                  <label class="grid gap-1 text-xs text-muted-foreground">
                    Product name
                    <input
                      type="text"
                      class="rounded-md border border-border bg-background px-2 py-1 text-sm"
                      [(ngModel)]="productDraft.name"
                    />
                  </label>
                  <div class="grid gap-4 sm:grid-cols-2">
                    <label class="grid gap-1 text-xs text-muted-foreground">
                      Brand
                      <input
                        type="text"
                        class="rounded-md border border-border bg-background px-2 py-1 text-sm"
                        [(ngModel)]="productDraft.brand"
                      />
                    </label>
                    <label class="grid gap-1 text-xs text-muted-foreground">
                      Vendor
                      <input
                        type="text"
                        class="rounded-md border border-border bg-background px-2 py-1 text-sm"
                        [(ngModel)]="productDraft.vendorName"
                      />
                    </label>
                  </div>
                  <label class="grid gap-1 text-xs text-muted-foreground">
                    Sale price
                    <input
                      type="number"
                      class="rounded-md border border-border bg-background px-2 py-1 text-sm"
                      [(ngModel)]="productDraft.salePrice"
                    />
                  </label>
                </div>
              </div>
              <div class="space-y-4">
                <h4 class="text-sm font-semibold text-foreground">Quick Stats</h4>
                <div class="grid grid-cols-2 gap-3">
                  <div class="rounded-lg bg-muted/30 p-4">
                    <p class="text-xs text-muted-foreground">Sale Price</p>
                    <p class="text-lg font-semibold">{{ formatCurrency(selectedProduct.salePrice) }}</p>
                  </div>
                  <div class="rounded-lg bg-muted/30 p-4">
                    <p class="text-xs text-muted-foreground">Profit Margin</p>
                    <p class="text-lg font-semibold">{{ selectedProduct.grossProfitPercent }}%</p>
                  </div>
                  <div class="rounded-lg bg-muted/30 p-4">
                    <p class="text-xs text-muted-foreground">In Stock</p>
                    <p class="text-lg font-semibold">{{ selectedProduct.stockQty }}</p>
                  </div>
                  <div class="rounded-lg bg-muted/30 p-4">
                    <p class="text-xs text-muted-foreground">Total Sold</p>
                    <p class="text-lg font-semibold">{{ selectedProduct.soldQty }}</p>
                  </div>
                </div>
                <div class="rounded-lg bg-muted/30 p-4">
                  <p class="text-xs font-medium text-muted-foreground">Marketplace Status</p>
                  <div class="mt-2 flex flex-wrap items-center gap-3 text-xs">
                    <span class="inline-flex items-center gap-1">
                      <span class="h-2 w-2 rounded-full bg-emerald-400"></span>
                      {{ marketplaceCount(selectedProduct, 'live') }} Live
                    </span>
                    <span class="inline-flex items-center gap-1">
                      <span class="h-2 w-2 rounded-full bg-muted-foreground"></span>
                      {{ marketplaceCount(selectedProduct, 'inactive') }} Inactive
                    </span>
                    <span class="inline-flex items-center gap-1 text-destructive">
                      <span class="h-2 w-2 rounded-full bg-destructive"></span>
                      {{ marketplaceCount(selectedProduct, 'error') }} Error
                    </span>
                    <span class="inline-flex items-center gap-1 text-muted-foreground">
                      {{ marketplaceCount(selectedProduct, 'not_listed') }} Not Listed
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div *ngIf="productDialogTab === 'inventory'" class="grid gap-6 lg:grid-cols-2">
              <div class="space-y-4">
                <h4 class="text-sm font-semibold text-foreground">Inventory</h4>
                <div class="grid gap-4 rounded-lg bg-muted/30 p-4 sm:grid-cols-2">
                  <label class="grid gap-1 text-xs text-muted-foreground">
                    Stock qty
                    <input
                      type="number"
                      class="rounded-md border border-border bg-background px-2 py-1 text-sm"
                      [(ngModel)]="productDraft.stockQty"
                    />
                  </label>
                  <label class="grid gap-1 text-xs text-muted-foreground">
                    Purchased qty
                    <input
                      type="number"
                      class="rounded-md border border-border bg-background px-2 py-1 text-sm"
                      [(ngModel)]="productDraft.purchaseQty"
                    />
                  </label>
                  <label class="grid gap-1 text-xs text-muted-foreground">
                    Sold qty
                    <input
                      type="number"
                      class="rounded-md border border-border bg-background px-2 py-1 text-sm"
                      [(ngModel)]="productDraft.soldQty"
                    />
                  </label>
                  <label class="grid gap-1 text-xs text-muted-foreground">
                    Return qty
                    <input
                      type="number"
                      class="rounded-md border border-border bg-background px-2 py-1 text-sm"
                      [(ngModel)]="productDraft.returnQty"
                    />
                  </label>
                </div>
              </div>
              <div class="space-y-4">
                <h4 class="text-sm font-semibold text-foreground">Pricing</h4>
                <div class="grid gap-4 rounded-lg bg-muted/30 p-4 sm:grid-cols-2">
                  <label class="grid gap-1 text-xs text-muted-foreground">
                    Sale price
                    <input
                      type="number"
                      class="rounded-md border border-border bg-background px-2 py-1 text-sm"
                      [(ngModel)]="productDraft.salePrice"
                    />
                  </label>
                  <label class="grid gap-1 text-xs text-muted-foreground">
                    Landed cost
                    <input
                      type="number"
                      class="rounded-md border border-border bg-background px-2 py-1 text-sm"
                      [(ngModel)]="productDraft.landedCost"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div *ngIf="productDialogTab === 'marketplaces'" class="space-y-3">
              <div class="flex items-center justify-between">
                <p class="text-xs text-muted-foreground">
                  Listing status per marketplace.
                </p>
                <button
                  type="button"
                  class="rounded-md border border-border px-3 py-1 text-xs"
                  (click)="openMarketplaceDialog(selectedProduct)"
                >
                  Manage marketplaces
                </button>
              </div>
              <div class="rounded-lg bg-muted/30 p-4">
                <div class="grid gap-2">
                  <div
                    *ngFor="let marketplace of selectedProduct.marketplaces"
                    class="flex items-center justify-between rounded-md border border-border px-3 py-2 text-xs"
                  >
                    <span class="capitalize">{{ marketplace.platform }}</span>
                    <span class="text-muted-foreground">{{ marketplace.status }}</span>
                  </div>
                  <p
                    *ngIf="selectedProduct.marketplaces.length === 0"
                    class="text-xs text-muted-foreground"
                  >
                    No active marketplaces.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
            <button
              type="button"
              class="rounded-md border border-border px-3 py-1 text-xs"
              (click)="closeProductDialog()"
            >
              Cancel
            </button>
            <button
              type="button"
              class="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
              (click)="saveProductDialog()"
            >
              Save changes
            </button>
          </div>
        </div>
      </div>

      <div
        *ngIf="marketplaceDialogOpen && marketplaceDialogProduct"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in"
      >
        <div class="flex w-full max-w-[98vw] flex-col overflow-hidden rounded-xl bg-slate-900 text-slate-100 shadow-xl animate-in zoom-in-95 md:max-w-5xl lg:max-w-6xl max-h-[95vh]">
          <div class="flex flex-wrap items-center gap-6 border-b border-slate-700 bg-slate-800 px-6 py-4">
            <div class="flex items-center gap-2">
              <div class="rounded-lg bg-slate-700 p-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4 text-slate-300" stroke-width="2">
                  <path d="M3 7l9-4 9 4-9 4-9-4z" />
                  <path d="M3 7v10l9 4 9-4V7" />
                </svg>
              </div>
              <div>
                <p class="text-[10px] uppercase text-slate-400">SKU</p>
                <p class="text-sm font-medium">{{ marketplaceDialogProduct.vendorSku }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="rounded-lg bg-slate-700 p-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4 text-slate-300" stroke-width="2">
                  <path d="M12 2v20" />
                  <path d="M5 7h14" />
                </svg>
              </div>
              <div>
                <p class="text-[10px] uppercase text-slate-400">Product ID</p>
                <p class="text-sm font-medium">{{ marketplaceDialogProduct.productId }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="rounded-lg bg-slate-700 p-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4 text-emerald-400" stroke-width="2">
                  <path d="M12 1v22" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div>
                <p class="text-[10px] uppercase text-slate-400">Sale Price</p>
                <p class="text-sm font-medium text-emerald-400">
                  {{ formatCurrency(marketplaceDialogProduct.salePrice) }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="rounded-lg bg-slate-700 p-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4 text-slate-300" stroke-width="2">
                  <path d="M3 3h18v4H3z" />
                  <path d="M3 7h18v14H3z" />
                </svg>
              </div>
              <div>
                <p class="text-[10px] uppercase text-slate-400">Stock</p>
                <p class="text-sm font-medium">{{ marketplaceDialogProduct.stockQty }} units</p>
              </div>
            </div>
            <div class="ml-auto flex items-center gap-2">
              <span class="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-400">
                {{ marketplaceRowCount('live') }} Live
              </span>
              <span
                *ngIf="marketplaceRowCount('inactive') > 0"
                class="rounded-full bg-slate-600/60 px-3 py-1 text-xs text-slate-200"
              >
                {{ marketplaceRowCount('inactive') }} Inactive
              </span>
              <span
                *ngIf="marketplaceRowCount('not_listed') > 0"
                class="rounded-full border border-slate-500 border-dashed px-3 py-1 text-xs text-slate-300"
              >
                {{ marketplaceRowCount('not_listed') }} Not Listed
              </span>
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-600 text-slate-200 hover:bg-slate-700"
                (click)="closeMarketplaceDialog()"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                  <path d="M6 6l12 12" />
                  <path d="M18 6l-12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div class="flex-1 flex flex-col min-h-0">
            <div class="px-6 border-b border-slate-700 flex-shrink-0">
              <div class="flex items-center gap-6">
                <button
                  type="button"
                  class="flex items-center gap-2 border-b-2 px-0 pb-3 pt-3 text-sm text-slate-400 transition"
                  [ngClass]="marketplaceDialogTab === 'listings' ? 'border-emerald-500 text-emerald-400' : 'border-transparent'"
                  (click)="marketplaceDialogTab = 'listings'"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                    <path d="M3 3h18v4H3z" />
                    <path d="M3 7h18v14H3z" />
                  </svg>
                  Listings
                  <span class="rounded-md bg-slate-700 px-2 py-0.5 text-[10px] text-slate-300">
                    {{ marketplaceRowCount('live') + marketplaceRowCount('inactive') }}
                  </span>
                </button>
                <button
                  type="button"
                  class="flex items-center gap-2 border-b-2 px-0 pb-3 pt-3 text-sm text-slate-400 transition"
                  [ngClass]="marketplaceDialogTab === 'offers' ? 'border-purple-500 text-purple-400' : 'border-transparent'"
                  (click)="marketplaceDialogTab = 'offers'"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                    <path d="M20.59 13.41 12 22 3 13.41a2 2 0 0 1 0-2.82L12 2l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <circle cx="7" cy="7" r="1.5"></circle>
                  </svg>
                  Offers
                  <span
                    *ngIf="marketplaceDialogOffers().length > 0"
                    class="rounded-md bg-purple-500/20 px-2 py-0.5 text-[10px] text-purple-400"
                  >
                    {{ marketplaceDialogOffers().length }}
                  </span>
                </button>
              </div>
            </div>

            <div class="flex-1 min-h-0">
              <div *ngIf="marketplaceDialogTab === 'listings'" class="flex flex-col min-h-0">
                <div class="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
                  <div class="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
                    <div class="grid grid-cols-[200px_60px_80px_80px_60px_90px_70px_60px_70px_100px] gap-2 px-4 pr-6 py-3">
                      <div class="text-xs font-semibold uppercase tracking-wide text-slate-400" data-tooltip="Platform where product is listed">
                        Marketplace
                      </div>
                      <div class="text-xs font-semibold uppercase tracking-wide text-slate-400 text-center" data-tooltip="Total units sold on this marketplace">
                        Sold
                      </div>
                      <div class="text-xs font-semibold uppercase tracking-wide text-slate-400 text-center" data-tooltip="Total revenue from this marketplace">
                        Revenue
                      </div>
                      <div class="text-xs font-semibold uppercase tracking-wide text-slate-400 text-center" data-tooltip="Manufacturer's Suggested Retail Price">
                        MSRP
                      </div>
                      <div class="text-xs font-semibold uppercase tracking-wide text-slate-400 text-center" data-tooltip="Discount percentage from MSRP">
                        Discount
                      </div>
                      <div class="text-xs font-semibold uppercase tracking-wide text-slate-400 text-center" data-tooltip="Current selling price">
                        Sale Price
                      </div>
                      <div class="text-xs font-semibold uppercase tracking-wide text-slate-400 text-center" data-tooltip="Auto-sync price changes">
                        Price Sync
                      </div>
                      <div class="text-xs font-semibold uppercase tracking-wide text-slate-400 text-center" data-tooltip="Current stock level">
                        Stock
                      </div>
                      <div class="text-xs font-semibold uppercase tracking-wide text-slate-400 text-center" data-tooltip="Auto-sync inventory">
                        Inv Sync
                      </div>
                      <div class="text-xs font-semibold uppercase tracking-wide text-slate-400 text-center" data-tooltip="Unlink or remove from marketplace">
                        Actions
                      </div>
                    </div>
                  </div>
                  <div class="divide-y divide-slate-700/50">
                    <div
                      *ngFor="let row of marketplaceRows"
                      class="grid grid-cols-[200px_60px_80px_80px_60px_90px_70px_60px_70px_100px] gap-2 px-4 pr-6 py-3 items-center hover:bg-slate-800/50 transition-colors"
                      [ngClass]="row.status === 'not_listed' ? 'opacity-60' : ''"
                    >
                      <div class="flex items-center gap-3">
                        <input
                          *ngIf="marketplaceCanPublish(row.status)"
                          type="checkbox"
                          class="h-4 w-4 accent-emerald-500"
                          [checked]="marketplaceSelectedForPublish.includes(row.platform)"
                          (change)="toggleMarketplaceSelection(row.platform)"
                        />
                        <span
                          class="inline-flex h-8 w-8 items-center justify-center rounded-md text-[10px] font-semibold uppercase"
                          [ngClass]="marketplaceBadgeClass(row.platform)"
                        >
                          {{ marketplaceBadgeText(row.platform) }}
                        </span>
                        <span class="rounded-full px-2.5 py-0.5 text-[10px] font-semibold" [ngClass]="marketplaceStatusBadgeClass(row.status)">
                          {{ marketplaceStatusLabel(row.status) }}
                        </span>
                      </div>

                      <ng-container *ngIf="row.status === 'not_listed'; else listedRow">
                        <div class="text-center text-slate-600">—</div>
                        <div class="text-center text-slate-600">—</div>
                        <div class="text-center text-slate-600">—</div>
                        <div class="text-center text-slate-600">—</div>
                        <div class="text-center text-slate-600">—</div>
                        <div class="text-center text-slate-600">—</div>
                        <div class="text-center text-slate-600">—</div>
                        <div class="text-center text-slate-600">—</div>
                        <div class="text-center">
                          <button
                            type="button"
                            class="inline-flex items-center gap-1.5 rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
                            (click)="marketplaceDirectPublish(row.platform)"
                            [disabled]="marketplaceIsPublishing"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            Publish
                          </button>
                        </div>
                      </ng-container>

                      <ng-template #listedRow>
                        <div class="text-center">
                          <span class="text-lg font-bold text-white">{{ row.soldQty }}</span>
                          <p class="text-[10px] text-slate-500">units</p>
                        </div>
                        <div class="text-center">
                          <span class="text-sm font-semibold text-emerald-400">{{ formatCurrency(row.revenue) }}</span>
                        </div>
                        <div class="text-center">
                          <div class="relative inline-flex items-center">
                            <span class="absolute left-2 text-slate-400 text-sm">$</span>
                            <input
                              type="number"
                              class="w-20 h-8 text-center pl-5 bg-slate-800 border border-slate-600 text-white font-semibold rounded-md"
                              [ngModel]="row.msrpPrice"
                              [ngModelOptions]="{ standalone: true }"
                              (ngModelChange)="updateMarketplaceMsrp(row.platform, $event)"
                            />
                          </div>
                        </div>
                        <div class="text-center">
                          <div class="relative inline-flex items-center">
                            <input
                              type="number"
                              class="w-14 h-8 text-center bg-slate-800 border border-amber-500/50 text-amber-400 font-semibold rounded-md"
                              [ngModel]="marketplaceDiscountPercent(row)"
                              [ngModelOptions]="{ standalone: true }"
                              (ngModelChange)="updateMarketplaceDiscount(row.platform, $event)"
                            />
                            <span class="absolute right-2 text-amber-400 text-sm">%</span>
                          </div>
                        </div>
                        <div class="text-center">
                          <div class="relative inline-flex items-center">
                            <span class="absolute left-2 text-slate-400 text-sm">$</span>
                            <input
                              type="number"
                              class="w-20 h-8 text-center pl-5 bg-slate-800 border border-emerald-500/50 text-white font-semibold rounded-md"
                              [ngModel]="row.currentSalePrice"
                              [ngModelOptions]="{ standalone: true }"
                              (ngModelChange)="updateMarketplaceSalePrice(row.platform, $event)"
                            />
                          </div>
                        </div>
                        <div class="flex justify-center">
                          <button
                            type="button"
                            class="relative inline-flex h-6 w-11 items-center rounded-full border border-slate-700 transition"
                            [ngClass]="row.priceAutoSync ? 'bg-emerald-500/20' : 'bg-slate-800'"
                            (click)="toggleMarketplacePriceSync(row.platform)"
                          >
                            <span
                              class="inline-block h-4 w-4 transform rounded-full bg-white transition"
                              [ngClass]="row.priceAutoSync ? 'translate-x-5' : 'translate-x-1'"
                            ></span>
                          </button>
                        </div>
                        <div class="text-center">
                          <input
                            type="number"
                            class="w-14 h-8 text-center bg-slate-800 border border-slate-600 text-white font-semibold rounded-md mx-auto"
                            [ngModel]="row.currentStock"
                            [ngModelOptions]="{ standalone: true }"
                            (ngModelChange)="updateMarketplaceStock(row.platform, $event)"
                          />
                        </div>
                        <div class="flex justify-center">
                          <button
                            type="button"
                            class="relative inline-flex h-6 w-11 items-center rounded-full border border-slate-700 transition"
                            [ngClass]="row.inventoryAutoSync ? 'bg-emerald-500/20' : 'bg-slate-800'"
                            (click)="toggleMarketplaceInventorySync(row.platform)"
                          >
                            <span
                              class="inline-block h-4 w-4 transform rounded-full bg-white transition"
                              [ngClass]="row.inventoryAutoSync ? 'translate-x-5' : 'translate-x-1'"
                            ></span>
                          </button>
                        </div>
                        <div class="flex items-center justify-center gap-1">
                          <button
                            *ngIf="row.status === 'inactive' || row.status === 'error'"
                            type="button"
                            class="inline-flex items-center h-8 px-2 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-slate-700 rounded-md"
                            (click)="marketplaceDirectPublish(row.platform)"
                            [disabled]="marketplaceIsPublishing"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5 mr-1" stroke-width="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            Publish
                          </button>
                          <button type="button" class="h-8 w-8 rounded-md text-slate-400 hover:text-amber-400 hover:bg-slate-700">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                              <path d="m18 6-12 12" />
                              <path d="m6 6 12 12" />
                              <path d="M16 6h2v2" />
                              <path d="M6 16v2h2" />
                            </svg>
                          </button>
                          <button type="button" class="h-8 w-8 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-700">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                              <path d="M3 6h18" />
                              <path d="M8 6v14" />
                              <path d="M16 6v14" />
                              <path d="M5 6l1-2h12l1 2" />
                            </svg>
                          </button>
                        </div>
                      </ng-template>
                    </div>
                  </div>
                </div>

                <div class="px-6 py-4 bg-slate-800 border-t border-slate-700 flex-shrink-0">
                  <div class="flex items-center justify-between mb-3">
                    <h4 class="text-sm font-semibold text-white">Publish / Re-publish Products</h4>
                    <span
                      *ngIf="marketplaceSelectedForPublish.length > 0"
                      class="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400 border border-emerald-500/30"
                    >
                      {{ marketplaceSelectedForPublish.length }} selected
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      class="inline-flex items-center gap-2 rounded-md border border-slate-600 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                      (click)="marketplaceBulkPublish('manual')"
                      [disabled]="marketplaceSelectedForPublish.length === 0 || marketplaceIsPublishing"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Publish {{ marketplaceSelectedForPublish.length > 0 ? '(' + marketplaceSelectedForPublish.length + ')' : '' }}
                    </button>
                    <button
                      type="button"
                      class="inline-flex items-center gap-2 rounded-md border border-slate-600 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                      (click)="marketplaceBulkPublish('upc')"
                      [disabled]="marketplaceSelectedForPublish.length === 0 || marketplaceIsPublishing"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                        <path d="M4 5v14" />
                        <path d="M8 5v14" />
                        <path d="M12 5v14" />
                        <path d="M16 5v14" />
                        <path d="M20 5v14" />
                      </svg>
                      UPC {{ marketplaceSelectedForPublish.length > 0 ? '(' + marketplaceSelectedForPublish.length + ')' : '' }}
                    </button>
                    <button
                      type="button"
                      class="inline-flex items-center gap-2 rounded-md border border-slate-600 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                      (click)="marketplaceBulkPublish('ai')"
                      [disabled]="marketplaceSelectedForPublish.length === 0 || marketplaceIsPublishing"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                        <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
                      </svg>
                      AI Publish {{ marketplaceSelectedForPublish.length > 0 ? '(' + marketplaceSelectedForPublish.length + ')' : '' }}
                    </button>
                  </div>
                </div>
              </div>

              <div *ngIf="marketplaceDialogTab === 'offers'" class="flex-1 overflow-y-auto">
                <div class="p-6 space-y-4">
                  <ng-container *ngIf="marketplaceDialogOffers().length === 0; else offerList">
                    <div class="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                      <div class="p-4 rounded-full bg-slate-800 mb-4">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-8 w-8 text-slate-500" stroke-width="2">
                          <path d="M20.59 13.41 12 22 3 13.41a2 2 0 0 1 0-2.82L12 2l8.59 8.59a2 2 0 0 1 0 2.82z" />
                          <circle cx="7" cy="7" r="1.5"></circle>
                        </svg>
                      </div>
                      <h3 class="text-lg font-semibold text-white mb-2">No active offers</h3>
                      <p class="text-slate-400 text-sm max-w-md mb-4">
                        Create promotions like discounts, free shipping, or BOGO deals to boost sales on your marketplaces.
                      </p>
                      <button
                        type="button"
                        class="inline-flex items-center gap-2 rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-700"
                        (click)="openOfferDialog([marketplaceDialogProduct.id], true, false)"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                          <path d="M12 5v14" />
                          <path d="M5 12h14" />
                        </svg>
                        Create Offer
                      </button>
                    </div>
                  </ng-container>
                  <ng-template #offerList>
                    <div class="space-y-3">
                      <div
                        *ngFor="let offer of marketplaceDialogOffers()"
                        class="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
                      >
                        <div class="flex items-start justify-between gap-4">
                          <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2">
                              <h4 class="font-semibold text-white">{{ offer.name }}</h4>
                              <span class="text-xs px-2 py-0.5 rounded-full" [ngClass]="offerStatusClass(offer)">
                                {{ marketplaceOfferStatusLabel(offer) }}
                              </span>
                            </div>
                            <div class="flex items-center gap-4 text-sm">
                              <div class="flex items-center gap-1.5 text-slate-400">
                                <ng-container [ngSwitch]="offer.type">
                                  <svg *ngSwitchCase="'free_shipping'" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                                    <path d="M10 17h4V5H2v12h3" />
                                    <path d="M16 17h3l3-3v-4h-5z" />
                                    <circle cx="5" cy="17" r="2" />
                                    <circle cx="17" cy="17" r="2" />
                                  </svg>
                                  <svg *ngSwitchCase="'percent_discount'" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                                    <line x1="19" y1="5" x2="5" y2="19" />
                                    <circle cx="6.5" cy="6.5" r="2.5" />
                                    <circle cx="17.5" cy="17.5" r="2.5" />
                                  </svg>
                                  <svg *ngSwitchCase="'quantity_discount'" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                                    <path d="M3 3h18v4H3z" />
                                    <path d="M3 7h18v14H3z" />
                                  </svg>
                                  <svg *ngSwitchCase="'bulk_purchase'" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                                    <path d="M3 7l9-4 9 4-9 4-9-4z" />
                                    <path d="M3 7v10l9 4 9-4V7" />
                                  </svg>
                                  <svg *ngSwitchCase="'bogo_half'" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                                    <path d="M20 12v8H4v-8" />
                                    <path d="M12 12v8" />
                                    <path d="M4 7h16v5H4z" />
                                    <path d="M12 7V4" />
                                  </svg>
                                  <svg *ngSwitchCase="'bogo_free'" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                                    <path d="M20 12v8H4v-8" />
                                    <path d="M12 12v8" />
                                    <path d="M4 7h16v5H4z" />
                                    <path d="M12 7V4" />
                                  </svg>
                                  <svg *ngSwitchCase="'fixed_discount'" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                                    <path d="M12 1v22" />
                                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
                                  </svg>
                                </ng-container>
                                <span>{{ offerTypeLabels[offer.type] }}</span>
                              </div>
                              <span class="text-emerald-400 font-medium">
                                {{ formatOfferDiscount(offer) }}
                              </span>
                              <div class="flex items-center gap-1.5 text-slate-500">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                                  <circle cx="12" cy="12" r="10" />
                                  <path d="M12 6v6l4 2" />
                                </svg>
                                <span>{{ offerDaysLabel(offer) }}</span>
                              </div>
                            </div>
                            <div *ngIf="offer.marketplaces.length > 0" class="flex items-center gap-2 mt-3">
                              <span class="text-xs text-slate-500">Active on:</span>
                              <div class="flex items-center gap-1">
                                <span
                                  *ngFor="let mp of offer.marketplaces | slice:0:5"
                                  class="inline-flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-semibold uppercase"
                                  [ngClass]="marketplaceBadgeClass(mp)"
                                >
                                  {{ marketplaceBadgeText(mp) }}
                                </span>
                                <span *ngIf="offer.marketplaces.length > 5" class="text-xs text-slate-500">
                                  +{{ offer.marketplaces.length - 5 }}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div class="flex items-center gap-2">
                            <button
                              type="button"
                              class="text-slate-400 hover:text-white hover:bg-slate-700 rounded-md px-2 py-1 text-xs"
                              (click)="openMarketplaceEditOffer(offer)"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              class="h-8 w-8 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-700"
                              (click)="deleteMarketplaceOffer(offer)"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                                <path d="M3 6h18" />
                                <path d="M8 6v14" />
                                <path d="M16 6v14" />
                                <path d="M5 6l1-2h12l1 2" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        class="w-full gap-2 border border-dashed border-slate-600 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md px-3 py-2 text-sm"
                        (click)="openOfferDialog([marketplaceDialogProduct.id], true, false)"
                      >
                        + Add Another Offer
                      </button>
                    </div>
                  </ng-template>
                </div>
              </div>
            </div>
          </div>

          <div class="px-6 py-4 bg-slate-900 border-t border-slate-700 flex justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              class="rounded-md border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:bg-slate-700"
              (click)="closeMarketplaceDialog()"
            >
              Cancel
            </button>
            <button
              type="button"
              class="rounded-md bg-emerald-500 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-600"
              (click)="saveMarketplaceDialog()"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <div
        *ngIf="marketplaceEditOfferOpen && marketplaceEditingOffer"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in"
        (click)="closeMarketplaceEditOffer()"
      >
        <div
          class="flex w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-slate-900 text-slate-100 shadow-xl animate-in zoom-in-95 max-h-[90vh]"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-center justify-between border-b border-slate-700 px-6 py-4">
            <div class="flex items-center gap-3">
              <span class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </span>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-lg font-semibold">Edit Offer</h3>
                  <span
                    class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    [ngClass]="marketplaceEditIsActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-300'"
                  >
                    {{ marketplaceEditIsActive ? 'Active' : 'Inactive' }}
                  </span>
                </div>
                <p class="text-xs text-slate-400">Update offer details and marketplaces.</p>
              </div>
            </div>
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800"
              (click)="closeMarketplaceEditOffer()"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                <path d="M6 6l12 12" />
                <path d="M18 6l-12 12" />
              </svg>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto px-6 py-5">
            <div class="space-y-5">
              <div class="rounded-lg border border-slate-700 bg-slate-800/50 p-4 flex items-center justify-between">
                <div>
                  <p class="text-sm font-semibold">Offer Status</p>
                  <p class="text-xs text-slate-400">This offer is currently {{ marketplaceEditIsActive ? 'active' : 'inactive' }}</p>
                </div>
                <button
                  type="button"
                  class="relative inline-flex h-6 w-11 items-center rounded-full border border-slate-700 transition"
                  [ngClass]="marketplaceEditIsActive ? 'bg-emerald-500/20' : 'bg-slate-700'"
                  (click)="marketplaceEditIsActive = !marketplaceEditIsActive"
                >
                  <span
                    class="inline-block h-4 w-4 transform rounded-full bg-white transition"
                    [ngClass]="marketplaceEditIsActive ? 'translate-x-5' : 'translate-x-1'"
                  ></span>
                </button>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <label class="space-y-1">
                  <span class="text-xs text-slate-300">Offer Name</span>
                  <input
                    type="text"
                    class="h-9 w-full rounded-md border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100"
                    [(ngModel)]="marketplaceEditName"
                    [ngModelOptions]="{ standalone: true }"
                  />
                </label>
                <label class="space-y-1">
                  <span class="text-xs text-slate-300">Offer Scope</span>
                  <select
                    class="h-9 w-full rounded-md border border-slate-700 bg-slate-800 px-2 text-sm text-slate-100"
                    [(ngModel)]="marketplaceEditScope"
                    [ngModelOptions]="{ standalone: true }"
                  >
                    <option value="product">Product</option>
                    <option value="marketplace">Marketplace</option>
                  </select>
                </label>
              </div>

              <label class="space-y-1">
                <span class="text-xs text-slate-300">Description</span>
                <textarea
                  rows="3"
                  class="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100"
                  [(ngModel)]="marketplaceEditDescription"
                  [ngModelOptions]="{ standalone: true }"
                ></textarea>
              </label>

              <div class="space-y-2">
                <span class="text-xs text-slate-300">Offer Type</span>
                <div class="grid gap-2 sm:grid-cols-3">
                  <button
                    *ngFor="let type of offerTypes"
                    type="button"
                    class="flex items-center gap-2 rounded-md border px-3 py-2 text-xs"
                    [ngClass]="marketplaceEditType === type ? 'border-purple-500 bg-purple-500/10 text-purple-200' : 'border-slate-700 text-slate-300'"
                    (click)="marketplaceEditType = type"
                  >
                    {{ offerTypeLabels[type] }}
                  </button>
                </div>
              </div>

              <div class="rounded-lg border border-slate-700 bg-slate-800/50 p-4 space-y-3">
                <div *ngIf="marketplaceEditType === 'fixed_discount'" class="flex items-center gap-2 text-xs">
                  <span class="text-slate-400">Discount</span>
                  <input
                    type="number"
                    class="h-8 w-24 rounded-md border border-slate-700 bg-slate-900 px-2 text-xs text-slate-100"
                    [(ngModel)]="marketplaceEditDiscountAmount"
                    [ngModelOptions]="{ standalone: true }"
                  />
                </div>
                <div *ngIf="marketplaceEditType !== 'fixed_discount' && marketplaceEditType !== 'free_shipping'" class="flex items-center gap-2 text-xs">
                  <span class="text-slate-400">% Discount</span>
                  <input
                    type="number"
                    class="h-8 w-24 rounded-md border border-slate-700 bg-slate-900 px-2 text-xs text-slate-100"
                    [(ngModel)]="marketplaceEditDiscountPercent"
                    [ngModelOptions]="{ standalone: true }"
                  />
                </div>
                <div *ngIf="marketplaceEditType === 'quantity_discount' || marketplaceEditType === 'bulk_purchase'" class="flex items-center gap-2 text-xs">
                  <span class="text-slate-400">Min Qty</span>
                  <input
                    type="number"
                    class="h-8 w-24 rounded-md border border-slate-700 bg-slate-900 px-2 text-xs text-slate-100"
                    [(ngModel)]="marketplaceEditMinQty"
                    [ngModelOptions]="{ standalone: true }"
                  />
                </div>
                <div *ngIf="marketplaceEditType === 'bogo_half' || marketplaceEditType === 'bogo_free'" class="flex items-center gap-2 text-xs">
                  <span class="text-slate-400">Buy</span>
                  <input
                    type="number"
                    class="h-8 w-16 rounded-md border border-slate-700 bg-slate-900 px-2 text-xs text-slate-100"
                    [(ngModel)]="marketplaceEditBuyQty"
                    [ngModelOptions]="{ standalone: true }"
                  />
                  <span class="text-slate-400">Get</span>
                  <input
                    type="number"
                    class="h-8 w-16 rounded-md border border-slate-700 bg-slate-900 px-2 text-xs text-slate-100"
                    [(ngModel)]="marketplaceEditGetQty"
                    [ngModelOptions]="{ standalone: true }"
                  />
                </div>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <label class="space-y-1">
                  <span class="text-xs text-slate-300">Start Date</span>
                  <input
                    type="date"
                    class="h-9 w-full rounded-md border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100"
                    [(ngModel)]="marketplaceEditStartDate"
                    [ngModelOptions]="{ standalone: true }"
                  />
                </label>
                <label class="space-y-1">
                  <span class="text-xs text-slate-300">End Date</span>
                  <input
                    type="date"
                    class="h-9 w-full rounded-md border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100"
                    [(ngModel)]="marketplaceEditEndDate"
                    [ngModelOptions]="{ standalone: true }"
                  />
                </label>
              </div>

              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs text-slate-300">Marketplaces</span>
                  <button
                    type="button"
                    class="text-xs text-slate-400 hover:text-slate-200"
                    (click)="marketplaceEditMarketplaces = []"
                  >
                    Clear
                  </button>
                </div>
                <div class="grid grid-cols-3 gap-2">
                  <label
                    *ngFor="let platform of marketplaces"
                    class="flex items-center gap-2 rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-300"
                  >
                    <input
                      type="checkbox"
                      class="h-3.5 w-3.5"
                      [checked]="marketplaceEditMarketplaces.includes(platform)"
                      (change)="toggleMarketplaceEditMarketplace(platform)"
                    />
                    <span class="flex h-5 w-5 items-center justify-center rounded-md text-[9px] font-semibold uppercase"
                      [ngClass]="marketplaceBadgeClass(platform)"
                    >
                      {{ marketplaceBadgeText(platform) }}
                    </span>
                    <span class="truncate">{{ marketplaceName(platform) }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 border-t border-slate-700 bg-slate-900 px-6 py-4">
            <button
              type="button"
              class="rounded-md border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:bg-slate-700"
              (click)="closeMarketplaceEditOffer()"
            >
              Cancel
            </button>
            <button
              type="button"
              class="rounded-md bg-emerald-500 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-600"
              (click)="saveMarketplaceEditOffer()"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <div
        *ngIf="bulkListingOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in"
      >
        <div class="flex w-full max-w-[98vw] flex-col overflow-hidden rounded-xl bg-card shadow-xl animate-in zoom-in-95 md:max-w-5xl max-h-[90vh]">
          <div class="flex items-center justify-between border-b border-border px-6 py-4">
            <div class="flex items-center gap-2">
              <span class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <svg *ngIf="bulkListingStep === 'configure'" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                  <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
                  <path d="M2 7h20" />
                </svg>
                <svg *ngIf="bulkListingStep === 'preview'" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                  <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </span>
              <div>
                <h3 class="text-lg font-semibold">
                  {{ bulkListingStep === 'preview' ? 'Preview Batch Data' : 'Bulk List to Marketplaces' }}
                </h3>
                <p class="text-xs text-muted-foreground">
                  {{
                    bulkListingStep === 'preview'
                      ? 'Review and edit listings before publishing.'
                      : 'Select marketplaces and publish method for selected products.'
                  }}
                </p>
              </div>
            </div>
            <button
              type="button"
              class="rounded-md border border-border px-3 py-1 text-xs"
              (click)="closeBulkListing()"
            >
              Close
            </button>
          </div>

          <div class="flex-1 overflow-y-auto px-6 py-4">
            <ng-container *ngIf="bulkListingStep === 'configure'; else bulkListingPreview">
              <div class="space-y-5">
                <div class="space-y-2">
                  <label class="text-xs font-semibold text-foreground">Batch Name</label>
                  <input
                    type="text"
                    class="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                    placeholder="e.g., January 2025 Product Launch"
                    [(ngModel)]="bulkListingBatchName"
                  />
                </div>

                <div class="space-y-2">
                  <label class="text-xs font-semibold text-foreground">Publish Method</label>
                  <div class="grid gap-2">
                    <button
                      *ngFor="let method of bulkListingMethods"
                      type="button"
                      class="flex items-start gap-3 rounded-lg border p-3 text-left transition-colors"
                      [ngClass]="bulkListingPublishMethod === method.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'"
                      (click)="bulkListingPublishMethod = method.id"
                    >
                      <span class="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <svg *ngIf="method.icon === 'sparkles'" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                          <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
                        </svg>
                        <svg *ngIf="method.icon === 'barcode'" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                          <path d="M4 5v14" />
                          <path d="M8 5v14" />
                          <path d="M12 5v14" />
                          <path d="M16 5v14" />
                          <path d="M20 5v14" />
                        </svg>
                        <svg *ngIf="method.icon === 'upload'" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                          <path d="M12 3v12" />
                          <path d="m7 8 5-5 5 5" />
                          <path d="M4 21h16" />
                        </svg>
                      </span>
                      <div class="flex-1">
                        <p class="text-sm font-medium text-foreground">{{ method.label }}</p>
                        <p class="text-xs text-muted-foreground">{{ method.description }}</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <label class="text-xs font-semibold text-foreground">Select Marketplaces</label>
                    <div class="flex gap-2">
                      <button
                        type="button"
                        class="h-7 rounded-md border border-border px-2 text-[10px]"
                        (click)="bulkListingSelectAllMarketplaces()"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        class="h-7 rounded-md border border-border px-2 text-[10px]"
                        (click)="bulkListingClearMarketplaces()"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div class="max-h-[180px] rounded-lg border border-border p-3 overflow-y-auto">
                    <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      <label
                        *ngFor="let marketplace of marketplaces"
                        class="flex items-center gap-2 rounded-lg border p-2 text-xs transition-colors"
                        [ngClass]="bulkListingMarketplaces.includes(marketplace) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'"
                      >
                        <input
                          type="checkbox"
                          class="h-4 w-4"
                          [checked]="bulkListingMarketplaces.includes(marketplace)"
                          (change)="bulkListingToggleMarketplace(marketplace)"
                        />
                        <span class="flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-semibold"
                          [ngClass]="marketplaceBadgeClass(marketplace)"
                        >
                          {{ marketplaceBadgeLabel(marketplace) }}
                        </span>
                        <span class="truncate">{{ marketplaceName(marketplace) }}</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div class="rounded-lg border border-border bg-muted/50 p-3 text-xs">
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Products:</span>
                    <span class="font-semibold">{{ bulkListingProducts.length }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Marketplaces:</span>
                    <span class="font-semibold">{{ bulkListingMarketplaces.length }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Method:</span>
                    <span class="font-semibold">{{ bulkListingSelectedMethod()?.label }}</span>
                  </div>
                  <div class="mt-2 flex justify-between border-t border-border pt-2">
                    <span class="text-muted-foreground">Total Listings:</span>
                    <span class="font-semibold text-primary">{{ bulkListingTotalItems() }}</span>
                  </div>
                </div>
              </div>
            </ng-container>

            <ng-template #bulkListingPreview>
              <div class="flex flex-1 flex-col gap-3">
                <div class="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/50 p-3 text-xs">
                  <span class="font-semibold">{{ bulkListingProducts.length }} Products</span>
                  <span class="font-semibold">{{ bulkListingMarketplaces.length }} Marketplaces</span>
                  <span class="font-semibold">{{ bulkListingSelectedMethod()?.label }}</span>
                  <span class="ml-auto rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                    {{ bulkListingTotalItems() }} listings
                  </span>
                  <span
                    *ngIf="bulkListingItemsWithIssues() > 0"
                    class="rounded-full border border-destructive px-2 py-0.5 text-[10px] text-destructive"
                  >
                    {{ bulkListingItemsWithIssues() }} missing
                  </span>
                </div>

                <div class="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>Edit data per marketplace. Use copy to apply values to all marketplaces for a product.</span>
                  <button
                    type="button"
                    class="rounded-md border border-border px-2 py-1 text-[10px]"
                    (click)="bulkListingFillOpen = !bulkListingFillOpen"
                  >
                    Fill All
                  </button>
                </div>

                <div *ngIf="bulkListingFillOpen" class="grid gap-3 rounded-lg border border-border bg-background/50 p-3 text-xs">
                  <div class="grid gap-2 sm:grid-cols-2">
                    <label class="grid gap-1">
                      Stock Quantity
                      <div class="flex gap-2">
                        <input
                          type="number"
                          class="h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
                          [(ngModel)]="bulkListingFillStock"
                        />
                        <button type="button" class="h-8 rounded-md border border-border px-2" (click)="bulkListingApplyFill('stockQty', bulkListingFillStock)">
                          Apply
                        </button>
                      </div>
                    </label>
                    <label class="grid gap-1">
                      Sale Price
                      <div class="flex gap-2">
                        <input
                          type="number"
                          class="h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
                          [(ngModel)]="bulkListingFillPrice"
                        />
                        <button type="button" class="h-8 rounded-md border border-border px-2" (click)="bulkListingApplyFill('salePrice', bulkListingFillPrice)">
                          Apply
                        </button>
                      </div>
                    </label>
                    <label class="grid gap-1">
                      Shipping
                      <div class="flex gap-2">
                        <input
                          type="number"
                          class="h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
                          [(ngModel)]="bulkListingFillShipping"
                        />
                        <button type="button" class="h-8 rounded-md border border-border px-2" (click)="bulkListingApplyFill('shippingCost', bulkListingFillShipping)">
                          Apply
                        </button>
                      </div>
                    </label>
                    <label class="grid gap-1">
                      MSRP
                      <div class="flex gap-2">
                        <input
                          type="number"
                          class="h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
                          [(ngModel)]="bulkListingFillMsrp"
                        />
                        <button type="button" class="h-8 rounded-md border border-border px-2" (click)="bulkListingApplyFill('msrp', bulkListingFillMsrp)">
                          Apply
                        </button>
                      </div>
                    </label>
                  </div>
                  <label class="grid gap-1">
                    Condition
                    <select
                      class="h-8 rounded-md border border-border bg-background px-2 text-xs"
                      [(ngModel)]="bulkListingFillCondition"
                      (change)="bulkListingApplyFill('condition', bulkListingFillCondition)"
                    >
                      <option *ngFor="let condition of bulkConditionOptions" [value]="condition">
                        {{ condition }}
                      </option>
                    </select>
                  </label>
                </div>

                <div class="min-h-[280px] overflow-auto rounded-lg border border-border">
                  <table class="w-full min-w-[900px] text-xs">
                    <thead class="sticky top-0 bg-card">
                      <tr class="border-b border-border text-muted-foreground">
                        <th class="px-3 py-2 text-left w-[180px]">Product</th>
                        <th class="px-3 py-2 text-left w-[110px]">Marketplace</th>
                        <th class="px-3 py-2 text-left w-[120px]">SKU</th>
                        <th class="px-3 py-2 text-right w-[80px]">Stock</th>
                        <th class="px-3 py-2 text-right w-[90px]">Price</th>
                        <th class="px-3 py-2 text-right w-[90px]">MSRP</th>
                        <th class="px-3 py-2 text-right w-[90px]">Shipping</th>
                        <th class="px-3 py-2 text-left w-[120px]">Condition</th>
                        <th class="px-3 py-2 text-center w-[70px]">Status</th>
                        <th class="px-3 py-2 text-center w-[50px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        *ngFor="let item of bulkListingPreviewItems(); trackBy: trackByBulkListingItem"
                        class="border-b border-border"
                        [ngClass]="{ 'bg-destructive/5': bulkListingItemStatus(item.product.id, item.marketplace).hasIssues }"
                      >
                        <td class="px-3 py-2">
                          <div class="flex items-center gap-2">
                            <img
                              *ngIf="item.isFirstForProduct"
                              [src]="item.product.image"
                              [alt]="item.product.name"
                              class="h-7 w-7 rounded object-cover"
                            />
                            <span class="truncate text-xs font-medium">
                              {{ item.isFirstForProduct ? item.product.name : '↳' }}
                            </span>
                          </div>
                        </td>
                        <td class="px-3 py-2">
                          <div class="flex items-center gap-1">
                            <span class="flex h-5 w-5 items-center justify-center rounded-md text-[9px] font-semibold"
                              [ngClass]="marketplaceBadgeClass(item.marketplace)"
                            >
                              {{ marketplaceBadgeLabel(item.marketplace) }}
                            </span>
                            <span class="text-xs font-medium">{{ marketplaceName(item.marketplace) }}</span>
                          </div>
                        </td>
                        <td class="px-2 py-1">
                          <input
                            type="text"
                            class="h-7 w-full rounded-md border border-border bg-background px-2 text-xs"
                            [ngModel]="bulkListingEditedItems[item.key].sku || ''"
                            (ngModelChange)="bulkListingUpdateItemField(item.product.id, item.marketplace, 'sku', $event)"
                          />
                        </td>
                        <td class="px-2 py-1">
                          <input
                            type="number"
                            class="h-7 w-full rounded-md border border-border bg-background px-2 text-xs text-right"
                            [ngModel]="bulkListingEditedItems[item.key].stockQty ?? ''"
                            (ngModelChange)="bulkListingUpdateItemField(item.product.id, item.marketplace, 'stockQty', parseNumberInput($event))"
                          />
                        </td>
                        <td class="px-2 py-1">
                          <input
                            type="number"
                            class="h-7 w-full rounded-md border border-border bg-background px-2 text-xs text-right"
                            [ngModel]="bulkListingEditedItems[item.key].salePrice ?? ''"
                            (ngModelChange)="bulkListingUpdateItemField(item.product.id, item.marketplace, 'salePrice', parseNumberInput($event))"
                          />
                        </td>
                        <td class="px-2 py-1">
                          <input
                            type="number"
                            class="h-7 w-full rounded-md border border-border bg-background px-2 text-xs text-right"
                            [ngModel]="bulkListingEditedItems[item.key].msrp ?? ''"
                            (ngModelChange)="bulkListingUpdateItemField(item.product.id, item.marketplace, 'msrp', parseNumberInput($event))"
                          />
                        </td>
                        <td class="px-2 py-1">
                          <input
                            type="number"
                            class="h-7 w-full rounded-md border border-border bg-background px-2 text-xs text-right"
                            [ngModel]="bulkListingEditedItems[item.key].shippingCost ?? ''"
                            (ngModelChange)="bulkListingUpdateItemField(item.product.id, item.marketplace, 'shippingCost', parseNumberInput($event))"
                          />
                        </td>
                        <td class="px-2 py-1">
                          <select
                            class="h-7 w-full rounded-md border border-border bg-background px-2 text-xs"
                            [ngModel]="bulkListingEditedItems[item.key].condition || 'New'"
                            (ngModelChange)="bulkListingUpdateItemField(item.product.id, item.marketplace, 'condition', $event)"
                          >
                            <option *ngFor="let condition of bulkConditionOptions" [value]="condition">
                              {{ condition }}
                            </option>
                          </select>
                        </td>
                        <td class="px-2 py-1 text-center">
                          <span
                            class="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px]"
                            [ngClass]="bulkListingItemStatus(item.product.id, item.marketplace).hasIssues ? 'border-destructive text-destructive' : 'border-emerald-500 text-emerald-500'"
                          >
                            {{
                              bulkListingItemStatus(item.product.id, item.marketplace).hasIssues
                                ? bulkListingItemStatus(item.product.id, item.marketplace).missingFields.length
                                : '✓'
                            }}
                          </span>
                        </td>
                        <td class="px-2 py-1 text-center">
                          <button
                            *ngIf="bulkListingMarketplaces.length > 1"
                            type="button"
                            class="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                            title="Copy to all marketplaces"
                            (click)="bulkListingCopyToAllMarketplaces(item.product.id, item.marketplace)"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3" stroke-width="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" />
                              <rect x="2" y="2" width="13" height="13" rx="2" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div *ngIf="bulkListingPublishMethod === 'ai'" class="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                  <span class="font-semibold text-foreground">AI Auto-Fill:</span>
                  Missing fields will be generated using AI based on product data.
                </div>
              </div>
            </ng-template>
          </div>

          <div class="flex items-center justify-between gap-2 border-t border-border px-6 py-4">
            <button
              *ngIf="bulkListingStep === 'preview'"
              type="button"
              class="rounded-md border border-border px-3 py-2 text-xs"
              (click)="bulkListingStep = 'configure'"
            >
              Back
            </button>
            <span class="flex-1"></span>
            <button
              *ngIf="bulkListingStep === 'configure'"
              type="button"
              class="rounded-md border border-border px-4 py-2 text-xs"
              (click)="closeBulkListing()"
            >
              Cancel
            </button>
            <button
              *ngIf="bulkListingStep === 'configure'"
              type="button"
              class="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
              [disabled]="!bulkListingCanProceed()"
              (click)="bulkListingProceedToPreview()"
            >
              Preview Data
            </button>
            <button
              *ngIf="bulkListingStep === 'preview'"
              type="button"
              class="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
              (click)="bulkListingCreateBatch()"
            >
              {{ bulkListingPublishMethod === 'ai' ? 'AI Publish' : bulkListingPublishMethod === 'upc' ? 'UPC Match' : 'Publish' }}
              ({{ bulkListingTotalItems() }} items)
            </button>
          </div>
        </div>
      </div>

      <div
        *ngIf="false && offerDialogOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in"
      >
        <div class="flex w-full max-w-[98vw] flex-col overflow-hidden rounded-xl bg-card shadow-xl animate-in zoom-in-95 md:max-w-3xl max-h-[90vh]">
          <div class="flex items-center justify-between border-b border-border px-6 py-4">
            <div class="flex items-center gap-2">
              <span class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                  <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
                  <circle cx="7.5" cy="7.5" r=".5" fill="currentColor"></circle>
                </svg>
              </span>
              <h3 class="text-lg font-semibold">Create New Offer</h3>
            </div>
            <button
              type="button"
              class="rounded-md border border-border px-3 py-1 text-xs"
              (click)="closeOfferDialog()"
            >
              Close
            </button>
          </div>

          <div class="flex-1 overflow-y-auto px-6 py-4">
            <div class="space-y-6 pb-2">
              <div class="space-y-4">
                <div class="grid gap-4 sm:grid-cols-2">
                  <label class="grid gap-2 text-xs">
                    <span class="font-semibold text-foreground">Offer Name *</span>
                    <input
                      type="text"
                      class="h-10 rounded-md border border-border bg-background px-3 text-sm"
                      placeholder="e.g., Summer Sale 20% Off"
                      [(ngModel)]="offerDialogName"
                    />
                  </label>
                  <label class="grid gap-2 text-xs">
                    <span class="font-semibold text-foreground">Offer Scope</span>
                    <select
                      class="h-10 rounded-md border border-border bg-background px-3 text-sm"
                      [(ngModel)]="offerDialogScope"
                    >
                      <option value="product">By Product</option>
                      <option value="marketplace">By Marketplace</option>
                    </select>
                  </label>
                </div>
                <label class="grid gap-2 text-xs">
                  <span class="font-semibold text-foreground">Description (optional)</span>
                  <textarea
                    class="rounded-md border border-border bg-background px-3 py-2 text-sm"
                    rows="2"
                    placeholder="Describe the offer..."
                    [(ngModel)]="offerDialogDescription"
                  ></textarea>
                </label>
              </div>

              <div class="space-y-3">
                <p class="text-xs font-semibold text-foreground">Offer Type *</p>
                <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <button
                    *ngFor="let type of offerTypes"
                    type="button"
                    class="flex flex-col items-center gap-2 rounded-lg border-2 p-3 text-xs transition-all"
                    [ngClass]="
                      offerDialogType === type
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-muted-foreground/50'
                    "
                    (click)="offerDialogType = type"
                  >
                    <span
                      class="inline-flex h-8 w-8 items-center justify-center rounded-full"
                      [ngClass]="
                        offerDialogType === type
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      "
                    >
                      <ng-container [ngSwitch]="type">
                        <svg *ngSwitchCase="'free_shipping'" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                          <path d="M3 3h13v13H3z" />
                          <path d="M16 8h4l1 3v5h-5z" />
                          <circle cx="7.5" cy="17.5" r="1.5" />
                          <circle cx="17.5" cy="17.5" r="1.5" />
                        </svg>
                        <svg *ngSwitchCase="'percent_discount'" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                          <path d="M19 5L5 19" />
                          <circle cx="6.5" cy="6.5" r="2.5" />
                          <circle cx="17.5" cy="17.5" r="2.5" />
                        </svg>
                        <svg *ngSwitchCase="'fixed_discount'" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                          <path d="M12 2v20" />
                          <path d="M17 5H9.5a3.5 3.5 0 1 0 0 7H14a3.5 3.5 0 1 1 0 7H6" />
                        </svg>
                        <svg *ngSwitchCase="'quantity_discount'" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                          <path d="M3 7h18" />
                          <path d="M3 12h18" />
                          <path d="M3 17h18" />
                        </svg>
                        <svg *ngSwitchCase="'bulk_purchase'" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                          <path d="M12 22V12" />
                          <path d="m3.3 7 7.7 4.7a2 2 0 0 0 2 0L20.7 7" />
                        </svg>
                        <svg *ngSwitchDefault viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                          <path d="M12 3v18" />
                          <path d="M7 8h10" />
                          <path d="M7 16h10" />
                        </svg>
                      </ng-container>
                    </span>
                    <span class="text-center text-[11px] font-medium">{{ offerTypeLabels[type] }}</span>
                  </button>
                </div>
              </div>

              <div *ngIf="offerDialogType !== 'free_shipping'" class="space-y-3 rounded-lg border border-border bg-muted/50 p-4">
                <p class="text-sm font-semibold text-foreground">Discount Configuration</p>

                <div *ngIf="offerDialogType === 'percent_discount' || offerDialogType === 'quantity_discount' || offerDialogType === 'bulk_purchase'" class="flex flex-wrap items-center gap-3 text-xs">
                  <span class="w-28 font-semibold text-muted-foreground">Discount %</span>
                  <div class="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      class="h-9 w-24 rounded-md border border-border bg-background px-3 text-sm"
                      [(ngModel)]="offerDialogDiscountPercent"
                    />
                    <span class="text-muted-foreground">%</span>
                  </div>
                </div>

                <div *ngIf="offerDialogType === 'fixed_discount'" class="flex flex-wrap items-center gap-3 text-xs">
                  <span class="w-28 font-semibold text-muted-foreground">Discount Amount</span>
                  <div class="flex items-center gap-2">
                    <span class="text-muted-foreground">$</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      class="h-9 w-24 rounded-md border border-border bg-background px-3 text-sm"
                      [(ngModel)]="offerDialogDiscountAmount"
                    />
                  </div>
                </div>

                <div *ngIf="offerDialogType === 'quantity_discount' || offerDialogType === 'bulk_purchase'" class="flex flex-wrap items-center gap-3 text-xs">
                  <span class="w-28 font-semibold text-muted-foreground">Minimum Qty</span>
                  <div class="flex items-center gap-2">
                    <input
                      type="number"
                      min="2"
                      class="h-9 w-24 rounded-md border border-border bg-background px-3 text-sm"
                      [(ngModel)]="offerDialogMinQty"
                    />
                    <span class="text-muted-foreground">units</span>
                  </div>
                </div>

                <div *ngIf="offerDialogType === 'bogo_half' || offerDialogType === 'bogo_free'" class="space-y-3 text-xs">
                  <div class="flex flex-wrap items-center gap-3">
                    <span class="w-28 font-semibold text-muted-foreground">Buy Qty</span>
                    <input
                      type="number"
                      min="1"
                      class="h-9 w-24 rounded-md border border-border bg-background px-3 text-sm"
                      [(ngModel)]="offerDialogBuyQty"
                    />
                  </div>
                  <div class="flex flex-wrap items-center gap-3">
                    <span class="w-28 font-semibold text-muted-foreground">Get Qty</span>
                    <div class="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        class="h-9 w-24 rounded-md border border-border bg-background px-3 text-sm"
                        [(ngModel)]="offerDialogGetQty"
                      />
                      <span class="text-muted-foreground">
                        {{ offerDialogType === 'bogo_half' ? '@ 50% off' : 'free' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="space-y-3">
                <p class="text-xs font-semibold text-foreground">Offer Period *</p>
                <div class="grid gap-4 sm:grid-cols-2">
                  <label class="grid gap-2 text-xs">
                    <span class="text-muted-foreground">Start Date</span>
                    <input
                      type="date"
                      class="h-10 rounded-md border border-border bg-background px-3 text-sm"
                      [(ngModel)]="offerDialogStartDate"
                    />
                  </label>
                  <label class="grid gap-2 text-xs">
                    <span class="text-muted-foreground">End Date</span>
                    <input
                      type="date"
                      class="h-10 rounded-md border border-border bg-background px-3 text-sm"
                      [(ngModel)]="offerDialogEndDate"
                    />
                  </label>
                </div>
              </div>

              <div *ngIf="!offerDialogHideProductSelection" class="space-y-3">
                <div class="flex items-center justify-between">
                  <p class="text-xs font-semibold text-foreground">Select Products *</p>
                  <span class="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                    {{ offerDialogProductIds.length }} selected
                  </span>
                </div>
                <input
                  type="search"
                  class="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                  placeholder="Search products by name or SKU..."
                  [(ngModel)]="offerDialogProductSearch"
                />
                <div class="h-48 overflow-y-auto rounded-lg border border-border">
                  <div class="space-y-1 p-2">
                    <div
                      *ngFor="let product of filteredOfferProducts().slice(0, 50)"
                      class="flex cursor-pointer items-center gap-3 rounded-md p-2 text-xs transition-colors"
                      [ngClass]="offerDialogProductIds.includes(product.id) ? 'bg-primary/10' : 'hover:bg-muted'"
                      (click)="toggleOfferProduct(product.id)"
                    >
                      <input
                        type="checkbox"
                        class="h-4 w-4"
                        [checked]="offerDialogProductIds.includes(product.id)"
                      />
                      <img
                        [src]="product.image"
                        [alt]="product.name"
                        class="h-8 w-8 rounded object-cover"
                      />
                      <div class="flex-1 min-w-0">
                        <p class="truncate text-sm font-medium">{{ product.name }}</p>
                        <p class="text-[10px] text-muted-foreground">{{ product.vendorSku }}</p>
                      </div>
                      <span class="text-sm font-medium">$ {{ product.salePrice.toFixed(2) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div *ngIf="offerDialogHideProductSelection && offerDialogProductIds.length > 0" class="rounded-lg border border-border bg-muted/50 p-3 text-sm">
                <span class="font-medium">{{ offerDialogProductIds.length }} product{{ offerDialogProductIds.length > 1 ? 's' : '' }}</span>
                <span class="text-muted-foreground"> will receive this offer</span>
              </div>

              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <p class="text-xs font-semibold text-foreground">Marketplaces (optional)</p>
                  <span class="text-xs text-muted-foreground">
                    {{ offerDialogMarketplaces.length === 0 ? 'All marketplaces' : offerDialogMarketplaces.length + ' selected' }}
                  </span>
                </div>
                <div class="grid grid-cols-5 gap-2">
                  <button
                    *ngFor="let platform of marketplaces"
                    type="button"
                    class="flex flex-col items-center gap-1 rounded-lg border p-2 text-[10px] transition-all"
                    [ngClass]="offerDialogMarketplaces.includes(platform) ? 'border-primary bg-primary/10 text-foreground' : 'border-transparent text-muted-foreground hover:bg-muted'"
                    (click)="toggleOfferMarketplace(platform)"
                  >
                    <span
                      class="flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-semibold"
                      [ngClass]="marketplaceBadgeClass(platform)"
                    >
                      {{ marketplaceBadgeLabel(platform) }}
                    </span>
                    <span class="capitalize">{{ marketplaceName(platform) }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
            <button
              type="button"
              class="rounded-md border border-border px-4 py-2 text-xs font-semibold text-foreground"
              (click)="closeOfferDialog()"
            >
              Cancel
            </button>
            <button
              type="button"
              class="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
              [disabled]="!offerDialogIsValid()"
              (click)="saveOfferDialog()"
            >
              Create Offer
            </button>
          </div>
        </div>
      </div>

      <app-create-offer-dialog
        [open]="offerDialogOpen"
        [products]="products"
        [initialProductIds]="offerDialogProductIds"
        [hideProductSelection]="offerDialogHideProductSelection"
        [allowEmptySelection]="offerDialogAllowEmptySelection"
        (closed)="closeOfferDialog()"
        (created)="handleOfferCreated($event)"
      ></app-create-offer-dialog>

      <div class="flex flex-1 flex-col min-h-0">
        <ng-container *ngIf="filteredProducts() as filtered">
          <ng-container *ngIf="paginatedProducts(filtered) as visible">
            <div
              *ngIf="selectedCount > 0"
              class="sticky top-0 z-30 mx-4 mb-3 mt-3 rounded-lg border border-primary/20 bg-primary/10 p-2 shadow-lg backdrop-blur-sm sm:p-3"
            >
              <div class="flex flex-wrap items-center justify-between gap-3 sm:gap-4 text-sm">
              <div class="flex items-center gap-2 sm:gap-3">
                <span class="text-xs sm:text-sm font-medium text-foreground">
                  {{ selectedCount }} product{{ selectedCount > 1 ? 's' : '' }} selected
                </span>
                <button
                  type="button"
                  class="h-6 sm:h-7 px-2 text-[10px] sm:text-xs text-muted-foreground hover:text-foreground"
                  (click)="clearSelection()"
                >
                  Clear
                </button>
                <button
                  type="button"
                  class="h-6 sm:h-7 px-2 text-[10px] sm:text-xs text-muted-foreground hover:text-foreground"
                  (click)="selectAllFiltered(filtered)"
                >
                  Select all ({{ filtered.length }})
                </button>
              </div>

              <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <details
                  class="relative"
                  data-dropdown="bulk-add-tag"
                  [open]="openDropdownId === 'bulk-add-tag'"
                >
                  <summary
                    class="inline-flex items-center justify-center whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md gap-1 sm:gap-1.5 h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
                    (click)="$event.preventDefault(); $event.stopPropagation(); toggleDropdown('bulk-add-tag')"
                  >
                    <span class="inline-flex h-5 w-5 items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus w-3.5 h-3.5 sm:w-4 sm:h-4"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
                    </span>
                    <span class="hidden xs:inline">Add</span> Tags
                  </summary>
                  <div
                    data-dropdown-panel
                    class="absolute z-50 dropdown-panel mt-2 w-48 rounded-lg border border-border bg-card/95 p-2 shadow-xl backdrop-blur"
                  >
                    <p class="mb-2 px-1 text-xs font-medium text-muted-foreground">
                      Add tag to selected
                    </p>
                    <p *ngIf="tags.length === 0" class="px-1 py-2 text-sm text-muted-foreground text-center">
                      No tags available
                    </p>
                    <div *ngIf="tags.length > 0" class="space-y-1 max-h-40 overflow-y-auto">
                      <button
                        *ngFor="let tag of tags"
                        type="button"
                        class="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-left text-sm"
                        (click)="bulkAddTag(tag.id)"
                      >
                        <span class="w-3 h-3 rounded-full" [style.backgroundColor]="tag.color"></span>
                        <span class="text-foreground">{{ tag.name }}</span>
                      </button>
                    </div>
                  </div>
                </details>

                <details
                  class="relative"
                  data-dropdown="bulk-remove-tag"
                  [open]="openDropdownId === 'bulk-remove-tag'"
                >
                  <summary
                    class="inline-flex items-center justify-center whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md gap-1 sm:gap-1.5 h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
                    (click)="$event.preventDefault(); $event.stopPropagation(); toggleDropdown('bulk-remove-tag')"
                  >
                    <span class="inline-flex h-5 w-5 mr-0 sm:mr-2 items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2 w-3.5 h-3.5 sm:w-4 sm:h-4"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" x2="10" y1="11" y2="17"></line><line x1="14" x2="14" y1="11" y2="17"></line></svg>
                    </span>
                    <span class="hidden xs:inline">Remove</span> Tags
                  </summary>
                  <div
                    data-dropdown-panel
                    class="absolute z-50 dropdown-panel mt-2 w-48 rounded-lg border border-border bg-card/95 p-2 shadow-xl backdrop-blur"
                  >
                    <p class="mb-2 px-1 text-xs font-medium text-muted-foreground">
                      Remove tag from selected
                    </p>
                    <p *ngIf="tags.length === 0" class="px-1 py-2 text-sm text-muted-foreground text-center">
                      No tags available
                    </p>
                    <div *ngIf="tags.length > 0" class="space-y-1 max-h-40 overflow-y-auto">
                      <button
                        *ngFor="let tag of tags"
                        type="button"
                        class="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-left text-sm"
                        (click)="bulkRemoveTag(tag.id)"
                      >
                        <span class="w-3 h-3 rounded-full" [style.backgroundColor]="tag.color"></span>
                        <span class="text-foreground">{{ tag.name }}</span>
                      </button>
                    </div>
                  </div>
                </details>

                <details
                  class="relative"
                  data-dropdown="bulk-pricing"
                  [open]="openDropdownId === 'bulk-pricing'"
                >
                  <summary
                    class="inline-flex items-center justify-center whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md gap-1 sm:gap-1.5 h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
                    (click)="$event.preventDefault(); $event.stopPropagation(); toggleDropdown('bulk-pricing')"
                  >
                    <span class="inline-flex h-5 w-5 items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-dollar-sign w-3.5 h-3.5 sm:w-4 sm:h-4"><line x1="12" x2="12" y1="2" y2="22"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    </span>
                    <span class="hidden xs:inline">Update</span> Values
                  </summary>
                  <div
                    data-dropdown-panel
                    class="absolute z-50 dropdown-panel mt-2 w-64 rounded-lg border border-border bg-card/95 p-3 shadow-xl backdrop-blur"
                  >
                    <div class="space-y-3">
                      <p class="text-xs font-medium text-muted-foreground">
                        Update values for {{ selectedCount }} products
                      </p>
                      <div class="space-y-1">
                        <label class="text-xs text-muted-foreground">Sale Price</label>
                        <div class="relative">
                          <span class="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                            $
                          </span>
                          <input
                            type="number"
                            placeholder="Leave empty to skip"
                            class="h-8 w-full rounded-md border border-border bg-background pl-6 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            [(ngModel)]="bulkSalePrice"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      </div>
                      <div class="space-y-1">
                        <label class="text-xs text-muted-foreground">Stock Qty</label>
                        <div class="relative">
                          <span class="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                              <path d="M3 7l9-4 9 4-9 4-9-4z" />
                              <path d="M3 7v10l9 4 9-4V7" />
                            </svg>
                          </span>
                          <input
                            type="number"
                            placeholder="Leave empty to skip"
                            class="h-8 w-full rounded-md border border-border bg-background pl-7 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            [(ngModel)]="bulkStockQty"
                            min="0"
                          />
                        </div>
                      </div>
                      <div class="space-y-1">
                        <label class="text-xs text-muted-foreground">Landed Cost (MSRP)</label>
                        <div class="relative">
                          <span class="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                            $
                          </span>
                          <input
                            type="number"
                            placeholder="Leave empty to skip"
                            class="h-8 w-full rounded-md border border-border bg-background pl-6 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            [(ngModel)]="bulkLandedCost"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      </div>
                      <div class="space-y-1">
                        <label class="text-xs text-muted-foreground">Purchased Qty</label>
                        <div class="relative">
                          <span class="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                              <path d="M3 7l9-4 9 4-9 4-9-4z" />
                              <path d="M3 7v10l9 4 9-4V7" />
                            </svg>
                          </span>
                          <input
                            type="number"
                            placeholder="Leave empty to skip"
                            class="h-8 w-full rounded-md border border-border bg-background pl-7 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            [(ngModel)]="bulkPurchaseQty"
                            min="0"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        class="h-8 w-full rounded-md bg-primary text-xs font-semibold text-primary-foreground disabled:opacity-50"
                        [disabled]="!bulkSalePrice && !bulkStockQty && !bulkLandedCost && !bulkPurchaseQty"
                        (click)="applyBulkPricing()"
                      >
                        Apply to {{ selectedCount }} Products
                      </button>
                    </div>
                  </div>
                </details>

                <button
                  type="button"
                  class="inline-flex items-center justify-center whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-primary-foreground rounded-md gap-1 sm:gap-1.5 h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3 bg-blue-600 hover:bg-blue-700"
                  (click)="openBulkListing()"
                >
                  <span class="inline-flex h-5 w-5 items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-store w-3.5 h-3.5 sm:w-4 sm:h-4"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"></path><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"></path><path d="M2 7h20"></path><path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"></path></svg>
                  </span>
                  <span class="hidden xs:inline">List to</span> Marketplaces
                </button>

                <button
                  type="button"
                  class="inline-flex items-center justify-center whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-primary-foreground rounded-md gap-1 sm:gap-1.5 h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3 bg-purple-600 hover:bg-purple-700"
                  (click)="openBulkOffer()"
                >
                  <span class="inline-flex h-5 w-5 items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tag w-3.5 h-3.5 sm:w-4 sm:h-4"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"></path><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"></circle></svg>
                  </span>
                  <span class="hidden xs:inline">Create</span> Offer
                </button>

                <button
                  type="button"
                  class="inline-flex items-center justify-center whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md gap-1 sm:gap-1.5 h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
                  (click)="openHistory()"
                >
                  <span class="inline-flex h-5 w-5 items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-history w-3.5 h-3.5 sm:w-4 sm:h-4"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M12 7v5l4 2"></path></svg>
                  </span>
                  <span class="hidden xs:inline">Batch</span> History
                </button>

                <button
                  type="button"
                  class="inline-flex items-center justify-center whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md gap-1 sm:gap-1.5 h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
                  (click)="exportSelectedCsv(filtered)"
                >
                  <span class="inline-flex h-5 w-5 items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download w-3.5 h-3.5 sm:w-4 sm:h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line></svg>
                  </span>
                  <span class="hidden xs:inline">Export</span> CSV
                </button>

                <button
                  type="button"
                  class="inline-flex items-center justify-center whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md gap-1 sm:gap-1.5 h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
                  (click)="bulkDelete()"
                >
                  <span class="inline-flex h-5 w-5 items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2 w-3.5 h-3.5 sm:w-4 sm:h-4"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" x2="10" y1="11" y2="17"></line><line x1="14" x2="14" y1="11" y2="17"></line></svg>
                  </span>
                  Delete
                </button>
              </div>
              </div>
            </div>

            <div class="flex-1 overflow-x-scroll overflow-y-auto pb-2 pt-0  border border-border bg-background/40 shadow-sm rounded-lg ms-4">
              <div class="relative overflow-visible">
                <table class="w-full min-w-max table-fixed text-sm">
            <thead class="relative z-10 bg-card/90 text-left text-xs uppercase tracking-wide backdrop-blur">
              <tr>
                <th
                  class="sticky top-0 z-0 bg-card/95 px-4 py-3 text-left w-[40px]"
                >
                  <input
                    type="checkbox"
                    class="h-4 w-4 accent-emerald-500"
                    [checked]="allVisibleSelected(visible)"
                    (change)="toggleSelectVisible(visible)"
                  />
                </th>
                <th
                  *ngIf="isColumnVisible('image')"
                  class="sticky top-0 z-0 bg-card/95 relative px-4 py-3"
                  [style.width.px]="columnWidth('image')"
                  (dragover)="allowColumnDrop($event)"
                  (drop)="onColumnDrop('image')"
                >
                  <span
                    class="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab rounded px-1 py-0.5 text-muted-foreground/70 text-[10px] opacity-60 hover:bg-muted hover:opacity-100"
                    draggable="true"
                    title="Drag to reorder"
                    (dragstart)="startColumnDrag('image', $event)"
                    (dragend)="endColumnDrag()"
                  >
                    <svg viewBox="0 0 12 12" fill="currentColor" class="h-3 w-3">
                      <circle cx="3" cy="3" r="1" />
                      <circle cx="9" cy="3" r="1" />
                      <circle cx="3" cy="6" r="1" />
                      <circle cx="9" cy="6" r="1" />
                      <circle cx="3" cy="9" r="1" />
                      <circle cx="9" cy="9" r="1" />
                    </svg>
                  </span>
                  <span [attr.data-tooltip]="columnTooltip('image')">Image</span>
                  <span
                    class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                    (mousedown)="startResize($event, 'image')"
                  ></span>
                </th>
                <th
                  *ngIf="isColumnVisible('name')"
                  class="sticky top-0 z-0 bg-card/95 relative px-4 py-3"
                  [style.width.px]="columnWidth('name')"
                  (dragover)="allowColumnDrop($event)"
                  (drop)="onColumnDrop('name')"
                >
                  <span
                    class="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab rounded px-1 py-0.5 text-muted-foreground/70 text-[10px] opacity-60 hover:bg-muted hover:opacity-100"
                    draggable="true"
                    title="Drag to reorder"
                    (dragstart)="startColumnDrag('name', $event)"
                    (dragend)="endColumnDrag()"
                  >
                    <svg viewBox="0 0 12 12" fill="currentColor" class="h-3 w-3">
                      <circle cx="3" cy="3" r="1" />
                      <circle cx="9" cy="3" r="1" />
                      <circle cx="3" cy="6" r="1" />
                      <circle cx="9" cy="6" r="1" />
                      <circle cx="3" cy="9" r="1" />
                      <circle cx="9" cy="9" r="1" />
                    </svg>
                  </span>
                  <button
                    type="button"
                    class="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    (click)="setSort('name')"
                  >
                    <span [attr.data-tooltip]="columnTooltip('name')">Product Name</span>
                    <span class="text-[10px]">{{ sortIcon('name') }}</span>
                  </button>
                  <span
                    class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                    (mousedown)="startResize($event, 'name')"
                  ></span>
                </th>
                <th
                  *ngIf="isColumnVisible('productType')"
                  class="sticky top-0 z-0 bg-card/95 relative px-4 py-3"
                  [style.width.px]="columnWidth('productType')"
                  (dragover)="allowColumnDrop($event)"
                  (drop)="onColumnDrop('productType')"
                >
                  <span
                    class="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab rounded px-1 py-0.5 text-muted-foreground/70 text-[10px] opacity-60 hover:bg-muted hover:opacity-100"
                    draggable="true"
                    title="Drag to reorder"
                    (dragstart)="startColumnDrag('productType', $event)"
                    (dragend)="endColumnDrag()"
                  >
                    <svg viewBox="0 0 12 12" fill="currentColor" class="h-3 w-3">
                      <circle cx="3" cy="3" r="1" />
                      <circle cx="9" cy="3" r="1" />
                      <circle cx="3" cy="6" r="1" />
                      <circle cx="9" cy="6" r="1" />
                      <circle cx="3" cy="9" r="1" />
                      <circle cx="9" cy="9" r="1" />
                    </svg>
                  </span>
                  <button
                    type="button"
                    class="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    (click)="setSort('productType')"
                  >
                    <span [attr.data-tooltip]="columnTooltip('productType')">Type</span>
                    <span class="text-[10px]">{{ sortIcon('productType') }}</span>
                  </button>
                  <span
                    class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                    (mousedown)="startResize($event, 'productType')"
                  ></span>
                </th>
                <th
                  *ngIf="isColumnVisible('tags')"
                  class="sticky top-0 z-0 bg-card/95 relative px-4 py-3"
                  [style.width.px]="columnWidth('tags')"
                  (dragover)="allowColumnDrop($event)"
                  (drop)="onColumnDrop('tags')"
                >
                  <span
                    class="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab rounded px-1 py-0.5 text-muted-foreground/70 text-[10px] opacity-60 hover:bg-muted hover:opacity-100"
                    draggable="true"
                    title="Drag to reorder"
                    (dragstart)="startColumnDrag('tags', $event)"
                    (dragend)="endColumnDrag()"
                  >
                    <svg viewBox="0 0 12 12" fill="currentColor" class="h-3 w-3">
                      <circle cx="3" cy="3" r="1" />
                      <circle cx="9" cy="3" r="1" />
                      <circle cx="3" cy="6" r="1" />
                      <circle cx="9" cy="6" r="1" />
                      <circle cx="3" cy="9" r="1" />
                      <circle cx="9" cy="9" r="1" />
                    </svg>
                  </span>
                  <span [attr.data-tooltip]="columnTooltip('tags')">Tags</span>
                  <span
                    class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                    (mousedown)="startResize($event, 'tags')"
                  ></span>
                </th>
                <th
                  *ngIf="isColumnVisible('offers')"
                  class="sticky top-0 z-0 bg-card/95 relative px-4 py-3"
                  [style.width.px]="columnWidth('offers')"
                  (dragover)="allowColumnDrop($event)"
                  (drop)="onColumnDrop('offers')"
                >
                  <span
                    class="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab rounded px-1 py-0.5 text-muted-foreground/70 text-[10px] opacity-60 hover:bg-muted hover:opacity-100"
                    draggable="true"
                    title="Drag to reorder"
                    (dragstart)="startColumnDrag('offers', $event)"
                    (dragend)="endColumnDrag()"
                  >
                    <svg viewBox="0 0 12 12" fill="currentColor" class="h-3 w-3">
                      <circle cx="3" cy="3" r="1" />
                      <circle cx="9" cy="3" r="1" />
                      <circle cx="3" cy="6" r="1" />
                      <circle cx="9" cy="6" r="1" />
                      <circle cx="3" cy="9" r="1" />
                      <circle cx="9" cy="9" r="1" />
                    </svg>
                  </span>
                  <span [attr.data-tooltip]="columnTooltip('offers')">Offers</span>
                  <span
                    class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                    (mousedown)="startResize($event, 'offers')"
                  ></span>
                </th>
                <th
                  *ngIf="isColumnVisible('sku')"
                  class="sticky top-0 z-0 bg-card/95 relative px-4 py-3"
                  [style.width.px]="columnWidth('sku')"
                  (dragover)="allowColumnDrop($event)"
                  (drop)="onColumnDrop('sku')"
                >
                  <span
                    class="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab rounded px-1 py-0.5 text-muted-foreground/70 text-[10px] opacity-60 hover:bg-muted hover:opacity-100"
                    draggable="true"
                    title="Drag to reorder"
                    (dragstart)="startColumnDrag('sku', $event)"
                    (dragend)="endColumnDrag()"
                  >
                    <svg viewBox="0 0 12 12" fill="currentColor" class="h-3 w-3">
                      <circle cx="3" cy="3" r="1" />
                      <circle cx="9" cy="3" r="1" />
                      <circle cx="3" cy="6" r="1" />
                      <circle cx="9" cy="6" r="1" />
                      <circle cx="3" cy="9" r="1" />
                      <circle cx="9" cy="9" r="1" />
                    </svg>
                  </span>
                  <button
                    type="button"
                    class="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    (click)="setSort('sku')"
                  >
                    <span [attr.data-tooltip]="columnTooltip('sku')">SKU</span>
                    <span class="text-[10px]">{{ sortIcon('sku') }}</span>
                  </button>
                  <span
                    class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                    (mousedown)="startResize($event, 'sku')"
                  ></span>
                </th>
                <th
                  *ngIf="isColumnVisible('vendor')"
                  class="sticky top-0 z-0 bg-card/95 relative px-4 py-3"
                  [style.width.px]="columnWidth('vendor')"
                  (dragover)="allowColumnDrop($event)"
                  (drop)="onColumnDrop('vendor')"
                >
                  <span
                    class="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab rounded px-1 py-0.5 text-muted-foreground/70 text-[10px] opacity-60 hover:bg-muted hover:opacity-100"
                    draggable="true"
                    title="Drag to reorder"
                    (dragstart)="startColumnDrag('vendor', $event)"
                    (dragend)="endColumnDrag()"
                  >
                    <svg viewBox="0 0 12 12" fill="currentColor" class="h-3 w-3">
                      <circle cx="3" cy="3" r="1" />
                      <circle cx="9" cy="3" r="1" />
                      <circle cx="3" cy="6" r="1" />
                      <circle cx="9" cy="6" r="1" />
                      <circle cx="3" cy="9" r="1" />
                      <circle cx="9" cy="9" r="1" />
                    </svg>
                  </span>
                  <button
                    type="button"
                    class="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    (click)="setSort('vendor')"
                  >
                    <span [attr.data-tooltip]="columnTooltip('vendor')">Vendor</span>
                    <span class="text-[10px]">{{ sortIcon('vendor') }}</span>
                  </button>
                  <span
                    class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                    (mousedown)="startResize($event, 'vendor')"
                  ></span>
                </th>
                <th
                  *ngIf="isColumnVisible('brand')"
                  class="sticky top-0 z-0 bg-card/95 relative px-4 py-3"
                  [style.width.px]="columnWidth('brand')"
                  (dragover)="allowColumnDrop($event)"
                  (drop)="onColumnDrop('brand')"
                >
                  <span
                    class="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab rounded px-1 py-0.5 text-muted-foreground/70 text-[10px] opacity-60 hover:bg-muted hover:opacity-100"
                    draggable="true"
                    title="Drag to reorder"
                    (dragstart)="startColumnDrag('brand', $event)"
                    (dragend)="endColumnDrag()"
                  >
                    <svg viewBox="0 0 12 12" fill="currentColor" class="h-3 w-3">
                      <circle cx="3" cy="3" r="1" />
                      <circle cx="9" cy="3" r="1" />
                      <circle cx="3" cy="6" r="1" />
                      <circle cx="9" cy="6" r="1" />
                      <circle cx="3" cy="9" r="1" />
                      <circle cx="9" cy="9" r="1" />
                    </svg>
                  </span>
                  <button
                    type="button"
                    class="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    (click)="setSort('brand')"
                  >
                    <span [attr.data-tooltip]="columnTooltip('brand')">Brand</span>
                    <span class="text-[10px]">{{ sortIcon('brand') }}</span>
                  </button>
                  <span
                    class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                    (mousedown)="startResize($event, 'brand')"
                  ></span>
                </th>
                <th
                  *ngIf="isColumnVisible('productId')"
                  class="sticky top-0 z-0 bg-card/95 relative px-4 py-3"
                  [style.width.px]="columnWidth('productId')"
                  (dragover)="allowColumnDrop($event)"
                  (drop)="onColumnDrop('productId')"
                >
                  <span
                    class="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab rounded px-1 py-0.5 text-muted-foreground/70 text-[10px] opacity-60 hover:bg-muted hover:opacity-100"
                    draggable="true"
                    title="Drag to reorder"
                    (dragstart)="startColumnDrag('productId', $event)"
                    (dragend)="endColumnDrag()"
                  >
                    <svg viewBox="0 0 12 12" fill="currentColor" class="h-3 w-3">
                      <circle cx="3" cy="3" r="1" />
                      <circle cx="9" cy="3" r="1" />
                      <circle cx="3" cy="6" r="1" />
                      <circle cx="9" cy="6" r="1" />
                      <circle cx="3" cy="9" r="1" />
                      <circle cx="9" cy="9" r="1" />
                    </svg>
                  </span>
                  <button
                    type="button"
                    class="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    (click)="setSort('productId')"
                  >
                    <span [attr.data-tooltip]="columnTooltip('productId')">Product ID</span>
                    <span class="text-[10px]">{{ sortIcon('productId') }}</span>
                  </button>
                  <span
                    class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                    (mousedown)="startResize($event, 'productId')"
                  ></span>
                </th>
                <th
                  *ngIf="isColumnVisible('variationId')"
                  class="sticky top-0 z-0 bg-card/95 relative px-4 py-3"
                  [style.width.px]="columnWidth('variationId')"
                  (dragover)="allowColumnDrop($event)"
                  (drop)="onColumnDrop('variationId')"
                >
                  <span
                    class="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab rounded px-1 py-0.5 text-muted-foreground/70 text-[10px] opacity-60 hover:bg-muted hover:opacity-100"
                    draggable="true"
                    title="Drag to reorder"
                    (dragstart)="startColumnDrag('variationId', $event)"
                    (dragend)="endColumnDrag()"
                  >
                    <svg viewBox="0 0 12 12" fill="currentColor" class="h-3 w-3">
                      <circle cx="3" cy="3" r="1" />
                      <circle cx="9" cy="3" r="1" />
                      <circle cx="3" cy="6" r="1" />
                      <circle cx="9" cy="6" r="1" />
                      <circle cx="3" cy="9" r="1" />
                      <circle cx="9" cy="9" r="1" />
                    </svg>
                  </span>
                  <button
                    type="button"
                    class="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    (click)="setSort('variationId')"
                  >
                    <span [attr.data-tooltip]="columnTooltip('variationId')">Variation ID</span>
                    <span class="text-[10px]">{{ sortIcon('variationId') }}</span>
                  </button>
                  <span
                    class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                    (mousedown)="startResize($event, 'variationId')"
                  ></span>
                </th>
                <th
                  *ngIf="isColumnVisible('mpn')"
                  class="sticky top-0 z-0 bg-card/95 relative px-4 py-3"
                  [style.width.px]="columnWidth('mpn')"
                  (dragover)="allowColumnDrop($event)"
                  (drop)="onColumnDrop('mpn')"
                >
                  <span
                    class="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab rounded px-1 py-0.5 text-muted-foreground/70 text-[10px] opacity-60 hover:bg-muted hover:opacity-100"
                    draggable="true"
                    title="Drag to reorder"
                    (dragstart)="startColumnDrag('mpn', $event)"
                    (dragend)="endColumnDrag()"
                  >
                    <svg viewBox="0 0 12 12" fill="currentColor" class="h-3 w-3">
                      <circle cx="3" cy="3" r="1" />
                      <circle cx="9" cy="3" r="1" />
                      <circle cx="3" cy="6" r="1" />
                      <circle cx="9" cy="6" r="1" />
                      <circle cx="3" cy="9" r="1" />
                      <circle cx="9" cy="9" r="1" />
                    </svg>
                  </span>
                  <button
                    type="button"
                    class="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    (click)="setSort('mpn')"
                  >
                    <span [attr.data-tooltip]="columnTooltip('mpn')">MPN</span>
                    <span class="text-[10px]">{{ sortIcon('mpn') }}</span>
                  </button>
                  <span
                    class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                    (mousedown)="startResize($event, 'mpn')"
                  ></span>
                </th>
                <th
                  *ngIf="isColumnVisible('asin')"
                  class="sticky top-0 z-0 bg-card/95 relative px-4 py-3"
                  [style.width.px]="columnWidth('asin')"
                  (dragover)="allowColumnDrop($event)"
                  (drop)="onColumnDrop('asin')"
                >
                  <span
                    class="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab rounded px-1 py-0.5 text-muted-foreground/70 text-[10px] opacity-60 hover:bg-muted hover:opacity-100"
                    draggable="true"
                    title="Drag to reorder"
                    (dragstart)="startColumnDrag('asin', $event)"
                    (dragend)="endColumnDrag()"
                  >
                    <svg viewBox="0 0 12 12" fill="currentColor" class="h-3 w-3">
                      <circle cx="3" cy="3" r="1" />
                      <circle cx="9" cy="3" r="1" />
                      <circle cx="3" cy="6" r="1" />
                      <circle cx="9" cy="6" r="1" />
                      <circle cx="3" cy="9" r="1" />
                      <circle cx="9" cy="9" r="1" />
                    </svg>
                  </span>
                  <button
                    type="button"
                    class="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    (click)="setSort('asin')"
                  >
                    <span [attr.data-tooltip]="columnTooltip('asin')">ASIN</span>
                    <span class="text-[10px]">{{ sortIcon('asin') }}</span>
                  </button>
                  <span
                    class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                    (mousedown)="startResize($event, 'asin')"
                  ></span>
                </th>
                <th
                  *ngIf="isColumnVisible('fnsku')"
                  class="sticky top-0 z-0 bg-card/95 relative px-4 py-3"
                  [style.width.px]="columnWidth('fnsku')"
                  (dragover)="allowColumnDrop($event)"
                  (drop)="onColumnDrop('fnsku')"
                >
                  <span
                    class="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab rounded px-1 py-0.5 text-muted-foreground/70 text-[10px] opacity-60 hover:bg-muted hover:opacity-100"
                    draggable="true"
                    title="Drag to reorder"
                    (dragstart)="startColumnDrag('fnsku', $event)"
                    (dragend)="endColumnDrag()"
                  >
                    <svg viewBox="0 0 12 12" fill="currentColor" class="h-3 w-3">
                      <circle cx="3" cy="3" r="1" />
                      <circle cx="9" cy="3" r="1" />
                      <circle cx="3" cy="6" r="1" />
                      <circle cx="9" cy="6" r="1" />
                      <circle cx="3" cy="9" r="1" />
                      <circle cx="9" cy="9" r="1" />
                    </svg>
                  </span>
                  <button
                    type="button"
                    class="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    (click)="setSort('fnsku')"
                  >
                    <span [attr.data-tooltip]="columnTooltip('fnsku')">FNSKU</span>
                    <span class="text-[10px]">{{ sortIcon('fnsku') }}</span>
                  </button>
                  <span
                    class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                    (mousedown)="startResize($event, 'fnsku')"
                  ></span>
                </th>
                <th
                  *ngIf="isColumnVisible('gtin')"
                  class="sticky top-0 z-0 bg-card/95 relative px-4 py-3"
                  [style.width.px]="columnWidth('gtin')"
                  (dragover)="allowColumnDrop($event)"
                  (drop)="onColumnDrop('gtin')"
                >
                  <span
                    class="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab rounded px-1 py-0.5 text-muted-foreground/70 text-[10px] opacity-60 hover:bg-muted hover:opacity-100"
                    draggable="true"
                    title="Drag to reorder"
                    (dragstart)="startColumnDrag('gtin', $event)"
                    (dragend)="endColumnDrag()"
                  >
                    <svg viewBox="0 0 12 12" fill="currentColor" class="h-3 w-3">
                      <circle cx="3" cy="3" r="1" />
                      <circle cx="9" cy="3" r="1" />
                      <circle cx="3" cy="6" r="1" />
                      <circle cx="9" cy="6" r="1" />
                      <circle cx="3" cy="9" r="1" />
                      <circle cx="9" cy="9" r="1" />
                    </svg>
                  </span>
                  <button
                    type="button"
                    class="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    (click)="setSort('gtin')"
                  >
                    <span [attr.data-tooltip]="columnTooltip('gtin')">GTIN</span>
                    <span class="text-[10px]">{{ sortIcon('gtin') }}</span>
                  </button>
                  <span
                    class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                    (mousedown)="startResize($event, 'gtin')"
                  ></span>
                </th>
                <th
                  *ngIf="isColumnVisible('ean')"
                  class="sticky top-0 z-0 bg-card/95 relative px-4 py-3"
                  [style.width.px]="columnWidth('ean')"
                  (dragover)="allowColumnDrop($event)"
                  (drop)="onColumnDrop('ean')"
                >
                  <span
                    class="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab rounded px-1 py-0.5 text-muted-foreground/70 text-[10px] opacity-60 hover:bg-muted hover:opacity-100"
                    draggable="true"
                    title="Drag to reorder"
                    (dragstart)="startColumnDrag('ean', $event)"
                    (dragend)="endColumnDrag()"
                  >
                    <svg viewBox="0 0 12 12" fill="currentColor" class="h-3 w-3">
                      <circle cx="3" cy="3" r="1" />
                      <circle cx="9" cy="3" r="1" />
                      <circle cx="3" cy="6" r="1" />
                      <circle cx="9" cy="6" r="1" />
                      <circle cx="3" cy="9" r="1" />
                      <circle cx="9" cy="9" r="1" />
                    </svg>
                  </span>
                  <button
                    type="button"
                    class="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    (click)="setSort('ean')"
                  >
                    <span [attr.data-tooltip]="columnTooltip('ean')">EAN</span>
                    <span class="text-[10px]">{{ sortIcon('ean') }}</span>
                  </button>
                  <span
                    class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                    (mousedown)="startResize($event, 'ean')"
                  ></span>
                </th>
                <th
                  *ngIf="isColumnVisible('isbn')"
                  class="sticky top-0 z-0 bg-card/95 relative px-4 py-3"
                  [style.width.px]="columnWidth('isbn')"
                  (dragover)="allowColumnDrop($event)"
                  (drop)="onColumnDrop('isbn')"
                >
                  <span
                    class="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab rounded px-1 py-0.5 text-muted-foreground/70 text-[10px] opacity-60 hover:bg-muted hover:opacity-100"
                    draggable="true"
                    title="Drag to reorder"
                    (dragstart)="startColumnDrag('isbn', $event)"
                    (dragend)="endColumnDrag()"
                  >
                    <svg viewBox="0 0 12 12" fill="currentColor" class="h-3 w-3">
                      <circle cx="3" cy="3" r="1" />
                      <circle cx="9" cy="3" r="1" />
                      <circle cx="3" cy="6" r="1" />
                      <circle cx="9" cy="6" r="1" />
                      <circle cx="3" cy="9" r="1" />
                      <circle cx="9" cy="9" r="1" />
                    </svg>
                  </span>
                  <button
                    type="button"
                    class="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    (click)="setSort('isbn')"
                  >
                    <span [attr.data-tooltip]="columnTooltip('isbn')">ISBN</span>
                    <span class="text-[10px]">{{ sortIcon('isbn') }}</span>
                  </button>
                  <span
                    class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                    (mousedown)="startResize($event, 'isbn')"
                  ></span>
                </th>
                <th
                  *ngIf="isColumnVisible('landedCost')"
                  class="sticky top-0 z-0 bg-card/95 relative px-4 py-3 text-right"
                  [style.width.px]="columnWidth('landedCost')"
                  (dragover)="allowColumnDrop($event)"
                  (drop)="onColumnDrop('landedCost')"
                >
                  <span
                    class="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab rounded px-1 py-0.5 text-muted-foreground/70 text-[10px] opacity-60 hover:bg-muted hover:opacity-100"
                    draggable="true"
                    title="Drag to reorder"
                    (dragstart)="startColumnDrag('landedCost', $event)"
                    (dragend)="endColumnDrag()"
                  >
                    <svg viewBox="0 0 12 12" fill="currentColor" class="h-3 w-3">
                      <circle cx="3" cy="3" r="1" />
                      <circle cx="9" cy="3" r="1" />
                      <circle cx="3" cy="6" r="1" />
                      <circle cx="9" cy="6" r="1" />
                      <circle cx="3" cy="9" r="1" />
                      <circle cx="9" cy="9" r="1" />
                    </svg>
                  </span>
                  <button
                    type="button"
                    class="flex w-full items-center justify-end gap-2 text-muted-foreground hover:text-foreground"
                    (click)="setSort('landedCost')"
                  >
                    <span [attr.data-tooltip]="columnTooltip('landedCost')">Landed Cost</span>
                    <span class="text-[10px]">{{ sortIcon('landedCost') }}</span>
                  </button>
                  <span
                    class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                    (mousedown)="startResize($event, 'landedCost')"
                  ></span>
                </th>
                <th
                  *ngIf="isColumnVisible('shippingCost')"
                  class="sticky top-0 z-0 bg-card/95 relative px-4 py-3 text-right"
                  [style.width.px]="columnWidth('shippingCost')"
                  (dragover)="allowColumnDrop($event)"
                  (drop)="onColumnDrop('shippingCost')"
                >
                  <span
                    class="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab rounded px-1 py-0.5 text-muted-foreground/70 text-[10px] opacity-60 hover:bg-muted hover:opacity-100"
                    draggable="true"
                    title="Drag to reorder"
                    (dragstart)="startColumnDrag('shippingCost', $event)"
                    (dragend)="endColumnDrag()"
                  >
                    <svg viewBox="0 0 12 12" fill="currentColor" class="h-3 w-3">
                      <circle cx="3" cy="3" r="1" />
                      <circle cx="9" cy="3" r="1" />
                      <circle cx="3" cy="6" r="1" />
                      <circle cx="9" cy="6" r="1" />
                      <circle cx="3" cy="9" r="1" />
                      <circle cx="9" cy="9" r="1" />
                    </svg>
                  </span>
                  <button
                    type="button"
                    class="flex w-full items-center justify-end gap-2 text-muted-foreground hover:text-foreground"
                    (click)="setSort('shippingCost')"
                  >
                    <span [attr.data-tooltip]="columnTooltip('shippingCost')">Shipping</span>
                    <span class="text-[10px]">{{ sortIcon('shippingCost') }}</span>
                  </button>
                  <span
                    class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                    (mousedown)="startResize($event, 'shippingCost')"
                  ></span>
                </th>
                <th
                  *ngIf="isColumnVisible('salePrice')"
                  class="sticky top-0 z-0 bg-card/95 relative px-4 py-3 text-right"
                  [style.width.px]="columnWidth('salePrice')"
                  (dragover)="allowColumnDrop($event)"
                  (drop)="onColumnDrop('salePrice')"
                >
                  <span
                    class="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab rounded px-1 py-0.5 text-muted-foreground/70 text-[10px] opacity-60 hover:bg-muted hover:opacity-100"
                    draggable="true"
                    title="Drag to reorder"
                    (dragstart)="startColumnDrag('salePrice', $event)"
                    (dragend)="endColumnDrag()"
                  >
                    <svg viewBox="0 0 12 12" fill="currentColor" class="h-3 w-3">
                      <circle cx="3" cy="3" r="1" />
                      <circle cx="9" cy="3" r="1" />
                      <circle cx="3" cy="6" r="1" />
                      <circle cx="9" cy="6" r="1" />
                      <circle cx="3" cy="9" r="1" />
                      <circle cx="9" cy="9" r="1" />
                    </svg>
                  </span>
                  <button
                    type="button"
                    class="flex w-full items-center justify-end gap-2 text-muted-foreground hover:text-foreground"
                    (click)="setSort('salePrice')"
                  >
                    <span [attr.data-tooltip]="columnTooltip('salePrice')">Sale Price</span>
                    <span class="text-[10px]">{{ sortIcon('salePrice') }}</span>
                  </button>
                  <span
                    class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                    (mousedown)="startResize($event, 'salePrice')"
                  ></span>
                </th>
                <th
                  *ngIf="isColumnVisible('purchaseQty')"
                  class="sticky top-0 z-0 bg-card/95 relative px-4 py-3 text-right"
                  [style.width.px]="columnWidth('purchaseQty')"
                  (dragover)="allowColumnDrop($event)"
                  (drop)="onColumnDrop('purchaseQty')"
                >
                  <span
                    class="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab rounded px-1 py-0.5 text-muted-foreground/70 text-[10px] opacity-60 hover:bg-muted hover:opacity-100"
                    draggable="true"
                    title="Drag to reorder"
                    (dragstart)="startColumnDrag('purchaseQty', $event)"
                    (dragend)="endColumnDrag()"
                  >
                    <svg viewBox="0 0 12 12" fill="currentColor" class="h-3 w-3">
                      <circle cx="3" cy="3" r="1" />
                      <circle cx="9" cy="3" r="1" />
                      <circle cx="3" cy="6" r="1" />
                      <circle cx="9" cy="6" r="1" />
                      <circle cx="3" cy="9" r="1" />
                      <circle cx="9" cy="9" r="1" />
                    </svg>
                  </span>
                  <button
                    type="button"
                    class="flex w-full items-center justify-end gap-2 text-muted-foreground hover:text-foreground"
                    (click)="setSort('purchaseQty')"
                  >
                    <span [attr.data-tooltip]="columnTooltip('purchaseQty')">Purchased</span>
                    <span class="text-[10px]">{{ sortIcon('purchaseQty') }}</span>
                  </button>
                  <span
                    class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                    (mousedown)="startResize($event, 'purchaseQty')"
                  ></span>
                </th>
                <th
                  *ngIf="isColumnVisible('soldQty')"
                  class="sticky top-0 z-0 bg-card/95 relative px-4 py-3 text-right"
                  [style.width.px]="columnWidth('soldQty')"
                  (dragover)="allowColumnDrop($event)"
                  (drop)="onColumnDrop('soldQty')"
                >
                  <span
                    class="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab rounded px-1 py-0.5 text-muted-foreground/70 text-[10px] opacity-60 hover:bg-muted hover:opacity-100"
                    draggable="true"
                    title="Drag to reorder"
                    (dragstart)="startColumnDrag('soldQty', $event)"
                    (dragend)="endColumnDrag()"
                  >
                    <svg viewBox="0 0 12 12" fill="currentColor" class="h-3 w-3">
                      <circle cx="3" cy="3" r="1" />
                      <circle cx="9" cy="3" r="1" />
                      <circle cx="3" cy="6" r="1" />
                      <circle cx="9" cy="6" r="1" />
                      <circle cx="3" cy="9" r="1" />
                      <circle cx="9" cy="9" r="1" />
                    </svg>
                  </span>
                  <button
                    type="button"
                    class="flex w-full items-center justify-end gap-2 text-muted-foreground hover:text-foreground"
                    (click)="setSort('soldQty')"
                  >
                    <span [attr.data-tooltip]="columnTooltip('soldQty')">Sold</span>
                    <span class="text-[10px]">{{ sortIcon('soldQty') }}</span>
                  </button>
                  <span
                    class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                    (mousedown)="startResize($event, 'soldQty')"
                  ></span>
                </th>
                <th
                  *ngIf="isColumnVisible('stockQty')"
                  class="sticky top-0 z-0 bg-card/95 relative px-4 py-3 text-right"
                  [style.width.px]="columnWidth('stockQty')"
                  (dragover)="allowColumnDrop($event)"
                  (drop)="onColumnDrop('stockQty')"
                >
                  <span
                    class="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab rounded px-1 py-0.5 text-muted-foreground/70 text-[10px] opacity-60 hover:bg-muted hover:opacity-100"
                    draggable="true"
                    title="Drag to reorder"
                    (dragstart)="startColumnDrag('stockQty', $event)"
                    (dragend)="endColumnDrag()"
                  >
                    <svg viewBox="0 0 12 12" fill="currentColor" class="h-3 w-3">
                      <circle cx="3" cy="3" r="1" />
                      <circle cx="9" cy="3" r="1" />
                      <circle cx="3" cy="6" r="1" />
                      <circle cx="9" cy="6" r="1" />
                      <circle cx="3" cy="9" r="1" />
                      <circle cx="9" cy="9" r="1" />
                    </svg>
                  </span>
                  <button
                    type="button"
                    class="flex w-full items-center justify-end gap-2 text-muted-foreground hover:text-foreground"
                    (click)="setSort('stockQty')"
                  >
                    <span [attr.data-tooltip]="columnTooltip('stockQty')">In Stock</span>
                    <span class="text-[10px]">{{ sortIcon('stockQty') }}</span>
                  </button>
                  <span
                    class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                    (mousedown)="startResize($event, 'stockQty')"
                  ></span>
                </th>
                <th
                  *ngIf="isColumnVisible('returnQty')"
                  class="sticky top-0 z-0 bg-card/95 relative px-4 py-3 text-right"
                  [style.width.px]="columnWidth('returnQty')"
                  (dragover)="allowColumnDrop($event)"
                  (drop)="onColumnDrop('returnQty')"
                >
                  <span
                    class="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab rounded px-1 py-0.5 text-muted-foreground/70 text-[10px] opacity-60 hover:bg-muted hover:opacity-100"
                    draggable="true"
                    title="Drag to reorder"
                    (dragstart)="startColumnDrag('returnQty', $event)"
                    (dragend)="endColumnDrag()"
                  >
                    <svg viewBox="0 0 12 12" fill="currentColor" class="h-3 w-3">
                      <circle cx="3" cy="3" r="1" />
                      <circle cx="9" cy="3" r="1" />
                      <circle cx="3" cy="6" r="1" />
                      <circle cx="9" cy="6" r="1" />
                      <circle cx="3" cy="9" r="1" />
                      <circle cx="9" cy="9" r="1" />
                    </svg>
                  </span>
                  <button
                    type="button"
                    class="flex w-full items-center justify-end gap-2 text-muted-foreground hover:text-foreground"
                    (click)="setSort('returnQty')"
                  >
                    <span [attr.data-tooltip]="columnTooltip('returnQty')">Returns</span>
                    <span class="text-[10px]">{{ sortIcon('returnQty') }}</span>
                  </button>
                  <span
                    class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                    (mousedown)="startResize($event, 'returnQty')"
                  ></span>
                </th>
                <th
                  *ngIf="isColumnVisible('profitMargin')"
                  class="sticky top-0 z-0 bg-card/95 relative px-4 py-3 text-right"
                  [style.width.px]="columnWidth('profitMargin')"
                  (dragover)="allowColumnDrop($event)"
                  (drop)="onColumnDrop('profitMargin')"
                >
                  <span
                    class="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab rounded px-1 py-0.5 text-muted-foreground/70 text-[10px] opacity-60 hover:bg-muted hover:opacity-100"
                    draggable="true"
                    title="Drag to reorder"
                    (dragstart)="startColumnDrag('profitMargin', $event)"
                    (dragend)="endColumnDrag()"
                  >
                    <svg viewBox="0 0 12 12" fill="currentColor" class="h-3 w-3">
                      <circle cx="3" cy="3" r="1" />
                      <circle cx="9" cy="3" r="1" />
                      <circle cx="3" cy="6" r="1" />
                      <circle cx="9" cy="6" r="1" />
                      <circle cx="3" cy="9" r="1" />
                      <circle cx="9" cy="9" r="1" />
                    </svg>
                  </span>
                  <button
                    type="button"
                    class="flex w-full items-center justify-end gap-2 text-muted-foreground hover:text-foreground"
                    (click)="setSort('profitMargin')"
                  >
                    <span [attr.data-tooltip]="columnTooltip('profitMargin')">Margin %</span>
                    <span class="text-[10px]">{{ sortIcon('profitMargin') }}</span>
                  </button>
                  <span
                    class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                    (mousedown)="startResize($event, 'profitMargin')"
                  ></span>
                </th>
                <th
                  *ngIf="isColumnVisible('profitAmount')"
                  class="sticky top-0 z-0 bg-card/95 relative px-4 py-3 text-right"
                  [style.width.px]="columnWidth('profitAmount')"
                  (dragover)="allowColumnDrop($event)"
                  (drop)="onColumnDrop('profitAmount')"
                >
                  <span
                    class="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab rounded px-1 py-0.5 text-muted-foreground/70 text-[10px] opacity-60 hover:bg-muted hover:opacity-100"
                    draggable="true"
                    title="Drag to reorder"
                    (dragstart)="startColumnDrag('profitAmount', $event)"
                    (dragend)="endColumnDrag()"
                  >
                    <svg viewBox="0 0 12 12" fill="currentColor" class="h-3 w-3">
                      <circle cx="3" cy="3" r="1" />
                      <circle cx="9" cy="3" r="1" />
                      <circle cx="3" cy="6" r="1" />
                      <circle cx="9" cy="6" r="1" />
                      <circle cx="3" cy="9" r="1" />
                      <circle cx="9" cy="9" r="1" />
                    </svg>
                  </span>
                  <button
                    type="button"
                    class="flex w-full items-center justify-end gap-2 text-muted-foreground hover:text-foreground"
                    (click)="setSort('profitAmount')"
                  >
                    <span [attr.data-tooltip]="columnTooltip('profitAmount')">Profit $</span>
                    <span class="text-[10px]">{{ sortIcon('profitAmount') }}</span>
                  </button>
                  <span
                    class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                    (mousedown)="startResize($event, 'profitAmount')"
                  ></span>
                </th>
                <th
                  *ngIf="isColumnVisible('velocity')"
                  class="sticky top-0 z-0 bg-card/95 relative px-4 py-3 text-right"
                  [style.width.px]="columnWidth('velocity')"
                  (dragover)="allowColumnDrop($event)"
                  (drop)="onColumnDrop('velocity')"
                >
                  <span
                    class="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab rounded px-1 py-0.5 text-muted-foreground/70 text-[10px] opacity-60 hover:bg-muted hover:opacity-100"
                    draggable="true"
                    title="Drag to reorder"
                    (dragstart)="startColumnDrag('velocity', $event)"
                    (dragend)="endColumnDrag()"
                  >
                    <svg viewBox="0 0 12 12" fill="currentColor" class="h-3 w-3">
                      <circle cx="3" cy="3" r="1" />
                      <circle cx="9" cy="3" r="1" />
                      <circle cx="3" cy="6" r="1" />
                      <circle cx="9" cy="6" r="1" />
                      <circle cx="3" cy="9" r="1" />
                      <circle cx="9" cy="9" r="1" />
                    </svg>
                  </span>
                  <button
                    type="button"
                    class="flex w-full items-center justify-end gap-2 text-muted-foreground hover:text-foreground"
                    (click)="setSort('velocity')"
                  >
                    <span [attr.data-tooltip]="columnTooltip('velocity')">Velocity</span>
                    <span class="text-[10px]">{{ sortIcon('velocity') }}</span>
                  </button>
                  <span
                    class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                    (mousedown)="startResize($event, 'velocity')"
                  ></span>
                </th>
                <th
                  *ngIf="isColumnVisible('stockDays')"
                  class="sticky top-0 z-0 bg-card/95 relative px-4 py-3 text-right"
                  [style.width.px]="columnWidth('stockDays')"
                  (dragover)="allowColumnDrop($event)"
                  (drop)="onColumnDrop('stockDays')"
                >
                  <span
                    class="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab rounded px-1 py-0.5 text-muted-foreground/70 text-[10px] opacity-60 hover:bg-muted hover:opacity-100"
                    draggable="true"
                    title="Drag to reorder"
                    (dragstart)="startColumnDrag('stockDays', $event)"
                    (dragend)="endColumnDrag()"
                  >
                    <svg viewBox="0 0 12 12" fill="currentColor" class="h-3 w-3">
                      <circle cx="3" cy="3" r="1" />
                      <circle cx="9" cy="3" r="1" />
                      <circle cx="3" cy="6" r="1" />
                      <circle cx="9" cy="6" r="1" />
                      <circle cx="3" cy="9" r="1" />
                      <circle cx="9" cy="9" r="1" />
                    </svg>
                  </span>
                  <button
                    type="button"
                    class="flex w-full items-center justify-end gap-2 text-muted-foreground hover:text-foreground"
                    (click)="setSort('stockDays')"
                  >
                    <span [attr.data-tooltip]="columnTooltip('stockDays')">Stock Days</span>
                    <span class="text-[10px]">{{ sortIcon('stockDays') }}</span>
                  </button>
                  <span
                    class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                    (mousedown)="startResize($event, 'stockDays')"
                  ></span>
                </th>
                <th
                  *ngIf="isColumnVisible('restockStatus')"
                  class="sticky top-0 z-0 bg-card/95 relative px-4 py-3"
                  [style.width.px]="columnWidth('restockStatus')"
                  (dragover)="allowColumnDrop($event)"
                  (drop)="onColumnDrop('restockStatus')"
                >
                  <span
                    class="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab rounded px-1 py-0.5 text-muted-foreground/70 text-[10px] opacity-60 hover:bg-muted hover:opacity-100"
                    draggable="true"
                    title="Drag to reorder"
                    (dragstart)="startColumnDrag('restockStatus', $event)"
                    (dragend)="endColumnDrag()"
                  >
                    <svg viewBox="0 0 12 12" fill="currentColor" class="h-3 w-3">
                      <circle cx="3" cy="3" r="1" />
                      <circle cx="9" cy="3" r="1" />
                      <circle cx="3" cy="6" r="1" />
                      <circle cx="9" cy="6" r="1" />
                      <circle cx="3" cy="9" r="1" />
                      <circle cx="9" cy="9" r="1" />
                    </svg>
                  </span>
                  <button
                    type="button"
                    class="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    (click)="setSort('restockStatus')"
                  >
                    <span [attr.data-tooltip]="columnTooltip('restockStatus')">Restock Status</span>
                    <span class="text-[10px]">{{ sortIcon('restockStatus') }}</span>
                  </button>
                  <span
                    class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                    (mousedown)="startResize($event, 'restockStatus')"
                  ></span>
                </th>
                <th
                  *ngIf="isColumnVisible('suggestedRestockQty')"
                  class="sticky top-0 z-0 bg-card/95 relative px-4 py-3 text-right"
                  [style.width.px]="columnWidth('suggestedRestockQty')"
                  (dragover)="allowColumnDrop($event)"
                  (drop)="onColumnDrop('suggestedRestockQty')"
                >
                  <span
                    class="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab rounded px-1 py-0.5 text-muted-foreground/70 text-[10px] opacity-60 hover:bg-muted hover:opacity-100"
                    draggable="true"
                    title="Drag to reorder"
                    (dragstart)="startColumnDrag('suggestedRestockQty', $event)"
                    (dragend)="endColumnDrag()"
                  >
                    <svg viewBox="0 0 12 12" fill="currentColor" class="h-3 w-3">
                      <circle cx="3" cy="3" r="1" />
                      <circle cx="9" cy="3" r="1" />
                      <circle cx="3" cy="6" r="1" />
                      <circle cx="9" cy="6" r="1" />
                      <circle cx="3" cy="9" r="1" />
                      <circle cx="9" cy="9" r="1" />
                    </svg>
                  </span>
                  <button
                    type="button"
                    class="flex w-full items-center justify-end gap-2 text-muted-foreground hover:text-foreground"
                    (click)="setSort('suggestedRestockQty')"
                  >
                    <span [attr.data-tooltip]="columnTooltip('suggestedRestockQty')">Restock Qty</span>
                    <span class="text-[10px]">{{ sortIcon('suggestedRestockQty') }}</span>
                  </button>
                  <span
                    class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                    (mousedown)="startResize($event, 'suggestedRestockQty')"
                  ></span>
                </th>
                <th
                  *ngIf="isColumnVisible('marketplaces')"
                  class="sticky top-0 z-0 bg-card/95 relative px-4 py-3"
                  [style.width.px]="columnWidth('marketplaces')"
                  (dragover)="allowColumnDrop($event)"
                  (drop)="onColumnDrop('marketplaces')"
                >
                  <span
                    class="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab rounded px-1 py-0.5 text-muted-foreground/70 text-[10px] opacity-60 hover:bg-muted hover:opacity-100"
                    draggable="true"
                    title="Drag to reorder"
                    (dragstart)="startColumnDrag('marketplaces', $event)"
                    (dragend)="endColumnDrag()"
                  >
                    <svg viewBox="0 0 12 12" fill="currentColor" class="h-3 w-3">
                      <circle cx="3" cy="3" r="1" />
                      <circle cx="9" cy="3" r="1" />
                      <circle cx="3" cy="6" r="1" />
                      <circle cx="9" cy="6" r="1" />
                      <circle cx="3" cy="9" r="1" />
                      <circle cx="9" cy="9" r="1" />
                    </svg>
                  </span>
                  <button
                    type="button"
                    class="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    (click)="setSort('marketplaces')"
                  >
                    <span [attr.data-tooltip]="columnTooltip('marketplaces')">Marketplaces</span>
                    <span class="text-[10px]">{{ sortIcon('marketplaces') }}</span>
                  </button>
                  <span
                    class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                    (mousedown)="startResize($event, 'marketplaces')"
                  ></span>
                </th>
                <th
                  *ngIf="isColumnVisible('actions')"
                  class="sticky top-0 z-0 bg-card/95 relative px-4 py-3 w-[190px]"
                  
                  (dragover)="allowColumnDrop($event)"
                  (drop)="onColumnDrop('actions')"
                >
                  <span
                    class="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab rounded px-1 py-0.5 text-muted-foreground/70 text-[10px] opacity-60 hover:bg-muted hover:opacity-100"
                    draggable="true"
                    title="Drag to reorder"
                    (dragstart)="startColumnDrag('actions', $event)"
                    (dragend)="endColumnDrag()"
                  >
                    <svg viewBox="0 0 12 12" fill="currentColor" class="h-3 w-3">
                      <circle cx="3" cy="3" r="1" />
                      <circle cx="9" cy="3" r="1" />
                      <circle cx="3" cy="6" r="1" />
                      <circle cx="9" cy="6" r="1" />
                      <circle cx="3" cy="9" r="1" />
                      <circle cx="9" cy="9" r="1" />
                    </svg>
                  </span>
                  <span [attr.data-tooltip]="columnTooltip('actions')">Actions</span>
                  <span
                    class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                    (mousedown)="startResize($event, 'actions')"
                  ></span>
                </th>
              </tr>
            </thead>
            <tbody class="[&_tr:last-child]:border-0">
              <tr
                *ngFor="let product of visible; trackBy: trackById"
                class="relative border-b transition-colors hover:bg-muted/30"
                [ngClass]="{ 'bg-primary/5': isSelected(product.id) }"
                (dblclick)="openProductDialog(product)"
                data-tooltip="Double-click to open details"
              >
                <td class="p-4 align-middle w-10 min-w-10">
                  <input
                    type="checkbox"
                    class="h-4 w-4 accent-emerald-500"
                    [checked]="isSelected(product.id)"
                    (change)="toggleSelectProduct(product.id)"
                    (click)="$event.stopPropagation()"
                  />
                </td>
                <td
                  *ngIf="isColumnVisible('image')"
                  class="p-4 align-middle"
                  [style.width.px]="columnWidth('image')"
                >
                  <img
                    [src]="product.image"
                    [alt]="product.name"
                    class="h-12 w-12 rounded-md border border-border object-cover"
                  />
                </td>
                <td
                  *ngIf="isColumnVisible('name')"
                  class="p-4 align-middle"
                  [style.width.px]="columnWidth('name')"
                >
                  <div class="space-y-1">
                    <button
                      type="button"
                      class="text-left font-medium text-foreground hover:underline"
                      (click)="$event.stopPropagation(); openProductDialog(product)"
                    >
                      {{ product.name }}
                    </button>
                    <p class="text-xs text-muted-foreground">
                      SKU {{ product.vendorSku }} · ID {{ product.productId }}
                    </p>
                    <p
                      *ngIf="product.variationId"
                      class="text-xs text-muted-foreground"
                    >
                      Variation {{ product.variationId }}
                    </p>
                  </div>
                </td>
                <td
                  *ngIf="isColumnVisible('productType')"
                  class="p-4 align-middle"
                  [style.width.px]="columnWidth('productType')"
                >
                  <span
                    class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                    [ngClass]="typeBadgeClass(product)"
                  >
                    {{ typeBadgeLabel(product) }}
                  </span>
                  <div class="text-xs text-muted-foreground" *ngIf="product.variation">
                    {{ product.variation.type }} · {{ product.variation.value }}
                  </div>
                </td>
                <td
                  *ngIf="isColumnVisible('tags')"
                  class="p-4 align-middle"
                  [style.width.px]="columnWidth('tags')"
                >
                  <div class="relative flex flex-wrap items-center gap-1">
                    <span
                      *ngFor="let tag of getProductTags(product.id)"
                      class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
                      [style.backgroundColor]="tag.color"
                    >
                      {{ tag.name }}
                      <button
                        type="button"
                        class="rounded-full p-0.5 text-[10px] hover:bg-white/20"
                        (click)="$event.stopPropagation(); removeTagFromProduct(product.id, tag.id)"
                      >
                        ✕
                      </button>
                    </span>
                    <button
                      *ngIf="tags.length > 0"
                      type="button"
                    class="tag-picker-trigger rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted"
                      (click)="$event.stopPropagation(); toggleTagPicker(product.id)"
                      title="Add tag"
                    >
                      <span class="inline-flex h-5 w-5 items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                          <path d="M12 5v14" />
                          <path d="M5 12h14" />
                        </svg>
                      </span>
                    </button>
                    <button
                      *ngIf="tags.length === 0"
                      type="button"
                      class="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted"
                      (click)="$event.stopPropagation(); openTagForm()"
                    >
                      Create tag
                    </button>
                  
                  <div
                    *ngIf="tagPickerProductId === product.id"
                    class="tag-picker-panel absolute left-0 top-full z-20 dropdown-panel mt-2 flex w-48 flex-col gap-2 rounded-lg border border-border bg-card/95 p-2 shadow-xl backdrop-blur animate-in fade-in slide-in-from-top-1"
                  >
                    <label
                      *ngFor="let tag of tags"
                      class="flex items-center gap-2 text-xs"
                    >
                      <input
                        type="checkbox"
                        class="h-4 w-4"
                        [checked]="hasTag(product.id, tag.id)"
                        (change)="toggleProductTag(product.id, tag.id)"
                      />
                      <label class="text-sm cursor-pointer flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full" [style.backgroundColor]="tag.color"></span>
                        {{ tag.name }}
                      </label>
                    </label>
                  </div>
                  </div>
                </td>
                <td
                  *ngIf="isColumnVisible('offers')"
                  class="p-4 align-middle"
                  [style.width.px]="columnWidth('offers')"
                >
                  <div class="flex items-center gap-1 flex-wrap">
                    <ng-container *ngIf="visibleOffers(product.id) as visibleOffers">
                      <button
                        *ngFor="let offer of visibleOffers"
                        type="button"
                        class="inline-flex items-center gap-1 rounded-md border border-transparent px-1.5 py-0.5 text-[10px] cursor-pointer hover:opacity-80"
                        [ngClass]="offerStatusClass(offer)"
                        (click)="$event.stopPropagation(); openOfferDialog([product.id], true)"
                      >
                        {{ offerLabel(offer) }}
                      </button>
                    </ng-container>
                    <button
                      *ngIf="remainingOfferCount(product.id) > 0"
                      type="button"
                      class="rounded-md border border-border px-1.5 py-0.5 text-[10px] hover:bg-muted"
                      (click)="$event.stopPropagation(); openOfferDialog([product.id], true)"
                    >
                      +{{ remainingOfferCount(product.id) }} more
                    </button>
                    <button
                      *ngIf="offersForProduct(product.id).length === 0"
                      type="button"
                      class="rounded-md border border-border px-1.5 py-0.5 text-[10px] hover:bg-muted"
                      (click)="$event.stopPropagation(); openOfferDialog([product.id], true)"
                    >
                      Create offer
                    </button>
                  </div>
                </td>
                <td
                  *ngIf="isColumnVisible('sku')"
                  class="p-4 align-middle"
                  [style.width.px]="columnWidth('sku')"
                >
                  <div class="flex items-center gap-1">
                    <button
                      type="button"
                      class="cursor-pointer"
                      aria-label="Edit product"
                      (click)="$event.stopPropagation(); openProductDialog(product)"
                    >
                      <code class="text-sm bg-muted px-1.5 py-0.5 rounded hover:text-primary hover:underline transition-colors">
                        {{ product.vendorSku }}
                      </code>
                    </button>
                    <button
                      type="button"
                      class="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                      aria-label="Copy SKU"
                      data-tooltip="Copy SKU"
                      (click)="$event.stopPropagation(); copySku(product.vendorSku)"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
                      </svg>
                    </button>
                  </div>
                </td>
                <td
                  *ngIf="isColumnVisible('vendor')"
                  class="p-4 align-middle"
                  [style.width.px]="columnWidth('vendor')"
                >
                  <div class="text-sm font-medium">{{ product.vendorName }}</div>
                </td>
                <td
                  *ngIf="isColumnVisible('brand')"
                  class="p-4 align-middle"
                  [style.width.px]="columnWidth('brand')"
                >
                  <div class="text-sm font-medium">{{ product.brand }}</div>
                </td>
                <td
                  *ngIf="isColumnVisible('productId')"
                  class="p-4 align-middle"
                  [style.width.px]="columnWidth('productId')"
                >
                  <div class="text-sm font-medium">{{ product.productId }}</div>
                </td>
                <td
                  *ngIf="isColumnVisible('variationId')"
                  class="p-4 align-middle"
                  [style.width.px]="columnWidth('variationId')"
                >
                  <ng-container *ngIf="product.variationId; else noVariation">
                    <div class="flex items-center gap-1.5">
                      <code class="text-sm bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        {{ product.variationId }}
                      </code>
                      <span
                        *ngIf="product.variation"
                        class="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs"
                      >
                        {{ product.variation.value }}
                      </span>
                    </div>
                  </ng-container>
                  <ng-template #noVariation>
                    <span class="text-muted-foreground text-sm">—</span>
                  </ng-template>
                </td>
                <td
                  *ngIf="isColumnVisible('mpn')"
                  class="p-4 align-middle"
                  [style.width.px]="columnWidth('mpn')"
                >
                  <div class="text-sm font-medium">{{ product.manufacturerPart || '-' }}</div>
                </td>
                <td
                  *ngIf="isColumnVisible('asin')"
                  class="p-4 align-middle"
                  [style.width.px]="columnWidth('asin')"
                >
                  <div class="text-sm font-medium">{{ product.asin || '-' }}</div>
                </td>
                <td
                  *ngIf="isColumnVisible('fnsku')"
                  class="p-4 align-middle"
                  [style.width.px]="columnWidth('fnsku')"
                >
                  <div class="text-sm font-medium">{{ product.fnsku || '-' }}</div>
                </td>
                <td
                  *ngIf="isColumnVisible('gtin')"
                  class="p-4 align-middle"
                  [style.width.px]="columnWidth('gtin')"
                >
                  <div class="text-sm font-medium">{{ product.gtin || '-' }}</div>
                </td>
                <td
                  *ngIf="isColumnVisible('ean')"
                  class="p-4 align-middle"
                  [style.width.px]="columnWidth('ean')"
                >
                  <div class="text-sm font-medium">{{ product.ean || '-' }}</div>
                </td>
                <td
                  *ngIf="isColumnVisible('isbn')"
                  class="p-4 align-middle"
                  [style.width.px]="columnWidth('isbn')"
                >
                  <div class="text-sm font-medium">{{ product.isbn || '-' }}</div>
                </td>
                <td
                  *ngIf="isColumnVisible('landedCost')"
                  class="px-4 py-4 text-right"
                  [style.width.px]="columnWidth('landedCost')"
                >
                  <p class="font-medium">
                    {{ product.landedCost | currency: 'USD' : 'symbol' : '1.2-2' }}
                  </p>
                </td>
                <td
                  *ngIf="isColumnVisible('shippingCost')"
                  class="px-4 py-4 text-right"
                  [style.width.px]="columnWidth('shippingCost')"
                >
                  <p class="font-medium">
                    {{ product.shippingCost | currency: 'USD' : 'symbol' : '1.2-2' }}
                  </p>
                </td>
                <td
                  *ngIf="isColumnVisible('salePrice')"
                  class="px-4 py-4 text-right"
                  [style.width.px]="columnWidth('salePrice')"
                >
                  <p class="font-medium">
                    {{ product.salePrice | currency: 'USD' : 'symbol' : '1.2-2' }}
                  </p>
                </td>
                <td
                  *ngIf="isColumnVisible('purchaseQty')"
                  class="px-4 py-4 text-right"
                  [style.width.px]="columnWidth('purchaseQty')"
                >
                  <p class="font-medium">{{ product.purchaseQty }}</p>
                </td>
                <td
                  *ngIf="isColumnVisible('soldQty')"
                  class="px-4 py-4 text-right"
                  [style.width.px]="columnWidth('soldQty')"
                >
                  <p class="font-medium">{{ soldQty(product) }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{ soldPeriodLabel(filters.soldPeriod) }}
                  </p>
                </td>
                <td
                  *ngIf="isColumnVisible('stockQty')"
                  class="p-4 align-middle text-right"
                  [style.width.px]="columnWidth('stockQty')"
                >
                  <span
                    class="text-base font-medium"
                    [ngClass]="product.stockQty === 0 ? 'text-destructive' : 'text-success'"
                  >
                    {{ product.stockQty }}
                  </span>
                </td>
                <td
                  *ngIf="isColumnVisible('returnQty')"
                  class="p-4 align-middle text-right"
                  [style.width.px]="columnWidth('returnQty')"
                >
                  <span class="text-base" [ngClass]="product.returnQty > 0 ? 'text-warning' : ''">
                    {{ product.returnQty }}
                  </span>
                </td>
                <td
                  *ngIf="isColumnVisible('profitMargin')"
                  class="p-4 align-middle text-right"
                  [style.width.px]="columnWidth('profitMargin')"
                >
                  <span
                    class="text-base font-medium"
                    [ngClass]="product.grossProfitPercent > 0 ? 'text-success' : 'text-muted-foreground'"
                  >
                    {{ product.grossProfitPercent }}%
                  </span>
                </td>
                <td
                  *ngIf="isColumnVisible('profitAmount')"
                  class="p-4 align-middle text-right"
                  [style.width.px]="columnWidth('profitAmount')"
                >
                  <p class="font-medium">
                    {{ product.grossProfitAmount | currency: 'USD' : 'symbol' : '1.2-2' }}
                  </p>
                </td>
                <td
                  *ngIf="isColumnVisible('velocity')"
                  class="p-4 align-middle text-right"
                  [style.width.px]="columnWidth('velocity')"
                >
                  <p class="font-medium">{{ product.velocity }}</p>
                  <p class="text-xs text-muted-foreground">per day</p>
                </td>
                <td
                  *ngIf="isColumnVisible('stockDays')"
                  class="p-4 align-middle text-right"
                  [style.width.px]="columnWidth('stockDays')"
                >
                  <span
                    class="text-base font-medium"
                    [ngClass]="
                      product.stockDays <= 7
                        ? 'text-destructive'
                        : product.stockDays <= 30
                          ? 'text-warning'
                          : 'text-foreground'
                    "
                  >
                    {{ product.stockDays === 999 ? '∞' : product.stockDays }}
                  </span>
                </td>
                <td
                  *ngIf="isColumnVisible('restockStatus')"
                  class="p-4 align-middle"
                  [style.width.px]="columnWidth('restockStatus')"
                >
                  <span
                    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border whitespace-nowrap"
                    [ngClass]="restockClasses[product.restockStatus]"
                  >
                    {{ restockLabels[product.restockStatus] }}
                  </span>
                </td>
                <td
                  *ngIf="isColumnVisible('suggestedRestockQty')"
                  class="p-4 align-middle text-right"
                  [style.width.px]="columnWidth('suggestedRestockQty')"
                >
                  <span
                    class="text-base font-medium"
                    [ngClass]="product.suggestedRestockQty > 0 ? 'text-primary' : 'text-muted-foreground'"
                  >
                    {{ product.suggestedRestockQty }}
                  </span>
                </td>
                <td
                  *ngIf="isColumnVisible('marketplaces')"
                  class="p-4 align-middle"
                  [style.width.px]="columnWidth('marketplaces')"
                >
                  <button
                    type="button"
                    class="w-full text-left"
                    (click)="$event.stopPropagation(); openMarketplaceDialog(product)"
                  >
                    <div class="flex flex-col gap-2">
                      <div class="flex flex-wrap items-center gap-2 text-xs">
                        <ng-container *ngIf="product.marketplaces.length > 0; else notListedBadge">
                          <span class="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-300">
                            <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                            {{ marketplaceLiveCount(product) }}/{{ product.marketplaces.length }}
                          </span>
                          <span
                            *ngIf="marketplaceErrorCount(product) > 0"
                            class="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-rose-300"
                          >
                            <span class="h-1.5 w-1.5 rounded-full bg-rose-400"></span>
                            {{ marketplaceErrorCount(product) }}
                          </span>
                          <span
                            *ngIf="marketplaceInactiveCount(product) > 0"
                            class="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-300"
                          >
                            <span class="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                            {{ marketplaceInactiveCount(product) }}
                          </span>
                        </ng-container>
                        <ng-template #notListedBadge>
                          <span class="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-slate-300">
                            Not Listed
                          </span>
                        </ng-template>
                      </div>

                      <div class="flex flex-wrap items-center gap-1.5">
                        <ng-container *ngFor="let market of marketplaceBadges(product)">
                          <span
                            class="relative inline-flex items-center justify-center rounded-md px-2 py-1 text-[10px] font-semibold uppercase"
                            [ngClass]="marketplaceBadgeClass(market.platform)"
                          >
                            {{ marketplaceBadgeText(market.platform) }}
                            <span
                              class="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-slate-900"
                              [ngClass]="marketplaceStatusDotClass(market.status)"
                            ></span>
                          </span>
                        </ng-container>
                        <span
                          *ngIf="marketplaceOverflowCount(product) > 0"
                          class="inline-flex items-center rounded-md bg-slate-800 px-1.5 py-1 text-[10px] text-slate-200"
                        >
                          +{{ marketplaceOverflowCount(product) }}
                        </span>
                      </div>
                    </div>
                  </button>
                </td>
                <td
                  *ngIf="isColumnVisible('actions')"
                  class="p-4 align-middle"
                  [style.width.px]="columnWidth('actions')"
                >
                  <div class="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      class="inline-flex items-center justify-center whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 gap-1 h-7 text-xs"
                      (click)="$event.stopPropagation(); openProductDialog(product)"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-pen w-3 h-3"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path></svg>
                      Update
                    </button>
                    <details
                      class="relative"
                      [attr.data-dropdown]="'actions-' + product.id"
                      [open]="openDropdownId === 'actions-' + product.id"
                    >
                      <summary
                        class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                        (click)="$event.preventDefault(); $event.stopPropagation(); toggleDropdown('actions-' + product.id)"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                          <circle cx="5" cy="12" r="1.5" />
                          <circle cx="12" cy="12" r="1.5" />
                          <circle cx="19" cy="12" r="1.5" />
                        </svg>
                      </summary>
                      <div
                        data-dropdown-panel
                        class="absolute right-0 z-50 mt-2 w-44 rounded-lg border border-border bg-card/95 p-2 text-xs shadow-xl backdrop-blur"
                      >
                        <button
                          type="button"
                          class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted"
                          (click)="$event.stopPropagation(); openProductDialog(product); toggleDropdown('actions-' + product.id)"
                        >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-external-link w-4 h-4 mr-2"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
                          View Details
                        </button>
                        <button
                          type="button"
                          class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted"
                          (click)="$event.stopPropagation(); duplicateProduct(product); toggleDropdown('actions-' + product.id)"
                        >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy w-4 h-4 mr-2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>
                          Duplicate
                        </button>
                        <button
                          type="button"
                          class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-rose-400 hover:bg-muted"
                          (click)="$event.stopPropagation(); deleteProduct(product); toggleDropdown('actions-' + product.id)"
                        >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2 w-4 h-4 mr-2"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" x2="10" y1="11" y2="17"></line><line x1="14" x2="14" y1="11" y2="17"></line></svg>
                          Delete
                        </button>
                      </div>
                    </details>
                  </div>
                </td>
              </tr>
            </tbody>
                </table>
              </div>
            </div>

            <div
              class="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-card/95 px-4 py-3 text-xs text-muted-foreground backdrop-blur"
            >
              <div class="flex flex-wrap items-center gap-2">
                <span>Showing {{ pageStart(filtered.length) }}-{{ pageEnd(filtered.length) }} of {{ filtered.length }} products</span>
                <span class="text-muted-foreground/60">,</span>
                <span>Total catalog: {{ products.length }} items</span>
              </div>
              <div class="flex items-center gap-3">
                <span>Rows per page:</span>
                <select
                  class="rounded-md border border-border bg-background px-2 py-1 text-xs"
                  [(ngModel)]="pageSize"
                  (ngModelChange)="onPageSizeChange()"
                >
                  <option [value]="10">10</option>
                  <option [value]="25">25</option>
                  <option [value]="50">50</option>
                </select>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                    [disabled]="currentPage === 1"
                    (click)="goToPage(1)"
                    title="First page"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                      <path d="M11 19l-7-7 7-7" />
                      <path d="M20 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                    [disabled]="currentPage === 1"
                    (click)="previousPage()"
                    title="Previous page"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                      <path d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span class="text-xs">Page</span>
                  <input
                    type="number"
                    min="1"
                    [max]="totalPages(filtered.length)"
                    class="h-7 w-12 rounded-md border border-border bg-background px-2 text-center text-xs"
                    [ngModel]="currentPage"
                    (ngModelChange)="onPageInput($event)"
                  />
                  <span class="text-xs">of {{ totalPages(filtered.length) }}</span>
                  <button
                    type="button"
                    class="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                    [disabled]="currentPage >= totalPages(filtered.length)"
                    (click)="nextPage(filtered.length)"
                    title="Next page"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                      <path d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                    [disabled]="currentPage >= totalPages(filtered.length)"
                    (click)="goToPage(totalPages(filtered.length))"
                    title="Last page"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                      <path d="M4 19l7-7-7-7" />
                      <path d="M13 19l7-7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </ng-container>
        </ng-container>
      </div>
    </div>

    <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      <div
        *ngFor="let toast of toastMessages"
        class="min-w-[240px] rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground shadow-lg"
      >
        <p class="text-sm font-semibold">{{ toast.title }}</p>
        <p class="text-xs text-muted-foreground">{{ toast.text }}</p>
      </div>
    </div>
  </section>

`,

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGridComponent implements OnInit {
  private readonly tagService = inject(TagService);
  private readonly offerService = inject(OfferService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly filtersStorageKey = 'product-filters';
  private readonly columnsStorageKey = 'product-columns';
  private readonly columnWidthsStorageKey = 'product-column-widths';
  private readonly columnWidthsVersion = 2;
  private readonly pageSizeStorageKey = 'product-page-size';
  private draggedColumnId: string | null = null;

  products: Product[] = [...mockProducts];
  readonly brands = brands;
  readonly marketplaces = marketplacePlatforms;
  readonly tagColors = tagColors;
  readonly csvFields = csvFields;
  readonly csvIdentifierOptions = csvIdentifierOptions;
  readonly manualTabs = manualTabOptions;
  readonly manualBasicFields = manualBasicFields;
  readonly manualIdentifierFields = manualIdentifierFields;
  readonly manualPricingFields = manualPricingFields;
  readonly manualInventoryFields = manualInventoryFields;
  readonly offerTypeLabels = offerTypeLabels;
  readonly offerTypes = this.offerService.getOfferTypeOptions();

  customFilterModalOpen = false;
  customFilters: CustomFilter[] = [];
  activeCustomFilterId: string | null = null;
  editingCustomFilterId: string | null = null;
  customFilterFields = [
    'Product Name',
    'Brand',
    'Vendor',
    'SKU',
    'Product ID',
    'Sale Price',
    'Stock Qty',
    'Sold Qty',
    'Marketplace',
    'Tags',
  ];
  customFilterConditions = [
    'Contains',
    'Equals',
    'Starts with',
    'Ends with',
    'Greater than',
    'Less than',
    'Is empty',
    'Is not empty',
  ];
  customFilterForm = {
    name: '',
    description: '',
    matchAll: true,
    rules: [
      { field: 'Product Name', condition: 'Contains', value: '' } as CustomFilterRule,
    ],
  };

  csvDialogOpen = false;
  csvMode: 'create' | 'update' = 'create';
  csvStep: 'upload' | 'mapping' = 'upload';
  csvFileName = '';
  csvHeaders: string[] = [];
  csvRows: string[][] = [];
  csvFieldMapping: Record<string, string> = {};
  csvMatchFields: string[] = ['vendorSku'];
  csvError = '';

  manualDialogOpen = false;
  manualTab: ManualTab = 'basic';
  manualForm: Record<string, string> = {};
  manualProductType: ProductType = 'single';
  kitComponents: KitComponent[] = [];
  kitProductId = '';
  kitQuantity = 1;

  columns: ColumnConfig[] = [
    { id: 'image', label: 'Image', visible: true },
    { id: 'name', label: 'Product Name', visible: true, sortable: true },
    { id: 'productType', label: 'Type', visible: true, sortable: true },
    { id: 'tags', label: 'Tags', visible: true },
    { id: 'offers', label: 'Offers', visible: true },
    { id: 'sku', label: 'SKU', visible: true, sortable: true },
    { id: 'brand', label: 'Brand', visible: true, sortable: true },
    { id: 'productId', label: 'Product ID', visible: true, sortable: true },
    { id: 'variationId', label: 'Variation ID', visible: true, sortable: true },
    { id: 'vendor', label: 'Vendor', visible: true, sortable: true },
    { id: 'mpn', label: 'MPN', visible: true, sortable: true },
    { id: 'asin', label: 'ASIN', visible: false, sortable: true },
    { id: 'fnsku', label: 'FNSKU', visible: false, sortable: true },
    { id: 'gtin', label: 'GTIN', visible: false, sortable: true },
    { id: 'ean', label: 'EAN', visible: false, sortable: true },
    { id: 'isbn', label: 'ISBN', visible: false, sortable: true },
    { id: 'landedCost', label: 'Landed Cost', visible: true, sortable: true, align: 'right' },
    { id: 'shippingCost', label: 'Shipping', visible: true, sortable: true, align: 'right' },
    { id: 'salePrice', label: 'Sale Price', visible: true, sortable: true, align: 'right' },
    { id: 'purchaseQty', label: 'Purchased', visible: true, sortable: true, align: 'right' },
    { id: 'soldQty', label: 'Sold', visible: true, sortable: true, align: 'right' },
    { id: 'stockQty', label: 'In Stock', visible: true, sortable: true, align: 'right' },
    { id: 'returnQty', label: 'Returns', visible: true, sortable: true, align: 'right' },
    { id: 'profitMargin', label: 'Margin %', visible: true, sortable: true, align: 'right' },
    { id: 'profitAmount', label: 'Profit $', visible: true, sortable: true, align: 'right' },
    { id: 'velocity', label: 'Velocity', visible: true, sortable: true, align: 'right' },
    { id: 'stockDays', label: 'Stock Days', visible: true, sortable: true, align: 'right' },
    { id: 'restockStatus', label: 'Restock Status', visible: true, sortable: true },
    { id: 'suggestedRestockQty', label: 'Restock Qty', visible: true, sortable: true, align: 'right' },
    { id: 'marketplaces', label: 'Marketplaces', visible: true },
    { id: 'actions', label: 'Actions', visible: true },
  ];

  readonly marketplaceBadgeLimit = 6;

  private readonly defaultColumnWidths: Record<string, number> = {
    image: 56,
    name: 280,
    productType: 100,
    tags: 150,
    offers: 140,
    sku: 160,
    brand: 120,
    productId: 90,
    variationId: 140,
    vendor: 130,
    mpn: 110,
    asin: 120,
    fnsku: 120,
    gtin: 130,
    ean: 130,
    isbn: 130,
    landedCost: 100,
    shippingCost: 90,
    salePrice: 95,
    purchaseQty: 90,
    soldQty: 70,
    stockQty: 80,
    returnQty: 80,
    profitMargin: 85,
    profitAmount: 85,
    velocity: 80,
    stockDays: 90,
    restockStatus: 120,
    suggestedRestockQty: 100,
    marketplaces: 200,
    actions: 190,
  };

  private resizingColumnId: string | null = null;
  private resizeStartX = 0;
  private resizeStartWidth = 0;
  columnWidths: Record<string, number> = { ...this.defaultColumnWidths };

  tags: Tag[] = [];
  productTags: Record<string, string[]> = {};
  offers: Offer[] = [];

  tagFormOpen = false;
  editingTag: Tag | null = null;
  tagName = '';
  tagColor = tagColors[0].value;
  tagPickerProductId: string | null = null;

  productDialogOpen = false;
  productDialogTab: 'overview' | 'inventory' | 'marketplaces' = 'overview';
  selectedProduct: Product | null = null;
  productDraft: Partial<Product> = {};

  marketplaceDialogOpen = false;
  marketplaceDialogProduct: Product | null = null;
  marketplaceRows: MarketplaceRow[] = [];
  marketplaceDialogTab: 'listings' | 'offers' = 'listings';
  marketplaceSelectedForPublish: string[] = [];
  marketplaceIsPublishing = false;

  marketplaceEditOfferOpen = false;
  marketplaceEditingOffer: Offer | null = null;
  marketplaceEditName = '';
  marketplaceEditDescription = '';
  marketplaceEditType: Offer['type'] = 'percent_discount';
  marketplaceEditScope: OfferScope = 'product';
  marketplaceEditDiscountPercent = '10';
  marketplaceEditDiscountAmount = '5';
  marketplaceEditMinQty = '2';
  marketplaceEditBuyQty = '1';
  marketplaceEditGetQty = '1';
  marketplaceEditStartDate = '';
  marketplaceEditEndDate = '';
  marketplaceEditMarketplaces: string[] = [];
  marketplaceEditIsActive = true;

  offerDialogOpen = false;
  offerDialogProductIds: string[] = [];
  offerDialogName = '';
  offerDialogType: Offer['type'] = 'percent_discount';
  offerDialogScope: OfferScope = 'product';
  offerDialogDiscountPercent = '10';
  offerDialogDiscountAmount = '5';
  offerDialogMinQty = '2';
  offerDialogBuyQty = '1';
  offerDialogGetQty = '1';
  offerDialogStartDate = '';
  offerDialogEndDate = '';
  offerDialogMarketplaces: string[] = [];
  offerDialogDescription = '';
  offerDialogProductSearch = '';
  offerDialogHideProductSelection = false;
  offerDialogAllowEmptySelection = false;
  toastMessages: Array<{ id: number; title: string; text: string }> = [];
  private toastId = 0;

  bulkSalePrice = '';
  bulkStockQty = '';
  bulkLandedCost = '';
  bulkPurchaseQty = '';
  bulkListingOpen = false;
  bulkListingStep: BulkListingStep = 'configure';
  bulkListingBatchName = '';
  bulkListingPublishMethod: BulkPublishMethod = 'ai';
  bulkListingMarketplaces: string[] = [];
  bulkListingProducts: Product[] = [];
  bulkListingEditedItems: Record<string, BulkListingItemData> = {};
  bulkListingFillOpen = false;
  bulkListingFillStock = '';
  bulkListingFillPrice = '';
  bulkListingFillShipping = '';
  bulkListingFillMsrp = '';
  bulkListingFillCondition = 'New';
  readonly bulkListingMethods = bulkListingMethods;
  readonly bulkConditionOptions = bulkConditionOptions;
  openDropdownId: string | null = null;

  readonly soldPeriods: Array<{ value: SoldPeriod; label: string }> = [
    { value: 'all', label: 'All time' },
    { value: 'lastMonth', label: 'Last month' },
    { value: 'lastQuarter', label: 'Last quarter' },
    { value: 'lastYear', label: 'Last year' },
  ];

  readonly statusOptions: StatusFilter[] = [
    'live',
    'inactive',
    'error',
    'not_listed',
  ];

  filters: FilterState = {
    search: '',
    brand: [],
    marketplace: [],
    status: [],
    priceRange: [0, 10000],
    stockRange: [0, 10000],
    soldRange: [0, 10000],
    soldPeriod: 'all',
    soldDateRange: [null, null],
    kitProduct: null,
    hasVariation: null,
    tags: [],
  };

  pageSize = 25;
  currentPage = 1;
  sortKey: SortKey | null = null;
  sortDirection: SortDirection | null = null;
  selectedProductIds = new Set<string>();

  readonly restockLabels: Record<Product['restockStatus'], string> = {
    in_stock: 'In Stock',
    low_stock: 'Low Stock',
    out_of_stock: 'Out of Stock',
    reorder_now: 'Reorder Now',
  };

  readonly restockClasses: Record<Product['restockStatus'], string> = {
    in_stock: 'bg-success/10 text-success border-success/30',
    low_stock: 'bg-warning/10 text-warning border-warning/30',
    out_of_stock: 'bg-destructive/10 text-destructive border-destructive/30',
    reorder_now: 'bg-primary/10 text-primary border-primary/30',
  };

  private readonly restockRank: Record<Product['restockStatus'], number> = {
    out_of_stock: 0,
    reorder_now: 1,
    low_stock: 2,
    in_stock: 3,
  };

  ngOnInit(): void {
    this.restorePreferences();

    this.tagService.tags$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((tags) => {
        this.tags = tags;
        const validIds = new Set(tags.map((tag) => tag.id));
        const filtered = this.filters.tags.filter((id) => validIds.has(id));
        if (filtered.length !== this.filters.tags.length) {
          this.filters = { ...this.filters, tags: filtered };
        }
        this.cdr.markForCheck();
      });

    this.tagService.productTags$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((productTags) => {
        this.productTags = productTags;
        this.cdr.markForCheck();
      });

    this.offerService.offers$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((offers) => {
        this.offers = offers;
        this.cdr.markForCheck();
      });
  }

  filteredProducts(): Product[] {
    const searchTerm = this.filters.search.trim().toLowerCase();
    let result = this.products;

    if (searchTerm) {
      result = result.filter((product) =>
        [
          product.name,
          product.vendorSku,
          product.brand,
          product.vendorName,
          product.productId,
          product.manufacturerPart,
          product.asin,
          product.fnsku,
          product.gtin,
          product.ean,
          product.isbn,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(searchTerm))
      );
    }

    if (this.filters.brand.length > 0) {
      result = result.filter((product) =>
        this.filters.brand.includes(product.brand)
      );
    }

    if (this.filters.marketplace.length > 0) {
      result = result.filter((product) =>
        product.marketplaces.some((market) =>
          this.filters.marketplace.includes(market.platform)
        )
      );
    }

    if (this.filters.status.length > 0) {
      result = result.filter((product) => {
        const includesNotListed = this.filters.status.includes('not_listed');
        const statusFilters = this.filters.status.filter(
          (status) => status !== 'not_listed'
        );

        if (includesNotListed && product.marketplaces.length === 0) {
          return true;
        }

        if (statusFilters.length === 0) {
          return false;
        }

        return product.marketplaces.some((market) =>
          statusFilters.includes(market.status as StatusFilter)
        );
      });
    }

    result = result.filter((product) =>
      this.withinRange(product.salePrice, this.filters.priceRange)
    );

    result = result.filter((product) =>
      this.withinRange(product.stockQty, this.filters.stockRange)
    );

    result = result.filter((product) =>
      this.withinRange(this.soldQty(product), this.filters.soldRange)
    );

    if (this.filters.kitProduct !== null) {
      result = result.filter(
        (product) => product.kitProduct === this.filters.kitProduct
      );
    }

    if (this.filters.hasVariation !== null) {
      result = result.filter((product) =>
        this.filters.hasVariation
          ? product.variationId !== null
          : product.variationId === null
      );
    }

    if (this.filters.tags.length > 0) {
      result = result.filter((product) => {
        const assigned = this.productTags[product.id] || [];
        return this.filters.tags.some((tagId) => assigned.includes(tagId));
      });
    }

    const sorted = [...result];
    if (this.sortKey && this.sortDirection) {
      sorted.sort((a, b) =>
        this.compareProducts(a, b, this.sortKey!, this.sortDirection!)
      );
    }

    return sorted;
  }

  paginatedProducts(products: Product[]): Product[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return products.slice(startIndex, startIndex + this.pageSize);
  }

  totalPages(total: number): number {
    return Math.max(1, Math.ceil(total / this.pageSize));
  }

  pageStart(total: number): number {
    if (total === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  pageEnd(total: number): number {
    if (total === 0) return 0;
    return Math.min(total, this.currentPage * this.pageSize);
  }

  setSort(key: SortKey): void {
    if (this.sortKey === key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      return;
    }
    this.sortKey = key;
    this.sortDirection = 'asc';
  }

  sortIcon(key: SortKey): string {
    if (this.sortKey !== key) return '↕';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.saveFilters();
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.savePageSize();
  }

  updateRange(
    key: 'priceRange' | 'stockRange' | 'soldRange',
    minValue: number,
    maxValue: number
  ): void {
    const sanitizedMin = Number.isFinite(minValue) ? Math.max(0, minValue) : 0;
    const sanitizedMax = Number.isFinite(maxValue) ? Math.max(0, maxValue) : 0;
    const normalized: [number, number] = [
      Math.min(sanitizedMin, sanitizedMax),
      Math.max(sanitizedMin, sanitizedMax),
    ];

    this.filters = { ...this.filters, [key]: normalized };
    this.onFilterChange();
  }

  toggleBrand(brand: string): void {
    const selected = this.filters.brand.includes(brand)
      ? this.filters.brand.filter((item) => item !== brand)
      : [...this.filters.brand, brand];
    this.filters = { ...this.filters, brand: selected };
    this.onFilterChange();
  }

  toggleMarketplace(platform: string): void {
    const selected = this.filters.marketplace.includes(platform)
      ? this.filters.marketplace.filter((item) => item !== platform)
      : [...this.filters.marketplace, platform];
    this.filters = { ...this.filters, marketplace: selected };
    this.onFilterChange();
  }

  toggleStatus(status: StatusFilter): void {
    const selected = this.filters.status.includes(status)
      ? this.filters.status.filter((item) => item !== status)
      : [...this.filters.status, status];
    this.filters = { ...this.filters, status: selected };
    this.onFilterChange();
  }

  setKitFilter(value: boolean | null): void {
    this.filters = { ...this.filters, kitProduct: value };
    this.onFilterChange();
  }

  setVariationFilter(value: boolean | null): void {
    this.filters = { ...this.filters, hasVariation: value };
    this.onFilterChange();
  }

  setSoldPeriod(period: SoldPeriod): void {
    this.filters = {
      ...this.filters,
      soldPeriod: period,
      soldDateRange: period === 'custom' ? this.filters.soldDateRange : [null, null],
    };
    this.onFilterChange();
  }

  updateSoldDateRange(index: 0 | 1, value: string): void {
    const parsed = value ? new Date(value) : null;
    const next: [Date | null, Date | null] = [...this.filters.soldDateRange];
    next[index] = parsed;
    if (next[0] && next[1] && next[1] < next[0]) {
      next[1] = next[0];
    }
    this.filters = { ...this.filters, soldDateRange: next };
    this.onFilterChange();
  }

  soldFilterActive(): boolean {
    const [minSold, maxSold] = this.filters.soldRange;
    const [start, end] = this.filters.soldDateRange;
    return (
      minSold > 0 ||
      maxSold < 10000 ||
      this.filters.soldPeriod !== 'all' ||
      (!!start && !!end)
    );
  }

  soldFilterBadgeLabel(): string {
    const [start, end] = this.filters.soldDateRange;
    if (this.filters.soldPeriod === 'custom' && start && end) {
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    return this.soldPeriodLabel(this.filters.soldPeriod);
  }

  soldDateInput(date: Date | null): string {
    return date ? this.toDateInput(date) : '';
  }

  resetFilters(): void {
    this.filters = {
      search: '',
      brand: [],
      marketplace: [],
      status: [],
      priceRange: [0, 10000],
      stockRange: [0, 10000],
      soldRange: [0, 10000],
      soldPeriod: 'all',
      soldDateRange: [null, null],
      kitProduct: null,
      hasVariation: null,
      tags: [],
    };
    this.pageSize = 25;
    this.currentPage = 1;
    this.sortKey = null;
    this.sortDirection = null;
    this.saveFilters();
    this.savePageSize();
  }

  onPageInput(value: string | number): void {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(parsed)) return;
    this.goToPage(parsed);
  }

  hasActiveFilters(): boolean {
    const [minPrice, maxPrice] = this.filters.priceRange;
    const [minStock, maxStock] = this.filters.stockRange;
    const [minSold, maxSold] = this.filters.soldRange;
    const [soldStart, soldEnd] = this.filters.soldDateRange;

    return (
      this.filters.search.trim().length > 0 ||
      this.filters.brand.length > 0 ||
      this.filters.marketplace.length > 0 ||
      this.filters.status.length > 0 ||
      this.filters.tags.length > 0 ||
      this.filters.kitProduct !== null ||
      this.filters.hasVariation !== null ||
      minPrice !== 0 ||
      maxPrice !== 10000 ||
      minStock !== 0 ||
      maxStock !== 10000 ||
      minSold !== 0 ||
      maxSold !== 10000 ||
      this.filters.soldPeriod !== 'all' ||
      soldStart !== null ||
      soldEnd !== null
    );
  }

  manualTabLabel(tab: ManualTab): string {
    switch (tab) {
      case 'basic':
        return 'Basic Info';
      case 'type':
        return 'Type';
      case 'identifiers':
        return 'Identifiers';
      case 'pricing':
        return 'Pricing';
      case 'inventory':
        return 'Inventory';
      default:
        return 'Details';
    }
  }

  openManualDialog(type: ProductType): void {
    this.openDropdownId = null;
    this.manualDialogOpen = false;
    const queryParams = type === 'kit' ? { type: 'kit' } : undefined;
    void this.router.navigate(['/product/new'], { queryParams });
  }

  goToMarketplaceIntegrations(): void {
    this.openDropdownId = null;
    void this.router.navigate(['/marketplace-integrations']);
  }

  openCustomFilterModal(): void {
    this.customFilterModalOpen = true;
    this.openDropdownId = null;
    this.editingCustomFilterId = null;
    this.customFilterForm = {
      name: '',
      description: '',
      matchAll: true,
      rules: [
        { field: 'Product Name', condition: 'Contains', value: '' } as CustomFilterRule,
      ],
    };
  }

  closeCustomFilterModal(): void {
    this.customFilterModalOpen = false;
  }

  addCustomFilterRule(): void {
    this.customFilterForm.rules = [
      ...this.customFilterForm.rules,
      { field: 'Product Name', condition: 'Contains', value: '' },
    ];
  }

  removeCustomFilterRule(index: number): void {
    if (this.customFilterForm.rules.length <= 1) return;
    this.customFilterForm.rules = this.customFilterForm.rules.filter((_, i) => i !== index);
  }

  toggleCustomFilterMatchAll(): void {
    this.customFilterForm.matchAll = !this.customFilterForm.matchAll;
  }

  saveCustomFilter(): void {
    const name = this.customFilterForm.name.trim();
    if (!name) return;
    if (this.editingCustomFilterId) {
      this.customFilters = this.customFilters.map((filter) =>
        filter.id === this.editingCustomFilterId
          ? {
              ...filter,
              name,
              description: this.customFilterForm.description.trim(),
              rules: [...this.customFilterForm.rules],
            }
          : filter
      );
    } else {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      this.customFilters = [
        ...this.customFilters,
        {
          id,
          name,
          description: this.customFilterForm.description.trim(),
          rules: [...this.customFilterForm.rules],
        },
      ];
    }
    this.closeCustomFilterModal();
  }

  toggleCustomFilter(filterId: string): void {
    this.activeCustomFilterId = this.activeCustomFilterId === filterId ? null : filterId;
  }

  editCustomFilter(filter: CustomFilter): void {
    this.customFilterModalOpen = true;
    this.openDropdownId = null;
    this.editingCustomFilterId = filter.id;
    this.customFilterForm = {
      name: filter.name,
      description: filter.description,
      matchAll: true,
      rules: filter.rules.map((rule) => ({ ...rule })),
    };
  }

  deleteCustomFilter(filterId: string): void {
    this.customFilters = this.customFilters.filter((filter) => filter.id !== filterId);
    if (this.activeCustomFilterId === filterId) {
      this.activeCustomFilterId = null;
    }
  }

  closeManualDialog(): void {
    this.manualDialogOpen = false;
    this.manualForm = {};
    this.kitComponents = [];
  }

  addKitComponent(): void {
    if (!this.kitProductId) return;
    const quantity = Math.max(1, Number(this.kitQuantity || 1));
    this.kitComponents = [
      ...this.kitComponents,
      { productId: this.kitProductId, quantity },
    ];
    this.kitProductId = '';
    this.kitQuantity = 1;
  }

  removeKitComponent(index: number): void {
    this.kitComponents = this.kitComponents.filter((_, i) => i !== index);
  }

  kitProductName(productId: string): string {
    return this.products.find((product) => product.id === productId)?.name ?? productId;
  }

  saveManualProduct(): void {
    const missingRequired = manualBasicFields
      .filter((field) => field.required && !this.manualForm[field.id]?.trim())
      .map((field) => field.label);

    if (missingRequired.length > 0) {
      window.alert(`Missing required fields: ${missingRequired.join(', ')}`);
      return;
    }

    const product = this.createProductFromInput({
      ...this.manualForm,
      productType: this.manualProductType,
    });

    if (this.manualProductType === 'kit') {
      product.kitProduct = true;
      product.productType = 'kit';
      product.kitComponents = [...this.kitComponents];
    }

    this.products = [product, ...this.products];
    this.closeManualDialog();
    this.cdr.markForCheck();
  }

  openCsvDialog(mode: 'create' | 'update'): void {
    this.csvDialogOpen = true;
    this.csvMode = mode;
    this.resetCsvDialog();
  }

  closeCsvDialog(): void {
    this.csvDialogOpen = false;
    this.resetCsvDialog();
  }

  resetCsvDialog(): void {
    this.csvStep = 'upload';
    this.csvFileName = '';
    this.csvHeaders = [];
    this.csvRows = [];
    this.csvFieldMapping = {};
    this.csvMatchFields = ['vendorSku'];
    this.csvError = '';
  }

  toggleCsvMatchField(fieldId: string): void {
    if (this.csvMatchFields.includes(fieldId)) {
      if (this.csvMatchFields.length === 1) return;
      this.csvMatchFields = this.csvMatchFields.filter((id) => id !== fieldId);
      return;
    }
    this.csvMatchFields = [...this.csvMatchFields, fieldId];
  }

  async onCsvFileChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.csvError = '';
    this.csvFileName = file.name;
    const extension = file.name.split('.').pop()?.toLowerCase();

    try {
      if (extension === 'csv') {
        const text = await file.text();
        const { headers, rows } = this.parseCsv(text);
        this.setCsvData(headers, rows);
      } else if (extension === 'xlsx' || extension === 'xls') {
        const buffer = await file.arrayBuffer();
        const { headers, rows } = this.parseExcel(buffer);
        this.setCsvData(headers, rows);
      } else {
        this.csvError = 'Unsupported file type. Please upload CSV or Excel.';
        return;
      }
    } catch (error) {
      console.error(error);
      this.csvError = 'Failed to read file. Please try again.';
      return;
    }
  }

  downloadCsvTemplate(): void {
    const headers = csvFields.map((field) => field.label);
    const rows = csvSampleProducts.map((product) =>
      csvFields.map((field) => {
        const value = product[field.id] || '';
        return value.includes(',') || value.includes('"')
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      })
    );
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `product_import_template_${this.csvMode}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  setCsvFieldMapping(fieldId: string, value: string): void {
    this.csvFieldMapping = { ...this.csvFieldMapping, [fieldId]: value };
  }

  csvFieldRequired(fieldId: string): boolean {
    if (this.csvMode === 'create') {
      return csvFields.find((field) => field.id === fieldId)?.required ?? false;
    }
    return this.csvMatchFields.includes(fieldId);
  }

  get csvCanImport(): boolean {
    if (this.csvMode === 'create') {
      return csvFields
        .filter((field) => field.required)
        .every((field) => this.csvFieldMapping[field.id] && this.csvFieldMapping[field.id] !== '_skip');
    }
    return this.csvMatchFields.some(
      (fieldId) => this.csvFieldMapping[fieldId] && this.csvFieldMapping[fieldId] !== '_skip'
    );
  }

  importCsvData(): void {
    const mapped = this.mapCsvRows();
    if (mapped.length === 0) {
      window.alert('No valid rows found. Please check your mapping.');
      return;
    }

    if (this.csvMode === 'create') {
      const created = mapped.map((record) => this.createProductFromInput(record));
      this.products = [...created, ...this.products];
    } else {
      this.products = this.applyCsvUpdates(this.products, mapped);
    }

    this.closeCsvDialog();
    this.cdr.markForCheck();
  }

  importMarketplace(source: 'Amazon' | 'Shopify'): void {
    window.alert(`Import from ${source} is not wired yet.`);
  }

  get selectedCount(): number {
    return this.selectedProductIds.size;
  }

  isSelected(productId: string): boolean {
    return this.selectedProductIds.has(productId);
  }

  toggleSelectProduct(productId: string): void {
    const next = new Set(this.selectedProductIds);
    if (next.has(productId)) {
      next.delete(productId);
    } else {
      next.add(productId);
    }
    this.selectedProductIds = next;
  }

  allVisibleSelected(visible: Product[]): boolean {
    return visible.length > 0 && visible.every((item) => this.selectedProductIds.has(item.id));
  }

  toggleSelectVisible(visible: Product[]): void {
    const next = new Set(this.selectedProductIds);
    if (this.allVisibleSelected(visible)) {
      visible.forEach((product) => next.delete(product.id));
    } else {
      visible.forEach((product) => next.add(product.id));
    }
    this.selectedProductIds = next;
  }

  selectAllFiltered(filtered: Product[]): void {
    this.selectedProductIds = new Set(filtered.map((product) => product.id));
  }

  clearSelection(): void {
    this.selectedProductIds = new Set();
  }

  bulkAddTag(tagId: string): void {
    if (!tagId) return;
    this.tagService.bulkAddTag(Array.from(this.selectedProductIds), tagId);
    this.openDropdownId = null;
  }

  bulkRemoveTag(tagId: string): void {
    if (!tagId) return;
    this.tagService.bulkRemoveTag(Array.from(this.selectedProductIds), tagId);
    this.openDropdownId = null;
  }

  bulkDelete(): void {
    if (this.selectedProductIds.size === 0) return;
    if (!window.confirm(`Delete ${this.selectedProductIds.size} products?`)) return;

    const selectedIds = new Set(this.selectedProductIds);
    this.products = this.products.filter((product) => !selectedIds.has(product.id));
    this.tagService.removeProducts(Array.from(selectedIds));
    this.clearSelection();
    this.cdr.markForCheck();
  }

  applyBulkPricing(): void {
    if (this.selectedProductIds.size === 0) return;

    const updates: Partial<Product> = {};
    if (this.bulkSalePrice) updates.salePrice = this.toNumber(this.bulkSalePrice, 0);
    if (this.bulkStockQty) updates.stockQty = Math.round(this.toNumber(this.bulkStockQty, 0));
    if (this.bulkLandedCost) updates.landedCost = this.toNumber(this.bulkLandedCost, 0);
    if (this.bulkPurchaseQty) updates.purchaseQty = Math.round(this.toNumber(this.bulkPurchaseQty, 0));

    if (Object.keys(updates).length === 0) {
      window.alert('Enter at least one field to update.');
      return;
    }

    const selectedIds = new Set(this.selectedProductIds);
    this.products = this.products.map((product) => {
      if (!selectedIds.has(product.id)) return product;
      const updated = { ...product, ...updates };
      return this.recalculateProduct(updated);
    });
    this.openDropdownId = null;

    this.bulkSalePrice = '';
    this.bulkStockQty = '';
    this.bulkLandedCost = '';
    this.bulkPurchaseQty = '';
    this.cdr.markForCheck();
  }

  exportSelectedCsv(filtered: Product[]): void {
    const selectedIds = new Set(this.selectedProductIds);
    const selectedProducts = filtered.filter((product) => selectedIds.has(product.id));
    if (selectedProducts.length === 0) {
      window.alert('No selected products to export.');
      return;
    }

    const headers = [
      'ID',
      'Name',
      'SKU',
      'Brand',
      'Product ID',
      'Variation ID',
      'Vendor',
      'MPN',
      'ASIN',
      'FNSKU',
      'GTIN',
      'EAN',
      'ISBN',
      'Landed Cost',
      'Shipping Cost',
      'Sale Price',
      'Purchased Qty',
      'Sold Qty',
      'Stock Qty',
      'Return Qty',
      'Profit Margin %',
      'Profit Amount',
      'Kit Product',
      'Marketplaces',
    ];

    const rows = selectedProducts.map((product) =>
      [
        product.id,
        product.name,
        product.vendorSku,
        product.brand,
        product.productId,
        product.variationId ?? '',
        product.vendorName,
        product.manufacturerPart,
        product.asin,
        product.fnsku,
        product.gtin,
        product.ean,
        product.isbn,
        product.landedCost,
        product.shippingCost,
        product.salePrice,
        product.purchaseQty,
        product.soldQty,
        product.stockQty,
        product.returnQty,
        product.grossProfitPercent,
        product.grossProfitAmount,
        product.kitProduct ? 'Yes' : 'No',
        product.marketplaces.map((market) => `${market.platform}:${market.status}`).join(';'),
      ].map((value) =>
        typeof value === 'string' && (value.includes(',') || value.includes('"'))
          ? `"${value.replace(/"/g, '""')}"`
          : value
      )
    );

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  openProductDialog(product: Product): void {
    void this.router.navigate(['/product', product.id]);
  }

  closeProductDialog(): void {
    this.productDialogOpen = false;
    this.selectedProduct = null;
    this.productDraft = {};
  }

  saveProductDialog(): void {
    if (!this.selectedProduct) return;
    const updated = { ...this.selectedProduct, ...this.productDraft } as Product;
    updated.salePrice = this.toNumber(
      this.productDraft.salePrice as number | string | undefined,
      this.selectedProduct.salePrice
    );
    updated.stockQty = Math.round(
      this.toNumber(
        this.productDraft.stockQty as number | string | undefined,
        this.selectedProduct.stockQty
      )
    );
    updated.purchaseQty = Math.round(
      this.toNumber(
        this.productDraft.purchaseQty as number | string | undefined,
        this.selectedProduct.purchaseQty
      )
    );
    updated.soldQty = Math.round(
      this.toNumber(
        this.productDraft.soldQty as number | string | undefined,
        this.selectedProduct.soldQty
      )
    );
    updated.returnQty = Math.round(
      this.toNumber(
        this.productDraft.returnQty as number | string | undefined,
        this.selectedProduct.returnQty
      )
    );

    const recalculated = this.recalculateProduct(updated);
    this.products = this.products.map((product) =>
      product.id === recalculated.id ? recalculated : product
    );
    this.closeProductDialog();
    this.cdr.markForCheck();
  }

  openMarketplaceDialog(product: Product): void {
    this.marketplaceDialogProduct = product;
    const existing = new Map(
      product.marketplaces.map((marketplace) => [marketplace.platform, marketplace])
    );
    this.marketplaceRows = this.marketplaces.map((platform) => {
      const current = existing.get(platform);
      const status = current?.status ?? 'not_listed';
      const baseMsrp = product.salePrice * 1.2;
      const soldQty = status === 'not_listed' ? 0 : Math.max(1, Math.floor(Math.random() * 50));
      const currentSalePrice = status === 'not_listed' ? 0 : product.salePrice;
      const revenue = soldQty * (currentSalePrice || product.salePrice);
      return {
        platform,
        status,
        soldQty,
        revenue,
        msrpPrice: baseMsrp,
        currentSalePrice,
        priceAutoSync: status === 'live',
        currentStock: status === 'live' ? product.stockQty : 0,
        inventoryAutoSync: status === 'live',
      };
    });
    this.marketplaceDialogTab = 'listings';
    this.marketplaceSelectedForPublish = [];
    this.marketplaceDialogOpen = true;
  }

  closeMarketplaceDialog(): void {
    this.marketplaceDialogOpen = false;
    this.marketplaceDialogProduct = null;
    this.marketplaceRows = [];
    this.marketplaceSelectedForPublish = [];
    this.marketplaceDialogTab = 'listings';
  }

  saveMarketplaceDialog(): void {
    if (!this.marketplaceDialogProduct) return;
    const marketplaces = this.marketplaceRows
      .filter((row) => row.status !== 'not_listed')
      .map((row) => ({
        platform: row.platform as MarketplaceStatus['platform'],
        status: row.status,
      }));

    const updated = {
      ...this.marketplaceDialogProduct,
      marketplaces,
    };
    this.products = this.products.map((product) =>
      product.id === updated.id ? updated : product
    );
    this.closeMarketplaceDialog();
    this.cdr.markForCheck();
  }

  openOfferDialog(
    productIds: string[],
    hideProductSelection = false,
    allowEmptySelection = false
  ): void {
    if (productIds.length === 0 && !allowEmptySelection) {
      window.alert('Select at least one product to create an offer.');
      return;
    }
    this.offerDialogOpen = true;
    this.offerDialogHideProductSelection = hideProductSelection;
    this.offerDialogAllowEmptySelection = allowEmptySelection;
    this.offerDialogProductIds = productIds;
    this.offerDialogName = '';
    this.offerDialogScope = 'product';
    this.offerDialogType = 'percent_discount';
    this.offerDialogDiscountPercent = '10';
    this.offerDialogDiscountAmount = '5';
    this.offerDialogMinQty = '2';
    this.offerDialogBuyQty = '1';
    this.offerDialogGetQty = '1';
    this.offerDialogDescription = '';
    this.offerDialogMarketplaces = [];
    this.offerDialogProductSearch = '';
    const today = new Date();
    const end = new Date();
    end.setDate(today.getDate() + 7);
    this.offerDialogStartDate = this.toDateInput(today);
    this.offerDialogEndDate = this.toDateInput(end);
  }

  closeOfferDialog(): void {
    this.offerDialogOpen = false;
    this.offerDialogProductIds = [];
    this.offerDialogHideProductSelection = false;
    this.offerDialogAllowEmptySelection = false;
    this.offerDialogProductSearch = '';
  }

  handleOfferCreated(event: { name: string; productCount: number }): void {
    const countLabel = event.productCount === 1 ? '' : 's';
    this.showToast(
      'Offer created',
      `"${event.name}" has been created for ${event.productCount} product${countLabel}.`
    );
  }

  offersForDialog(): Offer[] {
    const ids = new Set(this.offerDialogProductIds);
    return this.offers.filter((offer) =>
      offer.productIds.some((id) => ids.has(id))
    );
  }

  toggleOfferMarketplace(platform: string): void {
    if (this.offerDialogMarketplaces.includes(platform)) {
      this.offerDialogMarketplaces = this.offerDialogMarketplaces.filter(
        (item) => item !== platform
      );
      return;
    }
    this.offerDialogMarketplaces = [...this.offerDialogMarketplaces, platform];
  }

  toggleOfferProduct(productId: string): void {
    if (this.offerDialogProductIds.includes(productId)) {
      this.offerDialogProductIds = this.offerDialogProductIds.filter((id) => id !== productId);
      return;
    }
    this.offerDialogProductIds = [...this.offerDialogProductIds, productId];
  }

  filteredOfferProducts(): Product[] {
    const query = this.offerDialogProductSearch.trim().toLowerCase();
    if (!query) return this.products;
    return this.products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.vendorSku.toLowerCase().includes(query)
    );
  }

  offerDialogIsValid(): boolean {
    if (!this.offerDialogName.trim()) return false;
    if (this.offerDialogProductIds.length === 0) return false;
    if (!this.offerDialogStartDate || !this.offerDialogEndDate) return false;
    const startDate = new Date(this.offerDialogStartDate);
    const endDate = new Date(this.offerDialogEndDate);
    return endDate >= startDate;
  }

  showToast(title: string, text: string): void {
    const id = (this.toastId += 1);
    this.toastMessages = [...this.toastMessages, { id, title, text }];
    this.cdr.markForCheck();
    setTimeout(() => {
      this.toastMessages = this.toastMessages.filter((toast) => toast.id !== id);
      this.cdr.markForCheck();
    }, 3200);
  }

  marketplaceName(platform: string): string {
    return marketplaceLabelMap[platform] ?? platform;
  }

  marketplaceBadgeLabel(platform: string): string {
    return marketplaceBadgeMap[platform] ?? platform.charAt(0);
  }

  marketplaceBadgeClass(platform: string): string {
    return marketplaceBadgeClassMap[platform] ?? 'bg-muted text-muted-foreground';
  }

  marketplaceBadgeText(platform: string): string {
    const map: Record<string, string> = {
      amazon: 'AMZ',
      walmart: 'WMT',
      ebay: 'eBay',
      newegg: 'NEG',
      bestbuy: 'BBY',
      target: 'TGT',
      etsy: 'ETSY',
      shopify: 'SHOP',
      temu: 'TEMU',
      macys: 'MACY',
      costco: 'COS',
      homedepot: 'HD',
      lowes: 'LOW',
      wayfair: 'WFR',
      overstock: 'OVS',
    };
    return map[platform] ?? marketplaceBadgeMap[platform] ?? platform.toUpperCase();
  }

  marketplaceStatusDotClass(status: MarketplaceStatus['status']): string {
    switch (status) {
      case 'live':
        return 'bg-emerald-400';
      case 'error':
        return 'bg-rose-400';
      case 'inactive':
        return 'bg-amber-400';
      default:
        return 'bg-slate-400';
    }
  }

  marketplaceBadges(product: Product): MarketplaceStatus[] {
    return product.marketplaces.slice(0, this.marketplaceBadgeLimit);
  }

  marketplaceOverflowCount(product: Product): number {
    return Math.max(0, product.marketplaces.length - this.marketplaceBadgeLimit);
  }

  marketplaceLiveCount(product: Product): number {
    return product.marketplaces.filter((market) => market.status === 'live').length;
  }

  marketplaceErrorCount(product: Product): number {
    return product.marketplaces.filter((market) => market.status === 'error').length;
  }

  marketplaceInactiveCount(product: Product): number {
    return product.marketplaces.filter((market) => market.status === 'inactive').length;
  }

  duplicateProduct(product: Product): void {
    this.showToast('Product duplicated', `${product.name} copied`);
  }

  deleteProduct(product: Product): void {
    this.showToast('Product deleted', `${product.name} removed`);
  }

  saveOfferDialog(): void {
    if (!this.offerDialogIsValid()) {
      window.alert('Please complete required fields before creating the offer.');
      return;
    }
    const startDate = new Date(this.offerDialogStartDate);
    const endDate = new Date(this.offerDialogEndDate);

    const offer: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'> = {
      name: this.offerDialogName.trim(),
      description: this.offerDialogDescription.trim(),
      type: this.offerDialogType,
      scope: this.offerDialogScope,
      discountPercent:
        this.offerDialogType === 'percent_discount' ||
        this.offerDialogType === 'quantity_discount' ||
        this.offerDialogType === 'bulk_purchase'
          ? this.toNumber(this.offerDialogDiscountPercent, 0)
          : undefined,
      discountAmount:
        this.offerDialogType === 'fixed_discount'
          ? this.toNumber(this.offerDialogDiscountAmount, 0)
          : undefined,
      startDate,
      endDate,
      productIds: [...this.offerDialogProductIds],
      marketplaces: [...this.offerDialogMarketplaces],
      isActive: true,
      condition:
        this.offerDialogType === 'quantity_discount' ||
          this.offerDialogType === 'bulk_purchase'
          ? { minQty: this.toNumber(this.offerDialogMinQty, 2) }
          : this.offerDialogType === 'bogo_half' ||
            this.offerDialogType === 'bogo_free'
            ? {
                buyQty: this.toNumber(this.offerDialogBuyQty, 1),
                getQty: this.toNumber(this.offerDialogGetQty, 1),
              }
            : undefined,
    };

    const productCount = this.offerDialogProductIds.length;
    const offerName = this.offerDialogName.trim();
    this.offerService.addOffer(offer);
    this.closeOfferDialog();
    this.showToast(
      'Offer created',
      `"${offerName}" has been created for ${productCount} product${productCount === 1 ? '' : 's'}.`
    );
  }

  deleteOffer(offerId: string): void {
    this.offerService.deleteOffer(offerId);
  }

  bestOffer(productId: string): Offer | null {
    return this.offerService.getBestOfferForProduct(productId);
  }

  offerLabel(offer: Offer): string {
    return formatOfferDiscount(offer);
  }

  formatOfferDiscount(offer: Offer): string {
    return formatOfferDiscount(offer);
  }

  offerStatusLabel(offer: Offer): string {
    const status = getOfferStatus(offer);
    const config = offerStatusConfig[status];
    if (status === 'ending_soon') {
      return `${config.label} (${getOfferDaysRemaining(offer)}d left)`;
    }
    return config.label;
  }

  offerStatusClass(offer: Offer): string {
    const status = getOfferStatus(offer);
    const config = offerStatusConfig[status];
    return `${config.bgColor} ${config.color}`;
  }

  marketplaceCount(product: Product, status: MarketplaceStatus['status']): number {
    return product.marketplaces.filter((market) => market.status === status).length;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  marketplaceRowCount(status: MarketplaceStatus['status']): number {
    return this.marketplaceRows.filter((row) => row.status === status).length;
  }

  marketplaceDialogOffers(): Offer[] {
    if (!this.marketplaceDialogProduct) return [];
    return this.offersForProduct(this.marketplaceDialogProduct.id);
  }

  marketplaceOfferStatusLabel(offer: Offer): string {
    const status = getOfferStatus(offer);
    return offerStatusConfig[status].label;
  }

  offerDaysLabel(offer: Offer): string {
    const status = getOfferStatus(offer);
    if (status === 'active' || status === 'ending_soon') {
      return `${getOfferDaysRemaining(offer)} days left`;
    }
    if (status === 'scheduled') {
      return `Starts ${offer.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    return 'Expired';
  }

  marketplaceStatusLabel(status: MarketplaceStatus['status']): string {
    switch (status) {
      case 'live':
        return 'Live';
      case 'inactive':
        return 'Inactive';
      case 'error':
        return 'Error';
      default:
        return 'Not Listed';
    }
  }

  marketplaceStatusBadgeClass(status: MarketplaceStatus['status']): string {
    switch (status) {
      case 'live':
        return 'bg-emerald-500/20 text-emerald-400';
      case 'inactive':
        return 'bg-slate-600/60 text-slate-200';
      case 'error':
        return 'bg-rose-500/20 text-rose-300';
      default:
        return 'border border-slate-500 text-slate-300 border-dashed';
    }
  }

  marketplaceCanPublish(status: MarketplaceStatus['status']): boolean {
    return status !== 'live';
  }

  toggleMarketplaceSelection(platform: string): void {
    const row = this.marketplaceRows.find((item) => item.platform === platform);
    if (!row || !this.marketplaceCanPublish(row.status)) return;
    if (this.marketplaceSelectedForPublish.includes(platform)) {
      this.marketplaceSelectedForPublish = this.marketplaceSelectedForPublish.filter(
        (item) => item !== platform
      );
      return;
    }
    this.marketplaceSelectedForPublish = [
      ...this.marketplaceSelectedForPublish,
      platform,
    ];
  }

  marketplaceDirectPublish(platform: string): void {
    this.marketplaceIsPublishing = true;
    this.marketplaceRows = this.marketplaceRows.map((row) =>
      row.platform === platform
        ? {
            ...row,
            status: 'inactive',
            currentSalePrice: row.currentSalePrice || this.marketplaceDialogProduct?.salePrice || 0,
            currentStock: row.currentStock || this.marketplaceDialogProduct?.stockQty || 0,
          }
        : row
    );
    this.marketplaceIsPublishing = false;
    this.showToast('Published', `Marketplace ${platform} is now inactive`);
  }

  marketplaceBulkPublish(method: 'manual' | 'upc' | 'ai'): void {
    if (this.marketplaceSelectedForPublish.length === 0) {
      this.showToast('No marketplaces selected', 'Select marketplaces to publish');
      return;
    }
    const selected = new Set(this.marketplaceSelectedForPublish);
    this.marketplaceIsPublishing = true;
    this.marketplaceRows = this.marketplaceRows.map((row) =>
      selected.has(row.platform)
        ? {
            ...row,
            status: 'inactive',
            currentSalePrice: row.currentSalePrice || this.marketplaceDialogProduct?.salePrice || 0,
            currentStock: row.currentStock || this.marketplaceDialogProduct?.stockQty || 0,
          }
        : row
    );
    const count = this.marketplaceSelectedForPublish.length;
    this.marketplaceSelectedForPublish = [];
    this.marketplaceIsPublishing = false;
    const methodLabels: Record<typeof method, string> = { manual: 'Manual', upc: 'UPC', ai: 'AI' };
    this.showToast('Published', `${count} marketplace(s) via ${methodLabels[method]}`);
  }

  updateMarketplaceMsrp(platform: string, value: string): void {
    const amount = this.toNumber(value, 0);
    this.marketplaceRows = this.marketplaceRows.map((row) =>
      row.platform === platform ? { ...row, msrpPrice: amount } : row
    );
  }

  marketplaceDiscountPercent(row: MarketplaceRow): number {
    if (!row.msrpPrice) return 0;
    if (!row.currentSalePrice) return 0;
    return Math.max(0, Math.round((1 - row.currentSalePrice / row.msrpPrice) * 100));
  }

  updateMarketplaceDiscount(platform: string, value: string): void {
    const discount = this.toNumber(value, 0);
    this.marketplaceRows = this.marketplaceRows.map((row) => {
      if (row.platform !== platform) return row;
      const salePrice = row.msrpPrice ? row.msrpPrice * (1 - discount / 100) : row.currentSalePrice;
      return { ...row, currentSalePrice: Number.isFinite(salePrice) ? salePrice : row.currentSalePrice };
    });
  }

  updateMarketplaceSalePrice(platform: string, value: string): void {
    const amount = this.toNumber(value, 0);
    this.marketplaceRows = this.marketplaceRows.map((row) =>
      row.platform === platform ? { ...row, currentSalePrice: amount } : row
    );
  }

  updateMarketplaceStock(platform: string, value: string): void {
    const stock = Math.max(0, Math.floor(this.toNumber(value, 0)));
    this.marketplaceRows = this.marketplaceRows.map((row) =>
      row.platform === platform ? { ...row, currentStock: stock } : row
    );
  }

  toggleMarketplacePriceSync(platform: string): void {
    this.marketplaceRows = this.marketplaceRows.map((row) =>
      row.platform === platform ? { ...row, priceAutoSync: !row.priceAutoSync } : row
    );
  }

  toggleMarketplaceInventorySync(platform: string): void {
    this.marketplaceRows = this.marketplaceRows.map((row) =>
      row.platform === platform ? { ...row, inventoryAutoSync: !row.inventoryAutoSync } : row
    );
  }

  openMarketplaceEditOffer(offer: Offer): void {
    this.marketplaceEditingOffer = offer;
    this.marketplaceEditName = offer.name;
    this.marketplaceEditDescription = offer.description || '';
    this.marketplaceEditType = offer.type;
    this.marketplaceEditScope = offer.scope;
    this.marketplaceEditDiscountPercent = String(offer.discountPercent ?? 10);
    this.marketplaceEditDiscountAmount = String(offer.discountAmount ?? 5);
    this.marketplaceEditMinQty = String(offer.condition?.minQty ?? 2);
    this.marketplaceEditBuyQty = String(offer.condition?.buyQty ?? 1);
    this.marketplaceEditGetQty = String(offer.condition?.getQty ?? 1);
    this.marketplaceEditStartDate = this.toDateInput(offer.startDate);
    this.marketplaceEditEndDate = this.toDateInput(offer.endDate);
    this.marketplaceEditMarketplaces = [...offer.marketplaces];
    this.marketplaceEditIsActive = offer.isActive;
    this.marketplaceEditOfferOpen = true;
  }

  closeMarketplaceEditOffer(): void {
    this.marketplaceEditOfferOpen = false;
    this.marketplaceEditingOffer = null;
  }

  toggleMarketplaceEditMarketplace(platform: string): void {
    if (this.marketplaceEditMarketplaces.includes(platform)) {
      this.marketplaceEditMarketplaces = this.marketplaceEditMarketplaces.filter(
        (item) => item !== platform
      );
      return;
    }
    this.marketplaceEditMarketplaces = [...this.marketplaceEditMarketplaces, platform];
  }

  saveMarketplaceEditOffer(): void {
    if (!this.marketplaceEditingOffer) return;
    const updates: Partial<Offer> = {
      name: this.marketplaceEditName,
      description: this.marketplaceEditDescription,
      type: this.marketplaceEditType,
      scope: this.marketplaceEditScope,
      discountPercent: ['percent_discount', 'quantity_discount', 'bulk_purchase'].includes(
        this.marketplaceEditType
      )
        ? this.toNumber(this.marketplaceEditDiscountPercent, 0)
        : undefined,
      discountAmount: this.marketplaceEditType === 'fixed_discount'
        ? this.toNumber(this.marketplaceEditDiscountAmount, 0)
        : undefined,
      condition:
        this.marketplaceEditType === 'quantity_discount' || this.marketplaceEditType === 'bulk_purchase'
          ? { minQty: this.toNumber(this.marketplaceEditMinQty, 1) }
          : this.marketplaceEditType === 'bogo_half' || this.marketplaceEditType === 'bogo_free'
            ? {
                buyQty: this.toNumber(this.marketplaceEditBuyQty, 1),
                getQty: this.toNumber(this.marketplaceEditGetQty, 1),
              }
            : undefined,
      startDate: new Date(this.marketplaceEditStartDate),
      endDate: new Date(this.marketplaceEditEndDate),
      marketplaces: [...this.marketplaceEditMarketplaces],
      isActive: this.marketplaceEditIsActive,
    };
    this.offerService.updateOffer(this.marketplaceEditingOffer.id, updates);
    this.showToast('Offer updated', this.marketplaceEditName);
    this.closeMarketplaceEditOffer();
  }

  deleteMarketplaceOffer(offer: Offer): void {
    this.offerService.deleteOffer(offer.id);
    this.showToast('Offer deleted', offer.name);
  }

  copySku(sku: string | undefined): void {
    if (!sku) return;
    navigator.clipboard
      .writeText(sku)
      .then(() => this.showToast('Copied', `SKU ${sku}`))
      .catch(() => this.showToast('Copy failed', 'Unable to copy SKU'));
  }

  offersForProduct(productId: string): Offer[] {
    return this.offers.filter((offer) => {
      const status = getOfferStatus(offer);
      return (
        offer.isActive &&
        offer.productIds.includes(productId) &&
        status !== 'expired'
      );
    });
  }

  visibleOffers(productId: string): Offer[] {
    return this.offersForProduct(productId).slice(0, 2);
  }

  remainingOfferCount(productId: string): number {
    const count = this.offersForProduct(productId).length;
    return Math.max(0, count - 2);
  }

  typeBadgeLabel(product: Product): string {
    if (product.productType === 'kit') {
      return `Kit (${product.kitComponents?.length || 0})`;
    }
    if (product.productType === 'variation') {
      return 'Variation';
    }
    return 'Single';
  }

  typeBadgeClass(product: Product): string {
    if (product.productType === 'kit') {
      return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
    }
    if (product.productType === 'variation') {
      return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
    }
    return 'bg-muted text-muted-foreground border border-border';
  }

  openBulkOffer(): void {
    this.openOfferDialog(Array.from(this.selectedProductIds), false, true);
  }

  openBulkListing(): void {
    const selected = this.products.filter((product) =>
      this.selectedProductIds.has(product.id)
    );
    if (selected.length === 0) {
      window.alert('Select at least one product to list.');
      return;
    }
    this.bulkListingProducts = selected;
    this.bulkListingBatchName = '';
    this.bulkListingPublishMethod = 'ai';
    this.bulkListingMarketplaces = [];
    this.bulkListingEditedItems = {};
    this.bulkListingStep = 'configure';
    this.bulkListingFillOpen = false;
    this.bulkListingFillStock = '';
    this.bulkListingFillPrice = '';
    this.bulkListingFillShipping = '';
    this.bulkListingFillMsrp = '';
    this.bulkListingFillCondition = 'New';
    this.bulkListingOpen = true;
  }

  closeBulkListing(): void {
    this.bulkListingOpen = false;
    this.bulkListingStep = 'configure';
    this.bulkListingEditedItems = {};
    this.bulkListingFillOpen = false;
  }

  bulkListingSelectedMethod() {
    return this.bulkListingMethods.find(
      (method) => method.id === this.bulkListingPublishMethod
    );
  }

  bulkListingTotalItems(): number {
    return this.bulkListingProducts.length * this.bulkListingMarketplaces.length;
  }

  bulkListingCanProceed(): boolean {
    return (
      this.bulkListingBatchName.trim().length > 0 &&
      this.bulkListingMarketplaces.length > 0
    );
  }

  bulkListingToggleMarketplace(marketplace: string): void {
    if (this.bulkListingMarketplaces.includes(marketplace)) {
      this.bulkListingMarketplaces = this.bulkListingMarketplaces.filter(
        (item) => item !== marketplace
      );
      return;
    }
    this.bulkListingMarketplaces = [...this.bulkListingMarketplaces, marketplace];
  }

  bulkListingSelectAllMarketplaces(): void {
    this.bulkListingMarketplaces = [...this.marketplaces];
  }

  bulkListingClearMarketplaces(): void {
    this.bulkListingMarketplaces = [];
  }

  bulkListingProceedToPreview(): void {
    if (!this.bulkListingCanProceed()) return;
    this.bulkListingInitializeEditedItems();
    this.bulkListingStep = 'preview';
  }

  bulkListingItemKey(productId: string, marketplace: string): string {
    return `${productId}|${marketplace}`;
  }

  bulkListingInitializeEditedItems(): void {
    const initial: Record<string, BulkListingItemData> = {};
    this.bulkListingProducts.forEach((product) => {
      this.bulkListingMarketplaces.forEach((marketplace) => {
        const key = this.bulkListingItemKey(product.id, marketplace);
        initial[key] = {
          sku: product.vendorSku || '',
          stockQty: product.stockQty ?? null,
          salePrice: product.salePrice ?? null,
          msrp: null,
          shippingCost: null,
          condition: 'New',
        };
      });
    });
    this.bulkListingEditedItems = initial;
  }

  bulkListingUpdateItemField(
    productId: string,
    marketplace: string,
    field: keyof BulkListingItemData,
    value: string | number | null
  ): void {
    const key = this.bulkListingItemKey(productId, marketplace);
    this.bulkListingEditedItems = {
      ...this.bulkListingEditedItems,
      [key]: {
        ...this.bulkListingEditedItems[key],
        [field]: value,
      },
    };
  }

  bulkListingCopyToAllMarketplaces(productId: string, sourceMarketplace: string): void {
    const sourceKey = this.bulkListingItemKey(productId, sourceMarketplace);
    const sourceData = this.bulkListingEditedItems[sourceKey];
    if (!sourceData) return;
    const updated = { ...this.bulkListingEditedItems };
    this.bulkListingMarketplaces.forEach((marketplace) => {
      if (marketplace === sourceMarketplace) return;
      const key = this.bulkListingItemKey(productId, marketplace);
      updated[key] = { ...sourceData };
    });
    this.bulkListingEditedItems = updated;
  }

  bulkListingApplyFill(field: keyof BulkListingItemData, rawValue: string): void {
    if (!rawValue && field !== 'condition') return;
    let value: string | number | null = rawValue;
    if (field !== 'sku' && field !== 'condition') {
      value = rawValue ? Number(rawValue) : null;
    }
    const updated = { ...this.bulkListingEditedItems };
    Object.keys(updated).forEach((key) => {
      updated[key] = { ...updated[key], [field]: value };
    });
    this.bulkListingEditedItems = updated;
    this.showToast('Updated', `Applied ${field} to all listings.`);
  }

  bulkListingItemStatus(productId: string, marketplace: string): { missingFields: string[]; hasIssues: boolean } {
    const key = this.bulkListingItemKey(productId, marketplace);
    const edited = this.bulkListingEditedItems[key];
    const missingFields: string[] = [];
    if (!edited?.sku) missingFields.push('SKU');
    if (edited?.salePrice === null || edited?.salePrice === undefined) missingFields.push('Price');
    if (edited?.stockQty === null || edited?.stockQty === undefined) missingFields.push('Stock');
    return { missingFields, hasIssues: missingFields.length > 0 };
  }

  bulkListingItemsWithIssues(): number {
    let count = 0;
    this.bulkListingProducts.forEach((product) => {
      this.bulkListingMarketplaces.forEach((marketplace) => {
        if (this.bulkListingItemStatus(product.id, marketplace).hasIssues) count += 1;
      });
    });
    return count;
  }

  bulkListingPreviewItems(): Array<{
    product: Product;
    marketplace: string;
    key: string;
    isFirstForProduct: boolean;
  }> {
    const items: Array<{
      product: Product;
      marketplace: string;
      key: string;
      isFirstForProduct: boolean;
    }> = [];
    this.bulkListingProducts.forEach((product) => {
      this.bulkListingMarketplaces.forEach((marketplace, index) => {
        items.push({
          product,
          marketplace,
          key: this.bulkListingItemKey(product.id, marketplace),
          isFirstForProduct: index === 0,
        });
      });
    });
    return items;
  }

  trackByBulkListingItem(index: number, item: { key: string }): string {
    return item.key;
  }

  bulkListingCreateBatch(): void {
    const totalItems = this.bulkListingTotalItems();
    const batchName = this.bulkListingBatchName.trim();
    this.closeBulkListing();
    this.showToast('Batch created', `"${batchName}" created with ${totalItems} listings.`);
  }

  parseNumberInput(value: string): number | null {
    if (value === undefined || value === null || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  openHistory(): void {
    window.alert('History view is not wired yet.');
  }

  isColumnVisible(columnId: string): boolean {
    return this.columns.find((column) => column.id === columnId)?.visible ?? true;
  }

  toggleColumn(columnId: string): void {
    this.columns = this.columns.map((column) =>
      column.id === columnId ? { ...column, visible: !column.visible } : column
    );
    this.saveColumns();
    this.cdr.markForCheck();
  }

  toggleDropdown(id: string): void {
    this.openDropdownId = this.openDropdownId === id ? null : id;
    if (this.openDropdownId) {
      requestAnimationFrame(() => this.positionDropdown(this.openDropdownId as string));
    }
  }

  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const dropdown = target.closest('details[data-dropdown]');
    if (!dropdown) {
      this.openDropdownId = null;
    }
    if (!target.closest('.tag-picker-panel') && !target.closest('.tag-picker-trigger')) {
      this.tagPickerProductId = null;
    }
  }

  @HostListener('document:mouseover', ['$event'])
  handleTooltipHover(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const tooltipHost = target.closest('[data-tooltip]') as HTMLElement | null;
    if (!tooltipHost) return;
    this.positionTooltip(tooltipHost);
  }

  @HostListener('window:resize')
  handleResize(): void {
    if (this.openDropdownId) {
      this.positionDropdown(this.openDropdownId);
    }
  }

  private positionDropdown(id: string): void {
    const details = document.querySelector(
      `details[data-dropdown="${id}"]`
    ) as HTMLElement | null;
    if (!details) return;
    const panel = details.querySelector<HTMLElement>('[data-dropdown-panel]');
    const trigger = details.querySelector<HTMLElement>('summary');
    if (!panel || !trigger) return;

    panel.style.left = '';
    panel.style.right = '';
    panel.dataset['position'] = 'bottom';

    const triggerRect = trigger.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (triggerRect.left + panelRect.width > viewportWidth - 12) {
      panel.style.right = '0';
    } else {
      panel.style.left = '0';
    }

    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    if (panelRect.height > spaceBelow && spaceAbove > spaceBelow) {
      panel.dataset['position'] = 'top';
    }
  }

  private positionTooltip(element: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipWidth = 200;
    const spaceAbove = rect.top;
    const spaceBelow = viewportHeight - rect.bottom;

    let position: 'top' | 'bottom' | 'left' | 'right' = 'top';
    if (viewportWidth - rect.right < tooltipWidth) {
      position = 'left';
    } else if (rect.left < tooltipWidth) {
      position = 'right';
    } else if (spaceBelow > spaceAbove) {
      position = 'bottom';
    }

    element.dataset['tooltipPosition'] = position;
  }

  startColumnDrag(columnId: string, event: DragEvent): void {
    this.draggedColumnId = columnId;
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', columnId);
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  endColumnDrag(): void {
    this.draggedColumnId = null;
  }

  allowColumnDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onColumnDrop(targetId: string): void {
    if (!this.draggedColumnId || this.draggedColumnId === targetId) return;
    const fromIndex = this.columns.findIndex(
      (column) => column.id === this.draggedColumnId
    );
    const toIndex = this.columns.findIndex(
      (column) => column.id === targetId
    );
    if (fromIndex === -1 || toIndex === -1) return;
    const updated = [...this.columns];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    this.columns = updated;
    this.saveColumns();
    this.cdr.markForCheck();
  }

  columnTooltip(columnId: ColumnId): string {
    return columnTooltips[columnId] ?? columnId;
  }

  columnWidth(columnId: string): number {
    return this.columnWidths[columnId] ?? this.defaultColumnWidths[columnId] ?? 100;
  }

  startResize(event: MouseEvent, columnId: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.resizingColumnId = columnId;
    this.resizeStartX = event.clientX;
    this.resizeStartWidth = this.columnWidth(columnId);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!this.resizingColumnId) return;
      const diff = moveEvent.clientX - this.resizeStartX;
      const nextWidth = Math.max(20, this.resizeStartWidth + diff);
      this.columnWidths = {
        ...this.columnWidths,
        [this.resizingColumnId]: nextWidth,
      };
      this.cdr.markForCheck();
    };

    const handleMouseUp = () => {
      this.resizingColumnId = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      this.saveColumnWidths();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  previousPage(): void {
    this.currentPage = Math.max(1, this.currentPage - 1);
  }

  nextPage(total: number): void {
    this.currentPage = Math.min(this.totalPages(total), this.currentPage + 1);
  }

  goToPage(page: number): void {
    const total = this.totalPages(this.filteredProducts().length);
    this.currentPage = Math.min(Math.max(1, page), total);
  }

  visiblePages(totalItems: number): number[] {
    const total = this.totalPages(totalItems);
    const maxPages = 5;
    const current = this.currentPage;
    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + maxPages - 1);
    start = Math.max(1, end - maxPages + 1);

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }

  soldQty(product: Product): number {
    switch (this.filters.soldPeriod) {
      case 'lastMonth':
        return product.soldQtyLastMonth;
      case 'lastQuarter':
        return product.soldQtyLastQuarter;
      case 'lastYear':
        return product.soldQtyLastYear;
      default:
        return product.soldQty;
    }
  }

  soldPeriodLabel(period: SoldPeriod): string {
    if (period === 'custom') return 'Custom';
    const match = this.soldPeriods.find((option) => option.value === period);
    return match ? match.label : 'All time';
  }

  marketplaceSummary(product: Product): string {
    if (product.marketplaces.length === 0) {
      return 'No marketplace data';
    }
    return product.marketplaces
      .slice(0, 2)
      .map((market) => market.platform)
      .join(', ');
  }

  statusLabel(status: StatusFilter): string {
    return status === 'not_listed' ? 'Not listed' : status;
  }

  statusCount(status: StatusFilter): number {
    if (status === 'not_listed') {
      return this.products.filter((product) => product.marketplaces.length === 0)
        .length;
    }
    return this.products.filter((product) =>
      product.marketplaces.some((market) => market.status === status)
    ).length;
  }

  trackById(_: number, product: Product): string {
    return product.id;
  }

  toggleTagFilter(tagId: string): void {
    const selected = this.filters.tags.includes(tagId)
      ? this.filters.tags.filter((id) => id !== tagId)
      : [...this.filters.tags, tagId];
    this.filters = { ...this.filters, tags: selected };
    this.onFilterChange();
  }

  tagUsageCount(tagId: string): number {
    return Object.values(this.productTags).reduce((count, ids) => {
      return ids.includes(tagId) ? count + 1 : count;
    }, 0);
  }

  getProductTags(productId: string): Tag[] {
    const ids = this.productTags[productId] || [];
    return this.tags.filter((tag) => ids.includes(tag.id));
  }

  hasTag(productId: string, tagId: string): boolean {
    return (this.productTags[productId] || []).includes(tagId);
  }

  toggleProductTag(productId: string, tagId: string): void {
    this.tagService.toggleProductTag(productId, tagId);
  }

  removeTagFromProduct(productId: string, tagId: string): void {
    if (this.hasTag(productId, tagId)) {
      this.tagService.toggleProductTag(productId, tagId);
    }
  }

  toggleTagPicker(productId: string): void {
    this.tagPickerProductId =
      this.tagPickerProductId === productId ? null : productId;
  }

  openTagForm(): void {
    this.tagFormOpen = true;
    this.editingTag = null;
    this.tagName = '';
    this.tagColor = tagColors[0].value;
  }

  editTag(tag: Tag): void {
    this.tagFormOpen = true;
    this.editingTag = tag;
    this.tagName = tag.name;
    this.tagColor = tag.color;
  }

  cancelTagForm(): void {
    this.tagFormOpen = false;
    this.editingTag = null;
    this.tagName = '';
    this.tagColor = tagColors[0].value;
  }

  setTagColor(color: string): void {
    this.tagColor = color;
  }

  saveTag(): void {
    const trimmedName = this.tagName.trim();
    if (!trimmedName || !this.tagColor) return;

    const tag: Tag = {
      id: this.editingTag?.id ?? `tag-${Date.now()}`,
      name: trimmedName,
      color: this.tagColor,
    };
    this.tagService.addTag(tag);
    this.tagFormOpen = false;
    this.editingTag = null;
  }

  deleteTag(tag: Tag): void {
    if (window.confirm(`Delete tag "${tag.name}"?`)) {
      this.tagService.deleteTag(tag.id);
    }
  }

  private setCsvData(headers: string[], rows: string[][]): void {
    this.csvHeaders = headers;
    this.csvRows = rows;
    this.csvFieldMapping = this.autoMapCsvFields(headers);
    this.csvStep = 'mapping';
    this.cdr.markForCheck();
  }

  private parseCsv(text: string): { headers: string[]; rows: string[][] } {
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    const headers = lines[0]?.split(',').map((header) => header.replace(/^"|"$/g, '').trim()) || [];
    const rows = lines.slice(1).map((line) => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
    return { headers, rows };
  }

  private parseExcel(buffer: ArrayBuffer): { headers: string[]; rows: string[][] } {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(
      sheet,
      { header: 1, raw: false }
    );
    const [headerRow, ...rows] = data;
    const headers = (headerRow ?? []).map(
      (header: string | number | boolean | null) => `${header ?? ''}`.trim()
    );
    const parsedRows = rows.map((row) =>
      row.map((cell: string | number | boolean | null) => `${cell ?? ''}`.trim())
    );
    return { headers, rows: parsedRows };
  }

  private autoMapCsvFields(headers: string[]): Record<string, string> {
    const normalized = (value: string) => value.toLowerCase().replace(/[_\s]/g, '');
    const mapping: Record<string, string> = {};
    csvFields.forEach((field) => {
      const match = headers.find(
        (header) =>
          normalized(header) === normalized(field.label) ||
          normalized(header) === normalized(field.id)
      );
      if (match) {
        mapping[field.id] = match;
      }
    });
    return mapping;
  }

  private mapCsvRows(): Record<string, string>[] {
    return this.csvRows
      .map((row) => {
        const record: Record<string, string> = {};
        Object.entries(this.csvFieldMapping).forEach(([fieldId, header]) => {
          if (!header || header === '_skip') return;
          const headerIndex = this.csvHeaders.indexOf(header);
          if (headerIndex === -1) return;
          record[fieldId] = row[headerIndex] || '';
        });
        return record;
      })
      .filter((record) => record['name'] || record['vendorSku']);
  }

  private applyCsvUpdates(
    products: Product[],
    updates: Record<string, string>[]
  ): Product[] {
    if (this.csvMatchFields.length === 0) return products;
    return products.map((product) => {
      const match = updates.find((record) =>
        this.csvMatchFields.some((fieldId) => {
          const value = record[fieldId];
          if (!value) return false;
          const productValue = this.getProductFieldValue(product, fieldId);
          return productValue != null && `${productValue}` === value;
        })
      );
      if (!match) return product;
      return this.updateProductFromRecord(product, match);
    });
  }

  private createProductFromInput(input: ProductInput): Product {
    const id = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const salePrice = this.toNumber(input['salePrice'], 0);
    const landedCost = this.toNumber(input['landedCost'], 0);
    const shippingCost = this.toNumber(input['shippingCost'], 0);
    const purchaseQty = Math.round(this.toNumber(input['purchaseQty'], 0));
    const soldQty = Math.round(this.toNumber(input['soldQty'], 0));
    const returnQty = Math.round(this.toNumber(input['returnQty'], 0));
    const stockQty = Math.round(
      this.toNumber(
        input['stockQty'],
        Math.max(purchaseQty - soldQty + returnQty, 0)
      )
    );

    const base: Product = {
      id,
      image: input['image'] || `https://picsum.photos/seed/${id}/100/100`,
      name: input['name'] || 'New Product',
      vendorSku: input['vendorSku'] || `SKU-${id}`,
      manufacturerPart: input['manufacturerPart'] || '',
      asin: input['asin'] || '',
      fnsku: input['fnsku'] || '',
      gtin: input['gtin'] || '',
      ean: input['ean'] || '',
      isbn: input['isbn'] || '',
      inventoryDifference: 0,
      productId: input['productId'] || id,
      variationId: null,
      variation: null,
      vendorName: input['vendorName'] || '',
      brand: input['brand'] || '',
      kitProduct: false,
      productType: (input['productType'] as ProductType) || 'single',
      kitComponents: [],
      landedCost,
      shippingCost,
      salePrice,
      purchaseQty,
      soldQty,
      soldQtyLastMonth: Math.min(soldQty, 20),
      soldQtyLastQuarter: Math.min(soldQty, 50),
      soldQtyLastYear: soldQty,
      stockQty,
      returnQty,
      grossProfitPercent: 0,
      grossProfitAmount: 0,
      marketplaces: [],
      velocity: 0,
      stockDays: 0,
      restockStatus: 'in_stock',
      suggestedRestockQty: 0,
    };

    return this.recalculateProduct(base);
  }

  private updateProductFromRecord(
    product: Product,
    record: Record<string, string>
  ): Product {
    const updated: Product = { ...product };
    const numberFields: Array<keyof Product> = [
      'salePrice',
      'landedCost',
      'shippingCost',
      'grossProfitPercent',
      'grossProfitAmount',
      'velocity',
      'stockDays',
      'suggestedRestockQty',
      'inventoryDifference',
    ];
    const intFields: Array<keyof Product> = [
      'purchaseQty',
      'soldQty',
      'stockQty',
      'returnQty',
      'soldQtyLastMonth',
      'soldQtyLastQuarter',
      'soldQtyLastYear',
    ];
    const stringFields: Array<keyof Product> = [
      'name',
      'vendorSku',
      'brand',
      'productId',
      'vendorName',
      'manufacturerPart',
      'asin',
      'fnsku',
      'gtin',
      'ean',
      'isbn',
    ];

    Object.entries(record).forEach(([field, value]) => {
      if (!value) return;
      if (numberFields.includes(field as keyof Product)) {
        const key = field as keyof Product;
        updated[key] = this.toNumber(value, updated[key] as number) as never;
        return;
      }
      if (intFields.includes(field as keyof Product)) {
        const key = field as keyof Product;
        updated[key] = Math.round(
          this.toNumber(value, updated[key] as number)
        ) as never;
        return;
      }
      if (stringFields.includes(field as keyof Product)) {
        const key = field as keyof Product;
        updated[key] = value as never;
      }
    });

    return this.recalculateProduct(updated);
  }

  private getProductFieldValue(
    product: Product,
    fieldId: string
  ): string | number | null {
    const field = fieldId as keyof Product;
    if (field in product) {
      const value = product[field];
      if (typeof value === 'string' || typeof value === 'number') {
        return value;
      }
    }
    return null;
  }

  private recalculateProduct(product: Product): Product {
    const grossProfitAmount = product.salePrice - product.landedCost - product.shippingCost;
    const grossProfitPercent = product.salePrice
      ? Math.round(((grossProfitAmount / product.salePrice) * 100) * 100) / 100
      : 0;

    const velocity = Math.round((product.soldQtyLastMonth / 30) * 100) / 100;
    const stockDays = velocity > 0 ? Math.round(product.stockQty / velocity) : product.stockQty > 0 ? 999 : 0;
    let restockStatus: Product['restockStatus'];
    if (product.stockQty === 0) {
      restockStatus = 'out_of_stock';
    } else if (stockDays <= 7) {
      restockStatus = 'reorder_now';
    } else if (stockDays <= 30) {
      restockStatus = 'low_stock';
    } else {
      restockStatus = 'in_stock';
    }

    const suggestedRestockQty = velocity > 0 ? Math.max(0, Math.ceil(velocity * 60 - product.stockQty)) : 0;

    return {
      ...product,
      grossProfitAmount: Math.round(grossProfitAmount * 100) / 100,
      grossProfitPercent,
      velocity,
      stockDays,
      restockStatus,
      suggestedRestockQty,
    };
  }

  private toNumber(value: string | number | undefined, fallback: number): number {
    if (value === undefined || value === null || value === '') return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private toDateInput(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private withinRange(value: number, range: [number, number]): boolean {
    return value >= range[0] && value <= range[1];
  }

  private restorePreferences(): void {
    const savedFilters = this.loadFilters();
    if (savedFilters) {
      this.filters = savedFilters;
    }

    const savedPageSize = this.loadPageSize();
    if (savedPageSize) {
      this.pageSize = savedPageSize;
    }

    const savedColumns = this.loadColumns();
    if (savedColumns) {
      const visibility = this.isColumnPreferences(savedColumns)
        ? savedColumns.visibility
        : savedColumns;
      this.columns = this.columns.map((column) => {
        const saved = visibility[column.id];
        return saved !== undefined ? { ...column, visible: saved } : column;
      });

      const order = this.isColumnPreferences(savedColumns)
        ? savedColumns.order
        : null;
      if (order && Array.isArray(order)) {
        const map = new Map(this.columns.map((column) => [column.id, column]));
        const ordered = order
          .map((id: string) => map.get(id as ColumnId))
          .filter((column): column is ColumnConfig => Boolean(column));
        const remaining = this.columns.filter(
          (column) => !order.includes(column.id)
        );
        this.columns = [...ordered, ...remaining];
      }
    }

    const savedWidths = this.loadColumnWidths();
    if (savedWidths) {
      this.columnWidths = {
        ...this.columnWidths,
        ...savedWidths,
      };
    }
  }

  private saveFilters(): void {
    try {
      const payload = {
        ...this.filters,
        soldDateRange: this.filters.soldDateRange.map((date) =>
          date ? date.toISOString() : null
        ),
      };
      localStorage.setItem(this.filtersStorageKey, JSON.stringify(payload));
    } catch (error) {
      console.warn('Failed to save filters', error);
    }
  }

  private loadFilters(): FilterState | null {
    try {
      const stored = localStorage.getItem(this.filtersStorageKey);
      if (!stored) return null;
      const parsed = JSON.parse(stored) as FilterState & {
        soldDateRange?: Array<string | null>;
      };
      const soldDateRange =
        parsed.soldDateRange?.map((value) =>
          value ? new Date(value) : null
        ) ?? [null, null];
      return {
        ...parsed,
        soldDateRange: soldDateRange as [Date | null, Date | null],
      };
    } catch (error) {
      console.warn('Failed to load filters', error);
      return null;
    }
  }

  private saveColumns(): void {
    try {
      const payload: ColumnPreferences = {
        order: this.columns.map((column) => column.id),
        visibility: this.columns.reduce<Record<string, boolean>>(
          (acc, column) => {
            acc[column.id] = column.visible;
            return acc;
          },
          {}
        ),
      };
      localStorage.setItem(this.columnsStorageKey, JSON.stringify(payload));
    } catch (error) {
      console.warn('Failed to save columns', error);
    }
  }

  private loadColumns(): ColumnPreferences | Record<string, boolean> | null {
    try {
      const stored = localStorage.getItem(this.columnsStorageKey);
      return stored
        ? (JSON.parse(stored) as ColumnPreferences | Record<string, boolean>)
        : null;
    } catch (error) {
      console.warn('Failed to load columns', error);
      return null;
    }
  }

  private isColumnPreferences(
    value: ColumnPreferences | Record<string, boolean>
  ): value is ColumnPreferences {
    const candidate = value as ColumnPreferences;
    return (
      typeof value === 'object' &&
      value !== null &&
      Array.isArray(candidate.order) &&
      typeof candidate.visibility === 'object' &&
      candidate.visibility !== null
    );
  }

  private saveColumnWidths(): void {
    try {
      const payload = {
        version: this.columnWidthsVersion,
        widths: this.columnWidths,
      };
      localStorage.setItem(this.columnWidthsStorageKey, JSON.stringify(payload));
    } catch (error) {
      console.warn('Failed to save column widths', error);
    }
  }

  private loadColumnWidths(): Record<string, number> | null {
    try {
      const stored = localStorage.getItem(this.columnWidthsStorageKey);
      if (!stored) return null;
      const parsed: unknown = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        if ('widths' in parsed) {
          const payload = parsed as { version?: number; widths?: Record<string, number> };
          if (!payload.widths) return null;
          return payload.version === this.columnWidthsVersion ? payload.widths : null;
        }
        if (!Array.isArray(parsed)) {
          return parsed as Record<string, number>;
        }
      }
      return null;
    } catch (error) {
      console.warn('Failed to load column widths', error);
      return null;
    }
  }

  private savePageSize(): void {
    try {
      localStorage.setItem(
        this.pageSizeStorageKey,
        JSON.stringify(this.pageSize)
      );
    } catch (error) {
      console.warn('Failed to save page size', error);
    }
  }

  private loadPageSize(): number | null {
    try {
      const stored = localStorage.getItem(this.pageSizeStorageKey);
      if (!stored) return null;
      const value = JSON.parse(stored) as number;
      return Number.isFinite(value) ? value : null;
    } catch (error) {
      console.warn('Failed to load page size', error);
      return null;
    }
  }

  private compareProducts(
    a: Product,
    b: Product,
    key: SortKey,
    direction: SortDirection
  ): number {
    const multiplier = direction === 'asc' ? 1 : -1;
    const aValue = this.getSortValue(a, key);
    const bValue = this.getSortValue(b, key);

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return (aValue - bValue) * multiplier;
    }

    return aValue.toString().localeCompare(bValue.toString()) * multiplier;
  }

  private getSortValue(product: Product, key: SortKey): string | number {
    switch (key) {
      case 'image':
      case 'name':
        return product.name;
      case 'sku':
        return product.vendorSku;
      case 'brand':
        return product.brand;
      case 'productId':
        return product.productId;
      case 'variationId':
        return product.variationId ?? '';
      case 'vendor':
        return product.vendorName;
      case 'mpn':
        return product.manufacturerPart;
      case 'asin':
        return product.asin;
      case 'fnsku':
        return product.fnsku;
      case 'gtin':
        return product.gtin;
      case 'ean':
        return product.ean;
      case 'isbn':
        return product.isbn;
      case 'landedCost':
        return product.landedCost;
      case 'shippingCost':
        return product.shippingCost;
      case 'salePrice':
        return product.salePrice;
      case 'purchaseQty':
        return product.purchaseQty;
      case 'stockQty':
        return product.stockQty;
      case 'soldQty':
        return this.soldQty(product);
      case 'returnQty':
        return product.returnQty;
      case 'profitMargin':
        return product.grossProfitPercent;
      case 'profitAmount':
        return product.grossProfitAmount;
      case 'velocity':
        return product.velocity;
      case 'stockDays':
        return product.stockDays;
      case 'restockStatus':
        return this.restockRank[product.restockStatus];
      case 'suggestedRestockQty':
        return product.suggestedRestockQty;
      case 'marketplaces':
        return product.marketplaces.length;
      case 'productType':
        return product.productType;
      case 'actions':
        return product.name;
      default:
        return product.name;
    }
  }
}
