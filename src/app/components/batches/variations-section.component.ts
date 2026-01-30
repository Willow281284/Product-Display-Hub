import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface ChildVariation {
  id: string;
  name: string;
  sku: string;
  productId: string;
  variationId: string;
  image: string | null;
  marketplace: string;
  attributes: Record<string, string>;
  status: 'pending' | 'processing' | 'success' | 'failed';
  salePrice: number | null;
  stockQty: number | null;
}

interface VariationField {
  key: string;
  label: string;
  placeholder: string;
  group: 'primary' | 'physical' | 'other';
  description: string;
}

const VARIATION_FIELDS: VariationField[] = [
  {
    key: 'color',
    label: 'Color',
    placeholder: 'Black, Navy, Red',
    group: 'primary',
    description: 'Primary color of this variation',
  },
  {
    key: 'size',
    label: 'Size',
    placeholder: 'S, M, L, XL',
    group: 'primary',
    description: 'Size or dimension label',
  },
  {
    key: 'material',
    label: 'Material',
    placeholder: 'Cotton, Leather, Steel',
    group: 'primary',
    description: 'Primary material or fabric',
  },
  {
    key: 'weight',
    label: 'Weight',
    placeholder: '2.4 lbs',
    group: 'physical',
    description: 'Variation weight',
  },
  {
    key: 'length',
    label: 'Length',
    placeholder: '10 in',
    group: 'physical',
    description: 'Length measurement',
  },
  {
    key: 'width',
    label: 'Width',
    placeholder: '6 in',
    group: 'physical',
    description: 'Width measurement',
  },
  {
    key: 'height',
    label: 'Height',
    placeholder: '2 in',
    group: 'physical',
    description: 'Height measurement',
  },
  {
    key: 'pattern',
    label: 'Pattern',
    placeholder: 'Striped, Solid',
    group: 'other',
    description: 'Pattern or style',
  },
  {
    key: 'capacity',
    label: 'Capacity / Volume',
    placeholder: '500ml, 16oz',
    group: 'other',
    description: 'Capacity or volume',
  },
];

const GROUP_LABELS: Record<'primary' | 'physical' | 'other', string> = {
  primary: 'Primary Variations',
  physical: 'Physical Attributes',
  other: 'Other Variations',
};

@Component({
  selector: 'app-variations-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="grid gap-4">
        <ng-container *ngFor="let group of groupKeys">
          <div class="rounded-lg border border-border/50 bg-card">
            <button
              type="button"
              class="flex w-full items-center justify-between px-4 py-3 text-left text-base font-semibold"
              (click)="toggleGroup(group)"
            >
              {{ groupLabels[group] }}
              <span class="text-xs text-muted-foreground">{{ groupStats(group) }}</span>
            </button>
            <div *ngIf="expandedGroups.has(group)" class="grid gap-3 px-4 pb-4">
              <div
                *ngFor="let field of fieldsByGroup(group)"
                class="rounded-lg border p-3 transition-all"
                [ngClass]="fieldClass(field.key)"
              >
                <div class="flex items-start gap-3">
                  <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    #
                  </div>
                  <div class="flex-1 space-y-1.5">
                    <div class="flex items-center gap-2">
                      <label class="text-sm font-medium">{{ field.label }}</label>
                      <span class="text-xs text-muted-foreground" [attr.data-tooltip]="field.description">?</span>
                      <span *ngIf="fieldStatus(field.key) === 'valid'" class="ml-auto text-green-600">OK</span>
                      <span *ngIf="fieldStatus(field.key) === 'error'" class="ml-auto text-destructive">!</span>
                    </div>
                    <input
                      class="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                      [class.border-destructive]="errors[field.key]"
                      [ngModel]="values[field.key] || ''"
                      (ngModelChange)="valueChange.emit({ key: field.key, value: $event })"
                      [placeholder]="field.placeholder"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ng-container>
      </div>

      <div class="rounded-lg border border-border/50 bg-card p-4" *ngIf="childVariations.length > 0">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="text-sm font-semibold">Sibling Variations</h4>
            <p class="text-xs text-muted-foreground">Click a variation to open it.</p>
          </div>
          <span class="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
            {{ childVariations.length }} variations
          </span>
        </div>
        <div class="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            *ngFor="let variation of childVariations"
            type="button"
            class="flex items-center justify-between rounded-lg border border-border/50 bg-background px-3 py-2 text-left text-sm hover:bg-muted/40"
            (click)="variationClick.emit(variation.id)"
          >
            <div>
              <div class="font-medium truncate">{{ variation.name }}</div>
              <div class="text-xs text-muted-foreground">{{ variation.sku || 'No SKU' }}</div>
            </div>
            <span class="text-xs" [ngClass]="statusLabelClass(variation.status)">{{ variation.status }}</span>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class VariationsSectionComponent {
  @Input() values: Record<string, string> = {};
  @Input() errors: Record<string, boolean> = {};
  @Input() childVariations: ChildVariation[] = [];
  @Output() valueChange = new EventEmitter<{ key: string; value: string }>();
  @Output() variationClick = new EventEmitter<string>();

  readonly groupLabels = GROUP_LABELS;
  readonly groupKeys: Array<'primary' | 'physical' | 'other'> = ['primary', 'physical', 'other'];
  expandedGroups = new Set<string>(['primary']);

  toggleGroup(group: string): void {
    if (this.expandedGroups.has(group)) {
      this.expandedGroups.delete(group);
    } else {
      this.expandedGroups.add(group);
    }
  }

  fieldsByGroup(group: 'primary' | 'physical' | 'other'): VariationField[] {
    return VARIATION_FIELDS.filter((field) => field.group === group);
  }

  fieldStatus(key: string): 'empty' | 'valid' | 'error' {
    if (this.errors[key]) return 'error';
    if (this.values[key] && this.values[key].trim() !== '') return 'valid';
    return 'empty';
  }

  fieldClass(key: string): string {
    const status = this.fieldStatus(key);
    if (status === 'error') return 'border-destructive bg-destructive/5';
    if (status === 'valid') return 'border-green-500/30 bg-green-500/5';
    return 'border-border/50';
  }

  groupStats(group: 'primary' | 'physical' | 'other'): string {
    const fields = this.fieldsByGroup(group);
    const filled = fields.filter((field) => this.values[field.key] && this.values[field.key].trim() !== '').length;
    return `${filled}/${fields.length} filled`;
  }

  statusLabelClass(status: ChildVariation['status']): string {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'failed':
        return 'text-destructive';
      case 'processing':
        return 'text-blue-600';
      default:
        return 'text-muted-foreground';
    }
  }
}
