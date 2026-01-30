import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BatchItem } from '@/types/batch';
import {
  AttributeSection,
  AttributeValidation,
  CategoryAttribute,
  ProductCategory,
  SECTION_LABELS,
} from '@/types/productAttribute';
import { InventoryPricingSectionComponent } from './inventory-pricing-section.component';
import { IdentifiersSectionComponent } from './identifiers-section.component';
import { VariationsSectionComponent, ChildVariation } from './variations-section.component';
import { ExtraAttributesSectionComponent } from './extra-attributes-section.component';
import { AttributeValidationChecklistComponent } from './attribute-validation-checklist.component';
import { VariationPickerViewComponent } from './variation-picker-view.component';
import { APlusContentEditorComponent } from './a-plus-content-editor.component';

const MOCK_CATEGORIES: ProductCategory[] = [
  { id: 'cat-electronics', name: 'Electronics', parent_id: null, marketplace: 'amazon', created_at: '2026-01-01' },
  { id: 'cat-home', name: 'Home & Kitchen', parent_id: null, marketplace: 'amazon', created_at: '2026-01-01' },
];

const MOCK_CATEGORY_ATTRIBUTES: Record<string, CategoryAttribute[]> = {
  'cat-electronics': [
    {
      id: 'attr-title',
      category_id: 'cat-electronics',
      attribute_name: 'Title',
      attribute_key: 'title',
      attribute_type: 'text',
      is_required: true,
      validation_rules: null,
      display_order: 1,
      section: 'basic',
      placeholder: 'Enter product title',
      help_text: 'Short, descriptive title.',
      created_at: '2026-01-01',
    },
    {
      id: 'attr-brand',
      category_id: 'cat-electronics',
      attribute_name: 'Brand',
      attribute_key: 'brand',
      attribute_type: 'text',
      is_required: true,
      validation_rules: null,
      display_order: 2,
      section: 'basic',
      placeholder: 'Brand name',
      help_text: 'Manufacturer brand name.',
      created_at: '2026-01-01',
    },
    {
      id: 'attr-description',
      category_id: 'cat-electronics',
      attribute_name: 'Description',
      attribute_key: 'description',
      attribute_type: 'multiline',
      is_required: true,
      validation_rules: null,
      display_order: 3,
      section: 'description',
      placeholder: 'Detailed product description',
      help_text: 'Provide a clear product description.',
      created_at: '2026-01-01',
    },
    {
      id: 'attr-bullets',
      category_id: 'cat-electronics',
      attribute_name: 'Bullet Points',
      attribute_key: 'bullet_points',
      attribute_type: 'bullet_points',
      is_required: false,
      validation_rules: null,
      display_order: 4,
      section: 'description',
      placeholder: 'Key features (one per line)',
      help_text: 'Add short bullet points.',
      created_at: '2026-01-01',
    },
    {
      id: 'attr-main-image',
      category_id: 'cat-electronics',
      attribute_name: 'Main Image',
      attribute_key: 'main_image',
      attribute_type: 'image',
      is_required: true,
      validation_rules: null,
      display_order: 5,
      section: 'images',
      placeholder: 'Paste image URL',
      help_text: 'Primary product image.',
      created_at: '2026-01-01',
    },
    {
      id: 'attr-gallery',
      category_id: 'cat-electronics',
      attribute_name: 'Gallery Images',
      attribute_key: 'gallery_images',
      attribute_type: 'image',
      is_required: false,
      validation_rules: null,
      display_order: 6,
      section: 'images',
      placeholder: 'Paste image URLs',
      help_text: 'Additional product images.',
      created_at: '2026-01-01',
    },
    {
      id: 'attr-price',
      category_id: 'cat-electronics',
      attribute_name: 'Price',
      attribute_key: 'price',
      attribute_type: 'number',
      is_required: true,
      validation_rules: null,
      display_order: 7,
      section: 'pricing',
      placeholder: '0.00',
      help_text: 'Retail price',
      created_at: '2026-01-01',
    },
    {
      id: 'attr-qty',
      category_id: 'cat-electronics',
      attribute_name: 'Quantity',
      attribute_key: 'quantity',
      attribute_type: 'number',
      is_required: true,
      validation_rules: null,
      display_order: 8,
      section: 'inventory',
      placeholder: '0',
      help_text: 'Available quantity',
      created_at: '2026-01-01',
    },
    {
      id: 'attr-gtin',
      category_id: 'cat-electronics',
      attribute_name: 'GTIN',
      attribute_key: 'gtin',
      attribute_type: 'text',
      is_required: true,
      validation_rules: null,
      display_order: 9,
      section: 'identifiers',
      placeholder: '00012345678905',
      help_text: 'Universal product code',
      created_at: '2026-01-01',
    },
    {
      id: 'attr-asin',
      category_id: 'cat-electronics',
      attribute_name: 'ASIN',
      attribute_key: 'asin',
      attribute_type: 'text',
      is_required: false,
      validation_rules: null,
      display_order: 10,
      section: 'identifiers',
      placeholder: 'B08N5WRWNW',
      help_text: 'Amazon Standard ID',
      created_at: '2026-01-01',
    },
    {
      id: 'attr-aplus',
      category_id: 'cat-electronics',
      attribute_name: 'A+ Content',
      attribute_key: 'aplus_content',
      attribute_type: 'aplus_content',
      is_required: false,
      validation_rules: null,
      display_order: 11,
      section: 'description',
      placeholder: '',
      help_text: 'Rich content modules.',
      created_at: '2026-01-01',
    },
  ],
  'cat-home': [
    {
      id: 'attr-title-home',
      category_id: 'cat-home',
      attribute_name: 'Title',
      attribute_key: 'title',
      attribute_type: 'text',
      is_required: true,
      validation_rules: null,
      display_order: 1,
      section: 'basic',
      placeholder: 'Enter product title',
      help_text: 'Short, descriptive title.',
      created_at: '2026-01-01',
    },
    {
      id: 'attr-description-home',
      category_id: 'cat-home',
      attribute_name: 'Description',
      attribute_key: 'description',
      attribute_type: 'multiline',
      is_required: true,
      validation_rules: null,
      display_order: 2,
      section: 'description',
      placeholder: 'Detailed product description',
      help_text: 'Provide a clear product description.',
      created_at: '2026-01-01',
    },
    {
      id: 'attr-image-home',
      category_id: 'cat-home',
      attribute_name: 'Main Image',
      attribute_key: 'main_image',
      attribute_type: 'image',
      is_required: true,
      validation_rules: null,
      display_order: 3,
      section: 'images',
      placeholder: 'Paste image URL',
      help_text: 'Primary product image.',
      created_at: '2026-01-01',
    },
  ],
};

