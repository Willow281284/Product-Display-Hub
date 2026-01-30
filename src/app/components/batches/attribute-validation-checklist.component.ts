import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AttributeSection, AttributeValidation, SECTION_LABELS } from '@/types/productAttribute';

@Component({
  selector: 'app-attribute-validation-checklist',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex h-full flex-col">
      <div
        class="border-b p-3 transition-all duration-500"
        [ngClass]="isComplete ? 'bg-green-50 dark:bg-green-950/30' : 'bg-muted/30'"
      >
        <div class="mb-2 flex items-center justify-between">
          <h3 class="flex items-center gap-2 text-sm font-semibold">
            Validation Checklist
            <span *ngIf="showCelebration" class="text-green-600">OK</span>
          </h3>
          <span
            class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
            [ngClass]="
              isComplete
                ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                : hasErrors
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            "
          >
            {{ isComplete ? 'Complete!' : completionPercent + '% Complete' }}
          </span>
        </div>

        <div class="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            class="h-2 rounded-full transition-all duration-500"
            [ngClass]="
              isComplete
                ? 'bg-gradient-to-r from-green-400 to-green-600 shadow-[0_0_10px_rgba(34,197,94,0.5)]'
                : hasErrors
                  ? 'bg-destructive'
                  : 'bg-green-500'
            "
            [style.width.%]="completionPercent"
          ></div>
        </div>

        <div class="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span class="flex items-center gap-1" [ngClass]="isComplete ? 'text-green-600 font-medium' : ''">
            <svg viewBox="0 0 24 24" class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            {{ completedRequired }} required complete
          </span>
          <span *ngIf="hasErrors" class="flex items-center gap-1 text-destructive">
            <svg viewBox="0 0 24 24" class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
            {{ totalRequired - completedRequired }} missing
          </span>
        </div>
      </div>

      <div class="flex-1 overflow-auto">
        <div class="space-y-3 p-2">
          <ng-container *ngFor="let section of sectionKeys">
            <ng-container *ngIf="sectionItems(section).length > 0">
              <div class="space-y-1">
                <div class="flex items-center gap-2 px-2">
                  <span
                    class="inline-flex h-4 w-4 items-center justify-center rounded-full"
                    [ngClass]="sectionStatusClass(section)"
                  ></span>
                  <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {{ sectionLabels[section] }}
                  </span>
                </div>
                <div class="space-y-0.5">
                  <button
                    *ngFor="let item of sectionItems(section)"
                    type="button"
                    class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-all duration-300 hover:bg-muted/50"
                    [ngClass]="itemRowClass(item)"
                    (click)="attributeClick.emit(item.key)"
                  >
                    <span class="shrink-0">
                      <svg
                        *ngIf="item.isValid"
                        viewBox="0 0 24 24"
                        class="h-4 w-4 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      <svg
                        *ngIf="!item.isValid && item.isMissing"
                        viewBox="0 0 24 24"
                        class="h-4 w-4 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path d="M18 6L6 18" />
                        <path d="M6 6l12 12" />
                      </svg>
                      <svg
                        *ngIf="!item.isValid && !item.isMissing"
                        viewBox="0 0 24 24"
                        class="h-4 w-4 text-yellow-600"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4" />
                        <path d="M12 16h.01" />
                      </svg>
                    </span>
                    <span
                      class="flex-1 truncate"
                      [ngClass]="item.isMissing ? 'text-destructive' : item.isValid ? 'text-green-700 dark:text-green-400' : ''"
                    >
                      {{ item.name }}<span *ngIf="item.isRequired" class="text-destructive"> *</span>
                    </span>
                  </button>
                </div>
              </div>
            </ng-container>
          </ng-container>
        </div>
      </div>
    </div>
  `,
})
export class AttributeValidationChecklistComponent {
  @Input() validations: AttributeValidation[] = [];
  @Output() attributeClick = new EventEmitter<string>();

  showCelebration = false;
  private wasComplete = false;

  get sectionLabels(): Record<AttributeSection, string> {
    return SECTION_LABELS;
  }

  get sectionKeys(): AttributeSection[] {
    return Object.keys(SECTION_LABELS) as AttributeSection[];
  }

  get totalRequired(): number {
    return this.validations.filter((item) => item.isRequired).length;
  }

  get completedRequired(): number {
    return this.validations.filter((item) => item.isRequired && item.isValid).length;
  }

  get isComplete(): boolean {
    return this.totalRequired > 0 && this.completedRequired === this.totalRequired;
  }

  get hasErrors(): boolean {
    return this.validations.some((item) => item.isMissing);
  }

  get completionPercent(): number {
    return this.totalRequired > 0 ? Math.round((this.completedRequired / this.totalRequired) * 100) : 100;
  }

  sectionItems(section: AttributeSection): AttributeValidation[] {
    return this.validations.filter((item) => item.section === section);
  }

  sectionStatusClass(section: AttributeSection): string {
    const items = this.sectionItems(section);
    const hasRequired = items.some((item) => item.isRequired);
    const requiredValid = items.filter((item) => item.isRequired).every((item) => item.isValid);
    if (!hasRequired) return 'bg-muted';
    return requiredValid ? 'bg-green-500' : 'bg-yellow-500';
  }

  itemRowClass(item: AttributeValidation): string {
    if (item.isMissing) return 'bg-red-50 dark:bg-red-950/30';
    if (!item.isValid) return 'bg-yellow-50 dark:bg-yellow-950/30';
    return 'bg-green-50/50 dark:bg-green-950/20';
  }

  ngDoCheck(): void {
    if (this.isComplete && !this.wasComplete) {
      this.showCelebration = true;
      setTimeout(() => (this.showCelebration = false), 2000);
    }
    this.wasComplete = this.isComplete;
  }
}
