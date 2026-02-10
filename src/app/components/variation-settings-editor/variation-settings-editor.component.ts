import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TooltipDirective } from '../../directives/tooltip.directive';

type ExtraAttribute = { name: string; value: string; type?: 'text' | 'number' };
type DimensionKey = 'height' | 'width' | 'length';
type DimensionWithWeightKey = DimensionKey | 'weight';
type IdentifierIcon = 'hash' | 'barcode' | 'package' | 'truck' | 'globe';

export interface VariationSettingsRow {
  id: string;
  name: string;
  sku: string;
  upc?: string;
  asin?: string;
  fnsku?: string;
  barcode?: string;
  harmcode?: string;
  vendorSku?: string;
  multiSkus?: string[];
  multiAsins?: string[];
  multiFnskus?: string[];
  multiUpcs?: string[];
  multiGtins?: string[];
  weight?: number;
  height?: number;
  width?: number;
  length?: number;
  weightPerQty?: { qty: number; weight: number }[];
  dimensionsPerQty?: { qty: number; height: number; width: number; length: number }[];
  invQtyAdjustment?: number;
  purchaseQty?: number;
  soldQty?: number;
  returnReceiveQty?: number;
  availableStock?: number;
  quantityAllocated?: number;
  reserveQty?: number;
  damageQty?: number;
  onHandQty?: number;
  virtualStock?: number;
  purchasePrice?: number;
  inboundFreight?: number;
  extraDuty?: number;
  landedCost?: number;
  fvf?: number;
  tac?: number;
  salePrice?: number;
  msrp?: number;
  competitorPrice?: number;
  profitMargin?: number;
  minBuyBox?: number;
  maxBuyBox?: number;
  extraAttributes?: ExtraAttribute[];
  images?: string[];
}

type MultiKey = 'multiSkus' | 'multiUpcs' | 'multiAsins' | 'multiFnskus' | 'multiGtins';

