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

import { brands, marketplacePlatforms, mockProducts } from '@/data/mockProducts';
import { FilterState, Product, SoldPeriod, ProductType, KitComponent, MarketplaceStatus } from '@/types/product';
import { Tag, tagColors } from '@/types/tag';
import { TagService } from '@/app/services/tag.service';
import * as XLSX from 'xlsx';
import {
  Offer,
  formatOfferDiscount,
  getOfferDaysRemaining,
  getOfferStatus,
  offerStatusConfig,
  offerTypeLabels,
} from '@/types/offer';
import { OfferService } from '@/app/services/offer.service';

type SortKey =
  | 'name'
  | 'vendorSku'
  | 'brand'
  | 'productId'
  | 'variationId'
  | 'vendorName'
  | 'salePrice'
  | 'stockQty'
  | 'soldQty'
  | 'restockStatus'
  | 'marketplaces'
  | 'productType';

type SortDirection = 'asc' | 'desc';

type StatusFilter = 'live' | 'inactive' | 'error' | 'not_listed';

interface CsvFieldConfig {
  id: string;
  label: string;
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
  { id: 'vendorSku', label: 'SKU' },
  { id: 'productId', label: 'Product ID' },
  { id: 'gtin', label: 'UPC/GTIN' },
  { id: 'asin', label: 'ASIN' },
  { id: 'fnsku', label: 'FNSKU' },
  { id: 'ean', label: 'EAN' },
  { id: 'isbn', label: 'ISBN' },
  { id: 'manufacturerPart', label: 'MPN' },
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
  price: number;
  stock: number;
  priceSync: boolean;
  inventorySync: boolean;
}

interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  sortable?: boolean;
  align?: 'left' | 'right';
}

interface ColumnPreferences {
  order: string[];
  visibility: Record<string, boolean>;
}

