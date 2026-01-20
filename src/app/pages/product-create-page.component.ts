import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-product-create-page',
  standalone: true,
  template: `
    <section class="mx-auto w-full max-w-6xl p-6">
      <div class="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
        <h2 class="text-2xl font-semibold">Create product</h2>
        <p class="text-muted-foreground">
          Placeholder for the product creation workflow. Move the React dialogs
          and form logic into Angular form components.
        </p>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCreatePageComponent {}
