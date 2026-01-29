import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { marketplacePlatforms, mockProducts } from '@/data/mockProducts';
import { MarketplaceStatus, Product } from '@/types/product';
import { CreateOfferDialogComponent } from '@/app/components/create-offer-dialog/create-offer-dialog.component';

type TabId =
  | 'overview'
  | 'pricing'
  | 'identifiers'
  | 'images'
  | 'marketplaces'
  | 'content'
  | 'options'
  | 'extra'
  | 'tags'
  | 'sales'
  | 'offers';

interface OfferRow {
  name: string;
  status: 'Active' | 'Scheduled' | 'Paused';
  discount: string;
  duration: string;
}

interface OptionSet {
  name: string;
  display: string;
  choices: string[];
  imageLink: boolean;
}

interface VariationRow {
  name: string;
  sku: string;
  stock: number;
  priceDelta: string;
}

interface AttributeRow {
  name: string;
  value: string;
  type: string;
}

interface InventoryLocation {
  name: string;
  onHand: number;
  reserved: number;
  available: number;
}

interface SalesRow {
  label: string;
  units: number;
  revenue: number;
}

type IdentifierKey = 'skus' | 'upcs' | 'asins' | 'fnskus' | 'gtins' | 'eans' | 'isbns';

@Component({
  selector: 'app-product-edit-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CreateOfferDialogComponent],
  template: `
    <section class="min-h-screen bg-background flex flex-col">
      <ng-container *ngIf="product$ | async as product">
        <header class="px-6 py-4 border-b border-border bg-background">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted"
                aria-label="Back to products"
                (click)="goBack()"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-4 w-4"
                >
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </button>
              <img
                [src]="product.image"
                [alt]="product.name"
                class="h-20 w-20 rounded-lg border border-border bg-muted object-cover"
              />
              <div>
                <h1 class="text-2xl font-semibold flex flex-wrap items-center gap-2">
                  {{ product.name }}
                  <span
                    *ngIf="product.productType === 'kit'"
                    class="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="h-3.5 w-3.5"
                    >
                      <path
                        d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
                      ></path>
                      <path d="M12 22V12"></path>
                      <path d="m3.3 7 8.7 5 8.7-5"></path>
                      <path d="m7.5 4.27 9 5.15"></path>
                    </svg>
                    Kit
                  </span>
                </h1>
                <p class="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span class="flex items-center gap-1.5">
                    <span class="text-base font-semibold text-muted-foreground">#</span>
                    {{ product.productId }}
                  </span>
                  <span
                    *ngIf="product.variationId"
                    class="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs"
                  >
                    Variation: {{ product.variationId }}
                  </span>
                </p>
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <button
                type="button"
                class="rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                (click)="cancelEdit()"
              >
                Cancel
              </button>
              <button
                type="button"
                class="rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                (click)="saveChanges()"
              >
                Save Changes
              </button>
              <button
                type="button"
                class="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                (click)="saveAndList()"
              >
                Save &amp; List
              </button>
            </div>
          </div>
        </header>

        <div class="px-6">
          <div class="mt-3 overflow-x-auto">
            <div class="inline-flex h-10 min-w-max items-center justify-start rounded-md bg-muted p-1 text-muted-foreground">
            <button
              type="button"
              class="inline-flex items-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all hover:text-foreground"
              [class.bg-background]="activeTab === 'overview'"
              [class.text-foreground]="activeTab === 'overview'"
              [class.shadow-sm]="activeTab === 'overview'"
              (click)="selectTab('overview')"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4"
              >
                <path
                  d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
                ></path>
                <path d="M12 22V12"></path>
                <path d="m3.3 7 8.7 5 8.7-5"></path>
                <path d="m7.5 4.27 9 5.15"></path>
              </svg>
              Overview
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all hover:text-foreground"
              [class.bg-background]="activeTab === 'pricing'"
              [class.text-foreground]="activeTab === 'pricing'"
              [class.shadow-sm]="activeTab === 'pricing'"
              (click)="selectTab('pricing')"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4"
              >
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path
                  d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                ></path>
              </svg>
              Pricing &amp; Inventory
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all hover:text-foreground"
              [class.bg-background]="activeTab === 'identifiers'"
              [class.text-foreground]="activeTab === 'identifiers'"
              [class.shadow-sm]="activeTab === 'identifiers'"
              (click)="selectTab('identifiers')"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4"
              >
                <path d="M3 5v14"></path>
                <path d="M8 5v14"></path>
                <path d="M12 5v14"></path>
                <path d="M17 5v14"></path>
                <path d="M21 5v14"></path>
              </svg>
              Identifiers
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all hover:text-foreground"
              [class.bg-background]="activeTab === 'images'"
              [class.text-foreground]="activeTab === 'images'"
              [class.shadow-sm]="activeTab === 'images'"
              (click)="selectTab('images')"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <path d="m21 15-5-5L5 21"></path>
              </svg>
              Images
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all hover:text-foreground"
              [class.bg-background]="activeTab === 'marketplaces'"
              [class.text-foreground]="activeTab === 'marketplaces'"
              [class.shadow-sm]="activeTab === 'marketplaces'"
              (click)="selectTab('marketplaces')"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              Marketplaces
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all hover:text-foreground"
              [class.bg-background]="activeTab === 'content'"
              [class.text-foreground]="activeTab === 'content'"
              [class.shadow-sm]="activeTab === 'content'"
              (click)="selectTab('content')"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <line x1="10" y1="9" x2="8" y2="9"></line>
              </svg>
              Content
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all hover:text-foreground"
              [class.bg-background]="activeTab === 'options'"
              [class.text-foreground]="activeTab === 'options'"
              [class.shadow-sm]="activeTab === 'options'"
              (click)="selectTab('options')"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4"
              >
                <circle cx="13.5" cy="6.5" r=".5"></circle>
                <circle cx="17.5" cy="10.5" r=".5"></circle>
                <circle cx="8.5" cy="7.5" r=".5"></circle>
                <circle cx="6.5" cy="12.5" r=".5"></circle>
                <path
                  d="M12 22a10 10 0 1 0-10-10 3 3 0 0 0 3 3h2a2 2 0 0 1 2 2 3 3 0 0 0 3 3z"
                ></path>
              </svg>
              Product Options
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all hover:text-foreground"
              [class.bg-background]="activeTab === 'extra'"
              [class.text-foreground]="activeTab === 'extra'"
              [class.shadow-sm]="activeTab === 'extra'"
              (click)="selectTab('extra')"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4"
              >
                <path d="M20 7h-9"></path>
                <path d="M14 17H5"></path>
                <circle cx="17" cy="17" r="3"></circle>
                <circle cx="7" cy="7" r="3"></circle>
              </svg>
              Extra Attributes
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all hover:text-foreground"
              [class.bg-background]="activeTab === 'tags'"
              [class.text-foreground]="activeTab === 'tags'"
              [class.shadow-sm]="activeTab === 'tags'"
              (click)="selectTab('tags')"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4"
              >
                <path
                  d="M20.59 13.41 12 22 3 13.41a2 2 0 0 1 0-2.82L12 2l8.59 8.59a2 2 0 0 1 0 2.82z"
                ></path>
                <circle cx="7" cy="7" r="1.5"></circle>
              </svg>
              Tags
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all hover:text-foreground"
              [class.bg-background]="activeTab === 'sales'"
              [class.text-foreground]="activeTab === 'sales'"
              [class.shadow-sm]="activeTab === 'sales'"
              (click)="selectTab('sales')"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4"
              >
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                <polyline points="16 7 22 7 22 13"></polyline>
              </svg>
              Sales Overview
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all hover:text-foreground"
              [class.bg-background]="activeTab === 'offers'"
              [class.text-foreground]="activeTab === 'offers'"
              [class.shadow-sm]="activeTab === 'offers'"
              (click)="selectTab('offers')"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4"
              >
                <path
                  d="M20.59 13.41 12 22 3 13.41a2 2 0 0 1 0-2.82L12 2l8.59 8.59a2 2 0 0 1 0 2.82z"
                ></path>
                <circle cx="7" cy="7" r="1.5"></circle>
              </svg>
              Offers
            </button>
            </div>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto px-6 pb-10">
          <div *ngIf="activeTab === 'overview'" class="py-6 space-y-6">
            <div class="grid gap-6 lg:grid-cols-2">
              <div class="space-y-4">
                <h3 class="text-lg font-semibold flex items-center gap-2">
                  <span class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="h-4 w-4"
                    >
                      <path
                        d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
                      ></path>
                      <path d="M12 22V12"></path>
                      <path d="m3.3 7 8.7 5 8.7-5"></path>
                      <path d="m7.5 4.27 9 5.15"></path>
                    </svg>
                  </span>
                  Basic Information
                </h3>
                <div class="rounded-lg bg-muted/30 p-4 space-y-4">
                  <div class="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label class="text-sm text-muted-foreground">Brand</label>
                      <div class="relative mt-1" (click)="$event.stopPropagation()">
                        <button
                          type="button"
                          class="flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm"
                          (click)="toggleBrandDropdown($event)"
                        >
                          <span class="truncate text-left">
                            {{ product.brand || 'Select brand...' }}
                          </span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="h-4 w-4 text-muted-foreground"
                          >
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </button>
                        <div
                          *ngIf="brandDropdownOpen"
                          class="absolute z-50 mt-2 w-full rounded-lg border border-border bg-card/95 p-2 shadow-xl backdrop-blur"
                        >
                          <div class="mb-2 flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-xs">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              class="h-3.5 w-3.5 text-muted-foreground"
                            >
                              <circle cx="11" cy="11" r="8"></circle>
                              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <input
                              type="text"
                              class="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                              placeholder="Search brand..."
                              [(ngModel)]="brandSearch"
                              (click)="$event.stopPropagation()"
                            />
                          </div>
                          <div class="max-h-48 overflow-auto">
                            <button
                              *ngFor="let brand of filteredBrands"
                              type="button"
                              class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                              [class.bg-primary]="brand === product.brand"
                              [class.text-primary-foreground]="brand === product.brand"
                              (click)="selectBrand(product, brand)"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                class="h-4 w-4"
                              >
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                              <span class="truncate">{{ brand }}</span>
                            </button>
                            <div
                              *ngIf="filteredBrands.length === 0"
                              class="px-2 py-2 text-xs text-muted-foreground"
                            >
                              No brands found.
                            </div>
                          </div>
                          <div class="mt-2 border-t border-border pt-2">
                            <button
                              type="button"
                              class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-primary hover:bg-muted"
                              (click)="openAddBrandModal($event)"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                class="h-4 w-4"
                              >
                                <path d="M5 12h14"></path>
                                <path d="M12 5v14"></path>
                              </svg>
                              Add New Brand
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label class="text-sm text-muted-foreground">Vendor</label>
                      <div class="relative mt-1" (click)="$event.stopPropagation()">
                        <button
                          type="button"
                          class="flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm"
                          (click)="toggleVendorDropdown($event)"
                        >
                          <span class="truncate text-left">
                            {{ product.vendorName || 'Select vendor...' }}
                          </span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="h-4 w-4 text-muted-foreground"
                          >
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </button>
                        <div
                          *ngIf="vendorDropdownOpen"
                          class="absolute z-50 mt-2 w-full rounded-lg border border-border bg-card/95 p-2 shadow-xl backdrop-blur"
                        >
                          <div class="mb-2 flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-xs">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              class="h-3.5 w-3.5 text-muted-foreground"
                            >
                              <circle cx="11" cy="11" r="8"></circle>
                              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <input
                              type="text"
                              class="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                              placeholder="Search vendor..."
                              [(ngModel)]="vendorSearch"
                              (click)="$event.stopPropagation()"
                            />
                          </div>
                          <div class="max-h-48 overflow-auto">
                            <button
                              *ngFor="let vendor of filteredVendors"
                              type="button"
                              class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                              [class.bg-primary]="vendor === product.vendorName"
                              [class.text-primary-foreground]="vendor === product.vendorName"
                              (click)="selectVendor(product, vendor)"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                class="h-4 w-4"
                              >
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                              <span class="truncate">{{ vendor }}</span>
                            </button>
                            <div
                              *ngIf="filteredVendors.length === 0"
                              class="px-2 py-2 text-xs text-muted-foreground"
                            >
                              No vendors found.
                            </div>
                          </div>
                          <div class="mt-2 border-t border-border pt-2">
                            <button
                              type="button"
                              class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-primary hover:bg-muted"
                              (click)="openAddVendorModal($event)"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                class="h-4 w-4"
                              >
                                <path d="M5 12h14"></path>
                                <path d="M12 5v14"></path>
                              </svg>
                              Add New Vendor
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <label class="grid gap-1 text-xs text-muted-foreground">
                    SKU
                    <input
                      type="text"
                      class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                      [value]="product.vendorSku"
                    />
                  </label>
                  <label class="grid gap-1 text-xs text-muted-foreground">
                    MPN (Manufacturer Part Number)
                    <input
                      type="text"
                      class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                      [value]="product.manufacturerPart"
                    />
                  </label>
                  <div *ngIf="product.variation" class="flex items-center gap-2 text-sm">
                    <span class="rounded-full border border-border px-2 py-0.5 text-xs">
                      {{ product.variation.type }}
                    </span>
                    <span class="font-medium">{{ product.variation.value }}</span>
                  </div>
                </div>

                <div class="rounded-lg bg-muted/30 p-4">
                  <div class="flex items-center justify-between">
                    <h4 class="text-sm font-semibold">Active Offers</h4>
                    <button
                      type="button"
                      class="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
                      (click)="selectTab('offers')"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                      Manage Offers
                    </button>
                  </div>
                  <div class="mt-3 grid grid-cols-3 gap-3">
                    <div class="rounded-lg bg-background/60 p-3 text-center">
                      <p class="text-lg font-semibold text-emerald-500">1</p>
                      <p class="text-xs text-muted-foreground">Active</p>
                    </div>
                    <div class="rounded-lg bg-background/60 p-3 text-center">
                      <p class="text-lg font-semibold">1</p>
                      <p class="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div class="rounded-lg bg-background/60 p-3 text-center">
                      <p class="text-lg font-semibold text-emerald-500">$1,124</p>
                      <p class="text-xs text-muted-foreground">Revenue</p>
                    </div>
                  </div>
                  <div class="mt-4 space-y-2">
                    <p class="text-xs font-semibold text-muted-foreground">Top Offers</p>
                    <div class="flex items-center justify-between rounded-lg bg-background px-3 py-2 text-xs">
                      <div class="flex items-center gap-2">
                        <span class="font-semibold">Summer Sale</span>
                        <span class="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-600">
                          Active
                        </span>
                      </div>
                      <span class="text-muted-foreground">20% Off</span>
                    </div>
                  </div>
                </div>

                <div class="rounded-lg bg-muted/30 p-4">
                  <div class="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4 text-muted-foreground" stroke-width="2">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 3v18" />
                      <path d="M3 12h18" />
                    </svg>
                    <h4 class="text-sm font-semibold">Marketplace Status</h4>
                  </div>
                  <ng-container *ngIf="marketplaceSummary(product) as summary">
                    <div class="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span class="flex items-center gap-2">
                        <span class="inline-flex h-4 w-4 items-center justify-center rounded-full border border-emerald-500/40 text-emerald-500">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3" stroke-width="2">
                            <path d="M5 12l4 4L19 7" />
                          </svg>
                        </span>
                        {{ summary.live }} Live
                      </span>
                      <span class="flex items-center gap-2">
                        <span class="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-400/40 text-slate-400">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3" stroke-width="2">
                            <path d="M6 6l12 12" />
                            <path d="M18 6l-12 12" />
                          </svg>
                        </span>
                        {{ summary.inactive }} Inactive
                      </span>
                      <span class="flex items-center gap-2">
                        <span class="inline-flex h-4 w-4 items-center justify-center rounded-full border border-rose-500/40 text-rose-500">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3" stroke-width="2">
                            <path d="M6 6l12 12" />
                            <path d="M18 6l-12 12" />
                          </svg>
                        </span>
                        {{ summary.error }} Error
                      </span>
                      <span class="flex items-center gap-2">
                        <span class="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-slate-300">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3" stroke-width="2">
                            <path d="M12 6v12" />
                          </svg>
                        </span>
                        {{ summary.notListed }} Not Listed
                      </span>
                    </div>
                    <div class="mt-4 flex flex-wrap gap-2">
                      <div
                        *ngFor="let row of summary.preview"
                        class="flex items-center gap-2 rounded-full border px-2 py-1 text-[11px]"
                        [ngClass]="marketplaceBadgeClass(row.status)"
                      >
                        <span
                          class="inline-flex items-center justify-center rounded-md px-1.5 py-0.5 text-[9px] font-semibold"
                          [ngClass]="platformBadgeClass(row.platform)"
                        >
                          {{ platformBadgeLabel(row.platform) }}
                        </span>
                        <span class="font-semibold">{{ platformLabel(row.platform) }}</span>
                        <span [ngClass]="marketplaceTextClass(row.status)">
                          • {{ statusLabel(row.status) }}
                        </span>
                      </div>
                      <span class="rounded-full border border-border px-2 py-1 text-[11px] text-muted-foreground">
                        +{{ summary.all.length - summary.preview.length }} more
                      </span>
                    </div>
                  </ng-container>
                </div>
              </div>

              <div class="space-y-4">
                <h3 class="text-lg font-semibold">Quick Stats</h3>
                <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div class="rounded-lg bg-muted/30 p-4">
                    <p class="text-xs text-muted-foreground">Sale Price</p>
                    <input
                      type="number"
                      class="mt-2 w-full border-b border-dashed border-muted-foreground/40 bg-transparent text-lg font-semibold focus:outline-none"
                      [(ngModel)]="product.salePrice"
                      [ngModelOptions]="{ standalone: true }"
                    />
                  </div>
                  <div class="rounded-lg bg-muted/30 p-4">
                    <p class="text-xs text-muted-foreground">Profit Margin</p>
                    <p class="mt-2 text-lg font-semibold text-emerald-600">
                      {{ product.grossProfitPercent | number: '1.0-2' }}%
                    </p>
                  </div>
                  <div class="rounded-lg bg-muted/30 p-4">
                    <p class="text-xs text-muted-foreground">In Stock</p>
                    <input
                      type="number"
                      class="mt-2 w-full border-b border-dashed border-muted-foreground/40 bg-transparent text-lg font-semibold focus:outline-none"
                      [(ngModel)]="product.stockQty"
                      [ngModelOptions]="{ standalone: true }"
                    />
                  </div>
                  <div class="rounded-lg bg-muted/30 p-4">
                    <p class="text-xs text-muted-foreground">Shipping Cost</p>
                    <input
                      type="number"
                      class="mt-2 w-full border-b border-dashed border-muted-foreground/40 bg-transparent text-lg font-semibold focus:outline-none"
                      [(ngModel)]="product.shippingCost"
                      [ngModelOptions]="{ standalone: true }"
                    />
                  </div>
                </div>

                <div class="space-y-3 rounded-lg border border-border bg-card p-4">
                  <div class="flex items-center justify-between">
                    <h4 class="text-sm font-semibold text-muted-foreground">
                      Revenue &amp; Profit Summary
                    </h4>
                    <details class="relative" [open]="revenueRangeOpen">
                      <summary
                        class="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                        (click)="$event.preventDefault(); revenueRangeOpen = !revenueRangeOpen"
                      >
                        {{ revenueRange }}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3" stroke-width="2">
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </summary>
                      <div class="absolute right-0 mt-2 w-40 rounded-lg border border-border bg-card p-1 shadow-lg">
                        <button
                          *ngFor="let option of revenueRanges"
                          type="button"
                          class="flex w-full items-center justify-between rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                          (click)="setRevenueRange(option)"
                        >
                          <span>{{ option }}</span>
                          <span *ngIf="revenueRange === option">✓</span>
                        </button>
                      </div>
                    </details>
                  </div>
                  <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div class="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                      <p class="text-xs font-semibold text-emerald-600">Total Revenue</p>
                      <p class="text-lg font-semibold text-emerald-500">$35,657.96</p>
                      <p class="text-xs text-muted-foreground">942 units sold</p>
                    </div>
                    <div class="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
                      <p class="text-xs font-semibold text-blue-500">Gross Profit</p>
                      <p class="text-lg font-semibold text-blue-500">$469.20</p>
                      <p class="text-xs text-muted-foreground">
                        {{ product.grossProfitPercent | number: '1.0-2' }}% margin
                      </p>
                    </div>
                    <div class="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3">
                      <p class="text-xs font-semibold text-purple-500">Avg Daily Sales</p>
                      <p class="text-lg font-semibold text-purple-500">31.4</p>
                      <p class="text-xs text-muted-foreground">units/day</p>
                    </div>
                    <div class="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                      <p class="text-xs font-semibold text-amber-500">Days of Stock</p>
                      <p class="text-lg font-semibold text-amber-500">
                        {{ stockDaysValue(product) | number: '1.0-0' }}
                      </p>
                      <p class="text-xs text-muted-foreground">at current velocity</p>
                    </div>
                  </div>
                </div>

                <div class="rounded-lg bg-muted/30 p-4 space-y-4">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4 text-emerald-500" stroke-width="2">
                        <path d="M3 12h18" />
                        <path d="m6 9 3 3-3 3" />
                      </svg>
                      <h4 class="text-sm font-semibold">Sales Forecast</h4>
                      <span class="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                        AI Powered
                      </span>
                    </div>
                  </div>
                  <div class="grid gap-6 md:grid-cols-3 text-xs">
                    <div>
                      <p class="text-xs text-muted-foreground">Next 30 Days</p>
                      <div class="mt-3 grid gap-2">
                        <div class="flex items-center justify-between">
                          <span>Projected Sales</span>
                          <span class="font-semibold text-emerald-400">$38,450</span>
                        </div>
                        <div class="flex items-center justify-between">
                          <span>Projected Units</span>
                          <span class="font-semibold">1,020</span>
                        </div>
                        <div class="flex items-center justify-between">
                          <span>Projected Profit</span>
                          <span class="font-semibold text-emerald-400">$8,659</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p class="text-xs text-muted-foreground">Next 60 Days</p>
                      <div class="mt-3 grid gap-2">
                        <div class="flex items-center justify-between">
                          <span>Projected Sales</span>
                          <span class="font-semibold text-emerald-400">$78,200</span>
                        </div>
                        <div class="flex items-center justify-between">
                          <span>Projected Units</span>
                          <span class="font-semibold">2,080</span>
                        </div>
                        <div class="flex items-center justify-between">
                          <span>Projected Profit</span>
                          <span class="font-semibold text-emerald-400">$17,596</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p class="text-xs text-muted-foreground">Next 90 Days</p>
                      <div class="mt-3 grid gap-2">
                        <div class="flex items-center justify-between">
                          <span>Projected Sales</span>
                          <span class="font-semibold text-emerald-400">$115,800</span>
                        </div>
                        <div class="flex items-center justify-between">
                          <span>Projected Units</span>
                          <span class="font-semibold">3,075</span>
                        </div>
                        <div class="flex items-center justify-between">
                          <span>Projected Profit</span>
                          <span class="font-semibold text-emerald-400">$26,055</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2 text-amber-700">
                        <span class="inline-flex h-5 w-5 items-center justify-center rounded-full border border-amber-500/40">!</span>
                        <span class="font-semibold">Restock Recommendation</span>
                      </div>
                      <button class="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-[10px] text-amber-700">
                        Order in {{ restockLeadDays(product) | number: '1.0-0' }} days
                      </button>
                    </div>
                    <p class="mt-2 text-xs text-muted-foreground">
                      Based on current velocity of {{ product.velocity }} units/day, recommend ordering
                      <span class="font-semibold text-foreground"> {{ product.suggestedRestockQty }} units</span>
                      to maintain 45 days of stock.
                    </p>
                  </div>
                </div>

                <div class="rounded-lg bg-muted/30 p-4">
                  <div class="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4 text-muted-foreground" stroke-width="2">
                      <path d="M3 7l9-4 9 4-9 4-9-4z" />
                      <path d="M3 7v10l9 4 9-4V7" />
                    </svg>
                    <h4 class="text-sm font-semibold">Forecast by Variation</h4>
                  </div>
                  <div class="mt-3 overflow-hidden rounded-lg border border-border">
                    <table class="w-full text-xs">
                      <thead class="bg-background/60 text-muted-foreground">
                        <tr>
                          <th class="px-3 py-2 text-left">Variation</th>
                          <th class="px-3 py-2 text-right">30d Sales</th>
                          <th class="px-3 py-2 text-right">30d Profit</th>
                          <th class="px-3 py-2 text-right">Velocity</th>
                          <th class="px-3 py-2 text-right">Stock Days</th>
                          <th class="px-3 py-2 text-right">Restock</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let row of forecastByVariation" class="border-t border-border">
                          <td class="px-3 py-2 font-medium">{{ row.variation }}</td>
                          <td class="px-3 py-2 text-right text-emerald-400">{{ row.sales }}</td>
                          <td class="px-3 py-2 text-right text-blue-400">{{ row.profit }}</td>
                          <td class="px-3 py-2 text-right">{{ row.velocity }}</td>
                          <td class="px-3 py-2 text-right text-rose-400">{{ row.stockDays }}</td>
                          <td class="px-3 py-2 text-right">
                            <span class="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] text-white">
                              {{ row.restock }}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div class="rounded-lg bg-muted/30 p-4">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-semibold">Content Preview</h4>
                <button
                  type="button"
                  class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                  (click)="selectTab('content')"
                >
                  Edit content
                </button>
              </div>
              <p class="mt-3 text-sm text-muted-foreground">
                Add product descriptions, bullet points, and A+ content to improve
                marketplace discoverability.
              </p>
            </div>
          </div>

          <div *ngIf="activeTab === 'pricing'" class="py-6 space-y-6">
            <div class="grid gap-6 lg:grid-cols-2">
              <div class="space-y-4">
                <h3 class="text-lg font-semibold">Pricing</h3>
                <div class="rounded-lg bg-muted/30 p-4 space-y-4">
                  <label class="grid gap-1 text-xs text-muted-foreground">
                    Sale Price
                    <input
                      type="number"
                      class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                      [value]="product.salePrice"
                    />
                  </label>
                  <div class="grid gap-4 sm:grid-cols-2">
                    <label class="grid gap-1 text-xs text-muted-foreground">
                      MSRP
                      <input
                        type="number"
                        class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                        [value]="product.salePrice + 12"
                      />
                    </label>
                    <label class="grid gap-1 text-xs text-muted-foreground">
                      Discount %
                      <input
                        type="number"
                        class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                        value="12.5"
                      />
                    </label>
                  </div>
                  <div class="grid gap-4 sm:grid-cols-2">
                    <label class="grid gap-1 text-xs text-muted-foreground">
                      BuyBox Min Price
                      <input
                        type="number"
                        class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                        [value]="product.salePrice - 4"
                      />
                    </label>
                    <label class="grid gap-1 text-xs text-muted-foreground">
                      BuyBox Max Price
                      <input
                        type="number"
                        class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                        [value]="product.salePrice + 6"
                      />
                    </label>
                  </div>
                  <div class="grid gap-4 sm:grid-cols-2">
                    <label class="grid gap-1 text-xs text-muted-foreground">
                      Landed Cost
                      <input
                        type="number"
                        class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                        [value]="product.landedCost"
                      />
                    </label>
                    <label class="grid gap-1 text-xs text-muted-foreground">
                      Shipping Cost
                      <input
                        type="number"
                        class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                        [value]="product.shippingCost"
                      />
                    </label>
                  </div>
                  <div class="grid gap-4 sm:grid-cols-2">
                    <div class="rounded-lg bg-background p-3 text-sm">
                      <p class="text-xs text-muted-foreground">Gross Profit</p>
                      <p class="text-lg font-semibold text-emerald-600">
                        {{ product.grossProfitAmount | currency: 'USD' : 'symbol' : '1.2-2' }}
                      </p>
                    </div>
                    <div class="rounded-lg bg-background p-3 text-sm">
                      <p class="text-xs text-muted-foreground">Profit Margin</p>
                      <p class="text-lg font-semibold text-emerald-600">
                        {{ product.grossProfitPercent | number: '1.0-0' }}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="space-y-4">
                <h3 class="text-lg font-semibold">Inventory</h3>
                <div class="rounded-lg bg-muted/30 p-4 space-y-4">
                  <div class="grid gap-4 sm:grid-cols-2">
                    <label class="grid gap-1 text-xs text-muted-foreground">
                      Stock Qty
                      <input
                        type="number"
                        class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                        [value]="product.stockQty"
                      />
                    </label>
                    <label class="grid gap-1 text-xs text-muted-foreground">
                      Purchase Qty
                      <input
                        type="number"
                        class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                        [value]="product.purchaseQty"
                      />
                    </label>
                    <label class="grid gap-1 text-xs text-muted-foreground">
                      Sold Qty
                      <input
                        type="number"
                        class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                        [value]="product.soldQty"
                      />
                    </label>
                    <label class="grid gap-1 text-xs text-muted-foreground">
                      Returns
                      <input
                        type="number"
                        class="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                        [value]="product.returnQty"
                      />
                    </label>
                  </div>
                  <div class="rounded-lg border border-border bg-background p-3 text-sm">
                    <div class="flex items-center justify-between">
                      <p class="text-xs text-muted-foreground">Restock Status</p>
                      <span
                        class="rounded-full border px-2 py-0.5 text-xs"
                        [ngClass]="restockBadgeClass(product.restockStatus)"
                      >
                        {{ restockLabel(product.restockStatus) }}
                      </span>
                    </div>
                    <p class="mt-2 text-xs text-muted-foreground">
                      Velocity: {{ product.velocity | number: '1.1-1' }} units/day
                    </p>
                    <p class="text-xs text-muted-foreground">
                      Suggested restock: {{ product.suggestedRestockQty }} units
                    </p>
                  </div>
                </div>
                <div class="rounded-lg border border-border bg-card p-4">
                  <h4 class="text-sm font-semibold mb-3">Inventory Locations</h4>
                  <div class="space-y-2 text-xs">
                    <div
                      *ngFor="let location of inventoryLocations"
                      class="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2"
                    >
                      <span class="font-medium">{{ location.name }}</span>
                      <span class="text-muted-foreground">
                        {{ location.onHand }} on hand / {{ location.available }} available
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="activeTab === 'identifiers'" class="py-6 space-y-6">
            <ng-container *ngIf="initIdentifierLists(product)"></ng-container>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-5 w-5 text-primary" stroke-width="2">
                  <path d="M4 7h16" />
                  <path d="M6 11h12" />
                  <path d="M5 15h14" />
                </svg>
                Product Identifiers
              </h3>
              <p class="text-sm text-muted-foreground">
                Add multiple identifiers for the same product when selling across marketplaces
              </p>
            </div>

            <div class="rounded-lg bg-muted/30 p-4">
              <h4 class="mb-4 flex items-center gap-2 text-sm font-medium">
                <span class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                  #
                </span>
                Primary Identifiers
              </h4>
              <div class="grid gap-6 md:grid-cols-2">
                <div class="space-y-3">
                  <label class="text-xs text-muted-foreground">SKU (Stock Keeping Unit)</label>
                  <div class="space-y-2">
                    <div *ngFor="let value of identifierLists.skus; let i = index" class="flex items-center gap-2">
                      <input
                        type="text"
                        class="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                        placeholder="Enter SKU..."
                        [(ngModel)]="identifierLists.skus[i]"
                        [ngModelOptions]="{ standalone: true }"
                      />
                      <button
                        *ngIf="identifierLists.skus.length > 1"
                        type="button"
                        class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
                        (click)="removeIdentifier('skus', i)"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                          <path d="M3 6h18" />
                          <path d="M8 6v14" />
                          <path d="M16 6v14" />
                          <path d="M5 6l1-2h12l1 2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                    (click)="addIdentifier('skus')"
                  >
                    <span class="text-sm">+</span>
                    Add SKU
                  </button>
                </div>

                <div class="space-y-3">
                  <label class="text-xs text-muted-foreground">UPC (Universal Product Code)</label>
                  <div class="space-y-2">
                    <div *ngFor="let value of identifierLists.upcs; let i = index" class="flex items-center gap-2">
                      <input
                        type="text"
                        class="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                        placeholder="Enter UPC..."
                        [(ngModel)]="identifierLists.upcs[i]"
                        [ngModelOptions]="{ standalone: true }"
                      />
                      <button
                        *ngIf="identifierLists.upcs.length > 1"
                        type="button"
                        class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
                        (click)="removeIdentifier('upcs', i)"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                          <path d="M3 6h18" />
                          <path d="M8 6v14" />
                          <path d="M16 6v14" />
                          <path d="M5 6l1-2h12l1 2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                    (click)="addIdentifier('upcs')"
                  >
                    <span class="text-sm">+</span>
                    Add UPC
                  </button>
                </div>

                <div class="space-y-3">
                  <label class="text-xs text-muted-foreground">ASIN (Amazon Standard ID)</label>
                  <div class="space-y-2">
                    <div *ngFor="let value of identifierLists.asins; let i = index" class="flex items-center gap-2">
                      <input
                        type="text"
                        class="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                        placeholder="Enter ASIN..."
                        [(ngModel)]="identifierLists.asins[i]"
                        [ngModelOptions]="{ standalone: true }"
                      />
                      <button
                        *ngIf="identifierLists.asins.length > 1"
                        type="button"
                        class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
                        (click)="removeIdentifier('asins', i)"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                          <path d="M3 6h18" />
                          <path d="M8 6v14" />
                          <path d="M16 6v14" />
                          <path d="M5 6l1-2h12l1 2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                    (click)="addIdentifier('asins')"
                  >
                    <span class="text-sm">+</span>
                    Add ASIN
                  </button>
                </div>

                <div class="space-y-3">
                  <label class="text-xs text-muted-foreground">FNSKU (Fulfillment Network SKU)</label>
                  <div class="space-y-2">
                    <div *ngFor="let value of identifierLists.fnskus; let i = index" class="flex items-center gap-2">
                      <input
                        type="text"
                        class="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                        placeholder="Enter FNSKU..."
                        [(ngModel)]="identifierLists.fnskus[i]"
                        [ngModelOptions]="{ standalone: true }"
                      />
                      <button
                        *ngIf="identifierLists.fnskus.length > 1"
                        type="button"
                        class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
                        (click)="removeIdentifier('fnskus', i)"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                          <path d="M3 6h18" />
                          <path d="M8 6v14" />
                          <path d="M16 6v14" />
                          <path d="M5 6l1-2h12l1 2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                    (click)="addIdentifier('fnskus')"
                  >
                    <span class="text-sm">+</span>
                    Add FNSKU
                  </button>
                </div>
              </div>
            </div>

            <div class="rounded-lg bg-muted/30 p-4">
              <h4 class="mb-4 flex items-center gap-2 text-sm font-medium">
                <span class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                  🌍
                </span>
                Global Identifiers
              </h4>
              <div class="grid gap-6 md:grid-cols-3">
                <div class="space-y-3">
                  <label class="text-xs text-muted-foreground">GTIN (Global Trade Item Number)</label>
                  <div class="space-y-2">
                    <div *ngFor="let value of identifierLists.gtins; let i = index" class="flex items-center gap-2">
                      <input
                        type="text"
                        class="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                        placeholder="Enter GTIN..."
                        [(ngModel)]="identifierLists.gtins[i]"
                        [ngModelOptions]="{ standalone: true }"
                      />
                      <button
                        *ngIf="identifierLists.gtins.length > 1"
                        type="button"
                        class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
                        (click)="removeIdentifier('gtins', i)"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                          <path d="M3 6h18" />
                          <path d="M8 6v14" />
                          <path d="M16 6v14" />
                          <path d="M5 6l1-2h12l1 2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                    (click)="addIdentifier('gtins')"
                  >
                    <span class="text-sm">+</span>
                    Add GTIN
                  </button>
                </div>

                <div class="space-y-3">
                  <label class="text-xs text-muted-foreground">EAN (European Article Number)</label>
                  <div class="space-y-2">
                    <div *ngFor="let value of identifierLists.eans; let i = index" class="flex items-center gap-2">
                      <input
                        type="text"
                        class="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                        placeholder="Enter EAN..."
                        [(ngModel)]="identifierLists.eans[i]"
                        [ngModelOptions]="{ standalone: true }"
                      />
                      <button
                        *ngIf="identifierLists.eans.length > 1"
                        type="button"
                        class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
                        (click)="removeIdentifier('eans', i)"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                          <path d="M3 6h18" />
                          <path d="M8 6v14" />
                          <path d="M16 6v14" />
                          <path d="M5 6l1-2h12l1 2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                    (click)="addIdentifier('eans')"
                  >
                    <span class="text-sm">+</span>
                    Add EAN
                  </button>
                </div>

                <div class="space-y-3">
                  <label class="text-xs text-muted-foreground">ISBN (Book Identifier)</label>
                  <div class="space-y-2">
                    <div *ngFor="let value of identifierLists.isbns; let i = index" class="flex items-center gap-2">
                      <input
                        type="text"
                        class="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                        placeholder="Enter ISBN..."
                        [(ngModel)]="identifierLists.isbns[i]"
                        [ngModelOptions]="{ standalone: true }"
                      />
                      <button
                        *ngIf="identifierLists.isbns.length > 1"
                        type="button"
                        class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
                        (click)="removeIdentifier('isbns', i)"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                          <path d="M3 6h18" />
                          <path d="M8 6v14" />
                          <path d="M16 6v14" />
                          <path d="M5 6l1-2h12l1 2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                    (click)="addIdentifier('isbns')"
                  >
                    <span class="text-sm">+</span>
                    Add ISBN
                  </button>
                </div>
              </div>
            </div>

            <div class="rounded-lg border border-border bg-card p-4">
              <h4 class="mb-3 text-sm font-medium">Identifier Summary</h4>
              <div class="flex flex-wrap gap-3 text-xs">
                <span *ngIf="identifierCount('skus') > 0" class="rounded-full border border-border px-2 py-0.5">
                  {{ identifierCount('skus') }} SKU{{ identifierCount('skus') > 1 ? 's' : '' }}
                </span>
                <span *ngIf="identifierCount('upcs') > 0" class="rounded-full border border-border px-2 py-0.5">
                  {{ identifierCount('upcs') }} UPC{{ identifierCount('upcs') > 1 ? 's' : '' }}
                </span>
                <span *ngIf="identifierCount('asins') > 0" class="rounded-full border border-border px-2 py-0.5">
                  {{ identifierCount('asins') }} ASIN{{ identifierCount('asins') > 1 ? 's' : '' }}
                </span>
                <span *ngIf="identifierCount('fnskus') > 0" class="rounded-full border border-border px-2 py-0.5">
                  {{ identifierCount('fnskus') }} FNSKU{{ identifierCount('fnskus') > 1 ? 's' : '' }}
                </span>
                <span *ngIf="identifierCount('gtins') > 0" class="rounded-full border border-border px-2 py-0.5">
                  {{ identifierCount('gtins') }} GTIN{{ identifierCount('gtins') > 1 ? 's' : '' }}
                </span>
                <span *ngIf="identifierCount('eans') > 0" class="rounded-full border border-border px-2 py-0.5">
                  {{ identifierCount('eans') }} EAN{{ identifierCount('eans') > 1 ? 's' : '' }}
                </span>
                <span *ngIf="identifierCount('isbns') > 0" class="rounded-full border border-border px-2 py-0.5">
                  {{ identifierCount('isbns') }} ISBN{{ identifierCount('isbns') > 1 ? 's' : '' }}
                </span>
                <span
                  *ngIf="identifierTotalCount() === 0"
                  class="text-sm text-muted-foreground"
                >
                  No identifiers added yet
                </span>
              </div>
            </div>
          </div>

          <div *ngIf="activeTab === 'images'" class="py-6 space-y-6">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Product Media</h3>
              <button
                type="button"
                class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                Upload assets
              </button>
            </div>
            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div class="rounded-lg border border-border bg-card p-4">
                <p class="text-xs font-semibold text-muted-foreground">Primary Image</p>
                <img
                  [src]="product.image"
                  [alt]="product.name"
                  class="mt-3 h-48 w-full rounded-md border border-border object-cover"
                />
              </div>
              <div
                *ngFor="let slot of mediaSlots"
                class="rounded-lg border border-dashed border-border bg-muted/30 p-4 flex flex-col items-center justify-center gap-2"
              >
                <div class="h-16 w-16 rounded-md bg-muted"></div>
                <p class="text-xs text-muted-foreground">Drop image {{ slot }}</p>
              </div>
            </div>
            <div class="rounded-lg border border-border bg-card p-4">
              <h4 class="text-sm font-semibold mb-3">Video &amp; 360 Content</h4>
              <div class="grid gap-4 md:grid-cols-2">
                <div class="rounded-lg border border-dashed border-border p-4 text-center">
                  <p class="text-xs text-muted-foreground">Upload product video</p>
                </div>
                <div class="rounded-lg border border-dashed border-border p-4 text-center">
                  <p class="text-xs text-muted-foreground">Add 360 spin set</p>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="activeTab === 'marketplaces'" class="py-6 space-y-6">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Marketplace Listings</h3>
              <button
                type="button"
                class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                Publish updates
              </button>
            </div>
            <ng-container *ngIf="marketplaceSummary(product) as summary">
              <div class="rounded-lg border border-border bg-card p-4">
                <div class="grid gap-3 md:grid-cols-4">
                  <div class="rounded-lg bg-muted/30 p-3 text-center">
                    <p class="text-xs text-muted-foreground">Live</p>
                    <p class="text-lg font-semibold text-emerald-600">{{ summary.live }}</p>
                  </div>
                  <div class="rounded-lg bg-muted/30 p-3 text-center">
                    <p class="text-xs text-muted-foreground">Inactive</p>
                    <p class="text-lg font-semibold">{{ summary.inactive }}</p>
                  </div>
                  <div class="rounded-lg bg-muted/30 p-3 text-center">
                    <p class="text-xs text-muted-foreground">Error</p>
                    <p class="text-lg font-semibold text-rose-500">{{ summary.error }}</p>
                  </div>
                  <div class="rounded-lg bg-muted/30 p-3 text-center">
                    <p class="text-xs text-muted-foreground">Not listed</p>
                    <p class="text-lg font-semibold">{{ summary.notListed }}</p>
                  </div>
                </div>
              </div>
              <div class="rounded-lg border border-border bg-card p-4">
                <div class="overflow-x-auto">
                  <table class="w-full min-w-[760px] text-sm">
                    <thead>
                      <tr class="border-b border-border text-xs text-muted-foreground">
                        <th class="py-2 text-left">Marketplace</th>
                        <th class="py-2 text-left">Status</th>
                        <th class="py-2 text-right">Price</th>
                        <th class="py-2 text-right">Stock</th>
                        <th class="py-2 text-center">Sync Price</th>
                        <th class="py-2 text-center">Sync Inventory</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        *ngFor="let row of summary.all; let i = index"
                        class="border-b border-border/60 text-xs"
                      >
                        <td class="py-2 font-medium capitalize">{{ row.platform }}</td>
                        <td class="py-2">
                          <span
                            class="rounded-full border px-2 py-0.5 text-[10px]"
                            [ngClass]="marketplaceBadgeClass(row.status)"
                          >
                            {{ statusLabel(row.status) }}
                          </span>
                        </td>
                        <td class="py-2 text-right">
                          {{
                            (product.salePrice + i) | currency: 'USD' : 'symbol' : '1.2-2'
                          }}
                        </td>
                        <td class="py-2 text-right">{{ product.stockQty - i * 2 }}</td>
                        <td class="py-2 text-center">
                          <input type="checkbox" [checked]="row.status === 'live'" />
                        </td>
                        <td class="py-2 text-center">
                          <input type="checkbox" [checked]="row.status === 'live'" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </ng-container>
          </div>

          <div *ngIf="activeTab === 'content'" class="py-6 space-y-6">
            <ng-container *ngIf="initContentFields(product)"></ng-container>
            <div class="space-y-6">
              <div class="space-y-4">
                <h3 class="text-lg font-semibold flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-5 w-5 text-primary" stroke-width="2">
                    <path d="M4 4h16v16H4z" />
                    <path d="M8 8h8" />
                    <path d="M8 12h8" />
                    <path d="M8 16h5" />
                  </svg>
                  Product Title
                </h3>
                <div class="rounded-lg bg-muted/30 p-4">
                  <input
                    type="text"
                    class="w-full rounded-md border border-border bg-background px-3 py-2 text-lg"
                    placeholder="Enter product title..."
                    [(ngModel)]="productTitle"
                    [ngModelOptions]="{ standalone: true }"
                  />
                  <p class="mt-2 text-xs text-muted-foreground">
                    The main title displayed on marketplace listings.
                  </p>
                </div>
              </div>

              <div class="space-y-4">
                <h3 class="text-lg font-semibold flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-5 w-5 text-primary" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                    <path d="M8 13h8" />
                    <path d="M8 17h8" />
                    <path d="M8 9h3" />
                  </svg>
                  Product Description
                </h3>
                <div class="rounded-lg bg-muted/30 p-4">
                  <textarea
                    rows="4"
                    class="min-h-[120px] w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Enter a detailed product description..."
                    [(ngModel)]="productDescription"
                    [ngModelOptions]="{ standalone: true }"
                  ></textarea>
                  <p class="mt-2 text-xs text-muted-foreground">
                    Write a compelling description that highlights key features and benefits.
                  </p>
                </div>
              </div>

              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold flex items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-5 w-5 text-primary" stroke-width="2">
                      <path d="M8 6h13" />
                      <path d="M8 12h13" />
                      <path d="M8 18h13" />
                      <path d="M3 6h.01" />
                      <path d="M3 12h.01" />
                      <path d="M3 18h.01" />
                    </svg>
                    Bullet Points
                  </h3>
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                    (click)="addBulletPoint()"
                  >
                    <span class="text-sm">+</span>
                    Add Bullet
                  </button>
                </div>
                <div class="rounded-lg bg-muted/30 p-4 space-y-3">
                  <div *ngFor="let bullet of bulletPoints; let i = index" class="flex items-center gap-3">
                    <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                      {{ i + 1 }}
                    </span>
                    <input
                      type="text"
                      class="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                      placeholder="Bullet point..."
                      [ngModel]="bullet"
                      [ngModelOptions]="{ standalone: true }"
                      (ngModelChange)="updateBulletPoint(i, $event)"
                    />
                    <button
                      *ngIf="bulletPoints.length > 1"
                      type="button"
                      class="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-rose-400"
                      (click)="removeBulletPoint(i)"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                        <path d="M3 6h18" />
                        <path d="M8 6v14" />
                        <path d="M16 6v14" />
                        <path d="M5 6l1-2h12l1 2" />
                      </svg>
                    </button>
                  </div>
                  <p class="text-xs text-muted-foreground">
                    Use bullet points to highlight key product features. Most marketplaces support 5 bullet points, but you can add more for internal use.
                  </p>
                </div>
              </div>

              <div class="space-y-4">
                <h3 class="text-lg font-semibold flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-5 w-5 text-primary" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                  A+ Content
                </h3>
                <div class="rounded-lg bg-muted/30 p-4">
                  <textarea
                    rows="4"
                    class="min-h-[120px] w-full resize-none rounded-md border border-dashed border-border bg-background px-3 py-2 text-sm text-muted-foreground"
                    placeholder="Add A+ content modules..."
                    [(ngModel)]="aplusContent"
                    [ngModelOptions]="{ standalone: true }"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="activeTab === 'options'" class="py-6 space-y-6">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Product Options</h3>
              <button
                type="button"
                class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                Manage variations
              </button>
            </div>
            <div class="rounded-lg bg-muted/30 p-4 space-y-4">
              <div
                *ngFor="let option of optionSets"
                class="rounded-lg border border-border bg-background p-3"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-semibold capitalize">{{ option.name }}</p>
                    <p class="text-xs text-muted-foreground">
                      Display: {{ option.display }} | Image link:
                      {{ option.imageLink ? 'On' : 'Off' }}
                    </p>
                  </div>
                  <button
                    type="button"
                    class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                  >
                    Edit
                  </button>
                </div>
                <div class="mt-3 flex flex-wrap gap-2 text-xs">
                  <span
                    *ngFor="let choice of option.choices"
                    class="rounded-full border border-border px-2 py-0.5"
                  >
                    {{ choice }}
                  </span>
                </div>
              </div>
            </div>
            <div class="rounded-lg border border-border bg-card p-4">
              <h4 class="text-sm font-semibold mb-3">Variation Matrix</h4>
              <div class="overflow-x-auto">
                <table class="w-full min-w-[680px] text-sm">
                  <thead>
                    <tr class="border-b border-border text-xs text-muted-foreground">
                      <th class="py-2 text-left">Variation</th>
                      <th class="py-2 text-left">SKU</th>
                      <th class="py-2 text-right">Stock</th>
                      <th class="py-2 text-right">Price Delta</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      *ngFor="let row of variationRows"
                      class="border-b border-border/60"
                    >
                      <td class="py-2 font-medium">{{ row.name }}</td>
                      <td class="py-2 text-xs text-muted-foreground">{{ row.sku }}</td>
                      <td class="py-2 text-right">{{ row.stock }}</td>
                      <td class="py-2 text-right text-xs text-muted-foreground">
                        {{ row.priceDelta }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div *ngIf="activeTab === 'extra'" class="py-6 space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-5 w-5 text-primary" stroke-width="2">
                  <path d="M20 7h-9" />
                  <path d="M14 17H5" />
                  <circle cx="17" cy="17" r="3" />
                  <circle cx="7" cy="7" r="3" />
                </svg>
                Extra Attributes
              </h3>
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                (click)="addExtraAttribute()"
              >
                <span class="text-sm">+</span>
                Add Attribute
              </button>
            </div>

            <div class="grid gap-4 md:grid-cols-3">
              <div
                *ngFor="let attr of extraAttributes; let i = index"
                class="rounded-lg bg-muted/30 p-4 space-y-3"
              >
                <div class="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    class="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium"
                    placeholder="Attribute name"
                    [ngModel]="attr.name"
                    [ngModelOptions]="{ standalone: true }"
                    (ngModelChange)="updateExtraAttribute(i, 'name', $event)"
                  />
                  <button
                    type="button"
                    class="inline-flex h-9 w-9 items-center justify-center rounded-md text-rose-400 hover:text-rose-300"
                    (click)="removeExtraAttribute(i)"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                      <path d="M3 6h18" />
                      <path d="M8 6v14" />
                      <path d="M16 6v14" />
                      <path d="M5 6l1-2h12l1 2" />
                    </svg>
                  </button>
                </div>
                <div class="flex items-center gap-2">
                  <select
                    class="h-10 w-24 rounded-md border border-border bg-background px-2 text-sm"
                    [ngModel]="attr.type"
                    [ngModelOptions]="{ standalone: true }"
                    (ngModelChange)="updateExtraAttribute(i, 'type', $event)"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                  </select>
                  <input
                    [type]="attr.type === 'number' ? 'number' : 'text'"
                    class="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Value"
                    [ngModel]="attr.value"
                    [ngModelOptions]="{ standalone: true }"
                    (ngModelChange)="updateExtraAttribute(i, 'value', $event)"
                  />
                </div>
              </div>

              <button
                type="button"
                class="rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 p-4 text-center text-sm text-muted-foreground hover:border-primary/50 hover:bg-muted/50"
                (click)="addExtraAttribute()"
              >
                <div class="flex flex-col items-center gap-2">
                  <span class="text-lg">+</span>
                  Add Attribute
                </div>
              </button>
            </div>
          </div>

          <div *ngIf="activeTab === 'tags'" class="py-6 space-y-6">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Product Tags</h3>
              <button
                type="button"
                class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                Manage tags
              </button>
            </div>
            <div class="rounded-lg border border-border bg-card p-4">
              <div class="flex flex-wrap gap-2">
                <span class="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-700">
                  Seasonal
                </span>
                <span class="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-700">
                  High margin
                </span>
                <span class="rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-700">
                  Bundle candidate
                </span>
                <span class="rounded-full bg-slate-500/10 px-3 py-1 text-xs text-slate-700">
                  Requires review
                </span>
              </div>
              <div class="mt-4 rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
                Drag tags here to categorize this product across campaigns.
              </div>
            </div>
          </div>

          <div *ngIf="activeTab === 'sales'" class="py-6 space-y-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <h3 class="text-lg font-semibold flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-5 w-5 text-primary" stroke-width="2">
                    <path d="M4 14l5-5 4 4 7-7" />
                  </svg>
                  Sales
                </h3>
                <span class="text-muted-foreground" title="Sales data synced from connected marketplaces">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8h.01" />
                    <path d="M12 12v4" />
                  </svg>
                </span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-xs text-muted-foreground flex items-center gap-1">
                  Last updated: {{ salesLastUpdated }}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3" stroke-width="2">
                    <path d="M3 12a9 9 0 0 1 9-9" />
                    <path d="M3 12a9 9 0 0 0 9 9" />
                    <path d="M21 12a9 9 0 0 1-9 9" />
                    <path d="M21 12a9 9 0 0 0-9-9" />
                  </svg>
                </span>
                <span class="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-600">
                  NEW
                </span>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                    <path d="M10 13a5 5 0 0 0 7.07 0l3.54-3.54a5 5 0 0 0-7.07-7.07L12 4" />
                    <path d="M14 11a5 5 0 0 0-7.07 0L3.39 14.54a5 5 0 1 0 7.07 7.07L12 20" />
                  </svg>
                  Deep Dive Sales &amp; Traffic
                </button>
              </div>
            </div>

            <div class="rounded-lg bg-muted/30 p-4">
              <div class="flex items-center gap-4">
                <span class="text-sm font-medium text-muted-foreground whitespace-nowrap">View data for:</span>
                <details class="relative" [open]="salesVariationOpen">
                  <summary
                    class="inline-flex min-w-[220px] cursor-pointer items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                    (click)="$event.preventDefault(); salesVariationOpen = !salesVariationOpen"
                  >
                    <span class="truncate">{{ selectedSalesVariationLabel }}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3" stroke-width="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </summary>
                  <div class="absolute left-0 mt-2 w-full rounded-lg border border-border bg-card p-1 shadow-lg">
                    <button
                      *ngFor="let option of salesVariationOptions"
                      type="button"
                      class="flex w-full items-center justify-between rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                      (click)="setSalesVariation(option.id)"
                    >
                      <span>{{ option.name }}</span>
                      <span *ngIf="selectedSalesVariation === option.id">✓</span>
                    </button>
                  </div>
                </details>
              </div>
              <p *ngIf="selectedSalesVariation !== 'all'" class="mt-2 text-xs text-muted-foreground">
                Showing sales data for:
                <span class="font-medium text-foreground">{{ selectedSalesVariationLabel }}</span>
              </p>
            </div>

            <div class="rounded-lg bg-muted/30 p-4">
              <div class="mb-4 border-b border-border pb-3">
                <span class="text-sm font-medium border-b-2 border-primary pb-3">Information</span>
              </div>
              <div class="grid gap-6 lg:grid-cols-4">
                <div class="space-y-4">
                  <div>
                    <p class="text-xs text-muted-foreground">View sales data for:</p>
                    <div class="mt-1 flex items-center gap-1">
                      <button
                        type="button"
                        class="h-7 rounded-md px-3 text-xs"
                        [ngClass]="salesViewMode === 'sku' ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground'"
                        (click)="setSalesViewMode('sku')"
                      >
                        SKU
                      </button>
                      <button
                        type="button"
                        class="h-7 rounded-md px-3 text-xs"
                        [ngClass]="salesViewMode === 'asin' ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground'"
                        (click)="setSalesViewMode('asin')"
                      >
                        ASIN
                      </button>
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <p class="text-xs text-muted-foreground">Sales rank</p>
                      <p class="text-sm font-medium">-</p>
                    </div>
                    <div>
                      <p class="text-xs text-muted-foreground">Category</p>
                      <p class="text-sm font-medium">-</p>
                    </div>
                  </div>
                </div>

                <div *ngFor="let period of salesPeriodSummaries" class="space-y-3">
                  <h4 class="text-sm font-medium text-muted-foreground">{{ period.label }}</h4>
                  <div class="space-y-2 text-xs">
                    <div class="flex justify-between">
                      <span class="text-muted-foreground">Units ordered</span>
                      <span class="text-sm font-medium">{{ period.units }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-muted-foreground">Avg units per order</span>
                      <span class="text-sm font-medium">{{ period.avgUnits }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-muted-foreground">Avg selling price</span>
                      <span class="text-sm font-medium">{{ period.avgPrice }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="rounded-lg bg-muted/30 p-4">
              <div class="mb-4 flex items-center justify-between">
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    class="h-7 rounded-md px-3 text-xs"
                    [ngClass]="salesChartMode === 'sales' ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground'"
                    (click)="setSalesChartMode('sales')"
                  >
                    Sales
                  </button>
                  <button
                    type="button"
                    class="h-7 rounded-md px-3 text-xs"
                    [ngClass]="salesChartMode === 'units' ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground'"
                    (click)="setSalesChartMode('units')"
                  >
                    Units
                  </button>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-muted-foreground">Data shown</span>
                  <details class="relative" [open]="salesPeriodOpen">
                    <summary
                      class="inline-flex w-[160px] cursor-pointer items-center justify-between rounded-md border border-border px-3 py-2 text-xs"
                      (click)="$event.preventDefault(); salesPeriodOpen = !salesPeriodOpen"
                    >
                      {{ salesDataPeriodLabel }}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3" stroke-width="2">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </summary>
                    <div class="absolute right-0 mt-2 w-44 rounded-lg border border-border bg-card p-1 shadow-lg">
                      <button
                        *ngFor="let option of salesPeriodOptions"
                        type="button"
                        class="flex w-full items-center justify-between rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                        (click)="setSalesDataPeriod(option.value)"
                      >
                        <span>{{ option.label }}</span>
                        <span *ngIf="salesDataPeriod === option.value">✓</span>
                      </button>
                    </div>
                  </details>
                  <div *ngIf="salesDataPeriod === 'custom'" class="flex items-center gap-2">
                    <input
                      type="date"
                      class="h-8 rounded-md border border-border bg-background px-2 text-xs"
                      [(ngModel)]="salesCustomStartDate"
                      [ngModelOptions]="{ standalone: true }"
                    />
                    <span class="text-xs text-muted-foreground">to</span>
                    <input
                      type="date"
                      class="h-8 rounded-md border border-border bg-background px-2 text-xs"
                      [(ngModel)]="salesCustomEndDate"
                      [ngModelOptions]="{ standalone: true }"
                    />
                  </div>
                </div>
              </div>

              <div class="relative h-[250px]">
                <div class="absolute left-0 top-0 bottom-0 flex w-12 flex-col justify-between py-2 text-xs text-muted-foreground">
                  <span>$10.0k</span>
                  <span>$7.5k</span>
                  <span>$5.0k</span>
                  <span>$2.5k</span>
                  <span>$0</span>
                </div>
                <div class="ml-14 h-full border-l border-b border-border relative">
                  <svg class="h-full w-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                    <path
                      d="M0,10 Q20,20 40,40 T80,60 T120,80 T160,150 T200,160 T240,165 T280,160 T320,170 T360,175 T400,180"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      stroke-width="2"
                    />
                  </svg>
                  <div class="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-xs text-muted-foreground translate-y-5">
                    <span *ngFor="let label of salesChartLabels">{{ label }}</span>
                  </div>
                </div>
              </div>

              <div class="mt-8 flex flex-wrap items-center gap-8 border-t border-border pt-4">
                <label *ngFor="let comparison of salesComparisonOptions" class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    [checked]="salesComparisonSelections[comparison.id]"
                    (change)="toggleSalesComparison(comparison.id)"
                  />
                  <span class="flex flex-col">
                    <span class="text-xs text-muted-foreground">
                      {{ comparison.label }} —
                    </span>
                    <span
                      class="text-sm font-semibold"
                      [ngClass]="comparison.highlight ? 'text-primary' : 'text-muted-foreground'"
                    >
                      {{ comparison.revenue }}
                    </span>
                    <span class="text-xs text-muted-foreground">{{ comparison.units }}</span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div *ngIf="activeTab === 'offers'" class="py-6 space-y-6">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div class="flex items-start gap-3">
                <span class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                    <path d="M20.59 13.41 12 22 3 13.41a2 2 0 0 1 0-2.82L12 2l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <circle cx="7" cy="7" r="1.5"></circle>
                  </svg>
                </span>
                <div>
                  <h3 class="text-lg font-semibold">Product Offers</h3>
                  <p class="text-xs text-muted-foreground">Manage offers and promotions for this product</p>
                </div>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <details class="relative" [open]="offerRangeOpen">
                  <summary
                    class="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground"
                    (click)="$event.preventDefault(); offerRangeOpen = !offerRangeOpen"
                  >
                    {{ offerRange }}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3" stroke-width="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </summary>
                  <div class="absolute right-0 mt-2 w-40 rounded-lg border border-border bg-card p-1 shadow-lg">
                    <button
                      *ngFor="let option of offerRanges"
                      type="button"
                      class="flex w-full items-center justify-between rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                      (click)="setOfferRange(option)"
                    >
                      <span>{{ option }}</span>
                      <span *ngIf="offerRange === option">✓</span>
                    </button>
                  </div>
                </details>
                <details class="relative" [open]="offerMarketplaceFilterOpen">
                  <summary
                    class="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground"
                    (click)="$event.preventDefault(); offerMarketplaceFilterOpen = !offerMarketplaceFilterOpen"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                      <path d="M7 7h10v10H7z" />
                      <path d="M5 11h2M17 11h2M11 5v2M11 17v2" />
                    </svg>
                    {{ offerMarketplaceFilter }}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3" stroke-width="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </summary>
                  <div class="absolute right-0 mt-2 w-44 rounded-lg border border-border bg-card p-1 shadow-lg">
                    <button
                      *ngFor="let option of offerMarketplaceFilters"
                      type="button"
                      class="flex w-full items-center justify-between rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                      (click)="setOfferMarketplaceFilter(option)"
                    >
                      <span>{{ option }}</span>
                      <span *ngIf="offerMarketplaceFilter === option">✓</span>
                    </button>
                  </div>
                </details>
                <a
                  routerLink="/offer-analytics"
                  class="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3.5 w-3.5" stroke-width="2">
                    <path d="M3 3v18h18" />
                    <path d="M7 15v-4" />
                    <path d="M12 15V8" />
                    <path d="M17 15v-6" />
                  </svg>
                  All Offers
                </a>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500/90"
                  (click)="openCreateOfferDialog(product)"
                >
                  <span class="text-sm">+</span>
                  Add to Offer
                </button>
              </div>
            </div>

            <div class="grid gap-4 xl:grid-cols-5">
              <div class="rounded-xl border border-border bg-card/40 p-4">
                <div class="flex items-center justify-between">
                  <p class="text-xs text-muted-foreground">Active Offers</p>
                  <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                      <path d="M5 12l4 4L19 7" />
                    </svg>
                  </span>
                </div>
                <p class="mt-3 text-2xl font-semibold">{{ offerStats.activeOffers }}</p>
                <p class="text-xs text-muted-foreground">of {{ offerStats.totalOffers }} total</p>
              </div>
              <div class="rounded-xl border border-border bg-card/40 p-4">
                <div class="flex items-center justify-between">
                  <p class="text-xs text-muted-foreground">Revenue</p>
                  <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">$</span>
                </div>
                <p class="mt-3 text-2xl font-semibold text-foreground">
                  {{ offerStats.revenue | currency: 'USD' : 'symbol' : '1.2-2' }}
                </p>
                <p class="text-xs text-muted-foreground">{{ offerStats.conversions }} conv.</p>
              </div>
              <div class="rounded-xl border border-border bg-card/40 p-4">
                <div class="flex items-center justify-between">
                  <p class="text-xs text-muted-foreground">Conv. Rate</p>
                  <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">%</span>
                </div>
                <p class="mt-3 text-2xl font-semibold">
                  {{ offerStats.conversionRate | number: '1.1-1' }}%
                </p>
                <p class="text-xs text-muted-foreground">{{ offerStats.clicks }} clicks</p>
              </div>
              <div class="rounded-xl border border-border bg-card/40 p-4">
                <div class="flex items-center justify-between">
                  <p class="text-xs text-muted-foreground">Ad Spend</p>
                  <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">$</span>
                </div>
                <p class="mt-3 text-2xl font-semibold">
                  {{ offerStats.adSpend | currency: 'USD' : 'symbol' : '1.2-2' }}
                </p>
                <p class="text-xs text-muted-foreground">total spend</p>
              </div>
              <div class="rounded-xl border border-border bg-card/40 p-4">
                <div class="flex items-center justify-between">
                  <p class="text-xs text-muted-foreground">ROAS</p>
                  <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                      <path d="M4 14l5-5 4 4 7-7" />
                    </svg>
                  </span>
                </div>
                <p class="mt-3 text-2xl font-semibold">
                  {{ offerStats.roas | number: '1.2-2' }}x
                </p>
                <p class="text-xs text-muted-foreground">return on ad spend</p>
              </div>
            </div>

            <div class="rounded-xl border border-border bg-card/40 p-5">
              <h4 class="text-sm font-semibold">Performance Funnel</h4>
              <div class="mt-4 flex flex-wrap items-center gap-3">
                <div class="flex-1 min-w-[180px] rounded-lg border border-border/60 bg-muted/20 p-4 text-center">
                  <div class="text-xs text-muted-foreground">Impressions</div>
                  <div class="mt-2 text-xl font-semibold">{{ offerStats.impressions | number: '1.0-0' }}</div>
                </div>
                <div class="hidden xl:flex text-muted-foreground">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                    <path d="M5 12h14" />
                    <path d="m13 6 6 6-6 6" />
                  </svg>
                </div>
                <div class="flex-1 min-w-[180px] rounded-lg border border-border/60 bg-muted/20 p-4 text-center">
                  <div class="text-xs text-muted-foreground">Clicks ({{ offerStats.conversionRate | number: '1.1-1' }}%)</div>
                  <div class="mt-2 text-xl font-semibold">{{ offerStats.clicks }}</div>
                </div>
                <div class="hidden xl:flex text-muted-foreground">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                    <path d="M5 12h14" />
                    <path d="m13 6 6 6-6 6" />
                  </svg>
                </div>
                <div class="flex-1 min-w-[180px] rounded-lg border border-border/60 bg-muted/20 p-4 text-center">
                  <div class="text-xs text-muted-foreground">Conversions ({{ offerStats.conversionRate | number: '1.1-1' }}%)</div>
                  <div class="mt-2 text-xl font-semibold">{{ offerStats.conversions }}</div>
                </div>
                <div class="hidden xl:flex text-muted-foreground">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4" stroke-width="2">
                    <path d="M5 12h14" />
                    <path d="m13 6 6 6-6 6" />
                  </svg>
                </div>
                <div class="flex-1 min-w-[200px] rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-emerald-400">
                  <div class="text-xs">Revenue</div>
                  <div class="mt-2 text-xl font-semibold">
                    {{ offerStats.revenue | currency: 'USD' : 'symbol' : '1.2-2' }}
                  </div>
                </div>
              </div>
            </div>

            <div class="rounded-xl border border-border bg-card/40 p-5 space-y-4">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-semibold">Offers Performance</h4>
                <button type="button" class="text-xs text-muted-foreground">View all</button>
              </div>
              <div class="rounded-lg border border-border/60 bg-muted/20 p-4">
                <div class="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-semibold">Summer Sale</span>
                      <span class="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">Active</span>
                    </div>
                    <p class="text-xs text-muted-foreground">20% Off • 0/10 marketplaces</p>
                  </div>
                  <div class="flex items-center gap-6 text-xs text-muted-foreground">
                    <div class="text-right">
                      <p>Conv.</p>
                      <p class="text-sm font-semibold text-foreground">{{ offerStats.conversions }}</p>
                    </div>
                    <div class="text-right">
                      <p>Revenue</p>
                      <p class="text-sm font-semibold text-emerald-400">
                        {{ offerStats.revenue | currency: 'USD' : 'symbol' : '1.2-2' }}
                      </p>
                    </div>
                    <div class="text-right">
                      <p>ROAS</p>
                      <p class="text-sm font-semibold text-emerald-400">{{ offerStats.roas | number: '1.2-2' }}x</p>
                    </div>
                    <button type="button" class="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3 w-3" stroke-width="2">
                        <path d="M6 15l6-6 6 6" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="mt-4">
                  <p class="text-xs font-semibold text-muted-foreground">Marketplace Performance</p>
                  <div class="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    <div
                      *ngFor="let marketplace of filteredOfferMarketplaces"
                      class="rounded-lg border border-border/60 bg-background/40 p-3 text-xs text-muted-foreground"
                    >
                      <div class="flex items-center justify-between">
                        <span class="font-semibold text-foreground">{{ marketplace.label }}</span>
                        <button
                          type="button"
                          class="relative inline-flex h-5 w-9 items-center rounded-full border border-border transition"
                          [ngClass]="offerMarketplaceStates[marketplace.id] ? 'bg-emerald-500/20' : 'bg-muted'"
                          (click)="toggleOfferMarketplace(marketplace.id)"
                        >
                          <span
                            class="inline-block h-3.5 w-3.5 transform rounded-full bg-foreground transition"
                            [ngClass]="offerMarketplaceStates[marketplace.id] ? 'translate-x-4' : 'translate-x-1'"
                          ></span>
                        </button>
                      </div>
                      <p class="mt-2 text-[11px] text-muted-foreground">Click toggle to activate</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          *ngIf="showAddVendorModal"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in"
          (click)="closeAddVendorModal()"
        >
          <div
            class="w-full max-w-lg rounded-xl bg-card p-5 shadow-xl animate-in zoom-in-95"
            (click)="$event.stopPropagation()"
          >
            <div class="flex items-center justify-between border-b border-border pb-4">
              <h3 class="text-lg font-semibold">Add New Vendor</h3>
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                (click)="closeAddVendorModal()"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-4 w-4"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="mt-5 grid gap-5">
              <label class="grid gap-2 text-sm font-medium text-foreground">
                Vendor
                <input
                  type="text"
                  class="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
                  placeholder="Enter vendor..."
                  [(ngModel)]="newVendorName"
                />
              </label>
              <label class="grid gap-2 text-sm font-medium text-foreground">
                Vendor Details
                <textarea
                  rows="4"
                  class="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                  placeholder="Enter vendor details..."
                  [(ngModel)]="newVendorDetails"
                ></textarea>
              </label>
            </div>
            <div class="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                class="rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                (click)="closeAddVendorModal()"
              >
                Cancel
              </button>
              <button
                type="button"
                class="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                [disabled]="!newVendorName.trim()"
                (click)="addVendor(product)"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        <div
          *ngIf="showAddBrandModal"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in"
          (click)="closeAddBrandModal()"
        >
          <div
            class="w-full max-w-lg rounded-xl bg-card p-5 shadow-xl animate-in zoom-in-95"
            (click)="$event.stopPropagation()"
          >
            <div class="flex items-center justify-between border-b border-border pb-4">
              <h3 class="text-lg font-semibold">Add New Brand</h3>
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                (click)="closeAddBrandModal()"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-4 w-4"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="mt-5 grid gap-5">
              <label class="grid gap-2 text-sm font-medium text-foreground">
                Brand
                <input
                  type="text"
                  class="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
                  placeholder="Enter brand..."
                  [(ngModel)]="newBrandName"
                />
              </label>
              <label class="grid gap-2 text-sm font-medium text-foreground">
                Brand Details
                <textarea
                  rows="4"
                  class="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                  placeholder="Enter brand details..."
                  [(ngModel)]="newBrandDetails"
                ></textarea>
              </label>
            </div>
            <div class="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                class="rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                (click)="closeAddBrandModal()"
              >
                Cancel
              </button>
              <button
                type="button"
                class="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                [disabled]="!newBrandName.trim()"
                (click)="addBrand(product)"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        <app-create-offer-dialog
          [open]="createOfferOpen"
          [products]="products"
          [initialProductIds]="createOfferProductIds"
          [hideProductSelection]="true"
          (closed)="closeCreateOfferDialog()"
          (created)="handleOfferCreated($event)"
        ></app-create-offer-dialog>

        <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
          <div
            *ngFor="let toast of toastMessages"
            class="min-w-[220px] rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground shadow-lg"
          >
            <p class="text-sm font-semibold">{{ toast.title }}</p>
            <p class="text-xs text-muted-foreground">{{ toast.text }}</p>
          </div>
        </div>
      </ng-container>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductEditPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly product$ = this.route.paramMap.pipe(
    map((params) => params.get('productId')),
    map((productId) => mockProducts.find((product) => product.id === productId) ?? mockProducts[0])
  );

  readonly products = mockProducts;

  activeTab: TabId = 'overview';

  revenueRangeOpen = false;
  revenueRange = 'Last 30 days';
  readonly revenueRanges = [
    'Last 7 days',
    'Last 14 days',
    'Last 30 days',
    'Last 60 days',
    'Last 90 days',
    'Last 365 days',
  ];

  offerRangeOpen = false;
  offerRange = 'Last 30 days';
  readonly offerRanges = [
    'Last 7 days',
    'Last 14 days',
    'Last 30 days',
    'Last 60 days',
    'Last 90 days',
    'Last 365 days',
  ];

  offerMarketplaceFilterOpen = false;
  offerMarketplaceFilter = 'All Marketplaces';
  readonly offerMarketplaceFilters = [
    'All Marketplaces',
    'Amazon',
    'Walmart',
    'eBay',
    'Target',
    'Etsy',
    'Shopify',
    'Best Buy',
    'Wayfair',
    'Newegg',
    'Home Depot',
  ];

  offerStatusFilterOpen = false;
  offerStatusFilter = 'All Offers';
  readonly offerStatusFilters = ['All Offers', 'Active', 'Scheduled', 'Paused'];

  createOfferOpen = false;
  createOfferProductIds: string[] = [];

  private identifiersInitialized = false;
  private contentInitialized = false;
  identifierLists: Record<IdentifierKey, string[]> = {
    skus: [''],
    upcs: [''],
    asins: [''],
    fnskus: [''],
    gtins: [''],
    eans: [''],
    isbns: [''],
  };

  salesLastUpdated = '1/18/2026 2:44 PM';
  salesVariationOpen = false;
  selectedSalesVariation = 'all';
  salesViewMode: 'sku' | 'asin' = 'sku';
  salesChartMode: 'sales' | 'units' = 'sales';
  salesPeriodOpen = false;
  salesDataPeriod = '30';
  salesCustomStartDate = '';
  salesCustomEndDate = '';

  readonly salesPeriodSummaries = [
    { label: 'Last 7 days', units: 37, avgUnits: 1.03, avgPrice: '$45.99' },
    { label: 'Last 30 days', units: 942, avgUnits: 1.02, avgPrice: '$37.85' },
    { label: 'Last 90 days', units: 3811, avgUnits: 1.03, avgPrice: '$38.87' },
  ];

  readonly salesPeriodOptions = [
    { value: '7', label: 'Last 7 days' },
    { value: '14', label: 'Last 14 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '60', label: 'Last 60 days' },
    { value: '90', label: 'Last 90 days' },
    { value: 'q1-2026', label: 'Q1 2026' },
    { value: 'q4-2025', label: 'Q4 2025' },
    { value: 'q3-2025', label: 'Q3 2025' },
    { value: 'q2-2025', label: 'Q2 2025' },
    { value: 'q1-2025', label: 'Q1 2025' },
    { value: '2026', label: 'Year 2026' },
    { value: '2025', label: 'Year 2025' },
    { value: '2024', label: 'Year 2024' },
    { value: 'custom', label: 'Custom Range' },
  ];

  readonly salesChartLabels = ['12/21', '12/24', '12/27', '12/30', '1/2', '1/5', '1/8', '1/11', '1/14', '1/17'];

  readonly salesComparisonOptions = [
    { id: 'last30', label: 'Last 30 days', revenue: '$35,657.96', units: '942 units', highlight: true },
    { id: 'last31_60', label: 'Last 31-60 days', revenue: '$98,033.84', units: '2,477 units' },
    { id: 'sameLastYear', label: 'Same 30 days last year', revenue: '$131.85', units: '3 units' },
  ];

  salesComparisonSelections: Record<string, boolean> = {
    last30: true,
    last31_60: false,
    sameLastYear: false,
  };

  brandOptions = [
    'HyperX',
    'Logitech',
    'Razer',
    'Corsair',
    'SteelSeries',
    'Sony',
    'Microsoft',
    'Samsung',
    'Apple',
    'Dell',
  ];

  vendorOptions = [
    'GameStop Distribution',
    'Tech Direct',
    'Global Supplies',
    'Prime Wholesale',
    'Direct Import Co',
  ];

  vendorDropdownOpen = false;
  vendorSearch = '';
  showAddVendorModal = false;
  newVendorName = '';
  newVendorDetails = '';

  brandDropdownOpen = false;
  brandSearch = '';
  showAddBrandModal = false;
  newBrandName = '';
  newBrandDetails = '';

  readonly offerStats = {
    activeOffers: 1,
    totalOffers: 1,
    revenue: 8927,
    conversions: 79,
    conversionRate: 8.9,
    clicks: 888,
    adSpend: 370,
    roas: 24.13,
    impressions: 7402,
  };

  readonly offerMarketplaceOptions = [
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

  offerMarketplaceStates: Record<string, boolean> = {
    amazon: false,
    walmart: false,
    ebay: false,
    target: false,
    etsy: false,
    shopify: false,
    bestbuy: false,
    wayfair: false,
    newegg: false,
    homedepot: false,
  };

  toastMessages: Array<{ id: number; title: string; text: string }> = [];
  private toastId = 0;

  readonly topOffers: OfferRow[] = [
    {
      name: 'Holiday price boost',
      status: 'Active',
      discount: '20% off',
      duration: 'Dec 20 - Jan 15',
    },
    {
      name: 'Prime day spotlight',
      status: 'Scheduled',
      discount: '10% off',
      duration: 'Feb 1 - Feb 7',
    },
  ];

  readonly offerRows: OfferRow[] = [
    {
      name: 'Holiday price boost',
      status: 'Active',
      discount: '20% off',
      duration: 'Dec 20 - Jan 15',
    },
    {
      name: 'Weekend flash sale',
      status: 'Active',
      discount: '15% off',
      duration: 'Jan 22 - Jan 24',
    },
    {
      name: 'Bundle add-on',
      status: 'Paused',
      discount: 'Buy 2 save 10%',
      duration: 'Paused',
    },
    {
      name: 'Prime day spotlight',
      status: 'Scheduled',
      discount: '10% off',
      duration: 'Feb 1 - Feb 7',
    },
  ];

  productTitle = '';
  productDescription = '';
  aplusContent = '';

  bulletPoints = [
    'Premium build with durable materials.',
    'Compatible with leading marketplace standards.',
    'Includes accessories for quick setup.',
    'Optimized for warehouse fulfillment.',
    'Backed by 12-month warranty.',
  ];

  readonly optionSets: OptionSet[] = [
    {
      name: 'color',
      display: 'Swatch',
      choices: ['Black', 'White', 'Crimson', 'Navy'],
      imageLink: true,
    },
    {
      name: 'size',
      display: 'List',
      choices: ['Small', 'Medium', 'Large', 'XL'],
      imageLink: false,
    },
  ];

  readonly variationRows: VariationRow[] = [
    {
      name: 'Black / Medium',
      sku: 'BLK-M-1120',
      stock: 48,
      priceDelta: '+$0.00',
    },
    {
      name: 'Black / Large',
      sku: 'BLK-L-1121',
      stock: 34,
      priceDelta: '+$2.00',
    },
    {
      name: 'Navy / Medium',
      sku: 'NVY-M-1122',
      stock: 21,
      priceDelta: '+$1.50',
    },
  ];

  readonly forecastByVariation = [
    {
      variation: '#03-bell',
      sales: '$5396',
      profit: '$1187',
      velocity: '12.0/day',
      stockDays: '0',
      restock: 'Urgent',
    },
    {
      variation: 'Born to Ride',
      sales: '$2249',
      profit: '$495',
      velocity: '5.0/day',
      stockDays: '0',
      restock: 'Urgent',
    },
    {
      variation: 'No Excuses',
      sales: '$6296',
      profit: '$1385',
      velocity: '14.0/day',
      stockDays: '0',
      restock: 'Urgent',
    },
  ];

  extraAttributes: AttributeRow[] = [
    { name: 'Batteries Included', value: 'No', type: 'text' },
    { name: 'Department', value: 'Unisex adult', type: 'text' },
    { name: 'Material', value: 'Zinc alloy', type: 'text' },
    { name: 'Item Package Quantity', value: '1', type: 'number' },
  ];

  readonly inventoryLocations: InventoryLocation[] = [
    { name: 'Warehouse A', onHand: 212, reserved: 42, available: 170 },
    { name: 'Warehouse B', onHand: 96, reserved: 12, available: 84 },
    { name: '3PL Partner', onHand: 44, reserved: 6, available: 38 },
  ];

  readonly salesRows: SalesRow[] = [
    { label: 'Last 7 days', units: 84, revenue: 1840 },
    { label: 'Last 30 days', units: 420, revenue: 9320 },
    { label: 'Last 90 days', units: 1230, revenue: 26890 },
    { label: 'Last 365 days', units: 4032, revenue: 88420 },
  ];

  readonly mediaSlots = [1, 2, 3, 4];

  readonly platformLabels: Record<string, string> = {
    amazon: 'Amazon',
    walmart: 'Walmart',
    ebay: 'eBay',
    newegg: 'Newegg',
    bestbuy: 'Bestbuy',
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

  readonly platformBadgeLabels: Record<string, string> = {
    amazon: 'amazon',
    walmart: 'WMT',
    ebay: 'ebay',
    newegg: 'NE',
    bestbuy: 'BBY',
    target: 'TGT',
    etsy: 'ETSY',
    shopify: 'SHOP',
    temu: 'TEMU',
    macys: 'MACY',
    costco: 'COST',
    homedepot: 'HD',
    lowes: 'LOW',
    wayfair: 'WAY',
    overstock: 'OVR',
  };

  selectTab(tab: TabId): void {
    this.activeTab = tab;
  }

  initIdentifierLists(product: Product): boolean {
    if (!this.identifiersInitialized) {
      this.identifierLists = {
        skus: [product.vendorSku || ''],
        upcs: [product.gtin || ''],
        asins: [product.asin || ''],
        fnskus: [product.fnsku || ''],
        gtins: [product.gtin || ''],
        eans: [product.ean || ''],
        isbns: [product.isbn || ''],
      };
      this.identifiersInitialized = true;
    }
    return true;
  }

  initContentFields(product: Product): boolean {
    if (!this.contentInitialized) {
      this.productTitle = product.name;
      this.productDescription = 'High-quality product description placeholder for marketplace listings.';
      this.contentInitialized = true;
    }
    return true;
  }

  addIdentifier(key: IdentifierKey): void {
    this.identifierLists = {
      ...this.identifierLists,
      [key]: [...this.identifierLists[key], ''],
    };
  }

  removeIdentifier(key: IdentifierKey, index: number): void {
    const next = [...this.identifierLists[key]];
    if (next.length <= 1) {
      next[0] = '';
    } else {
      next.splice(index, 1);
    }
    this.identifierLists = {
      ...this.identifierLists,
      [key]: next,
    };
  }

  identifierCount(key: IdentifierKey): number {
    return this.identifierLists[key].filter((value) => value.trim()).length;
  }

  identifierTotalCount(): number {
    return (Object.keys(this.identifierLists) as IdentifierKey[]).reduce(
      (total, key) => total + this.identifierCount(key),
      0
    );
  }

  addBulletPoint(): void {
    this.bulletPoints = [...this.bulletPoints, ''];
  }

  updateBulletPoint(index: number, value: string): void {
    const next = [...this.bulletPoints];
    next[index] = value;
    this.bulletPoints = next;
  }

  removeBulletPoint(index: number): void {
    if (this.bulletPoints.length <= 1) {
      this.bulletPoints = [''];
      return;
    }
    this.bulletPoints = this.bulletPoints.filter((_, i) => i !== index);
  }

  addExtraAttribute(): void {
    this.extraAttributes = [
      ...this.extraAttributes,
      { name: '', value: '', type: 'text' },
    ];
  }

  updateExtraAttribute(index: number, field: 'name' | 'value' | 'type', value: string): void {
    const next = [...this.extraAttributes];
    next[index] = { ...next[index], [field]: value };
    this.extraAttributes = next;
  }

  removeExtraAttribute(index: number): void {
    this.extraAttributes = this.extraAttributes.filter((_, i) => i !== index);
  }

  get selectedSalesVariationLabel(): string {
    if (this.selectedSalesVariation === 'all') {
      return 'All variations';
    }
    const match = this.salesVariationOptions.find((item) => item.id === this.selectedSalesVariation);
    return match?.name ?? 'All variations';
  }

  get salesDataPeriodLabel(): string {
    return this.salesPeriodOptions.find((option) => option.value === this.salesDataPeriod)?.label ?? 'Last 30 days';
  }

  get salesVariationOptions(): Array<{ id: string; name: string }> {
    const variations = this.variationRows.map((row, index) => ({
      id: `var-${index}`,
      name: row.name,
    }));
    return [{ id: 'all', name: 'All variations' }, ...variations];
  }

  setSalesVariation(id: string): void {
    this.selectedSalesVariation = id;
    this.salesVariationOpen = false;
  }

  setSalesViewMode(mode: 'sku' | 'asin'): void {
    this.salesViewMode = mode;
  }

  setSalesChartMode(mode: 'sales' | 'units'): void {
    this.salesChartMode = mode;
  }

  setSalesDataPeriod(value: string): void {
    this.salesDataPeriod = value;
    this.salesPeriodOpen = false;
  }

  toggleSalesComparison(id: string): void {
    this.salesComparisonSelections = {
      ...this.salesComparisonSelections,
      [id]: !this.salesComparisonSelections[id],
    };
  }

  setOfferRange(option: string): void {
    this.offerRange = option;
    this.offerRangeOpen = false;
  }

  setOfferMarketplaceFilter(option: string): void {
    this.offerMarketplaceFilter = option;
    this.offerMarketplaceFilterOpen = false;
  }

  setOfferStatusFilter(option: string): void {
    this.offerStatusFilter = option;
    this.offerStatusFilterOpen = false;
  }

  openCreateOfferDialog(product: Product): void {
    this.createOfferProductIds = [product.id];
    this.createOfferOpen = true;
  }

  closeCreateOfferDialog(): void {
    this.createOfferOpen = false;
    this.createOfferProductIds = [];
  }

  handleOfferCreated(event: { name: string; productCount: number }): void {
    const countLabel = event.productCount === 1 ? '' : 's';
    this.showToast(
      'Offer created',
      `"${event.name}" has been created for ${event.productCount} product${countLabel}.`
    );
  }

  toggleOfferMarketplace(id: string): void {
    this.offerMarketplaceStates = {
      ...this.offerMarketplaceStates,
      [id]: !this.offerMarketplaceStates[id],
    };
  }

  get filteredOfferMarketplaces(): Array<{ id: string; label: string }> {
    if (this.offerMarketplaceFilter === 'All Marketplaces') {
      return this.offerMarketplaceOptions;
    }
    const target = this.offerMarketplaceFilter.toLowerCase();
    return this.offerMarketplaceOptions.filter(
      (marketplace) => marketplace.label.toLowerCase() === target
    );
  }

  get filteredBrands(): string[] {
    const query = this.brandSearch.trim().toLowerCase();
    if (!query) return this.brandOptions;
    return this.brandOptions.filter((brand) => brand.toLowerCase().includes(query));
  }

  get filteredVendors(): string[] {
    const query = this.vendorSearch.trim().toLowerCase();
    if (!query) return this.vendorOptions;
    return this.vendorOptions.filter((vendor) => vendor.toLowerCase().includes(query));
  }

  toggleBrandDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.brandDropdownOpen = !this.brandDropdownOpen;
    if (this.brandDropdownOpen) {
      this.brandSearch = '';
    }
  }

  selectBrand(product: Product, brand: string): void {
    product.brand = brand;
    this.brandDropdownOpen = false;
    this.brandSearch = '';
  }

  openAddBrandModal(event?: MouseEvent): void {
    event?.stopPropagation();
    this.brandDropdownOpen = false;
    this.showAddBrandModal = true;
    this.newBrandName = this.brandSearch.trim();
    this.newBrandDetails = '';
  }

  closeAddBrandModal(): void {
    this.showAddBrandModal = false;
    this.newBrandName = '';
    this.newBrandDetails = '';
  }

  addBrand(product: Product): void {
    const name = this.newBrandName.trim();
    if (!name) return;
    if (!this.brandOptions.includes(name)) {
      this.brandOptions = [...this.brandOptions, name];
    }
    product.brand = name;
    this.closeAddBrandModal();
  }

  toggleVendorDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.vendorDropdownOpen = !this.vendorDropdownOpen;
    if (this.vendorDropdownOpen) {
      this.vendorSearch = '';
    }
  }

  selectVendor(product: Product, vendor: string): void {
    product.vendorName = vendor;
    this.vendorDropdownOpen = false;
    this.vendorSearch = '';
  }

  openAddVendorModal(event?: MouseEvent): void {
    event?.stopPropagation();
    this.vendorDropdownOpen = false;
    this.showAddVendorModal = true;
    this.newVendorName = this.vendorSearch.trim();
    this.newVendorDetails = '';
  }

  closeAddVendorModal(): void {
    this.showAddVendorModal = false;
    this.newVendorName = '';
    this.newVendorDetails = '';
  }

  addVendor(product: Product): void {
    const name = this.newVendorName.trim();
    if (!name) return;
    if (!this.vendorOptions.includes(name)) {
      this.vendorOptions = [...this.vendorOptions, name];
    }
    product.vendorName = name;
    this.closeAddVendorModal();
  }

  @HostListener('document:click')
  closeBrandVendorDropdowns(): void {
    this.vendorDropdownOpen = false;
    this.brandDropdownOpen = false;
  }

  goBack(): void {
    void this.router.navigate(['/']);
  }

  cancelEdit(): void {
    this.goBack();
  }

  saveChanges(): void {
    this.showToast('Saved', 'Changes have been saved.');
  }

  saveAndList(): void {
    this.showToast('Saved & listed', 'Product saved and listed to marketplaces.');
    this.selectTab('marketplaces');
  }

  showToast(title: string, text: string): void {
    const id = (this.toastId += 1);
    this.toastMessages = [...this.toastMessages, { id, title, text }];
    setTimeout(() => {
      this.toastMessages = this.toastMessages.filter((toast) => toast.id !== id);
    }, 2400);
  }

  setRevenueRange(option: string): void {
    this.revenueRange = option;
    this.revenueRangeOpen = false;
  }

  marketplaceSummary(product: Product): {
    all: MarketplaceStatus[];
    preview: MarketplaceStatus[];
    live: number;
    inactive: number;
    error: number;
    notListed: number;
  } {
    const statusByPlatform = new Map(
      product.marketplaces.map((marketplace) => [marketplace.platform, marketplace.status])
    );

    const all = marketplacePlatforms.map((platform) => ({
      platform,
      status: statusByPlatform.get(platform) ?? 'not_listed',
    }));

    return {
      all,
      preview: all.slice(0, 6),
      live: all.filter((item) => item.status === 'live').length,
      inactive: all.filter((item) => item.status === 'inactive').length,
      error: all.filter((item) => item.status === 'error').length,
      notListed: all.filter((item) => item.status === 'not_listed').length,
    };
  }

  platformLabel(platform: string): string {
    return this.platformLabels[platform] ?? platform.charAt(0).toUpperCase() + platform.slice(1);
  }

  platformBadgeLabel(platform: string): string {
    return this.platformBadgeLabels[platform] ?? platform.slice(0, 3).toUpperCase();
  }

  platformBadgeClass(platform: string): string {
    switch (platform) {
      case 'amazon':
        return 'bg-orange-500/20 text-orange-600';
      case 'walmart':
        return 'bg-blue-500/20 text-blue-500';
      case 'ebay':
        return 'bg-emerald-500/20 text-emerald-600';
      case 'newegg':
        return 'bg-amber-500/20 text-amber-600';
      case 'bestbuy':
        return 'bg-indigo-500/20 text-indigo-500';
      case 'target':
        return 'bg-rose-500/20 text-rose-600';
      default:
        return 'bg-slate-500/20 text-slate-500';
    }
  }

  marketplaceBadgeClass(status: MarketplaceStatus['status']): string {
    switch (status) {
      case 'live':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700';
      case 'inactive':
        return 'bg-muted border-border text-muted-foreground';
      case 'error':
        return 'bg-rose-500/10 border-rose-500/30 text-rose-600';
      case 'not_listed':
      default:
        return 'bg-slate-500/10 border-slate-400/30 text-slate-500';
    }
  }

  marketplaceTextClass(status: MarketplaceStatus['status']): string {
    switch (status) {
      case 'live':
        return 'text-emerald-700';
      case 'inactive':
        return 'text-muted-foreground';
      case 'error':
        return 'text-rose-600';
      case 'not_listed':
      default:
        return 'text-slate-500';
    }
  }

  statusLabel(status: MarketplaceStatus['status']): string {
    if (status === 'not_listed') {
      return 'Not Listed';
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  restockBadgeClass(status: Product['restockStatus']): string {
    switch (status) {
      case 'in_stock':
        return 'border-emerald-500/30 text-emerald-700 bg-emerald-500/10';
      case 'low_stock':
        return 'border-amber-500/30 text-amber-700 bg-amber-500/10';
      case 'reorder_now':
        return 'border-rose-500/30 text-rose-600 bg-rose-500/10';
      case 'out_of_stock':
      default:
        return 'border-slate-500/30 text-slate-500 bg-slate-500/10';
    }
  }

  restockLeadDays(product: Product): number {
    return Math.max(0, this.stockDaysValue(product) - 7);
  }

  stockDaysValue(product: Product): number {
    const stockQty = Number.isFinite(product.stockQty) ? product.stockQty : 0;
    const velocity = Number.isFinite(product.velocity) ? product.velocity : 0;
    if (velocity <= 0) {
      return Math.max(0, stockQty);
    }
    return Math.max(0, Math.round(stockQty / velocity));
  }

  restockLabel(status: Product['restockStatus']): string {
    switch (status) {
      case 'in_stock':
        return 'In stock';
      case 'low_stock':
        return 'Low stock';
      case 'reorder_now':
        return 'Reorder now';
      case 'out_of_stock':
      default:
        return 'Out of stock';
    }
  }
}
