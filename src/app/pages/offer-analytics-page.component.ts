import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { mockProducts } from '@/data/mockProducts';
import {
  Offer,
  OfferScope,
  formatOfferDiscount,
  getOfferDaysRemaining,
  getOfferStatus,
  offerStatusConfig,
  offerTypeLabels,
} from '@/types/offer';
import { Product } from '@/types/product';
import { OfferService } from '@/app/services/offer.service';

interface OfferAnalytics {
  offer: Offer;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  revenueImpact: number;
  averageOrderValue: number;
  costPerConversion: number;
  roi: number;
  adSpend: number;
  roas: number;
}

type AlertType = 'warning' | 'critical' | 'success' | 'info';

interface PerformanceAlert {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  offer: Offer;
  metric?: string;
  action?: 'extend' | 'review' | 'adjust' | 'promote';
}

interface ProductAnalytics {
  product: Product;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
}

interface MarketplaceAnalytics {
  marketplace: string;
  status: 'active' | 'inactive' | 'not_listed';
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
  adSpend: number;
  roas: number;
}

interface SummaryMetrics {
  activeOffers: number;
  totalOffers: number;
  totalRevenue: number;
  totalRevenueImpact: number;
  totalConversions: number;
  totalClicks: number;
  totalImpressions: number;
  avgConversionRate: number;
  avgROI: number;
  clickThroughRate: number;
  totalAdSpend: number;
  avgRoas: number;
}

const MARKETPLACE_LIST = [
  { id: 'amazon', label: 'Amazon' },
  { id: 'walmart', label: 'Walmart' },
  { id: 'ebay', label: 'eBay' },
  { id: 'target', label: 'Target' },
  { id: 'etsy', label: 'Etsy' },
  { id: 'shopify', label: 'Shopify' },
  { id: 'bestbuy', label: 'Best Buy' },
  { id: 'wayfair', label: 'Wayfair' },
  { id: 'newegg', label: 'Newegg' },
  { id: 'homedepot', label: 'Home Depot' },
];

const CHART_COLORS = [
  'bg-primary',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-sky-500',
  'bg-rose-500',
];

