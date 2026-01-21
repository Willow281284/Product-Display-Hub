import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ProductGridComponent } from '../components/product-grid/product-grid.component';

@Component({
  selector: 'app-index-page',
  standalone: true,
  imports: [ProductGridComponent],
  template: `
    <app-product-grid></app-product-grid>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndexPageComponent {}
