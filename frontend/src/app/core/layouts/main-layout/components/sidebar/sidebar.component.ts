import { Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../../../services/auth.service';
import { AbilityService } from '../../../../services/ability.service';

interface NavItem {
  label: string;
  route: string;
  subject: string;
  iconSvg: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  host: {
    class: 'block shrink-0',
  },
  template: `
    <!-- Mobile overlay backdrop -->
    @if (isOpen()) {
      <div
        (click)="closeSidebar.emit()"
        class="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs z-30 lg:hidden"
      ></div>
    }

    <!-- Sidebar container -->
    <aside
      class="fixed top-0 bottom-0 left-0 z-30 w-64 h-full bg-white border-r border-zinc-200 flex flex-col transition-transform duration-200 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 shrink-0"
      [ngClass]="{
        'translate-x-0': isOpen(),
        '-translate-x-full lg:translate-x-0': !isOpen()
      }"
    >
      <!-- Brand Header -->
      <div class="h-16 px-6 border-b border-zinc-200 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-zinc-900 text-white font-bold flex items-center justify-center text-sm shadow-xs">
            SW
          </div>
          <div>
            <span class="font-bold text-sm text-zinc-900 tracking-tight block">SW-000</span>
            <span class="text-[10px] uppercase text-zinc-400 font-medium tracking-wider block">Enterprise Platform</span>
          </div>
        </div>

        <!-- Mobile close button -->
        <button
          type="button"
          (click)="closeSidebar.emit()"
          class="lg:hidden text-zinc-400 hover:text-zinc-600 p-1 rounded-md transition-colors"
          aria-label="Cerrar menú"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Dynamic Navigation Items List -->
      <div class="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        @for (item of filteredNavItems(); track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="!bg-zinc-900 !text-white font-semibold hover:!bg-zinc-800 hover:!text-white"
            [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
            (click)="closeSidebar.emit()"
            class="flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-zinc-600 rounded-lg hover:bg-zinc-100 hover:text-zinc-900 transition-colors group"
          >
            <svg
              class="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-[.text-white]:!text-white group-[.bg-zinc-900]:!text-white transition-colors shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              [innerHTML]="getSafeSvg(item.iconSvg)"
            ></svg>
            <span class="truncate">{{ item.label }}</span>
          </a>
        }
      </div>

      <!-- Bottom User Profile Card & Logout Button -->
      <div class="p-4 border-t border-zinc-200 bg-zinc-50/70 shrink-0">
        @if (user(); as currentUser) {
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-full bg-zinc-900 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                {{ getUserInitials(currentUser.fullName || currentUser.email) }}
              </div>
              <div class="flex flex-col min-w-0">
                <span class="text-xs font-semibold text-zinc-900 truncate leading-tight">
                  {{ currentUser.fullName || currentUser.email }}
                </span>
                <span class="text-[10px] text-zinc-500 font-medium capitalize truncate">
                  {{ currentUser.roles?.[0]?.name || 'Usuario' }}
                </span>
              </div>
            </div>

            <!-- Logout Button -->
            <button
              type="button"
              (click)="onLogout()"
              class="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/60 rounded-md transition-colors shrink-0"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
            </button>
          </div>
        }
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  private readonly authService = inject(AuthService);
  private readonly abilityService = inject(AbilityService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly isOpen = input<boolean>(false);
  readonly closeSidebar = output<void>();
  readonly user = this.authService.currentUser;

  getSafeSvg(svgContent: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svgContent);
  }

  getUserInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  onLogout(): void {
    this.authService.logout();
  }

  readonly allNavItems: NavItem[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      subject: 'Dashboard',
      iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>',
    },
    {
      label: 'Usuarios',
      route: '/users',
      subject: 'User',
      iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>',
    },
    {
      label: 'Roles y Permisos',
      route: '/roles',
      subject: 'Role',
      iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>',
    },
    {
      label: 'Flujos de Trabajo',
      route: '/workflow-engine',
      subject: 'WorkflowTransition',
      iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>',
    },
    {
      label: 'Auditoría',
      route: '/audit-logs',
      subject: 'AuditLog',
      iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>',
    },
  ];

  readonly filteredNavItems = computed<NavItem[]>(() => {
    return this.allNavItems.filter((item) => this.abilityService.can('read', item.subject));
  });
}
