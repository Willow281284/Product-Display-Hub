import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface ContentModule {
  id: string;
  type: 'text' | 'image' | 'video' | 'pdf' | 'file';
  content: string;
  caption?: string;
  filename?: string;
}

const MODULE_TYPES: Array<{ type: ContentModule['type']; label: string }> = [
  { type: 'text', label: 'Text Block' },
  { type: 'image', label: 'Image' },
  { type: 'video', label: 'Video' },
  { type: 'pdf', label: 'PDF Document' },
  { type: 'file', label: 'Other File' },
];

@Component({
  selector: 'app-a-plus-content-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h4 class="font-medium">A+ Content Modules</h4>
          <p class="text-sm text-muted-foreground">Add rich content blocks to enhance your product listing</p>
        </div>
        <span class="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">
          {{ modules.length }} module{{ modules.length !== 1 ? 's' : '' }}
        </span>
      </div>

      <div class="rounded-lg border border-border/50 bg-muted/20 p-3">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs text-muted-foreground">Add module:</span>
          <button
            *ngFor="let type of moduleTypes"
            type="button"
            class="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            (click)="addModule(type.type)"
          >
            {{ type.label }}
          </button>
        </div>
      </div>

      <div class="max-h-[400px] space-y-3 overflow-auto pr-2">
        <div *ngFor="let module of modules; let i = index" class="rounded-lg border border-border/50 bg-card">
          <div class="flex items-center justify-between border-b border-border/30 px-4 py-3">
            <div class="text-sm font-medium">
              {{ moduleLabel(module.type) }}
              <span class="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">#{{ i + 1 }}</span>
            </div>
            <button type="button" class="text-xs text-destructive" (click)="removeModule(module.id)">Remove</button>
          </div>
          <div class="space-y-3 px-4 pb-4 pt-3">
            <textarea
              *ngIf="module.type === 'text'"
              class="min-h-[100px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              [ngModel]="module.content"
              (ngModelChange)="updateModule(module.id, { content: $event })"
              placeholder="Enter your text content here..."
            ></textarea>

            <div *ngIf="module.type !== 'text'" class="space-y-3">
              <div class="rounded-lg border border-border/50 bg-muted/30 p-3">
                <div *ngIf="module.content; else noPreview">
                  <img
                    *ngIf="module.type === 'image'"
                    [src]="module.content"
                    class="mx-auto max-h-[150px] rounded-lg object-contain"
                    alt="A+ content image"
                  />
                  <video *ngIf="module.type === 'video'" [src]="module.content" controls class="mx-auto max-h-[150px] rounded-lg"></video>
                  <div *ngIf="module.type === 'pdf' || module.type === 'file'" class="text-sm text-muted-foreground">
                    {{ module.filename || 'File attached' }}
                  </div>
                </div>
                <ng-template #noPreview>
                  <div class="text-xs text-muted-foreground">No preview yet</div>
                </ng-template>
              </div>

              <div class="flex items-center gap-2">
                <input
                  type="file"
                  class="hidden"
                  [id]="'file-' + module.id"
                  (change)="handleFileUpload(module.id, $event)"
                />
                <button
                  type="button"
                  class="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
                  (click)="triggerFile(module.id)"
                >
                  Upload File
                </button>
                <span class="text-xs text-muted-foreground">or</span>
                <input
                  class="flex-1 rounded-md border border-border bg-background px-3 py-2 text-xs"
                  [ngModel]="module.content"
                  (ngModelChange)="updateModule(module.id, { content: $event })"
                  placeholder="Paste URL"
                />
              </div>
              <input
                class="w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
                [ngModel]="module.caption || ''"
                (ngModelChange)="updateModule(module.id, { caption: $event })"
                placeholder="Caption (optional)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class APlusContentEditorComponent {
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();

  moduleTypes = MODULE_TYPES;
  modules: ContentModule[] = [];

  ngOnChanges(): void {
    this.modules = this.parseModules(this.value);
  }

  parseModules(value: string): ContentModule[] {
    try {
      return value ? (JSON.parse(value) as ContentModule[]) : [];
    } catch {
      return [];
    }
  }

  emitModules(modules: ContentModule[]): void {
    this.modules = modules;
    this.valueChange.emit(JSON.stringify(modules));
  }

  addModule(type: ContentModule['type']): void {
    const next: ContentModule = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      content: '',
      caption: '',
    };
    this.emitModules([...this.modules, next]);
  }

  removeModule(id: string): void {
    this.emitModules(this.modules.filter((module) => module.id !== id));
  }

  updateModule(id: string, updates: Partial<ContentModule>): void {
    this.emitModules(this.modules.map((module) => (module.id === id ? { ...module, ...updates } : module)));
  }

  moduleLabel(type: ContentModule['type']): string {
    return MODULE_TYPES.find((item) => item.type === type)?.label ?? 'Module';
  }

  triggerFile(id: string): void {
    const input = document.getElementById(`file-${id}`) as HTMLInputElement | null;
    input?.click();
  }

  handleFileUpload(id: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    this.updateModule(id, { content: url, filename: file.name });
    input.value = '';
  }
}
