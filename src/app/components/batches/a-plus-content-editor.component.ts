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
      <div class="flex items-center justify-between text-sm">
        <div>
          <p class="font-semibold">A+ Content Modules</p>
          <p class="text-xs text-muted-foreground">Add rich content blocks to enhance your product listing</p>
        </div>
        <span class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
          {{ modules.length }} module{{ modules.length === 1 ? '' : 's' }}
        </span>
      </div>

      <div *ngFor="let module of modules; let i = index" class="rounded-xl border border-border bg-card p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 text-sm font-semibold">
            <span class="text-muted-foreground">||</span>
            <span class="text-primary">{{ module.type === 'text' ? 'T' : '' }}</span>
            <span class="capitalize">{{ moduleLabel(module.type) }}</span>
            <span class="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
              #{{ i + 1 }}
            </span>
          </div>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
            (click)="removeModule(module.id)"
            title="Remove"
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>

        <ng-container *ngIf="module.type === 'text'">
          <textarea
            rows="3"
            class="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder="Enter your text content here..."
            [ngModel]="module.content"
            (ngModelChange)="updateModule(module.id, { content: $event })"
          ></textarea>
        </ng-container>

        <ng-container *ngIf="module.type !== 'text'">
          <div class="mt-3 flex flex-wrap items-center gap-3">
            <input
              type="file"
              class="hidden"
              [id]="'file-' + module.id"
              (change)="handleFileUpload(module.id, $event)"
            />
            <button
              type="button"
              class="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted"
              (click)="triggerFile(module.id)"
            >
              Upload File
            </button>
            <span class="text-xs text-muted-foreground">or</span>
            <div class="flex-1">
              <input
                type="text"
                class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="Paste URL..."
                [ngModel]="module.content"
                (ngModelChange)="updateModule(module.id, { content: $event })"
              />
            </div>
          </div>
          <input
            type="text"
            class="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder="Add a caption (optional)"
            [ngModel]="module.caption || ''"
            (ngModelChange)="updateModule(module.id, { caption: $event })"
          />
        </ng-container>
      </div>

      <div class="relative">
        <div
          *ngIf="showModulePicker"
          class="absolute bottom-full left-0 mb-3 w-full rounded-xl border border-border bg-card p-4 shadow-xl"
        >
          <div class="grid gap-4 md:grid-cols-2">
            <button
              type="button"
              class="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm font-semibold hover:bg-muted"
              (click)="addModule('text')"
            >
              <span class="text-primary">T</span>
              Text Block
            </button>
            <button
              type="button"
              class="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm font-semibold hover:bg-muted"
              (click)="addModule('image')"
            >
              <svg viewBox="0 0 24 24" class="h-4 w-4 text-primary" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <path d="m21 15-5-5L5 21"></path>
              </svg>
              Image
            </button>
            <button
              type="button"
              class="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm font-semibold hover:bg-muted"
              (click)="addModule('video')"
            >
              <svg viewBox="0 0 24 24" class="h-4 w-4 text-primary" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
              </svg>
              Video
            </button>
            <button
              type="button"
              class="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm font-semibold hover:bg-muted"
              (click)="addModule('pdf')"
            >
              <svg viewBox="0 0 24 24" class="h-4 w-4 text-primary" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              PDF Document
            </button>
            <button
              type="button"
              class="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm font-semibold hover:bg-muted"
              (click)="addModule('file')"
            >
              <svg viewBox="0 0 24 24" class="h-4 w-4 text-primary" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              Other File
            </button>
          </div>
        </div>

        <button
          type="button"
          class="w-full rounded-xl border border-border bg-background py-3 text-sm font-semibold text-muted-foreground hover:bg-muted"
          (click)="toggleModulePicker()"
        >
          + Add Module
        </button>
      </div>
    </div>
  `,
})
export class APlusContentEditorComponent {
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();

  modules: ContentModule[] = [];
  showModulePicker = false;

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
    this.showModulePicker = false;
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

  toggleModulePicker(): void {
    this.showModulePicker = !this.showModulePicker;
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
