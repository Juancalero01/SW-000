import { Component, HostListener, computed, effect, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type UiPopoverPlacement = 'bottom-end' | 'bottom-start' | 'top-end' | 'top-start';

@Component({
  selector: 'app-ui-popover',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isRendered()) {
      <!-- Transparent backdrop for closing popover when clicking outside -->
      @if (closeOnClickOutside()) {
        <div
          class="fixed inset-0 z-30"
          (click)="onBackdropClick($event)"
        ></div>
      }

      <!-- Floating Popover Card with GPU-accelerated entrance and exit animation -->
      <div
        class="absolute z-40 bg-white border border-zinc-200/90 rounded-xl shadow-xl p-4 text-zinc-900 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] transform max-h-[85vh] overflow-y-auto"
        [ngClass]="cardClasses()"
        (click)="$event.stopPropagation()"
      >
        <!-- Header (Optional) -->
        @if (title()) {
          <div class="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100">
            <h4 class="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
              {{ title() }}
            </h4>
            <button
              type="button"
              (click)="close()"
              class="text-zinc-400 hover:text-zinc-600 p-0.5 rounded-md hover:bg-zinc-100 transition-colors"
              aria-label="Cerrar popover"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        }

        <!-- Popover Body Slot -->
        <ng-content />
      </div>
    }
  `,
})
export class UiPopoverComponent {
  readonly isOpen = input<boolean>(false);
  readonly title = input<string>('');
  readonly placement = input<UiPopoverPlacement>('bottom-end');
  readonly width = input<string>('w-[calc(100vw-2.5rem)] max-w-sm sm:w-96');
  readonly closeOnClickOutside = input<boolean>(true);

  readonly closed = output<void>();

  // Internal animation state signals
  readonly isRendered = signal<boolean>(false);
  readonly isAnimated = signal<boolean>(false);

  private animationTimeout: any;

  constructor() {
    effect(() => {
      const open = this.isOpen();
      if (this.animationTimeout) {
        clearTimeout(this.animationTimeout);
      }

      if (open) {
        this.isRendered.set(true);
        // Trigger CSS entry animation on next frame
        this.animationTimeout = setTimeout(() => {
          this.isAnimated.set(true);
        }, 15);
      } else {
        this.isAnimated.set(false);
        // Wait for exit transition duration (200ms) before unmounting
        this.animationTimeout = setTimeout(() => {
          this.isRendered.set(false);
        }, 200);
      }
    });
  }

  readonly cardClasses = computed(() => {
    const active = this.isAnimated();
    const p = this.placement();

    let placementClass = 'left-0 sm:left-auto sm:right-0 top-full mt-2 origin-top-left sm:origin-top-right';
    if (p === 'bottom-start') placementClass = 'left-0 top-full mt-2 origin-top-left';
    if (p === 'top-end') placementClass = 'left-0 sm:left-auto sm:right-0 bottom-full mb-2 origin-bottom-left sm:origin-bottom-right';
    if (p === 'top-start') placementClass = 'left-0 bottom-full mb-2 origin-bottom-left';

    return [
      this.width(),
      placementClass,
      active
        ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
        : 'opacity-0 scale-95 -translate-y-1 pointer-events-none',
    ];
  });

  @HostListener('window:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) {
      this.close();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    event.stopPropagation();
    if (this.closeOnClickOutside()) {
      this.close();
    }
  }

  close(): void {
    this.closed.emit();
  }
}
