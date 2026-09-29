import { Component, forwardRef, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  label: string;
  value: any;
}

@Component({
  selector: 'app-ui-select',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'block w-full',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiSelectComponent),
      multi: true,
    },
  ],
  template: `
    <div class="flex flex-col gap-2 w-full">
      @if (label()) {
        <label class="text-sm font-medium text-zinc-800 tracking-wide">
          {{ label() }}
          @if (required()) {
            <span class="text-rose-600 font-bold ml-0.5">*</span>
          }
        </label>
      }

      <div class="relative flex items-center w-full">
        <select
          [value]="value()"
          [disabled]="disabled() || isDisabledSignal()"
          (change)="onChangeSelect($event)"
          (blur)="onTouched()"
          class="w-full bg-white text-zinc-900 border rounded-lg transition-all duration-150 appearance-none focus:outline-hidden focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 disabled:opacity-50 disabled:bg-zinc-50 pr-10 font-normal"
          [ngClass]="{
            'border-rose-500 focus:ring-rose-500 focus:border-rose-500': error(),
            'border-zinc-300': !error(),
            'px-3 py-1.5 text-xs min-h-[36px]': size() === 'sm',
            'px-4 py-2.5 text-sm min-h-[44px]': size() === 'md',
            'px-4.5 py-3 text-base min-h-[48px]': size() === 'lg'
          }"
        >
          @if (placeholder()) {
            <option value="" disabled [selected]="!value()">
              {{ placeholder() }}
            </option>
          }
          @for (opt of options(); track opt.value) {
            <option [value]="opt.value" [selected]="opt.value === value()">
              {{ opt.label }}
            </option>
          }
        </select>

        <div class="absolute right-3.5 pointer-events-none text-zinc-400">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      @if (error()) {
        <p class="text-xs text-rose-600 font-medium">
          {{ error() }}
        </p>
      }
    </div>
  `,
})
export class UiSelectComponent implements ControlValueAccessor {
  readonly label = input<string>('');
  readonly placeholder = input<string>('Seleccionar opcion...');
  readonly options = input<SelectOption[]>([]);
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly error = input<string | null>(null);
  readonly required = input<boolean>(false);
  readonly disabled = input<boolean>(false);

  readonly value = signal<any>('');
  readonly isDisabledSignal = signal<boolean>(false);

  onChange: (val: any) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(val: any): void {
    this.value.set(val !== null && val !== undefined ? val : '');
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabledSignal.set(isDisabled);
  }

  onChangeSelect(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.value.set(val);
    this.onChange(val);
  }
}
