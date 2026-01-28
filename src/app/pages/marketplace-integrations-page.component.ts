import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { marketplacePlatforms } from '@/data/mockProducts';

type IntegrationStatus = 'connected' | 'paused' | 'error' | 'not_connected';

interface MarketplaceIntegration {
  id: string;
  label: string;
  region: string;
  status: IntegrationStatus;
  listings: number;
  orders: number;
  revenue: number;
  lastSync: string;
}

const platformLabels: Record<string, string> = {
  amazon: 'Amazon',
  walmart: 'Walmart',
  ebay: 'eBay',
  newegg: 'Newegg',
  bestbuy: 'Best Buy',
  target: 'Target',
  etsy: 'Etsy',
  shopify: 'Shopify',
  temu: 'Temu',
  macys: "Macy's",
  costco: 'Costco',
  homedepot: 'Home Depot',
  lowes: "Lowe's",
  wayfair: 'Wayfair',
  overstock: 'Overstock',
};

const statusLabels: Record<IntegrationStatus, string> = {
  connected: 'Connected',
  paused: 'Paused',
  error: 'Needs attention',
  not_connected: 'Not connected',
};

const statusClasses: Record<IntegrationStatus, string> = {
  connected: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500',
  paused: 'border-amber-500/40 bg-amber-500/10 text-amber-500',
  error: 'border-rose-500/40 bg-rose-500/10 text-rose-500',
  not_connected: 'border-border bg-muted/40 text-muted-foreground',
};

const buildLastSyncLabel = (index: number) => {
  const minutes = 15 + index * 12;
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
};

const statusCycle: IntegrationStatus[] = [
  'connected',
  'connected',
  'paused',
  'error',
  'not_connected',
];

const integrationsSeed: MarketplaceIntegration[] = marketplacePlatforms.map((platform, index) => ({
  id: platform,
  label: platformLabels[platform] ?? platform,
  region: 'US',
  status: statusCycle[index % statusCycle.length],
  listings: 120 + index * 17,
  orders: 18 + index * 3,
  revenue: 3200 + index * 225,
  lastSync: buildLastSyncLabel(index),
}));

@Component({
  selector: 'app-marketplace-integrations-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="min-h-screen bg-background px-6 py-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex items-start gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-5 w-5" stroke-width="2">
              <path d="M9 17H7A5 5 0 0 1 7 7h2" />
              <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
              <line x1="8" x2="16" y1="12" y2="12" />
            </svg>
          </div>
          <div>
            <h1 class="text-2xl font-semibold text-foreground">Marketplace Integrations</h1>
            <p class="text-sm text-muted-foreground">
              Connect, sync, and monitor your marketplace channels.
            </p>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
              <path d="M3 12a9 9 0 1 0 9-9" />
              <path d="M3 3v5h5" />
            </svg>
            Sync all
          </button>
          <button
            type="button"
            class="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            Connect marketplace
          </button>
        </div>
      </div>

      <div class="mt-6 grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside class="rounded-xl border border-border bg-card p-4">
          <div class="space-y-4">
            <div>
              <p class="text-[11px] font-semibold uppercase text-muted-foreground">Search</p>
              <input
                type="search"
                class="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="Search marketplaces"
                [(ngModel)]="searchTerm"
              />
            </div>

            <div>
              <p class="text-[11px] font-semibold uppercase text-muted-foreground">Status</p>
              <div class="mt-2 grid gap-2">
                <button
                  *ngFor="let option of statusFilters"
                  type="button"
                  class="flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold"
                  [ngClass]="{
                    'border-primary bg-primary/10 text-primary': statusFilter === option.id
                  }"
                  (click)="statusFilter = option.id"
                >
                  <span>{{ option.label }}</span>
                  <span class="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                    {{ option.id === 'all' ? integrations.length : statusCount(option.id) }}
                  </span>
                </button>
              </div>
            </div>

            <div class="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              <p class="font-semibold text-foreground">Integration health</p>
              <p class="mt-1">
                Track connection stability, sync latency, and listing coverage for each marketplace.
              </p>
            </div>
          </div>
        </aside>

        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div
            *ngFor="let integration of filteredIntegrations"
            class="rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted/40 text-sm font-semibold">
                  {{ integration.label.charAt(0) }}
                </div>
                <div>
                  <p class="text-sm font-semibold text-foreground">{{ integration.label }}</p>
                  <p class="text-xs text-muted-foreground">{{ integration.region }} Marketplace</p>
                </div>
              </div>
              <span
                class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold"
                [ngClass]="statusClasses[integration.status]"
              >
                {{ statusLabels[integration.status] }}
              </span>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div class="rounded-lg border border-border bg-background/40 p-3">
                <p class="text-[10px] text-muted-foreground">Active listings</p>
                <p class="mt-1 text-sm font-semibold text-foreground">{{ integration.listings }}</p>
              </div>
              <div class="rounded-lg border border-border bg-background/40 p-3">
                <p class="text-[10px] text-muted-foreground">Orders (30d)</p>
                <p class="mt-1 text-sm font-semibold text-foreground">{{ integration.orders }}</p>
              </div>
            </div>

            <div class="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>Last sync {{ integration.lastSync }}</span>
              <button
                type="button"
                class="rounded-md border border-border px-2 py-1 text-[10px] font-semibold text-foreground hover:bg-muted"
              >
                {{ integration.status === 'not_connected' ? 'Connect' : 'Manage' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketplaceIntegrationsPageComponent {
  readonly integrations = integrationsSeed;
  readonly statusFilters = [
    { id: 'all', label: 'All' },
    { id: 'connected', label: 'Connected' },
    { id: 'paused', label: 'Paused' },
    { id: 'error', label: 'Needs attention' },
    { id: 'not_connected', label: 'Not connected' },
  ] as const;

  searchTerm = '';
  statusFilter: 'all' | IntegrationStatus = 'all';

  readonly statusLabels = statusLabels;
  readonly statusClasses = statusClasses;

  get filteredIntegrations(): MarketplaceIntegration[] {
    const query = this.searchTerm.trim().toLowerCase();
    return this.integrations.filter((integration) => {
      const matchesStatus =
        this.statusFilter === 'all' || integration.status === this.statusFilter;
      const matchesSearch =
        query.length === 0 || integration.label.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }

  statusCount(status: IntegrationStatus): number {
    return this.integrations.filter((integration) => integration.status === status).length;
  }
}
