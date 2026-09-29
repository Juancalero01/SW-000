import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiModalComponent } from '../ui-modal/ui-modal.component';

@Component({
  selector: 'app-ui-confirm-dialog',
  standalone: true,
  imports: [CommonModule, UiModalComponent],
  template: `
    <app-ui-modal
      [isOpen]="isOpen()"
      variant="centered"
      size="sm"
      [title]="title()"
      [closeOnBackdrop]="!loading()"
      (closed)="onCancel()"
    >
      <p class="text-sm text-zinc-600 leading-relaxed">
        {{ message() }}
      </p>

      <div modal-footer class="grid grid-cols-2 gap-3 w-full">
        <button
          type="button"
          [disabled]="loading()"
          (click)="onCancel()"
          class="w-full px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 disabled:opacity-50 transition-colors cursor-pointer"
        >
          {{ cancelText() }}
        </button>
        <button
          type="button"
          [disabled]="loading()"
          (click)="onConfirm()"
          [ngClass]="{
            'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-600': isDanger(),
            'bg-zinc-900 text-white hover:bg-zinc-800 focus:ring-zinc-900': !isDanger()
          }"
          class="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
        >
          @if (loading()) {
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          }
          {{ confirmText() }}
        </button>
      </div>
    </app-ui-modal>
  `,
})
export class UiConfirmDialogComponent {
  readonly isOpen = input<boolean>(false);
  readonly title = input<string>('Confirmar accion');
  readonly message = input<string>('¿Esta seguro de realizar esta accion?');
  readonly confirmText = input<string>('Confirmar');
  readonly cancelText = input<string>('Cancelar');
  readonly isDanger = input<boolean>(false);
  readonly loading = input<boolean>(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
