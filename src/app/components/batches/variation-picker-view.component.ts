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
          <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">⧉</div>
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
          <span *ngIf="statusCounts.success > 0" class="rounded-full border border-green-500 px-2 py-0.5 text-xs text-green-600">
            {{ statusCounts.success }} Live
          </span>
          <span *ngIf="statusCounts.failed > 0" class="rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
            {{ statusCounts.failed }} Error
          </span>
          <span *ngIf="statusCounts.pending > 0" class="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {{ statusCounts.pending }} Pending
          </span>
          <span *ngIf="statusCounts.processing > 0" class="rounded-full border border-blue-500 px-2 py-0.5 text-xs text-blue-600">
            {{ statusCounts.processing }} Processing
          </span>
        </div>
      </div>

      <div class="flex-1 overflow-auto p-6">
        <div *ngIf="isLoading" class="flex items-center justify-center py-16">
          <div class="text-sm text-muted-foreground">Loading variations...</div>
        </div>
        <div *ngIf="!isLoading" class="mx-auto grid max-w-4xl gap-3">
          <button
            *ngFor="let variation of allVariations"
            type="button"
            class="group flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all hover:bg-muted/50"
            [ngClass]="variationCardClass(variation)"
            (click)="selectedId = variation.id"
            (dblclick)="selectVariation(variation)"
          >
            <div class="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
              <img *ngIf="variation.image" [src]="variation.image" [alt]="variation.name" class="h-full w-full object-cover" />
              <div *ngIf="!variation.image" class="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                Img
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <h3 class="truncate text-sm font-semibold">{{ variation.name }}</h3>
                <span class="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{{ variation.status }}</span>
              </div>
              <div class="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>{{ variation.sku || 'No SKU' }}</span>
                <span *ngIf="variation.salePrice != null">$ {{ variation.salePrice.toFixed(2) }}</span>
                <span *ngIf="variation.stockQty != null">{{ variation.stockQty }} in stock</span>
              </div>
            </div>
            <div class="shrink-0">
              <button
                type="button"
                class="rounded-md border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                (click)="$event.stopPropagation(); selectVariation(variation)"
              >
                {{ variation.id === currentItem.id ? 'Edit Current' : 'Open' }}
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
      return 'ring-2 ring-primary border-primary bg-primary/5';
    }
    if (variation.status === 'failed') return 'border-destructive/50 bg-destructive/5';
    if (variation.status === 'success') return 'border-green-500/30 bg-green-500/5';
    if (variation.status === 'pending') return 'border-muted';
    return 'border-border/40';
  }

  selectVariation(variation: ChildVariation): void {
    if (variation.id === this.currentItem.id) {
      this.editCurrent.emit();
      return;
    }
    this.selectVariationId.emit(variation.id);
  }
}
