import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-button',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'block w-full',
  },
  template: `
    <button
      [type]="type()"
      [attr.form]="form() || null"
      [disabled]="disabled() || loading()"
      (click)="onClick($event)"
      class="inline-flex items-center justify-center font-semibold rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-offset-1 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer"
      [ngClass]="{
        'w-full': fullWidth(),
        'bg-zinc-900 !text-white hover:bg-zinc-800 focus:ring-zinc-900 border-transparent shadow-xs': variant() === 'primary',
        'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 focus:ring-zinc-400 border-transparent': variant() === 'secondary',
        'bg-white text-zinc-900 border-zinc-300 hover:bg-zinc-50 focus:ring-zinc-900 shadow-2xs': variant() === 'outline',
        'bg-white text-zinc-900 hover:bg-zinc-100 focus:ring-zinc-900 border-transparent shadow-xs': variant() === 'white',
        'bg-rose-600 !text-white hover:bg-rose-700 focus:ring-rose-600 border-transparent shadow-xs': variant() === 'danger',
        'bg-transparent text-zinc-700 hover:bg-zinc-100 focus:ring-zinc-400 border-transparent': variant() === 'ghost',
        'px-3.5 py-1.5 text-xs min-h-[36px] gap-1.5': size() === 'sm',
        'px-5 py-2.5 text-sm font-semibold min-h-[44px] gap-2': size() === 'md',
        'px-6 py-3 text-base font-semibold min-h-[48px] gap-2.5': size() === 'lg'
      }"
    >
      @if (loading()) {
        <svg class="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      }
      <span [ngClass]="{ '!text-white': variant() === 'primary' || variant() === 'danger' }" class="inline-flex items-center gap-1.5">
        <ng-content />
      </span>
    </button>
  `,
})
export class UiButtonComponent {
  readonly variant = input<'primary' | 'secondary' | 'outline' | 'white' | 'danger' | 'ghost'>('primary');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly loading = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly fullWidth = input<boolean>(false);
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly form = input<string | undefined>(undefined);

  readonly btnClick = output<MouseEvent>();
  readonly clicked = output<MouseEvent>();

  onClick(event: MouseEvent): void {
    if (!this.disabled() && !this.loading()) {
      this.btnClick.emit(event);
      this.clicked.emit(event);
    }
  }
}
