import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BatchItem, BatchItemStatus, BatchStatus, MarketplaceBatch } from '@/types/batch';
import { ProductAttributeEditorComponent } from '@/app/components/batches/product-attribute-editor.component';

@Component({
  selector: 'app-batch-management-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ProductAttributeEditorComponent],
  template: `
    <section class="flex h-screen flex-col bg-background">
      <header class="border-b border-border bg-card p-4">
        <div class="flex items-center gap-4">
          <a
            routerLink="/"
            class="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back to Products
          </a>
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M12 7v5l4 2" />
              </svg>
            </div>
            <div>
              <h1 class="text-xl font-bold text-foreground">Batch Management</h1>
              <p class="text-sm text-muted-foreground">
                {{ batches.length }} batch{{ batches.length !== 1 ? 'es' : '' }}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div class="flex flex-1 overflow-hidden">
        <aside class="flex w-96 flex-col border-r border-border">
          <div class="border-b border-border bg-muted/30 p-3">
            <h2 class="text-sm font-semibold">All Batches</h2>
          </div>
          <div class="flex-1 overflow-auto">
            <div *ngIf="isLoading" class="p-8 text-center text-muted-foreground">
              <div class="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              Loading batches...
            </div>
            <div *ngIf="!isLoading && batches.length === 0" class="p-8 text-center text-muted-foreground">
              <div class="mx-auto mb-4 h-12 w-12 rounded-full bg-muted/40"></div>
              <p class="font-medium">No batches yet</p>
              <p class="mt-1 text-sm">Select products and click "List to Marketplaces" to create a batch</p>
              <a routerLink="/" class="mt-4 inline-flex rounded-md border border-border px-3 py-2 text-sm">Go to Products</a>
            </div>
            <div *ngIf="!isLoading && batches.length > 0" class="space-y-3 p-3">
              <div
                *ngFor="let batch of batches"
                class="cursor-pointer rounded-xl border border-border bg-card/80 p-4 shadow-sm transition-colors"
                [ngClass]="selectedBatchId === batch.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/40'"
                (click)="selectBatch(batch.id)"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1">
                    <div *ngIf="editingBatchId === batch.id" class="flex items-center gap-2">
                      <input
                        class="h-8 flex-1 rounded-md border border-border bg-background px-2 text-sm"
                        [(ngModel)]="editName"
                        (keydown.enter)="saveBatchName()"
                        (keydown.escape)="cancelEditName()"
                      />
                      <button class="h-8 w-8 rounded-md border border-border text-xs" (click)="saveBatchName()">OK</button>
                      <button class="h-8 w-8 rounded-md border border-border text-xs" (click)="cancelEditName()">X</button>
                    </div>
                    <div *ngIf="editingBatchId !== batch.id" class="flex items-center gap-2">
                      <div class="truncate text-sm font-semibold text-foreground">{{ batch.name }}</div>
                    </div>
                    <div class="text-xs text-muted-foreground">
                      {{ formatDate(batch.created_at) }}
                    </div>
                  </div>
                  <div class="flex items-center gap-1" (click)="$event.stopPropagation()">
                    <button
                      type="button"
                      class="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
                      (click)="startEditName(batch)"
                      title="Edit batch"
                    >
                      <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      class="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-destructive hover:bg-destructive/10"
                      (click)="openDeleteConfirm(batch)"
                      title="Delete batch"
                    >
                      <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18" />
                        <path d="M8 6v14" />
                        <path d="M16 6v14" />
                        <path d="M10 3h4" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="mt-3 flex items-center justify-between">
                  <span
                    class="rounded-full px-2 py-0.5 text-xs font-semibold"
                    [ngClass]="statusBadgeClass(batch.status)"
                  >
                    {{ statusLabel(batch.status) }}
                  </span>
                  <span class="text-xs text-muted-foreground">{{ batch.total_items }} items</span>
                </div>
                <div
                  *ngIf="batch.status === 'completed' || batch.status === 'failed'"
                  class="mt-2 flex items-center gap-4 text-xs"
                >
                  <span class="inline-flex items-center gap-1 text-green-600">
                    <span class="h-2 w-2 rounded-full bg-green-500"></span>
                    {{ batch.success_count }}
                  </span>
                  <span class="inline-flex items-center gap-1 text-red-600">
                    <span class="h-2 w-2 rounded-full bg-red-500"></span>
                    {{ batch.failed_count }}
                  </span>
                </div>
                <div class="mt-3 flex flex-wrap gap-1">
                  <span
                    *ngFor="let mp of batch.selected_marketplaces.slice(0, 4)"
                    class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    [ngClass]="marketplacePillClass(mp)"
                  >
                    {{ marketplaceBadge(mp) }}
                  </span>
                  <span
                    *ngIf="batch.selected_marketplaces.length > 4"
                    class="text-[10px] text-muted-foreground"
                  >
                    +{{ batch.selected_marketplaces.length - 4 }} more
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main class="flex flex-1 flex-col overflow-hidden">
          <ng-container *ngIf="selectedBatch; else emptyState">
            <div class="border-b border-border bg-muted/30 p-4">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-lg font-semibold">{{ selectedBatch.name }}</h2>
                  <p class="text-sm text-muted-foreground">
                    Created {{ formatDistance(selectedBatch.created_at) }}
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    *ngIf="selectedBatch?.status === 'pending'"
                    class="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
                    [disabled]="processingBatch === selectedBatch.id"
                    (click)="handleProcess(selectedBatch.id)"
                  >
                    {{ processingBatch === selectedBatch.id ? 'Processing...' : 'Start Processing' }}
                  </button>
                  <ng-container *ngIf="selectedBatch?.status === 'failed'">
                    <button
                      class="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground"
                      (click)="retryFailedItems()"
                    >
                      Retry All Failed ({{ failedItems.length }})
                    </button>
                    <button
                      *ngIf="selectedItemIds.size > 0"
                      class="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
                      (click)="retrySelectedItems()"
                    >
                      Retry Selected ({{ selectedItemIds.size }})
                    </button>
                  </ng-container>
                </div>
              </div>

              <div class="mt-4 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  class="flex items-center gap-2 rounded-md px-3 py-1.5 text-base font-medium transition-colors"
                  [ngClass]="statusFilter === 'success'
                    ? 'bg-green-100 text-green-800 ring-2 ring-green-500 dark:bg-green-900 dark:text-green-200'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
                  [disabled]="successItems.length === 0"
                  (click)="toggleStatusFilter('success')"
                >
                  OK Success: {{ successItems.length }}
                </button>
                <button
                  type="button"
                  class="flex items-center gap-2 rounded-md px-3 py-1.5 text-base font-medium transition-colors"
                  [ngClass]="statusFilter === 'failed'
                    ? 'bg-red-100 text-red-800 ring-2 ring-red-500 dark:bg-red-900 dark:text-red-200'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
                  [disabled]="failedItems.length === 0"
                  (click)="toggleStatusFilter('failed')"
                >
                  X Failed: {{ failedItems.length }}
                </button>
                <button
                  type="button"
                  class="flex items-center gap-2 rounded-md px-3 py-1.5 text-base font-medium transition-colors"
                  [ngClass]="statusFilter === 'pending'
                    ? 'bg-yellow-100 text-yellow-800 ring-2 ring-yellow-500 dark:bg-yellow-900 dark:text-yellow-200'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
                  [disabled]="pendingItems.length === 0"
                  (click)="toggleStatusFilter('pending')"
                >
                  Pending: {{ pendingItems.length }}
                </button>
                <div class="text-base text-muted-foreground">
                  <button *ngIf="statusFilter !== 'all'" class="underline hover:text-foreground" (click)="statusFilter = 'all'">
                    Show all ({{ batchItems.length }})
                  </button>
                  <span *ngIf="statusFilter === 'all'">Total: {{ batchItems.length }} items</span>
                </div>
              </div>
            </div>

            <div
              *ngIf="selectedBatch?.status === 'failed' && failedItems.length > 0"
              class="flex items-center gap-2 border-b border-border bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30"
            >
              <span>!</span>
              <span class="font-medium">
                {{ failedItems.length }} item{{ failedItems.length !== 1 ? 's' : '' }} failed
              </span>
              <button
                class="ml-auto text-xs text-red-600 underline"
                (click)="selectAllFailed()"
              >
                Select All Failed
              </button>
            </div>

            <div class="flex-1 overflow-auto">
              <div *ngIf="loadingItems" class="p-8 text-center text-muted-foreground">
                <div class="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                Loading items...
              </div>
              <div *ngIf="!loadingItems && filteredItems.length === 0" class="p-8 text-center text-muted-foreground">
                {{ statusFilter !== 'all' ? ('No ' + statusFilter + ' items in this batch') : 'No items in this batch' }}
              </div>
              <table *ngIf="!loadingItems && filteredItems.length > 0" class="w-full text-sm">
                <thead class="sticky top-0 bg-background text-xs text-muted-foreground">
                  <tr class="border-b border-border">
                    <th *ngIf="selectedBatch?.status === 'failed'" class="w-10 px-4 py-2"></th>
                    <th class="w-14 px-4 py-2 text-left">Image</th>
                    <th class="px-4 py-2 text-left">Product</th>
                    <th class="w-28 px-4 py-2 text-left">SKU</th>
                    <th class="w-20 px-4 py-2 text-right">Stock</th>
                    <th class="w-24 px-4 py-2 text-right">Price</th>
                    <th class="w-20 px-4 py-2 text-right">Margin</th>
                    <th class="w-28 px-4 py-2 text-left">Marketplace</th>
                    <th class="w-24 px-4 py-2 text-left">Status</th>
                    <th class="px-4 py-2 text-left">Error</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    *ngFor="let item of filteredItems"
                    class="border-b border-border/60"
                    [ngClass]="rowClass(item)"
                    (click)="openEditor(item)"
                  >
                    <td *ngIf="selectedBatch?.status === 'failed'" class="px-4 py-2" (click)="$event.stopPropagation()">
                      <input
                        *ngIf="item.status === 'failed'"
                        type="checkbox"
                        [checked]="selectedItemIds.has(item.id)"
                        (change)="toggleItemSelection(item.id)"
                      />
                    </td>
                    <td class="px-4 py-2">
                      <img
                        *ngIf="item.product_image"
                        [src]="item.product_image"
                        [alt]="item.product_name"
                        class="h-10 w-10 rounded object-cover"
                      />
                      <div *ngIf="!item.product_image" class="flex h-10 w-10 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                        Img
                      </div>
                    </td>
                    <td class="max-w-[200px] truncate px-4 py-2 text-base font-medium" [title]="item.product_name">
                      {{ item.product_name }}
                    </td>
                    <td class="px-4 py-2 font-mono text-xs text-muted-foreground">
                      {{ item.product_sku || '-' }}
                    </td>
                    <td class="px-4 py-2 text-right text-base tabular-nums">
                      {{ item.stock_qty ?? '-' }}
                    </td>
                    <td class="px-4 py-2 text-right text-base tabular-nums">
                      {{ item.sale_price != null ? ('$' + item.sale_price.toFixed(2)) : '-' }}
                    </td>
                    <td class="px-4 py-2 text-right text-base tabular-nums">
                      <span *ngIf="item.profit_margin != null" [ngClass]="item.profit_margin >= 0 ? 'text-green-600' : 'text-red-600'">
                        {{ item.profit_margin.toFixed(1) }}%
                      </span>
                      <span *ngIf="item.profit_margin == null">-</span>
                    </td>
                    <td class="px-4 py-2">
                      <span
                        class="inline-flex items-center justify-center rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wide"
                        [ngClass]="marketplacePillClass(item.marketplace)"
                      >
                        {{ marketplaceBadge(item.marketplace) }}
                      </span>
                    </td>
                    <td class="px-4 py-2">
                      <span class="flex items-center gap-2 text-base">
                        <span
                          class="inline-flex h-4 w-4 items-center justify-center rounded-full border"
                          [ngClass]="statusIconClass(item.status)"
                        >
                          <svg *ngIf="item.status === 'success'" viewBox="0 0 24 24" class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                          <svg *ngIf="item.status === 'failed'" viewBox="0 0 24 24" class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18" />
                            <path d="M6 6l12 12" />
                          </svg>
                          <svg *ngIf="item.status === 'pending'" viewBox="0 0 24 24" class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10" />
                          </svg>
                          <svg *ngIf="item.status === 'processing'" viewBox="0 0 24 24" class="h-3 w-3 animate-spin" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2a10 10 0 0 1 10 10" />
                          </svg>
                        </span>
                        <span [ngClass]="itemStatusClass(item.status)">{{ itemStatusLabel(item.status) }}</span>
                      </span>
                    </td>
                    <td class="px-4 py-2 text-base text-muted-foreground">
                      <span *ngIf="item.error_message" class="flex items-center gap-2 text-red-500">
                        <span class="inline-flex h-4 w-4 items-center justify-center rounded-full border border-red-500/50">
                          <svg viewBox="0 0 24 24" class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 8v5" />
                            <path d="M12 16h.01" />
                          </svg>
                        </span>
                        <span class="max-w-[150px] truncate">{{ item.error_message }}</span>
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ng-container>

          <ng-template #emptyState>
            <div class="flex flex-1 items-center justify-center text-muted-foreground">
              <div class="text-center">
                <div class="mx-auto mb-4 h-16 w-16 rounded-full bg-muted/40"></div>
                <p class="text-lg font-medium">Select a batch to view details</p>
                <p class="mt-1 text-sm">Click on a batch from the left panel</p>
              </div>
            </div>
          </ng-template>
        </main>
      </div>

      <app-product-attribute-editor
        [item]="errorDialogItem"
        [batchId]="selectedBatchId || undefined"
        [batchItems]="batchItems"
        [open]="!!errorDialogItem"
        (openChange)="handleEditorOpenChange($event)"
        (saveAndRetry)="handleSaveAndRetry($event)"
        (navigateToItem)="handleNavigateToItem($event)"
      ></app-product-attribute-editor>

      <div *ngIf="deleteConfirmBatch" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div class="w-full max-w-md rounded-lg bg-card p-6 shadow-xl">
          <h3 class="text-lg font-semibold">Delete Batch?</h3>
          <p class="mt-2 text-sm text-muted-foreground">
            This will permanently delete "{{ deleteConfirmBatch.name }}" and all its items.
          </p>
          <div class="mt-4 flex items-center justify-end gap-2">
            <button class="rounded-md border border-border px-4 py-2 text-sm" (click)="deleteConfirmBatch = null">
              Cancel
            </button>
            <button class="rounded-md bg-destructive px-4 py-2 text-sm text-destructive-foreground" (click)="confirmDeleteBatch()">
              Delete
            </button>
          </div>
        </div>
      </div>

      <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        <div
          *ngFor="let toast of toastMessages"
          class="min-w-[220px] rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground shadow-lg"
        >
          <p class="text-sm font-semibold">{{ toast.title }}</p>
          <p class="text-xs text-muted-foreground">{{ toast.text }}</p>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BatchManagementPageComponent {
  private readonly cdr = inject(ChangeDetectorRef);

  batches: MarketplaceBatch[] = [
    {
      id: 'batch-101',
      user_id: 'demo',
      name: 'January Publish - Electronics',
      status: 'failed',
      total_items: 12,
      success_count: 9,
      failed_count: 3,
      selected_marketplaces: ['amazon', 'walmart', 'ebay', 'etsy', 'newegg'],
      created_at: '2026-01-18T10:22:00Z',
      updated_at: '2026-01-18T10:22:00Z',
    },
    {
      id: 'batch-102',
      user_id: 'demo',
      name: 'Kitchen Accessories Batch',
      status: 'pending',
      total_items: 8,
      success_count: 0,
      failed_count: 0,
      selected_marketplaces: ['amazon', 'walmart', 'target'],
      created_at: '2026-01-19T14:10:00Z',
      updated_at: '2026-01-19T14:10:00Z',
    },
    {
      id: 'batch-103',
      user_id: 'demo',
      name: 'Holiday Promo Batch',
      status: 'completed',
      total_items: 6,
      success_count: 6,
      failed_count: 0,
      selected_marketplaces: ['amazon', 'ebay'],
      created_at: '2026-01-16T09:05:00Z',
      updated_at: '2026-01-16T09:05:00Z',
    },
  ];

  batchItemsById: Record<string, BatchItem[]> = {
    'batch-101': [
      {
        id: 'item-1',
        batch_id: 'batch-101',
        product_id: 'PROD-2001',
        product_name: 'Wireless Headphones',
        product_sku: 'WH-2001-BLK',
        product_image: 'https://images.unsplash.com/photo-1518441986387-8c7e2a4baf28?auto=format&fit=crop&w=80&q=60',
        stock_qty: 120,
        sale_price: 89.99,
        profit_margin: 18.5,
        marketplace: 'amazon',
        status: 'success',
        error_message: null,
        category_id: 'cat-electronics',
        created_at: '2026-01-18T10:22:00Z',
        updated_at: '2026-01-18T10:22:00Z',
      },
      {
        id: 'item-2',
        batch_id: 'batch-101',
        product_id: 'PROD-2001-1',
        product_name: 'Wireless Headphones',
        product_sku: 'WH-2001-RED',
        product_image: 'https://images.unsplash.com/photo-1518441986387-8c7e2a4baf28?auto=format&fit=crop&w=80&q=60',
        stock_qty: 60,
        sale_price: 89.99,
        profit_margin: 18.5,
        marketplace: 'walmart',
        status: 'failed',
        error_message: 'Missing required attributes',
        category_id: 'cat-electronics',
        created_at: '2026-01-18T10:22:00Z',
        updated_at: '2026-01-18T10:22:00Z',
      },
      {
        id: 'item-3',
        batch_id: 'batch-101',
        product_id: 'PROD-2001-2',
        product_name: 'Wireless Headphones',
        product_sku: 'WH-2001-BLU',
        product_image: 'https://images.unsplash.com/photo-1518441986387-8c7e2a4baf28?auto=format&fit=crop&w=80&q=60',
        stock_qty: 42,
        sale_price: 89.99,
        profit_margin: 18.5,
        marketplace: 'ebay',
        status: 'failed',
        error_message: 'Invalid product data',
        category_id: 'cat-electronics',
        created_at: '2026-01-18T10:22:00Z',
        updated_at: '2026-01-18T10:22:00Z',
      },
      {
        id: 'item-4',
        batch_id: 'batch-101',
        product_id: 'PROD-2005',
        product_name: 'Smart Home Speaker',
        product_sku: 'SP-2005-GRY',
        product_image: 'https://images.unsplash.com/photo-1512446816042-444d641267d4?auto=format&fit=crop&w=80&q=60',
        stock_qty: 30,
        sale_price: 129.0,
        profit_margin: 22.1,
        marketplace: 'etsy',
        status: 'success',
        error_message: null,
        category_id: 'cat-electronics',
        created_at: '2026-01-18T10:22:00Z',
        updated_at: '2026-01-18T10:22:00Z',
      },
    ],
    'batch-102': [
      {
        id: 'item-5',
        batch_id: 'batch-102',
        product_id: 'PROD-3001',
        product_name: 'Stainless Steel Cookware Set',
        product_sku: 'CK-3001',
        product_image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=80&q=60',
        stock_qty: 50,
        sale_price: 199.0,
        profit_margin: 26.4,
        marketplace: 'amazon',
        status: 'pending',
        error_message: null,
        category_id: 'cat-home',
        created_at: '2026-01-19T14:10:00Z',
        updated_at: '2026-01-19T14:10:00Z',
      },
      {
        id: 'item-6',
        batch_id: 'batch-102',
        product_id: 'PROD-3002',
        product_name: 'Non-stick Pan Set',
        product_sku: 'CK-3002',
        product_image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=80&q=60',
        stock_qty: 80,
        sale_price: 89.0,
        profit_margin: 19.7,
        marketplace: 'target',
        status: 'pending',
        error_message: null,
        category_id: 'cat-home',
        created_at: '2026-01-19T14:10:00Z',
        updated_at: '2026-01-19T14:10:00Z',
      },
    ],
    'batch-103': [
      {
        id: 'item-7',
        batch_id: 'batch-103',
        product_id: 'PROD-4010',
        product_name: 'Holiday Gift Bundle',
        product_sku: 'HB-4010',
        product_image: 'https://images.unsplash.com/photo-1457305237443-44c3d5a30b89?auto=format&fit=crop&w=80&q=60',
        stock_qty: 20,
        sale_price: 79.0,
        profit_margin: 30.2,
        marketplace: 'amazon',
        status: 'success',
        error_message: null,
        category_id: 'cat-home',
        created_at: '2026-01-16T09:05:00Z',
        updated_at: '2026-01-16T09:05:00Z',
      },
    ],
  };

  isLoading = false;
  selectedBatchId: string | null = this.batches[0]?.id ?? null;
  batchItems: BatchItem[] = this.batchItemsById[this.selectedBatchId || ''] || [];
  loadingItems = false;
  processingBatch: string | null = null;
  selectedItemIds = new Set<string>();
  editingBatchId: string | null = null;
  editName = '';
  errorDialogItem: BatchItem | null = null;
  statusFilter: BatchItemStatus | 'all' = 'all';
  deleteConfirmBatch: MarketplaceBatch | null = null;

  toastMessages: Array<{ id: number; title: string; text: string }> = [];
  private toastId = 0;

  get selectedBatch(): MarketplaceBatch | undefined {
    return this.batches.find((batch) => batch.id === this.selectedBatchId);
  }

  get failedItems(): BatchItem[] {
    return this.batchItems.filter((item) => item.status === 'failed');
  }

  get successItems(): BatchItem[] {
    return this.batchItems.filter((item) => item.status === 'success');
  }

  get pendingItems(): BatchItem[] {
    return this.batchItems.filter((item) => item.status === 'pending');
  }

  get filteredItems(): BatchItem[] {
    return this.statusFilter === 'all'
      ? this.batchItems
      : this.batchItems.filter((item) => item.status === this.statusFilter);
  }

  selectBatch(batchId: string): void {
    this.selectedBatchId = batchId;
    this.statusFilter = 'all';
    this.selectedItemIds = new Set<string>();
    this.batchItems = [...(this.batchItemsById[batchId] || [])];
  }

  handleProcess(batchId: string): void {
    if (!batchId) return;
    this.processingBatch = batchId;
    const items = this.batchItemsById[batchId] || [];
    const errorMessages = [
      'API rate limit exceeded',
      'Invalid product data',
      'Marketplace authentication failed',
      'Product already exists',
      'Missing required fields',
    ];
    const updated = items.map((item) => {
      if (item.status !== 'pending') return item;
      const isSuccess = Math.random() > 0.2;
      const status: BatchItemStatus = isSuccess ? 'success' : 'failed';
      return {
        ...item,
        status,
        error_message: isSuccess ? null : errorMessages[Math.floor(Math.random() * errorMessages.length)],
      };
    });
    this.batchItemsById[batchId] = updated;
    this.batchItems = [...updated];
    this.updateBatchSummary(batchId);
    this.processingBatch = null;
    this.showToast('Batch processing complete', 'Batch items updated.');
  }

  retryFailedItems(): void {
    if (!this.selectedBatchId) return;
    this.batchItemsById[this.selectedBatchId] = this.batchItemsById[this.selectedBatchId].map((item) =>
      item.status === 'failed'
        ? { ...item, status: 'pending' as BatchItemStatus, error_message: null }
        : item
    );
    this.batchItems = [...this.batchItemsById[this.selectedBatchId]];
    this.selectedItemIds = new Set<string>();
    this.updateBatchSummary(this.selectedBatchId);
    this.showToast('Items reset', 'Failed items queued for retry.');
  }

  retrySelectedItems(): void {
    if (!this.selectedBatchId) return;
    const selectedIds = new Set(this.selectedItemIds);
    this.batchItemsById[this.selectedBatchId] = this.batchItemsById[this.selectedBatchId].map((item) =>
      selectedIds.has(item.id)
        ? { ...item, status: 'pending' as BatchItemStatus, error_message: null }
        : item
    );
    this.batchItems = [...this.batchItemsById[this.selectedBatchId]];
    this.selectedItemIds = new Set<string>();
    this.updateBatchSummary(this.selectedBatchId);
    this.showToast('Items reset', 'Selected items queued for retry.');
  }

  toggleItemSelection(itemId: string): void {
    const next = new Set(this.selectedItemIds);
    if (next.has(itemId)) {
      next.delete(itemId);
    } else {
      next.add(itemId);
    }
    this.selectedItemIds = next;
  }

  selectAllFailed(): void {
    this.selectedItemIds = new Set(this.failedItems.map((item) => item.id));
  }

  toggleStatusFilter(status: BatchItemStatus): void {
    this.statusFilter = this.statusFilter === status ? 'all' : status;
  }

  startEditName(batch: MarketplaceBatch): void {
    this.editingBatchId = batch.id;
    this.editName = batch.name;
  }

  saveBatchName(): void {
    if (!this.editingBatchId || !this.editName.trim()) return;
    const id = this.editingBatchId;
    this.batches = this.batches.map((batch) =>
      batch.id === id ? { ...batch, name: this.editName.trim() } : batch
    );
    this.editingBatchId = null;
    this.editName = '';
    this.showToast('Batch renamed', 'Batch name updated.');
  }

  cancelEditName(): void {
    this.editingBatchId = null;
    this.editName = '';
  }

  openDeleteConfirm(batch: MarketplaceBatch): void {
    this.deleteConfirmBatch = batch;
  }

  confirmDeleteBatch(): void {
    if (!this.deleteConfirmBatch) return;
    const id = this.deleteConfirmBatch.id;
    this.batches = this.batches.filter((batch) => batch.id !== id);
    delete this.batchItemsById[id];
    if (this.selectedBatchId === id) {
      this.selectedBatchId = this.batches[0]?.id ?? null;
      this.batchItems = this.selectedBatchId ? [...(this.batchItemsById[this.selectedBatchId] || [])] : [];
    }
    this.deleteConfirmBatch = null;
    this.showToast('Batch deleted', 'The batch has been removed.');
  }

  openEditor(item: BatchItem): void {
    if (item.status !== 'failed' && item.status !== 'success') return;
    this.errorDialogItem = item;
  }

  handleEditorOpenChange(open: boolean): void {
    if (!open) {
      this.errorDialogItem = null;
    }
  }

  handleSaveAndRetry(event: {
    itemId: string;
    updates: {
      product_name: string;
      product_sku: string | null;
      stock_qty: number | null;
      sale_price: number | null;
      profit_margin: number | null;
    };
  }): void {
    const targetId = event.itemId;
    if (!this.selectedBatchId) return;
    const updatedItems = this.batchItemsById[this.selectedBatchId].map((item) =>
      item.id === targetId
        ? {
          ...item,
          ...event.updates,
          status: 'pending' as BatchItemStatus,
          error_message: null,
        }
        : item
    );
    this.batchItemsById[this.selectedBatchId] = updatedItems;
    this.batchItems = [...updatedItems];
    this.updateBatchSummary(this.selectedBatchId);
    this.showToast('Item updated', 'Item has been updated and queued for retry.');
  }

  handleNavigateToItem(itemId: string): void {
    const target = this.batchItems.find((item) => item.id === itemId);
    if (target) {
      this.errorDialogItem = target;
    }
  }

  updateBatchSummary(batchId: string): void {
    const items = this.batchItemsById[batchId] || [];
    const successCount = items.filter((item) => item.status === 'success').length;
    const failedCount = items.filter((item) => item.status === 'failed').length;
    const status: BatchStatus = failedCount > 0 ? 'failed' : items.every((item) => item.status !== 'pending') ? 'completed' : 'pending';
    this.batches = this.batches.map((batch) =>
      batch.id === batchId
        ? { ...batch, success_count: successCount, failed_count: failedCount, status }
        : batch
    );
  }

  statusLabel(status: BatchStatus): string {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Has Errors';
      default:
        return status;
    }
  }

  statusBadgeClass(status: BatchStatus): string {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  }

  itemStatusLabel(status: BatchItemStatus): string {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'success':
        return 'Success';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  }

  itemStatusClass(status: BatchItemStatus): string {
    switch (status) {
      case 'pending':
        return 'text-yellow-600';
      case 'processing':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  }

  statusIconClass(status: BatchItemStatus): string {
    switch (status) {
      case 'success':
        return 'border-green-500/50 text-green-500';
      case 'failed':
        return 'border-red-500/50 text-red-500';
      case 'processing':
        return 'border-blue-500/50 text-blue-500';
      case 'pending':
        return 'border-yellow-500/50 text-yellow-500';
      default:
        return 'border-muted text-muted-foreground';
    }
  }

  rowClass(item: BatchItem): string {
    const isClickable = item.status === 'failed' || item.status === 'success';
    if (!isClickable) return '';
    if (item.status === 'failed') {
      return 'cursor-pointer bg-red-50/50 hover:bg-red-100/50 dark:bg-red-950/20 dark:hover:bg-red-950/40';
    }
    return 'cursor-pointer hover:bg-muted/50';
  }

  marketplaceBadge(marketplace: string): string {
    const map: Record<string, string> = {
      amazon: 'amazon',
      walmart: 'WMT',
      ebay: 'EBY',
      etsy: 'Etsy',
      newegg: 'NE',
      target: 'TGT',
      shopify: 'Shop',
      costco: 'COST',
    };
    return map[marketplace] || marketplace.slice(0, 3).toUpperCase();
  }

  marketplacePillClass(marketplace: string): string {
    switch (marketplace) {
      case 'amazon':
        return 'bg-amber-500/20 text-amber-300';
      case 'walmart':
        return 'bg-sky-500/20 text-sky-300';
      case 'ebay':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'etsy':
        return 'bg-orange-500/20 text-orange-300';
      case 'newegg':
        return 'bg-indigo-500/20 text-indigo-300';
      case 'target':
        return 'bg-rose-500/20 text-rose-300';
      case 'shopify':
        return 'bg-emerald-500/20 text-emerald-300';
      case 'costco':
        return 'bg-red-500/20 text-red-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  }

  formatDate(dateValue: string): string {
    const date = new Date(dateValue);
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  formatDistance(dateValue: string): string {
    const date = new Date(dateValue);
    const diff = Date.now() - date.getTime();
    const minutes = Math.round(diff / 60000);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    return `${days}d ago`;
  }

  showToast(title: string, text: string): void {
    const id = (this.toastId += 1);
    this.toastMessages = [...this.toastMessages, { id, title, text }];
    this.cdr.markForCheck();
    setTimeout(() => {
      this.toastMessages = this.toastMessages.filter((toast) => toast.id !== id);
      this.cdr.markForCheck();
    }, 2400);
  }
}