@Component({
  selector: 'app-offer-analytics-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="min-h-screen bg-background">
      <header class="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div class="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
          <div class="flex items-center gap-4">
            <a
              routerLink="/"
              class="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Back to Products
            </a>
            <div class="flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-6 w-6 text-primary" stroke-width="2">
                <path d="M3 3v18h18" />
                <path d="M7 15v-4" />
                <path d="M12 15V8" />
                <path d="M17 15v-6" />
              </svg>
              <h1 class="text-xl font-bold">Offers Analytics</h1>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                <path d="M3 7h18" />
                <path d="M5 7v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7" />
                <path d="M9 3h6v4H9z" />
              </svg>
            </div>
            <details class="relative" [open]="marketplaceFilterOpen">
              <summary
                class="inline-flex w-[170px] cursor-pointer items-center justify-between rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground"
                (click)="$event.preventDefault(); marketplaceFilterOpen = !marketplaceFilterOpen"
              >
                <span class="truncate">{{ marketplaceFilterLabel }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-store w-4 h-4"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"></path><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"></path><path d="M2 7h20"></path><path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"></path></svg>
              </summary>
              <div class="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-card p-2 shadow-lg">
                <button
                  type="button"
                  class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted"
                  (click)="toggleSelectAllMarketplaces()"
                >
                  <input
                    type="checkbox"
                    class="h-4 w-4"
                    [checked]="selectedMarketplaces.length === marketplaceOptions.length"
                  />
                  <span class="text-sm font-medium">All Marketplaces</span>
                </button>
                <div class="mt-2 max-h-52 overflow-auto">
                  <button
                    *ngFor="let marketplace of marketplaceOptions"
                    type="button"
                    class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted"
                    (click)="toggleMarketplaceFilter(marketplace.id)"
                  >
                    <input
                      type="checkbox"
                      class="h-4 w-4"
                      [checked]="selectedMarketplaces.includes(marketplace.id)"
                    />
                    <span>{{ marketplace.label }}</span>
                  </button>
                </div>
                <button
                  *ngIf="selectedMarketplaces.length > 0"
                  type="button"
                  class="mt-2 w-full rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted"
                  (click)="clearMarketplaceSelection()"
                >
                  Clear Selection
                </button>
              </div>
            </details>

            <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar w-4 h-4"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></svg>
              <span>Period:</span>
            </div>
            <select
              class="h-8 rounded-md border border-border bg-background px-2 text-xs"
              [(ngModel)]="timePeriod"
              (ngModelChange)="setTimePeriod($event)"
            >
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>
      </header>

      <main class="mx-auto w-full max-w-6xl px-6 py-6">
        <div class="space-y-6">
          <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div class="rounded-lg border border-border bg-card p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs text-muted-foreground">Active Offers</p>
                  <p class="text-2xl font-bold">{{ summaryMetrics.activeOffers }}</p>
                  <p class="text-xs text-muted-foreground">of {{ summaryMetrics.totalOffers }} total</p>
                </div>
                <div class="rounded-full bg-primary/10 p-3 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tag w-5 h-5 text-primary"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"></path><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"></circle></svg>
                </div>
              </div>
            </div>
            <div class="rounded-lg border border-border bg-card p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs text-muted-foreground">Total Revenue</p>
                  <p class="text-2xl font-bold">{{ formatCurrency(summaryMetrics.totalRevenue) }}</p>
                  <div class="flex items-center gap-1 text-xs text-emerald-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-dollar-sign w-5 h-5 text-emerald-500"><line x1="12" x2="12" y1="2" y2="22"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    +{{ formatCurrency(summaryMetrics.totalRevenueImpact) }} impact
                  </div>
                </div>
                <div class="rounded-full bg-emerald-500/10 p-3 text-emerald-500">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-5 w-5" stroke-width="2">
                    <path d="M12 2v20" />
                    <path d="M17 5H9.5a3.5 3.5 0 1 0 0 7H14a3.5 3.5 0 1 1 0 7H6" />
                  </svg>
                </div>
              </div>
            </div>
            <div class="rounded-lg border border-border bg-card p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs text-muted-foreground">Conversion Rate</p>
                  <p class="text-2xl font-bold">{{ summaryMetrics.avgConversionRate | number: '1.1-1' }}%</p>
                  <p class="text-xs text-muted-foreground">{{ formatNumber(summaryMetrics.totalConversions) }} conversions</p>
                </div>
                <div class="rounded-full bg-blue-500/10 p-3 text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-percent w-5 h-5 text-blue-500"><line x1="19" x2="5" y1="5" y2="19"></line><circle cx="6.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle></svg>
                </div>
              </div>
            </div>
            <div class="rounded-lg border border-border bg-card p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs text-muted-foreground">Avg. ROI</p>
                  <p class="text-2xl font-bold">{{ summaryMetrics.avgROI | number: '1.0-0' }}%</p>
                  <div class="flex items-center gap-1 text-xs" [ngClass]="summaryMetrics.avgROI > 0 ? 'text-emerald-400' : 'text-rose-400'">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zap w-5 h-5 text-purple-500"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg>
                    vs baseline
                  </div>
                </div>
                <div class="rounded-full bg-purple-500/10 p-3 text-purple-500">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-5 w-5" stroke-width="2">
                    <path d="M13 2L3 14h7l-1 8 12-14h-7l1-6z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div class="rounded-lg border border-border bg-card p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs text-muted-foreground">Total Ad Spend</p>
                  <p class="text-2xl font-bold">{{ formatCurrency(summaryMetrics.totalAdSpend) }}</p>
                  <p class="text-xs text-muted-foreground">across active offers</p>
                </div>
                <div class="rounded-full bg-orange-500/10 p-3 text-orange-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-dollar-sign w-5 h-5 text-orange-500"><line x1="12" x2="12" y1="2" y2="22"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                </div>
              </div>
            </div>
            <div class="rounded-lg border border-border bg-card p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs text-muted-foreground">ROAS</p>
                  <p class="text-2xl font-bold">{{ summaryMetrics.avgRoas | number: '1.2-2' }}x</p>
                  <p class="text-xs text-muted-foreground">Return on Ad Spend</p>
                </div>
                <div
                  class="rounded-full p-3"
                  [ngClass]="summaryMetrics.avgRoas >= 3 ? 'bg-emerald-500/10 text-emerald-500' : summaryMetrics.avgRoas >= 2 ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'"
                >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trending-up w-5 h-5 text-emerald-500"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
                </div>
              </div>
            </div>
            <div class="rounded-lg border border-border bg-card p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs text-muted-foreground">Cost per Click</p>
                  <p class="text-2xl font-bold">
                    {{ summaryMetrics.totalClicks > 0 ? formatCurrency(summaryMetrics.totalAdSpend / summaryMetrics.totalClicks) : '$0.00' }}
                  </p>
                  <p class="text-xs text-muted-foreground">{{ formatNumber(summaryMetrics.totalClicks) }} clicks</p>
                </div>
                <div class="rounded-full bg-cyan-500/10 p-3 text-cyan-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mouse-pointer w-5 h-5 text-cyan-500"><path d="M12.586 12.586 19 19"></path><path d="M3.688 3.037a.497.497 0 0 0-.651.651l6.5 15.999a.501.501 0 0 0 .947-.062l1.569-6.083a2 2 0 0 1 1.448-1.479l6.124-1.579a.5.5 0 0 0 .063-.947z"></path></svg>
                </div>
              </div>
            </div>
            <div class="rounded-lg border border-border bg-card p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs text-muted-foreground">Cost per Conversion</p>
                  <p class="text-2xl font-bold">
                    {{ summaryMetrics.totalConversions > 0 ? formatCurrency(summaryMetrics.totalAdSpend / summaryMetrics.totalConversions) : '$0.00' }}
                  </p>
                  <p class="text-xs text-muted-foreground">{{ formatNumber(summaryMetrics.totalConversions) }} conversions</p>
                </div>
                <div class="rounded-full bg-violet-500/10 p-3 text-violet-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shopping-cart w-5 h-5 text-violet-500"><circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path></svg>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="performanceAlerts.length > 0" class="rounded-xl border border-border bg-card">
            <div class="flex items-center gap-2 border-b border-border px-4 py-3 text-sm font-semibold">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bell w-4 h-4 text-amber-500"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path></svg>
              Performance Alerts ({{ performanceAlerts.length }})
            </div>
            <div class="max-h-[400px] divide-y divide-border/60 overflow-y-auto">
              <div
                *ngFor="let alert of performanceAlerts"
                class="flex items-start gap-3 p-4"
                [ngClass]="alertRowClass(alert.type)"
              >
                <div class="mt-0.5 flex-shrink-0" [ngClass]="alertIconClass(alert.type)">
                  <svg *ngIf="alert.type === 'critical'" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-5 w-5" stroke-width="2">
                    <path d="M18 6L6 18" />
                    <path d="M6 6l12 12" />
                  </svg>
                  <svg *ngIf="alert.type === 'warning'" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-5 w-5" stroke-width="2">
                    <path d="M12 2l10 18H2L12 2z" />
                    <path d="M12 8v4" />
                    <path d="M12 16h.01" />
                  </svg>
                  <svg *ngIf="alert.type === 'info'" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-5 w-5" stroke-width="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8h.01" />
                    <path d="M12 12v4" />
                  </svg>
                  <svg *ngIf="alert.type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-5 w-5" stroke-width="2">
                    <path d="M5 12l4 4L19 7" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <h4 class="text-sm font-semibold">{{ alert.title }}</h4>
                    <span *ngIf="alert.metric" class="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                      {{ alert.metric }}
                    </span>
                  </div>
                  <p class="mt-1 text-sm text-muted-foreground">{{ alert.description }}</p>
                  <div class="mt-2 flex items-center gap-2 text-xs">
                    <span
                      class="rounded-full px-2 py-0.5"
                      [ngClass]="offerStatusBadgeClass(alert.offer)"
                    >
                      {{ offerStatusLabel(alert.offer) }}
                    </span>
                    <span class="text-muted-foreground">{{ formatOfferDiscount(alert.offer) }}</span>
                  </div>
                </div>
                <button
                  *ngIf="alert.action"
                  type="button"
                  class="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 flex-shrink-0 text-xs"
                  (click)="handleAlertAction(alert)"
                >
                  {{ getActionLabel(alert.action) }}
                </button>
              </div>
            </div>
          </div>

          <div class="rounded-xl border border-border bg-card p-4">
            <div class="mb-4 text-sm font-semibold">Performance Funnel</div>
            <div class="flex flex-wrap items-center gap-3">
              <div class="flex-1 rounded-lg bg-muted/50 p-4 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye w-5 h-5 mx-auto mb-2 text-muted-foreground"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle></svg>
              <div class="mt-2 text-2xl font-bold">{{ formatNumber(summaryMetrics.totalImpressions) }}</div>
              <div class="text-xs text-muted-foreground">Impressions</div>
              </div>
              <div class="text-muted-foreground">→</div>
              <div class="flex-1 rounded-lg bg-muted/50 p-4 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mouse-pointer w-5 h-5 mx-auto mb-2 text-muted-foreground"><path d="M12.586 12.586 19 19"></path><path d="M3.688 3.037a.497.497 0 0 0-.651.651l6.5 15.999a.501.501 0 0 0 .947-.062l1.569-6.083a2 2 0 0 1 1.448-1.479l6.124-1.579a.5.5 0 0 0 .063-.947z"></path></svg>
              <div class="mt-2 text-2xl font-bold">{{ formatNumber(summaryMetrics.totalClicks) }}</div>
                <div class="text-xs text-muted-foreground">Clicks ({{ summaryMetrics.clickThroughRate | number: '1.1-1' }}%)</div>
              </div>
              <div class="text-muted-foreground">→</div>
              <div class="flex-1 rounded-lg bg-muted/50 p-4 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shopping-cart w-5 h-5 mx-auto mb-2 text-muted-foreground"><circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path></svg>
              <div class="mt-2 text-2xl font-bold">{{ formatNumber(summaryMetrics.totalConversions) }}</div>
                <div class="text-xs text-muted-foreground">Conversions ({{ summaryMetrics.avgConversionRate | number: '1.1-1' }}%)</div>
              </div>
              <div class="text-muted-foreground">→</div>
              <div class="flex-1 rounded-lg bg-emerald-500/10 p-4 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-dollar-sign w-5 h-5 mx-auto mb-2 text-emerald-500"><line x1="12" x2="12" y1="2" y2="22"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              <div class="mt-2 text-2xl font-bold text-emerald-500">{{ formatCurrency(summaryMetrics.totalRevenue) }}</div>
                <div class="text-xs text-muted-foreground">Revenue</div>
              </div>
            </div>
          </div>

          <div class="rounded-xl border border-border bg-card">
            <div class="flex items-center gap-2 border-b border-border px-4 py-3 text-sm font-semibold">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tag w-4 h-4"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"></path><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"></circle></svg>
              Active Offers ({{ activeOfferAnalytics.length }})
            </div>
            <div class="divide-y divide-border/60">
              <div
                *ngFor="let analytics of activeOfferAnalytics"
                class="relative"
              >
                <div
                  class="flex cursor-pointer flex-wrap items-center justify-between gap-4 px-4 py-4 hover:bg-muted/30"
                  (click)="toggleOfferExpanded(analytics.offer.id)"
                >
                  <div class="flex min-w-0 flex-1 items-start gap-4">
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2">
                        <h4 class="truncate font-semibold">{{ analytics.offer.name }}</h4>
                        <span class="rounded-full px-2 py-0.5 text-[10px]" [ngClass]="offerStatusBadgeClass(analytics.offer)">
                          {{ offerStatusLabel(analytics.offer) }}
                        </span>
                        <span *ngIf="offerIsEndingSoon(analytics.offer)" class="text-xs text-amber-400">
                          {{ offerDaysRemaining(analytics.offer) }}d left
                        </span>
                      </div>
                      <div class="mt-1 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span>{{ formatOfferDiscount(analytics.offer) }}</span>
                        <span class="flex items-center gap-1">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3" stroke-width="2">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                            <path d="M12 22V12" />
                          </svg>
                          {{ analytics.offer.productIds.length }} product{{ analytics.offer.productIds.length > 1 ? 's' : '' }}
                        </span>
                        <span class="flex items-center gap-1">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3" stroke-width="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M2 12h20" />
                            <path d="M12 2a15 15 0 0 1 0 20" />
                          </svg>
                          {{ activeMarketplacesCount(analytics.offer.id) }}/{{ marketplaceOptions.length }} marketplaces
                        </span>
                      </div>
                    </div>
                    <div class="flex items-center gap-6 text-right text-xs text-muted-foreground">
                      <div>
                        <p>Conversions</p>
                        <p class="text-sm font-semibold text-foreground">{{ formatNumber(analytics.conversions) }}</p>
                      </div>
                      <div>
                        <p>Conv. Rate</p>
                        <p class="text-sm font-semibold text-foreground">{{ analytics.conversionRate | number: '1.1-1' }}%</p>
                      </div>
                      <div>
                        <p>Revenue</p>
                        <p class="text-sm font-semibold text-emerald-400">{{ formatCurrency(analytics.revenue) }}</p>
                      </div>
                      <div>
                        <p>Ad Spend</p>
                        <p class="text-sm font-semibold text-orange-400">{{ formatCurrency(analytics.adSpend) }}</p>
                      </div>
                      <div>
                        <p>ROAS</p>
                        <p class="text-sm font-semibold" [ngClass]="roasClass(analytics.roas)">{{ analytics.roas | number: '1.2-2' }}x</p>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      class="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground"
                      (click)="toggleOfferMenu($event, analytics.offer.id)"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="19" cy="12" r="1" />
                        <circle cx="5" cy="12" r="1" />
                      </svg>
                    </button>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      class="h-4 w-4 text-muted-foreground"
                      stroke-width="2"
                    >
                      <path *ngIf="isOfferExpanded(analytics.offer.id)" d="M6 15l6-6 6 6" />
                      <path *ngIf="!isOfferExpanded(analytics.offer.id)" d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </div>
                <div
                  *ngIf="offerMenuId === analytics.offer.id"
                  class="absolute right-4 top-12 z-10 w-36 rounded-lg border border-border bg-card p-1 text-xs shadow-lg"
                >
                  <button
                    type="button"
                    class="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground"
                    (click)="openEditOffer(analytics.offer)"
                  >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil w-4 h-4 mr-2"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path><path d="m15 5 4 4"></path></svg>
                    Edit Offer
                  </button>
                  <button
                    type="button"
                    class="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent text-destructive focus:text-destructive"
                    (click)="promptDeleteOffer(analytics.offer)"
                  >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2 w-4 h-4 mr-2"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" x2="10" y1="11" y2="17"></line><line x1="14" x2="14" y1="11" y2="17"></line></svg> 
                  Delete Offer
                  </button>
                </div>

                <div *ngIf="isOfferExpanded(analytics.offer.id)" class="bg-muted/20 px-4 pb-4 pt-2">
                  <div class="space-y-4">
                    <div>
                      <p class="flex items-center gap-2 border-b border-border pb-2 text-xs font-semibold text-muted-foreground">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M2 12h20" />
                          <path d="M12 2a15 15 0 0 1 0 20" />
                        </svg>
                        Marketplace Performance
                      </p>
                      <div class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                        <div
                          *ngFor="let market of offerMarketplaceAnalytics[analytics.offer.id] || []"
                          class="rounded-lg border border-border/60 p-3 text-xs"
                          [ngClass]="marketplaceCardClass(market, analytics.offer)"
                        >
                          <div class="flex items-center justify-between">
                            <span class="font-medium">{{ marketplaceLabel(market.marketplace) }}</span>
                            <button
                              type="button"
                              class="relative inline-flex h-5 w-9 items-center rounded-full border border-border transition"
                              [ngClass]="isMarketplaceActive(analytics.offer, market.marketplace) ? 'bg-emerald-500/20' : 'bg-muted'"
                              (click)="toggleOfferMarketplace(analytics.offer, market.marketplace)"
                            >
                              <span
                                class="inline-block h-3.5 w-3.5 transform rounded-full bg-foreground transition"
                                [ngClass]="isMarketplaceActive(analytics.offer, market.marketplace) ? 'translate-x-4' : 'translate-x-1'"
                              ></span>
                            </button>
                          </div>
                          <div *ngIf="isMarketplaceActive(analytics.offer, market.marketplace)" class="mt-2 space-y-1 text-[11px]">
                            <div class="flex justify-between">
                              <span class="text-muted-foreground">Revenue</span>
                              <span class="font-mono text-emerald-400">{{ formatCurrency(market.revenue) }}</span>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-muted-foreground">Conv. Rate</span>
                              <span class="font-mono">{{ market.conversionRate | number: '1.1-1' }}%</span>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-muted-foreground">ROAS</span>
                              <span class="font-mono" [ngClass]="roasClass(market.roas)">{{ market.roas | number: '1.2-2' }}x</span>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-muted-foreground">Ad Spend</span>
                              <span class="font-mono text-orange-400">{{ formatCurrency(market.adSpend) }}</span>
                            </div>
                          </div>
                          <p *ngIf="!isMarketplaceActive(analytics.offer, market.marketplace)" class="mt-2 text-[11px] text-muted-foreground italic">
                            Click toggle to activate
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p class="flex items-center gap-2 border-b border-border pb-2 text-xs font-semibold text-muted-foreground">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                          <path d="M12 22V12" />
                        </svg>
                        Product Performance
                      </p>
                      <div class="mt-3 space-y-2">
                        <div
                          *ngFor="let pa of (offerProductAnalytics[analytics.offer.id] || []) | slice:0:5"
                          class="group flex items-center gap-3 rounded-lg bg-background p-2"
                        >
                          <img [src]="pa.product.image" [alt]="pa.product.name" class="h-8 w-8 rounded object-cover" />
                          <div class="min-w-0 flex-1">
                            <p class="truncate text-sm font-medium">{{ pa.product.name }}</p>
                            <p class="text-xs text-muted-foreground">{{ pa.product.vendorSku }}</p>
                          </div>
                          <div class="flex items-center gap-4 text-right text-xs">
                            <div>
                              <p class="text-muted-foreground">Views</p>
                              <p class="font-mono">{{ formatNumber(pa.impressions) }}</p>
                            </div>
                            <div>
                              <p class="text-muted-foreground">Conv.</p>
                              <p class="font-mono">{{ pa.conversions }}</p>
                            </div>
                            <div>
                              <p class="text-muted-foreground">Rate</p>
                              <p class="font-mono">{{ pa.conversionRate | number: '1.1-1' }}%</p>
                            </div>
                            <div class="w-20">
                              <p class="text-muted-foreground">Revenue</p>
                              <p class="font-mono text-emerald-400">{{ formatCurrency(pa.revenue) }}</p>
                            </div>
                            <div class="flex items-center gap-1">
                              <a
                                [routerLink]="['/product', pa.product.id]"
                                class="rounded-md px-2 py-1 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
                              >
                                Edit
                              </a>
                              <button
                                type="button"
                                class="rounded-md px-2 py-1 text-xs text-rose-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-rose-300"
                                (click)="removeProductFromOffer(analytics.offer.id, pa.product.id, pa.product.name)"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                        <p *ngIf="(offerProductAnalytics[analytics.offer.id] || []).length > 5" class="text-center text-xs text-muted-foreground">
                          +{{ (offerProductAnalytics[analytics.offer.id] || []).length - 5 }} more products
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div *ngIf="activeOfferAnalytics.length === 0" class="p-8 text-center text-muted-foreground">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="mx-auto mb-2 h-8 w-8 opacity-50" stroke-width="2">
                  <path d="M20.59 13.41 12 22 3 13.41a2 2 0 0 1 0-2.82L12 2l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <circle cx="7" cy="7" r="1.5"></circle>
                </svg>
                No active offers
              </div>
            </div>
          </div>

          <div class="grid gap-6 md:grid-cols-2">
            <div class="rounded-xl border border-border bg-card p-4">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-semibold">Offer Performance</h3>
                <select
                  class="h-8 rounded-md border border-border bg-background px-2 text-xs"
                  [(ngModel)]="sortBy"
                  (ngModelChange)="setSortBy($event)"
                >
                  <option value="revenue">Revenue</option>
                  <option value="conversions">Conversions</option>
                  <option value="roi">ROI</option>
                </select>
              </div>
              <div class="mt-4 space-y-3">
                <div *ngFor="let item of performanceChartData">
                  <div class="flex items-center justify-between text-xs">
                    <span class="truncate">{{ item.name }}</span>
                    <span>{{ formatNumber(item[sortBy]) }}</span>
                  </div>
                  <div class="mt-1 h-2 rounded-full bg-muted">
                    <div
                      class="h-2 rounded-full bg-primary"
                      [style.width.%]="chartBarWidth(item)"
                    ></div>
                  </div>
                </div>
                <p *ngIf="performanceChartData.length === 0" class="text-xs text-muted-foreground">
                  No data available.
                </p>
              </div>
            </div>

            <div class="rounded-xl border border-border bg-card p-4">
              <h3 class="text-sm font-semibold">Offer Type Distribution</h3>
              <div class="mt-4 flex gap-4">
                <div class="flex h-36 w-36 items-center justify-center rounded-full border border-border bg-muted/30 text-xs text-muted-foreground">
                  Chart
                </div>
                <div class="flex-1 space-y-2 text-xs">
                  <div *ngFor="let item of typeDistribution; let i = index" class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="h-2 w-2 rounded-full" [ngClass]="chartColorClass(i)"></span>
                      <span>{{ item.name }}</span>
                    </div>
                    <span class="font-semibold">{{ typeDistributionPercent(item.value) }}%</span>
                  </div>
                  <p *ngIf="typeDistribution.length === 0" class="text-muted-foreground">
                    No offers to display.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-xl border border-border bg-card p-4">
            <h3 class="text-sm font-semibold">Revenue &amp; Conversions Trend</h3>
            <div class="mt-4 flex items-end gap-2">
              <div
                *ngFor="let day of revenueTrendData"
                class="flex-1 rounded-md bg-muted/40 p-2 text-center text-[10px]"
              >
                <div class="flex h-16 items-end justify-center">
                  <div
                    class="w-2 rounded bg-primary"
                    [style.height.px]="trendBarHeight(day.revenue)"
                  ></div>
                </div>
                <p class="mt-1 text-[10px] text-muted-foreground">{{ day.day }}</p>
                <p class="font-semibold text-emerald-400">{{ formatCurrency(day.revenue) }}</p>
                <p class="text-[10px] text-muted-foreground">{{ day.conversions }} conv</p>
              </div>
            </div>
          </div>

          <div class="rounded-xl border border-border bg-card">
            <div class="border-b border-border px-4 py-3 text-sm font-semibold">Offer Performance Details</div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="text-xs text-muted-foreground">
                  <tr class="border-b border-border">
                    <th class="min-w-[200px] px-4 py-2 text-left">Offer</th>
                    <th class="px-4 py-2 text-right">Status</th>
                    <th class="px-4 py-2 text-right">Impressions</th>
                    <th class="px-4 py-2 text-right">Clicks</th>
                    <th class="px-4 py-2 text-right">Conversions</th>
                    <th class="px-4 py-2 text-right">Conv. Rate</th>
                    <th class="px-4 py-2 text-right">Revenue</th>
                    <th class="px-4 py-2 text-right">ROI</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let analytics of sortedAnalytics | slice:0:10" class="border-b border-border/60">
                    <td class="px-4 py-3">
                      <div>
                        <p class="truncate font-medium">{{ analytics.offer.name }}</p>
                        <p class="text-xs text-muted-foreground">{{ formatOfferDiscount(analytics.offer) }}</p>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-right">
                      <span class="rounded-full px-2 py-0.5 text-[10px]" [ngClass]="offerStatusBadgeClass(analytics.offer)">
                        {{ offerStatusLabel(analytics.offer) }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right font-mono text-xs">{{ formatNumber(analytics.impressions) }}</td>
                    <td class="px-4 py-3 text-right font-mono text-xs">{{ formatNumber(analytics.clicks) }}</td>
                    <td class="px-4 py-3 text-right font-mono text-xs">{{ formatNumber(analytics.conversions) }}</td>
                    <td class="px-4 py-3 text-right font-mono text-xs">{{ analytics.conversionRate | number: '1.1-1' }}%</td>
                    <td class="px-4 py-3 text-right font-mono text-xs text-emerald-400">{{ formatCurrency(analytics.revenue) }}</td>
                    <td class="px-4 py-3 text-right font-mono text-xs" [ngClass]="analytics.roi >= 0 ? 'text-emerald-400' : 'text-rose-400'">
                      {{ analytics.roi >= 0 ? '+' : '' }}{{ analytics.roi | number: '1.0-0' }}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <div
        *ngIf="editOfferOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in"
        (click)="closeEditOffer()"
      >
        <div
          class="flex w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-card shadow-xl animate-in zoom-in-95 max-h-[90vh]"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-center justify-between border-b border-border px-6 py-4">
            <div class="flex items-center gap-3">
              <span class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </span>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-lg font-semibold">Edit Offer</h3>
                  <span
                    class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    [ngClass]="editOfferIsActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-muted text-muted-foreground'"
                  >
                    {{ editOfferIsActive ? 'Active' : 'Inactive' }}
                  </span>
                </div>
                <p class="text-xs text-muted-foreground">Update offer details and marketplaces.</p>
              </div>
            </div>
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted"
              (click)="closeEditOffer()"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                <path d="M6 6l12 12" />
                <path d="M18 6l-12 12" />
              </svg>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto px-6 py-5">
            <div class="space-y-5">
              <div class="rounded-lg border border-border bg-muted/30 p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-semibold">Offer Status</p>
                    <p class="text-xs text-muted-foreground">This offer is currently {{ editOfferIsActive ? 'active' : 'inactive' }}</p>
                  </div>
                  <button
                    type="button"
                    class="relative inline-flex h-6 w-11 items-center rounded-full border border-border transition"
                    [ngClass]="editOfferIsActive ? 'bg-emerald-500/20' : 'bg-muted'"
                    (click)="editOfferIsActive = !editOfferIsActive"
                  >
                    <span
                      class="inline-block h-4 w-4 transform rounded-full bg-foreground transition"
                      [ngClass]="editOfferIsActive ? 'translate-x-5' : 'translate-x-1'"
                    ></span>
                  </button>
                </div>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <label class="grid gap-1 text-xs text-muted-foreground">
                  Offer Name *
                  <input
                    type="text"
                    class="h-10 rounded-md border border-border bg-background px-3 text-sm"
                    placeholder="e.g., Summer Sale 20% Off"
                    [(ngModel)]="editOfferName"
                  />
                </label>
                <label class="grid gap-1 text-xs text-muted-foreground">
                  Offer Scope
                  <select
                    class="h-10 rounded-md border border-border bg-background px-3 text-sm"
                    [(ngModel)]="editOfferScope"
                  >
                    <option value="product">By Product</option>
                    <option value="marketplace">By Marketplace</option>
                  </select>
                </label>
              </div>

              <label class="grid gap-1 text-xs text-muted-foreground">
                Description (optional)
                <textarea
                  rows="2"
                  class="rounded-md border border-border bg-background px-3 py-2 text-sm"
                  [(ngModel)]="editOfferDescription"
                ></textarea>
              </label>

              <div class="space-y-3">
                <p class="text-xs font-semibold text-muted-foreground">Offer Type *</p>
                <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <button
                    *ngFor="let type of offerTypeOptions"
                    type="button"
                    class="flex flex-col items-center gap-2 rounded-lg border-2 p-3 text-xs transition-all"
                    [ngClass]="editOfferType === type ? 'border-emerald-500 bg-emerald-500/10' : 'border-border hover:border-muted-foreground/50'"
                    (click)="editOfferType = type"
                  >
                    <span
                      class="inline-flex h-8 w-8 items-center justify-center rounded-full"
                      [ngClass]="editOfferType === type ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'"
                    >
                      <ng-container [ngSwitch]="type">
                        <svg *ngSwitchCase="'free_shipping'" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                          <path d="M3 3h13v13H3z" />
                          <path d="M16 8h4l1 3v5h-5z" />
                          <circle cx="7.5" cy="17.5" r="1.5" />
                          <circle cx="17.5" cy="17.5" r="1.5" />
                        </svg>
                        <svg *ngSwitchCase="'percent_discount'" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                          <path d="M19 5L5 19" />
                          <circle cx="6.5" cy="6.5" r="2.5" />
                          <circle cx="17.5" cy="17.5" r="2.5" />
                        </svg>
                        <svg *ngSwitchCase="'fixed_discount'" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                          <path d="M12 2v20" />
                          <path d="M17 5H9.5a3.5 3.5 0 1 0 0 7H14a3.5 3.5 0 1 1 0 7H6" />
                        </svg>
                        <svg *ngSwitchCase="'quantity_discount'" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                          <path d="M3 7h18" />
                          <path d="M3 12h18" />
                          <path d="M3 17h18" />
                        </svg>
                        <svg *ngSwitchCase="'bulk_purchase'" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                          <path d="M12 22V12" />
                          <path d="m3.3 7 7.7 4.7a2 2 0 0 0 2 0L20.7 7" />
                        </svg>
                        <svg *ngSwitchCase="'bogo_half'" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                          <path d="M12 2v20" />
                          <path d="M7 8h10" />
                          <path d="M7 16h10" />
                        </svg>
                        <svg *ngSwitchCase="'bogo_free'" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                          <path d="M12 2v20" />
                          <path d="M7 8h10" />
                          <path d="M7 16h10" />
                        </svg>
                      </ng-container>
                    </span>
                    <span class="text-center text-[11px] font-medium">{{ offerTypeLabels[type] }}</span>
                  </button>
                </div>
              </div>

              <div class="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
                <p class="text-sm font-semibold">Discount Configuration</p>
                <div *ngIf="editOfferType === 'percent_discount' || editOfferType === 'quantity_discount' || editOfferType === 'bulk_purchase'" class="flex flex-wrap items-center gap-3 text-xs">
                  <span class="w-28 font-semibold text-muted-foreground">Discount %</span>
                  <div class="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      class="h-9 w-24 rounded-md border border-border bg-background px-3 text-sm"
                      [(ngModel)]="editOfferDiscountPercent"
                    />
                    <span class="text-muted-foreground">%</span>
                  </div>
                </div>
                <div *ngIf="editOfferType === 'fixed_discount'" class="flex flex-wrap items-center gap-3 text-xs">
                  <span class="w-28 font-semibold text-muted-foreground">Discount Amount</span>
                  <div class="flex items-center gap-2">
                    <span class="text-muted-foreground">$</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      class="h-9 w-24 rounded-md border border-border bg-background px-3 text-sm"
                      [(ngModel)]="editOfferDiscountAmount"
                    />
                  </div>
                </div>
                <div *ngIf="editOfferType === 'quantity_discount' || editOfferType === 'bulk_purchase'" class="flex flex-wrap items-center gap-3 text-xs">
                  <span class="w-28 font-semibold text-muted-foreground">Minimum Qty</span>
                  <input
                    type="number"
                    min="1"
                    class="h-9 w-24 rounded-md border border-border bg-background px-3 text-sm"
                    [(ngModel)]="editOfferMinQty"
                  />
                </div>
                <div *ngIf="editOfferType === 'bogo_half' || editOfferType === 'bogo_free'" class="space-y-3 text-xs">
                  <div class="flex flex-wrap items-center gap-3">
                    <span class="w-28 font-semibold text-muted-foreground">Buy Qty</span>
                    <input
                      type="number"
                      min="1"
                      class="h-9 w-24 rounded-md border border-border bg-background px-3 text-sm"
                      [(ngModel)]="editOfferBuyQty"
                    />
                  </div>
                  <div class="flex flex-wrap items-center gap-3">
                    <span class="w-28 font-semibold text-muted-foreground">Get Qty</span>
                    <div class="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        class="h-9 w-24 rounded-md border border-border bg-background px-3 text-sm"
                        [(ngModel)]="editOfferGetQty"
                      />
                      <span class="text-muted-foreground">
                        {{ editOfferType === 'bogo_half' ? '@ 50% off' : 'free' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <label class="grid gap-1 text-xs text-muted-foreground">
                  Start Date
                  <input
                    type="date"
                    class="h-10 rounded-md border border-border bg-background px-3 text-sm"
                    [(ngModel)]="editOfferStartDate"
                  />
                </label>
                <label class="grid gap-1 text-xs text-muted-foreground">
                  End Date
                  <input
                    type="date"
                    class="h-10 rounded-md border border-border bg-background px-3 text-sm"
                    [(ngModel)]="editOfferEndDate"
                  />
                </label>
              </div>

              <div>
                <p class="text-xs text-muted-foreground">Marketplaces</p>
                <div class="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
                  <button
                    *ngFor="let marketplace of marketplaceOptions"
                    type="button"
                    class="flex items-center justify-between rounded-md border border-border px-3 py-2 text-xs"
                    [ngClass]="editOfferMarketplaces.includes(marketplace.id) ? 'bg-primary/10 text-foreground' : 'text-muted-foreground'"
                    (click)="toggleEditMarketplace(marketplace.id)"
                  >
                    <span>{{ marketplace.label }}</span>
                    <span *ngIf="editOfferMarketplaces.includes(marketplace.id)">✓</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
            <button
              type="button"
              class="rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              (click)="closeEditOffer()"
            >
              Cancel
            </button>
            <button
              type="button"
              class="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500/90"
              (click)="saveEditedOffer()"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <div
        *ngIf="deleteConfirmOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in"
        (click)="closeDeleteConfirm()"
      >
        <div class="w-full max-w-md rounded-xl bg-card p-5 shadow-xl" (click)="$event.stopPropagation()">
          <h3 class="text-lg font-semibold">Delete Offer</h3>
          <p class="mt-2 text-sm text-muted-foreground">
            Are you sure you want to delete "{{ offerToDelete?.name }}"? This action cannot be undone.
          </p>
          <div class="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              class="rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              (click)="closeDeleteConfirm()"
            >
              Cancel
            </button>
            <button
              type="button"
              class="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500/90"
              (click)="confirmDeleteOffer()"
            >
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
export class OfferAnalyticsPageComponent {
  private readonly offerService = inject(OfferService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly marketplaceOptions = MARKETPLACE_LIST;
  readonly products = mockProducts;

  timePeriod = '30';
  sortBy: 'revenue' | 'conversions' | 'roi' = 'revenue';

  offers: Offer[] = [];
  offerAnalytics: OfferAnalytics[] = [];
  offerMarketplaceAnalytics: Record<string, MarketplaceAnalytics[]> = {};
  offerProductAnalytics: Record<string, ProductAnalytics[]> = {};
  filteredOfferAnalytics: OfferAnalytics[] = [];
  activeOfferAnalytics: OfferAnalytics[] = [];

  summaryMetrics: SummaryMetrics = {
    activeOffers: 0,
    totalOffers: 0,
    totalRevenue: 0,
    totalRevenueImpact: 0,
    totalConversions: 0,
    totalClicks: 0,
    totalImpressions: 0,
    avgConversionRate: 0,
    avgROI: 0,
    clickThroughRate: 0,
    totalAdSpend: 0,
    avgRoas: 0,
  };

  performanceAlerts: PerformanceAlert[] = [];
  performanceChartData: Array<{ name: string; revenue: number; conversions: number; roi: number }> = [];
  typeDistribution: Array<{ name: string; value: number }> = [];
  revenueTrendData: Array<{ day: string; revenue: number; conversions: number }> = [];
  sortedAnalytics: OfferAnalytics[] = [];

  marketplaceFilterOpen = false;
  selectedMarketplaces: string[] = [];

  offerMenuId: string | null = null;
  editOfferOpen = false;
  selectedOffer: Offer | null = null;

  editOfferName = '';
  editOfferDescription = '';
  editOfferType: Offer['type'] = 'percent_discount';
  editOfferScope: OfferScope = 'product';
  editOfferDiscountPercent = '10';
  editOfferDiscountAmount = '5';
  editOfferMinQty = '2';
  editOfferBuyQty = '1';
  editOfferGetQty = '1';
  editOfferStartDate = '';
  editOfferEndDate = '';
  editOfferMarketplaces: string[] = [];
  editOfferIsActive = true;
  readonly offerTypeOptions = Object.keys(offerTypeLabels) as Offer['type'][];
  readonly offerTypeLabels = offerTypeLabels;

  deleteConfirmOpen = false;
  offerToDelete: Offer | null = null;

  toastMessages: Array<{ id: number; title: string; text: string }> = [];
  private toastId = 0;

  constructor() {
    this.offerService.offers$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((offers) => {
        this.offers = offers;
        this.recalculateAnalytics();
        this.cdr.markForCheck();
      });
  }

  setTimePeriod(value: string): void {
    this.timePeriod = value;
    this.recalculateAnalytics();
  }

  setSortBy(value: 'revenue' | 'conversions' | 'roi'): void {
    this.sortBy = value;
    this.recalculateAnalytics();
  }

  toggleMarketplaceFilter(id: string): void {
    if (this.selectedMarketplaces.includes(id)) {
      this.selectedMarketplaces = this.selectedMarketplaces.filter((m) => m !== id);
    } else {
      this.selectedMarketplaces = [...this.selectedMarketplaces, id];
    }
    this.recalculateAnalytics();
  }

  toggleSelectAllMarketplaces(): void {
    if (this.selectedMarketplaces.length === this.marketplaceOptions.length) {
      this.selectedMarketplaces = [];
    } else {
      this.selectedMarketplaces = this.marketplaceOptions.map((market) => market.id);
    }
    this.recalculateAnalytics();
  }

  clearMarketplaceSelection(): void {
    this.selectedMarketplaces = [];
    this.recalculateAnalytics();
  }

  get marketplaceFilterLabel(): string {
    if (this.selectedMarketplaces.length === 0) return 'All Marketplaces';
    if (this.selectedMarketplaces.length === this.marketplaceOptions.length) return 'All Marketplaces';
    if (this.selectedMarketplaces.length === 1) {
      return this.marketplaceLabel(this.selectedMarketplaces[0]);
    }
    return `${this.selectedMarketplaces.length} Marketplaces`;
  }

  toggleOfferExpanded(offerId: string): void {
    if (this.expandedOffers.has(offerId)) {
      this.expandedOffers.delete(offerId);
    } else {
      this.expandedOffers.add(offerId);
    }
  }

  isOfferExpanded(offerId: string): boolean {
    return this.expandedOffers.has(offerId);
  }

  toggleOfferMenu(event: MouseEvent, offerId: string): void {
    event.stopPropagation();
    this.offerMenuId = this.offerMenuId === offerId ? null : offerId;
  }

  openEditOffer(offer: Offer): void {
    this.selectedOffer = offer;
    this.editOfferName = offer.name;
    this.editOfferDescription = offer.description ?? '';
    this.editOfferType = offer.type;
    this.editOfferScope = offer.scope;
    this.editOfferDiscountPercent = String(offer.discountPercent ?? 10);
    this.editOfferDiscountAmount = String(offer.discountAmount ?? 5);
    this.editOfferMinQty = String(offer.condition?.minQty ?? 2);
    this.editOfferBuyQty = String(offer.condition?.buyQty ?? 1);
    this.editOfferGetQty = String(offer.condition?.getQty ?? 1);
    this.editOfferStartDate = this.toDateInput(offer.startDate);
    this.editOfferEndDate = this.toDateInput(offer.endDate);
    this.editOfferMarketplaces = [...offer.marketplaces];
    this.editOfferIsActive = offer.isActive;
    this.editOfferOpen = true;
    this.offerMenuId = null;
  }

  closeEditOffer(): void {
    this.editOfferOpen = false;
  }

  toggleEditMarketplace(id: string): void {
    if (this.editOfferMarketplaces.includes(id)) {
      this.editOfferMarketplaces = this.editOfferMarketplaces.filter((m) => m !== id);
    } else {
      this.editOfferMarketplaces = [...this.editOfferMarketplaces, id];
    }
  }

  saveEditedOffer(): void {
    if (!this.selectedOffer) return;
    const startDate = new Date(this.editOfferStartDate);
    const endDate = new Date(this.editOfferEndDate);
    if (!this.editOfferName.trim() || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      this.showToast('Missing fields', 'Please complete the required fields.');
      return;
    }
    const discountPercent =
      this.editOfferType === 'percent_discount' ||
        this.editOfferType === 'quantity_discount' ||
        this.editOfferType === 'bulk_purchase'
        ? this.toNumber(this.editOfferDiscountPercent, 0)
        : undefined;
    const discountAmount =
      this.editOfferType === 'fixed_discount'
        ? this.toNumber(this.editOfferDiscountAmount, 0)
        : undefined;
    const condition =
      this.editOfferType === 'quantity_discount' ||
        this.editOfferType === 'bulk_purchase'
        ? { minQty: this.toNumber(this.editOfferMinQty, 2) }
        : this.editOfferType === 'bogo_half' || this.editOfferType === 'bogo_free'
          ? {
            buyQty: this.toNumber(this.editOfferBuyQty, 1),
            getQty: this.toNumber(this.editOfferGetQty, 1),
          }
          : undefined;

    this.offerService.updateOffer(this.selectedOffer.id, {
      name: this.editOfferName.trim(),
      description: this.editOfferDescription.trim(),
      type: this.editOfferType,
      scope: this.editOfferScope,
      discountPercent,
      discountAmount,
      condition,
      startDate,
      endDate,
      marketplaces: [...this.editOfferMarketplaces],
      isActive: this.editOfferIsActive,
    });
    this.showToast('Offer updated', 'The offer has been updated successfully.');
    this.closeEditOffer();
  }

  promptDeleteOffer(offer: Offer): void {
    this.offerToDelete = offer;
    this.deleteConfirmOpen = true;
    this.offerMenuId = null;
  }

  closeDeleteConfirm(): void {
    this.deleteConfirmOpen = false;
    this.offerToDelete = null;
  }

  confirmDeleteOffer(): void {
    if (!this.offerToDelete) return;
    const name = this.offerToDelete.name;
    this.offerService.deleteOffer(this.offerToDelete.id);
    this.showToast('Offer deleted', `"${name}" has been removed.`);
    this.closeDeleteConfirm();
  }

  handleAlertAction(alert: PerformanceAlert): void {
    this.openEditOffer(alert.offer);
  }

  removeProductFromOffer(offerId: string, productId: string, productName: string): void {
    const offer = this.offers.find((item) => item.id === offerId);
    if (!offer) return;
    const updatedProductIds = offer.productIds.filter((id) => id !== productId);
    this.offerService.updateOffer(offerId, { productIds: updatedProductIds });
    this.showToast('Product removed', `"${productName}" has been removed from the offer.`);
  }

  toggleOfferMarketplace(offer: Offer, marketplaceId: string): void {
    const current = this.normalizedOfferMarketplaces(offer);
    const isActive = current.includes(marketplaceId);
    const updated = isActive
      ? current.filter((id) => id !== marketplaceId)
      : [...current, marketplaceId];
    this.offerService.updateOffer(offer.id, { marketplaces: updated });
    this.showToast(
      isActive ? 'Marketplace deactivated' : 'Marketplace activated',
      `${this.marketplaceLabel(marketplaceId)} has been ${isActive ? 'removed from' : 'added to'} "${offer.name}".`
    );
  }

  activeMarketplacesCount(offerId: string): number {
    const rows = this.offerMarketplaceAnalytics[offerId] ?? [];
    return rows.filter((row) => row.status === 'active').length;
  }

  isMarketplaceActive(offer: Offer, marketplaceId: string): boolean {
    const list = this.normalizedOfferMarketplaces(offer);
    return list.includes(marketplaceId);
  }

  offerDaysRemaining(offer: Offer): number {
    return getOfferDaysRemaining(offer);
  }

  offerIsEndingSoon(offer: Offer): boolean {
    return getOfferStatus(offer) === 'ending_soon';
  }

  offerStatusLabel(offer: Offer): string {
    const status = getOfferStatus(offer);
    return offerStatusConfig[status].label;
  }

  offerStatusBadgeClass(offer: Offer): string {
    const status = getOfferStatus(offer);
    const config = offerStatusConfig[status];
    return `${config.bgColor} ${config.color}`;
  }

  formatOfferDiscount(offer: Offer): string {
    return formatOfferDiscount(offer);
  }

  alertRowClass(type: AlertType): string {
    switch (type) {
      case 'critical':
        return 'bg-rose-500/5';
      case 'warning':
        return 'bg-amber-500/5';
      case 'info':
        return 'bg-blue-500/5';
      case 'success':
        return 'bg-emerald-500/5';
      default:
        return '';
    }
  }

  alertIconClass(type: AlertType): string {
    switch (type) {
      case 'critical':
        return 'text-rose-400';
      case 'warning':
        return 'text-amber-400';
      case 'info':
        return 'text-blue-400';
      case 'success':
        return 'text-emerald-400';
      default:
        return 'text-muted-foreground';
    }
  }

  roasClass(roas: number): string {
    if (roas >= 3) return 'text-emerald-400';
    if (roas >= 2) return 'text-amber-400';
    return 'text-rose-400';
  }

  chartColorClass(index: number): string {
    return CHART_COLORS[index % CHART_COLORS.length];
  }

  typeDistributionPercent(value: number): number {
    const total = this.typeDistribution.reduce((sum, item) => sum + item.value, 0);
    return total === 0 ? 0 : Math.round((value / total) * 100);
  }

  chartBarWidth(item: { revenue: number; conversions: number; roi: number }): number {
    const values = this.performanceChartData.map((row) => row[this.sortBy]);
    const max = Math.max(1, ...values);
    return Math.min(100, Math.round((item[this.sortBy] / max) * 100));
  }

  trendBarHeight(value: number): number {
    const max = Math.max(1, ...this.revenueTrendData.map((row) => row.revenue));
    return Math.max(6, Math.round((value / max) * 60));
  }

  marketplaceLabel(id: string): string {
    return this.marketplaceOptions.find((m) => m.id === id)?.label ?? id;
  }

  marketplaceCardClass(market: MarketplaceAnalytics, offer: Offer): string {
    const isActive = this.isMarketplaceActive(offer, market.marketplace);
    if (!isActive) {
      return 'border-slate-500/30 bg-slate-500/5 opacity-60';
    }
    if (market.status === 'active') {
      return 'border-emerald-500/50 bg-emerald-500/5';
    }
    if (market.status === 'inactive') {
      return 'border-amber-500/50 bg-amber-500/5';
    }
    return 'border-slate-500/30 bg-slate-500/5';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(Math.round(value));
  }

  getActionLabel(action: PerformanceAlert['action']): string {
    switch (action) {
      case 'extend':
        return 'Extend Offer';
      case 'review':
        return 'Review';
      case 'adjust':
        return 'Adjust Discount';
      case 'promote':
        return 'Promote';
      default:
        return 'View';
    }
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

  private readonly expandedOffers = new Set<string>();

  private recalculateAnalytics(): void {
    this.offerAnalytics = this.offers.map((offer, index) => generateOfferAnalytics(offer, index));
    this.offerMarketplaceAnalytics = this.offers.reduce((acc, offer, index) => {
      acc[offer.id] = generateMarketplaceAnalytics(offer, index);
      return acc;
    }, {} as Record<string, MarketplaceAnalytics[]>);
    this.offerProductAnalytics = this.offers.reduce((acc, offer, index) => {
      const products = this.products.filter((product) => offer.productIds.includes(product.id));
      acc[offer.id] = products.map((product, productIndex) =>
        generateProductAnalytics(product, index, productIndex)
      );
      return acc;
    }, {} as Record<string, ProductAnalytics[]>);

    this.filteredOfferAnalytics = this.selectedMarketplaces.length === 0
      ? this.offerAnalytics
      : this.offerAnalytics.filter((analytics) => {
        const offerMarkets = this.normalizedOfferMarketplaces(analytics.offer);
        return this.selectedMarketplaces.some((market) => offerMarkets.includes(market));
      });

    this.activeOfferAnalytics = this.filteredOfferAnalytics.filter((analytics) => {
      const status = getOfferStatus(analytics.offer);
      return status === 'active' || status === 'ending_soon' || status === 'just_created';
    });

    this.summaryMetrics = this.computeSummaryMetrics();
    this.performanceAlerts = this.computePerformanceAlerts();
    this.performanceChartData = this.computePerformanceChartData();
    this.typeDistribution = this.computeTypeDistribution();
    this.revenueTrendData = this.computeRevenueTrendData();
    this.sortedAnalytics = [...this.filteredOfferAnalytics].sort((a, b) => b[this.sortBy] - a[this.sortBy]);
  }

  private computeSummaryMetrics(): SummaryMetrics {
    const activeOffers = this.activeOfferAnalytics;
    if (this.selectedMarketplaces.length > 0 && this.selectedMarketplaces.length < this.marketplaceOptions.length) {
      let totalRevenue = 0;
      let totalRevenueImpact = 0;
      let totalConversions = 0;
      let totalClicks = 0;
      let totalImpressions = 0;
      let totalAdSpend = 0;

      activeOffers.forEach((analytics) => {
        const mpAnalytics = this.offerMarketplaceAnalytics[analytics.offer.id] || [];
        mpAnalytics.forEach((mp) => {
          if (this.selectedMarketplaces.includes(mp.marketplace) && mp.status === 'active') {
            totalRevenue += mp.revenue;
            totalConversions += mp.conversions;
            totalClicks += mp.clicks;
            totalImpressions += mp.impressions;
            totalAdSpend += mp.adSpend;
          }
        });
        totalRevenueImpact += analytics.revenueImpact * (this.selectedMarketplaces.length / this.marketplaceOptions.length);
      });

      const avgConversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
      const avgROI = activeOffers.length > 0
        ? activeOffers.reduce((sum, analytics) => sum + analytics.roi, 0) / activeOffers.length
        : 0;
      const avgRoas = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0;

      return {
        activeOffers: activeOffers.length,
        totalOffers: this.filteredOfferAnalytics.length,
        totalRevenue,
        totalRevenueImpact,
        totalConversions,
        totalClicks,
        totalImpressions,
        avgConversionRate,
        avgROI,
        clickThroughRate: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
        totalAdSpend,
        avgRoas,
      };
    }

    const totalRevenue = activeOffers.reduce((sum, analytics) => sum + analytics.revenue, 0);
    const totalRevenueImpact = activeOffers.reduce((sum, analytics) => sum + analytics.revenueImpact, 0);
    const totalConversions = activeOffers.reduce((sum, analytics) => sum + analytics.conversions, 0);
    const totalClicks = activeOffers.reduce((sum, analytics) => sum + analytics.clicks, 0);
    const totalImpressions = activeOffers.reduce((sum, analytics) => sum + analytics.impressions, 0);
    const avgConversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    const avgROI = activeOffers.length > 0
      ? activeOffers.reduce((sum, analytics) => sum + analytics.roi, 0) / activeOffers.length
      : 0;
    const totalAdSpend = activeOffers.reduce((sum, analytics) => sum + analytics.adSpend, 0);
    const avgRoas = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0;

    return {
      activeOffers: activeOffers.length,
      totalOffers: this.filteredOfferAnalytics.length,
      totalRevenue,
      totalRevenueImpact,
      totalConversions,
      totalClicks,
      totalImpressions,
      avgConversionRate,
      avgROI,
      clickThroughRate: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      totalAdSpend,
      avgRoas,
    };
  }

  private computePerformanceAlerts(): PerformanceAlert[] {
    const alerts: PerformanceAlert[] = [];
    const avgConversionRate = this.summaryMetrics.avgConversionRate;
    const avgROI = this.summaryMetrics.avgROI;

    this.filteredOfferAnalytics.forEach((analytics) => {
      const status = getOfferStatus(analytics.offer);
      const daysRemaining = getOfferDaysRemaining(analytics.offer);
      const isActive = status === 'active' || status === 'ending_soon' || status === 'just_created';
      if (!isActive) return;

      if (status === 'ending_soon' && analytics.conversionRate > avgConversionRate * 1.2) {
        alerts.push({
          id: `ending-high-${analytics.offer.id}`,
          type: 'warning',
          title: 'High-Performer Ending Soon',
          description: `"${analytics.offer.name}" has ${analytics.conversionRate.toFixed(1)}% conversion rate but ends in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Consider extending.`,
          offer: analytics.offer,
          metric: `${analytics.conversionRate.toFixed(1)}% conv.`,
          action: 'extend',
        });
      }

      if (analytics.conversionRate < avgConversionRate * 0.5 && analytics.impressions > 1000) {
        alerts.push({
          id: `low-conv-${analytics.offer.id}`,
          type: 'critical',
          title: 'Low Conversion Rate',
          description: `"${analytics.offer.name}" has only ${analytics.conversionRate.toFixed(1)}% conversion rate (avg: ${avgConversionRate.toFixed(1)}%). Review offer terms.`,
          offer: analytics.offer,
          metric: `${analytics.conversionRate.toFixed(1)}% vs ${avgConversionRate.toFixed(1)}%`,
          action: 'review',
        });
      }

      if (analytics.roi < 0) {
        alerts.push({
          id: `neg-roi-${analytics.offer.id}`,
          type: 'critical',
          title: 'Negative ROI',
          description: `"${analytics.offer.name}" has ${analytics.roi.toFixed(0)}% ROI. The discount cost exceeds revenue impact.`,
          offer: analytics.offer,
          metric: `${analytics.roi.toFixed(0)}% ROI`,
          action: 'adjust',
        });
      }

      if (analytics.conversionRate > avgConversionRate * 1.5 && analytics.roi > avgROI * 1.5) {
        alerts.push({
          id: `top-${analytics.offer.id}`,
          type: 'success',
          title: 'Top Performer',
          description: `"${analytics.offer.name}" is outperforming with ${analytics.conversionRate.toFixed(1)}% conversion and ${analytics.roi.toFixed(0)}% ROI.`,
          offer: analytics.offer,
          metric: `${analytics.roi.toFixed(0)}% ROI`,
        });
      }

      if (analytics.impressions < 500 && daysRemaining < 7) {
        alerts.push({
          id: `low-imp-${analytics.offer.id}`,
          type: 'info',
          title: 'Low Visibility',
          description: `"${analytics.offer.name}" has only ${analytics.impressions} impressions. Consider promoting it more.`,
          offer: analytics.offer,
          metric: `${analytics.impressions} views`,
          action: 'promote',
        });
      }
    });

    const priority: Record<AlertType, number> = { critical: 0, warning: 1, info: 2, success: 3 };
    return alerts.sort((a, b) => priority[a.type] - priority[b.type]);
  }

  private computePerformanceChartData(): Array<{ name: string; revenue: number; conversions: number; roi: number }> {
    return this.filteredOfferAnalytics
      .filter((analytics) => getOfferStatus(analytics.offer) !== 'expired')
      .sort((a, b) => b[this.sortBy] - a[this.sortBy])
      .slice(0, 6)
      .map((analytics) => ({
        name: analytics.offer.name.length > 15 ? `${analytics.offer.name.slice(0, 15)}...` : analytics.offer.name,
        revenue: Math.round(analytics.revenue),
        conversions: analytics.conversions,
        roi: Math.round(analytics.roi),
      }));
  }

  private computeTypeDistribution(): Array<{ name: string; value: number }> {
    const typeCounts: Record<string, number> = {};
    this.filteredOfferAnalytics.forEach((analytics) => {
      const type = offerTypeLabels[analytics.offer.type];
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    return Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
  }

  private computeRevenueTrendData(): Array<{ day: string; revenue: number; conversions: number }> {
    const days = Math.min(Number(this.timePeriod), 14);
    return Array.from({ length: days }, (_, index) => ({
      day: `Day ${index + 1}`,
      revenue: Math.floor(Math.random() * 5000 + 2000),
      conversions: Math.floor(Math.random() * 100 + 20),
    }));
  }

  private normalizedOfferMarketplaces(offer: Offer): string[] {
    return offer.marketplaces.length > 0 ? offer.marketplaces : this.marketplaceOptions.slice(0, 3).map((m) => m.id);
  }

  private toDateInput(value: Date): string {
    return new Date(value).toISOString().split('T')[0];
  }

  private toNumber(value: string, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
}

function generateOfferAnalytics(offer: Offer, index: number): OfferAnalytics {
  const seed = offer.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (min: number, max: number) => {
    const x = Math.sin(seed * (index + 1)) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min) + min);
  };

  const status = getOfferStatus(offer);
  const isActive = status === 'active' || status === 'ending_soon' || status === 'just_created';
  const multiplier = isActive ? 1 : 0.3;

  const impressions = random(5000, 50000) * multiplier;
  const clicks = Math.floor(impressions * (random(5, 15) / 100));
  const conversions = Math.floor(clicks * (random(3, 12) / 100));
  const revenue = conversions * random(25, 150);
  const revenueImpact = revenue * (random(10, 35) / 100);
  const averageOrderValue = conversions > 0 ? revenue / conversions : 0;
  const discountCost = revenue * ((offer.discountPercent || 10) / 100);
  const costPerConversion = conversions > 0 ? discountCost / conversions : 0;
  const roi = discountCost > 0 ? ((revenueImpact - discountCost) / discountCost) * 100 : 0;
  const adSpend = random(100, 2000) * multiplier;
  const roas = adSpend > 0 ? revenue / adSpend : 0;

  return {
    offer,
    impressions: Math.floor(impressions),
    clicks,
    conversions,
    conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
    revenue,
    revenueImpact,
    averageOrderValue,
    costPerConversion,
    roi,
    adSpend,
    roas,
  };
}

function generateProductAnalytics(
  product: Product,
  offerIndex: number,
  productIndex: number
): ProductAnalytics {
  const seed = product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (min: number, max: number) => {
    const x = Math.sin(seed * (offerIndex + 1) * (productIndex + 1)) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min) + min);
  };

  const impressions = random(500, 5000);
  const clicks = Math.floor(impressions * (random(5, 15) / 100));
  const conversions = Math.floor(clicks * (random(3, 12) / 100));
  const revenue = conversions * random(25, 150);

  return {
    product,
    impressions,
    clicks,
    conversions,
    revenue,
    conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
  };
}

function generateMarketplaceAnalytics(offer: Offer, offerIndex: number): MarketplaceAnalytics[] {
  const offerMarketplaces = offer.marketplaces.length > 0 ? offer.marketplaces : MARKETPLACE_LIST.slice(0, 3).map((m) => m.id);

  return MARKETPLACE_LIST.map((marketplace, mpIndex) => {
    const seed = (offer.id + marketplace.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = (min: number, max: number) => {
      const x = Math.sin(seed * (offerIndex + 1) * (mpIndex + 1)) * 10000;
      return Math.floor((x - Math.floor(x)) * (max - min) + min);
    };

    const isActive = offerMarketplaces.includes(marketplace.id);
    const status: MarketplaceAnalytics['status'] = isActive
      ? (random(0, 10) > 2 ? 'active' : 'inactive')
      : 'not_listed';

    const multiplier = status === 'active' ? 1 : status === 'inactive' ? 0.1 : 0;
    const impressions = random(1000, 15000) * multiplier;
    const clicks = Math.floor(impressions * (random(5, 15) / 100));
    const conversions = Math.floor(clicks * (random(3, 12) / 100));
    const revenue = conversions * random(25, 150);
    const adSpend = random(50, 800) * multiplier;
    const roas = adSpend > 0 ? revenue / adSpend : 0;

    return {
      marketplace: marketplace.id,
      status,
      impressions: Math.floor(impressions),
      clicks,
      conversions,
      revenue,
      conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
      adSpend,
      roas,
    };
  });
}
