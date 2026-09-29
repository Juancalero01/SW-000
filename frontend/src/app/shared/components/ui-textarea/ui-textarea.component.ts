import { Component, forwardRef, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-ui-textarea',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'block w-full',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiTextareaComponent),
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
        <textarea
          [rows]="rows()"
          [placeholder]="placeholder()"
          [value]="value()"
          [disabled]="disabled()"
          (input)="onInput($event)"
          (blur)="onTouched()"
          class="w-full bg-white text-zinc-900 border rounded-lg placeholder-zinc-400 transition-all duration-150 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 disabled:opacity-50 disabled:bg-zinc-50 resize-y font-normal"
          [ngClass]="{
            'border-rose-500 focus:ring-rose-500 focus:border-rose-500': error(),
            'border-zinc-300': !error(),
            'px-3 py-1.5 text-xs': size() === 'sm',
            'px-4 py-2.5 text-sm': size() === 'md',
            'px-4.5 py-3 text-base': size() === 'lg'
          }"
        ></textarea>
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
export class UiTextareaComponent implements ControlValueAccessor {
  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly rows = input<number>(3);
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly error = input<string | null>(null);
  readonly required = input<boolean>(false);
  readonly hint = input<string>('');
  readonly disabled = input<boolean>(false);

  readonly value = signal<string>('');

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

  setDisabledState?(isDisabled: boolean): void {
    // Disabled state handled via input
  }

  onInput(event: Event): void {
    const inputVal = (event.target as HTMLTextAreaElement).value;
    this.value.set(inputVal);
    this.onChange(inputVal);
  }
}
