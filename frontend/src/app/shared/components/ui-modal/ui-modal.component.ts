import {
  Component,
  HostListener,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type UiModalVariant = 'slide-over' | 'centered';
export type UiModalSide = 'left' | 'right';
export type UiModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'half' | 'full';

@Component({
  selector: 'app-ui-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isRendered()) {
      <div
        class="fixed inset-0 z-50 bg-zinc-950/50 backdrop-blur-xs transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        [ngClass]="containerClasses()"
        (click)="onBackdropClick($event)"
      >
        <div
          class="relative w-full bg-white shadow-2xl flex flex-col overflow-hidden text-zinc-900 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] transform"
          [ngClass]="panelClasses()"
          (click)="$event.stopPropagation()"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
            <div>
              <h3 class="text-base font-semibold text-zinc-900 leading-tight">
                {{ title() }}
              </h3>
              @if (subtitle()) {
                <p class="mt-0.5 text-xs text-zinc-500">
                  {{ subtitle() }}
                </p>
              }
            </div>
            @if (shouldShowCloseButton()) {
              <button
                type="button"
                (click)="close()"
                class="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-200/50 transition-colors"
                aria-label="Cerrar dialogo"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            }
          </div>

          <!-- Body -->
          <div class="flex-1 p-6 overflow-y-auto">
            <ng-content />
          </div>

          <!-- Footer (optional) -->
          <div class="px-6 py-4 bg-zinc-50/50 border-t border-zinc-100 flex items-center justify-end gap-3 shrink-0 [&:not(:has([modal-footer]))]:hidden">
            <ng-content select="[modal-footer]" />
          </div>
        </div>
      </div>
    }
  `,
})
export class UiModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly variant = input<UiModalVariant>('slide-over');
  readonly side = input<UiModalSide>('right');
  readonly size = input<UiModalSize>('md');
  readonly title = input<string>('');
  readonly subtitle = input<string>('');
  readonly closeOnBackdrop = input<boolean>(true);
  readonly closeOnEscape = input<boolean>(true);
  readonly showCloseButton = input<boolean>(true);
  readonly blocking = input<boolean>(false);

  readonly closed = output<void>();
  readonly closeModal = output<void>();

  // Internal animation state signals
  readonly isRendered = signal<boolean>(false);
  readonly isAnimated = signal<boolean>(false);

  readonly canCloseOnBackdrop = computed(() => !this.blocking() && this.closeOnBackdrop());
  readonly canCloseOnEscape = computed(() => !this.blocking() && this.closeOnEscape());
  readonly shouldShowCloseButton = computed(() => !this.blocking() && this.showCloseButton());

  private animationTimeout: any;

  constructor() {
    effect(() => {
      const open = this.isOpen();
      if (this.animationTimeout) {
        clearTimeout(this.animationTimeout);
      }

      if (open) {
        this.isRendered.set(true);
        // Trigger CSS entry transition on next microtask frame
        this.animationTimeout = setTimeout(() => {
          this.isAnimated.set(true);
        }, 20);
      } else {
        this.isAnimated.set(false);
        // Wait for exit transition duration (300ms) before unmounting from DOM
        this.animationTimeout = setTimeout(() => {
          this.isRendered.set(false);
        }, 300);
      }
    });
  }

  readonly containerClasses = computed(() => {
    const isSlideOver = this.variant() === 'slide-over';
    const isLeft = this.side() === 'left';
    const active = this.isAnimated();

    if (isSlideOver) {
      return {
        'flex overflow-hidden': true,
        'justify-start': isLeft,
        'justify-end': !isLeft,
        'opacity-100 pointer-events-auto': active,
        'opacity-0 pointer-events-none': !active,
      };
    }

    return {
      'flex items-center justify-center p-4 sm:p-6 overflow-y-auto': true,
      'opacity-100 pointer-events-auto': active,
      'opacity-0 pointer-events-none': !active,
    };
  });

  readonly panelClasses = computed(() => {
    const isSlideOver = this.variant() === 'slide-over';
    const isLeft = this.side() === 'left';
    const s = this.size();
    const active = this.isAnimated();

    if (isSlideOver) {
      return {
        'h-full border-zinc-200/80': true,
        'border-r': isLeft,
        'border-l': !isLeft,
        'max-w-md': s === 'sm',
        'max-w-lg': s === 'md',
        'max-w-2xl': s === 'lg',
        'max-w-4xl': s === 'xl',
        'w-full sm:w-1/2 max-w-none': s === 'half',
        'w-full max-w-none': s === 'full',

        /* Hardware Accelerated Slide Animation */
        'translate-x-0': active,
        '-translate-x-full': !active && isLeft,
        'translate-x-full': !active && !isLeft,
      };
    }

    return {
      'border border-zinc-200/80 rounded-2xl max-h-[90vh]': true,
      'max-w-md': s === 'sm',
      'max-w-xl': s === 'md',
      'max-w-3xl': s === 'lg',
      'max-w-5xl': s === 'xl',
      'max-w-4xl': s === 'half',
      'max-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)]': s === 'full',

      /* Hardware Accelerated Scale & Fade Animation */
      'scale-100 opacity-100': active,
      'scale-95 opacity-0': !active,
    };
  });

  @HostListener('window:keydown.escape')
  onEscape(): void {
    if (this.isOpen() && this.canCloseOnEscape()) {
      this.close();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (this.canCloseOnBackdrop()) {
      this.close();
    }
  }

  close(): void {
    if (this.blocking()) return;
    this.closed.emit();
    this.closeModal.emit();
  }
}
