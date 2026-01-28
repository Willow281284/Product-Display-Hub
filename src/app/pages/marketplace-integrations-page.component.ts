import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { marketplacePlatforms } from '@/data/mockProducts';

type IntegrationStatus = 'connected' | 'paused' | 'error' | 'not_connected';

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
  sellerId: string;
  marketplace: string;
  lastSynced: string;
  connectedSince: string;
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

const platformBadgeLabels: Record<string, string> = {
  amazon: 'amazon',
  walmart: 'WMT',
  ebay: 'ebay',
  shopify: 'Shop',
  etsy: 'Etsy',
  newegg: 'NE',
  bestbuy: 'BBY',
  target: 'TGT',
  temu: 'Temu',
  macys: 'Mcy',
  costco: 'COST',
  homedepot: 'HD',
  lowes: 'LOW',
  wayfair: 'WF',
  overstock: 'OS',
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
    {
      name: 'Unnamed Store',
      storeId: 'AIY3EWR9VMWSZ',
      accountId: 'ATVPDKIKX0DER',
      sellerId: 'AIY3EWR9VMWSZ',
      marketplace: 'United States',
      lastSynced: '28/01/2026, 17:21:55',
      connectedSince: '21/01/2026',
    },
  ],
  walmart: [
    {
      name: 'abb',
      storeId: 'WMT-1023',
      accountId: 'WMRT-001',
      sellerId: 'WMT-1023',
      marketplace: 'United States',
      lastSynced: '26/01/2026, 11:45:21',
      connectedSince: '12/01/2026',
    },
  ],
  shopify: [
    {
      name: 'Primary Store',
      storeId: 'SHOP-8892',
      accountId: 'SHOP-001',
      sellerId: 'SHOP-8892',
      marketplace: 'United States',
      lastSynced: '25/01/2026, 09:14:02',
      connectedSince: '02/01/2026',
    },
  ],
  bestbuy: [
    {
      name: 'Main Store',
      storeId: 'BBY-5521',
      accountId: 'BBY-ACC-22',
      sellerId: 'BBY-5521',
      marketplace: 'United States',
      lastSynced: '24/01/2026, 15:09:12',
      connectedSince: '05/01/2026',
    },
  ],
  target: [
    {
      name: 'Target Store',
      storeId: 'TGT-7711',
      accountId: 'TGT-ACC-01',
      sellerId: 'TGT-7711',
      marketplace: 'United States',
      lastSynced: '23/01/2026, 12:02:44',
      connectedSince: '10/01/2026',
    },
  ],
  etsy: [
    {
      name: 'Etsy Shop',
      storeId: 'ETSY-4411',
      accountId: 'ETSY-ACC-03',
      sellerId: 'ETSY-4411',
      marketplace: 'United States',
      lastSynced: '22/01/2026, 08:35:19',
      connectedSince: '03/01/2026',
    },
  ],
};

