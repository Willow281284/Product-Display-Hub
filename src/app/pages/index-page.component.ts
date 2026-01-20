import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-index-page',
  standalone: true,
  template: `
    <section class="mx-auto w-full max-w-6xl p-6">
      <div class="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
        <h2 class="text-2xl font-semibold">Products</h2>
        <p class="text-muted-foreground">
          This is the Angular shell for the former React Product Grid. Port the
          product table, filters, and dialogs into dedicated Angular components.
        </p>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="rounded-md border border-dashed border-border p-4">
            <p class="font-medium">Inventory management</p>
            <p class="text-sm text-muted-foreground">
              Migrate ProductGrid, FilterBar, and ProductTable from React.
            </p>
          </div>
          <div class="rounded-md border border-dashed border-border p-4">
            <p class="font-medium">Offers</p>
            <p class="text-sm text-muted-foreground">
              Bring over offer creation and bulk listing flows.
            </p>
          </div>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndexPageComponent {}
