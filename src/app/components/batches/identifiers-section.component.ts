import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface IdentifierConfig {
  key: string;
  label: string;
  placeholder: string;
  description: string;
  group: 'internal' | 'standard' | 'marketplace';
}

const IDENTIFIER_CONFIG: IdentifierConfig[] = [
  {
    key: 'sku',
    label: 'SKU',
    placeholder: 'ABC-12345-XYZ',
    description: 'Your internal Stock Keeping Unit',
    group: 'internal',
  },
  {
    key: 'manufacturer_number',
    label: 'Manufacturer Part Number',
    placeholder: 'MPN-XXXXX',
    description: 'Part number assigned by manufacturer',
    group: 'internal',
  },
  {
    key: 'barcode',
    label: 'Barcode',
    placeholder: '012345678901',
    description: 'Physical barcode on product packaging',
    group: 'standard',
  },
  {
    key: 'gtin',
    label: 'GTIN',
    placeholder: '00012345678905',
    description: 'Global Trade Item Number (8, 12, 13, or 14 digits)',
    group: 'standard',
  },
  {
    key: 'ean',
    label: 'EAN',
    placeholder: '5901234123457',
    description: 'European Article Number (13 digits)',
    group: 'standard',
  },
  {
    key: 'isbn',
    label: 'ISBN',
    placeholder: '978-3-16-148410-0',
    description: 'International Standard Book Number (books only)',
    group: 'standard',
  },
  {
    key: 'asin',
    label: 'ASIN',
    placeholder: 'B08N5WRWNW',
    description: 'Amazon Standard Identification Number',
    group: 'marketplace',
  },
  {
    key: 'fnsku',
    label: 'FNSKU',
    placeholder: 'X001234567',
    description: 'Fulfillment Network SKU for Amazon FBA',
    group: 'marketplace',
  },
];

const GROUP_LABELS: Record<string, { title: string; description: string }> = {
  internal: {
    title: 'Internal Identifiers',
    description: "Your company's product tracking codes",
  },
  standard: {
    title: 'Universal Product Codes',
    description: 'Industry-standard product identifiers',
  },
  marketplace: {
    title: 'Marketplace Identifiers',
    description: 'Platform-specific product codes',
  },
};

@Component({
  selector: 'app-identifiers-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <ng-container *ngFor="let group of groupedKeys">
        <div class="rounded-lg border border-border/50 bg-card">
          <div class="border-b border-border/30 px-4 pb-3 pt-4">
            <div class="text-base font-semibold">{{ groupLabels[group].title }}</div>
            <div class="text-sm text-muted-foreground">{{ groupLabels[group].description }}</div>
          </div>
          <div class="grid gap-4 px-4 pb-4 pt-3 sm:grid-cols-2">
            <div
              *ngFor="let config of groupedIdentifiers[group]"
              class="rounded-lg border p-3 transition-all"
              [ngClass]="
                errors[config.key]
                  ? 'border-destructive bg-destructive/5'
                  : values[config.key]
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border/50 bg-muted/20 hover:bg-muted/40'
              "
            >
              <div class="flex items-start gap-3">
                <div
                  class="flex h-9 w-9 items-center justify-center rounded-lg"
                  [ngClass]="
                    errors[config.key]
                      ? 'bg-destructive/10 text-destructive'
                      : values[config.key]
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                  "
                >
                  #
                </div>
                <div class="min-w-0 flex-1 space-y-1.5">
                  <div class="flex items-center gap-1.5">
                    <label
                      class="text-sm font-medium"
                      [ngClass]="errors[config.key] ? 'text-destructive' : ''"
                      [attr.for]="config.key"
                    >
                      {{ config.label }}
                    </label>
                    <span
                      class="text-xs text-muted-foreground"
                      [attr.data-tooltip]="config.description"
                      data-tooltip-position="top"
                    >
                      ?
                    </span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <input
                      [id]="config.key"
                      class="h-8 flex-1 rounded-md border border-border bg-background px-2 text-sm font-mono"
                      [class.border-destructive]="errors[config.key]"
                      [ngModel]="values[config.key] || ''"
                      (ngModelChange)="valueChange.emit({ key: config.key, value: $event })"
                      [placeholder]="config.placeholder"
                    />
                    <button
                      type="button"
                      class="h-8 w-8 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground"
                      [disabled]="!(values[config.key] || '')"
                      (click)="copy(config.key, values[config.key] || '')"
                      [attr.data-tooltip]="'Copy to clipboard'"
                      data-tooltip-position="top"
                    >
                      {{ copiedKey === config.key ? 'OK' : 'Copy' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <div class="flex items-start gap-2 rounded-lg border border-border/30 bg-muted/30 p-3 text-xs text-muted-foreground">
        <span>?</span>
        <div>
          <span class="font-medium">Tip:</span> Most marketplaces require at least one universal product code (GTIN, EAN, or ISBN) for product listing. Amazon FBA products need an FNSKU for warehouse identification.
        </div>
      </div>
    </div>
  `,
})
export class IdentifiersSectionComponent {
  @Input() values: Record<string, string> = {};
  @Input() errors: Record<string, boolean> = {};
  @Output() valueChange = new EventEmitter<{ key: string; value: string }>();
  @Output() notify = new EventEmitter<{ title: string; text: string }>();

  copiedKey: string | null = null;

  get groupLabels(): Record<string, { title: string; description: string }> {
    return GROUP_LABELS;
  }

  get groupedIdentifiers(): Record<string, IdentifierConfig[]> {
    return IDENTIFIER_CONFIG.reduce((acc, config) => {
      if (!acc[config.group]) acc[config.group] = [];
      acc[config.group].push(config);
      return acc;
    }, {} as Record<string, IdentifierConfig[]>);
  }

  get groupedKeys(): Array<'internal' | 'standard' | 'marketplace'> {
    return Object.keys(this.groupedIdentifiers) as Array<'internal' | 'standard' | 'marketplace'>;
  }

  copy(key: string, value: string): void {
    if (!value) return;
    void navigator.clipboard.writeText(value);
    this.copiedKey = key;
    const label = IDENTIFIER_CONFIG.find((item) => item.key === key)?.label ?? key;
    this.notify.emit({ title: 'Copied', text: `${label} copied to clipboard.` });
    setTimeout(() => (this.copiedKey = null), 2000);
  }
}