const integrationStatuses: Record<string, IntegrationStatus> = {
  amazon: 'connected',
  walmart: 'connected',
  shopify: 'connected',
  bestbuy: 'connected',
  target: 'connected',
  etsy: 'connected',
  ebay: 'paused',
  newegg: 'paused',
  macys: 'paused',
  costco: 'error',
  homedepot: 'error',
  wayfair: 'error',
  temu: 'not_connected',
  lowes: 'not_connected',
  overstock: 'not_connected',
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
  imports: [CommonModule, FormsModule],
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

      <div class="mt-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div class="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <button
            *ngFor="let widget of statusWidgets"
            type="button"
            class="rounded-xl border border-border bg-card p-4 text-left shadow-sm transition hover:border-muted-foreground/50"
            [ngClass]="statusWidgetClasses(widget.id)"
            (click)="setStatusFilter(widget.id)"
          >
            <p class="text-xs text-muted-foreground">{{ widget.label }}</p>
            <p class="mt-2 text-2xl font-semibold" [ngClass]="widget.countClass">
              {{ statusCount(widget.id) }}
            </p>
          </button>
        </div>
        <div class="w-full xl:max-w-xs">
          <label class="text-[11px] font-semibold uppercase text-muted-foreground">Search</label>
          <div class="relative mt-2">
            <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
            </span>
            <input
              type="search"
              class="w-full rounded-md border border-border bg-background py-2 pl-10 pr-3 text-sm"
              placeholder="Search marketplaces"
              [(ngModel)]="searchTerm"
            />
          </div>
        </div>
      </div>

      <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div
          *ngFor="let integration of filteredIntegrations"
          class="rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div
                class="flex h-9 w-9 items-center justify-center rounded-md text-xs font-semibold text-white"
                [ngClass]="platformColors[integration.id] || 'bg-muted'"
              >
                {{ platformBadgeLabel(integration) }}
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
              class="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2 text-xs"
              (click)="openStoreDetail(integration, store)"
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
              (click)="openConnectModal(integration)"
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
              (click)="openConnectModal(integration)"
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

      <div
        *ngIf="connectModalOpen && connectMarketplace"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in"
      >
        <div
          class="w-full max-w-xl rounded-xl border border-border bg-card p-5 shadow-xl animate-in zoom-in-95"
        >
          <ng-container *ngIf="connectMarketplace.id === 'amazon'; else simpleConnectModal">
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-center gap-3">
                <div class="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-xs font-semibold text-foreground">
                  amazon
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-foreground">Connect to Amazon SP-API</h3>
                  <p class="text-xs text-muted-foreground">
                    Connect your Amazon Seller account to sync products and manage listings.
                  </p>
                </div>
              </div>
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
                (click)="closeConnectModal()"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="mt-4 rounded-lg border border-border bg-muted/40 p-1 text-xs font-semibold">
              <div class="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  class="rounded-md px-3 py-2"
                  [ngClass]="connectTab === 'api' ? 'bg-background text-foreground' : 'text-muted-foreground'"
                  (click)="connectTab = 'api'"
                >
                  API Credentials
                </button>
                <button
                  type="button"
                  class="rounded-md px-3 py-2"
                  [ngClass]="connectTab === 'oauth' ? 'bg-background text-foreground' : 'text-muted-foreground'"
                  (click)="connectTab = 'oauth'"
                >
                  OAuth Flow
                </button>
              </div>
            </div>

            <ng-container *ngIf="connectTab === 'api'; else amazonOauth">
              <div class="mt-4 rounded-lg border border-border bg-background/40 p-3 text-xs text-muted-foreground">
                You'll need your SP-API credentials from Amazon Developer Console
              </div>

              <div class="mt-4 space-y-4">
                <label class="grid gap-2 text-xs">
                  <span class="font-semibold text-foreground">Store Name *</span>
                  <input
                    type="text"
                    class="h-10 rounded-md border border-border bg-background px-3 text-sm"
                    placeholder="My Amazon Store"
                    [(ngModel)]="amazonConnectForm.storeName"
                  />
                </label>
                <label class="grid gap-2 text-xs">
                  <span class="font-semibold text-foreground">Seller ID *</span>
                  <input
                    type="text"
                    class="h-10 rounded-md border border-border bg-background px-3 text-sm"
                    placeholder="e.g., A3XXXXXXXXXX"
                    [(ngModel)]="amazonConnectForm.sellerId"
                  />
                  <span class="text-[10px] text-muted-foreground">Found in Seller Central — Account Info</span>
                </label>
                <label class="grid gap-2 text-xs">
                  <span class="font-semibold text-foreground">Marketplace *</span>
                  <select
                    class="h-10 rounded-md border border-border bg-background px-3 text-sm"
                    [(ngModel)]="amazonConnectForm.marketplace"
                  >
                    <option>United States (NA)</option>
                    <option>Canada (NA)</option>
                    <option>United Kingdom (EU)</option>
                  </select>
                </label>
                <label class="grid gap-2 text-xs">
                  <span class="font-semibold text-foreground">Refresh Token *</span>
                  <input
                    type="text"
                    class="h-10 rounded-md border border-border bg-background px-3 text-sm"
                    placeholder="Atzr..."
                    [(ngModel)]="amazonConnectForm.refreshToken"
                  />
                  <span class="text-[10px] text-muted-foreground">From your SP-API app's self-authorization</span>
                </label>
              </div>
            </ng-container>

            <ng-template #amazonOauth>
              <div class="mt-4 rounded-lg border border-border bg-background/40 p-4 text-xs text-muted-foreground">
                OAuth authorization will redirect you to Amazon to grant access to your seller account.
              </div>

              <div class="mt-4 space-y-4">
                <label class="grid gap-2 text-xs">
                  <span class="font-semibold text-foreground">Store Name *</span>
                  <input
                    type="text"
                    class="h-10 rounded-md border border-border bg-background px-3 text-sm"
                    placeholder="My Amazon Store"
                    [(ngModel)]="amazonConnectForm.storeName"
                  />
                </label>
                <label class="grid gap-2 text-xs">
                  <span class="font-semibold text-foreground">Marketplace *</span>
                  <select
                    class="h-10 rounded-md border border-border bg-background px-3 text-sm"
                    [(ngModel)]="amazonConnectForm.marketplace"
                  >
                    <option>United States (NA)</option>
                    <option>Canada (NA)</option>
                    <option>United Kingdom (EU)</option>
                  </select>
                </label>
              </div>

              <button
                type="button"
                class="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 py-2 text-xs font-semibold text-white"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                  <path d="M15 14l5-5-5-5" />
                  <path d="M4 20v-7a4 4 0 0 1 4-4h12" />
                </svg>
                Authorize with Amazon
              </button>

              <p class="mt-3 text-[10px] text-muted-foreground">
                Note: OAuth requires your app to be registered in the Amazon Developer Console
              </p>
            </ng-template>

            <div *ngIf="connectTab === 'api'" class="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                class="rounded-md border border-border px-4 py-2 text-xs font-semibold text-foreground"
                (click)="closeConnectModal()"
              >
                Cancel
              </button>
              <button
                type="button"
                class="rounded-md bg-emerald-500 px-4 py-2 text-xs font-semibold text-white"
              >
                Connect
              </button>
            </div>
          </ng-container>

          <ng-template #simpleConnectModal>
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-center gap-3">
                <div class="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-xs font-semibold text-foreground">
                  {{ platformBadgeLabel(connectMarketplace) }}
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-foreground">
                    Connect to {{ connectMarketplace.label }}
                  </h3>
                  <p class="text-xs text-muted-foreground">
                    Enter your store details to connect your {{ connectMarketplace.label }} account.
                  </p>
                </div>
              </div>
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
                (click)="closeConnectModal()"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="mt-5">
              <label class="grid gap-2 text-xs">
                <span class="font-semibold text-foreground">Store Name</span>
                <input
                  type="text"
                  class="h-10 rounded-md border border-emerald-500/60 bg-background px-3 text-sm"
                  placeholder="Enter your store name"
                  [(ngModel)]="simpleConnectStoreName"
                />
              </label>
              <p class="mt-3 text-xs text-muted-foreground">
                In a production environment, this would redirect you to {{ connectMarketplace.label }}'s OAuth
                authorization page.
              </p>
            </div>

            <div class="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                class="rounded-md border border-border px-4 py-2 text-xs font-semibold text-foreground"
                (click)="closeConnectModal()"
              >
                Cancel
              </button>
              <button
                type="button"
                class="rounded-md bg-emerald-500 px-4 py-2 text-xs font-semibold text-white"
              >
                Connect
              </button>
            </div>
          </ng-template>
        </div>
      </div>

      <div
        *ngIf="storeDetailOpen && selectedStore && selectedMarketplace"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in"
      >
        <div class="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl animate-in zoom-in-95">
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-xs font-semibold text-foreground">
                {{ platformBadgeLabel(selectedMarketplace) }}
              </div>
              <div>
                <p class="text-sm font-semibold text-foreground">{{ selectedMarketplace.label }}</p>
                <span class="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-500">
                  Connected
                </span>
              </div>
            </div>
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
              (click)="closeStoreDetail()"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="mt-4 border-b border-border pb-4 text-xs">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-[11px] text-muted-foreground">Store Name</p>
                <p class="mt-1 text-sm font-semibold text-foreground">{{ selectedStore.name }}</p>
              </div>
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </button>
            </div>
          </div>

          <div class="mt-4 space-y-3 text-xs text-muted-foreground">
            <div class="flex items-center gap-3">
              <span class="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border">
                #
              </span>
              <div>
                <p class="text-[10px] uppercase">Seller ID</p>
                <p class="text-sm font-semibold text-foreground">{{ selectedStore.sellerId }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span class="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 3v18" />
                  <path d="M3 12h18" />
                </svg>
              </span>
              <div>
                <p class="text-[10px] uppercase">Marketplace</p>
                <div class="flex items-center gap-2">
                  <p class="text-sm font-semibold text-foreground">{{ selectedStore.marketplace }}</p>
                  <span class="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                    {{ selectedStore.accountId }}
                  </span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span class="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                  <path d="M8 2v4" />
                  <path d="M16 2v4" />
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M3 10h18" />
                </svg>
              </span>
              <div>
                <p class="text-[10px] uppercase">Last Synced</p>
                <p class="text-sm font-semibold text-foreground">{{ selectedStore.lastSynced }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span class="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                  <path d="M8 2v4" />
                  <path d="M16 2v4" />
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M3 10h18" />
                </svg>
              </span>
              <div>
                <p class="text-[10px] uppercase">Connected Since</p>
                <p class="text-sm font-semibold text-foreground">{{ selectedStore.connectedSince }}</p>
              </div>
            </div>
          </div>

          <div class="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                <path d="M3 12a9 9 0 1 0 9-9" />
                <path d="M3 3v5h5" />
              </svg>
              Sync Now
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 rounded-md bg-rose-500 px-3 py-2 text-xs font-semibold text-white"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                <path d="M10 14l2-2-2-2" />
                <path d="M4 20v-7a4 4 0 0 1 4-4h12" />
              </svg>
              Disconnect
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
  readonly statusWidgets = [
    { id: 'all', label: 'All', countClass: 'text-foreground' },
    { id: 'connected', label: 'Connected', countClass: 'text-emerald-500' },
    { id: 'paused', label: 'Paused', countClass: 'text-amber-500' },
    { id: 'error', label: 'Needs attention', countClass: 'text-rose-500' },
    { id: 'not_connected', label: 'Not connected', countClass: 'text-muted-foreground' },
  ] as const;

  searchTerm = '';
  statusFilter: 'all' | IntegrationStatus = 'all';

  connectModalOpen = false;
  connectMarketplace: MarketplaceIntegration | null = null;
  connectTab: 'api' | 'oauth' = 'api';
  amazonConnectForm = {
    storeName: '',
    sellerId: '',
    marketplace: 'United States (NA)',
    refreshToken: '',
  };
  simpleConnectStoreName = '';

  storeDetailOpen = false;
  selectedMarketplace: MarketplaceIntegration | null = null;
  selectedStore: MarketplaceStore | null = null;

  statusCount(status: 'all' | IntegrationStatus): number {
    if (status === 'all') return this.integrations.length;
    return this.integrations.filter((integration) => integration.status === status).length;
  }

  statusWidgetClasses(status: 'all' | IntegrationStatus): string {
    if (this.statusFilter !== status) {
      return '';
    }
    switch (status) {
      case 'connected':
      case 'all':
        return 'border-emerald-500/60 bg-emerald-500/10';
      case 'paused':
        return 'border-amber-500/60 bg-amber-500/10';
      case 'error':
        return 'border-rose-500/60 bg-rose-500/10';
      case 'not_connected':
        return 'border-muted-foreground/60 bg-muted/40';
      default:
        return '';
    }
  }

  setStatusFilter(status: 'all' | IntegrationStatus): void {
    this.statusFilter = status;
  }

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

  storeCountLabel(count: number): string {
    return `${count} Store${count === 1 ? '' : 's'}`;
  }

  platformBadgeLabel(integration: MarketplaceIntegration): string {
    return platformBadgeLabels[integration.id] ?? integration.label.charAt(0);
  }

  openConnectModal(integration: MarketplaceIntegration): void {
    this.connectMarketplace = integration;
    this.connectModalOpen = true;
    this.connectTab = 'api';
    this.simpleConnectStoreName = '';
    this.amazonConnectForm = {
      storeName: '',
      sellerId: '',
      marketplace: 'United States (NA)',
      refreshToken: '',
    };
  }

  closeConnectModal(): void {
    this.connectModalOpen = false;
    this.connectMarketplace = null;
  }

  openStoreDetail(integration: MarketplaceIntegration, store: MarketplaceStore): void {
    this.selectedMarketplace = integration;
    this.selectedStore = store;
    this.storeDetailOpen = true;
  }

  closeStoreDetail(): void {
    this.storeDetailOpen = false;
    this.selectedMarketplace = null;
    this.selectedStore = null;
  }

  goToProducts(): void {
    void this.router.navigate(['/']);
  }
}
