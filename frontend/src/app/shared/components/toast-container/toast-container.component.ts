import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';
import { ToastMessage } from '../../models/notification.model';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-[60] flex flex-col gap-2.5 w-84 max-w-[calc(100vw-2rem)] pointer-events-none">
      @for (toast of notificationService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex items-start justify-between gap-3 p-4 bg-white border border-zinc-200 rounded-xl shadow-xl transition-all duration-200"
          [ngClass]="{
            'border-l-4 border-l-emerald-600': toast.type === 'success',
            'border-l-4 border-l-rose-600': toast.type === 'error',
            'border-l-4 border-l-amber-500': toast.type === 'warning',
            'border-l-4 border-l-zinc-900': toast.type === 'info'
          }"
        >
          <div class="flex items-start gap-3 min-w-0">
            <!-- Icon -->
            <div class="mt-0.5 shrink-0">
              @if (toast.type === 'success') {
                <svg class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              } @else if (toast.type === 'error') {
                <svg class="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              } @else if (toast.type === 'warning') {
                <svg class="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              } @else {
                <svg class="w-5 h-5 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            </div>

            <!-- Content -->
            <div class="min-w-0 flex-1">
              <h4 class="text-sm font-semibold text-zinc-900 leading-tight">
                {{ toast.title }}
              </h4>
              @if (toast.message) {
                <p class="mt-1 text-xs text-zinc-600 leading-normal break-words">
                  {{ toast.message }}
                </p>
              }
            </div>
          </div>

          <!-- Close Button -->
          <button
            type="button"
            (click)="notificationService.dismiss(toast.id)"
            class="shrink-0 p-1 text-zinc-400 hover:text-zinc-700 rounded-md hover:bg-zinc-100 transition-colors"
            aria-label="Cerrar notificacion"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  readonly notificationService = inject(NotificationService);
}
