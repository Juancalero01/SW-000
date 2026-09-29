import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type UiBadgeVariant = 'default' | 'dark' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';
export type UiBadgeSize = 'sm' | 'md';

@Component({
  selector: 'app-ui-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="inline-flex items-center gap-1.5 font-semibold rounded-md transition-colors select-none tracking-wide"
      [ngClass]="{
        'uppercase': uppercase(),
        'px-2 py-0.5 text-[10px]': size() === 'sm',
        'px-2.5 py-1 text-xs': size() === 'md',
        'bg-zinc-100 text-zinc-700 border border-zinc-200': variant() === 'default' || variant() === 'secondary',
        'bg-zinc-900 text-white border border-zinc-900': variant() === 'dark',
        'bg-emerald-50 text-emerald-700 border border-emerald-200': variant() === 'success',
        'bg-amber-50 text-amber-700 border border-amber-200': variant() === 'warning',
        'bg-rose-50 text-rose-700 border border-rose-200': variant() === 'danger',
        'bg-sky-50 text-sky-700 border border-sky-200': variant() === 'info'
      }"
    >
      @if (dot()) {
        <span
          class="w-1.5 h-1.5 rounded-full shrink-0"
          [ngClass]="{
            'bg-zinc-400': variant() === 'default' || variant() === 'secondary',
            'bg-white': variant() === 'dark',
            'bg-emerald-500': variant() === 'success',
            'bg-amber-500': variant() === 'warning',
            'bg-rose-500': variant() === 'danger',
            'bg-sky-500': variant() === 'info'
          }"
        ></span>
      }
      <ng-content />
    </span>
  `,
})
export class UiBadgeComponent {
  readonly variant = input<UiBadgeVariant>('default');
  readonly size = input<UiBadgeSize>('sm');
  readonly dot = input<boolean>(false);
  readonly uppercase = input<boolean>(false);
}
