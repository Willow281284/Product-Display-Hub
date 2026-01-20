import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-batch-management-page',
  standalone: true,
  template: `
    <section class="mx-auto w-full max-w-6xl p-6">
      <div class="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
        <h2 class="text-2xl font-semibold">Batch management</h2>
        <p class="text-muted-foreground">
          Placeholder page for batch workflows. Migrate BatchProgressDialog and
          related batch components into Angular services and dialogs.
        </p>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BatchManagementPageComponent {}
