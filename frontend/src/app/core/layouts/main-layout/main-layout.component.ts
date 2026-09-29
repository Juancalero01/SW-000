import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ToastContainerComponent } from '../../../shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarComponent,
    ToastContainerComponent,
  ],
  template: `
    <div class="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col lg:flex-row font-sans selection:bg-zinc-900 selection:text-white">
      <!-- Mobile Top Bar for Hamburger Menu Toggle -->
      <div class="lg:hidden h-14 bg-white border-b border-zinc-200 px-4 flex items-center justify-between sticky top-0 z-20 shrink-0 shadow-2xs">
        <div class="flex items-center gap-3">
          <button
            type="button"
            (click)="toggleSidebar()"
            class="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
            aria-label="Abrir menú de navegación"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded bg-zinc-900 text-white font-bold flex items-center justify-center text-xs">
              SW
            </div>
            <span class="font-bold text-xs text-zinc-900 tracking-tight">SW-000</span>
          </div>
        </div>
      </div>

      <!-- Responsive Sidebar -->
      <app-sidebar
        [isOpen]="sidebarOpen()"
        (closeSidebar)="closeSidebar()"
      />

      <!-- Main Content Viewport -->
      <div class="flex-1 flex flex-col min-w-0 min-h-screen">
        <main class="flex-1 px-6 sm:px-10 lg:px-12 py-8 sm:py-10 max-w-[1600px] w-full mx-auto overflow-y-auto">
          <router-outlet />
        </main>
      </div>

      <!-- Global Toast Container -->
      <app-toast-container />
    </div>
  `,
})
export class MainLayoutComponent {
  readonly sidebarOpen = signal<boolean>(false);

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }
}
