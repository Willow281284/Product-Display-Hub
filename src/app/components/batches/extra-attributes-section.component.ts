import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface ExtraAttribute {
  id: string;
  name: string;
  value: string;
  type: 'text' | 'number';
}

const OPTIONAL_PREDEFINED = [
  { key: 'package_weight', label: 'Package Weight', unit: 'lbs', type: 'number' as const },
  { key: 'package_length', label: 'Package Length', unit: 'in', type: 'number' as const },
  { key: 'package_width', label: 'Package Width', unit: 'in', type: 'number' as const },
  { key: 'package_height', label: 'Package Height', unit: 'in', type: 'number' as const },
  { key: 'country_of_origin', label: 'Country of Origin', unit: '', type: 'text' as const },
  { key: 'warranty_info', label: 'Warranty Information', unit: '', type: 'text' as const },
  { key: 'material', label: 'Material', unit: '', type: 'text' as const },
  { key: 'color', label: 'Color', unit: '', type: 'text' as const },
  { key: 'size', label: 'Size', unit: '', type: 'text' as const },
];

@Component({
  selector: 'app-extra-attributes-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="rounded-lg border border-destructive/30 bg-destructive/5">
        <div class="border-b border-border/30 px-4 pb-3 pt-4">
          <div class="flex items-center gap-2 text-base font-semibold text-destructive">
            <span>!</span>
            Required Attributes
            <span class="text-xs font-normal text-muted-foreground">(Weight & Dimensions)</span>
          </div>
        </div>
        <div class="space-y-4 px-4 pb-4 pt-3">
          <div class="flex items-center gap-4">
            <div class="flex w-40 items-center gap-2 text-sm text-muted-foreground">
              Weight <span class="text-destructive">*</span>
            </div>
            <div class="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                class="h-9 w-32 rounded-md border border-border bg-background px-3 text-sm"
                [class.border-destructive]="errors['product_weight']"
                [ngModel]="values['product_weight'] || ''"
                (ngModelChange)="valueChange.emit({ key: 'product_weight', value: $event })"
                placeholder="0.00"
              />
              <span class="text-sm text-muted-foreground">lbs</span>
              <span *ngIf="isFilled('product_weight')" class="text-green-600">OK</span>
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              Dimensions (L x W x H) <span class="text-destructive">*</span>
            </div>
            <div class="ml-6 flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                class="h-9 w-24 rounded-md border border-border bg-background px-3 text-sm"
                [class.border-destructive]="errors['product_length']"
                [ngModel]="values['product_length'] || ''"
                (ngModelChange)="valueChange.emit({ key: 'product_length', value: $event })"
                placeholder="L"
              />
              <span class="text-muted-foreground">x</span>
              <input
                type="number"
                step="0.01"
                min="0"
                class="h-9 w-24 rounded-md border border-border bg-background px-3 text-sm"
                [class.border-destructive]="errors['product_width']"
                [ngModel]="values['product_width'] || ''"
                (ngModelChange)="valueChange.emit({ key: 'product_width', value: $event })"
                placeholder="W"
              />
              <span class="text-muted-foreground">x</span>
              <input
                type="number"
                step="0.01"
                min="0"
                class="h-9 w-24 rounded-md border border-border bg-background px-3 text-sm"
                [class.border-destructive]="errors['product_height']"
                [ngModel]="values['product_height'] || ''"
                (ngModelChange)="valueChange.emit({ key: 'product_height', value: $event })"
                placeholder="H"
              />
              <span class="text-sm text-muted-foreground">in</span>
              <span *ngIf="isFilled('product_length') && isFilled('product_width') && isFilled('product_height')" class="text-green-600">OK</span>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-lg border border-border/50 bg-card">
        <div class="border-b border-border/30 px-4 pb-3 pt-4">
          <div class="flex items-center gap-2 text-base font-semibold">
            Optional Attributes
            <span class="text-xs font-normal text-muted-foreground">(Package Info & Specifications)</span>
          </div>
        </div>
        <div class="grid gap-4 px-4 pb-4 pt-3 sm:grid-cols-2">
          <div *ngFor="let attr of optionalAttributes" class="flex items-center gap-3">
            <label class="w-32 truncate text-sm text-muted-foreground">{{ attr.label }}</label>
            <div class="flex flex-1 items-center gap-2">
              <input
                [type]="attr.type"
                [attr.step]="attr.type === 'number' ? '0.01' : null"
                [attr.min]="attr.type === 'number' ? '0' : null"
                class="h-9 flex-1 rounded-md border border-border bg-background px-3 text-sm"
                [class.border-destructive]="errors[attr.key]"
                [ngModel]="values[attr.key] || ''"
                (ngModelChange)="valueChange.emit({ key: attr.key, value: $event })"
                [placeholder]="attr.type === 'number' ? '0.00' : 'Enter ' + attr.label.toLowerCase()"
              />
              <span *ngIf="attr.unit" class="w-8 text-sm text-muted-foreground">{{ attr.unit }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-lg border border-border/50 bg-card">
        <div class="border-b border-border/30 px-4 pb-3 pt-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-base font-semibold">
              Custom Attributes
              <span class="text-xs font-normal text-muted-foreground">(Add your own)</span>
            </div>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-md border border-primary px-3 py-2 text-sm text-primary hover:bg-primary/10"
              (click)="addCustomAttribute()"
            >
              + Add Attribute
            </button>
          </div>
        </div>
        <div class="px-4 pb-4 pt-3">
          <div *ngIf="customAttributes.length === 0" class="py-8 text-center text-muted-foreground">
            <div class="text-sm font-medium">No custom attributes added yet</div>
            <div class="text-xs">Click "Add Attribute" to create custom fields</div>
          </div>
          <div *ngIf="customAttributes.length > 0" class="space-y-3">
            <div class="grid grid-cols-[1fr_1fr_100px_auto] gap-2 text-sm font-medium text-muted-foreground">
              <span>Attribute Name</span>
              <span>Value</span>
              <span>Type</span>
              <span class="w-9"></span>
            </div>
            <div
              *ngFor="let attr of customAttributes"
              class="grid grid-cols-[1fr_1fr_100px_auto] items-center gap-2"
            >
              <input
                class="h-9 rounded-md border border-border bg-background px-3 text-sm"
                [ngModel]="attr.name"
                (ngModelChange)="updateCustom(attr.id, 'name', $event)"
                placeholder="Attribute name"
              />
              <input
                class="h-9 rounded-md border border-border bg-background px-3 text-sm"
                [type]="attr.type"
                [ngModel]="attr.value"
                (ngModelChange)="updateCustom(attr.id, 'value', $event)"
                [placeholder]="attr.type === 'number' ? '0' : 'Value'"
              />
              <select
                class="h-9 rounded-md border border-border bg-background px-2 text-sm"
                [ngModel]="attr.type"
                (ngModelChange)="updateCustom(attr.id, 'type', $event)"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
              </select>
              <button
                type="button"
                class="h-9 w-9 rounded-md text-muted-foreground hover:text-destructive"
                (click)="removeCustom(attr.id)"
              >
                x
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-start gap-2 rounded-lg border border-border/30 bg-muted/30 p-3 text-xs text-muted-foreground">
        <span>?</span>
        <div>
          <span class="font-medium">Tip:</span> Accurate weight and dimensions are crucial for shipping cost calculations. Package dimensions should include all packaging materials.
        </div>
      </div>
    </div>
  `,
})
export class ExtraAttributesSectionComponent {
  @Input() values: Record<string, string> = {};
  @Input() errors: Record<string, boolean> = {};
  @Output() valueChange = new EventEmitter<{ key: string; value: string }>();

  readonly optionalAttributes = OPTIONAL_PREDEFINED;

  get customAttributes(): ExtraAttribute[] {
    try {
      return this.values['custom_extra_attributes']
        ? (JSON.parse(this.values['custom_extra_attributes']) as ExtraAttribute[])
        : [];
    } catch {
      return [];
    }
  }

  addCustomAttribute(): void {
    const next = [
      ...this.customAttributes,
      { id: `custom_${Date.now()}`, name: '', value: '', type: 'text' as const },
    ];
    this.valueChange.emit({ key: 'custom_extra_attributes', value: JSON.stringify(next) });
  }

  removeCustom(id: string): void {
    const next = this.customAttributes.filter((attr) => attr.id !== id);
    this.valueChange.emit({ key: 'custom_extra_attributes', value: JSON.stringify(next) });
  }

  updateCustom(id: string, field: keyof ExtraAttribute, value: string): void {
    const next = this.customAttributes.map((attr) =>
      attr.id === id ? { ...attr, [field]: value } : attr
    );
    this.valueChange.emit({ key: 'custom_extra_attributes', value: JSON.stringify(next) });
  }

  isFilled(key: string): boolean {
    const value = this.values[key];
    return !!value && value.trim() !== '' && Number(value) > 0;
  }
}
