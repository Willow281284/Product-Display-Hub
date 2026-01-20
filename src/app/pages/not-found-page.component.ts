import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="mx-auto w-full max-w-6xl p-6">
      <div
        class="flex flex-col items-start gap-4 rounded-lg border border-border bg-card p-6"
      >
        <h2 class="text-2xl font-semibold">Page not found</h2>
        <p class="text-muted-foreground">
          The page you are looking for does not exist in the new Angular shell.
        </p>
        <a
          routerLink="/"
          class="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          Back to products
        </a>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPageComponent {}
