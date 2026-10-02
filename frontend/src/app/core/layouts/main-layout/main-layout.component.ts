import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { ToastModule } from 'primeng/toast';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    ButtonModule,
    AvatarModule,
    ToastModule,
    SidebarComponent,
  ],
  template: `
    <div class="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col lg:flex-row font-sans selection:bg-zinc-900 selection:text-white">
      <!-- Mobile Top Bar for Hamburger Menu Toggle -->
      <div class="lg:hidden h-14 bg-white border-b border-zinc-200 px-4 flex items-center justify-between sticky top-0 z-20 shrink-0 shadow-2xs">
        <div class="flex items-center gap-3">
          <p-button
            icon="pi pi-bars"
            severity="secondary"
            variant="text"
            [rounded]="true"
            size="small"
            (onClick)="toggleSidebar()"
            aria-label="Abrir menú de navegación"
          />
          <div class="flex items-center gap-2">
            <p-avatar
              label="SW"
              shape="square"
              class="bg-zinc-900 text-white font-bold text-xs shadow-2xs"
            />
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

      <!-- PrimeNG Global Toast Container -->
      <p-toast position="top-right" />
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
