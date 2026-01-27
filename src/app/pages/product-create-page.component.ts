import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { marketplacePlatforms, mockProducts } from '@/data/mockProducts';

type CreateTab =
  | 'overview'
  | 'pricing'
  | 'identifiers'
  | 'images'
  | 'marketplaces'
  | 'content'
  | 'options'
  | 'extra'
  | 'tags';

type ProductType = 'single' | 'kit';

interface KitComponentRow {
  productId: string;
  name: string;
  vendorSku: string;
  quantity: number;
}

interface OptionSet {
  name: string;
  display: string;
  choices: string[];
  linkImages: boolean;
}

interface VariationRow {
  name: string;
  sku: string;
  stock: number;
  price: number;
}

interface ExtraAttributeRow {
  name: string;
  value: string;
  type: string;
}

@Component({
  selector: 'app-product-create-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="min-h-screen bg-background flex flex-col">
      <header class="border-b border-border bg-background px-6 py-4">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-5 w-5"
              >
                <path
                  d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
                ></path>
                <path d="M12 22V12"></path>
                <path d="m3.3 7 8.7 5 8.7-5"></path>
                <path d="m7.5 4.27 9 5.15"></path>
              </svg>
            </div>
            <div>
              <h1 class="text-2xl font-semibold">Create product</h1>
              <p class="text-sm text-muted-foreground">
                Build a new listing with pricing, inventory, and marketplace details.
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
              Save draft
            </button>
            <button
              type="button"
              class="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Create &amp; publish
            </button>
          </div>
        </div>
      </header>

      <div class="px-6">
        <div class="mt-4 flex flex-wrap gap-2 border-b border-border pb-4">
          <button
            type="button"
            class="rounded-full border border-border px-3 py-1 text-xs font-medium"
            [class.bg-muted]="activeTab === 'overview'"
            (click)="selectTab('overview')"
          >
            Overview
          </button>
          <button
            type="button"
            class="rounded-full border border-border px-3 py-1 text-xs font-medium"
            [class.bg-muted]="activeTab === 'pricing'"
            (click)="selectTab('pricing')"
          >
            Pricing &amp; Inventory
          </button>
          <button
            type="button"
            class="rounded-full border border-border px-3 py-1 text-xs font-medium"
            [class.bg-muted]="activeTab === 'identifiers'"
            (click)="selectTab('identifiers')"
          >
            Identifiers
          </button>
          <button
            type="button"
            class="rounded-full border border-border px-3 py-1 text-xs font-medium"
            [class.bg-muted]="activeTab === 'images'"
            (click)="selectTab('images')"
          >
            Images
          </button>
          <button
            type="button"
            class="rounded-full border border-border px-3 py-1 text-xs font-medium"
            [class.bg-muted]="activeTab === 'marketplaces'"
            (click)="selectTab('marketplaces')"
          >
            Marketplaces
          </button>
          <button
            type="button"
            class="rounded-full border border-border px-3 py-1 text-xs font-medium"
            [class.bg-muted]="activeTab === 'content'"
            (click)="selectTab('content')"
          >
            Content
          </button>
          <button
            type="button"
            class="rounded-full border border-border px-3 py-1 text-xs font-medium"
            [class.bg-muted]="activeTab === 'options'"
            (click)="selectTab('options')"
          >
            Product options
          </button>
          <button
            type="button"
            class="rounded-full border border-border px-3 py-1 text-xs font-medium"
            [class.bg-muted]="activeTab === 'extra'"
            (click)="selectTab('extra')"
          >
            Extra attributes
          </button>
          <button
            type="button"
            class="rounded-full border border-border px-3 py-1 text-xs font-medium"
            [class.bg-muted]="activeTab === 'tags'"
            (click)="selectTab('tags')"
          >
            Tags
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto px-6 pb-10">
        <div *ngIf="activeTab === 'overview'" class="py-6 space-y-6">
          <div class="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div class="space-y-6">
              <div class="rounded-xl border border-border bg-card p-5">
                <div class="flex items-center justify-between">
                  <h2 class="text-lg font-semibold">Basic information</h2>
                  <span class="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    Draft
                  </span>
                </div>
                <div class="mt-4 grid gap-4 sm:grid-cols-2">
                  <label class="grid gap-1 text-xs text-muted-foreground">
                    Product name
                    <input
                      type="text"
                      class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                      placeholder="Enter product name"
                    />
                  </label>
                  <label class="grid gap-1 text-xs text-muted-foreground">
                    Brand
                    <select class="rounded-md border border-border bg-background px-3 py-2 text-sm">
                      <option value="">Select brand</option>
                      <option *ngFor="let brand of brandOptions" [value]="brand">
                        {{ brand }}
                      </option>
                    </select>
                  </label>
                  <label class="grid gap-1 text-xs text-muted-foreground">
                    Vendor
                    <select class="rounded-md border border-border bg-background px-3 py-2 text-sm">
                      <option value="">Select vendor</option>
                      <option *ngFor="let vendor of vendorOptions" [value]="vendor">
                        {{ vendor }}
                      </option>
                    </select>
                  </label>
                  <label class="grid gap-1 text-xs text-muted-foreground">
                    SKU
                    <input
                      type="text"
                      class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                      placeholder="SKU"
                    />
                  </label>
                  <label class="grid gap-1 text-xs text-muted-foreground">
                    Manufacturer Part #
                    <input
                      type="text"
                      class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                      placeholder="MPN"
                    />
                  </label>
                  <label class="grid gap-1 text-xs text-muted-foreground">
                    Product type
                    <div class="flex flex-wrap gap-2">
                      <button
                        type="button"
                        class="rounded-full border border-border px-3 py-1 text-xs font-medium"
                        [class.bg-muted]="productType === 'single'"
                        (click)="setProductType('single')"
                      >
                        Single
                      </button>
                      <button
                        type="button"
                        class="rounded-full border border-border px-3 py-1 text-xs font-medium"
                        [class.bg-muted]="productType === 'kit'"
                        (click)="setProductType('kit')"
                      >
                        Kit / Bundle
                      </button>
                    </div>
                  </label>
                </div>
              </div>

              <div
                *ngIf="productType === 'kit'"
                class="rounded-xl border border-border bg-card p-5"
              >
                <div class="flex items-center justify-between">
                  <h2 class="text-lg font-semibold">Kit components</h2>
                  <button
                    type="button"
                    class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                    (click)="addKitComponent()"
                  >
                    Add component
                  </button>
                </div>
                <div class="mt-4 grid gap-3 text-sm">
                  <div
                    *ngFor="let component of kitComponents; let index = index"
                    class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2"
                  >
                    <div>
                      <p class="font-medium">{{ component.name }}</p>
                      <p class="text-xs text-muted-foreground">SKU: {{ component.vendorSku }}</p>
                    </div>
                    <div class="flex items-center gap-2 text-xs">
                      <span class="rounded-full bg-muted px-2 py-0.5">
                        Qty {{ component.quantity }}
                      </span>
                      <button
                        type="button"
                        class="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
                        (click)="removeKitComponent(index)"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <p *ngIf="kitComponents.length === 0" class="text-xs text-muted-foreground">
                    Add at least one component to build a kit.
                  </p>
                </div>
              </div>
            </div>

            <div class="space-y-6">
              <div class="rounded-xl border border-border bg-card p-5">
                <h3 class="text-sm font-semibold text-muted-foreground">Snapshot</h3>
                <div class="mt-4 space-y-3 text-sm">
                  <div class="flex items-center justify-between">
                    <span>Estimated sale price</span>
                    <span class="font-semibold">$129.99</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span>Projected margin</span>
                    <span class="font-semibold text-emerald-600">38%</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span>Target stock</span>
                    <span class="font-semibold">450 units</span>
                  </div>
                </div>
              </div>

              <div class="rounded-xl border border-border bg-card p-5">
                <h3 class="text-sm font-semibold text-muted-foreground">
                  Required steps
                </h3>
                <div class="mt-4 space-y-2 text-xs text-muted-foreground">
                  <div class="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
                    <span>Define identifiers</span>
                    <span class="text-amber-600">Pending</span>
                  </div>
                  <div class="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
                    <span>Add content assets</span>
                    <span class="text-amber-600">Pending</span>
                  </div>
                  <div class="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
                    <span>Select marketplaces</span>
                    <span class="text-emerald-600">Ready</span>
                  </div>
                </div>
              </div>

              <div class="rounded-xl border border-border bg-card p-5">
                <h3 class="text-sm font-semibold text-muted-foreground">
                  Recommended tags
                </h3>
                <div class="mt-4 flex flex-wrap gap-2 text-xs">
                  <span class="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-700">
                    New launch
                  </span>
                  <span class="rounded-full bg-blue-500/10 px-3 py-1 text-blue-700">
                    High margin
                  </span>
                  <span class="rounded-full bg-amber-500/10 px-3 py-1 text-amber-700">
                    Seasonal
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="activeTab === 'pricing'" class="py-6 space-y-6">
          <div class="grid gap-6 lg:grid-cols-2">
            <div class="rounded-xl border border-border bg-card p-5 space-y-4">
              <h2 class="text-lg font-semibold">Pricing</h2>
              <label class="grid gap-1 text-xs text-muted-foreground">
                Sale price
                <input
                  type="number"
                  class="rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value="129.99"
                />
              </label>
              <div class="grid gap-4 sm:grid-cols-2">
                <label class="grid gap-1 text-xs text-muted-foreground">
                  MSRP
                  <input
                    type="number"
                    class="rounded-md border border-border bg-background px-3 py-2 text-sm"
                    value="149.99"
                  />
                </label>
                <label class="grid gap-1 text-xs text-muted-foreground">
                  Discount %
                  <input
                    type="number"
                    class="rounded-md border border-border bg-background px-3 py-2 text-sm"
                    value="12"
                  />
                </label>
              </div>
              <div class="grid gap-4 sm:grid-cols-2">
                <label class="grid gap-1 text-xs text-muted-foreground">
                  Landed cost
                  <input
                    type="number"
                    class="rounded-md border border-border bg-background px-3 py-2 text-sm"
                    value="64.5"
                  />
                </label>
                <label class="grid gap-1 text-xs text-muted-foreground">
                  Shipping cost
                  <input
                    type="number"
                    class="rounded-md border border-border bg-background px-3 py-2 text-sm"
                    value="4.25"
                  />
                </label>
              </div>
              <div class="rounded-lg border border-border bg-background p-3 text-sm">
                <div class="flex items-center justify-between">
                  <span class="text-xs text-muted-foreground">Projected margin</span>
                  <span class="font-semibold text-emerald-600">38%</span>
                </div>
                <p class="mt-2 text-xs text-muted-foreground">
                  Estimated gross profit: $60.90
                </p>
              </div>
            </div>

            <div class="rounded-xl border border-border bg-card p-5 space-y-4">
              <h2 class="text-lg font-semibold">Inventory</h2>
              <div class="grid gap-4 sm:grid-cols-2">
                <label class="grid gap-1 text-xs text-muted-foreground">
                  Starting stock
                  <input
                    type="number"
                    class="rounded-md border border-border bg-background px-3 py-2 text-sm"
                    value="320"
                  />
                </label>
                <label class="grid gap-1 text-xs text-muted-foreground">
                  Purchase quantity
                  <input
                    type="number"
                    class="rounded-md border border-border bg-background px-3 py-2 text-sm"
                    value="520"
                  />
                </label>
                <label class="grid gap-1 text-xs text-muted-foreground">
                  Safety stock
                  <input
                    type="number"
                    class="rounded-md border border-border bg-background px-3 py-2 text-sm"
                    value="120"
                  />
                </label>
                <label class="grid gap-1 text-xs text-muted-foreground">
                  Restock trigger
                  <input
                    type="number"
                    class="rounded-md border border-border bg-background px-3 py-2 text-sm"
                    value="75"
                  />
                </label>
              </div>
              <div class="rounded-lg border border-border bg-background p-3 text-sm">
                <p class="text-xs text-muted-foreground">Forecast</p>
                <p class="mt-1 font-semibold">45 days of stock projected</p>
                <p class="text-xs text-muted-foreground">
                  Recommended reorder: 240 units
                </p>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="activeTab === 'identifiers'" class="py-6 space-y-6">
          <div class="rounded-xl border border-border bg-card p-5 space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold">Product identifiers</h2>
              <span class="text-xs text-muted-foreground">
                Add the marketplace IDs to create listings
              </span>
            </div>
            <div class="grid gap-4 md:grid-cols-2">
              <label class="grid gap-1 text-xs text-muted-foreground">
                SKU
                <input
                  type="text"
                  class="rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="SKU"
                />
              </label>
              <label class="grid gap-1 text-xs text-muted-foreground">
                UPC
                <input
                  type="text"
                  class="rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="UPC"
                />
              </label>
              <label class="grid gap-1 text-xs text-muted-foreground">
                ASIN
                <input
                  type="text"
                  class="rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="ASIN"
                />
              </label>
              <label class="grid gap-1 text-xs text-muted-foreground">
                FNSKU
                <input
                  type="text"
                  class="rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="FNSKU"
                />
              </label>
            </div>
          </div>
          <div class="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 class="text-sm font-semibold text-muted-foreground">Global IDs</h3>
            <div class="grid gap-4 md:grid-cols-3">
              <label class="grid gap-1 text-xs text-muted-foreground">
                GTIN
                <input
                  type="text"
                  class="rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="GTIN"
                />
              </label>
              <label class="grid gap-1 text-xs text-muted-foreground">
                EAN
                <input
                  type="text"
                  class="rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="EAN"
                />
              </label>
              <label class="grid gap-1 text-xs text-muted-foreground">
                ISBN
                <input
                  type="text"
                  class="rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="ISBN"
                />
              </label>
            </div>
          </div>
        </div>

        <div *ngIf="activeTab === 'images'" class="py-6 space-y-6">
          <div class="rounded-xl border border-border bg-card p-5">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold">Product media</h2>
              <button
                type="button"
                class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                Upload assets
              </button>
            </div>
            <div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div class="rounded-lg border border-border bg-background p-4">
                <p class="text-xs text-muted-foreground">Primary image</p>
                <div class="mt-3 h-44 rounded-md border border-dashed border-border bg-muted/30"></div>
              </div>
              <div
                *ngFor="let slot of mediaSlots"
                class="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center text-xs text-muted-foreground"
              >
                Drop image {{ slot }}
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="activeTab === 'marketplaces'" class="py-6 space-y-6">
          <div class="rounded-xl border border-border bg-card p-5">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold">Marketplaces</h2>
              <span class="text-xs text-muted-foreground">
                {{ selectedMarketplaces.length }} selected
              </span>
            </div>
            <div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <button
                *ngFor="let platform of marketplaces"
                type="button"
                class="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-sm"
                [class.border-primary]="isMarketplaceSelected(platform)"
                (click)="toggleMarketplace(platform)"
              >
                <span class="font-medium capitalize">{{ marketplaceLabel(platform) }}</span>
                <input type="checkbox" [checked]="isMarketplaceSelected(platform)" />
              </button>
            </div>
          </div>
        </div>

        <div *ngIf="activeTab === 'content'" class="py-6 space-y-6">
          <div class="rounded-xl border border-border bg-card p-5 space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold">Listing content</h2>
              <button
                type="button"
                class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                Validate
              </button>
            </div>
            <label class="grid gap-1 text-xs text-muted-foreground">
              Product title
              <input
                type="text"
                class="rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="Listing title"
              />
            </label>
            <label class="grid gap-1 text-xs text-muted-foreground">
              Description
              <textarea
                rows="4"
                class="rounded-md border border-border bg-background px-3 py-2 text-sm"
              >High-quality product description placeholder for marketplace listings.</textarea>
            </label>
          </div>
          <div class="rounded-xl border border-border bg-card p-5">
            <h3 class="text-sm font-semibold text-muted-foreground">Bullet points</h3>
            <div class="mt-4 space-y-2">
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
        </div>

        <div *ngIf="activeTab === 'options'" class="py-6 space-y-6">
          <div class="rounded-xl border border-border bg-card p-5 space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold">Product options</h2>
              <button
                type="button"
                class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                Manage options
              </button>
            </div>
            <div class="grid gap-3 md:grid-cols-2">
              <div
                *ngFor="let option of optionSets"
                class="rounded-lg border border-border bg-background p-3"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-semibold capitalize">{{ option.name }}</p>
                    <p class="text-xs text-muted-foreground">
                      Display: {{ option.display }} | Image link:
                      {{ option.linkImages ? 'On' : 'Off' }}
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
          </div>
          <div class="rounded-xl border border-border bg-card p-5">
            <h3 class="text-sm font-semibold text-muted-foreground">Variation matrix</h3>
            <div class="mt-4 overflow-x-auto">
              <table class="w-full min-w-[540px] text-sm">
                <thead>
                  <tr class="border-b border-border text-xs text-muted-foreground">
                    <th class="py-2 text-left">Variation</th>
                    <th class="py-2 text-left">SKU</th>
                    <th class="py-2 text-right">Stock</th>
                    <th class="py-2 text-right">Price</th>
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
                    <td class="py-2 text-right">
                      {{ row.price | currency: 'USD' : 'symbol' : '1.2-2' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div *ngIf="activeTab === 'extra'" class="py-6 space-y-6">
          <div class="rounded-xl border border-border bg-card p-5">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold">Extra attributes</h2>
              <button
                type="button"
                class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                Add attribute
              </button>
            </div>
            <div class="mt-4 overflow-x-auto">
              <table class="w-full min-w-[480px] text-sm">
                <thead>
                  <tr class="border-b border-border text-xs text-muted-foreground">
                    <th class="py-2 text-left">Attribute</th>
                    <th class="py-2 text-left">Value</th>
                    <th class="py-2 text-left">Type</th>
                    <th class="py-2 text-right">Action</th>
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
          <div class="rounded-xl border border-border bg-card p-5">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold">Tags &amp; labels</h2>
              <button
                type="button"
                class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                Manage tags
              </button>
            </div>
            <div class="mt-4 flex flex-wrap gap-2 text-xs">
              <button
                *ngFor="let tag of tagOptions"
                type="button"
                class="rounded-full border border-border px-3 py-1"
                [class.bg-muted]="selectedTags.includes(tag)"
                (click)="toggleTag(tag)"
              >
                {{ tag }}
              </button>
            </div>
            <div class="mt-4 rounded-lg border border-dashed border-border bg-background p-4 text-xs text-muted-foreground">
              Use tags to organize bundles, launches, and seasonal promotions.
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCreatePageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  activeTab: CreateTab = 'overview';
  productType: ProductType = 'single';

  readonly brandOptions = [
    'HyperX',
    'Logitech',
    'Razer',
    'Corsair',
    'SteelSeries',
    'Sony',
    'Microsoft',
    'Samsung',
    'Apple',
    'Dell',
  ];

  readonly vendorOptions = [
    'GameStop Distribution',
    'Tech Direct',
    'Global Supplies',
    'Prime Wholesale',
    'Direct Import Co',
  ];

  readonly marketplaces = marketplacePlatforms;
  readonly mediaSlots = [1, 2, 3, 4];

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
      linkImages: true,
    },
    {
      name: 'size',
      display: 'List',
      choices: ['Small', 'Medium', 'Large', 'XL'],
      linkImages: false,
    },
  ];

  readonly variationRows: VariationRow[] = [
    { name: 'Black / Medium', sku: 'BLK-M-1120', stock: 48, price: 129.99 },
    { name: 'Black / Large', sku: 'BLK-L-1121', stock: 34, price: 131.99 },
    { name: 'Navy / Medium', sku: 'NVY-M-1122', stock: 21, price: 131.49 },
  ];

  readonly extraAttributes: ExtraAttributeRow[] = [
    { name: 'Batteries Included', value: 'No', type: 'Boolean' },
    { name: 'Department', value: 'Unisex adult', type: 'Text' },
    { name: 'Material', value: 'Zinc alloy', type: 'Text' },
    { name: 'Item Package Quantity', value: '1', type: 'Number' },
  ];

  readonly tagOptions = [
    'New launch',
    'Seasonal',
    'Bundle candidate',
    'Needs review',
    'High margin',
    'Core catalog',
  ];

  selectedTags = ['New launch', 'High margin'];

  selectedMarketplaces = ['amazon', 'walmart', 'ebay', 'target'];

  kitComponents: KitComponentRow[] = mockProducts.slice(0, 2).map((product) => ({
    productId: product.id,
    name: product.name,
    vendorSku: product.vendorSku,
    quantity: 1,
  }));

  ngOnInit(): void {
    const mode = this.route.snapshot.queryParamMap.get('type');
    if (mode === 'kit') {
      this.productType = 'kit';
    }
  }

  selectTab(tab: CreateTab): void {
    this.activeTab = tab;
  }

  setProductType(type: ProductType): void {
    this.productType = type;
  }

  addKitComponent(): void {
    const candidate = mockProducts.find(
      (product) => !this.kitComponents.some((item) => item.productId === product.id)
    );
    if (!candidate) {
      return;
    }
    this.kitComponents = [
      ...this.kitComponents,
      {
        productId: candidate.id,
        name: candidate.name,
        vendorSku: candidate.vendorSku,
        quantity: 1,
      },
    ];
  }

  removeKitComponent(index: number): void {
    this.kitComponents = this.kitComponents.filter((_, rowIndex) => rowIndex !== index);
  }

  toggleMarketplace(platform: string): void {
    if (this.selectedMarketplaces.includes(platform)) {
      this.selectedMarketplaces = this.selectedMarketplaces.filter(
        (item) => item !== platform
      );
      return;
    }
    this.selectedMarketplaces = [...this.selectedMarketplaces, platform];
  }

  isMarketplaceSelected(platform: string): boolean {
    return this.selectedMarketplaces.includes(platform);
  }

  marketplaceLabel(platform: string): string {
    return platform.charAt(0).toUpperCase() + platform.slice(1);
  }

  toggleTag(tag: string): void {
    if (this.selectedTags.includes(tag)) {
      this.selectedTags = this.selectedTags.filter((item) => item !== tag);
      return;
    }
    this.selectedTags = [...this.selectedTags, tag];
  }
}
