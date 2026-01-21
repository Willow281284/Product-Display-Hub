import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { mockProducts, brands } from '@/data/mockProducts';
import { Product } from '@/types/product';

type SortKey =
  | 'name'
  | 'vendorSku'
  | 'brand'
  | 'salePrice'
  | 'stockQty'
  | 'restockStatus'
  | 'marketplaces';

type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="mx-auto w-full max-w-6xl px-4 pb-10 pt-6">
      <div class="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-2xl font-semibold">Products</h2>
            <p class="text-sm text-muted-foreground">
              Browse and manage the catalog from your Lovable data set.
            </p>
          </div>
          <button
            type="button"
            class="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
            (click)="resetFilters()"
          >
            Reset filters
          </button>
        </div>

        <div class="grid gap-4 lg:grid-cols-4">
          <label class="flex flex-col gap-2 lg:col-span-2">
            <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >Search</span
            >
            <input
              type="search"
              class="rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              placeholder="Search by name, SKU, brand, vendor, or product ID"
              [(ngModel)]="search"
              (ngModelChange)="onFilterChange()"
            />
          </label>
          <label class="flex flex-col gap-2">
            <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >Brand</span
            >
            <select
              class="rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              [(ngModel)]="selectedBrand"
              (ngModelChange)="onFilterChange()"
            >
              <option value="">All brands</option>
              <option *ngFor="let brand of brands" [value]="brand">
                {{ brand }}
              </option>
            </select>
          </label>
          <label class="flex flex-col gap-2">
            <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >Rows</span
            >
            <select
              class="rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              [(ngModel)]="pageSize"
              (ngModelChange)="onPageSizeChange()"
            >
              <option [value]="10">10</option>
              <option [value]="25">25</option>
              <option [value]="50">50</option>
            </select>
          </label>
        </div>

        <ng-container *ngIf="filteredProducts() as filtered">
          <div class="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p class="text-muted-foreground">
              Showing {{ pageStart(filtered.length) }}-{{ pageEnd(filtered.length) }}
              of {{ filtered.length }} products
            </p>
            <p class="text-muted-foreground">
              Total catalog: {{ products.length }} items
            </p>
          </div>

          <div class="overflow-x-auto rounded-lg border border-border">
            <table class="w-full min-w-[860px] text-sm">
              <thead class="bg-muted/40 text-left text-xs uppercase tracking-wide">
                <tr>
                  <th class="px-4 py-3">
                    <button
                      type="button"
                      class="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                      (click)="setSort('name')"
                    >
                      Product
                      <span class="text-[10px]">{{ sortIcon('name') }}</span>
                    </button>
                  </th>
                  <th class="px-4 py-3">
                    <button
                      type="button"
                      class="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                      (click)="setSort('brand')"
                    >
                      Brand
                      <span class="text-[10px]">{{ sortIcon('brand') }}</span>
                    </button>
                  </th>
                  <th class="px-4 py-3">
                    <button
                      type="button"
                      class="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                      (click)="setSort('marketplaces')"
                    >
                      Marketplaces
                      <span class="text-[10px]">{{ sortIcon('marketplaces') }}</span>
                    </button>
                  </th>
                  <th class="px-4 py-3 text-right">
                    <button
                      type="button"
                      class="flex items-center justify-end gap-2 text-muted-foreground hover:text-foreground"
                      (click)="setSort('salePrice')"
                    >
                      Price
                      <span class="text-[10px]">{{ sortIcon('salePrice') }}</span>
                    </button>
                  </th>
                  <th class="px-4 py-3 text-right">
                    <button
                      type="button"
                      class="flex items-center justify-end gap-2 text-muted-foreground hover:text-foreground"
                      (click)="setSort('stockQty')"
                    >
                      Stock
                      <span class="text-[10px]">{{ sortIcon('stockQty') }}</span>
                    </button>
                  </th>
                  <th class="px-4 py-3">
                    <button
                      type="button"
                      class="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                      (click)="setSort('restockStatus')"
                    >
                      Restock
                      <span class="text-[10px]">{{ sortIcon('restockStatus') }}</span>
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  *ngFor="let product of paginatedProducts(filtered); trackBy: trackById"
                  class="border-t border-border"
                >
                  <td class="px-4 py-4">
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
                  <td class="px-4 py-4">
                    <div class="text-sm font-medium">{{ product.brand }}</div>
                    <div class="text-xs text-muted-foreground">
                      {{ product.vendorName }}
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <div class="text-sm font-medium">
                      {{
                        product.marketplaces.length > 0
                          ? product.marketplaces.length + ' active'
                          : 'Not listed'
                      }}
                    </div>
                    <div class="text-xs text-muted-foreground">
                      {{
                        product.marketplaces.length > 0
                          ? product.marketplaces[0].platform
                          : 'No marketplace data'
                      }}
                    </div>
                  </td>
                  <td class="px-4 py-4 text-right">
                    <p class="font-medium">
                      {{ product.salePrice | currency: 'USD' : 'symbol' : '1.2-2' }}
                    </p>
                    <p class="text-xs text-muted-foreground">
                      Margin {{ product.grossProfitPercent }}%
                    </p>
                  </td>
                  <td class="px-4 py-4 text-right">
                    <p class="font-medium">{{ product.stockQty }}</p>
                    <p class="text-xs text-muted-foreground">
                      {{ product.stockDays }} days
                    </p>
                  </td>
                  <td class="px-4 py-4">
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
            class="flex flex-col items-center justify-between gap-3 text-sm sm:flex-row"
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
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGridComponent {
  readonly products = mockProducts;
  readonly brands = brands;

  search = '';
  selectedBrand = '';
  pageSize = 25;
  currentPage = 1;
  sortKey: SortKey | null = null;
  sortDirection: SortDirection | null = null;

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

  filteredProducts(): Product[] {
    const searchTerm = this.search.trim().toLowerCase();
    let result = this.products;

    if (searchTerm) {
      result = result.filter((product) =>
        [
          product.name,
          product.vendorSku,
          product.brand,
          product.vendorName,
          product.productId,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(searchTerm))
      );
    }

    if (this.selectedBrand) {
      result = result.filter((product) => product.brand === this.selectedBrand);
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

  resetFilters(): void {
    this.search = '';
    this.selectedBrand = '';
    this.pageSize = 25;
    this.currentPage = 1;
    this.sortKey = null;
    this.sortDirection = null;
  }

  previousPage(): void {
    this.currentPage = Math.max(1, this.currentPage - 1);
  }

  nextPage(total: number): void {
    this.currentPage = Math.min(this.totalPages(total), this.currentPage + 1);
  }

  trackById(_: number, product: Product): string {
    return product.id;
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
      case 'salePrice':
        return product.salePrice;
      case 'stockQty':
        return product.stockQty;
      case 'restockStatus':
        return this.restockRank[product.restockStatus];
      case 'marketplaces':
        return product.marketplaces.length;
      default:
        return product.name;
    }
  }
}
