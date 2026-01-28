import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { marketplacePlatforms } from '@/data/mockProducts';

type IntegrationStatus = 'connected' | 'error' | 'not_connected';

interface MarketplaceIntegration {
  id: string;
  label: string;
  status: IntegrationStatus;
  stores: MarketplaceStore[];
}

interface MarketplaceStore {
  name: string;
  storeId: string;
  accountId: string;
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
  error: 'Needs attention',
  not_connected: 'Not connected',
};

const statusClasses: Record<IntegrationStatus, string> = {
  connected: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500',
  error: 'border-rose-500/40 bg-rose-500/10 text-rose-500',
  not_connected: 'border-border bg-muted/40 text-muted-foreground',
};

const platformColors: Record<string, string> = {
  amazon: 'bg-amber-500',
  walmart: 'bg-blue-600',
  ebay: 'bg-slate-700',
  shopify: 'bg-emerald-600',
  etsy: 'bg-orange-500',
  newegg: 'bg-orange-600',
  bestbuy: 'bg-blue-500',
  target: 'bg-red-600',
  temu: 'bg-orange-500',
  macys: 'bg-rose-600',
  costco: 'bg-red-700',
  homedepot: 'bg-orange-600',
  lowes: 'bg-blue-700',
  wayfair: 'bg-indigo-600',
  overstock: 'bg-slate-600',
};

const connectedStores: Record<string, MarketplaceStore[]> = {
  amazon: [
    { name: 'Unnamed Store', storeId: 'AIY3EWR9VMWSZ', accountId: 'ATVPDKIKX0DER' },
  ],
  walmart: [{ name: 'abb', storeId: 'WMT-1023', accountId: 'WMRT-001' }],
};

const integrationStatuses: Record<string, IntegrationStatus> = {
  amazon: 'connected',
  walmart: 'connected',
};

const integrationsSeed: MarketplaceIntegration[] = marketplacePlatforms.map((platform) => ({
  id: platform,
  label: platformLabels[platform] ?? platform,
  status: integrationStatuses[platform] ?? 'not_connected',
  stores: connectedStores[platform] ?? [],
}));

@Component({
  selector: 'app-marketplace-integrations-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="min-h-screen bg-background px-6 py-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground"
            (click)="goToProducts()"
            title="Back to products"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-5 w-5" stroke-width="2">
              <path d="M9 17H7A5 5 0 0 1 7 7h2" />
              <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
              <line x1="8" x2="16" y1="12" y2="12" />
            </svg>
          </div>
          <div>
            <h1 class="text-xl font-semibold text-foreground">Marketplace Integrations</h1>
            <p class="text-xs text-muted-foreground">Manage connected stores and channels</p>
          </div>
        </div>
        <button
          type="button"
          class="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground hover:bg-muted"
          (click)="goToProducts()"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
            <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
            <path d="M12 22V12" />
            <path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7" />
            <path d="m7.5 4.27 9 5.15" />
          </svg>
          Products
        </button>
      </div>

      <div class="mt-6 grid gap-4 md:grid-cols-3">
        <div class="rounded-xl border border-emerald-500/40 bg-card p-4 shadow-sm">
          <p class="text-xs text-muted-foreground">Total Marketplaces</p>
          <p class="mt-2 text-2xl font-semibold text-foreground">{{ totalMarketplaces }}</p>
        </div>
        <div class="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p class="text-xs text-muted-foreground">Connected</p>
          <p class="mt-2 text-2xl font-semibold text-emerald-500">{{ connectedCount }}</p>
        </div>
        <div class="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p class="text-xs text-muted-foreground">Needs Attention</p>
          <p class="mt-2 text-2xl font-semibold text-rose-500">{{ needsAttentionCount }}</p>
        </div>
      </div>

      <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div
          *ngFor="let integration of integrations"
          class="rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div
                class="flex h-9 w-9 items-center justify-center rounded-md text-xs font-semibold text-white"
                [ngClass]="platformColors[integration.id] || 'bg-muted'"
              >
                {{ platformInitials(integration) }}
              </div>
              <div>
                <p class="text-sm font-semibold text-foreground">{{ integration.label }}</p>
                <p *ngIf="integration.status === 'connected'" class="text-xs text-muted-foreground">
                  {{ integration.stores.length }} store connected
                </p>
              </div>
            </div>
            <span
              class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold"
              [ngClass]="statusClasses[integration.status]"
            >
              <ng-container *ngIf="integration.status === 'connected'; else notConnectedLabel">
                {{ storeCountLabel(integration.stores.length) }}
              </ng-container>
              <ng-template #notConnectedLabel>
                {{ statusLabels[integration.status] }}
              </ng-template>
            </span>
          </div>

          <div *ngIf="integration.status === 'connected'" class="mt-4 space-y-2">
            <div
              *ngFor="let store of integration.stores"
              class="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2 text-xs"
            >
              <div>
                <div class="flex items-center gap-2 font-semibold text-foreground">
                  <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
                  {{ store.name }}
                </div>
                <p class="mt-1 text-[10px] text-muted-foreground">
                  ID: {{ store.storeId }} • {{ store.accountId }}
                </p>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4 text-muted-foreground" stroke-width="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
            <button
              type="button"
              class="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              Add Another Store
            </button>
          </div>

          <div *ngIf="integration.status !== 'connected'" class="mt-4">
            <button
              type="button"
              class="flex w-full items-center justify-center gap-2 rounded-md bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                <path d="M15 14l5-5-5-5" />
                <path d="M4 20v-7a4 4 0 0 1 4-4h12" />
              </svg>
              Connect Store
            </button>
          </div>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketplaceIntegrationsPageComponent {
  private readonly router = inject(Router);

  readonly integrations = integrationsSeed;
  readonly statusLabels = statusLabels;
  readonly statusClasses = statusClasses;
  readonly platformColors = platformColors;

  get totalMarketplaces(): number {
    return this.integrations.length;
  }

  get connectedCount(): number {
    return this.integrations.filter((integration) => integration.status === 'connected').length;
  }

  get needsAttentionCount(): number {
    return this.integrations.filter((integration) => integration.status === 'error').length;
  }

  storeCountLabel(count: number): string {
    return `${count} Store${count === 1 ? '' : 's'}`;
  }

  platformInitials(integration: MarketplaceIntegration): string {
    const parts = integration.label.split(' ');
    const initials = parts.map((part) => part[0]).join('').slice(0, 2);
    return initials.toUpperCase();
  }

  goToProducts(): void {
    void this.router.navigate(['/']);
  }
}
