import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { marketplacePlatforms, mockProducts } from '@/data/mockProducts';

type CreateTab =
  | 'overview'
  | 'pricing'
  | 'identifiers'
  | 'images'
  | 'marketplaces'
  | 'content'
  | 'options'
  | 'extra'
  | 'tags';

type ProductType = 'single' | 'kit';

interface KitComponentRow {
  productId: string;
  name: string;
  vendorSku: string;
  quantity: number;
}

interface OptionSet {
  name: string;
  display: string;
  choices: string[];
  linkImages: boolean;
}

interface VariationRow {
  name: string;
  sku: string;
  stock: number;
  price: number;
}

interface ExtraAttributeRow {
  name: string;
  value: string;
  type: string;
}

@Component({
  selector: 'app-product-create-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="min-h-screen bg-background flex flex-col">
      <header class="px-6 py-4 border-b border-border bg-background">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
              aria-label="Go back"
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
            <div class="w-20 h-20 rounded-lg bg-muted border border-border flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-8 w-8 text-muted-foreground"
              >
                <path
                  d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
                ></path>
                <path d="M12 22V12"></path>
                <path d="m3.3 7 8.7 5 8.7-5"></path>
                <path d="m7.5 4.27 9 5.15"></path>
              </svg>
            </div>
            <div>
              <h1 class="text-2xl font-semibold flex items-center gap-2">
                <input
                  type="text"
                  class="text-2xl font-semibold h-auto py-1.5 w-[500px] bg-transparent border-0 border-b border-transparent focus:border-primary focus:outline-none"
                  placeholder="Enter product name *"
                  [(ngModel)]="productData.name"
                />
              </h1>
              <p class="mt-1.5 flex flex-wrap items-center gap-3 text-base text-muted-foreground">
                <span class="flex items-center gap-1.5">
                  <span class="text-base font-semibold text-muted-foreground">#</span>
                  New Product
                </span>
                <span class="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs">
                  Draft
                </span>
                <span
                  *ngIf="productType === 'kit'"
                  class="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-foreground"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="h-3 w-3"
                  >
                    <path
                      d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
                    ></path>
                    <path d="M12 22V12"></path>
                    <path d="m3.3 7 8.7 5 8.7-5"></path>
                    <path d="m7.5 4.27 9 5.15"></path>
                  </svg>
                  Kit Product
                </span>
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
            >
              <span class="inline-flex items-center gap-2">
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
                Cancel
              </span>
            </button>
            <button
              type="button"
              class="rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
            >
              <span class="inline-flex items-center gap-2">
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
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                Save Draft
              </span>
            </button>
            <button
              type="button"
              class="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <span class="inline-flex items-center gap-2">
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
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                Save &amp; List
              </span>
            </button>
          </div>
        </div>
      </header>

      <div class="px-6">
        <div class="mt-3 inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground">
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
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
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
        </div>
      </div>

      <div class="flex-1 overflow-y-auto px-6 pb-10">
        <div *ngIf="activeTab === 'overview'" class="py-6">
          <div class="grid grid-cols-2 gap-6">
            <div class="space-y-4">
              <h3 class="text-lg font-semibold flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-5 w-5 text-primary"
                >
                  <path
                    d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
                  ></path>
                  <path d="M12 22V12"></path>
                  <path d="m3.3 7 8.7 5 8.7-5"></path>
                  <path d="m7.5 4.27 9 5.15"></path>
                </svg>
                Basic Information
              </h3>
              <div class="bg-muted/30 rounded-lg p-4 space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="text-sm text-muted-foreground">Brand</label>
                    <div class="relative mt-1" (click)="$event.stopPropagation()">
                      <button
                        type="button"
                        class="flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm"
                        (click)="toggleBrandDropdown($event)"
                      >
                        <span class="truncate text-left">
                          {{ productData.brand || 'Select brand...' }}
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
                            [class.bg-primary]="brand === productData.brand"
                            [class.text-primary-foreground]="brand === productData.brand"
                            (click)="selectBrand(brand)"
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
                          {{ productData.vendorName || 'Select vendor...' }}
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
                            [class.bg-primary]="vendor === productData.vendorName"
                            [class.text-primary-foreground]="vendor === productData.vendorName"
                            (click)="selectVendor(vendor)"
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
                <div>
                  <label class="text-sm text-muted-foreground">SKU *</label>
                  <div class="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      class="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                      placeholder="Enter SKU"
                      [(ngModel)]="productData.vendorSku"
                    />
                    <button
                      type="button"
                      class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
                      title="Copy SKU"
                      [disabled]="!productData.vendorSku.trim()"
                      (click)="copyToClipboard(productData.vendorSku)"
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
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </button>
                  </div>
                </div>
                <div>
                  <label class="text-sm text-muted-foreground">
                    MPN (Manufacturer Part Number)
                  </label>
                  <input
                    type="text"
                    class="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Enter MPN"
                    [(ngModel)]="productData.manufacturerPart"
                  />
                </div>
              </div>

              <div class="mt-6">
                <h4 class="text-md font-medium flex items-center gap-2 mb-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="h-4 w-4 text-primary"
                  >
                    <path d="M12 3v18"></path>
                    <path d="M3 7l9 5 9-5"></path>
                    <path d="M3 17l9 5 9-5"></path>
                  </svg>
                  Product Type
                </h4>
                <div class="flex gap-3">
                  <button
                    type="button"
                    class="flex-1 rounded-lg border border-border px-4 py-3 text-sm font-semibold flex flex-col items-center gap-1"
                    [class.bg-primary]="productType === 'single'"
                    [class.text-primary-foreground]="productType === 'single'"
                    (click)="setProductType('single')"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="h-5 w-5"
                    >
                      <path
                        d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
                      ></path>
                      <path d="M12 22V12"></path>
                      <path d="m3.3 7 8.7 5 8.7-5"></path>
                      <path d="m7.5 4.27 9 5.15"></path>
                    </svg>
                    Single Product
                  </button>
                  <button
                    type="button"
                    class="flex-1 rounded-lg border border-border px-4 py-3 text-sm font-semibold flex flex-col items-center gap-1"
                    [class.bg-primary]="productType === 'kit'"
                    [class.text-primary-foreground]="productType === 'kit'"
                    (click)="setProductType('kit')"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="h-5 w-5"
                    >
                      <path
                        d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
                      ></path>
                      <path d="M12 22V12"></path>
                      <path d="m3.3 7 8.7 5 8.7-5"></path>
                      <path d="m7.5 4.27 9 5.15"></path>
                    </svg>
                    Kit Product
                  </button>
                </div>
                <p *ngIf="productType === 'kit'" class="text-sm text-muted-foreground mt-2">
                  Kit products bundle multiple products together. Configure components in the
                  Kit Mapping tab.
                </p>
              </div>
            </div>

            <div class="space-y-4">
              <h3 class="text-lg font-semibold flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-5 w-5 text-primary"
                >
                  <line x1="12" y1="20" x2="12" y2="10"></line>
                  <line x1="18" y1="20" x2="18" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="16"></line>
                </svg>
                Quick Stats
              </h3>
              <div class="grid grid-cols-4 gap-3">
                <div class="bg-muted/30 rounded-lg p-4">
                  <div class="flex items-center gap-2 text-muted-foreground mb-1">
                    <span class="text-sm">$</span>
                    <span class="text-sm">Sale Price</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    class="text-xl font-bold h-auto w-full py-1 bg-transparent border-0 border-b border-dashed border-muted-foreground/30 focus:outline-none focus:border-primary"
                    placeholder="0.00"
                    [(ngModel)]="productData.salePrice"
                  />
                </div>
                <div class="bg-muted/30 rounded-lg p-4">
                  <div class="flex items-center gap-2 text-muted-foreground mb-1">
                    <span class="text-sm">↗</span>
                    <span class="text-sm">Profit Margin</span>
                  </div>
                  <p
                    class="text-2xl font-bold"
                    [class.text-green-600]="grossProfitPercent > 0"
                    [class.text-red-600]="grossProfitPercent < 0"
                    [class.text-muted-foreground]="grossProfitPercent === 0"
                  >
                    {{ grossProfitPercent | number: '1.1-1' }}%
                  </p>
                </div>
                <div class="bg-muted/30 rounded-lg p-4">
                  <div class="flex items-center gap-2 text-muted-foreground mb-1">
                    <span class="text-sm">▦</span>
                    <span class="text-sm">In Stock</span>
                  </div>
                  <input
                    type="number"
                    class="text-2xl font-bold h-auto w-full py-1 bg-transparent border-0 border-b border-dashed border-muted-foreground/30 focus:outline-none focus:border-primary"
                    placeholder="0"
                    [(ngModel)]="productData.stockQty"
                  />
                </div>
                <div class="bg-muted/30 rounded-lg p-4">
                  <div class="flex items-center gap-2 text-muted-foreground mb-1">
                    <span class="text-sm">◎</span>
                    <span class="text-sm">Marketplaces</span>
                  </div>
                  <p class="text-2xl font-bold">
                    {{ selectedMarketplaces.length }}
                  </p>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <h3 class="text-lg font-semibold flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-5 w-5 text-primary"
                >
                  <path d="M10 17h4V5H2v12h8"></path>
                  <path d="M14 7h4l4 4v6h-8"></path>
                  <circle cx="7" cy="17" r="2"></circle>
                  <circle cx="17" cy="17" r="2"></circle>
                </svg>
                Cost Breakdown
              </h3>
              <div class="bg-muted/30 rounded-lg p-4 space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-muted-foreground">Landed Cost</span>
                  <input
                    type="number"
                    step="0.01"
                    class="w-24 rounded-md border border-border bg-background px-2 py-1 text-right text-sm"
                    placeholder="0.00"
                    [(ngModel)]="productData.landedCost"
                  />
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-muted-foreground">Shipping Cost</span>
                  <input
                    type="number"
                    step="0.01"
                    class="w-24 rounded-md border border-border bg-background px-2 py-1 text-right text-sm"
                    placeholder="0.00"
                    [(ngModel)]="productData.shippingCost"
                  />
                </div>
                <div class="border-t border-border/60"></div>
                <div class="flex justify-between items-center font-medium">
                  <span>Gross Profit</span>
                  <span [class.text-green-600]="grossProfit >= 0" [class.text-red-600]="grossProfit < 0">
                    {{ grossProfit | currency: 'USD' : 'symbol' : '1.2-2' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <h3 class="text-lg font-semibold flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-5 w-5 text-primary"
                >
                  <path d="M20 7h-9"></path>
                  <path d="M14 17H5"></path>
                  <circle cx="17" cy="17" r="3"></circle>
                  <circle cx="7" cy="7" r="3"></circle>
                </svg>
                Inventory
              </h3>
              <div class="bg-muted/30 rounded-lg p-4 grid grid-cols-2 gap-4">
                <div>
                  <label class="text-sm text-muted-foreground">Purchase Qty</label>
                  <input
                    type="number"
                    class="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="0"
                    [(ngModel)]="productData.purchaseQty"
                  />
                </div>
                <div>
                  <label class="text-sm text-muted-foreground">Sold Qty</label>
                  <input
                    type="number"
                    class="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="0"
                    [(ngModel)]="productData.soldQty"
                  />
                </div>
                <div>
                  <label class="text-sm text-muted-foreground">Return Qty</label>
                  <input
                    type="number"
                    class="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="0"
                    [(ngModel)]="productData.returnQty"
                  />
                </div>
                <div>
                  <label class="text-sm text-muted-foreground">Stock Qty</label>
                  <input
                    type="number"
                    class="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="0"
                    [(ngModel)]="productData.stockQty"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="activeTab === 'pricing'" class="py-6 space-y-6">
          <div class="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div class="space-y-3">
              <h2 class="text-lg font-semibold flex items-center gap-2">
                <span class="text-primary">$</span>
                Pricing
              </h2>
              <div class="rounded-xl border border-border bg-card p-5 space-y-4">
                <div class="grid gap-4 sm:grid-cols-2">
                  <label class="grid gap-1 text-xs text-muted-foreground">
                    Sale Price
                    <input
                      type="number"
                      class="rounded-md border border-border bg-background px-3 py-2 text-sm"
                      [(ngModel)]="productData.salePrice"
                    />
                  </label>
                  <label class="grid gap-1 text-xs text-muted-foreground">
                    MSRP
                    <input
                      type="number"
                      class="rounded-md border border-border bg-background px-3 py-2 text-sm"
                      [(ngModel)]="productData.msrp"
                    />
                  </label>
                  <label class="grid gap-1 text-xs text-muted-foreground">
                    Discount %
                    <input
                      type="number"
                      class="rounded-md border border-border bg-background px-3 py-2 text-sm"
                      [(ngModel)]="productData.discountPercent"
                    />
                  </label>
                  <label class="grid gap-1 text-xs text-muted-foreground">
                    Landed Cost
                    <input
                      type="number"
                      class="rounded-md border border-border bg-background px-3 py-2 text-sm"
                      [(ngModel)]="productData.landedCost"
                    />
                  </label>
                  <label class="grid gap-1 text-xs text-muted-foreground">
                    BuyBox Min Price
                    <input
                      type="number"
                      class="rounded-md border border-border bg-background px-3 py-2 text-sm"
                      [(ngModel)]="productData.buyBoxMinPrice"
                    />
                  </label>
                  <label class="grid gap-1 text-xs text-muted-foreground">
                    BuyBox Max Price
                    <input
                      type="number"
                      class="rounded-md border border-border bg-background px-3 py-2 text-sm"
                      [(ngModel)]="productData.buyBoxMaxPrice"
                    />
                  </label>
                </div>
                <label class="grid gap-1 text-xs text-muted-foreground">
                  Shipping Cost
                  <input
                    type="number"
                    class="rounded-md border border-border bg-background px-3 py-2 text-sm"
                    [(ngModel)]="productData.shippingCost"
                  />
                </label>
              </div>
            </div>

            <div class="space-y-3">
              <h2 class="text-lg font-semibold flex items-center gap-2">
                <span class="text-primary">↗</span>
                Profit Summary
              </h2>
              <div class="rounded-xl border border-border bg-card p-5 space-y-4">
                <div class="space-y-3 text-sm">
                  <div class="flex items-center justify-between">
                    <span class="text-muted-foreground">Sale Price</span>
                    <span class="font-semibold">
                      {{ productData.salePrice | currency: 'USD' : 'symbol' : '1.2-2' }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between text-muted-foreground">
                    <span>- Landed Cost</span>
                    <span
                      [class.text-red-500]="productData.landedCost > 0"
                    >
                      {{ productData.landedCost | currency: 'USD' : 'symbol' : '1.2-2' }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between text-muted-foreground">
                    <span>- Shipping Cost</span>
                    <span
                      [class.text-red-500]="productData.shippingCost > 0"
                    >
                      {{ productData.shippingCost | currency: 'USD' : 'symbol' : '1.2-2' }}
                    </span>
                  </div>
                  <div class="border-t border-border/60 pt-3 flex items-center justify-between font-semibold">
                    <span>Gross Profit</span>
                    <span
                      [class.text-green-600]="grossProfit > 0"
                      [class.text-red-500]="grossProfit < 0"
                      [class.text-muted-foreground]="grossProfit === 0"
                    >
                      {{ grossProfit | currency: 'USD' : 'symbol' : '1.2-2' }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between font-semibold">
                    <span>Profit Margin</span>
                    <span
                      [class.text-green-600]="grossProfitPercent > 0"
                      [class.text-red-500]="grossProfitPercent < 0"
                      [class.text-muted-foreground]="grossProfitPercent === 0"
                    >
                      {{ grossProfitPercent | number: '1.1-1' }}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <h2 class="text-lg font-semibold flex items-center gap-2">
              <span class="text-primary">▦</span>
              Inventory
            </h2>
            <div class="rounded-xl border border-border bg-card p-5 space-y-4">
              <div class="grid gap-4 md:grid-cols-4 sm:grid-cols-2">
                <label class="grid gap-1 text-xs text-muted-foreground">
                  Purchase Qty
                  <input
                    type="number"
                    class="rounded-md border border-border bg-background px-3 py-2 text-sm"
                    [(ngModel)]="productData.purchaseQty"
                  />
                </label>
                <label class="grid gap-1 text-xs text-muted-foreground">
                  Stock Qty
                  <input
                    type="number"
                    class="rounded-md border border-border bg-background px-3 py-2 text-sm"
                    [(ngModel)]="productData.stockQty"
                  />
                </label>
                <label class="grid gap-1 text-xs text-muted-foreground">
                  Sold Qty
                  <input
                    type="number"
                    class="rounded-md border border-border bg-background px-3 py-2 text-sm"
                    [(ngModel)]="productData.soldQty"
                  />
                </label>
                <label class="grid gap-1 text-xs text-muted-foreground">
                  Return Qty
                  <input
                    type="number"
                    class="rounded-md border border-border bg-background px-3 py-2 text-sm"
                    [(ngModel)]="productData.returnQty"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="activeTab === 'identifiers'" class="py-6 space-y-6">
          <div class="flex items-center gap-2 text-lg font-semibold">
            <span class="text-primary">▥</span>
            Product Identifiers
          </div>

          <div class="rounded-xl border border-border bg-card p-5 space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 font-semibold">
                <span class="text-muted-foreground">#</span>
                Internal Identifiers
              </div>
              <button
                type="button"
                class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
                (click)="addIdentifier('internalSkus')"
              >
                + Add
              </button>
            </div>
            <div class="text-xs text-muted-foreground">SKU (Stock Keeping Unit)</div>
            <div class="space-y-3">
                <div
                  *ngFor="let sku of identifierLists.internalSkus; let i = index; trackBy: trackByIndex"
                class="flex items-center gap-3"
              >
                <div class="relative flex-1">
                  <span
                    class="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    #{{ i + 1 }}
                  </span>
                  <input
                    type="text"
                    class="w-full rounded-md border border-border bg-background px-3 py-2 pl-12 text-sm"
                    placeholder="Enter SKU"
                    [(ngModel)]="identifierLists.internalSkus[i]"
                    [ngModelOptions]="{ standalone: true }"
                  />
                </div>
                <button
                  type="button"
                  class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
                  (click)="copyToClipboard(identifierLists.internalSkus[i])"
                  [disabled]="!identifierLists.internalSkus[i].trim()"
                  title="Copy"
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
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
                <button
                  type="button"
                  class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted"
                  (click)="removeIdentifier('internalSkus', i)"
                  title="Remove"
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
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div class="rounded-xl border border-border bg-card p-5">
            <div class="flex items-center gap-2 font-semibold mb-4">
              <span class="text-muted-foreground">◎</span>
              Universal Product Codes
            </div>
            <div class="grid gap-6 md:grid-cols-2">
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="text-xs text-muted-foreground">UPC (Universal Product Code)</div>
                  <button
                    type="button"
                    class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
                    (click)="addIdentifier('upcCodes')"
                  >
                    + Add
                  </button>
                </div>
                <div class="space-y-2">
                  <div
                    *ngFor="let upc of identifierLists.upcCodes; let i = index; trackBy: trackByIndex"
                    class="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      class="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                      placeholder="Enter UPC"
                      [(ngModel)]="identifierLists.upcCodes[i]"
                      [ngModelOptions]="{ standalone: true }"
                    />
                    <button
                      type="button"
                      class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
                      (click)="copyToClipboard(identifierLists.upcCodes[i])"
                      [disabled]="!identifierLists.upcCodes[i].trim()"
                      title="Copy"
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
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="text-xs text-muted-foreground">GTIN (Global Trade Item Number)</div>
                  <button
                    type="button"
                    class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
                    (click)="addIdentifier('gtinCodes')"
                  >
                    + Add
                  </button>
                </div>
                <div class="space-y-2">
                  <div
                    *ngFor="let gtin of identifierLists.gtinCodes; let i = index; trackBy: trackByIndex"
                    class="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      class="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                      placeholder="Enter GTIN"
                      [(ngModel)]="identifierLists.gtinCodes[i]"
                      [ngModelOptions]="{ standalone: true }"
                    />
                    <button
                      type="button"
                      class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
                      (click)="copyToClipboard(identifierLists.gtinCodes[i])"
                      [disabled]="!identifierLists.gtinCodes[i].trim()"
                      title="Copy"
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
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="text-xs text-muted-foreground">EAN (European Article Number)</div>
                  <button
                    type="button"
                    class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
                    (click)="addIdentifier('eanCodes')"
                  >
                    + Add
                  </button>
                </div>
                <div class="space-y-2">
                  <div
                    *ngFor="let ean of identifierLists.eanCodes; let i = index; trackBy: trackByIndex"
                    class="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      class="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                      placeholder="Enter EAN"
                      [(ngModel)]="identifierLists.eanCodes[i]"
                      [ngModelOptions]="{ standalone: true }"
                    />
                    <button
                      type="button"
                      class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
                      (click)="copyToClipboard(identifierLists.eanCodes[i])"
                      [disabled]="!identifierLists.eanCodes[i].trim()"
                      title="Copy"
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
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="text-xs text-muted-foreground">ISBN (Book Number)</div>
                  <button
                    type="button"
                    class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
                    (click)="addIdentifier('isbnCodes')"
                  >
                    + Add
                  </button>
                </div>
                <div class="space-y-2">
                  <div
                    *ngFor="let isbn of identifierLists.isbnCodes; let i = index; trackBy: trackByIndex"
                    class="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      class="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                      placeholder="Enter ISBN"
                      [(ngModel)]="identifierLists.isbnCodes[i]"
                      [ngModelOptions]="{ standalone: true }"
                    />
                    <button
                      type="button"
                      class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
                      (click)="copyToClipboard(identifierLists.isbnCodes[i])"
                      [disabled]="!identifierLists.isbnCodes[i].trim()"
                      title="Copy"
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
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-xl border border-border bg-card p-5">
            <div class="flex items-center gap-2 font-semibold mb-4">
              <span class="text-muted-foreground">🛒</span>
              Marketplace Identifiers
            </div>
            <div class="grid gap-6 md:grid-cols-2">
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="text-xs text-muted-foreground">ASIN (Amazon)</div>
                  <button
                    type="button"
                    class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
                    (click)="addIdentifier('asinCodes')"
                  >
                    + Add
                  </button>
                </div>
                <div class="space-y-2">
                  <div
                    *ngFor="let asin of identifierLists.asinCodes; let i = index; trackBy: trackByIndex"
                    class="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      class="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                      placeholder="Enter ASIN"
                      [(ngModel)]="identifierLists.asinCodes[i]"
                      [ngModelOptions]="{ standalone: true }"
                    />
                    <button
                      type="button"
                      class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
                      (click)="copyToClipboard(identifierLists.asinCodes[i])"
                      [disabled]="!identifierLists.asinCodes[i].trim()"
                      title="Copy"
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
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="text-xs text-muted-foreground">FNSKU (Amazon FBA)</div>
                  <button
                    type="button"
                    class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
                    (click)="addIdentifier('fnskuCodes')"
                  >
                    + Add
                  </button>
                </div>
                <div class="space-y-2">
                  <div
                    *ngFor="let fnsku of identifierLists.fnskuCodes; let i = index; trackBy: trackByIndex"
                    class="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      class="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                      placeholder="Enter FNSKU"
                      [(ngModel)]="identifierLists.fnskuCodes[i]"
                      [ngModelOptions]="{ standalone: true }"
                    />
                    <button
                      type="button"
                      class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
                      (click)="copyToClipboard(identifierLists.fnskuCodes[i])"
                      [disabled]="!identifierLists.fnskuCodes[i].trim()"
                      title="Copy"
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
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="mt-4">
              <div class="text-xs text-muted-foreground">MPN (Manufacturer Part Number)</div>
              <input
                type="text"
                class="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="Enter MPN"
                [(ngModel)]="productData.manufacturerPart"
                [ngModelOptions]="{ standalone: true }"
              />
            </div>
          </div>
        </div>

        <div *ngIf="activeTab === 'images'" class="py-6 space-y-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-lg font-semibold">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-5 w-5 text-primary"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <path d="m21 15-5-5L5 21"></path>
              </svg>
              Product Media
            </div>
            <div class="flex items-center gap-4 text-xs text-muted-foreground">
              <span class="inline-flex items-center gap-2">
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
                {{ mediaImageCount }} images
              </span>
              <span class="inline-flex items-center gap-2">
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
                  <polygon points="23 7 16 12 23 17 23 7"></polygon>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                </svg>
                {{ mediaVideoCount }} videos
              </span>
            </div>
          </div>

          <div class="rounded-xl border border-border bg-card p-4">
            <div class="flex flex-wrap items-center gap-3">
              <input
                type="text"
                class="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="Paste image or video URL"
                [(ngModel)]="mediaUrlInput"
              />
              <button
                type="button"
                class="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                [disabled]="!mediaUrlInput.trim()"
                (click)="addMedia()"
              >
                <span class="inline-flex items-center gap-2">
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
                  Add
                </span>
              </button>
            </div>
            <p class="mt-2 text-xs text-muted-foreground">
              Drag and drop to reorder. First image will be the main product image.
            </p>
          </div>

          <div
            class="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground"
          >
            <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg border border-border/60">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-6 w-6"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <path d="m21 15-5-5L5 21"></path>
              </svg>
            </div>
            <p class="font-medium text-foreground">No media added yet</p>
            <p class="mt-1 text-xs text-muted-foreground">
              Add images or videos using the field above
            </p>
          </div>
        </div>

        <div *ngIf="activeTab === 'marketplaces'" class="py-6 space-y-6">
          <div class="rounded-xl border border-border bg-card p-5">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold">Marketplaces</h2>
              <span class="text-xs text-muted-foreground">
                {{ selectedMarketplaces.length }} selected
              </span>
            </div>
            <div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <button
                *ngFor="let platform of marketplaces"
                type="button"
                class="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-sm"
                [class.border-primary]="isMarketplaceSelected(platform)"
                (click)="toggleMarketplace(platform)"
              >
                <span class="font-medium capitalize">{{ marketplaceLabel(platform) }}</span>
                <input type="checkbox" [checked]="isMarketplaceSelected(platform)" />
              </button>
            </div>
          </div>
        </div>

        <div *ngIf="activeTab === 'content'" class="py-6 space-y-6">
          <div class="rounded-xl border border-border bg-card p-5 space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold">Listing content</h2>
              <button
                type="button"
                class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                Validate
              </button>
            </div>
            <label class="grid gap-1 text-xs text-muted-foreground">
              Product title
              <input
                type="text"
                class="rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="Listing title"
              />
            </label>
            <label class="grid gap-1 text-xs text-muted-foreground">
              Description
              <textarea
                rows="4"
                class="rounded-md border border-border bg-background px-3 py-2 text-sm"
              >High-quality product description placeholder for marketplace listings.</textarea>
            </label>
          </div>
          <div class="rounded-xl border border-border bg-card p-5">
            <h3 class="text-sm font-semibold text-muted-foreground">Bullet points</h3>
            <div class="mt-4 space-y-2">
              <div
                *ngFor="let bullet of bulletPoints; let i = index"
                class="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs"
              >
                <span class="text-muted-foreground">{{ i + 1 }}.</span>
                <input
                  type="text"
                  class="flex-1 border-none bg-transparent text-sm text-foreground focus:outline-none"
                  [value]="bullet"
                />
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="activeTab === 'options'" class="py-6 space-y-6">
          <div class="rounded-xl border border-border bg-card p-5 space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold">Product options</h2>
              <button
                type="button"
                class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                Manage options
              </button>
            </div>
            <div class="grid gap-3 md:grid-cols-2">
              <div
                *ngFor="let option of optionSets"
                class="rounded-lg border border-border bg-background p-3"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-semibold capitalize">{{ option.name }}</p>
                    <p class="text-xs text-muted-foreground">
                      Display: {{ option.display }} | Image link:
                      {{ option.linkImages ? 'On' : 'Off' }}
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
          </div>
          <div class="rounded-xl border border-border bg-card p-5">
            <h3 class="text-sm font-semibold text-muted-foreground">Variation matrix</h3>
            <div class="mt-4 overflow-x-auto">
              <table class="w-full min-w-[540px] text-sm">
                <thead>
                  <tr class="border-b border-border text-xs text-muted-foreground">
                    <th class="py-2 text-left">Variation</th>
                    <th class="py-2 text-left">SKU</th>
                    <th class="py-2 text-right">Stock</th>
                    <th class="py-2 text-right">Price</th>
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
                    <td class="py-2 text-right">
                      {{ row.price | currency: 'USD' : 'symbol' : '1.2-2' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div *ngIf="activeTab === 'extra'" class="py-6 space-y-6">
          <div class="rounded-xl border border-border bg-card p-5">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold">Extra attributes</h2>
              <button
                type="button"
                class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                Add attribute
              </button>
            </div>
            <div class="mt-4 overflow-x-auto">
              <table class="w-full min-w-[480px] text-sm">
                <thead>
                  <tr class="border-b border-border text-xs text-muted-foreground">
                    <th class="py-2 text-left">Attribute</th>
                    <th class="py-2 text-left">Value</th>
                    <th class="py-2 text-left">Type</th>
                    <th class="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    *ngFor="let attribute of extraAttributes"
                    class="border-b border-border/60"
                  >
                    <td class="py-2 font-medium">{{ attribute.name }}</td>
                    <td class="py-2 text-muted-foreground">{{ attribute.value }}</td>
                    <td class="py-2 text-xs text-muted-foreground">{{ attribute.type }}</td>
                    <td class="py-2 text-right">
                      <button
                        type="button"
                        class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div *ngIf="activeTab === 'tags'" class="py-6 space-y-6">
          <div class="rounded-xl border border-border bg-card p-5">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold">Tags &amp; labels</h2>
              <button
                type="button"
                class="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                Manage tags
              </button>
            </div>
            <div class="mt-4 flex flex-wrap gap-2 text-xs">
              <button
                *ngFor="let tag of tagOptions"
                type="button"
                class="rounded-full border border-border px-3 py-1"
                [class.bg-muted]="selectedTags.includes(tag)"
                (click)="toggleTag(tag)"
              >
                {{ tag }}
              </button>
            </div>
            <div class="mt-4 rounded-lg border border-dashed border-border bg-background p-4 text-xs text-muted-foreground">
              Use tags to organize bundles, launches, and seasonal promotions.
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
              (click)="addVendor()"
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
              (click)="addBrand()"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div
        class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2"
      >
        <div
          *ngFor="let toast of toastMessages"
          class="rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground shadow-lg"
        >
          {{ toast.text }}
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ProductCreatePageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  activeTab: CreateTab = 'overview';
  productType: ProductType = 'single';

  productData = {
    name: '',
    brand: '',
    vendorName: '',
    vendorSku: '',
    manufacturerPart: '',
    salePrice: 0,
    buyBoxMinPrice: 0,
    buyBoxMaxPrice: 0,
    landedCost: 0,
    shippingCost: 0,
    stockQty: 0,
    purchaseQty: 0,
    soldQty: 0,
    returnQty: 0,
    msrp: 0,
    discountPercent: 0,
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

  readonly marketplaces = marketplacePlatforms;
  readonly mediaSlots = [1, 2, 3, 4];

  readonly bulletPoints = [
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
      linkImages: true,
    },
    {
      name: 'size',
      display: 'List',
      choices: ['Small', 'Medium', 'Large', 'XL'],
      linkImages: false,
    },
  ];

  readonly variationRows: VariationRow[] = [
    { name: 'Black / Medium', sku: 'BLK-M-1120', stock: 48, price: 129.99 },
    { name: 'Black / Large', sku: 'BLK-L-1121', stock: 34, price: 131.99 },
    { name: 'Navy / Medium', sku: 'NVY-M-1122', stock: 21, price: 131.49 },
  ];

  readonly extraAttributes: ExtraAttributeRow[] = [
    { name: 'Batteries Included', value: 'No', type: 'Boolean' },
    { name: 'Department', value: 'Unisex adult', type: 'Text' },
    { name: 'Material', value: 'Zinc alloy', type: 'Text' },
    { name: 'Item Package Quantity', value: '1', type: 'Number' },
  ];

  readonly tagOptions = [
    'New launch',
    'Seasonal',
    'Bundle candidate',
    'Needs review',
    'High margin',
    'Core catalog',
  ];

  selectedTags = ['New launch', 'High margin'];

  selectedMarketplaces = ['amazon', 'walmart', 'ebay', 'target'];

  vendorDropdownOpen = false;
  vendorSearch = '';
  showAddVendorModal = false;
  newVendorName = '';
  newVendorDetails = '';

  identifierLists: Record<
    | 'internalSkus'
    | 'upcCodes'
    | 'gtinCodes'
    | 'eanCodes'
    | 'isbnCodes'
    | 'asinCodes'
    | 'fnskuCodes',
    string[]
  > = {
    internalSkus: [''],
    upcCodes: [''],
    gtinCodes: [''],
    eanCodes: [''],
    isbnCodes: [''],
    asinCodes: [''],
    fnskuCodes: [''],
  };

  brandDropdownOpen = false;
  brandSearch = '';
  showAddBrandModal = false;
  newBrandName = '';
  newBrandDetails = '';

  mediaUrlInput = '';
  mediaItems: Array<{ url: string; type: 'image' | 'video' }> = [];

  toastMessages: Array<{ id: number; text: string }> = [];
  private toastId = 0;

  kitComponents: KitComponentRow[] = mockProducts.slice(0, 2).map((product) => ({
    productId: product.id,
    name: product.name,
    vendorSku: product.vendorSku,
    quantity: 1,
  }));

  get grossProfit(): number {
    return (
      (this.productData.salePrice || 0) -
      (this.productData.landedCost || 0) -
      (this.productData.shippingCost || 0)
    );
  }

  get grossProfitPercent(): number {
    if (!this.productData.salePrice) return 0;
    return (this.grossProfit / this.productData.salePrice) * 100;
  }

  ngOnInit(): void {
    const mode = this.route.snapshot.queryParamMap.get('type');
    if (mode === 'kit') {
      this.productType = 'kit';
    }
  }

  selectTab(tab: CreateTab): void {
    this.activeTab = tab;
  }

  trackByIndex(index: number): number {
    return index;
  }

  get mediaImageCount(): number {
    return this.mediaItems.filter((item) => item.type === 'image').length;
  }

  get mediaVideoCount(): number {
    return this.mediaItems.filter((item) => item.type === 'video').length;
  }

  addMedia(): void {
    const url = this.mediaUrlInput.trim();
    if (!url) return;
    const isVideo = /\.(mp4|mov|webm|mkv)$/i.test(url);
    const type: 'image' | 'video' = isVideo ? 'video' : 'image';
    this.mediaItems = [...this.mediaItems, { url, type }];
    this.mediaUrlInput = '';
  }

  addIdentifier(
    listKey:
      | 'internalSkus'
      | 'upcCodes'
      | 'gtinCodes'
      | 'eanCodes'
      | 'isbnCodes'
      | 'asinCodes'
      | 'fnskuCodes'
  ): void {
    this.identifierLists[listKey] = [...this.identifierLists[listKey], ''];
  }

  removeIdentifier(
    listKey:
      | 'internalSkus'
      | 'upcCodes'
      | 'gtinCodes'
      | 'eanCodes'
      | 'isbnCodes'
      | 'asinCodes'
      | 'fnskuCodes',
    index: number
  ): void {
    const next = [...this.identifierLists[listKey]];
    if (next.length <= 1) {
      next[0] = '';
    } else {
      next.splice(index, 1);
    }
    this.identifierLists[listKey] = next;
  }

  copyToClipboard(value: string): void {
    const text = value?.trim();
    if (!text) return;
    if (navigator?.clipboard?.writeText) {
      void navigator.clipboard.writeText(text).then(() => {
        this.showToast('Copied to clipboard');
      });
    } else {
      this.showToast('Copy not supported');
    }
  }

  showToast(text: string): void {
    const id = (this.toastId += 1);
    this.toastMessages = [...this.toastMessages, { id, text }];
    setTimeout(() => {
      this.toastMessages = this.toastMessages.filter((toast) => toast.id !== id);
    }, 2200);
  }

  get filteredVendors(): string[] {
    const query = this.vendorSearch.trim().toLowerCase();
    if (!query) return this.vendorOptions;
    return this.vendorOptions.filter((vendor) =>
      vendor.toLowerCase().includes(query)
    );
  }

  get filteredBrands(): string[] {
    const query = this.brandSearch.trim().toLowerCase();
    if (!query) return this.brandOptions;
    return this.brandOptions.filter((brand) =>
      brand.toLowerCase().includes(query)
    );
  }

  toggleBrandDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.brandDropdownOpen = !this.brandDropdownOpen;
    if (this.brandDropdownOpen) {
      this.brandSearch = '';
    }
  }

  selectBrand(brand: string): void {
    this.productData.brand = brand;
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

  addBrand(): void {
    const name = this.newBrandName.trim();
    if (!name) return;
    if (!this.brandOptions.includes(name)) {
      this.brandOptions = [...this.brandOptions, name];
    }
    this.productData.brand = name;
    this.closeAddBrandModal();
  }

  toggleVendorDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.vendorDropdownOpen = !this.vendorDropdownOpen;
    if (this.vendorDropdownOpen) {
      this.vendorSearch = '';
    }
  }

  selectVendor(vendor: string): void {
    this.productData.vendorName = vendor;
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

  addVendor(): void {
    const name = this.newVendorName.trim();
    if (!name) return;
    if (!this.vendorOptions.includes(name)) {
      this.vendorOptions = [...this.vendorOptions, name];
    }
    this.productData.vendorName = name;
    this.closeAddVendorModal();
  }

  @HostListener('document:click')
  closeVendorDropdown(): void {
    this.vendorDropdownOpen = false;
    this.brandDropdownOpen = false;
  }

  goBack(): void {
    window.history.back();
  }

  setProductType(type: ProductType): void {
    this.productType = type;
  }

  addKitComponent(): void {
    const candidate = mockProducts.find(
      (product) => !this.kitComponents.some((item) => item.productId === product.id)
    );
    if (!candidate) {
      return;
    }
    this.kitComponents = [
      ...this.kitComponents,
      {
        productId: candidate.id,
        name: candidate.name,
        vendorSku: candidate.vendorSku,
        quantity: 1,
      },
    ];
  }

  removeKitComponent(index: number): void {
    this.kitComponents = this.kitComponents.filter((_, rowIndex) => rowIndex !== index);
  }

  toggleMarketplace(platform: string): void {
    if (this.selectedMarketplaces.includes(platform)) {
      this.selectedMarketplaces = this.selectedMarketplaces.filter(
        (item) => item !== platform
      );
      return;
    }
    this.selectedMarketplaces = [...this.selectedMarketplaces, platform];
  }

  isMarketplaceSelected(platform: string): boolean {
    return this.selectedMarketplaces.includes(platform);
  }

  marketplaceLabel(platform: string): string {
    return platform.charAt(0).toUpperCase() + platform.slice(1);
  }

  toggleTag(tag: string): void {
    if (this.selectedTags.includes(tag)) {
      this.selectedTags = this.selectedTags.filter((item) => item !== tag);
      return;
    }
    this.selectedTags = [...this.selectedTags, tag];
  }
}
