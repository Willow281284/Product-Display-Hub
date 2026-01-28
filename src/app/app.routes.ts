import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/index-page.component').then(
        (m) => m.IndexPageComponent
      ),
  },
  {
    path: 'batches',
    loadComponent: () =>
      import('./pages/batch-management-page.component').then(
        (m) => m.BatchManagementPageComponent
      ),
  },
  {
    path: 'offer-analytics',
    loadComponent: () =>
      import('./pages/offer-analytics-page.component').then(
        (m) => m.OfferAnalyticsPageComponent
      ),
  },
  {
    path: 'marketplace-integrations',
    loadComponent: () =>
      import('./pages/marketplace-integrations-page.component').then(
        (m) => m.MarketplaceIntegrationsPageComponent
      ),
  },
  {
    path: 'product/new',
    loadComponent: () =>
      import('./pages/product-create-page.component').then(
        (m) => m.ProductCreatePageComponent
      ),
  },
  {
    path: 'product/:productId',
    loadComponent: () =>
      import('./pages/product-edit-page.component').then(
        (m) => m.ProductEditPageComponent
      ),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found-page.component').then(
        (m) => m.NotFoundPageComponent
      ),
  },
];
