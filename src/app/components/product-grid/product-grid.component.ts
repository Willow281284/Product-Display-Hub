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
import { FilterState, Product, SoldPeriod } from '@/types/product';
import { Tag, tagColors } from '@/types/tag';
import { TagService } from '@/app/services/tag.service';

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
              (click)="updateViaCsv()"
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
            <button
              type="button"
              class="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
              (click)="createProduct()"
            >
              Create Product
            </button>
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

  readonly products = mockProducts;
  readonly brands = brands;
  readonly marketplaces = marketplacePlatforms;
  readonly tagColors = tagColors;

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

  updateViaCsv(): void {
    window.alert('CSV import is not wired yet.');
  }

  createProduct(): void {
    window.alert('Create product flow is not wired yet.');
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
    window.alert('Bulk delete is not wired yet.');
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
