import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import { marketplacePlatforms, mockProducts } from '@/data/mockProducts';
import { MarketplaceStatus, Product } from '@/types/product';

type TabId =
  | 'overview'
  | 'pricing'
  | 'identifiers'
  | 'images'
  | 'marketplaces'
  | 'content'
  | 'options'
  | 'extra'
  | 'tags'
  | 'sales'
  | 'offers';

interface OfferRow {
  name: string;
  status: 'Active' | 'Scheduled' | 'Paused';
  discount: string;
  duration: string;
}

interface OptionSet {
  name: string;
  display: string;
  choices: string[];
  imageLink: boolean;
}

interface VariationRow {
  name: string;
  sku: string;
  stock: number;
  priceDelta: string;
}

interface AttributeRow {
  name: string;
  value: string;
  type: string;
}

interface InventoryLocation {
  name: string;
  onHand: number;
  reserved: number;
  available: number;
}

interface SalesRow {
  label: string;
  units: number;
  revenue: number;
}

@Component({
  selector: 'app-product-edit-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="min-h-screen bg-background flex flex-col">
      <ng-container *ngIf="product$ | async as product">
        <header class="px-6 py-4 border-b border-border bg-background">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted"
                aria-label="Back to products"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-4 w-4"
                >
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </button>
              <img
                [src]="product.image"
                [alt]="product.name"
                class="h-20 w-20 rounded-lg border border-border bg-muted object-cover"
              />
              <div>
                <h1 class="text-2xl font-semibold flex flex-wrap items-center gap-2">
                  {{ product.name }}
                  <span
                    *ngIf="product.productType === 'kit'"
                    class="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="h-3.5 w-3.5"
                    >
                      <path
                        d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
                      ></path>
                      <path d="M12 22V12"></path>
                      <path d="m3.3 7 8.7 5 8.7-5"></path>
                      <path d="m7.5 4.27 9 5.15"></path>
                    </svg>
                    Kit
                  </span>
                </h1>
                <p class="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span class="flex items-center gap-1.5">
                    <span class="text-base font-semibold text-muted-foreground">#</span>
                    {{ product.productId }}
                  </span>
                  <span
                    *ngIf="product.variationId"
                    class="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs"
                  >
                    Variation: {{ product.variationId }}
                  </span>
                </p>
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <button
                type="button"
                class="rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                class="rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Save Changes
              </button>
              <button
                type="button"
                class="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Save &amp; List
              </button>
            </div>
          </div>
        </header>

        <div class="px-6">
          <div class="mt-4 flex flex-wrap gap-2 border-b border-border pb-4">
            <button
              type="button"
              class="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium"
              [class.bg-muted]="activeTab === 'overview'"
              (click)="selectTab('overview')"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4"
              >
                <path
                  d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
                ></path>
                <path d="M12 22V12"></path>
                <path d="m3.3 7 8.7 5 8.7-5"></path>
                <path d="m7.5 4.27 9 5.15"></path>
              </svg>
              Overview
            </button>
            <button
              type="button"
              class="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium"
              [class.bg-muted]="activeTab === 'pricing'"
              (click)="selectTab('pricing')"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4"
              >
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path
                  d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                ></path>
              </svg>
              Pricing &amp; Inventory
            </button>
            <button
              type="button"
              class="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium"
              [class.bg-muted]="activeTab === 'identifiers'"
              (click)="selectTab('identifiers')"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4"
              >
                <path d="M3 5v14"></path>
                <path d="M8 5v14"></path>
                <path d="M12 5v14"></path>
                <path d="M17 5v14"></path>
                <path d="M21 5v14"></path>
              </svg>
              Identifiers
            </button>
            <button
              type="button"
              class="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium"
              [class.bg-muted]="activeTab === 'images'"
              (click)="selectTab('images')"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <path d="m21 15-5-5L5 21"></path>
              </svg>
              Images
            </button>
            <button
              type="button"
              class="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium"
              [class.bg-muted]="activeTab === 'marketplaces'"
              (click)="selectTab('marketplaces')"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              Marketplaces
            </button>
            <button
              type="button"
              class="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium"
              [class.bg-muted]="activeTab === 'content'"
              (click)="selectTab('content')"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <line x1="10" y1="9" x2="8" y2="9"></line>
              </svg>
              Content
            </button>
            <button
              type="button"
              class="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium"
              [class.bg-muted]="activeTab === 'options'"
              (click)="selectTab('options')"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4"
              >
                <circle cx="13.5" cy="6.5" r=".5"></circle>
                <circle cx="17.5" cy="10.5" r=".5"></circle>
                <circle cx="8.5" cy="7.5" r=".5"></circle>
                <circle cx="6.5" cy="12.5" r=".5"></circle>
                <path
                  d="M12 22a10 10 0 1 0-10-10 3 3 0 0 0 3 3h2a2 2 0 0 1 2 2 3 3 0 0 0 3 3z"
                ></path>
              </svg>
              Product Options
            </button>
            <button
              type="button"
              class="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium"
              [class.bg-muted]="activeTab === 'extra'"
              (click)="selectTab('extra')"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4"
              >
                <path d="M20 7h-9"></path>
                <path d="M14 17H5"></path>
                <circle cx="17" cy="17" r="3"></circle>
                <circle cx="7" cy="7" r="3"></circle>
              </svg>
              Extra Attributes
            </button>
            <button
              type="button"
              class="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium"
              [class.bg-muted]="activeTab === 'tags'"
              (click)="selectTab('tags')"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4"
              >
                <path
                  d="M20.59 13.41 12 22 3 13.41a2 2 0 0 1 0-2.82L12 2l8.59 8.59a2 2 0 0 1 0 2.82z"
                ></path>
                <circle cx="7" cy="7" r="1.5"></circle>
              </svg>
              Tags
            </button>
            <button
              type="button"
              class="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium"
              [class.bg-muted]="activeTab === 'sales'"
              (click)="selectTab('sales')"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4"
              >
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                <polyline points="16 7 22 7 22 13"></polyline>
              </svg>
              Sales Overview
            </button>
            <button
              type="button"
              class="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium"
              [class.bg-muted]="activeTab === 'offers'"
              (click)="selectTab('offers')"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4"
              >
                <path
                  d="M20.59 13.41 12 22 3 13.41a2 2 0 0 1 0-2.82L12 2l8.59 8.59a2 2 0 0 1 0 2.82z"
                ></path>
                <circle cx="7" cy="7" r="1.5"></circle>
              </svg>
              Offers
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto px-6 pb-10">
          <div *ngIf="activeTab === 'overview'" class="py-6 space-y-6">
            <div class="grid gap-6 lg:grid-cols-2">
              <div class="space-y-4">
                <h3 class="text-lg font-semibold flex items-center gap-2">
                  <span class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="h-4 w-4"
                    >
                      <path
                        d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
                      ></path>
                      <path d="M12 22V12"></path>
                      <path d="m3.3 7 8.7 5 8.7-5"></path>
                      <path d="m7.5 4.27 9 5.15"></path>
                    </svg>
                  </span>
                  Basic Information
                </h3>
                <div class="rounded-lg bg-muted/30 p-4 space-y-4">
                  <div class="grid gap-4 sm:grid-cols-2">
                    <label class="grid gap-1 text-xs text-muted-foreground">
                      Brand
                      <input
                        type="text"
                        class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                        [value]="product.brand"
                      />
                    </label>
                    <label class="grid gap-1 text-xs text-muted-foreground">
                      Vendor
                      <input
                        type="text"
                        class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                        [value]="product.vendorName"
                      />
                    </label>
                  </div>
                  <label class="grid gap-1 text-xs text-muted-foreground">
                    SKU
                    <input
                      type="text"
                      class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                      [value]="product.vendorSku"
                    />
                  </label>
                  <label class="grid gap-1 text-xs text-muted-foreground">
                    MPN (Manufacturer Part Number)
                    <input
                      type="text"
                      class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                      [value]="product.manufacturerPart"
                    />
                  </label>
                  <div *ngIf="product.variation" class="flex items-center gap-2 text-sm">
                    <span class="rounded-full border border-border px-2 py-0.5 text-xs">
                      {{ product.variation.type }}
                    </span>
                    <span class="font-medium">{{ product.variation.value }}</span>
                  </div>
                </div>

                <div class="rounded-lg bg-muted/30 p-4">
                  <div class="flex items-center justify-between">
                    <h4 class="text-sm font-semibold">Active Offers</h4>
                    <button
                      type="button"
                      class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                      (click)="selectTab('offers')"
                    >
                      Manage offers
                    </button>
                  </div>
                  <div class="mt-3 grid grid-cols-3 gap-3">
                    <div class="rounded-lg bg-background p-2 text-center">
                      <p class="text-lg font-semibold text-primary">3</p>
                      <p class="text-xs text-muted-foreground">Active</p>
                    </div>
                    <div class="rounded-lg bg-background p-2 text-center">
                      <p class="text-lg font-semibold">7</p>
                      <p class="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div class="rounded-lg bg-background p-2 text-center">
                      <p class="text-lg font-semibold text-emerald-600">$24,980</p>
                      <p class="text-xs text-muted-foreground">Revenue</p>
                    </div>
                  </div>
                  <div class="mt-4 space-y-2">
                    <p class="text-xs font-semibold text-muted-foreground">Top offers</p>
                    <div
                      *ngFor="let offer of topOffers"
                      class="flex items-center justify-between rounded-lg bg-background px-3 py-2 text-xs"
                    >
                      <div class="flex items-center gap-2">
                        <span class="font-medium">{{ offer.name }}</span>
                        <span
                          class="rounded-full border border-border px-2 py-0.5 text-[10px]"
                        >
                          {{ offer.status }}
                        </span>
                      </div>
                      <span class="text-muted-foreground">{{ offer.discount }}</span>
                    </div>
                  </div>
                </div>

                <div class="rounded-lg bg-muted/30 p-4">
                  <div class="flex items-center justify-between">
                    <h4 class="text-sm font-semibold">Marketplace Status</h4>
                    <button
                      type="button"
                      class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                      (click)="selectTab('marketplaces')"
                    >
                      Manage listings
                    </button>
                  </div>
                  <ng-container *ngIf="marketplaceSummary(product) as summary">
                    <div class="mt-3 flex flex-wrap items-center gap-3 text-sm">
                      <span class="flex items-center gap-2">
                        <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
                        {{ summary.live }} Live
                      </span>
                      <span class="flex items-center gap-2">
                        <span class="h-2 w-2 rounded-full bg-slate-400"></span>
                        {{ summary.inactive }} Inactive
                      </span>
                      <span class="flex items-center gap-2" *ngIf="summary.error > 0">
                        <span class="h-2 w-2 rounded-full bg-rose-500"></span>
                        {{ summary.error }} Error
                      </span>
                      <span class="flex items-center gap-2" *ngIf="summary.notListed > 0">
                        <span class="h-2 w-2 rounded-full bg-slate-300"></span>
                        {{ summary.notListed }} Not listed
                      </span>
                    </div>
                    <div class="mt-3 flex flex-wrap gap-2">
                      <div
                        *ngFor="let row of summary.preview"
                        class="flex items-center gap-2 rounded-md border px-2 py-1 text-xs"
                        [ngClass]="marketplaceBadgeClass(row.status)"
                      >
                        <span class="capitalize">{{ row.platform }}</span>
                        <span [ngClass]="marketplaceTextClass(row.status)">
                          • {{ statusLabel(row.status) }}
                        </span>
                      </div>
                    </div>
                  </ng-container>
                </div>
              </div>

              <div class="space-y-4">
                <h3 class="text-lg font-semibold">Quick Stats</h3>
                <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div class="rounded-lg bg-muted/30 p-4">
                    <p class="text-xs text-muted-foreground">Sale Price</p>
                    <p class="text-xl font-semibold">
                      {{ product.salePrice | currency: 'USD' : 'symbol' : '1.2-2' }}
                    </p>
                  </div>
                  <div class="rounded-lg bg-muted/30 p-4">
                    <p class="text-xs text-muted-foreground">Profit Margin</p>
                    <p class="text-xl font-semibold text-emerald-600">
                      {{ product.grossProfitPercent | number: '1.0-0' }}%
                    </p>
                  </div>
                  <div class="rounded-lg bg-muted/30 p-4">
                    <p class="text-xs text-muted-foreground">In Stock</p>
                    <p class="text-xl font-semibold">{{ product.stockQty }}</p>
                  </div>
                  <div class="rounded-lg bg-muted/30 p-4">
                    <p class="text-xs text-muted-foreground">Shipping Cost</p>
                    <p class="text-xl font-semibold">
                      {{ product.shippingCost | currency: 'USD' : 'symbol' : '1.2-2' }}
                    </p>
                  </div>
                </div>

                <div class="space-y-3 rounded-lg border border-border bg-card p-4">
                  <div class="flex items-center justify-between">
                    <h4 class="text-sm font-semibold text-muted-foreground">
                      Revenue &amp; Profit Summary
                    </h4>
                    <button
                      type="button"
                      class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                    >
                      Last 30 days
                    </button>
                  </div>
                  <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div class="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                      <p class="text-xs font-semibold text-emerald-700">Total Revenue</p>
                      <p class="text-lg font-semibold text-emerald-700">$38,640.40</p>
                      <p class="text-xs text-muted-foreground">942 units sold</p>
                    </div>
                    <div class="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
                      <p class="text-xs font-semibold text-blue-700">Gross Profit</p>
                      <p class="text-lg font-semibold text-blue-700">$12,940.12</p>
                      <p class="text-xs text-muted-foreground">
                        {{ product.grossProfitPercent | number: '1.0-0' }}% margin
                      </p>
                    </div>
                    <div class="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3">
                      <p class="text-xs font-semibold text-purple-700">Avg Daily Sales</p>
                      <p class="text-lg font-semibold text-purple-700">31.4</p>
                      <p class="text-xs text-muted-foreground">units/day</p>
                    </div>
                    <div class="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                      <p class="text-xs font-semibold text-amber-700">Days of Stock</p>
                      <p class="text-lg font-semibold text-amber-700">
                        {{ product.stockDays | number: '1.0-0' }}
                      </p>
                      <p class="text-xs text-muted-foreground">at current velocity</p>
                    </div>
                  </div>
                </div>

                <div class="rounded-lg bg-muted/30 p-4 space-y-4">
                  <div class="flex items-center justify-between">
                    <h4 class="text-sm font-semibold">Sales Forecast</h4>
                    <span class="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      AI powered
                    </span>
                  </div>
                  <div class="grid gap-4 md:grid-cols-3">
                    <div class="rounded-lg bg-background p-3">
                      <p class="text-xs text-muted-foreground">Next 30 Days</p>
                      <p class="text-lg font-semibold">$38,450</p>
                      <p class="text-xs text-muted-foreground">1,020 units</p>
                    </div>
                    <div class="rounded-lg bg-background p-3">
                      <p class="text-xs text-muted-foreground">Next 60 Days</p>
                      <p class="text-lg font-semibold">$78,200</p>
                      <p class="text-xs text-muted-foreground">2,080 units</p>
                    </div>
                    <div class="rounded-lg bg-background p-3">
                      <p class="text-xs text-muted-foreground">Next 90 Days</p>
                      <p class="text-lg font-semibold">$115,800</p>
                      <p class="text-xs text-muted-foreground">3,075 units</p>
                    </div>
                  </div>
                  <div class="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                    <p class="font-semibold text-amber-700">Restock Recommendation</p>
                    <p class="text-xs text-muted-foreground">
                      Order {{ product.suggestedRestockQty }} units in the next
                      {{ restockLeadDays(product) | number: '1.0-0' }} days.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="rounded-lg bg-muted/30 p-4">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-semibold">Content Preview</h4>
                <button
                  type="button"
                  class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                  (click)="selectTab('content')"
                >
                  Edit content
                </button>
              </div>
              <p class="mt-3 text-sm text-muted-foreground">
                Add product descriptions, bullet points, and A+ content to improve
                marketplace discoverability.
              </p>
            </div>
          </div>

          <div *ngIf="activeTab === 'pricing'" class="py-6 space-y-6">
            <div class="grid gap-6 lg:grid-cols-2">
              <div class="space-y-4">
                <h3 class="text-lg font-semibold">Pricing</h3>
                <div class="rounded-lg bg-muted/30 p-4 space-y-4">
                  <label class="grid gap-1 text-xs text-muted-foreground">
                    Sale Price
                    <input
                      type="number"
                      class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                      [value]="product.salePrice"
                    />
                  </label>
                  <div class="grid gap-4 sm:grid-cols-2">
                    <label class="grid gap-1 text-xs text-muted-foreground">
                      MSRP
                      <input
                        type="number"
                        class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                        [value]="product.salePrice + 12"
                      />
                    </label>
                    <label class="grid gap-1 text-xs text-muted-foreground">
                      Discount %
                      <input
                        type="number"
                        class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                        value="12.5"
                      />
                    </label>
                  </div>
                  <div class="grid gap-4 sm:grid-cols-2">
                    <label class="grid gap-1 text-xs text-muted-foreground">
                      BuyBox Min Price
                      <input
                        type="number"
                        class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                        [value]="product.salePrice - 4"
                      />
                    </label>
                    <label class="grid gap-1 text-xs text-muted-foreground">
                      BuyBox Max Price
                      <input
                        type="number"
                        class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                        [value]="product.salePrice + 6"
                      />
                    </label>
                  </div>
                  <div class="grid gap-4 sm:grid-cols-2">
                    <label class="grid gap-1 text-xs text-muted-foreground">
                      Landed Cost
                      <input
                        type="number"
                        class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                        [value]="product.landedCost"
                      />
                    </label>
                    <label class="grid gap-1 text-xs text-muted-foreground">
                      Shipping Cost
                      <input
                        type="number"
                        class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                        [value]="product.shippingCost"
                      />
                    </label>
                  </div>
                  <div class="grid gap-4 sm:grid-cols-2">
                    <div class="rounded-lg bg-background p-3 text-sm">
                      <p class="text-xs text-muted-foreground">Gross Profit</p>
                      <p class="text-lg font-semibold text-emerald-600">
                        {{ product.grossProfitAmount | currency: 'USD' : 'symbol' : '1.2-2' }}
                      </p>
                    </div>
                    <div class="rounded-lg bg-background p-3 text-sm">
                      <p class="text-xs text-muted-foreground">Profit Margin</p>
                      <p class="text-lg font-semibold text-emerald-600">
                        {{ product.grossProfitPercent | number: '1.0-0' }}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="space-y-4">
                <h3 class="text-lg font-semibold">Inventory</h3>
                <div class="rounded-lg bg-muted/30 p-4 space-y-4">
                  <div class="grid gap-4 sm:grid-cols-2">
                    <label class="grid gap-1 text-xs text-muted-foreground">
                      Stock Qty
                      <input
                        type="number"
                        class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                        [value]="product.stockQty"
                      />
                    </label>
                    <label class="grid gap-1 text-xs text-muted-foreground">
                      Purchase Qty
                      <input
                        type="number"
                        class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                        [value]="product.purchaseQty"
                      />
                    </label>
                    <label class="grid gap-1 text-xs text-muted-foreground">
                      Sold Qty
                      <input
                        type="number"
                        class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                        [value]="product.soldQty"
                      />
                    </label>
                    <label class="grid gap-1 text-xs text-muted-foreground">
                      Returns
                      <input
                        type="number"
                        class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                        [value]="product.returnQty"
                      />
                    </label>
                  </div>
                  <div class="rounded-lg border border-border bg-background p-3 text-sm">
                    <div class="flex items-center justify-between">
                      <p class="text-xs text-muted-foreground">Restock Status</p>
                      <span
                        class="rounded-full border px-2 py-0.5 text-xs"
                        [ngClass]="restockBadgeClass(product.restockStatus)"
                      >
                        {{ restockLabel(product.restockStatus) }}
                      </span>
                    </div>
                    <p class="mt-2 text-xs text-muted-foreground">
                      Velocity: {{ product.velocity | number: '1.1-1' }} units/day
                    </p>
                    <p class="text-xs text-muted-foreground">
                      Suggested restock: {{ product.suggestedRestockQty }} units
                    </p>
                  </div>
                </div>
                <div class="rounded-lg border border-border bg-card p-4">
                  <h4 class="text-sm font-semibold mb-3">Inventory Locations</h4>
                  <div class="space-y-2 text-xs">
                    <div
                      *ngFor="let location of inventoryLocations"
                      class="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2"
                    >
                      <span class="font-medium">{{ location.name }}</span>
                      <span class="text-muted-foreground">
                        {{ location.onHand }} on hand / {{ location.available }} available
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="activeTab === 'identifiers'" class="py-6 space-y-6">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Product Identifiers</h3>
              <p class="text-xs text-muted-foreground">
                Track multiple identifiers per marketplace listing.
              </p>
            </div>
            <div class="rounded-lg bg-muted/30 p-4">
              <h4 class="text-sm font-semibold mb-4">Primary Identifiers</h4>
              <div class="grid gap-4 md:grid-cols-2">
                <label class="grid gap-1 text-xs text-muted-foreground">
                  SKU
                  <input
                    type="text"
                    class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                    [value]="product.vendorSku"
                  />
                </label>
                <label class="grid gap-1 text-xs text-muted-foreground">
                  UPC
                  <input
                    type="text"
                    class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                    [value]="product.gtin"
                  />
                </label>
                <label class="grid gap-1 text-xs text-muted-foreground">
                  ASIN
                  <input
                    type="text"
                    class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                    [value]="product.asin"
                  />
                </label>
                <label class="grid gap-1 text-xs text-muted-foreground">
                  FNSKU
                  <input
                    type="text"
                    class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                    [value]="product.fnsku"
                  />
                </label>
              </div>
            </div>
            <div class="rounded-lg bg-muted/30 p-4">
              <h4 class="text-sm font-semibold mb-4">Global Identifiers</h4>
              <div class="grid gap-4 md:grid-cols-3">
                <label class="grid gap-1 text-xs text-muted-foreground">
                  GTIN
                  <input
                    type="text"
                    class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                    [value]="product.gtin"
                  />
                </label>
                <label class="grid gap-1 text-xs text-muted-foreground">
                  EAN
                  <input
                    type="text"
                    class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                    [value]="product.ean"
                  />
                </label>
                <label class="grid gap-1 text-xs text-muted-foreground">
                  ISBN
                  <input
                    type="text"
                    class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                    [value]="product.isbn"
                  />
                </label>
              </div>
            </div>
            <div class="rounded-lg border border-border bg-card p-4">
              <h4 class="text-sm font-semibold mb-3">Identifier Summary</h4>
              <div class="flex flex-wrap gap-2 text-xs">
                <span class="rounded-full border border-border px-2 py-0.5">SKU: 1</span>
                <span class="rounded-full border border-border px-2 py-0.5">UPC: 1</span>
                <span class="rounded-full border border-border px-2 py-0.5">ASIN: 1</span>
                <span class="rounded-full border border-border px-2 py-0.5">FNSKU: 1</span>
                <span class="rounded-full border border-border px-2 py-0.5">GTIN: 1</span>
              </div>
            </div>
          </div>

          <div *ngIf="activeTab === 'images'" class="py-6 space-y-6">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Product Media</h3>
              <button
                type="button"
                class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                Upload assets
              </button>
            </div>
            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div class="rounded-lg border border-border bg-card p-4">
                <p class="text-xs font-semibold text-muted-foreground">Primary Image</p>
                <img
                  [src]="product.image"
                  [alt]="product.name"
                  class="mt-3 h-48 w-full rounded-md border border-border object-cover"
                />
              </div>
              <div
                *ngFor="let slot of mediaSlots"
                class="rounded-lg border border-dashed border-border bg-muted/30 p-4 flex flex-col items-center justify-center gap-2"
              >
                <div class="h-16 w-16 rounded-md bg-muted"></div>
                <p class="text-xs text-muted-foreground">Drop image {{ slot }}</p>
              </div>
            </div>
            <div class="rounded-lg border border-border bg-card p-4">
              <h4 class="text-sm font-semibold mb-3">Video &amp; 360 Content</h4>
              <div class="grid gap-4 md:grid-cols-2">
                <div class="rounded-lg border border-dashed border-border p-4 text-center">
                  <p class="text-xs text-muted-foreground">Upload product video</p>
                </div>
                <div class="rounded-lg border border-dashed border-border p-4 text-center">
                  <p class="text-xs text-muted-foreground">Add 360 spin set</p>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="activeTab === 'marketplaces'" class="py-6 space-y-6">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Marketplace Listings</h3>
              <button
                type="button"
                class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                Publish updates
              </button>
            </div>
            <ng-container *ngIf="marketplaceSummary(product) as summary">
              <div class="rounded-lg border border-border bg-card p-4">
                <div class="grid gap-3 md:grid-cols-4">
                  <div class="rounded-lg bg-muted/30 p-3 text-center">
                    <p class="text-xs text-muted-foreground">Live</p>
                    <p class="text-lg font-semibold text-emerald-600">{{ summary.live }}</p>
                  </div>
                  <div class="rounded-lg bg-muted/30 p-3 text-center">
                    <p class="text-xs text-muted-foreground">Inactive</p>
                    <p class="text-lg font-semibold">{{ summary.inactive }}</p>
                  </div>
                  <div class="rounded-lg bg-muted/30 p-3 text-center">
                    <p class="text-xs text-muted-foreground">Error</p>
                    <p class="text-lg font-semibold text-rose-500">{{ summary.error }}</p>
                  </div>
                  <div class="rounded-lg bg-muted/30 p-3 text-center">
                    <p class="text-xs text-muted-foreground">Not listed</p>
                    <p class="text-lg font-semibold">{{ summary.notListed }}</p>
                  </div>
                </div>
              </div>
              <div class="rounded-lg border border-border bg-card p-4">
                <div class="overflow-x-auto">
                  <table class="w-full min-w-[760px] text-sm">
                    <thead>
                      <tr class="border-b border-border text-xs text-muted-foreground">
                        <th class="py-2 text-left">Marketplace</th>
                        <th class="py-2 text-left">Status</th>
                        <th class="py-2 text-right">Price</th>
                        <th class="py-2 text-right">Stock</th>
                        <th class="py-2 text-center">Sync Price</th>
                        <th class="py-2 text-center">Sync Inventory</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        *ngFor="let row of summary.all; let i = index"
                        class="border-b border-border/60 text-xs"
                      >
                        <td class="py-2 font-medium capitalize">{{ row.platform }}</td>
                        <td class="py-2">
                          <span
                            class="rounded-full border px-2 py-0.5 text-[10px]"
                            [ngClass]="marketplaceBadgeClass(row.status)"
                          >
                            {{ statusLabel(row.status) }}
                          </span>
                        </td>
                        <td class="py-2 text-right">
                          {{
                            (product.salePrice + i) | currency: 'USD' : 'symbol' : '1.2-2'
                          }}
                        </td>
                        <td class="py-2 text-right">{{ product.stockQty - i * 2 }}</td>
                        <td class="py-2 text-center">
                          <input type="checkbox" [checked]="row.status === 'live'" />
                        </td>
                        <td class="py-2 text-center">
                          <input type="checkbox" [checked]="row.status === 'live'" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </ng-container>
          </div>

          <div *ngIf="activeTab === 'content'" class="py-6 space-y-6">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Listing Content</h3>
              <button
                type="button"
                class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                Validate content
              </button>
            </div>
            <div class="rounded-lg bg-muted/30 p-4 space-y-4">
              <label class="grid gap-1 text-xs text-muted-foreground">
                Product Title
                <input
                  type="text"
                  class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  [value]="product.name"
                />
              </label>
              <label class="grid gap-1 text-xs text-muted-foreground">
                Description
                <textarea
                  rows="4"
                  class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                >High-quality product description placeholder for marketplace listings.</textarea>
              </label>
            </div>
            <div class="rounded-lg border border-border bg-card p-4">
              <h4 class="text-sm font-semibold mb-3">Bullet Points</h4>
              <div class="space-y-2">
                <div
                  *ngFor="let bullet of bulletPoints; let i = index"
                  class="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs"
                >
                  <span class="text-muted-foreground">{{ i + 1 }}.</span>
                  <input
                    type="text"
                    class="flex-1 border-none bg-transparent text-sm text-foreground focus:outline-none"
                    [value]="bullet"
                  />
                </div>
              </div>
            </div>
            <div class="rounded-lg border border-border bg-card p-4">
              <h4 class="text-sm font-semibold mb-3">A+ Content</h4>
              <div class="grid gap-4 md:grid-cols-2">
                <div class="rounded-lg border border-dashed border-border p-4">
                  <p class="text-xs text-muted-foreground">
                    A+ module layout placeholder. Drag modules to arrange.
                  </p>
                </div>
                <div class="rounded-lg border border-dashed border-border p-4">
                  <p class="text-xs text-muted-foreground">
                    Upload brand story content and premium media.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="activeTab === 'options'" class="py-6 space-y-6">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Product Options</h3>
              <button
                type="button"
                class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                Manage variations
              </button>
            </div>
            <div class="rounded-lg bg-muted/30 p-4 space-y-4">
              <div
                *ngFor="let option of optionSets"
                class="rounded-lg border border-border bg-background p-3"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-semibold capitalize">{{ option.name }}</p>
                    <p class="text-xs text-muted-foreground">
                      Display: {{ option.display }} | Image link:
                      {{ option.imageLink ? 'On' : 'Off' }}
                    </p>
                  </div>
                  <button
                    type="button"
                    class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                  >
                    Edit
                  </button>
                </div>
                <div class="mt-3 flex flex-wrap gap-2 text-xs">
                  <span
                    *ngFor="let choice of option.choices"
                    class="rounded-full border border-border px-2 py-0.5"
                  >
                    {{ choice }}
                  </span>
                </div>
              </div>
            </div>
            <div class="rounded-lg border border-border bg-card p-4">
              <h4 class="text-sm font-semibold mb-3">Variation Matrix</h4>
              <div class="overflow-x-auto">
                <table class="w-full min-w-[680px] text-sm">
                  <thead>
                    <tr class="border-b border-border text-xs text-muted-foreground">
                      <th class="py-2 text-left">Variation</th>
                      <th class="py-2 text-left">SKU</th>
                      <th class="py-2 text-right">Stock</th>
                      <th class="py-2 text-right">Price Delta</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      *ngFor="let row of variationRows"
                      class="border-b border-border/60"
                    >
                      <td class="py-2 font-medium">{{ row.name }}</td>
                      <td class="py-2 text-xs text-muted-foreground">{{ row.sku }}</td>
                      <td class="py-2 text-right">{{ row.stock }}</td>
                      <td class="py-2 text-right text-xs text-muted-foreground">
                        {{ row.priceDelta }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div *ngIf="activeTab === 'extra'" class="py-6 space-y-6">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Extra Attributes</h3>
              <button
                type="button"
                class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                Add attribute
              </button>
            </div>
            <div class="rounded-lg border border-border bg-card p-4">
              <div class="overflow-x-auto">
                <table class="w-full min-w-[600px] text-sm">
                  <thead>
                    <tr class="border-b border-border text-xs text-muted-foreground">
                      <th class="py-2 text-left">Attribute</th>
                      <th class="py-2 text-left">Value</th>
                      <th class="py-2 text-left">Type</th>
                      <th class="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      *ngFor="let attribute of extraAttributes"
                      class="border-b border-border/60"
                    >
                      <td class="py-2 font-medium">{{ attribute.name }}</td>
                      <td class="py-2 text-muted-foreground">{{ attribute.value }}</td>
                      <td class="py-2 text-xs text-muted-foreground">{{ attribute.type }}</td>
                      <td class="py-2 text-right">
                        <button
                          type="button"
                          class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div *ngIf="activeTab === 'tags'" class="py-6 space-y-6">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Product Tags</h3>
              <button
                type="button"
                class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                Manage tags
              </button>
            </div>
            <div class="rounded-lg border border-border bg-card p-4">
              <div class="flex flex-wrap gap-2">
                <span class="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-700">
                  Seasonal
                </span>
                <span class="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-700">
                  High margin
                </span>
                <span class="rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-700">
                  Bundle candidate
                </span>
                <span class="rounded-full bg-slate-500/10 px-3 py-1 text-xs text-slate-700">
                  Requires review
                </span>
              </div>
              <div class="mt-4 rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
                Drag tags here to categorize this product across campaigns.
              </div>
            </div>
          </div>

          <div *ngIf="activeTab === 'sales'" class="py-6 space-y-6">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Sales Overview</h3>
              <button
                type="button"
                class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                Adjust date range
              </button>
            </div>
            <div class="grid gap-4 md:grid-cols-3">
              <div class="rounded-lg border border-border bg-card p-4">
                <p class="text-xs text-muted-foreground">Net Revenue</p>
                <p class="text-2xl font-semibold text-emerald-600">$128,440</p>
                <p class="text-xs text-muted-foreground">+12.4% vs last period</p>
              </div>
              <div class="rounded-lg border border-border bg-card p-4">
                <p class="text-xs text-muted-foreground">Units Sold</p>
                <p class="text-2xl font-semibold">3,452</p>
                <p class="text-xs text-muted-foreground">+8.1% vs last period</p>
              </div>
              <div class="rounded-lg border border-border bg-card p-4">
                <p class="text-xs text-muted-foreground">Return Rate</p>
                <p class="text-2xl font-semibold">3.1%</p>
                <p class="text-xs text-muted-foreground">Stable</p>
              </div>
            </div>
            <div class="rounded-lg border border-border bg-card p-4">
              <h4 class="text-sm font-semibold mb-3">Sales by Period</h4>
              <div class="space-y-2 text-xs">
                <div
                  *ngFor="let row of salesRows"
                  class="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2"
                >
                  <span class="font-medium">{{ row.label }}</span>
                  <span class="text-muted-foreground">
                    {{ row.units }} units | {{
                      row.revenue | currency: 'USD' : 'symbol' : '1.2-2'
                    }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="activeTab === 'offers'" class="py-6 space-y-6">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Offers</h3>
              <button
                type="button"
                class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                Create offer
              </button>
            </div>
            <div class="rounded-lg border border-border bg-card p-4">
              <div class="overflow-x-auto">
                <table class="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr class="border-b border-border text-xs text-muted-foreground">
                      <th class="py-2 text-left">Offer</th>
                      <th class="py-2 text-left">Status</th>
                      <th class="py-2 text-left">Discount</th>
                      <th class="py-2 text-right">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      *ngFor="let offer of offerRows"
                      class="border-b border-border/60"
                    >
                      <td class="py-2 font-medium">{{ offer.name }}</td>
                      <td class="py-2">
                        <span class="rounded-full border border-border px-2 py-0.5 text-[10px]">
                          {{ offer.status }}
                        </span>
                      </td>
                      <td class="py-2 text-muted-foreground">{{ offer.discount }}</td>
                      <td class="py-2 text-right text-xs text-muted-foreground">
                        {{ offer.duration }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="rounded-lg border border-border bg-card p-4">
              <h4 class="text-sm font-semibold mb-3">Offer Insights</h4>
              <div class="grid gap-3 md:grid-cols-3">
                <div class="rounded-lg bg-muted/30 p-3 text-center">
                  <p class="text-xs text-muted-foreground">Active offers</p>
                  <p class="text-lg font-semibold">3</p>
                </div>
                <div class="rounded-lg bg-muted/30 p-3 text-center">
                  <p class="text-xs text-muted-foreground">Avg discount</p>
                  <p class="text-lg font-semibold">18%</p>
                </div>
                <div class="rounded-lg bg-muted/30 p-3 text-center">
                  <p class="text-xs text-muted-foreground">Revenue lift</p>
                  <p class="text-lg font-semibold text-emerald-600">+22%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductEditPageComponent {
  private readonly route = inject(ActivatedRoute);

  readonly product$ = this.route.paramMap.pipe(
    map((params) => params.get('productId')),
    map((productId) => mockProducts.find((product) => product.id === productId) ?? mockProducts[0])
  );

  activeTab: TabId = 'overview';

  readonly topOffers: OfferRow[] = [
    {
      name: 'Holiday price boost',
      status: 'Active',
      discount: '20% off',
      duration: 'Dec 20 - Jan 15',
    },
    {
      name: 'Prime day spotlight',
      status: 'Scheduled',
      discount: '10% off',
      duration: 'Feb 1 - Feb 7',
    },
  ];

  readonly offerRows: OfferRow[] = [
    {
      name: 'Holiday price boost',
      status: 'Active',
      discount: '20% off',
      duration: 'Dec 20 - Jan 15',
    },
    {
      name: 'Weekend flash sale',
      status: 'Active',
      discount: '15% off',
      duration: 'Jan 22 - Jan 24',
    },
    {
      name: 'Bundle add-on',
      status: 'Paused',
      discount: 'Buy 2 save 10%',
      duration: 'Paused',
    },
    {
      name: 'Prime day spotlight',
      status: 'Scheduled',
      discount: '10% off',
      duration: 'Feb 1 - Feb 7',
    },
  ];

  readonly bulletPoints = [
    'Premium build with durable materials.',
    'Compatible with leading marketplace standards.',
    'Includes accessories for quick setup.',
    'Optimized for warehouse fulfillment.',
    'Backed by 12-month warranty.',
  ];

  readonly optionSets: OptionSet[] = [
    {
      name: 'color',
      display: 'Swatch',
      choices: ['Black', 'White', 'Crimson', 'Navy'],
      imageLink: true,
    },
    {
      name: 'size',
      display: 'List',
      choices: ['Small', 'Medium', 'Large', 'XL'],
      imageLink: false,
    },
  ];

  readonly variationRows: VariationRow[] = [
    {
      name: 'Black / Medium',
      sku: 'BLK-M-1120',
      stock: 48,
      priceDelta: '+$0.00',
    },
    {
      name: 'Black / Large',
      sku: 'BLK-L-1121',
      stock: 34,
      priceDelta: '+$2.00',
    },
    {
      name: 'Navy / Medium',
      sku: 'NVY-M-1122',
      stock: 21,
      priceDelta: '+$1.50',
    },
  ];

  readonly extraAttributes: AttributeRow[] = [
    { name: 'Batteries Included', value: 'No', type: 'Boolean' },
    { name: 'Department', value: 'Unisex adult', type: 'Text' },
    { name: 'Material', value: 'Zinc alloy', type: 'Text' },
    { name: 'Item Package Quantity', value: '1', type: 'Number' },
  ];

  readonly inventoryLocations: InventoryLocation[] = [
    { name: 'Warehouse A', onHand: 212, reserved: 42, available: 170 },
    { name: 'Warehouse B', onHand: 96, reserved: 12, available: 84 },
    { name: '3PL Partner', onHand: 44, reserved: 6, available: 38 },
  ];

  readonly salesRows: SalesRow[] = [
    { label: 'Last 7 days', units: 84, revenue: 1840 },
    { label: 'Last 30 days', units: 420, revenue: 9320 },
    { label: 'Last 90 days', units: 1230, revenue: 26890 },
    { label: 'Last 365 days', units: 4032, revenue: 88420 },
  ];

  readonly mediaSlots = [1, 2, 3, 4];

  selectTab(tab: TabId): void {
    this.activeTab = tab;
  }

  marketplaceSummary(product: Product): {
    all: MarketplaceStatus[];
    preview: MarketplaceStatus[];
    live: number;
    inactive: number;
    error: number;
    notListed: number;
  } {
    const statusByPlatform = new Map(
      product.marketplaces.map((marketplace) => [marketplace.platform, marketplace.status])
    );

    const all = marketplacePlatforms.map((platform) => ({
      platform,
      status: statusByPlatform.get(platform) ?? 'not_listed',
    }));

    return {
      all,
      preview: all.slice(0, 6),
      live: all.filter((item) => item.status === 'live').length,
      inactive: all.filter((item) => item.status === 'inactive').length,
      error: all.filter((item) => item.status === 'error').length,
      notListed: all.filter((item) => item.status === 'not_listed').length,
    };
  }

  marketplaceBadgeClass(status: MarketplaceStatus['status']): string {
    switch (status) {
      case 'live':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700';
      case 'inactive':
        return 'bg-muted border-border text-muted-foreground';
      case 'error':
        return 'bg-rose-500/10 border-rose-500/30 text-rose-600';
      case 'not_listed':
      default:
        return 'bg-slate-500/10 border-slate-400/30 text-slate-500';
    }
  }

  marketplaceTextClass(status: MarketplaceStatus['status']): string {
    switch (status) {
      case 'live':
        return 'text-emerald-700';
      case 'inactive':
        return 'text-muted-foreground';
      case 'error':
        return 'text-rose-600';
      case 'not_listed':
      default:
        return 'text-slate-500';
    }
  }

  statusLabel(status: MarketplaceStatus['status']): string {
    if (status === 'not_listed') {
      return 'Not listed';
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  restockBadgeClass(status: Product['restockStatus']): string {
    switch (status) {
      case 'in_stock':
        return 'border-emerald-500/30 text-emerald-700 bg-emerald-500/10';
      case 'low_stock':
        return 'border-amber-500/30 text-amber-700 bg-amber-500/10';
      case 'reorder_now':
        return 'border-rose-500/30 text-rose-600 bg-rose-500/10';
      case 'out_of_stock':
      default:
        return 'border-slate-500/30 text-slate-500 bg-slate-500/10';
    }
  }

  restockLeadDays(product: Product): number {
    return Math.max(0, product.stockDays - 7);
  }

  restockLabel(status: Product['restockStatus']): string {
    switch (status) {
      case 'in_stock':
        return 'In stock';
      case 'low_stock':
        return 'Low stock';
      case 'reorder_now':
        return 'Reorder now';
      case 'out_of_stock':
      default:
        return 'Out of stock';
    }
  }
}