@Component({
  selector: 'app-product-attribute-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InventoryPricingSectionComponent,
    IdentifiersSectionComponent,
    VariationsSectionComponent,
    ExtraAttributesSectionComponent,
    AttributeValidationChecklistComponent,
    VariationPickerViewComponent,
    APlusContentEditorComponent,
  ],
  template: `
    <div *ngIf="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" (click)="close()">
      <div
        class="flex h-[98vh] w-[98vw] max-w-[98vw] flex-col overflow-hidden rounded-xl bg-background shadow-xl"
        (click)="$event.stopPropagation()"
      >
        <ng-container *ngIf="showPicker; else editorView">
          <app-variation-picker-view
            [currentItem]="item!"
            [variations]="childVariations"
            [masterProductId]="masterProductId"
            [isLoading]="isLoadingVariations"
            (selectVariationId)="handleVariationSelect($event)"
            (editCurrent)="showVariationPicker = false"
          ></app-variation-picker-view>
        </ng-container>

        <ng-template #editorView>
          <div class="border-b border-border px-6 py-4">
            <div class="flex items-center justify-between gap-4">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <button
                    *ngIf="hasVariations"
                    type="button"
                    class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 mr-2 gap-1"
                    (click)="showVariationPicker = true"
                  >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4"><path d="M15 18l-6-6 6-6"></path></svg>
                    All Variations
                  </button>
                  <span
                    class="inline-flex h-6 w-6 items-center justify-center rounded-full"
                    [ngClass]="item?.status === 'failed' ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-400'"
                  >
                    {{ item?.status === 'failed' ? '!' : 'OK' }}
                  </span>
                  <h3 class="text-lg font-semibold">
                    {{ isLive ? 'Edit Live Product' : 'Fix Error & Update Attributes' }}
                  </h3>
                </div>
                <p class="mt-1 text-xs text-muted-foreground">
                  {{ isLive ? 'Update product attributes and sync changes to marketplace' : 'Fill in required attributes highlighted in red, then retry the listing' }}
                </p>
              </div>
              <div class="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">
                {{ item?.marketplace }}
              </div>
            </div>

            <div *ngIf="item?.error_message" class="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
              <div class="flex items-start gap-2">
                <span class="text-destructive">!</span>
                <div class="text-sm">
                  <p class="font-medium text-destructive">Error Message</p>
                  <p class="mt-1 text-muted-foreground">{{ item?.error_message }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="relative flex flex-1 overflow-hidden">
            <div class="flex flex-1 flex-col overflow-hidden">
              <div class="border-b border-border bg-muted/30 px-6 py-3">
                <div class="flex flex-wrap items-center gap-4">
                  <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 shrink-0">Product Category:</label>
                  <div class="flex items-center gap-2">
                    <select
                      class="h-9 w-64 rounded-md border border-border bg-background px-3 text-sm"
                      [(ngModel)]="selectedCategoryId"
                      (ngModelChange)="handleCategoryChange($event)"
                    >
                      <option *ngFor="let category of categories" [value]="category.id">
                        {{ category.name }}
                      </option>
                    </select>
                    <button
                      type="button"
                      class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 gap-1.5"
                      [disabled]="isSuggestingCategory"
                      (click)="handleAIAutoFill()"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkles w-4 h-4"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path><path d="M20 3v4"></path><path d="M22 5h-4"></path><path d="M4 17v2"></path><path d="M5 18H3"></path></svg>  
                    {{ isSuggestingCategory ? 'Working...' : 'AI Auto-Fill' }}
                    </button>
                  </div>
                  <button
                    *ngIf="hasErrors"
                    type="button"
                    class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 ml-auto cursor-pointer hover:opacity-80 transition-opacity"
                    [ngClass]="showOnlyMissing ? 'bg-primary text-primary-foreground' : 'bg-destructive/80 text-destructive'"
                    (click)="showOnlyMissing = !showOnlyMissing"
                  >
                    {{ showOnlyMissing ? 'Show All Fields' : missingCount + ' required fields missing (click to filter)' }}
                  </button>
                </div>
              </div>

              <div class="flex-1 overflow-auto">
                <div class="mx-6 mt-3 rounded-full bg-muted/40 px-2 py-1 shadow-inner">
                  <div class="flex flex-wrap items-center gap-2">
                    <ng-container *ngFor="let section of sectionKeys">
                      <button
                        *ngIf="shouldShowSection(section)"
                        type="button"
                        class="relative rounded-full px-3 py-1 text-xs font-semibold transition-colors"
                        [ngClass]="activeSection === section
                          ? 'bg-background text-foreground shadow'
                          : sectionHasErrors(section)
                            ? 'text-destructive'
                            : 'text-muted-foreground hover:text-foreground'"
                        (click)="activeSection = section"
                      >
                        {{ sectionLabels[section] }}
                        <span
                          *ngIf="sectionHasErrors(section)"
                          class="absolute -top-1 right-1 h-2 w-2 rounded-full bg-destructive"
                        ></span>
                      </button>
                    </ng-container>
                  </div>
                </div>

                <div class="flex-1 overflow-auto px-6 py-4">
                  <ng-container *ngIf="activeSection === 'inventory_pricing'">
                    <app-inventory-pricing-section
                      [values]="attributeValues"
                      [errors]="errorMap"
                      (valueChange)="handleValueChange($event.key, $event.value)"
                    ></app-inventory-pricing-section>
                  </ng-container>

                  <ng-container *ngIf="activeSection === 'identifiers'">
                    <app-identifiers-section
                      [values]="attributeValues"
                      [errors]="errorMap"
                      (valueChange)="handleValueChange($event.key, $event.value)"
                      (notify)="showToast($event.title, $event.text)"
                    ></app-identifiers-section>
                  </ng-container>

                  <ng-container *ngIf="activeSection === 'variations'">
                    <app-variations-section
                      [values]="attributeValues"
                      [errors]="errorMap"
                      [childVariations]="childVariations"
                      (valueChange)="handleValueChange($event.key, $event.value)"
                      (variationClick)="handleVariationSelect($event)"
                    ></app-variations-section>
                  </ng-container>

                  <ng-container *ngIf="activeSection === 'extra_attributes'">
                    <app-extra-attributes-section
                      [values]="attributeValues"
                      [errors]="errorMap"
                      (valueChange)="handleValueChange($event.key, $event.value)"
                    ></app-extra-attributes-section>
                  </ng-container>

                  <ng-container *ngIf="isStandardSection(activeSection)">
                    <div class="grid gap-4">
                      <ng-container *ngFor="let attr of attributesBySection[activeSection] || []">
                        <ng-container *ngIf="!showOnlyMissing || errorMap[attr.attribute_key]">
                          <div
                            class="space-y-2 rounded-lg border p-3"
                            [ngClass]="errorMap[attr.attribute_key] ? 'border-destructive bg-destructive/5' : 'border-transparent'"
                            [attr.id]="'attr-' + attr.attribute_key"
                          >
                            <div class="flex items-center gap-2">
                              <label
                                class="text-sm font-medium"
                                [ngClass]="errorMap[attr.attribute_key] ? 'text-destructive' : ''"
                              >
                                {{ attr.attribute_name }}<span *ngIf="attr.is_required" class="text-destructive"> *</span>
                              </label>
                              <span
                                *ngIf="attr.help_text"
                                class="text-xs text-muted-foreground"
                                [attr.data-tooltip]="attr.help_text"
                                data-tooltip-position="top"
                              >
                                ?
                              </span>
                            </div>

                            <app-a-plus-content-editor
                              *ngIf="attr.attribute_type === 'aplus_content'"
                              [value]="attributeValues[attr.attribute_key] || ''"
                              (valueChange)="handleValueChange(attr.attribute_key, $event)"
                            ></app-a-plus-content-editor>

                            <textarea
                              *ngIf="attr.attribute_type === 'multiline' || attr.attribute_type === 'bullet_points'"
                              class="min-h-[96px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                              [class.border-destructive]="errorMap[attr.attribute_key]"
                              [ngModel]="attributeValues[attr.attribute_key] || ''"
                              (ngModelChange)="handleValueChange(attr.attribute_key, $event)"
                              [placeholder]="attr.placeholder || ''"
                            ></textarea>

                            <div *ngIf="attr.attribute_type === 'image'" class="space-y-3">
                              <div class="flex flex-wrap gap-2">
                                <ng-container *ngFor="let url of imageValues(attr.attribute_key); let i = index">
                                  <div class="relative h-24 w-24 overflow-hidden rounded-lg border bg-muted">
                                    <img [src]="url" class="h-full w-full object-cover" alt="preview" />
                                    <button
                                      type="button"
                                      class="absolute right-1 top-1 rounded-full bg-destructive px-2 py-1 text-xs text-destructive-foreground"
                                      (click)="removeImage(attr.attribute_key, i)"
                                    >
                                      x
                                    </button>
                                  </div>
                                </ng-container>
                              </div>
                              <div class="flex flex-wrap items-center gap-2">
                                <input
                                  type="file"
                                  class="hidden"
                                  [id]="'file-' + attr.attribute_key"
                                  (change)="handleImageFile(attr.attribute_key, $event)"
                                />
                                <button
                                  type="button"
                                  class="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
                                  (click)="triggerImageUpload(attr.attribute_key)"
                                >
                                  Add Images
                                </button>
                                <span class="text-xs text-muted-foreground">or</span>
                                <input
                                  class="flex-1 rounded-md border border-border bg-background px-3 py-2 text-xs"
                                  [placeholder]="attr.placeholder || 'Paste image URL'"
                                  (keydown.enter)="handleImageUrlEnter(attr.attribute_key, $event)"
                                />
                                <button
                                  type="button"
                                  class="rounded-md border border-border px-2 py-2 text-xs text-muted-foreground hover:text-foreground"
                                  (click)="handleImageUrlButton(attr.attribute_key)"
                                >
                                  Add URL
                                </button>
                              </div>
                            </div>

                            <select
                              *ngIf="attr.attribute_type === 'select'"
                              class="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                              [class.border-destructive]="errorMap[attr.attribute_key]"
                              [ngModel]="attributeValues[attr.attribute_key] || ''"
                              (ngModelChange)="handleValueChange(attr.attribute_key, $event)"
                            >
                              <option value="">Select...</option>
                              <option value="new">New</option>
                              <option value="used">Used</option>
                              <option value="refurbished">Refurbished</option>
                            </select>

                            <input
                              *ngIf="attr.attribute_type !== 'multiline'
                                && attr.attribute_type !== 'bullet_points'
                                && attr.attribute_type !== 'image'
                                && attr.attribute_type !== 'select'
                                && attr.attribute_type !== 'aplus_content'"
                              [type]="attr.attribute_type === 'number' ? 'number' : 'text'"
                              class="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                              [class.border-destructive]="errorMap[attr.attribute_key]"
                              [ngModel]="attributeValues[attr.attribute_key] || ''"
                              (ngModelChange)="handleValueChange(attr.attribute_key, $event)"
                              [placeholder]="attr.placeholder || ''"
                            />

                            <p *ngIf="errorMap[attr.attribute_key]" class="text-xs text-destructive">
                              Required field
                            </p>
                          </div>
                        </ng-container>
                      </ng-container>
                    </div>
                  </ng-container>
                </div>
              </div>
            </div>

            <div class="w-72 shrink-0 overflow-hidden border-l bg-muted/20">
              <app-attribute-validation-checklist
                [validations]="validations"
                (attributeClick)="scrollToAttribute($event)"
              ></app-attribute-validation-checklist>
            </div>
          </div>

          <div class="border-t border-border px-6 py-4">
            <div class="flex items-center justify-end gap-2">
              <button
                type="button"
                class="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                (click)="close()"
              >
                Cancel
              </button>
              <button
                *ngIf="isLive"
                type="button"
                class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                [disabled]="isSaving"
                (click)="handleSaveOnly()"
              >
                {{ isSaving ? 'Saving...' : 'Save & Sync to Marketplace' }}
              </button>
              <button
                *ngIf="!isLive"
                type="button"
                class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                [disabled]="isSaving || hasErrors"
                (click)="handleSaveAndRetry()"
              >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-save w-4 h-4 mr-2"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"></path><path d="M7 3v4a1 1 0 0 0 1 1h7"></path></svg>  
              {{ isSaving ? 'Saving...' : 'Save & Retry Listing' }}
              </button>
            </div>
          </div>
        </ng-template>

        <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
          <div
            *ngFor="let toast of toastMessages"
            class="min-w-[220px] rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground shadow-lg"
          >
            <p class="text-sm font-semibold">{{ toast.title }}</p>
            <p class="text-xs text-muted-foreground">{{ toast.text }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ProductAttributeEditorComponent implements OnChanges {
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() item: BatchItem | null = null;
  @Input() batchId?: string;
  @Input() batchItems: BatchItem[] = [];
  @Input() open = false;
  @Output() openChange = new EventEmitter<boolean>();
  @Output() saveAndRetry = new EventEmitter<{
    itemId: string;
    updates: {
      product_name: string;
      product_sku: string | null;
      stock_qty: number | null;
      sale_price: number | null;
      profit_margin: number | null;
    };
  }>();
  @Output() navigateToItem = new EventEmitter<string>();

  categories = MOCK_CATEGORIES;
  categoryAttributes: CategoryAttribute[] = [];
  attributesBySection: Record<AttributeSection, CategoryAttribute[]> = {} as Record<AttributeSection, CategoryAttribute[]>;

  selectedCategoryId = '';
  attributeValues: Record<string, string> = {};
  activeSection: AttributeSection = 'basic';
  showOnlyMissing = false;
  isSuggestingCategory = false;
  isSaving = false;
  toastMessages: Array<{ id: number; title: string; text: string }> = [];
  private toastId = 0;

  showVariationPicker = false;
  childVariations: ChildVariation[] = [];
  isLoadingVariations = false;
  masterProductId: string | null = null;

  private lastItemId: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.open) {
      this.lastItemId = null;
      this.showVariationPicker = false;
      return;
    }
    if (this.item && this.item.id !== this.lastItemId) {
      this.initializeItem(this.item);
    }
    if (!this.selectedCategoryId) {
      this.selectedCategoryId = this.categories[0]?.id || '';
    }
    this.updateCategoryAttributes();
  }

  get sectionLabels(): Record<AttributeSection, string> {
    return SECTION_LABELS;
  }

  get sectionKeys(): AttributeSection[] {
    return Object.keys(SECTION_LABELS) as AttributeSection[];
  }

  get isLive(): boolean {
    return this.item?.status === 'success';
  }

  get validations(): AttributeValidation[] {
    return this.categoryAttributes.map((attr) => {
      const section = this.mapSection(attr.section);
      const value = this.attributeValues[attr.attribute_key] || '';
      const isMissing = attr.is_required && value.trim() === '';
      return {
        key: attr.attribute_key,
        name: attr.attribute_name,
        isRequired: attr.is_required,
        isValid: !attr.is_required || value.trim().length > 0,
        isMissing,
        message: isMissing ? 'Required field' : null,
        section,
      };
    });
  }

  get errorMap(): Record<string, boolean> {
    return this.validations.reduce((acc, item) => {
      if (item.isMissing) acc[item.key] = true;
      return acc;
    }, {} as Record<string, boolean>);
  }

  get hasErrors(): boolean {
    return this.validations.some((item) => item.isMissing);
  }

  get missingCount(): number {
    return this.validations.filter((item) => item.isMissing).length;
  }

  get hasVariations(): boolean {
    return this.childVariations.length > 0;
  }

  get showPicker(): boolean {
    return this.showVariationPicker && this.hasVariations;
  }

  handleCategoryChange(categoryId: string): void {
    this.selectedCategoryId = categoryId;
    this.updateCategoryAttributes();
  }

  handleAIAutoFill(): void {
    if (!this.item) return;
    this.isSuggestingCategory = true;
    setTimeout(() => {
      this.attributeValues = {
        ...this.attributeValues,
        brand: this.attributeValues['brand'] || 'Acme',
        description: this.attributeValues['description'] || 'AI generated description for the product.',
        bullet_points: this.attributeValues['bullet_points'] || 'Feature 1\nFeature 2\nFeature 3',
      };
      this.isSuggestingCategory = false;
      this.showToast('AI Auto-Fill', 'Suggested category and filled key fields.');
      this.cdr.markForCheck();
    }, 600);
  }

  handleValueChange(key: string, value: string): void {
    this.attributeValues = { ...this.attributeValues, [key]: value };
  }

  handleSaveAndRetry(): void {
    if (!this.item) return;
    this.isSaving = true;
    const updates = {
      product_name: this.attributeValues['title'] || this.item.product_name,
      product_sku: this.attributeValues['sku'] || this.item.product_sku,
      stock_qty: this.attributeValues['quantity'] ? Number(this.attributeValues['quantity']) : this.item.stock_qty,
      sale_price: this.attributeValues['price'] ? Number(this.attributeValues['price']) : this.item.sale_price,
      profit_margin: this.item.profit_margin,
    };
    this.saveAndRetry.emit({ itemId: this.item.id, updates });
    this.isSaving = false;
    this.openChange.emit(false);
  }

  handleSaveOnly(): void {
    this.isSaving = true;
    setTimeout(() => {
      this.isSaving = false;
      this.showToast('Saved', 'Attributes saved and synced.');
      this.openChange.emit(false);
      this.cdr.markForCheck();
    }, 400);
  }

  handleVariationSelect(itemId: string): void {
    this.navigateToItem.emit(itemId);
    this.showVariationPicker = false;
  }

  scrollToAttribute(key: string): void {
    const element = document.getElementById(`attr-${key}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  close(): void {
    this.openChange.emit(false);
  }

  shouldShowSection(section: AttributeSection): boolean {
    const alwaysShow: AttributeSection[] = ['inventory_pricing', 'identifiers', 'variations', 'extra_attributes'];
    if (alwaysShow.includes(section)) return true;
    return (this.attributesBySection[section] || []).length > 0;
  }

  sectionHasErrors(section: AttributeSection): boolean {
    return this.validations.some((item) => item.section === section && item.isMissing);
  }

  isStandardSection(section: AttributeSection): boolean {
    return !['inventory_pricing', 'identifiers', 'variations', 'extra_attributes'].includes(section);
  }

  imageValues(key: string): string[] {
    const value = this.attributeValues[key] || '';
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }

  removeImage(key: string, index: number): void {
    const images = this.imageValues(key);
    const next = images.filter((_, i) => i !== index);
    this.handleValueChange(key, next.join(','));
  }

  triggerImageUpload(key: string): void {
    const input = document.getElementById(`file-${key}`) as HTMLInputElement | null;
    input?.click();
  }

  handleImageFile(key: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files) return;
    const urls = [...this.imageValues(key)];
    Array.from(files).forEach((file) => {
      urls.push(URL.createObjectURL(file));
    });
    this.handleValueChange(key, urls.join(','));
    input.value = '';
  }

  handleImageUrlEnter(key: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.value.trim()) return;
    const urls = [...this.imageValues(key), input.value.trim()];
    this.handleValueChange(key, urls.join(','));
    input.value = '';
  }

  handleImageUrlButton(key: string): void {
    const input = document.querySelector<HTMLInputElement>(`#attr-${key} input[type="text"]`);
    if (input && input.value.trim()) {
      const urls = [...this.imageValues(key), input.value.trim()];
      this.handleValueChange(key, urls.join(','));
      input.value = '';
    }
  }

  showToast(title: string, text: string): void {
    const id = (this.toastId += 1);
    this.toastMessages = [...this.toastMessages, { id, title, text }];
    setTimeout(() => {
      this.toastMessages = this.toastMessages.filter((toast) => toast.id !== id);
      this.cdr.markForCheck();
    }, 2400);
  }

  private initializeItem(item: BatchItem): void {
    this.lastItemId = item.id;
    this.attributeValues = {
      title: item.product_name,
      price: item.sale_price != null ? String(item.sale_price) : '',
      quantity: item.stock_qty != null ? String(item.stock_qty) : '',
      sku: item.product_sku || '',
      gtin: '',
    };
    this.selectedCategoryId = item.category_id || this.categories[0]?.id || '';
    this.activeSection = 'basic';
    this.showOnlyMissing = false;
    this.showVariationPicker = false;
    this.updateCategoryAttributes();
    this.buildChildVariations(item);
  }

  private updateCategoryAttributes(): void {
    this.categoryAttributes = MOCK_CATEGORY_ATTRIBUTES[this.selectedCategoryId] || [];
    this.attributesBySection = this.categoryAttributes.reduce((acc, attr) => {
      const section = this.mapSection(attr.section);
      if (!acc[section]) acc[section] = [];
      acc[section].push(attr);
      return acc;
    }, {} as Record<AttributeSection, CategoryAttribute[]>);
  }

  private mapSection(section: CategoryAttribute['section']): AttributeSection {
    if (section === 'pricing' || section === 'inventory') return 'inventory_pricing';
    return section as AttributeSection;
  }

  private buildChildVariations(item: BatchItem): void {
    const masterId = this.extractMasterProductId(item.product_id);
    this.masterProductId = masterId;
    const siblings = this.batchItems.filter(
      (batchItem) =>
        batchItem.id !== item.id && this.extractMasterProductId(batchItem.product_id) === masterId
    );
    const colors = ['Black', 'Blue', 'Red', 'Green'];
    const sizes = ['S', 'M', 'L', 'XL'];
    this.childVariations = siblings.map((batchItem, index) => ({
      id: batchItem.id,
      name: `${batchItem.product_name} - ${colors[index % colors.length]} / ${sizes[index % sizes.length]}`,
      sku: batchItem.product_sku || '',
      productId: batchItem.product_id,
      variationId: batchItem.product_id,
      image: batchItem.product_image,
      marketplace: batchItem.marketplace,
      attributes: {
        color: colors[index % colors.length],
        size: sizes[index % sizes.length],
      },
      status: batchItem.status as ChildVariation['status'],
      salePrice: batchItem.sale_price,
      stockQty: batchItem.stock_qty,
    }));
  }

  private extractMasterProductId(productId: string): string {
    const simpleMatch = productId.match(/^(\d+)(?:-\d+)?$/);
    if (simpleMatch) return simpleMatch[1];
    const complexMatch = productId.match(/^(.+?)(?:-VAR-\d+|-\d+)$/i);
    if (complexMatch) return complexMatch[1];
    return productId;
  }
}