@Component({
  selector: 'app-variation-settings-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, TooltipDirective],
  template: `
    <div class="flex flex-col overflow-hidden overflow-x-hidden rounded-lg border border-border bg-background" style="max-height: calc(95vh - 280px);">
      <div class="flex items-center justify-between bg-gradient-to-r from-teal-600 to-teal-500 px-5 py-3 text-white">
        <h3 class="text-sm font-semibold uppercase tracking-wide">Customize Settings Per Variation</h3>
        <span class="rounded-full bg-white/20 px-3 py-1 text-sm">{{ variations.length }} Variations</span>
      </div>

      <div class="flex-1 overflow-y-auto overflow-x-hidden">
        <div *ngFor="let variation of variations; trackBy: trackByVariation">
          <div
            class="border-b border-slate-800 transition-colors"
            [ngClass]="isExpanded(variation.id) ? 'bg-slate-950/90' : 'bg-slate-950/70 hover:bg-slate-950/90'"
          >
            <button
              type="button"
              class="flex w-full items-center gap-4 px-4 py-3 text-left text-slate-100"
              (click)="toggleVariation(variation.id)"
            >
              <span class="shrink-0">
                <svg *ngIf="isExpanded(variation.id)" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-5 w-5 text-primary" stroke-width="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
                <svg *ngIf="!isExpanded(variation.id)" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-5 w-5 text-muted-foreground" stroke-width="2">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </span>

              <div class="min-w-[200px] flex-shrink-0">
                <p class="text-base font-semibold leading-tight text-slate-100">{{ variation.name }}</p>
                <p class="mt-0.5 font-mono text-sm text-slate-400">{{ variation.sku }}</p>
              </div>

              <div class="grid flex-1 grid-cols-6 gap-6 text-center">
                <div>
                  <p class="text-xs font-medium uppercase text-slate-400">UPC</p>
                  <p class="truncate font-mono text-sm text-slate-100">{{ variation.upc || '—' }}</p>
                </div>
                <div>
                  <p class="text-xs font-medium uppercase text-slate-400">ASIN</p>
                  <p class="truncate font-mono text-sm text-emerald-400">{{ variation.asin || '—' }}</p>
                </div>
                <div>
                  <p class="text-xs font-medium uppercase text-slate-400">FNSKU</p>
                  <p class="truncate font-mono text-sm text-slate-100">{{ variation.fnsku || '—' }}</p>
                </div>
                <div>
                  <p class="text-xs font-medium uppercase text-slate-400">Available</p>
                  <p
                    class="text-sm font-bold"
                    [ngClass]="(variation.availableStock || 0) > 0 ? 'text-emerald-400' : 'text-slate-400'"
                  >
                    {{ variation.availableStock ?? 0 }}
                  </p>
                </div>
                <div>
                  <p class="text-xs font-medium uppercase text-slate-400">Allocated</p>
                  <p class="text-sm font-semibold text-slate-100">{{ variation.quantityAllocated ?? 0 }}</p>
                </div>
                <div>
                  <p class="text-xs font-medium uppercase text-slate-400">On Hand</p>
                  <p class="text-sm font-semibold text-slate-100">{{ variation.onHandQty ?? 0 }}</p>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <div class="relative">
                  <button
                    type="button"
                    class="variation-image-trigger flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                    (click)="toggleImagePanel($event, variation.id)"
                    [appTooltip]="'Images'"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="m21 15-5-5L5 21" />
                    </svg>
                    Images
                    <span *ngIf="(variation.images || []).length" class="ml-0.5 rounded-full bg-slate-800 px-1 text-[10px] text-slate-100">
                      {{ (variation.images || []).length }}
                    </span>
                  </button>
                  <div
                    *ngIf="imagePanelId === variation.id"
                    class="variation-image-panel absolute right-0 z-20 mt-2 w-96 rounded-lg border border-slate-800 bg-slate-950 p-4 shadow-lg"
                  >
                    <div class="mb-3 text-sm font-semibold">Images for {{ variation.name }}</div>
                    <div class="flex gap-2">
                      <input
                        type="text"
                        class="flex-1 rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
                        placeholder="Enter image URL"
                        [(ngModel)]="imageDrafts[variation.id]"
                        [ngModelOptions]="{ standalone: true }"
                      />
                      <button
                        type="button"
                        class="rounded-md bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950"
                        [disabled]="!imageDrafts[variation.id]"
                        (click)="addVariationImage(variation)"
                      >
                        Add
                      </button>
                    </div>
                    <div class="mt-3 grid grid-cols-3 gap-2" *ngIf="(variation.images || []).length > 0; else noImages">
                      <div
                        *ngFor="let img of variation.images; let idx = index"
                        class="relative overflow-hidden rounded-lg border-2"
                        [ngClass]="idx === 0 ? 'border-primary' : 'border-border'"
                      >
                        <img [src]="img" class="h-20 w-full object-cover" />
                        <span *ngIf="idx === 0" class="absolute left-1 top-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                          Main
                        </span>
                        <div class="absolute inset-0 flex items-center justify-center gap-1 bg-black/60 opacity-0 transition-opacity hover:opacity-100">
                          <button
                            *ngIf="idx !== 0"
                            type="button"
                            class="rounded-md bg-white/10 px-2 py-1 text-[10px] text-white"
                            (click)="setMainImage(variation, idx)"
                          >
                            Main
                          </button>
                          <button
                            type="button"
                            class="rounded-md bg-rose-500/80 px-2 py-1 text-[10px] text-white"
                            (click)="removeVariationImage(variation, idx)"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                    <ng-template #noImages>
                      <div class="mt-3 rounded-lg border border-dashed border-slate-800 p-4 text-center text-xs text-slate-400">
                        No images added
                      </div>
                    </ng-template>
                  </div>
                </div>
                <button
                  type="button"
                  class="h-7 w-7 rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800"
                  [appTooltip]="'Bulk upload images'"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-upload w-3.5 h-3.5"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" x2="12" y1="3" y2="15"></line>
                  </svg>
                </button>
                <button
                  type="button"
                  class="h-7 w-7 rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800"
                  [appTooltip]="'Sync with marketplace'"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10" />
                    <path d="M20.49 15a9 9 0 0 1-14.13 3.36L1 14" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="h-7 w-7 rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800"
                  [appTooltip]="'Edit variation details'"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="h-7 w-7 rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800"
                  [appTooltip]="'Preview variation'"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="h-7 w-7 rounded-md border border-slate-700 text-rose-400 hover:bg-slate-800"
                  [appTooltip]="'Delete variation'"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                    <path d="M3 6h18" />
                    <path d="M8 6v14" />
                    <path d="M16 6v14" />
                    <path d="M5 6l1-2h12l1 2" />
                  </svg>
                </button>
              </div>
            </button>
          </div>

          <div *ngIf="isExpanded(variation.id)" class="space-y-5 border-t bg-muted/20 px-5 pb-5 pt-3 overflow-x-hidden">
            <div class="rounded-lg border border-slate-800 bg-slate-950 text-slate-100">
              <div class="flex items-center justify-between bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100">
                <div class="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                    <path d="M3 5v14" />
                    <path d="M8 5v14" />
                    <path d="M12 5v14" />
                    <path d="M17 5v14" />
                    <path d="M21 5v14" />
                  </svg>
                  IDENTIFIERS - {{ variation.name }}
                  <span
                    class="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-slate-600 text-[10px] text-slate-300"
                    [appTooltip]="'Product identifiers used across marketplaces. SKU, UPC, ASIN, FNSKU, and GTIN support multiple values for products sold under different codes.'"
                  >
                    ?
                  </span>
                </div>
                <span class="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-200">Multiple values supported</span>
              </div>
              <div class="grid grid-cols-5 gap-4 p-4">
                <div *ngFor="let field of identifierFields" class="space-y-2">
                  <div class="flex items-center justify-between text-[11px] font-medium uppercase text-slate-400">
                    <span class="flex items-center gap-1.5">
                      <ng-container [ngSwitch]="field.icon">
                        <svg *ngSwitchCase="'hash'" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3" stroke-width="2">
                          <line x1="4" y1="9" x2="20" y2="9" />
                          <line x1="4" y1="15" x2="20" y2="15" />
                          <line x1="10" y1="3" x2="8" y2="21" />
                          <line x1="16" y1="3" x2="14" y2="21" />
                        </svg>
                        <svg *ngSwitchCase="'barcode'" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3" stroke-width="2">
                          <line x1="4" y1="6" x2="4" y2="18" />
                          <line x1="7" y1="6" x2="7" y2="18" />
                          <line x1="10" y1="6" x2="10" y2="18" />
                          <line x1="13" y1="6" x2="13" y2="18" />
                          <line x1="16" y1="6" x2="16" y2="18" />
                          <line x1="19" y1="6" x2="19" y2="18" />
                        </svg>
                        <svg *ngSwitchCase="'package'" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3" stroke-width="2">
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73Z" />
                          <path d="M3.27 6.96 12 12.01l8.73-5.05" />
                          <path d="M12 22V12" />
                        </svg>
                        <svg *ngSwitchCase="'truck'" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3" stroke-width="2">
                          <path d="M10 17h4V5H2v12h3" />
                          <path d="M16 17h3l3-3v-4h-5z" />
                          <circle cx="5" cy="17" r="2" />
                          <circle cx="17" cy="17" r="2" />
                        </svg>
                        <svg *ngSwitchCase="'globe'" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3" stroke-width="2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M2 12h20" />
                          <path d="M12 2a15 15 0 0 1 0 20" />
                          <path d="M12 2a15 15 0 0 0 0 20" />
                        </svg>
                      </ng-container>
                      {{ field.label }}
                    </span>
                    <button
                      type="button"
                      class="rounded-full border border-slate-700 px-1.5 text-[10px] text-slate-300 hover:text-slate-100"
                      (click)="addMultiValue(variation, field.key)"
                      [appTooltip]="'Add value'"
                    >
                      +
                    </button>
                  </div>
                  <div class="space-y-1.5">
                    <div *ngFor="let value of getMultiValues(variation, field.key); let idx = index" class="flex items-center gap-1.5">
                      <input
                        type="text"
                        class="h-8 flex-1 rounded-md border border-slate-700 bg-slate-950/70 px-2 text-sm text-slate-100 placeholder:text-slate-500"
                        [placeholder]="field.placeholder"
                        [ngModel]="value"
                        [ngModelOptions]="{ standalone: true }"
                        (ngModelChange)="updateMultiValue(variation, field.key, idx, $event)"
                      />
                      <button
                        type="button"
                        class="h-8 w-8 rounded-md border border-slate-700 text-slate-300 hover:text-slate-100"
                        (click)="copyIdentifier(value, field.key, idx)"
                        [disabled]="!value"
                        [appTooltip]="'Copy'"
                      >
                        <svg *ngIf="isCopied(field.key, idx)" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5 text-emerald-400" stroke-width="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <svg *ngIf="!isCopied(field.key, idx)" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        class="h-8 w-8 rounded-md border border-slate-700 text-slate-300 hover:text-rose-400"
                        (click)="removeMultiValue(variation, field.key, idx)"
                        [disabled]="getMultiValues(variation, field.key).length <= 1"
                        [appTooltip]="'Remove'"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                          <line x1="5" y1="5" x2="19" y2="19" />
                          <line x1="19" y1="5" x2="5" y2="19" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="grid grid-cols-4 gap-4 border-t border-slate-800 p-4">
                <div class="space-y-1">
                  <div class="flex items-center gap-1">
                    <label class="text-xs font-medium uppercase text-slate-400">Barcode</label>
                    <span class="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-slate-700 text-[10px] text-slate-400" [appTooltip]="'Barcode value'">
                      ?
                    </span>
                  </div>
                  <input
                    type="text"
                    class="h-8 rounded-md border border-slate-700 bg-slate-950/70 px-2 text-sm text-slate-100 placeholder:text-slate-500"
                    [(ngModel)]="variation.barcode"
                    [ngModelOptions]="{ standalone: true }"
                  />
                </div>
                <div class="space-y-1">
                  <div class="flex items-center gap-1">
                    <label class="text-xs font-medium uppercase text-slate-400">Harmcode</label>
                    <span class="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-slate-700 text-[10px] text-slate-400" [appTooltip]="'Harmonized code'">
                      ?
                    </span>
                  </div>
                  <input
                    type="text"
                    class="h-8 rounded-md border border-slate-700 bg-slate-950/70 px-2 text-sm text-slate-100 placeholder:text-slate-500"
                    [(ngModel)]="variation.harmcode"
                    [ngModelOptions]="{ standalone: true }"
                  />
                </div>
                <div class="space-y-1">
                  <div class="flex items-center gap-1">
                    <label class="text-xs font-medium uppercase text-slate-400">Vendor SKU</label>
                    <span class="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-slate-700 text-[10px] text-slate-400" [appTooltip]="'Vendor SKU reference'">
                      ?
                    </span>
                  </div>
                  <input
                    type="text"
                    class="h-8 rounded-md border border-slate-700 bg-slate-950/70 px-2 text-sm text-slate-100 placeholder:text-slate-500"
                    [(ngModel)]="variation.vendorSku"
                    [ngModelOptions]="{ standalone: true }"
                  />
                </div>
              </div>
            </div>

            <div class="rounded-lg border border-border bg-card">
              <div class="flex items-center justify-between bg-slate-800 px-4 py-2 text-sm font-semibold text-white">
                <div class="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                  WEIGHT / DIMENSION
                  <span
                    class="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-white/30 text-[10px] text-white/70"
                    [appTooltip]="'Enter shipping weight and package dimensions. Use Add Qty for bundled quantities.'"
                  >
                    ?
                  </span>
                </div>
                <button
                  type="button"
                  class="h-6 rounded-md px-2 text-xs text-white/80 hover:bg-white/10"
                  (click)="addWeightQty(variation)"
                  [appTooltip]="'Add weight/dimensions for bundled quantities (2 qty, 3 qty, etc.)'"
                >
                  + Add Qty
                </button>
              </div>
              <div class="space-y-4 p-4">
                <div class="space-y-2">
                  <label class="text-xs font-medium uppercase text-muted-foreground">1 Qty (Base)</label>
                  <div class="grid grid-cols-4 gap-3">
                    <div *ngFor="let field of baseDimensionFields" class="space-y-1">
                      <div class="flex items-center gap-1">
                        <label class="text-xs font-medium uppercase text-muted-foreground">{{ field.label }}</label>
                        <span
                          class="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-border text-[10px] text-muted-foreground"
                          [appTooltip]="field.tooltip"
                        >
                          ?
                        </span>
                      </div>
                      <div class="relative">
                        <input
                          type="number"
                          class="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                          [ngModel]="variation[field.key] ?? ''"
                          [ngModelOptions]="{ standalone: true }"
                          (ngModelChange)="updateNumberField(variation, field.key, $event)"
                        />
                        <span class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          {{ field.unit }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div *ngFor="let entry of variation.weightPerQty || []; let qtyIdx = index" class="space-y-2 border-t border-border pt-3">
                  <div class="flex items-center justify-between">
                    <label class="text-xs font-medium uppercase text-muted-foreground">{{ entry.qty }} Qty</label>
                    <button type="button" class="text-xs text-rose-400" (click)="removeWeightQty(variation, qtyIdx)">Remove</button>
                  </div>
                  <div class="grid grid-cols-4 gap-3">
                    <div class="space-y-1">
                      <div class="flex items-center gap-1">
                        <label class="text-xs font-medium uppercase text-muted-foreground">Weight</label>
                        <span
                          class="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-border text-[10px] text-muted-foreground"
                          [appTooltip]="qtyFieldTooltip('weight', entry.qty)"
                        >
                          ?
                        </span>
                      </div>
                      <input
                        type="number"
                        class="h-9 rounded-md border border-border bg-background px-2 text-sm"
                        [ngModel]="entry.weight"
                        [ngModelOptions]="{ standalone: true }"
                        (ngModelChange)="updateWeightQty(variation, qtyIdx, 'weight', $event)"
                      />
                    </div>
                    <div class="space-y-1" *ngFor="let dim of dimensionKeys">
                      <div class="flex items-center gap-1">
                        <label class="text-xs font-medium uppercase text-muted-foreground">{{ dim | titlecase }}</label>
                        <span
                          class="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-border text-[10px] text-muted-foreground"
                          [appTooltip]="qtyFieldTooltip(dim, entry.qty)"
                        >
                          ?
                        </span>
                      </div>
                      <input
                        type="number"
                        class="h-9 rounded-md border border-border bg-background px-2 text-sm"
                        [ngModel]="getDimensionQty(variation, qtyIdx, dim)"
                        [ngModelOptions]="{ standalone: true }"
                        (ngModelChange)="updateDimensionQty(variation, qtyIdx, dim, $event)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="rounded-lg border border-border bg-card">
              <div class="flex items-center gap-2 bg-slate-800 px-4 py-2 text-sm font-semibold text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                  <path d="M3 7h18" />
                  <path d="M3 12h18" />
                  <path d="M3 17h18" />
                </svg>
                INVENTORY
                <span
                  class="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-white/30 text-[10px] text-white/70"
                  [appTooltip]="'Track stock levels across all channels. Includes adjustments, purchases, sales, returns, available stock, allocations, reserves, and damaged inventory.'"
                >
                  ?
                </span>
              </div>
              <div class="grid grid-cols-9 gap-3 p-4">
                <div *ngFor="let field of inventoryFields" class="space-y-1">
                  <div class="flex items-center gap-1">
                    <label class="text-xs font-medium uppercase text-muted-foreground">{{ field.label }}</label>
                    <span
                      class="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-border text-[10px] text-muted-foreground"
                      [appTooltip]="field.tooltip"
                    >
                      ?
                    </span>
                  </div>
                  <input
                    type="number"
                    class="h-9 rounded-md border border-border bg-background px-2 text-sm"
                    [ngClass]="field.highlight ? 'border-emerald-500/50 bg-emerald-500/10' : ''"
                    [ngModel]="variation[field.key] ?? 0"
                    [ngModelOptions]="{ standalone: true }"
                    (ngModelChange)="updateNumberField(variation, field.key, $event)"
                  />
                </div>
              </div>
            </div>

            <div class="rounded-lg border border-border bg-card">
              <div class="flex items-center gap-2 bg-slate-800 px-4 py-2 text-sm font-semibold text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                  <path d="M12 2v20" />
                  <path d="M17 5H9.5a3.5 3.5 0 1 0 0 7H14a3.5 3.5 0 1 1 0 7H6" />
                </svg>
                PRICE
                <span
                  class="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-white/30 text-[10px] text-white/70"
                  [appTooltip]="'Manage pricing, costs, and profit margins.'"
                >
                  ?
                </span>
              </div>
              <div class="space-y-3 p-4">
                <div class="grid grid-cols-8 gap-3">
                  <div *ngFor="let field of priceFieldsTop" class="space-y-1">
                    <div class="flex items-center gap-1">
                      <label class="text-xs font-medium uppercase text-muted-foreground">{{ field.label }}</label>
                      <span
                        class="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-border text-[10px] text-muted-foreground"
                        [appTooltip]="field.tooltip"
                      >
                        ?
                      </span>
                    </div>
                    <div class="relative">
                      <span *ngIf="field.prefix" class="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{{ field.prefix }}</span>
                      <input
                        type="number"
                        class="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                        [ngClass]="field.highlight ? 'border-emerald-500/50 bg-emerald-500/10' : ''"
                        [ngModel]="variation[field.key] ?? ''"
                        [ngModelOptions]="{ standalone: true }"
                        (ngModelChange)="updateNumberField(variation, field.key, $event)"
                      />
                    </div>
                  </div>
                </div>
                <div class="grid grid-cols-8 gap-3">
                  <div *ngFor="let field of priceFieldsBottom" class="space-y-1" [ngClass]="field.span === 2 ? 'col-span-2' : ''">
                    <div class="flex items-center gap-1">
                      <label class="text-xs font-medium uppercase text-muted-foreground">{{ field.label }}</label>
                      <span
                        class="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-border text-[10px] text-muted-foreground"
                        [appTooltip]="field.tooltip"
                      >
                        ?
                      </span>
                    </div>
                    <ng-container *ngIf="field.badge; else priceInput">
                      <div class="flex h-9 items-center justify-center rounded-md border border-border text-sm font-bold"
                        [ngClass]="(variation.profitMargin || 0) > 0 ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30' : 'bg-rose-500/20 text-rose-500 border-rose-500/30'"
                      >
                        {{ (variation.profitMargin || 0) | number: '1.0-2' }}%
                      </div>
                    </ng-container>
                    <ng-template #priceInput>
                      <div class="relative">
                        <span *ngIf="field.prefix" class="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{{ field.prefix }}</span>
                        <input
                          type="number"
                          class="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                          [ngModel]="variation[field.key] ?? ''"
                          [ngModelOptions]="{ standalone: true }"
                          (ngModelChange)="updateNumberField(variation, field.key, $event)"
                        />
                      </div>
                    </ng-template>
                  </div>
                </div>
              </div>
            </div>

            <div class="rounded-lg border border-border bg-card">
              <div class="flex items-center justify-between bg-slate-800 px-4 py-2 text-sm font-semibold text-white">
                <div class="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                    <path d="M20 7h-9" />
                    <path d="M14 17H5" />
                    <circle cx="17" cy="17" r="3" />
                    <circle cx="7" cy="7" r="3" />
                  </svg>
                  EXTRA PRODUCT ATTRIBUTES
                  <span
                    class="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-white/30 text-[10px] text-white/70"
                    [appTooltip]="'Custom attributes specific to this variation.'"
                  >
                    ?
                  </span>
                </div>
                <button type="button" class="h-6 rounded-md bg-white/10 px-2 text-xs text-white" (click)="addVariationAttribute(variation)">
                  + Add
                </button>
              </div>
              <div class="p-4">
                <div *ngIf="!(variation.extraAttributes?.length)" class="text-center text-sm text-muted-foreground">
                  No extra attributes for this variation
                </div>
                <div *ngIf="variation.extraAttributes?.length" class="grid grid-cols-3 gap-3">
                  <div *ngFor="let attr of variation.extraAttributes; let attrIdx = index" class="rounded-lg bg-muted/30 p-3 space-y-2 relative">
                    <button
                      type="button"
                      class="absolute right-1 top-1 text-rose-400"
                      (click)="removeVariationAttribute(variation, attrIdx)"
                    >
                      ✕
                    </button>
                    <input
                      type="text"
                      class="h-8 w-full rounded-md border border-border bg-background px-2 text-sm font-medium"
                      [ngModel]="attr.name"
                      [ngModelOptions]="{ standalone: true }"
                      (ngModelChange)="updateVariationAttribute(variation, attrIdx, 'name', $event)"
                      placeholder="Attribute name"
                    />
                    <div class="flex items-center gap-2">
                      <select
                        class="h-8 w-24 rounded-md border border-border bg-background px-2 text-xs"
                        [ngModel]="attr.type || 'text'"
                        [ngModelOptions]="{ standalone: true }"
                        (ngModelChange)="updateVariationAttribute(variation, attrIdx, 'type', $event)"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                      </select>
                      <input
                        [type]="(attr.type || 'text') === 'number' ? 'number' : 'text'"
                        class="h-8 flex-1 rounded-md border border-border bg-background px-2 text-sm"
                        [ngModel]="attr.value"
                        [ngModelOptions]="{ standalone: true }"
                        (ngModelChange)="updateVariationAttribute(variation, attrIdx, 'value', $event)"
                        placeholder="Value"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Default,
})
export class VariationSettingsEditorComponent {
  @Input() variations: VariationSettingsRow[] = [];
  @Input() productName = '';

  private expandedIds = new Set<string>();
  imagePanelId: string | null = null;
  imageDrafts: Record<string, string> = {};
  copiedCell: { key: MultiKey; index: number } | null = null;
  private copyTimeout?: ReturnType<typeof setTimeout>;

  readonly identifierFields: Array<{
    key: MultiKey;
    label: string;
    placeholder: string;
    icon: IdentifierIcon;
  }> = [
    { key: 'multiSkus', label: 'SKU', placeholder: 'Enter SKU', icon: 'hash' },
    { key: 'multiUpcs', label: 'UPC', placeholder: 'Enter UPC', icon: 'barcode' },
    { key: 'multiAsins', label: 'ASIN', placeholder: 'Enter ASIN', icon: 'package' },
    { key: 'multiFnskus', label: 'FNSKU', placeholder: 'Enter FNSKU', icon: 'truck' },
    { key: 'multiGtins', label: 'GTIN', placeholder: 'Enter GTIN', icon: 'globe' },
  ];

  readonly dimensionKeys: DimensionKey[] = ['height', 'width', 'length'];

  readonly baseDimensionFields: Array<{
    label: string;
    key: DimensionWithWeightKey;
    unit: string;
    tooltip: string;
  }> = [
    { label: 'Weight', key: 'weight', unit: 'lb', tooltip: 'Shipping weight in pounds' },
    { label: 'Height', key: 'height', unit: 'in', tooltip: 'Package height in inches' },
    { label: 'Width', key: 'width', unit: 'in', tooltip: 'Package width in inches' },
    { label: 'Length', key: 'length', unit: 'in', tooltip: 'Package length in inches' },
  ];

  readonly inventoryFields: Array<{
    label: string;
    key: keyof VariationSettingsRow;
    highlight?: boolean;
    tooltip: string;
  }> = [
    {
      label: 'Inv Qty Adj',
      key: 'invQtyAdjustment',
      tooltip: 'Manual inventory quantity adjustment to correct stock discrepancies',
    },
    { label: 'Purchase Qty', key: 'purchaseQty', tooltip: 'Total quantity purchased from suppliers' },
    { label: 'Sold Qty', key: 'soldQty', tooltip: 'Total quantity sold across all channels' },
    {
      label: 'Return Rcv Qty',
      key: 'returnReceiveQty',
      tooltip: 'Quantity of items returned by customers and received back',
    },
    {
      label: 'Available Stock',
      key: 'availableStock',
      highlight: true,
      tooltip: 'Stock currently available for sale (On Hand - Allocated - Reserved)',
    },
    {
      label: 'Qty Allocated',
      key: 'quantityAllocated',
      tooltip: 'Quantity allocated to pending orders awaiting shipment',
    },
    {
      label: 'Reserve Qty',
      key: 'reserveQty',
      tooltip: 'Quantity held in reserve for specific purposes (promotions, B2B orders)',
    },
    { label: 'Damage Qty', key: 'damageQty', tooltip: 'Quantity of damaged items not available for sale' },
    {
      label: 'On Hand Qty',
      key: 'onHandQty',
      tooltip: 'Total physical inventory in warehouse (Available + Allocated + Reserved + Damaged)',
    },
  ];

  readonly priceFieldsTop: Array<{
    label: string;
    key: keyof VariationSettingsRow;
    prefix?: string;
    highlight?: boolean;
    tooltip: string;
  }> = [
    { label: 'Purchase Price', key: 'purchasePrice', prefix: '$', tooltip: 'Cost paid to supplier per unit' },
    { label: 'Inbound Freight', key: 'inboundFreight', tooltip: 'Shipping cost to receive inventory' },
    { label: 'Extra Duty', key: 'extraDuty', tooltip: 'Import duties and customs fees' },
    {
      label: 'Landed Cost',
      key: 'landedCost',
      prefix: '$',
      highlight: true,
      tooltip: 'Total cost including purchase, freight, and duties',
    },
    { label: 'FVF', key: 'fvf', prefix: '$', tooltip: 'Final Value Fee - marketplace selling fee percentage' },
    { label: 'TAC', key: 'tac', prefix: '$', tooltip: 'Transaction Advisory Cost - payment processing fee' },
  ];

  readonly priceFieldsBottom: Array<{
    label: string;
    key: keyof VariationSettingsRow;
    prefix?: string;
    span?: number;
    badge?: boolean;
    tooltip: string;
  }> = [
    { label: 'Sale Price', key: 'salePrice', prefix: '$', tooltip: 'Current selling price on marketplace' },
    { label: 'MSRP', key: 'msrp', prefix: '$', tooltip: 'Manufacturer Suggested Retail Price' },
    {
      label: 'Competitor Price',
      key: 'competitorPrice',
      span: 2,
      prefix: '$',
      tooltip: 'Lowest competitor price for comparison',
    },
    {
      label: 'Profit Margin(%)',
      key: 'profitMargin',
      badge: true,
      tooltip: 'Calculated profit percentage after all costs and fees',
    },
    { label: 'Min $ (BuyBox)', key: 'minBuyBox', prefix: '$', tooltip: 'Minimum price threshold to win BuyBox' },
    { label: 'Max $ (BuyBox)', key: 'maxBuyBox', prefix: '$', tooltip: 'Maximum price ceiling for BuyBox eligibility' },
  ];

  trackByVariation(_: number, variation: VariationSettingsRow): string {
    return variation.id;
  }

  isExpanded(id: string): boolean {
    return this.expandedIds.has(id);
  }

  toggleVariation(id: string): void {
    if (this.expandedIds.has(id)) {
      this.expandedIds.delete(id);
    } else {
      this.expandedIds.add(id);
    }
  }

  toggleImagePanel(event: MouseEvent, id: string): void {
    event.stopPropagation();
    this.imagePanelId = this.imagePanelId === id ? null : id;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.imagePanelId) return;
    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (target.closest('.variation-image-panel') || target.closest('.variation-image-trigger')) {
      return;
    }
    this.imagePanelId = null;
  }

  addVariationImage(variation: VariationSettingsRow): void {
    const url = (this.imageDrafts[variation.id] || '').trim();
    if (!url) return;
    variation.images = [...(variation.images || []), url];
    this.imageDrafts[variation.id] = '';
  }

  removeVariationImage(variation: VariationSettingsRow, index: number): void {
    variation.images = (variation.images || []).filter((_, i) => i !== index);
  }

  setMainImage(variation: VariationSettingsRow, index: number): void {
    if (!variation.images || index === 0) return;
    const next = [...variation.images];
    const [selected] = next.splice(index, 1);
    next.unshift(selected);
    variation.images = next;
  }

  getMultiValues(variation: VariationSettingsRow, key: MultiKey): string[] {
    const values = variation[key] ?? [];
    if (values.length === 0) {
      variation[key] = [''];
      return variation[key] ?? [''];
    }
    return values;
  }

  addMultiValue(variation: VariationSettingsRow, key: MultiKey): void {
    variation[key] = [...this.getMultiValues(variation, key), ''];
  }

  copyIdentifier(value: string, key: MultiKey, index: number): void {
    if (!value) return;
    navigator.clipboard?.writeText(value).then(
      () => {
        this.copiedCell = { key, index };
        if (this.copyTimeout) {
          clearTimeout(this.copyTimeout);
        }
        this.copyTimeout = setTimeout(() => {
          this.copiedCell = null;
        }, 1500);
      },
      () => {
        this.copiedCell = null;
      }
    );
  }

  isCopied(key: MultiKey, index: number): boolean {
    return this.copiedCell?.key === key && this.copiedCell?.index === index;
  }

  updateMultiValue(variation: VariationSettingsRow, key: MultiKey, index: number, value: string): void {
    const next = [...this.getMultiValues(variation, key)];
    next[index] = value;
    variation[key] = next;
  }

  removeMultiValue(variation: VariationSettingsRow, key: MultiKey, index: number): void {
    const next = [...this.getMultiValues(variation, key)];
    if (next.length <= 1) {
      next[0] = '';
      variation[key] = next;
      return;
    }
    next.splice(index, 1);
    variation[key] = next;
  }

  addWeightQty(variation: VariationSettingsRow): void {
    const current = variation.weightPerQty || [];
    const nextQty = current.length > 0 ? Math.max(...current.map((entry) => entry.qty)) + 1 : 2;
    variation.weightPerQty = [...current, { qty: nextQty, weight: 0 }];
    variation.dimensionsPerQty = [
      ...(variation.dimensionsPerQty || []),
      { qty: nextQty, height: 0, width: 0, length: 0 },
    ];
  }

  removeWeightQty(variation: VariationSettingsRow, index: number): void {
    variation.weightPerQty = (variation.weightPerQty || []).filter((_, i) => i !== index);
    variation.dimensionsPerQty = (variation.dimensionsPerQty || []).filter((_, i) => i !== index);
  }

  updateWeightQty(variation: VariationSettingsRow, index: number, key: 'weight', value: string): void {
    const next = [...(variation.weightPerQty || [])];
    if (!next[index]) return;
    next[index] = { ...next[index], [key]: this.toNumber(value) };
    variation.weightPerQty = next;
  }

  updateDimensionQty(
    variation: VariationSettingsRow,
    index: number,
    key: DimensionKey,
    value: string
  ): void {
    const next = [...(variation.dimensionsPerQty || [])];
    if (!next[index]) return;
    next[index] = { ...next[index], [key]: this.toNumber(value) };
    variation.dimensionsPerQty = next;
  }

  getDimensionQty(variation: VariationSettingsRow, index: number, key: DimensionKey): number {
    return variation.dimensionsPerQty?.[index]?.[key] ?? 0;
  }

  updateNumberField(variation: VariationSettingsRow, key: keyof VariationSettingsRow, value: string): void {
    (variation as unknown as Record<string, number>)[key as string] = this.toNumber(value);
  }

  qtyFieldTooltip(field: DimensionKey | 'weight', qty: number): string {
    if (field === 'weight') {
      return `Combined shipping weight for ${qty} units`;
    }
    return `Package ${field} in inches for ${qty} units`;
  }

  addVariationAttribute(variation: VariationSettingsRow): void {
    variation.extraAttributes = [...(variation.extraAttributes || []), { name: '', value: '', type: 'text' }];
  }

  removeVariationAttribute(variation: VariationSettingsRow, index: number): void {
    variation.extraAttributes = (variation.extraAttributes || []).filter((_, i) => i !== index);
  }

  updateVariationAttribute(
    variation: VariationSettingsRow,
    index: number,
    field: 'name' | 'value' | 'type',
    value: string
  ): void {
    const next = [...(variation.extraAttributes || [])];
    if (!next[index]) return;
    next[index] = { ...next[index], [field]: value };
    variation.extraAttributes = next;
  }

  private toNumber(value: string): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
