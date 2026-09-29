import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'card' | 'table-row';

@Component({
  selector: 'app-ui-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full space-y-2">
      @for (item of items(); track $index) {
        @switch (variant()) {
          @case ('text') {
            <div
              class="animate-pulse bg-zinc-200/80 rounded-md"
              [style.width]="width() || '100%'"
              [style.height]="height() || '1rem'"
              [ngClass]="className()"
            ></div>
          }
          @case ('circular') {
            <div
              class="animate-pulse bg-zinc-200/80 rounded-full shrink-0"
              [style.width]="width() || '2.5rem'"
              [style.height]="height() || '2.5rem'"
              [ngClass]="className()"
            ></div>
          }
          @case ('rectangular') {
            <div
              class="animate-pulse bg-zinc-200/80 rounded-lg"
              [style.width]="width() || '100%'"
              [style.height]="height() || '2.5rem'"
              [ngClass]="className()"
            ></div>
          }
          @case ('card') {
            <div
              class="p-4 bg-white border border-zinc-200 rounded-xl shadow-2xs space-y-3"
              [ngClass]="className()"
            >
              <div class="animate-pulse bg-zinc-200/80 rounded-md h-5 w-1/3"></div>
              <div class="animate-pulse bg-zinc-200/80 rounded-md h-4 w-full"></div>
              <div class="animate-pulse bg-zinc-200/80 rounded-md h-4 w-4/5"></div>
            </div>
          }
          @case ('table-row') {
            <div
              class="flex items-center gap-4 py-3 px-4 bg-white border-b border-zinc-100 animate-pulse"
              [ngClass]="className()"
            >
              <div class="h-4 bg-zinc-200/80 rounded-md w-12"></div>
              <div class="h-4 bg-zinc-200/80 rounded-md flex-1"></div>
              <div class="h-4 bg-zinc-200/80 rounded-md w-1/4"></div>
              <div class="h-4 bg-zinc-200/80 rounded-md w-20"></div>
            </div>
          }
        }
      }
    </div>
  `,
})
export class UiSkeletonComponent {
  readonly variant = input<SkeletonVariant>('text');
  readonly width = input<string>('');
  readonly height = input<string>('');
  readonly count = input<number>(1);
  readonly className = input<string>('');

  readonly items = computed(() => {
    const c = Math.max(1, this.count());
    return Array.from({ length: c }, (_, i) => i);
  });
}
