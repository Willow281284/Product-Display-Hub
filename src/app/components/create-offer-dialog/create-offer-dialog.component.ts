import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { marketplacePlatforms } from '@/data/mockProducts';
import { Offer, OfferScope, offerTypeLabels } from '@/types/offer';
import { Product } from '@/types/product';
import { OfferService } from '@/app/services/offer.service';

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

@Component({
  selector: 'app-create-offer-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      *ngIf="open"
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
            (click)="closeDialog()"
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
                    min="1"
                    class="h-9 w-24 rounded-md border border-border bg-background px-3 text-sm"
                    [(ngModel)]="offerDialogMinQty"
                  />
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

            <div class="space-y-3 rounded-lg border border-border bg-muted/50 p-4">
              <p class="text-sm font-semibold text-foreground">Schedule</p>
              <div class="grid gap-3 sm:grid-cols-2">
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
            (click)="closeDialog()"
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
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateOfferDialogComponent implements OnChanges {
  @Input() open = false;
  @Input() products: Product[] = [];
  @Input() initialProductIds: string[] = [];
  @Input() hideProductSelection = false;
  @Input() allowEmptySelection = false;
  @Output() closed = new EventEmitter<void>();
  @Output() created = new EventEmitter<{ name: string; productCount: number }>();

  readonly offerTypeLabels = offerTypeLabels;
  readonly offerTypes = this.offerService.getOfferTypeOptions();
  readonly marketplaces = marketplacePlatforms;

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

  constructor(private readonly offerService: OfferService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open) {
      this.initializeDialog();
    }
  }

  initializeDialog(): void {
    this.offerDialogHideProductSelection = this.hideProductSelection;
    this.offerDialogProductIds = [...this.initialProductIds];
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

  closeDialog(): void {
    this.closed.emit();
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
    this.created.emit({ name: offerName, productCount });
    this.closeDialog();
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

  private toNumber(value: string, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private toDateInput(value: Date): string {
    return value.toISOString().split('T')[0];
  }
}