@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
              class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-[34px] px-2 py-2"
              title="Marketplace integrations"
            >
              Marketplace Integrations
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-[34px] px-2 py-2"
              title="Create offer"
            >
              Create Offer
              <span class="rounded-md bg-primary/20 px-2 py-0.5 text-[10px] text-primary">
                {{ offers.length }}
              </span>
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-[34px] px-2 py-2"
              title="Offer analytics"
            >
              Offer Analytics
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-[34px] px-2 py-2"
              title="Batch management"
            >
              Batch Management
              <span class="rounded-md bg-primary/20 px-2 py-0.5 text-[10px] text-primary">
                9
              </span>
            </button>
          </div>
        </div>

        <div
          class="relative z-40 flex flex-col gap-3 border-b border-border bg-card/95 px-4 py-3 shadow-sm backdrop-blur"
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
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                    <path d="M3 22h18" />
                    <path d="M6 22V4h12v18" />
                    <path d="M9 10h6" />
                    <path d="M9 14h6" />
                  </svg>
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
                class="absolute z-50 mt-2 max-h-64 w-56 overflow-y-auto rounded-lg border border-border bg-card/95 p-3 shadow-xl backdrop-blur"
              >
                <label
                  *ngFor="let brand of brands"
                  class="flex items-center gap-2 py-1 text-xs"
                >
                  <input
                    type="checkbox"
                    class="h-5 w-5"
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
                class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-[34px] px-2 py-2"
                title="Filter by marketplace"
                data-tooltip="Filter by marketplace"
                (click)="$event.preventDefault(); $event.stopPropagation(); toggleDropdown('marketplace')"
              >
                <span class="inline-flex h-5 w-5 items-center justify-center text-foreground">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                    <path d="M3 9l2-5h14l2 5" />
                    <path d="M5 9v11h14V9" />
                    <path d="M9 20V9h6v11" />
                  </svg>
                </span>
                
                <span class="text-muted-foreground hidden">
               Marketplace   ({{ filters.marketplace.length || 'all' }})
                </span>
                <span class="ml-1 inline-flex h-5 w-5 items-center justify-center text-foreground">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3" stroke-width="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </summary>
              <div
                class="absolute z-50 mt-2 max-h-64 w-56 overflow-y-auto rounded-lg border border-border bg-card/95 p-3 shadow-xl backdrop-blur"
              >
                <label
                  *ngFor="let platform of marketplaces"
                  class="flex items-center gap-2 py-1 text-xs capitalize"
                >
                  <input
                    type="checkbox"
                    class="h-5 w-5"
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
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                    <polyline points="3 12 7 12 9 6 13 18 16 10 21 10" />
                  </svg>
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
                class="absolute z-50 mt-2 w-48 rounded-lg border border-border bg-card/95 p-3 shadow-xl backdrop-blur"
              >
                <label
                  *ngFor="let status of statusOptions"
                  class="flex items-center gap-2 py-1 text-xs"
                >
                  <input
                    type="checkbox"
                    class="h-5 w-5"
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
                class="absolute z-50 mt-2 w-64 rounded-lg border border-border bg-card/95 p-3 shadow-xl backdrop-blur"
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
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                    <path d="M3 7l9-4 9 4-9 4-9-4z" />
                    <path d="M3 7v10l9 4 9-4V7" />
                  </svg>
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
                class="absolute z-50 mt-2 w-64 rounded-lg border border-border bg-card/95 p-3 shadow-xl backdrop-blur"
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
                class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-[34px] px-2 py-2"
                title="Filter by sold units"
                data-tooltip="Filter by sold units"
                (click)="$event.preventDefault(); $event.stopPropagation(); toggleDropdown('sold')"
              >
                <span class="inline-flex h-5 w-5 items-center justify-center text-foreground">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                    <polyline points="3 17 9 11 13 15 21 7" />
                    <path d="M21 7v6h-6" />
                  </svg>
                </span>
                
                <span class="text-muted-foreground hidden">
              Sold    {{
                    filters.soldRange[0] > 0 || filters.soldRange[1] < 10000
                      ? filters.soldRange[0] + ' - ' + filters.soldRange[1]
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
                class="absolute z-50 mt-2 w-72 rounded-lg border border-border bg-card/95 p-3 shadow-xl backdrop-blur"
              >
                <div class="grid grid-cols-2 gap-3">
                  <label class="text-xs text-muted-foreground">
                    Min
                    <input
                      type="number"
                      class="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-xs"
                      [ngModel]="filters.soldRange[0]"
                      (ngModelChange)="updateRange('soldRange', $event, filters.soldRange[1])"
                    />
                  </label>
                  <label class="text-xs text-muted-foreground">
                    Max
                    <input
                      type="number"
                      class="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-xs"
                      [ngModel]="filters.soldRange[1]"
                      (ngModelChange)="updateRange('soldRange', filters.soldRange[0], $event)"
                    />
                  </label>
                </div>
                <label class="mt-3 block text-xs text-muted-foreground">
                  Period
                  <select
                    class="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-xs"
                    [ngModel]="filters.soldPeriod"
                    (ngModelChange)="setSoldPeriod($event)"
                  >
                    <option *ngFor="let option of soldPeriods" [value]="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                </label>
              </div>
            </details>

            <details
              class="relative"
              data-dropdown="type"
              [open]="openDropdownId === 'type'"
            >
              <summary
                class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-[34px] px-2 py-2"
                title="Filter by product type"
                data-tooltip="Filter by product type"
                (click)="$event.preventDefault(); $event.stopPropagation(); toggleDropdown('type')"
              >
                <span class="inline-flex h-5 w-5 items-center justify-center text-foreground">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                    <path d="M3 7l9-4 9 4-9 4-9-4z" />
                    <path d="M3 7v10l9 4 9-4V7" />
                  </svg>
                </span>
               
                <span class="text-muted-foreground hidden">
               Type    {{
                    filters.kitProduct === null
                      ? 'all'
                      : filters.kitProduct
                        ? 'kit'
                        : 'single'
                  }}
                </span>
                <span class="ml-1 inline-flex h-5 w-5 items-center justify-center text-foreground">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3" stroke-width="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </summary>
              <div
                class="absolute z-50 mt-2 w-48 rounded-lg border border-border bg-card/95 p-3 shadow-xl backdrop-blur"
              >
                <label class="flex items-center gap-2 py-1 text-xs">
                  <input
                    type="radio"
                    name="kitFilter"
                    class="h-5 w-5"
                    [checked]="filters.kitProduct === null"
                    (change)="setKitFilter(null)"
                  />
                  <span>All products</span>
                </label>
                <label class="flex items-center gap-2 py-1 text-xs">
                  <input
                    type="radio"
                    name="kitFilter"
                    class="h-5 w-5"
                    [checked]="filters.kitProduct === true"
                    (change)="setKitFilter(true)"
                  />
                  <span>Kit products</span>
                </label>
                <label class="flex items-center gap-2 py-1 text-xs">
                  <input
                    type="radio"
                    name="kitFilter"
                    class="h-5 w-5"
                    [checked]="filters.kitProduct === false"
                    (change)="setKitFilter(false)"
                  />
                  <span>Single products</span>
                </label>
              </div>
            </details>

            <details
              class="relative"
              data-dropdown="variation"
              [open]="openDropdownId === 'variation'"
            >
              <summary
                class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-[34px] px-2 py-2"
                title="Filter by variations"
                data-tooltip="Filter by variations"
                (click)="$event.preventDefault(); $event.stopPropagation(); toggleDropdown('variation')"
              >
                <span class="inline-flex h-5 w-5 items-center justify-center text-muted-foreground">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                    <path d="M12 2l9 5-9 5-9-5 9-5z" />
                    <path d="M3 12l9 5 9-5" />
                    <path d="M3 17l9 5 9-5" />
                  </svg>
                </span>
               
                <span class="text-muted-foreground hidden">
               Variation    {{
                    filters.hasVariation === null
                      ? 'all'
                      : filters.hasVariation
                        ? 'has'
                        : 'none'
                  }}
                </span>
                <span class="ml-1 inline-flex h-5 w-5 items-center justify-center text-muted-foreground">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3" stroke-width="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </summary>
              <div
                class="absolute z-50 mt-2 w-44 rounded-lg border border-border bg-card/95 p-3 shadow-xl backdrop-blur"
              >
                <label class="flex items-center gap-2 py-1 text-xs">
                  <input
                    type="radio"
                    name="variationFilter"
                    class="h-5 w-5"
                    [checked]="filters.hasVariation === null"
                    (change)="setVariationFilter(null)"
                  />
                  <span>All</span>
                </label>
                <label class="flex items-center gap-2 py-1 text-xs">
                  <input
                    type="radio"
                    name="variationFilter"
                    class="h-5 w-5"
                    [checked]="filters.hasVariation === true"
                    (change)="setVariationFilter(true)"
                  />
                  <span>Has variation</span>
                </label>
                <label class="flex items-center gap-2 py-1 text-xs">
                  <input
                    type="radio"
                    name="variationFilter"
                    class="h-5 w-5"
                    [checked]="filters.hasVariation === false"
                    (change)="setVariationFilter(false)"
                  />
                  <span>No variation</span>
                </label>
              </div>
            </details>

            <details
              class="relative"
              data-dropdown="tags"
              [open]="openDropdownId === 'tags'"
            >
              <summary
                class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-[34px] px-2 py-2"
                title="Filter by tags"
                data-tooltip="Filter by tags"
                (click)="$event.preventDefault(); $event.stopPropagation(); toggleDropdown('tags')"
              >
                <span class="inline-flex h-5 w-5 items-center justify-center text-muted-foreground">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                    <path d="M20 13l-7 7-10-10V3h7l10 10z" />
                    <circle cx="7.5" cy="7.5" r="1.5" />
                  </svg>
                </span>
               
                <span class="text-muted-foreground hidden">
               Tags    ({{ filters.tags.length || 'all' }})
                </span>
                <span class="ml-1 inline-flex h-5 w-5 items-center justify-center text-muted-foreground">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3" stroke-width="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </summary>
              <div
                class="absolute z-50 mt-2 w-56 rounded-lg border border-border bg-card/95 p-3 shadow-xl backdrop-blur"
              >
                <div class="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    class="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
                    (click)="openTagForm()"
                  >
                    Create tag
                  </button>
                  <p *ngIf="tags.length === 0" class="text-xs text-muted-foreground">
                    No tags yet.
                  </p>
                </div>
                <div class="mt-2 space-y-2" *ngIf="tags.length > 0">
                  <label
                    *ngFor="let tag of tags"
                    class="flex items-center gap-2 text-xs"
                  >
                    <input
                      type="checkbox"
                      class="h-5 w-5"
                      [checked]="filters.tags.includes(tag.id)"
                      (change)="toggleTagFilter(tag.id)"
                    />
                    <span
                      class="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium text-white"
                      [style.backgroundColor]="tag.color"
                    >
                      {{ tag.name }}
                    </span>
                    <div class="ml-auto flex items-center gap-2 text-[10px] text-muted-foreground">
                      <button type="button" (click)="editTag(tag)">Edit</button>
                      <button type="button" (click)="deleteTag(tag)">Delete</button>
                    </div>
                  </label>
                </div>
              </div>
            </details>

            <div class="ml-auto flex flex-1 items-center gap-2">
              <div class="relative w-full max-w-[420px]">
                <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground">
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
                type="button"
              class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-2 py-2 gap-2 h-[34px]"
                title="Custom filters"
                data-tooltip="Custom filters"
              >
                <span class="mr-2 inline-flex h-5 w-5 items-center justify-center text-foreground">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                    <path d="M3 4h18l-7 8v6l-4 2v-8L3 4z" />
                  </svg>
                </span>
                Custom Filters
              </button>
              <details
                class="relative"
                data-dropdown="columns"
                [open]="openDropdownId === 'columns'"
              >
                <summary
                  class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground px-2 py-2 h-[34px]"
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
                  class="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-border bg-card/95 p-3 shadow-xl backdrop-blur"
                >
                  <label
                    *ngFor="let column of columns"
                    class="flex items-center gap-2 py-1 text-xs"
                  >
                    <input
                      type="checkbox"
                      class="h-5 w-5"
                      [checked]="column.visible"
                      (change)="toggleColumn(column.id)"
                    />
                    <span>{{ column.label }}</span>
                  </label>
                </div>
              </details>
              <button
              type="button"
              class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-2 py-2 gap-2"
              (click)="openCsvDialog('update')"
              title="Update via CSV"
              data-tooltip="Update via CSV"
            >
              <span class="inline-flex h-5 w-5 items-center justify-center text-muted-foreground">
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
              class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-2 py-2 gap-2"
              (click)="resetFilters()"
              title="Clear all filters"
              data-tooltip="Clear all filters"
            >
              <span class="inline-flex h-5 w-5 items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                  <path d="M3 6h18" />
                  <path d="M8 6v12" />
                  <path d="M16 6v12" />
                  <path d="M5 6l1-3h12l1 3" />
                </svg>
              </span>
              Clear all
            </button>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
           
            <details
              class="relative"
              data-dropdown="create"
              [open]="openDropdownId === 'create'"
            >
              <summary
                class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-[34px] px-2 py-2"
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
                class="absolute z-50 mt-2 w-56 rounded-lg border border-border bg-card/95 p-2 shadow-xl backdrop-blur"
              >
                <button
                  type="button"
                  class="flex w-full items-center justify-between rounded-md px-2 py-2 text-xs hover:bg-muted"
                  (click)="openManualDialog('single')"
                >
                  Manual entry
                  <span class="text-muted-foreground">+</span>
                </button>
                <button
                  type="button"
                  class="flex w-full items-center justify-between rounded-md px-2 py-2 text-xs hover:bg-muted"
                  (click)="openManualDialog('kit')"
                >
                  Create kit product
                  <span class="text-muted-foreground">▢</span>
                </button>
                <button
                  type="button"
                  class="flex w-full items-center justify-between rounded-md px-2 py-2 text-xs hover:bg-muted"
                  (click)="openCsvDialog('create')"
                >
                  CSV or Excel
                  <span class="text-muted-foreground">CSV</span>
                </button>
                <div class="my-2 border-t border-border"></div>
                <button
                  type="button"
                  class="flex w-full items-center justify-between rounded-md px-2 py-2 text-xs hover:bg-muted"
                  (click)="importMarketplace('Amazon')"
                >
                  Import from Amazon
                  <span class="text-orange-500">Amazon</span>
                </button>
                <button
                  type="button"
                  class="flex w-full items-center justify-between rounded-md px-2 py-2 text-xs hover:bg-muted"
                  (click)="importMarketplace('Shopify')"
                >
                  Import from Shopify
                  <span class="text-green-500">Shopify</span>
                </button>
              </div>
            </details>
            <label class="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
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
            </label>
          </div>
        </div>

        <div
          *ngIf="tagFormOpen"
          class="mx-4 rounded-lg border border-border bg-background p-4"
        >
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 class="text-sm font-semibold">
                {{ editingTag ? 'Edit tag' : 'Create tag' }}
              </h3>
              <p class="text-xs text-muted-foreground">
                Tags help group products for quick filtering.
              </p>
            </div>
            <button
              type="button"
              class="rounded-md border border-border px-3 py-1 text-xs hover:bg-muted"
              (click)="cancelTagForm()"
            >
              Close
            </button>
          </div>

          <div class="mt-4 grid gap-4 lg:grid-cols-3">
            <label class="flex flex-col gap-2 text-xs text-muted-foreground">
              Tag name
              <input
                type="text"
                class="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground"
                [(ngModel)]="tagName"
                placeholder="Enter tag name"
                maxlength="30"
              />
            </label>

            <div class="lg:col-span-2">
              <p class="text-xs text-muted-foreground">Pick a color</p>
              <div class="mt-2 flex flex-wrap gap-2">
                <button
                  *ngFor="let color of tagColors"
                  type="button"
                  class="h-7 w-7 rounded-md border border-border"
                  [style.backgroundColor]="color.value"
                  [class.ring-2]="tagColor === color.value"
                  [class.ring-offset-2]="tagColor === color.value"
                  (click)="setTagColor(color.value)"
                  [attr.aria-label]="color.name"
                ></button>
                <div class="flex items-center gap-2">
                  <input
                    type="color"
                    class="h-7 w-7 cursor-pointer rounded-md border border-border"
                    [value]="tagColor"
                    (input)="setTagColor($any($event.target).value)"
                  />
                  <input
                    type="text"
                    class="w-24 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
                    [value]="tagColor"
                    (input)="setTagColor($any($event.target).value)"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="mt-4 flex items-center gap-3">
            <button
              type="button"
              class="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              [disabled]="!tagName.trim() || !tagColor"
              (click)="saveTag()"
            >
              {{ editingTag ? 'Save changes' : 'Create tag' }}
            </button>
            <span class="text-xs text-muted-foreground">
              Preview:
              <span
                class="ml-2 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium text-white"
                [style.backgroundColor]="tagColor || '#64748b'"
              >
                {{ tagName || 'Tag name' }}
              </span>
            </span>
          </div>
        </div>

        <div
          *ngIf="manualDialogOpen"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in"
        >
          <div class="w-full max-w-3xl rounded-xl bg-card p-4 shadow-xl animate-in zoom-in-95">
            <div class="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 class="text-lg font-semibold">Create new product</h3>
                <p class="text-xs text-muted-foreground">
                  Fill in the product details. Required fields are marked.
                </p>
              </div>
              <button
                type="button"
                class="rounded-md border border-border px-3 py-1 text-xs"
                (click)="closeManualDialog()"
              >
                Close
              </button>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <button
                *ngFor="let tab of manualTabs"
                type="button"
                class="rounded-md border border-border px-3 py-1 text-xs"
                [class.bg-muted]="manualTab === tab"
                (click)="manualTab = tab"
              >
                {{ manualTabLabel(tab) }}
              </button>
            </div>

            <div class="mt-4 max-h-[55vh] overflow-y-auto pr-2">
              <div *ngIf="manualTab === 'basic'" class="grid gap-4">
                <label *ngFor="let field of manualBasicFields" class="grid gap-1 text-xs">
                  <span class="text-muted-foreground">
                    {{ field.label }} <span *ngIf="field.required" class="text-destructive">*</span>
                  </span>
                  <input
                    [type]="field.type || 'text'"
                    class="rounded-md border border-border bg-background px-2 py-1 text-sm"
                    [placeholder]="field.placeholder"
                    [(ngModel)]="manualForm[field.id]"
                  />
                </label>
              </div>

              <div *ngIf="manualTab === 'type'" class="grid gap-4">
                <label class="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="manualProductType"
                    class="h-5 w-5"
                    [checked]="manualProductType === 'single'"
                    (change)="manualProductType = 'single'"
                  />
                  <span>Single product</span>
                </label>
                <label class="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="manualProductType"
                    class="h-5 w-5"
                    [checked]="manualProductType === 'kit'"
                    (change)="manualProductType = 'kit'"
                  />
                  <span>Kit product</span>
                </label>

                <div *ngIf="manualProductType === 'kit'" class="grid gap-3 rounded-lg border border-border bg-muted/30 p-3">
                  <p class="text-xs font-semibold text-muted-foreground">Kit components</p>
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
                      Add
                    </button>
                  </div>
                  <div *ngIf="kitComponents.length > 0" class="space-y-2">
                    <div
                      *ngFor="let component of kitComponents; let i = index"
                      class="flex items-center justify-between rounded-md border border-border px-2 py-1 text-xs"
                    >
                      <span>
                        {{ kitProductName(component.productId) }} × {{ component.quantity }}
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

              <div *ngIf="manualTab === 'identifiers'" class="grid gap-4">
                <label *ngFor="let field of manualIdentifierFields" class="grid gap-1 text-xs">
                  <span class="text-muted-foreground">{{ field.label }}</span>
                  <input
                    [type]="field.type || 'text'"
                    class="rounded-md border border-border bg-background px-2 py-1 text-sm"
                    [placeholder]="field.placeholder"
                    [(ngModel)]="manualForm[field.id]"
                  />
                </label>
              </div>

              <div *ngIf="manualTab === 'pricing'" class="grid gap-4">
                <label *ngFor="let field of manualPricingFields" class="grid gap-1 text-xs">
                  <span class="text-muted-foreground">{{ field.label }}</span>
                  <input
                    [type]="field.type || 'text'"
                    class="rounded-md border border-border bg-background px-2 py-1 text-sm"
                    [placeholder]="field.placeholder"
                    [(ngModel)]="manualForm[field.id]"
                  />
                </label>
              </div>

              <div *ngIf="manualTab === 'inventory'" class="grid gap-4">
                <label *ngFor="let field of manualInventoryFields" class="grid gap-1 text-xs">
                  <span class="text-muted-foreground">{{ field.label }}</span>
                  <input
                    [type]="field.type || 'text'"
                    class="rounded-md border border-border bg-background px-2 py-1 text-sm"
                    [placeholder]="field.placeholder"
                    [(ngModel)]="manualForm[field.id]"
                  />
                </label>
              </div>
            </div>

            <div class="mt-4 flex items-center justify-end gap-2 border-t border-border pt-3">
              <button
                type="button"
                class="rounded-md border border-border px-3 py-1 text-xs"
                (click)="closeManualDialog()"
              >
                Cancel
              </button>
              <button
                type="button"
                class="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
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
                  {{ csvMode === 'create' ? 'Import Products' : 'Update Products' }}
                </h3>
                <p class="text-xs text-muted-foreground">
                  {{ csvStep === 'upload' ? 'Upload a CSV or Excel file.' : 'Map CSV columns to product fields.' }}
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
              <div class="rounded-lg border border-border bg-muted/30 p-3">
                <p class="text-xs font-semibold">Need a template?</p>
                <p class="text-xs text-muted-foreground">
                  Download a CSV template with sample data.
                </p>
                <button
                  type="button"
                  class="mt-2 rounded-md border border-border px-3 py-1 text-xs"
                  (click)="downloadCsvTemplate()"
                >
                  Download template
                </button>
              </div>

              <div class="rounded-lg border border-border bg-muted/30 p-3">
                <p class="text-xs font-semibold">
                  {{ csvMode === 'update' ? 'Match products by' : 'Identifiers in file' }}
                </p>
                <div class="mt-2 grid grid-cols-2 gap-2">
                  <label
                    *ngFor="let field of csvIdentifierOptions"
                    class="flex items-center gap-2 text-xs"
                  >
                    <input
                      type="checkbox"
                      class="h-5 w-5"
                      [checked]="csvMatchFields.includes(field.id)"
                      (change)="toggleCsvMatchField(field.id)"
                    />
                    <span>{{ field.label }}</span>
                  </label>
                </div>
              </div>

              <div class="rounded-lg border border-dashed border-border p-4 text-center">
                <p class="text-xs text-muted-foreground">
                  {{ csvFileName ? csvFileName : 'No file selected' }}
                </p>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  class="mt-3 w-full text-xs"
                  (change)="onCsvFileChange($event)"
                />
                <p *ngIf="csvError" class="mt-2 text-xs text-destructive">{{ csvError }}</p>
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
          <div class="w-full max-w-4xl rounded-xl bg-card p-4 shadow-xl animate-in zoom-in-95">
            <div class="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 class="text-lg font-semibold">{{ selectedProduct.name }}</h3>
                <p class="text-xs text-muted-foreground">
                  Edit product details and inventory.
                </p>
              </div>
              <button
                type="button"
                class="rounded-md border border-border px-3 py-1 text-xs"
                (click)="closeProductDialog()"
              >
                Close
              </button>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                class="rounded-md border border-border px-3 py-1 text-xs"
                [class.bg-muted]="productDialogTab === 'overview'"
                (click)="productDialogTab = 'overview'"
              >
                Overview
              </button>
              <button
                type="button"
                class="rounded-md border border-border px-3 py-1 text-xs"
                [class.bg-muted]="productDialogTab === 'inventory'"
                (click)="productDialogTab = 'inventory'"
              >
                Inventory
              </button>
              <button
                type="button"
                class="rounded-md border border-border px-3 py-1 text-xs"
                [class.bg-muted]="productDialogTab === 'marketplaces'"
                (click)="productDialogTab = 'marketplaces'"
              >
                Marketplaces
              </button>
            </div>

            <div class="mt-4 max-h-[55vh] overflow-y-auto pr-2">
              <div *ngIf="productDialogTab === 'overview'" class="grid gap-4 sm:grid-cols-2">
                <label class="grid gap-1 text-xs text-muted-foreground">
                  Product name
                  <input
                    type="text"
                    class="rounded-md border border-border bg-background px-2 py-1 text-sm"
                    [(ngModel)]="productDraft.name"
                  />
                </label>
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
                <label class="grid gap-1 text-xs text-muted-foreground">
                  Sale price
                  <input
                    type="number"
                    class="rounded-md border border-border bg-background px-2 py-1 text-sm"
                    [(ngModel)]="productDraft.salePrice"
                  />
                </label>
              </div>

              <div *ngIf="productDialogTab === 'inventory'" class="grid gap-4 sm:grid-cols-2">
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

            <div class="mt-4 flex items-center justify-end gap-2 border-t border-border pt-3">
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
          <div class="w-full max-w-4xl rounded-xl bg-card p-4 shadow-xl animate-in zoom-in-95">
            <div class="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 class="text-lg font-semibold">Marketplace listings</h3>
                <p class="text-xs text-muted-foreground">
                  {{ marketplaceDialogProduct.name }}
                </p>
              </div>
              <button
                type="button"
                class="rounded-md border border-border px-3 py-1 text-xs"
                (click)="closeMarketplaceDialog()"
              >
                Close
              </button>
            </div>

            <div class="mt-4 max-h-[55vh] overflow-y-auto pr-2">
              <div class="grid gap-2">
                <div
                  *ngFor="let row of marketplaceRows"
                  class="grid items-center gap-2 rounded-md border border-border px-3 py-2 text-xs sm:grid-cols-[120px_120px_1fr_1fr_90px_90px]"
                >
                  <span class="capitalize font-semibold">{{ row.platform }}</span>
                  <select
                    class="rounded-md border border-border bg-background px-2 py-1 text-xs"
                    [(ngModel)]="row.status"
                  >
                    <option value="live">Live</option>
                    <option value="inactive">Inactive</option>
                    <option value="error">Error</option>
                    <option value="not_listed">Not listed</option>
                  </select>
                  <input
                    type="number"
                    class="rounded-md border border-border bg-background px-2 py-1 text-xs"
                    [(ngModel)]="row.price"
                    placeholder="Sale price"
                  />
                  <input
                    type="number"
                    class="rounded-md border border-border bg-background px-2 py-1 text-xs"
                    [(ngModel)]="row.stock"
                    placeholder="Stock"
                  />
                  <label class="flex items-center gap-1 text-xs">
                    <input type="checkbox" [(ngModel)]="row.priceSync" />
                    Price sync
                  </label>
                  <label class="flex items-center gap-1 text-xs">
                    <input type="checkbox" [(ngModel)]="row.inventorySync" />
                    Inv sync
                  </label>
                </div>
              </div>
            </div>

            <div class="mt-4 flex items-center justify-end gap-2 border-t border-border pt-3">
              <button
                type="button"
                class="rounded-md border border-border px-3 py-1 text-xs"
                (click)="closeMarketplaceDialog()"
              >
                Cancel
              </button>
              <button
                type="button"
                class="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
                (click)="saveMarketplaceDialog()"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>

        <div
          *ngIf="offerDialogOpen"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in"
        >
          <div class="w-full max-w-3xl rounded-xl bg-card p-4 shadow-xl animate-in zoom-in-95">
            <div class="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 class="text-lg font-semibold">Offers</h3>
                <p class="text-xs text-muted-foreground">
                  Create and manage offers for selected products.
                </p>
              </div>
              <button
                type="button"
                class="rounded-md border border-border px-3 py-1 text-xs"
                (click)="closeOfferDialog()"
              >
                Close
              </button>
            </div>

            <div class="mt-4 space-y-4">
              <div class="rounded-md border border-border bg-muted/30 p-3">
                <p class="text-xs font-semibold">Existing offers</p>
                <div class="mt-2 space-y-2">
                  <div
                    *ngFor="let offer of offersForDialog()"
                    class="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-xs"
                  >
                    <div>
                      <p class="font-semibold">{{ offer.name }}</p>
                      <p class="text-[10px] text-muted-foreground">
                        {{ offerLabel(offer) }} · {{ offerStatusLabel(offer) }}
                      </p>
                    </div>
                    <button
                      type="button"
                      class="rounded-md border border-destructive px-3 py-1 text-xs text-destructive"
                      (click)="deleteOffer(offer.id)"
                    >
                      Delete
                    </button>
                  </div>
                  <p *ngIf="offersForDialog().length === 0" class="text-xs text-muted-foreground">
                    No offers yet.
                  </p>
                </div>
              </div>

              <div class="grid gap-3 rounded-md border border-border p-3">
                <label class="grid gap-1 text-xs text-muted-foreground">
                  Offer name
                  <input
                    type="text"
                    class="rounded-md border border-border bg-background px-2 py-1 text-sm"
                    [(ngModel)]="offerDialogName"
                  />
                </label>
                <label class="grid gap-1 text-xs text-muted-foreground">
                  Offer type
                  <select
                    class="rounded-md border border-border bg-background px-2 py-1 text-sm"
                    [(ngModel)]="offerDialogType"
                  >
                    <option *ngFor="let type of offerTypes" [value]="type">
                      {{ offerTypeLabels[type] }}
                    </option>
                  </select>
                </label>
                <div class="grid gap-3 sm:grid-cols-2">
                  <label class="grid gap-1 text-xs text-muted-foreground">
                    Discount %
                    <input
                      type="number"
                      class="rounded-md border border-border bg-background px-2 py-1 text-sm"
                      [(ngModel)]="offerDialogDiscountPercent"
                      [disabled]="offerDialogType === 'fixed_discount' || offerDialogType === 'free_shipping'"
                    />
                  </label>
                  <label class="grid gap-1 text-xs text-muted-foreground">
                    Discount $
                    <input
                      type="number"
                      class="rounded-md border border-border bg-background px-2 py-1 text-sm"
                      [(ngModel)]="offerDialogDiscountAmount"
                      [disabled]="offerDialogType !== 'fixed_discount'"
                    />
                  </label>
                </div>
                <div class="grid gap-3 sm:grid-cols-2">
                  <label class="grid gap-1 text-xs text-muted-foreground">
                    Start date
                    <input
                      type="date"
                      class="rounded-md border border-border bg-background px-2 py-1 text-sm"
                      [(ngModel)]="offerDialogStartDate"
                    />
                  </label>
                  <label class="grid gap-1 text-xs text-muted-foreground">
                    End date
                    <input
                      type="date"
                      class="rounded-md border border-border bg-background px-2 py-1 text-sm"
                      [(ngModel)]="offerDialogEndDate"
                    />
                  </label>
                </div>
                <label class="grid gap-1 text-xs text-muted-foreground">
                  Description
                  <textarea
                    class="rounded-md border border-border bg-background px-2 py-1 text-sm"
                    rows="2"
                    [(ngModel)]="offerDialogDescription"
                  ></textarea>
                </label>
                <div>
                  <p class="text-xs text-muted-foreground">Marketplaces</p>
                  <div class="mt-2 grid grid-cols-2 gap-2">
                    <label
                      *ngFor="let platform of marketplaces"
                      class="flex items-center gap-2 text-xs capitalize"
                    >
                      <input
                        type="checkbox"
                        class="h-5 w-5"
                        [checked]="offerDialogMarketplaces.includes(platform)"
                        (change)="toggleOfferMarketplace(platform)"
                      />
                      <span>{{ platform }}</span>
                    </label>
                  </div>
                </div>
                <button
                  type="button"
                  class="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
                  (click)="saveOfferDialog()"
                >
                  Save offer
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-1 flex-col min-h-0">
          <ng-container *ngIf="filteredProducts() as filtered">
            <ng-container *ngIf="paginatedProducts(filtered) as visible">
              <div
                *ngIf="selectedCount > 0"
                class="mx-4 mt-3 rounded-xl border border-emerald-900/60 bg-emerald-950/70 px-2 py-2 text-emerald-50 shadow-lg shadow-emerald-950/20"
              >
                <div class="flex flex-wrap items-center justify-between gap-3 text-sm">
                <div class="flex items-center gap-3">
                  <span class="font-semibold">
                    {{ selectedCount }} product selected
                  </span>
                  <button
                    type="button"
                    class="text-xs text-emerald-200 hover:text-emerald-50"
                    (click)="clearSelection()"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    class="text-xs text-emerald-200 hover:text-emerald-50"
                    (click)="selectAllFiltered(filtered)"
                  >
                    Select all ({{ filtered.length }})
                  </button>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  <details
                    class="relative"
                    data-dropdown="bulk-add-tag"
                    [open]="openDropdownId === 'bulk-add-tag'"
                  >
                    <summary
                      class="flex cursor-pointer items-center gap-2 rounded-md border border-emerald-900/60 bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-50 transition hover:bg-emerald-900/60"
                      (click)="$event.preventDefault(); $event.stopPropagation(); toggleDropdown('bulk-add-tag')"
                    >
                      <span class="inline-flex h-5 w-5 items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                          <path d="M12 5v14" />
                          <path d="M5 12h14" />
                        </svg>
                      </span>
                      Tags
                    </summary>
                    <div class="absolute z-50 mt-2 w-48 rounded-lg border border-border bg-card/95 p-2 shadow-xl backdrop-blur">
                      <p class="px-1 text-[10px] text-muted-foreground">Add tag</p>
                      <select
                        class="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-xs"
                        (change)="bulkAddTag($any($event.target).value)"
                      >
                        <option value="">Choose</option>
                        <option *ngFor="let tag of tags" [value]="tag.id">
                          {{ tag.name }}
                        </option>
                      </select>
                    </div>
                  </details>

                  <details
                    class="relative"
                    data-dropdown="bulk-remove-tag"
                    [open]="openDropdownId === 'bulk-remove-tag'"
                  >
                    <summary
                      class="flex cursor-pointer items-center gap-2 rounded-md border border-emerald-900/60 bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-50 transition hover:bg-emerald-900/60"
                      (click)="$event.preventDefault(); $event.stopPropagation(); toggleDropdown('bulk-remove-tag')"
                    >
                      <span class="inline-flex h-5 w-5 items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                          <path d="M3 6h18" />
                          <path d="M8 6v12" />
                          <path d="M16 6v12" />
                          <path d="M5 6l1-3h12l1 3" />
                        </svg>
                      </span>
                      Tags
                    </summary>
                    <div class="absolute z-50 mt-2 w-48 rounded-lg border border-border bg-card/95 p-2 shadow-xl backdrop-blur">
                      <p class="px-1 text-[10px] text-muted-foreground">Remove tag</p>
                      <select
                        class="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-xs"
                        (change)="bulkRemoveTag($any($event.target).value)"
                      >
                        <option value="">Choose</option>
                        <option *ngFor="let tag of tags" [value]="tag.id">
                          {{ tag.name }}
                        </option>
                      </select>
                    </div>
                  </details>

                  <details
                    class="relative"
                    data-dropdown="bulk-pricing"
                    [open]="openDropdownId === 'bulk-pricing'"
                  >
                    <summary
                      class="flex cursor-pointer items-center gap-2 rounded-md border border-emerald-900/60 bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-50 transition hover:bg-emerald-900/60"
                      (click)="$event.preventDefault(); $event.stopPropagation(); toggleDropdown('bulk-pricing')"
                    >
                      <span class="inline-flex h-5 w-5 items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                          <path d="M12 1v22" />
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                      </span>
                      Values
                    </summary>
                    <div class="absolute z-50 mt-2 w-64 rounded-lg border border-border bg-card/95 p-3 shadow-xl backdrop-blur">
                      <div class="grid gap-2">
                        <label class="text-xs text-muted-foreground">
                          Sale price
                          <input
                            type="number"
                            class="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-xs"
                            [(ngModel)]="bulkSalePrice"
                          />
                        </label>
                        <label class="text-xs text-muted-foreground">
                          Stock qty
                          <input
                            type="number"
                            class="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-xs"
                            [(ngModel)]="bulkStockQty"
                          />
                        </label>
                        <label class="text-xs text-muted-foreground">
                          Landed cost
                          <input
                            type="number"
                            class="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-xs"
                            [(ngModel)]="bulkLandedCost"
                          />
                        </label>
                        <label class="text-xs text-muted-foreground">
                          Purchased qty
                          <input
                            type="number"
                            class="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-xs"
                            [(ngModel)]="bulkPurchaseQty"
                          />
                        </label>
                        <button
                          type="button"
                          class="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
                          (click)="applyBulkPricing()"
                        >
                          Apply updates
                        </button>
                      </div>
                    </div>
                  </details>

                  <button
                    type="button"
                    class="flex items-center gap-2 rounded-md border border-emerald-900/60 bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-50 transition hover:bg-emerald-900/60"
                    (click)="openBulkListing()"
                  >
                    <span class="inline-flex h-5 w-5 items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                        <path d="M3 7l9-4 9 4-9 4-9-4z" />
                        <path d="M3 7v10l9 4 9-4V7" />
                      </svg>
                    </span>
                    Marketplaces
                  </button>

                  <button
                    type="button"
                    class="flex items-center gap-2 rounded-md border border-emerald-900/60 bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-50 transition hover:bg-emerald-900/60"
                    (click)="openBulkOffer()"
                  >
                    <span class="inline-flex h-5 w-5 items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                        <path d="M20 13l-7 7-10-10V3h7l10 10z" />
                        <circle cx="7.5" cy="7.5" r="1.5" />
                      </svg>
                    </span>
                    Offer
                  </button>

                  <button
                    type="button"
                    class="flex items-center gap-2 rounded-md border border-emerald-900/60 bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-50 transition hover:bg-emerald-900/60"
                    (click)="openHistory()"
                  >
                    <span class="inline-flex h-5 w-5 items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                        <path d="M3 12a9 9 0 1 0 9-9" />
                        <path d="M3 3v6h6" />
                        <path d="M12 7v5l3 3" />
                      </svg>
                    </span>
                    History
                  </button>

                  <button
                    type="button"
                    class="flex items-center gap-2 rounded-md border border-emerald-900/60 bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-50 transition hover:bg-emerald-900/60"
                    (click)="exportSelectedCsv(filtered)"
                  >
                    <span class="inline-flex h-5 w-5 items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                        <path d="M12 3v12" />
                        <path d="M7 10l5 5 5-5" />
                        <path d="M5 21h14" />
                      </svg>
                    </span>
                    CSV
                  </button>

                  <button
                    type="button"
                    class="flex items-center gap-2 rounded-md border border-destructive bg-destructive px-3 py-1 text-xs font-semibold text-white transition hover:bg-destructive/90"
                    (click)="bulkDelete()"
                  >
                    <span class="inline-flex h-5 w-5 items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                        <path d="M3 6h18" />
                        <path d="M8 6v12" />
                        <path d="M16 6v12" />
                        <path d="M5 6l1-3h12l1 3" />
                      </svg>
                    </span>
                    Delete
                  </button>
                </div>
                </div>
              </div>

              <div class="flex-1 overflow-auto px-4 pb-2 pt-3">
                <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <p>
                    Showing {{ pageStart(filtered.length) }}-{{ pageEnd(filtered.length) }}
                    of {{ filtered.length }} products
                  </p>
                  <p>
                    Total catalog: {{ products.length }} items
                  </p>
                </div>

                <div class="relative mt-2 overflow-x-auto rounded-lg border border-border bg-background/40 shadow-sm">
                  <table class="w-full min-w-[1250px] text-sm">
              <thead class="relative z-10 bg-card/90 text-left text-xs uppercase tracking-wide backdrop-blur">
                <tr>
                  <th
                    class="sticky top-0 z-0 bg-card/95 px-4 py-3 text-left"
                  >
                    <input
                      type="checkbox"
                      class="h-5 w-5 accent-emerald-500"
                      [checked]="allVisibleSelected(visible)"
                      (change)="toggleSelectVisible(visible)"
                    />
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
                      Product
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
                      Type
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
                    Tags
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
                    Offers
                    <span
                      class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                      (mousedown)="startResize($event, 'offers')"
                    ></span>
                  </th>
                  <th
                    *ngIf="isColumnVisible('vendorName')"
                    class="sticky top-0 z-0 bg-card/95 relative px-4 py-3"
                    [style.width.px]="columnWidth('vendorName')"
                    (dragover)="allowColumnDrop($event)"
                    (drop)="onColumnDrop('vendorName')"
                  >
                    <span
                      class="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab rounded px-1 py-0.5 text-muted-foreground/70 text-[10px] opacity-60 hover:bg-muted hover:opacity-100"
                      draggable="true"
                      title="Drag to reorder"
                      (dragstart)="startColumnDrag('vendorName', $event)"
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
                      (click)="setSort('vendorName')"
                    >
                      Vendor
                      <span class="text-[10px]">{{ sortIcon('vendorName') }}</span>
                    </button>
                    <span
                      class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                      (mousedown)="startResize($event, 'vendorName')"
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
                      Brand
                      <span class="text-[10px]">{{ sortIcon('brand') }}</span>
                    </button>
                    <span
                      class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                      (mousedown)="startResize($event, 'brand')"
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
                      Marketplaces
                      <span class="text-[10px]">{{ sortIcon('marketplaces') }}</span>
                    </button>
                    <span
                      class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                      (mousedown)="startResize($event, 'marketplaces')"
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
                      class="flex items-center justify-end gap-2 text-muted-foreground hover:text-foreground"
                      (click)="setSort('salePrice')"
                    >
                      Price
                      <span class="text-[10px]">{{ sortIcon('salePrice') }}</span>
                    </button>
                    <span
                      class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                      (mousedown)="startResize($event, 'salePrice')"
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
                      class="flex items-center justify-end gap-2 text-muted-foreground hover:text-foreground"
                      (click)="setSort('soldQty')"
                    >
                      Sold
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
                      class="flex items-center justify-end gap-2 text-muted-foreground hover:text-foreground"
                      (click)="setSort('stockQty')"
                    >
                      Stock
                      <span class="text-[10px]">{{ sortIcon('stockQty') }}</span>
                    </button>
                    <span
                      class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                      (mousedown)="startResize($event, 'stockQty')"
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
                      Restock
                      <span class="text-[10px]">{{ sortIcon('restockStatus') }}</span>
                    </button>
                    <span
                      class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                      (mousedown)="startResize($event, 'restockStatus')"
                    ></span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  *ngFor="let product of visible; trackBy: trackById"
                  class="border-t border-border transition hover:bg-muted/40"
                >
                  <td class="px-4 py-4">
                    <input
                      type="checkbox"
                      class="h-5 w-5 accent-emerald-500"
                      [checked]="isSelected(product.id)"
                      (change)="toggleSelectProduct(product.id)"
                    />
                  </td>
                  <td
                    *ngIf="isColumnVisible('name')"
                    class="px-4 py-4"
                    [style.width.px]="columnWidth('name')"
                  >
                    <div class="flex items-center gap-3">
                      <img
                        [src]="product.image"
                        [alt]="product.name"
                        class="h-12 w-12 rounded-md border border-border object-cover"
                      />
                      <div class="space-y-1">
                        <button
                          type="button"
                          class="text-left font-medium text-foreground hover:underline"
                          (click)="openProductDialog(product)"
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
                    </div>
                  </td>
                  <td
                    *ngIf="isColumnVisible('productType')"
                    class="px-4 py-4"
                    [style.width.px]="columnWidth('productType')"
                  >
                    <span
                      class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold"
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
                    class="px-4 py-4"
                    [style.width.px]="columnWidth('tags')"
                  >
                    <div class="relative flex flex-wrap items-center gap-1">
                      <span
                        *ngFor="let tag of getProductTags(product.id)"
                        class="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium text-white"
                        [style.backgroundColor]="tag.color"
                      >
                        {{ tag.name }}
                        <button
                          type="button"
                          class="rounded-md px-1 text-[10px] hover:bg-white/20"
                          (click)="removeTagFromProduct(product.id, tag.id)"
                        >
                          ✕
                        </button>
                      </span>
                      <button
                        *ngIf="tags.length > 0"
                        type="button"
                        class="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted"
                        (click)="toggleTagPicker(product.id)"
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
                        (click)="openTagForm()"
                      >
                        Create tag
                      </button>
                    </div>
                    <div
                      *ngIf="tagPickerProductId === product.id"
                      class="absolute left-0 top-full z-20 mt-2 flex w-48 flex-col gap-2 rounded-lg border border-border bg-card/95 p-2 shadow-xl backdrop-blur animate-in fade-in slide-in-from-top-1"
                    >
                      <label
                        *ngFor="let tag of tags"
                        class="flex items-center gap-2 text-xs"
                      >
                        <input
                          type="checkbox"
                          class="h-5 w-5"
                          [checked]="hasTag(product.id, tag.id)"
                          (change)="toggleProductTag(product.id, tag.id)"
                        />
                        <span
                          class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium text-white"
                          [style.backgroundColor]="tag.color"
                        >
                          {{ tag.name }}
                        </span>
                      </label>
                    </div>
                  </td>
                  <td
                    *ngIf="isColumnVisible('offers')"
                    class="px-4 py-4"
                    [style.width.px]="columnWidth('offers')"
                  >
                    <div class="flex flex-col gap-2">
                      <ng-container *ngIf="bestOffer(product.id) as offer; else noOffer">
                        <span
                          class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
                          [ngClass]="offerStatusClass(offer)"
                        >
                          {{ offerLabel(offer) }}
                        </span>
                        <span class="text-[10px] text-muted-foreground">
                          {{ offerStatusLabel(offer) }}
                        </span>
                        <button
                          type="button"
                          class="rounded-md border border-border px-2 py-0.5 text-[10px]"
                          (click)="openOfferDialog([product.id])"
                        >
                          Manage offers
                        </button>
                      </ng-container>
                      <ng-template #noOffer>
                        <button
                          type="button"
                          class="rounded-md border border-border px-2 py-0.5 text-[10px]"
                          (click)="openOfferDialog([product.id])"
                        >
                          Create offer
                        </button>
                      </ng-template>
                    </div>
                  </td>
                  <td
                    *ngIf="isColumnVisible('vendorName')"
                    class="px-4 py-4"
                    [style.width.px]="columnWidth('vendorName')"
                  >
                    <div class="text-sm font-medium">{{ product.vendorName }}</div>
                    <div class="text-xs text-muted-foreground">
                      {{ product.manufacturerPart }}
                    </div>
                  </td>
                  <td
                    *ngIf="isColumnVisible('brand')"
                    class="px-4 py-4"
                    [style.width.px]="columnWidth('brand')"
                  >
                    <div class="text-sm font-medium">{{ product.brand }}</div>
                    <div class="text-xs text-muted-foreground">
                      ASIN {{ product.asin }}
                    </div>
                  </td>
                  <td
                    *ngIf="isColumnVisible('marketplaces')"
                    class="px-4 py-4"
                    [style.width.px]="columnWidth('marketplaces')"
                  >
                    <button
                      type="button"
                      class="text-left"
                      (click)="openMarketplaceDialog(product)"
                    >
                      <div class="text-sm font-medium">
                        {{
                          product.marketplaces.length > 0
                            ? product.marketplaces.length + ' active'
                            : 'Not listed'
                        }}
                      </div>
                      <div class="text-xs text-muted-foreground">
                        {{ marketplaceSummary(product) }}
                      </div>
                    </button>
                  </td>
                  <td
                    *ngIf="isColumnVisible('salePrice')"
                    class="px-4 py-4 text-right"
                    [style.width.px]="columnWidth('salePrice')"
                  >
                    <p class="font-medium">
                      {{ product.salePrice | currency: 'USD' : 'symbol' : '1.2-2' }}
                    </p>
                    <p class="text-xs text-muted-foreground">
                      Margin {{ product.grossProfitPercent }}%
                    </p>
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
                    class="px-4 py-4 text-right"
                    [style.width.px]="columnWidth('stockQty')"
                  >
                    <p class="font-medium">{{ product.stockQty }}</p>
                    <p class="text-xs text-muted-foreground">
                      {{ product.stockDays }} days
                    </p>
                  </td>
                  <td
                    *ngIf="isColumnVisible('restockStatus')"
                    class="px-4 py-4"
                    [style.width.px]="columnWidth('restockStatus')"
                  >
                    <span
                      class="inline-flex items-center rounded-md px-3 py-1 text-xs font-medium"
                      [ngClass]="restockClasses[product.restockStatus]"
                    >
                      {{ restockLabels[product.restockStatus] }}
                    </span>
                  </td>
                </tr>
              </tbody>
                  </table>
                </div>
              </div>

              <div
                class="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-card/95 px-4 py-3 text-xs text-muted-foreground backdrop-blur"
              >
                <div class="flex items-center gap-2">
                  <span>Shortcuts</span>
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
                      class="rounded-md border border-border px-2 py-1 text-xs disabled:opacity-50"
                      [disabled]="currentPage === 1"
                      (click)="previousPage()"
                    >
                      &lt;
                    </button>
                    <span class="text-xs">
                      Page {{ currentPage }} of {{ totalPages(filtered.length) }}
                    </span>
                    <button
                      type="button"
                      class="rounded-md border border-border px-2 py-1 text-xs disabled:opacity-50"
                      [disabled]="currentPage >= totalPages(filtered.length)"
                      (click)="nextPage(filtered.length)"
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              </div>
            </ng-container>
          </ng-container>
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
  private readonly filtersStorageKey = 'product-filters';
  private readonly columnsStorageKey = 'product-columns';
  private readonly columnWidthsStorageKey = 'product-column-widths';
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
    { id: 'name', label: 'Product', visible: true, sortable: true },
    { id: 'productType', label: 'Type', visible: true, sortable: true },
    { id: 'tags', label: 'Tags', visible: true },
    { id: 'offers', label: 'Offers', visible: true },
    { id: 'vendorName', label: 'Vendor', visible: true, sortable: true },
    { id: 'brand', label: 'Brand', visible: true, sortable: true },
    { id: 'marketplaces', label: 'Marketplaces', visible: true },
    { id: 'salePrice', label: 'Price', visible: true, sortable: true, align: 'right' },
    { id: 'soldQty', label: 'Sold', visible: true, sortable: true, align: 'right' },
    { id: 'stockQty', label: 'Stock', visible: true, sortable: true, align: 'right' },
    { id: 'restockStatus', label: 'Restock', visible: true, sortable: true },
  ];

  private readonly defaultColumnWidths: Record<string, number> = {
    name: 320,
    productType: 140,
    tags: 240,
    offers: 200,
    vendorName: 200,
    brand: 160,
    marketplaces: 200,
    salePrice: 140,
    soldQty: 120,
    stockQty: 120,
    restockStatus: 150,
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

  offerDialogOpen = false;
  offerDialogProductIds: string[] = [];
  offerDialogName = '';
  offerDialogType: Offer['type'] = 'percent_discount';
  offerDialogDiscountPercent = '';
  offerDialogDiscountAmount = '';
  offerDialogStartDate = '';
  offerDialogEndDate = '';
  offerDialogMarketplaces: string[] = [];
  offerDialogDescription = '';

  bulkSalePrice = '';
  bulkStockQty = '';
  bulkLandedCost = '';
  bulkPurchaseQty = '';
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
    in_stock: 'In stock',
    low_stock: 'Low stock',
    out_of_stock: 'Out of stock',
    reorder_now: 'Reorder now',
  };

  readonly restockClasses: Record<Product['restockStatus'], string> = {
    in_stock: 'bg-success/10 text-success',
    low_stock: 'bg-warning/10 text-warning',
    out_of_stock: 'bg-destructive/10 text-destructive',
    reorder_now: 'bg-warning/10 text-warning',
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
    this.filters = { ...this.filters, soldPeriod: period };
    this.onFilterChange();
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
    this.manualDialogOpen = true;
    this.manualProductType = type;
    this.manualTab = 'basic';
    this.manualForm = {};
    this.kitComponents = [];
    this.kitProductId = '';
    this.kitQuantity = 1;
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
  }

  bulkRemoveTag(tagId: string): void {
    if (!tagId) return;
    this.tagService.bulkRemoveTag(Array.from(this.selectedProductIds), tagId);
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
    this.selectedProduct = product;
    this.productDraft = { ...product };
    this.productDialogTab = 'overview';
    this.productDialogOpen = true;
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
      return {
        platform,
        status: current?.status ?? 'not_listed',
        price: current?.status ? product.salePrice : 0,
        stock: current?.status ? product.stockQty : 0,
        priceSync: current?.status === 'live',
        inventorySync: current?.status === 'live',
      };
    });
    this.marketplaceDialogOpen = true;
  }

  closeMarketplaceDialog(): void {
    this.marketplaceDialogOpen = false;
    this.marketplaceDialogProduct = null;
    this.marketplaceRows = [];
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

  openOfferDialog(productIds: string[]): void {
    if (productIds.length === 0) {
      window.alert('Select at least one product to create an offer.');
      return;
    }
    this.offerDialogOpen = true;
    this.offerDialogProductIds = productIds;
    this.offerDialogName = '';
    this.offerDialogType = 'percent_discount';
    this.offerDialogDiscountPercent = '';
    this.offerDialogDiscountAmount = '';
    this.offerDialogDescription = '';
    this.offerDialogMarketplaces = [];
    const today = new Date();
    const end = new Date();
    end.setDate(today.getDate() + 7);
    this.offerDialogStartDate = this.toDateInput(today);
    this.offerDialogEndDate = this.toDateInput(end);
  }

  closeOfferDialog(): void {
    this.offerDialogOpen = false;
    this.offerDialogProductIds = [];
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

  saveOfferDialog(): void {
    if (!this.offerDialogName.trim()) {
      window.alert('Offer name is required.');
      return;
    }
    const startDate = new Date(this.offerDialogStartDate);
    const endDate = new Date(this.offerDialogEndDate);
    if (!this.offerDialogStartDate || !this.offerDialogEndDate) {
      window.alert('Start and end dates are required.');
      return;
    }
    if (endDate < startDate) {
      window.alert('End date must be after start date.');
      return;
    }

    const offer: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'> = {
      name: this.offerDialogName.trim(),
      description: this.offerDialogDescription.trim(),
      type: this.offerDialogType,
      scope: 'product',
      discountPercent: this.offerDialogDiscountPercent
        ? this.toNumber(this.offerDialogDiscountPercent, 0)
        : undefined,
      discountAmount: this.offerDialogDiscountAmount
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
          ? { minQty: 2 }
          : this.offerDialogType === 'bogo_half' ||
            this.offerDialogType === 'bogo_free'
            ? { buyQty: 1, getQty: 1 }
            : undefined,
    };

    this.offerService.addOffer(offer);
    this.closeOfferDialog();
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
    this.openOfferDialog(Array.from(this.selectedProductIds));
  }

  openBulkListing(): void {
    window.alert('Bulk listing flow is not wired yet.');
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
  }

  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const dropdown = target.closest('details[data-dropdown]');
    if (!dropdown) {
      this.openDropdownId = null;
    }
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

  columnWidth(columnId: string): number {
    return this.columnWidths[columnId] ?? 150;
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
      const nextWidth = Math.max(80, this.resizeStartWidth + diff);
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
          .map((id: string) => map.get(id))
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
      localStorage.setItem(
        this.columnWidthsStorageKey,
        JSON.stringify(this.columnWidths)
      );
    } catch (error) {
      console.warn('Failed to save column widths', error);
    }
  }

  private loadColumnWidths(): Record<string, number> | null {
    try {
      const stored = localStorage.getItem(this.columnWidthsStorageKey);
      return stored ? (JSON.parse(stored) as Record<string, number>) : null;
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
      case 'name':
        return product.name;
      case 'vendorSku':
        return product.vendorSku;
      case 'brand':
        return product.brand;
      case 'productId':
        return product.productId;
      case 'variationId':
        return product.variationId ?? '';
      case 'vendorName':
        return product.vendorName;
      case 'salePrice':
        return product.salePrice;
      case 'stockQty':
        return product.stockQty;
      case 'soldQty':
        return this.soldQty(product);
      case 'restockStatus':
        return this.restockRank[product.restockStatus];
      case 'marketplaces':
        return product.marketplaces.length;
      case 'productType':
        return product.productType;
      default:
        return product.name;
    }
  }
}
