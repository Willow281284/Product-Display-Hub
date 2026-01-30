import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ChildVariation } from './variations-section.component';
import { BatchItem } from '@/types/batch';

@Component({
  selector: 'app-variation-picker-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex h-full flex-col">
      <div class="border-b bg-muted/30 px-6 py-5">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">VAR</div>
          <div class="flex-1">
            <h2 class="flex items-center gap-2 text-lg font-semibold">
              Product Variations
              <span *ngIf="masterProductId" class="rounded-md border border-border px-2 py-0.5 text-xs font-mono">
                Master: {{ masterProductId }}
              </span>
            </h2>
            <p class="mt-0.5 text-sm text-muted-foreground">
              This product has {{ allVariations.length }} variation{{ allVariations.length !== 1 ? 's' : '' }}. Select one to view.
            </p>
          </div>
          <div class="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">
            {{ currentItem.marketplace }}
          </div>
        </div>

        <div class="mt-4 flex flex-wrap items-center gap-2">
          <span *ngIf="statusCounts['success'] > 0" class="rounded-full border border-green-500 px-2 py-0.5 text-xs text-green-600">
            {{ statusCounts['success'] }} Live
          </span>
          <span *ngIf="statusCounts['failed'] > 0" class="rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
            {{ statusCounts['failed'] }} Error
          </span>
          <span *ngIf="statusCounts['pending'] > 0" class="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {{ statusCounts['pending'] }} Pending
          </span>
          <span *ngIf="statusCounts['processing'] > 0" class="rounded-full border border-blue-500 px-2 py-0.5 text-xs text-blue-600">
            {{ statusCounts['processing'] }} Processing
          </span>
        </div>
      </div>

      <div class="flex-1 overflow-auto p-6">
        <div *ngIf="isLoading" class="flex items-center justify-center py-16">
          <div class="text-sm text-muted-foreground">Loading variations...</div>
        </div>
        <div *ngIf="!isLoading" class="mx-auto grid max-w-5xl gap-3">
          <button
            *ngFor="let variation of allVariations"
            type="button"
            class="group flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left shadow-sm transition-all"
            [ngClass]="variationCardClass(variation)"
            (click)="selectedId = variation.id"
            (dblclick)="selectVariation(variation)"
          >
            <div class="flex min-w-0 items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
                <img *ngIf="variation.image" [src]="variation.image" [alt]="variation.name" class="h-full w-full rounded-xl object-cover" />
                <svg *ngIf="!variation.image" viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <path d="m21 15-5-5L5 21"></path>
                </svg>
              </div>
              <div class="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
                <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <h3 class="truncate text-sm font-semibold text-foreground">{{ variation.name }}</h3>
                  <span
                    *ngIf="variation.id === currentItem.id"
                    class="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground"
                  >
                    Current
                  </span>
                </div>
                <p class="text-xs text-muted-foreground">{{ variation.sku || 'No SKU' }}</p>
                <div class="mt-1 flex flex-wrap items-center gap-3 text-xs">
                  <span class="inline-flex items-center gap-1" [ngClass]="attributeValue(variation, 'color') ? 'text-muted-foreground' : 'text-red-400'">
                    <span class="h-1.5 w-1.5 rounded-full" [ngClass]="attributeValue(variation, 'color') ? 'bg-emerald-400' : 'bg-red-400'"></span>
                    {{ attributeValue(variation, 'color') || 'Not set' }}
                  </span>
                  <span class="inline-flex items-center gap-1" [ngClass]="attributeValue(variation, 'size') ? 'text-muted-foreground' : 'text-red-400'">
                    <span class="h-1.5 w-1.5 rounded-full" [ngClass]="attributeValue(variation, 'size') ? 'bg-emerald-400' : 'bg-red-400'"></span>
                    {{ attributeValue(variation, 'size') || 'Not set' }}
                  </span>
                  <span class="inline-flex items-center gap-1" [ngClass]="attributeValue(variation, 'material') ? 'text-muted-foreground' : 'text-red-400'">
                    <span class="h-1.5 w-1.5 rounded-full" [ngClass]="attributeValue(variation, 'material') ? 'bg-emerald-400' : 'bg-red-400'"></span>
                    {{ attributeValue(variation, 'material') || 'Not set' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="flex shrink-0 items-center gap-4">
              <span class="rounded-full px-2 py-1 text-xs font-semibold" [ngClass]="marketplacePillClass(variation.marketplace)">
                {{ marketplaceLabel(variation.marketplace) }}
              </span>
              <span class="rounded-full border px-2 py-1 text-xs font-semibold" [ngClass]="statusPillClass(variation.status)">
                {{ statusPillLabel(variation.status) }}
              </span>
              <div class="flex items-center gap-3 text-sm text-muted-foreground">
                <div class="flex items-center gap-1">
                  <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 1v22" />
                    <path d="M17 5H9.5a3.5 3.5 0 1 0 0 7H14a3.5 3.5 0 1 1 0 7H6" />
                  </svg>
                  <span>{{ variation.salePrice != null ? variation.salePrice.toFixed(2) : '0.00' }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 6h16" />
                    <path d="M4 12h16" />
                    <path d="M4 18h16" />
                  </svg>
                  <span>{{ variation.stockQty ?? 0 }}</span>
                </div>
              </div>
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                (click)="$event.stopPropagation(); selectVariation(variation)"
              >
                Edit
                <svg viewBox="0 0 24 24" class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </button>
        </div>
      </div>

      <div class="border-t px-6 py-4">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          (click)="editCurrent.emit()"
        >
          Back to editor
        </button>
      </div>
    </div>
  `,
})
export class VariationPickerViewComponent {
  @Input() currentItem!: BatchItem;
  @Input() variations: ChildVariation[] = [];
  @Input() masterProductId: string | null = null;
  @Input() isLoading = false;
  @Output() selectVariationId = new EventEmitter<string>();
  @Output() editCurrent = new EventEmitter<void>();

  selectedId: string | null = null;

  get allVariations(): ChildVariation[] {
    const current: ChildVariation = {
      id: this.currentItem.id,
      name: this.currentItem.product_name,
      sku: this.currentItem.product_sku || '',
      productId: this.currentItem.product_id,
      variationId: this.currentItem.product_id,
      image: this.currentItem.product_image,
      marketplace: this.currentItem.marketplace,
      attributes: {},
      status: this.currentItem.status as ChildVariation['status'],
      salePrice: this.currentItem.sale_price,
      stockQty: this.currentItem.stock_qty,
    };
    return [current, ...this.variations];
  }

  get statusCounts(): Record<string, number> {
    return this.allVariations.reduce(
      (acc, variation) => {
        acc[variation.status] = (acc[variation.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  variationCardClass(variation: ChildVariation): string {
    if (this.selectedId === variation.id) {
      return 'border-emerald-400 bg-emerald-500/5 ring-2 ring-emerald-400/40';
    }
    return 'border-emerald-500/40 bg-background/60 hover:bg-muted/40';
  }

  selectVariation(variation: ChildVariation): void {
    if (variation.id === this.currentItem.id) {
      this.editCurrent.emit();
      return;
    }
    this.selectVariationId.emit(variation.id);
  }

  attributeValue(variation: ChildVariation, key: 'color' | 'size' | 'material'): string {
    return variation.attributes?.[key] || '';
  }

  marketplaceLabel(marketplace: string): string {
    const map: Record<string, string> = {
      amazon: 'amazon',
      walmart: 'WMT',
      ebay: 'EBY',
      etsy: 'Etsy',
      newegg: 'NE',
      target: 'TGT',
      shopify: 'Shop',
      costco: 'COST',
    };
    return map[marketplace] || marketplace;
  }

  marketplacePillClass(marketplace: string): string {
    switch (marketplace) {
      case 'amazon':
        return 'bg-amber-500/20 text-amber-300';
      case 'walmart':
        return 'bg-sky-500/20 text-sky-300';
      case 'ebay':
        return 'bg-blue-500/20 text-blue-300';
      case 'etsy':
        return 'bg-orange-500/20 text-orange-300';
      case 'newegg':
        return 'bg-indigo-500/20 text-indigo-300';
      case 'target':
        return 'bg-rose-500/20 text-rose-300';
      case 'shopify':
        return 'bg-emerald-500/20 text-emerald-300';
      case 'costco':
        return 'bg-red-500/20 text-red-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  }

  statusPillLabel(status: ChildVariation['status']): string {
    switch (status) {
      case 'success':
        return 'Live';
      case 'failed':
        return 'Failed';
      case 'processing':
        return 'Processing';
      case 'pending':
        return 'Pending';
      default:
        return status;
    }
  }

  statusPillClass(status: ChildVariation['status']): string {
    switch (status) {
      case 'success':
        return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400';
      case 'failed':
        return 'border-destructive/40 bg-destructive/10 text-destructive';
      case 'processing':
        return 'border-blue-500/40 bg-blue-500/10 text-blue-300';
      case 'pending':
        return 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300';
      default:
        return 'border-muted text-muted-foreground';
    }
  }
}
