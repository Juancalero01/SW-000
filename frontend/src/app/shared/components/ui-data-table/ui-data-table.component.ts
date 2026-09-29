import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiSkeletonComponent } from '../ui-skeleton/ui-skeleton.component';

@Component({
  selector: 'app-ui-data-table',
  standalone: true,
  imports: [CommonModule, UiSkeletonComponent],
  template: `
    <div class="w-full bg-white border border-zinc-200/90 rounded-2xl shadow-xs overflow-hidden flex flex-col">
      <!-- Table Wrapper -->
      <div class="w-full overflow-x-auto">
        <table class="w-full text-left text-sm text-zinc-900 border-collapse">
          <thead class="bg-white border-b border-zinc-200 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
            <tr>
              <ng-content select="[table-headers]" />
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100 bg-white">
            @if (loading()) {
              <tr>
                <td colspan="100%" class="p-0">
                  <app-ui-skeleton variant="table-row" [count]="5" />
                </td>
              </tr>
            } @else {
              <ng-content select="[table-rows]" />
            }
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      @if (!loading() && totalItems() === 0) {
        <div class="flex flex-col items-center justify-center p-12 text-center bg-white">
          <div class="p-3 bg-zinc-100 rounded-full text-zinc-400 mb-3">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h4 class="text-sm font-semibold text-zinc-900 leading-tight">
            {{ emptyTitle() }}
          </h4>
          <p class="mt-1 text-xs text-zinc-500 max-w-sm">
            {{ emptyMessage() }}
          </p>
        </div>
      }

      <!-- Enhanced Pagination Footer Bar (Only shown when totalPages > 1) -->
      @if (showPagination() && totalPages() > 1) {
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-3.5 bg-white border-t border-zinc-200/80 text-xs font-medium text-zinc-600">
          <!-- Items Summary & Page Size Selector -->
          <div class="flex flex-wrap items-center gap-3">
            <span>
              Mostrando <span class="font-semibold text-zinc-900">{{ startItemIndex() }}</span> a <span class="font-semibold text-zinc-900">{{ endItemIndex() }}</span> de <span class="font-semibold text-zinc-900">{{ totalItems() }}</span> resultados
            </span>

            @if (showPageSizeSelector()) {
              <div class="flex items-center gap-1.5 ml-2 border-l border-zinc-200 pl-3">
                <span class="text-zinc-500">Mostrar</span>
                <select
                  [value]="pageSize()"
                  (change)="onPageSizeSelect($event)"
                  class="px-2 py-1 text-xs bg-white border border-zinc-300 rounded-md font-semibold text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 cursor-pointer"
                >
                  @for (opt of pageSizeOptions(); track opt) {
                    <option [value]="opt">{{ opt }}</option>
                  }
                </select>
                <span class="text-zinc-500">por pág.</span>
              </div>
            }
          </div>

          <!-- Numbered Page Navigation Buttons -->
          <div class="flex items-center gap-1">
            <!-- Previous Button -->
            <button
              type="button"
              [disabled]="page() <= 1"
              (click)="onPage(page() - 1)"
              class="inline-flex items-center justify-center p-1.5 text-zinc-600 bg-white border border-zinc-300 rounded-md hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Página anterior"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>

            <!-- Page Number Buttons -->
            @for (pNum of visiblePageNumbers(); track pNum) {
              @if (pNum === -1) {
                <span class="px-2 py-1 text-zinc-400">...</span>
              } @else {
                <button
                  type="button"
                  (click)="onPage(pNum)"
                  class="min-w-[32px] h-8 px-2.5 text-xs font-semibold rounded-md transition-colors cursor-pointer"
                  [ngClass]="{
                    'bg-zinc-900 text-white shadow-xs': pNum === page(),
                    'bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-100': pNum !== page()
                  }"
                >
                  {{ pNum }}
                </button>
              }
            }

            <!-- Next Button -->
            <button
              type="button"
              [disabled]="page() >= totalPages()"
              (click)="onPage(page() + 1)"
              class="inline-flex items-center justify-center p-1.5 text-zinc-600 bg-white border border-zinc-300 rounded-md hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Página siguiente"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class UiDataTableComponent {
  readonly loading = input<boolean>(false);
  readonly emptyTitle = input<string>('No se encontraron registros');
  readonly emptyMessage = input<string>('Intenta ajustar los filtros de búsqueda');
  readonly page = input<number>(1);
  readonly pageSize = input<number>(10);
  readonly totalPages = input<number>(1);
  readonly totalItems = input<number>(0);
  readonly showPagination = input<boolean>(true);
  readonly showPageSizeSelector = input<boolean>(true);
  readonly pageSizeOptions = input<number[]>([10, 25, 50, 100]);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  readonly startItemIndex = computed(() => {
    if (this.totalItems() === 0) return 0;
    return (this.page() - 1) * this.pageSize() + 1;
  });

  readonly endItemIndex = computed(() => {
    return Math.min(this.page() * this.pageSize(), this.totalItems());
  });

  readonly visiblePageNumbers = computed<number[]>(() => {
    const total = this.totalPages();
    const current = this.page();

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: number[] = [];
    pages.push(1);

    if (current > 3) {
      pages.push(-1);
    }

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - 2) {
      pages.push(-1);
    }

    pages.push(total);

    return pages;
  });

  onPage(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalPages() && newPage !== this.page()) {
      this.pageChange.emit(newPage);
    }
  }

  onPageSizeSelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newSize = parseInt(select.value, 10);
    if (!isNaN(newSize)) {
      this.pageSizeChange.emit(newSize);
    }
  }
}
