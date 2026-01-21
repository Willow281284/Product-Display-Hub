import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { brands, marketplacePlatforms, mockProducts } from '@/data/mockProducts';
import { FilterState, Product, SoldPeriod, ProductType, KitComponent } from '@/types/product';
import { Tag, tagColors } from '@/types/tag';
import { TagService } from '@/app/services/tag.service';
import * as XLSX from 'xlsx';

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

interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  sortable?: boolean;
  align?: 'left' | 'right';
}

@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="w-full px-4 pb-10 pt-6">
      <div class="flex flex-col gap-4 rounded-lg border border-border bg-card">
        <div class="flex flex-col gap-3 border-b border-border bg-card px-4 py-3">
          <div class="flex flex-wrap items-center gap-2">
            <details class="relative">
              <summary
                class="cursor-pointer rounded-full border border-border px-3 py-1 text-xs font-medium"
              >
                Brand
                <span class="text-muted-foreground">
                  ({{ filters.brand.length || 'all' }})
                </span>
              </summary>
              <div
                class="absolute z-20 mt-2 max-h-64 w-56 overflow-y-auto rounded-md border border-border bg-background p-3 shadow-lg"
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

            <details class="relative">
              <summary
                class="cursor-pointer rounded-full border border-border px-3 py-1 text-xs font-medium"
              >
                Marketplace
                <span class="text-muted-foreground">
                  ({{ filters.marketplace.length || 'all' }})
                </span>
              </summary>
              <div
                class="absolute z-20 mt-2 max-h-64 w-56 overflow-y-auto rounded-md border border-border bg-background p-3 shadow-lg"
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

            <details class="relative">
              <summary
                class="cursor-pointer rounded-full border border-border px-3 py-1 text-xs font-medium"
              >
                Status
                <span class="text-muted-foreground">
                  ({{ filters.status.length || 'all' }})
                </span>
              </summary>
              <div
                class="absolute z-20 mt-2 w-48 rounded-md border border-border bg-background p-3 shadow-lg"
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

            <details class="relative">
              <summary
                class="cursor-pointer rounded-full border border-border px-3 py-1 text-xs font-medium"
              >
                Price
                <span class="text-muted-foreground">
                  {{
                    filters.priceRange[0] > 0 || filters.priceRange[1] < 10000
                      ? '$' + filters.priceRange[0] + ' - ' + filters.priceRange[1]
                      : 'all'
                  }}
                </span>
              </summary>
              <div
                class="absolute z-20 mt-2 w-64 rounded-md border border-border bg-background p-3 shadow-lg"
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

            <details class="relative">
              <summary
                class="cursor-pointer rounded-full border border-border px-3 py-1 text-xs font-medium"
              >
                Stock
                <span class="text-muted-foreground">
                  {{
                    filters.stockRange[0] > 0 || filters.stockRange[1] < 10000
                      ? filters.stockRange[0] + ' - ' + filters.stockRange[1]
                      : 'all'
                  }}
                </span>
              </summary>
              <div
                class="absolute z-20 mt-2 w-64 rounded-md border border-border bg-background p-3 shadow-lg"
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

            <details class="relative">
              <summary
                class="cursor-pointer rounded-full border border-border px-3 py-1 text-xs font-medium"
              >
                Sold
                <span class="text-muted-foreground">
                  {{
                    filters.soldRange[0] > 0 || filters.soldRange[1] < 10000
                      ? filters.soldRange[0] + ' - ' + filters.soldRange[1]
                      : 'all'
                  }}
                </span>
              </summary>
              <div
                class="absolute z-20 mt-2 w-72 rounded-md border border-border bg-background p-3 shadow-lg"
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

            <details class="relative">
              <summary
                class="cursor-pointer rounded-full border border-border px-3 py-1 text-xs font-medium"
              >
                Type
                <span class="text-muted-foreground">
                  {{
                    filters.kitProduct === null
                      ? 'all'
                      : filters.kitProduct
                        ? 'kit'
                        : 'single'
                  }}
                </span>
              </summary>
              <div
                class="absolute z-20 mt-2 w-48 rounded-md border border-border bg-background p-3 shadow-lg"
              >
                <label class="flex items-center gap-2 py-1 text-xs">
                  <input
                    type="radio"
                    name="kitFilter"
                    class="h-4 w-4"
                    [checked]="filters.kitProduct === null"
                    (change)="setKitFilter(null)"
                  />
                  <span>All products</span>
                </label>
                <label class="flex items-center gap-2 py-1 text-xs">
                  <input
                    type="radio"
                    name="kitFilter"
                    class="h-4 w-4"
                    [checked]="filters.kitProduct === true"
                    (change)="setKitFilter(true)"
                  />
                  <span>Kit products</span>
                </label>
                <label class="flex items-center gap-2 py-1 text-xs">
                  <input
                    type="radio"
                    name="kitFilter"
                    class="h-4 w-4"
                    [checked]="filters.kitProduct === false"
                    (change)="setKitFilter(false)"
                  />
                  <span>Single products</span>
                </label>
              </div>
            </details>

            <details class="relative">
              <summary
                class="cursor-pointer rounded-full border border-border px-3 py-1 text-xs font-medium"
              >
                Variation
                <span class="text-muted-foreground">
                  {{
                    filters.hasVariation === null
                      ? 'all'
                      : filters.hasVariation
                        ? 'has'
                        : 'none'
                  }}
                </span>
              </summary>
              <div
                class="absolute z-20 mt-2 w-44 rounded-md border border-border bg-background p-3 shadow-lg"
              >
                <label class="flex items-center gap-2 py-1 text-xs">
                  <input
                    type="radio"
                    name="variationFilter"
                    class="h-4 w-4"
                    [checked]="filters.hasVariation === null"
                    (change)="setVariationFilter(null)"
                  />
                  <span>All</span>
                </label>
                <label class="flex items-center gap-2 py-1 text-xs">
                  <input
                    type="radio"
                    name="variationFilter"
                    class="h-4 w-4"
                    [checked]="filters.hasVariation === true"
                    (change)="setVariationFilter(true)"
                  />
                  <span>Has variation</span>
                </label>
                <label class="flex items-center gap-2 py-1 text-xs">
                  <input
                    type="radio"
                    name="variationFilter"
                    class="h-4 w-4"
                    [checked]="filters.hasVariation === false"
                    (change)="setVariationFilter(false)"
                  />
                  <span>No variation</span>
                </label>
              </div>
            </details>

            <details class="relative">
              <summary
                class="cursor-pointer rounded-full border border-border px-3 py-1 text-xs font-medium"
              >
                Tags
                <span class="text-muted-foreground">
                  ({{ filters.tags.length || 'all' }})
                </span>
              </summary>
              <div
                class="absolute z-20 mt-2 w-56 rounded-md border border-border bg-background p-3 shadow-lg"
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
                      class="h-4 w-4"
                      [checked]="filters.tags.includes(tag.id)"
                      (change)="toggleTagFilter(tag.id)"
                    />
                    <span
                      class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
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
              <input
                type="search"
                class="w-full max-w-[420px] rounded-full border border-border bg-background px-4 py-2 text-xs focus:border-primary focus:outline-none"
                placeholder="Search products..."
                [(ngModel)]="filters.search"
                (ngModelChange)="onFilterChange()"
              />
              <button
                type="button"
                class="rounded-full border border-border px-3 py-2 text-xs"
              >
                Custom Filters
              </button>
              <details class="relative">
                <summary
                  class="cursor-pointer rounded-full border border-border px-3 py-2 text-xs"
                >
                  Columns
                </summary>
                <div
                  class="absolute right-0 z-20 mt-2 w-56 rounded-md border border-border bg-background p-3 shadow-lg"
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
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="rounded-full border border-border px-3 py-1 text-xs"
              (click)="openCsvDialog('update')"
            >
              Update via CSV
            </button>
            <button
              type="button"
              class="rounded-full border border-destructive px-3 py-1 text-xs text-destructive"
              (click)="resetFilters()"
            >
              Clear all
            </button>
            <details class="relative">
              <summary
                class="cursor-pointer rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
              >
                Create Product
              </summary>
              <div
                class="absolute z-20 mt-2 w-56 rounded-md border border-border bg-background p-2 shadow-lg"
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
                class="rounded-full border border-border bg-background px-2 py-1 text-xs"
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
                  class="h-7 w-7 rounded-full border border-border"
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
                class="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white"
                [style.backgroundColor]="tagColor || '#64748b'"
              >
                {{ tagName || 'Tag name' }}
              </span>
            </span>
          </div>
        </div>

        <div
          *ngIf="manualDialogOpen"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div class="w-full max-w-3xl rounded-lg bg-card p-4 shadow-lg">
            <div class="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 class="text-lg font-semibold">Create new product</h3>
                <p class="text-xs text-muted-foreground">
                  Fill in the product details. Required fields are marked.
                </p>
              </div>
              <button
                type="button"
                class="rounded-full border border-border px-3 py-1 text-xs"
                (click)="closeManualDialog()"
              >
                Close
              </button>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <button
                *ngFor="let tab of manualTabs"
                type="button"
                class="rounded-full border border-border px-3 py-1 text-xs"
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
                    class="h-4 w-4"
                    [checked]="manualProductType === 'single'"
                    (change)="manualProductType = 'single'"
                  />
                  <span>Single product</span>
                </label>
                <label class="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="manualProductType"
                    class="h-4 w-4"
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
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div class="w-full max-w-3xl rounded-lg bg-card p-4 shadow-lg">
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
                class="rounded-full border border-border px-3 py-1 text-xs"
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
                      class="h-4 w-4"
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

        <ng-container *ngIf="filteredProducts() as filtered">
          <ng-container *ngIf="paginatedProducts(filtered) as visible">
            <div *ngIf="selectedCount > 0" class="mx-4 rounded-lg border border-border bg-muted/30 px-4 py-3">
              <div class="flex flex-wrap items-center gap-3 text-sm">
                <span class="font-semibold">
                  {{ selectedCount }} selected
                </span>
                <button
                  type="button"
                  class="rounded-full border border-border px-3 py-1 text-xs"
                  (click)="selectAllFiltered(filtered)"
                >
                  Select all filtered ({{ filtered.length }})
                </button>
                <button
                  type="button"
                  class="rounded-full border border-border px-3 py-1 text-xs"
                  (click)="clearSelection()"
                >
                  Clear selection
                </button>
                <label class="flex items-center gap-2 text-xs text-muted-foreground">
                  Add tag
                  <select
                    class="rounded-full border border-border bg-background px-2 py-1 text-xs"
                    (change)="bulkAddTag($any($event.target).value)"
                  >
                    <option value="">Choose</option>
                    <option *ngFor="let tag of tags" [value]="tag.id">
                      {{ tag.name }}
                    </option>
                  </select>
                </label>
                <label class="flex items-center gap-2 text-xs text-muted-foreground">
                  Remove tag
                  <select
                    class="rounded-full border border-border bg-background px-2 py-1 text-xs"
                    (change)="bulkRemoveTag($any($event.target).value)"
                  >
                    <option value="">Choose</option>
                    <option *ngFor="let tag of tags" [value]="tag.id">
                      {{ tag.name }}
                    </option>
                  </select>
                </label>
                <details class="relative">
                  <summary
                    class="cursor-pointer rounded-full border border-border px-3 py-1 text-xs"
                  >
                    Update pricing
                  </summary>
                  <div
                    class="absolute z-20 mt-2 w-64 rounded-md border border-border bg-background p-3 shadow-lg"
                  >
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
                  class="rounded-full border border-border px-3 py-1 text-xs"
                  (click)="exportSelectedCsv(filtered)"
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  class="rounded-full border border-border px-3 py-1 text-xs"
                  (click)="openBulkOffer()"
                >
                  Create offer
                </button>
                <button
                  type="button"
                  class="rounded-full border border-border px-3 py-1 text-xs"
                  (click)="openBulkListing()"
                >
                  Bulk listing
                </button>
                <button
                  type="button"
                  class="rounded-full border border-destructive px-3 py-1 text-xs text-destructive"
                  (click)="bulkDelete()"
                >
                  Delete
                </button>
              </div>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-2 px-4 text-sm">
            <p class="text-muted-foreground">
              Showing {{ pageStart(filtered.length) }}-{{ pageEnd(filtered.length) }}
              of {{ filtered.length }} products
            </p>
            <p class="text-muted-foreground">
              Total catalog: {{ products.length }} items
            </p>
          </div>

          <div class="mx-4 overflow-x-auto rounded-lg border border-border">
            <table class="w-full min-w-[1250px] text-sm">
              <thead class="bg-muted/40 text-left text-xs uppercase tracking-wide">
                <tr>
                  <th
                    class="sticky top-0 z-10 bg-card px-4 py-3 text-left"
                  >
                    <input
                      type="checkbox"
                      class="h-4 w-4"
                      [checked]="allVisibleSelected(visible)"
                      (change)="toggleSelectVisible(visible)"
                    />
                  </th>
                  <th
                    *ngIf="isColumnVisible('name')"
                    class="sticky top-0 z-10 bg-card relative px-4 py-3"
                    [style.width.px]="columnWidth('name')"
                  >
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
                    class="sticky top-0 z-10 bg-card relative px-4 py-3"
                    [style.width.px]="columnWidth('productType')"
                  >
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
                    class="sticky top-0 z-10 bg-card relative px-4 py-3"
                    [style.width.px]="columnWidth('tags')"
                  >
                    Tags
                    <span
                      class="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                      (mousedown)="startResize($event, 'tags')"
                    ></span>
                  </th>
                  <th
                    *ngIf="isColumnVisible('vendorName')"
                    class="sticky top-0 z-10 bg-card relative px-4 py-3"
                    [style.width.px]="columnWidth('vendorName')"
                  >
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
                    class="sticky top-0 z-10 bg-card relative px-4 py-3"
                    [style.width.px]="columnWidth('brand')"
                  >
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
                    class="sticky top-0 z-10 bg-card relative px-4 py-3"
                    [style.width.px]="columnWidth('marketplaces')"
                  >
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
                    class="sticky top-0 z-10 bg-card relative px-4 py-3 text-right"
                    [style.width.px]="columnWidth('salePrice')"
                  >
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
                    class="sticky top-0 z-10 bg-card relative px-4 py-3 text-right"
                    [style.width.px]="columnWidth('soldQty')"
                  >
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
                    class="sticky top-0 z-10 bg-card relative px-4 py-3 text-right"
                    [style.width.px]="columnWidth('stockQty')"
                  >
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
                    class="sticky top-0 z-10 bg-card relative px-4 py-3"
                    [style.width.px]="columnWidth('restockStatus')"
                  >
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
                  class="border-t border-border"
                >
                  <td class="px-4 py-4">
                    <input
                      type="checkbox"
                      class="h-4 w-4"
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
                        <p class="font-medium text-foreground">
                          {{ product.name }}
                        </p>
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
                    <div class="text-sm font-medium capitalize">
                      {{ product.productType }}
                    </div>
                    <div class="text-xs text-muted-foreground" *ngIf="product.variation">
                      {{ product.variation.type }} · {{ product.variation.value }}
                    </div>
                  </td>
                  <td
                    *ngIf="isColumnVisible('tags')"
                    class="px-4 py-4"
                    [style.width.px]="columnWidth('tags')"
                  >
                    <div class="flex flex-wrap items-center gap-1">
                      <span
                        *ngFor="let tag of getProductTags(product.id)"
                        class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
                        [style.backgroundColor]="tag.color"
                      >
                        {{ tag.name }}
                        <button
                          type="button"
                          class="rounded-full px-1 text-[10px] hover:bg-white/20"
                          (click)="removeTagFromProduct(product.id, tag.id)"
                        >
                          ✕
                        </button>
                      </span>
                      <button
                        *ngIf="tags.length > 0"
                        type="button"
                        class="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted"
                        (click)="toggleTagPicker(product.id)"
                      >
                        {{ tagPickerProductId === product.id ? 'Close' : 'Add tag' }}
                      </button>
                      <button
                        *ngIf="tags.length === 0"
                        type="button"
                        class="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted"
                        (click)="openTagForm()"
                      >
                        Create tag
                      </button>
                    </div>
                    <div
                      *ngIf="tagPickerProductId === product.id"
                      class="mt-2 flex flex-col gap-2 rounded-md border border-border bg-background p-2"
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
                        <span
                          class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white"
                          [style.backgroundColor]="tag.color"
                        >
                          {{ tag.name }}
                        </span>
                      </label>
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
                      class="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
                      [ngClass]="restockClasses[product.restockStatus]"
                    >
                      {{ restockLabels[product.restockStatus] }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            class="flex flex-col items-center justify-between gap-3 px-4 pb-6 text-sm sm:flex-row"
          >
            <div class="text-muted-foreground">
              Page {{ currentPage }} of {{ totalPages(filtered.length) }}
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="rounded-md border border-border px-3 py-2 text-sm disabled:opacity-50"
                [disabled]="currentPage === 1"
                (click)="previousPage()"
              >
                Previous
              </button>
              <button
                type="button"
                class="rounded-md border border-border px-3 py-2 text-sm disabled:opacity-50"
                [disabled]="currentPage >= totalPages(filtered.length)"
                (click)="nextPage(filtered.length)"
              >
                Next
              </button>
            </div>
          </div>
        </ng-container>
      </ng-container>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGridComponent implements OnInit {
  private readonly tagService = inject(TagService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

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

  readonly columns: ColumnConfig[] = [
    { id: 'name', label: 'Product', visible: true, sortable: true },
    { id: 'productType', label: 'Type', visible: true, sortable: true },
    { id: 'tags', label: 'Tags', visible: true },
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

  tagFormOpen = false;
  editingTag: Tag | null = null;
  tagName = '';
  tagColor = tagColors[0].value;
  tagPickerProductId: string | null = null;

  bulkSalePrice = '';
  bulkStockQty = '';
  bulkLandedCost = '';
  bulkPurchaseQty = '';

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
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
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

  openBulkOffer(): void {
    window.alert('Bulk offer flow is not wired yet.');
  }

  openBulkListing(): void {
    window.alert('Bulk listing flow is not wired yet.');
  }

  isColumnVisible(columnId: string): boolean {
    return this.columns.find((column) => column.id === columnId)?.visible ?? true;
  }

  toggleColumn(columnId: string): void {
    const column = this.columns.find((item) => item.id === columnId);
    if (!column) return;
    column.visible = !column.visible;
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
    const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false });
    const [headerRow, ...rows] = data;
    const headers = (headerRow || []).map((header) => `${header}`.trim());
    const parsedRows = rows.map((row) => row.map((cell) => `${cell ?? ''}`.trim()));
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
      .filter((record) => record.name || record.vendorSku);
  }

  private applyCsvUpdates(products: Product[], updates: Record<string, string>[]): Product[] {
    if (this.csvMatchFields.length === 0) return products;
    return products.map((product) => {
      const match = updates.find((record) =>
        this.csvMatchFields.some((fieldId) => {
          const value = record[fieldId];
          if (!value) return false;
          return (product as Record<string, string | number | null>)[fieldId] === value;
        })
      );
      if (!match) return product;
      return this.updateProductFromRecord(product, match);
    });
  }

  private createProductFromInput(input: Record<string, string>): Product {
    const id = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const salePrice = this.toNumber(input.salePrice, 0);
    const landedCost = this.toNumber(input.landedCost, 0);
    const shippingCost = this.toNumber(input.shippingCost, 0);
    const purchaseQty = Math.round(this.toNumber(input.purchaseQty, 0));
    const soldQty = Math.round(this.toNumber(input.soldQty, 0));
    const returnQty = Math.round(this.toNumber(input.returnQty, 0));
    const stockQty = Math.round(this.toNumber(input.stockQty, Math.max(purchaseQty - soldQty + returnQty, 0)));

    const base: Product = {
      id,
      image: input.image || `https://picsum.photos/seed/${id}/100/100`,
      name: input.name || 'New Product',
      vendorSku: input.vendorSku || `SKU-${id}`,
      manufacturerPart: input.manufacturerPart || '',
      asin: input.asin || '',
      fnsku: input.fnsku || '',
      gtin: input.gtin || '',
      ean: input.ean || '',
      isbn: input.isbn || '',
      inventoryDifference: 0,
      productId: input.productId || id,
      variationId: null,
      variation: null,
      vendorName: input.vendorName || '',
      brand: input.brand || '',
      kitProduct: false,
      productType: (input.productType as ProductType) || 'single',
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

  private updateProductFromRecord(product: Product, record: Record<string, string>): Product {
    const updated: Product = { ...product };
    const numericFields = new Set(['salePrice', 'landedCost', 'shippingCost']);
    const intFields = new Set(['purchaseQty', 'soldQty', 'stockQty', 'returnQty']);

    Object.entries(record).forEach(([field, value]) => {
      if (!value) return;
      if (numericFields.has(field)) {
        (updated as Record<string, number>)[field] = this.toNumber(value, updated[field as keyof Product] as number);
      } else if (intFields.has(field)) {
        (updated as Record<string, number>)[field] = Math.round(
          this.toNumber(value, updated[field as keyof Product] as number)
        );
      } else if (field in updated) {
        (updated as Record<string, string>)[field] = value;
      }
    });

    return this.recalculateProduct(updated);
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

  private withinRange(value: number, range: [number, number]): boolean {
    return value >= range[0] && value <= range[1];
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
