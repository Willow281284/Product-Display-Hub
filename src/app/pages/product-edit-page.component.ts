import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

@Component({
  selector: 'app-product-edit-page',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    <section class="mx-auto w-full max-w-6xl p-6">
      <div class="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
        <h2 class="text-2xl font-semibold">Edit product</h2>
        <p class="text-muted-foreground">
          Product ID:
          <span class="font-medium text-foreground">
            {{ productId$ | async }}
          </span>
        </p>
        <p class="text-muted-foreground">
          Port the ProductEdit flow, including tabs, pricing, and inventory
          sections, into Angular components.
        </p>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductEditPageComponent {
  private readonly route = inject(ActivatedRoute);

  readonly productId$ = this.route.paramMap.pipe(
    map((params) => params.get('productId') ?? 'unknown')
  );
}
