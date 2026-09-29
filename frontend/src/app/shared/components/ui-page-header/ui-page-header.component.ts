import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiButtonComponent } from '../ui-button/ui-button.component';
import { UiPopoverComponent } from '../ui-popover/ui-popover.component';

@Component({
  selector: 'app-ui-page-header',
  standalone: true,
  imports: [CommonModule, UiButtonComponent, UiPopoverComponent],
  template: `
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-2 pb-2 sm:pb-3">
      <!-- Title & Subtitle Section -->
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
          {{ title() }}
        </h1>
        @if (subtitle()) {
          <p class="text-xs sm:text-sm text-zinc-500 mt-1">
            {{ subtitle() }}
          </p>
        }
      </div>

      <!-- Header Action Buttons -->
      <div class="flex items-center gap-2.5 shrink-0 relative">
        <!-- Optional Extra Action Projection Slot -->
        <ng-content select="[extra-actions]" />

        <!-- Filter Toggle Button & Standalone Popover -->
        @if (showFilterButton()) {
          <div class="relative inline-block text-left">
            <app-ui-button
              variant="white"
              (clicked)="toggleFilterPopover($event)"
            >
              <svg class="w-4 h-4 mr-2 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
              </svg>
              {{ filterButtonText() }}
              @if (activeFilterCount() > 0) {
                <span class="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-zinc-900 text-white rounded-full leading-none">
                  {{ activeFilterCount() }}
                </span>
              }
            </app-ui-button>

            <!-- Shared Popover Component Container -->
            <app-ui-popover
              [isOpen]="isFilterOpen()"
              title="Filtros Avanzados"
              placement="bottom-end"
              (closed)="closeFilterPopover()"
            >
              <ng-content select="[filter-content]" />
            </app-ui-popover>
          </div>
        }

        <!-- Primary Entity Create Button -->
        @if (createButtonText() && canCreate()) {
          <app-ui-button
            variant="primary"
            (clicked)="createClicked.emit()"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            {{ createButtonText() }}
          </app-ui-button>
        }
      </div>
    </div>
  `,
})
export class UiPageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly createButtonText = input<string>('');
  readonly canCreate = input<boolean>(true);
  readonly showFilterButton = input<boolean>(true);
  readonly filterButtonText = input<string>('Filtros');
  readonly activeFilterCount = input<number>(0);

  readonly createClicked = output<void>();
  readonly filterClicked = output<void>();

  readonly isFilterOpen = signal<boolean>(false);

  toggleFilterPopover(event: MouseEvent): void {
    event.stopPropagation();
    this.isFilterOpen.update((open) => !open);
    this.filterClicked.emit();
  }

  closeFilterPopover(): void {
    this.isFilterOpen.set(false);
  }

  openFilterPopover(): void {
    this.isFilterOpen.set(true);
  }
}
