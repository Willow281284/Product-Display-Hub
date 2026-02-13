import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TooltipDirective } from '../../directives/tooltip.directive';

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
  imports: [CommonModule, FormsModule, TooltipDirective],
  template: `
    <div class="space-y-6">
      <div class="rounded-lg border border-destructive/30 bg-destructive/5">
        <div class="border-b border-border/30 px-4 pb-3 pt-4">
          <div class="flex items-center gap-2 text-base font-semibold text-destructive">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Required Attributes
            <span class="text-xs font-normal text-muted-foreground">(Weight & Dimensions)</span>
          </div>
        </div>
        <div class="space-y-4 px-4 pb-4 pt-3">
          <div class="flex items-center gap-4">
            <div class="flex w-40 shrink-0 items-center gap-2 text-sm text-muted-foreground">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4 shrink-0"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1.7 8-2 3-.3 6 1.7 8 2h2"/></svg>
              Weight <span class="text-destructive">*</span>
              <span class="inline-flex h-3.5 w-3.5 cursor-help shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground" [appTooltip]="'Product weight for shipping calculations'">?</span>
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
              <span *ngIf="isFilled('product_weight')" class="text-green-600 inline-flex shrink-0"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></span>
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4 shrink-0"><path d="M21 3 6 18"/><path d="M3 21l15-15"/><path d="M3 8V3h5"/><path d="M21 16v5h-5"/><path d="M3 13h5"/><path d="M16 21h5"/></svg>
              Dimensions (L × W × H) <span class="text-destructive">*</span>
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
              <span *ngIf="isFilled('product_length') && isFilled('product_width') && isFilled('product_height')" class="text-green-600 inline-flex shrink-0"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></span>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-lg border border-border/50 bg-card">
        <div class="border-b border-border/30 px-4 pb-3 pt-4">
          <div class="flex items-center gap-2 text-base font-semibold">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4 shrink-0 text-primary"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.27 6.96 12 5.05"/><path d="M16 16.5V12"/><path d="M12 22V12"/></svg>
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
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus w-4 h-4 text-primary"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
              Custom Attributes
              <span class="text-xs font-normal text-muted-foreground">(Add your own)</span>
            </div>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-md border border-primary px-3 py-2 text-sm text-primary hover:bg-primary/10"
              (click)="addCustomAttribute()"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Attribute
            </button>
          </div>
        </div>
        <div class="px-4 pb-4 pt-3">
          <div *ngIf="customAttributes.length === 0" class="py-8 text-center text-muted-foreground">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-8 w-8 mx-auto mb-2 opacity-50"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/></svg>
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
                class="h-9 w-9 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive"
                (click)="removeCustom(attr.id)"
                [appTooltip]="'Remove'"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-start gap-2 rounded-lg border border-border/30 bg-muted/30 p-3 text-xs text-muted-foreground">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4 mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
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
