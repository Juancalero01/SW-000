import { Component, computed, forwardRef, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-ui-input',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'block w-full',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiInputComponent),
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
        <input
          [type]="currentType()"
          [placeholder]="placeholder()"
          [value]="value()"
          [disabled]="disabled() || isDisabledSignal()"
          [readOnly]="readonly()"
          [attr.maxlength]="maxlength() ?? null"
          (input)="onInput($event)"
          (blur)="onTouched()"
          class="w-full bg-white text-zinc-900 border rounded-lg placeholder-zinc-400 transition-all duration-150 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 disabled:opacity-50 disabled:bg-zinc-50 readonly:bg-zinc-50 readonly:text-zinc-500 readonly:cursor-not-allowed font-normal"
          [ngClass]="{
            'border-rose-500 focus:ring-rose-500 focus:border-rose-500': error(),
            'border-zinc-300': !error(),
            'px-3 py-1.5 text-xs min-h-[36px]': size() === 'sm',
            'px-4 py-2.5 text-sm min-h-[44px]': size() === 'md',
            'px-4.5 py-3 text-base min-h-[48px]': size() === 'lg',
            'pr-10': type() === 'password'
          }"
        />

        @if (type() === 'password') {
          <button
            type="button"
            (click)="togglePasswordVisibility()"
            class="absolute right-3.5 text-zinc-400 hover:text-zinc-700 focus:outline-hidden p-1 rounded-md transition-colors"
            aria-label="Mostrar u ocultar contrasena"
          >
            @if (showPassword()) {
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.05 10.05 0 013.7.763c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m-6.165-4.432a3 3 0 11-4.243-4.243m4.243 4.243L3 3l18 18" />
              </svg>
            } @else {
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            }
          </button>
        }
      </div>

      @if (error()) {
        <p class="text-xs text-rose-600 font-medium">
          {{ error() }}
        </p>
      } @else if (hint()) {
        <p class="text-xs text-zinc-500">
          {{ hint() }}
        </p>
      }
    </div>
  `,
})
export class UiInputComponent implements ControlValueAccessor {
  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly type = input<string>('text');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly error = input<string | null>(null);
  readonly required = input<boolean>(false);
  readonly hint = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly readonly = input<boolean>(false);
  readonly maxlength = input<number | undefined>(undefined);

  readonly value = signal<string>('');
  readonly showPassword = signal<boolean>(false);
  readonly isDisabledSignal = signal<boolean>(false);

  readonly currentType = computed(() => {
    if (this.type() === 'password') {
      return this.showPassword() ? 'text' : 'password';
    }
    return this.type();
  });

  onChange: (val: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(val: any): void {
    this.value.set(val !== null && val !== undefined ? String(val) : '');
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

  onInput(event: Event): void {
    const inputVal = (event.target as HTMLInputElement).value;
    this.value.set(inputVal);
    this.onChange(inputVal);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((show) => !show);
  }
}
