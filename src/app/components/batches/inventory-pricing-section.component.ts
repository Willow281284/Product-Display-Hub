import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface QuantityDiscount {
  units: string;
  pricePerUnit: string;
}

@Component({
  selector: 'app-inventory-pricing-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="rounded-lg border border-border/50 bg-card">
        <div class="border-b border-border/30 px-4 pb-3 pt-4">
          <div class="flex items-center gap-2 text-base font-semibold">
            <svg viewBox="0 0 24 24" class="h-4 w-4 text-primary" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            </svg>
            Inventory
          </div>
        </div>
        <div class="space-y-4 px-4 pb-4 pt-3">
          <div class="flex items-center gap-4">
            <div class="flex w-40 items-center gap-2 text-sm text-muted-foreground">
              Stock
              <span class="text-muted-foreground" data-tooltip="Available quantity for sale">?</span>
            </div>
            <input
              type="number"
              min="0"
              class="h-9 w-48 rounded-md border border-border bg-background px-3 text-sm"
              [class.border-destructive]="errors['quantity']"
              [ngModel]="value('quantity')"
              (ngModelChange)="update('quantity', $event)"
              placeholder="0"
            />
          </div>
          <div class="flex items-center gap-4">
            <div class="flex w-40 items-center gap-2 text-sm text-muted-foreground">
              Shipping ($)
              <span class="text-muted-foreground" data-tooltip="Shipping cost for this product">?</span>
            </div>
            <input
              type="number"
              step="0.01"
              min="0"
              class="h-9 w-48 rounded-md border border-border bg-background px-3 text-sm"
              [class.border-destructive]="errors['shipping_cost']"
              [ngModel]="value('shipping_cost')"
              (ngModelChange)="update('shipping_cost', $event)"
              placeholder="0.00"
            />
          </div>
          <div class="flex items-center gap-4">
            <div class="flex w-40 items-center gap-2 text-sm text-muted-foreground">
              Condition
              <span class="text-muted-foreground" data-tooltip="Product condition for compliance">?</span>
            </div>
            <select
              class="h-9 w-48 rounded-md border border-border bg-background px-3 text-sm"
              [class.border-destructive]="errors['condition']"
              [ngModel]="value('condition') || 'new'"
              (ngModelChange)="update('condition', $event)"
            >
              <option value="new">New</option>
              <option value="used_like_new">Used - Like New</option>
              <option value="used_very_good">Used - Very Good</option>
              <option value="used_good">Used - Good</option>
              <option value="used_acceptable">Used - Acceptable</option>
              <option value="refurbished">Refurbished</option>
              <option value="renewed">Renewed</option>
            </select>
          </div>
        </div>
      </div>

      <details class="rounded-lg border border-border/50 bg-card" [open]="standardOpen">
        <summary class="flex cursor-pointer items-center gap-2 px-4 py-3 text-base font-semibold" (click)="standardOpen = !standardOpen">
          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
          Standard price
        </summary>
        <div class="space-y-4 px-4 pb-4">
          <div class="space-y-3">
            <div class="flex items-center gap-4">
              <div class="w-40 text-sm text-muted-foreground">Price ($)</div>
              <input
                type="number"
                step="0.01"
                min="0"
                class="h-9 w-48 rounded-md border border-border bg-background px-3 text-sm"
                [class.border-destructive]="errors['price']"
                [ngModel]="value('price')"
                (ngModelChange)="update('price', $event)"
                placeholder="0.00"
              />
            </div>
            <div class="flex items-center gap-4">
              <div class="w-40 text-sm text-muted-foreground">MSRP ($)</div>
              <input
                type="number"
                step="0.01"
                min="0"
                class="h-9 w-48 rounded-md border border-border bg-background px-3 text-sm"
                [class.border-destructive]="errors['msrp']"
                [ngModel]="value('msrp')"
                (ngModelChange)="update('msrp', $event)"
                placeholder="0.00"
              />
            </div>
            <div class="flex items-center gap-4">
              <div class="w-40 text-sm text-muted-foreground">Minimum price ($)</div>
              <input
                type="number"
                step="0.01"
                min="0"
                class="h-9 w-48 rounded-md border border-border bg-background px-3 text-sm"
                [ngModel]="value('min_price')"
                (ngModelChange)="update('min_price', $event)"
                placeholder="0.00"
              />
            </div>
            <div class="flex items-center gap-4">
              <div class="w-40 text-sm text-muted-foreground">Maximum price ($)</div>
              <input
                type="number"
                step="0.01"
                min="0"
                class="h-9 w-48 rounded-md border border-border bg-background px-3 text-sm"
                [ngModel]="value('max_price')"
                (ngModelChange)="update('max_price', $event)"
                placeholder="0.00"
              />
            </div>
          </div>

          <button type="button" class="text-sm font-medium text-primary hover:underline">Pricing health</button>

          <div class="border-t border-border/40 pt-4">
            <div class="mb-3 flex items-center justify-between">
              <h4 class="text-sm font-semibold">Reference prices</h4>
              <button type="button" class="text-sm text-primary hover:underline">Learn more</button>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex items-center justify-between py-1">
                <span class="text-muted-foreground">Featured offer</span>
                <span class="text-muted-foreground">{{ value('featured_offer_price') || '-' }}</span>
              </div>
              <div class="flex items-center justify-between py-1">
                <span class="text-muted-foreground">Lowest price</span>
                <span class="text-muted-foreground">{{ value('lowest_price') || '-' }}</span>
              </div>
              <div class="flex items-center justify-between py-1">
                <span class="text-muted-foreground">Competitive price</span>
                <span class="text-muted-foreground">{{ value('competitive_price') || '-' }}</span>
              </div>
              <div class="flex items-center justify-between py-1">
                <span class="text-muted-foreground">Minimum price</span>
                <span class="text-muted-foreground">{{ value('min_similar_price') || '-' }}</span>
              </div>
              <div class="flex items-center justify-between py-1">
                <span class="text-muted-foreground">Median price</span>
                <span class="text-muted-foreground">{{ value('median_similar_price') || '-' }}</span>
              </div>
            </div>
          </div>
        </div>
      </details>

      <details class="rounded-lg border border-border/50 bg-card" [open]="businessOpen">
        <summary class="flex cursor-pointer items-center gap-2 px-4 py-3 text-base font-semibold" (click)="businessOpen = !businessOpen">
          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
          Business price
        </summary>
        <div class="space-y-4 px-4 pb-4">
          <div class="flex items-center gap-4">
            <div class="w-40 text-sm text-muted-foreground">Business price ($)</div>
            <input
              type="number"
              step="0.01"
              min="0"
              class="h-9 w-48 rounded-md border border-border bg-background px-3 text-sm"
              [ngModel]="value('business_price')"
              (ngModelChange)="update('business_price', $event)"
              placeholder="0.00"
            />
          </div>

          <div class="space-y-3">
            <div class="text-sm font-medium">Quantity discounts</div>
            <div class="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-sm">
              <button
                type="button"
                class="rounded-full px-3 py-1"
                [ngClass]="discountType === 'percent' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'"
                (click)="discountType = 'percent'"
              >
                % off
              </button>
              <span class="text-muted-foreground">|</span>
              <button
                type="button"
                class="rounded-full px-3 py-1"
                [ngClass]="discountType === 'fixed' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'"
                (click)="discountType = 'fixed'"
              >
                Fixed price
              </button>
            </div>

            <div *ngIf="discounts.length > 0" class="space-y-2">
              <div class="grid grid-cols-[1fr_1fr_auto] gap-2 text-sm font-medium text-muted-foreground">
                <span>Units</span>
                <span>{{ discountType === 'percent' ? '% off' : 'Price per unit ($)' }}</span>
                <span class="w-8"></span>
              </div>
              <div *ngFor="let discount of discounts; let i = index" class="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                <input
                  type="number"
                  min="1"
                  class="h-9 rounded-md border border-border bg-background px-3 text-sm"
                  [ngModel]="discount.units"
                  (ngModelChange)="updateDiscount(i, 'units', $event)"
                  placeholder="0"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  class="h-9 rounded-md border border-border bg-background px-3 text-sm"
                  [ngModel]="discount.pricePerUnit"
                  (ngModelChange)="updateDiscount(i, 'pricePerUnit', $event)"
                  placeholder="0.00"
                />
                <button type="button" class="h-9 w-9 rounded-md text-primary hover:text-destructive" (click)="removeDiscount(i)">
                  x
                </button>
              </div>
            </div>

            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-md border border-primary px-3 py-2 text-sm text-primary hover:bg-primary/10"
              (click)="addDiscount()"
            >
              + Add discount
            </button>
          </div>
        </div>
      </details>
    </div>
  `,
})
export class InventoryPricingSectionComponent {
  @Input() values: Record<string, string> = {};
  @Input() errors: Record<string, boolean> = {};
  @Output() valueChange = new EventEmitter<{ key: string; value: string }>();

  standardOpen = true;
  businessOpen = false;
  discountType: 'percent' | 'fixed' = 'fixed';

  get discounts(): QuantityDiscount[] {
    try {
      const stored = this.values['quantity_discounts'];
      return stored ? (JSON.parse(stored) as QuantityDiscount[]) : [];
    } catch {
      return [];
    }
  }

  value(key: string): string {
    return this.values[key] || '';
  }

  update(key: string, value: string): void {
    this.valueChange.emit({ key, value });
  }

  addDiscount(): void {
    const next = [...this.discounts, { units: '', pricePerUnit: '' }];
    this.valueChange.emit({ key: 'quantity_discounts', value: JSON.stringify(next) });
  }

  removeDiscount(index: number): void {
    const next = this.discounts.filter((_, i) => i !== index);
    this.valueChange.emit({ key: 'quantity_discounts', value: JSON.stringify(next) });
  }

  updateDiscount(index: number, field: keyof QuantityDiscount, value: string): void {
    const next = [...this.discounts];
    next[index] = { ...next[index], [field]: value };
    this.valueChange.emit({ key: 'quantity_discounts', value: JSON.stringify(next) });
  }
}
