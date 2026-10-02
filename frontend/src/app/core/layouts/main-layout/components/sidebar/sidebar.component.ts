import { Component, OnInit, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DrawerModule } from 'primeng/drawer';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Ripple } from 'primeng/ripple';
import { AuthService } from '../../../../services/auth.service';
import { AbilityService } from '../../../../services/ability.service';
import { ModulesService } from '../../../../services/modules.service';

interface NavItem {
  label: string;
  route: string;
  subject: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    DrawerModule,
    AvatarModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    Ripple,
  ],
  host: {
    class: 'block shrink-0',
  },
  template: `
    <!-- Mobile Drawer (PrimeNG p-drawer, formerly p-sidebar) -->
    <p-drawer
      [visible]="isOpen()"
      (visibleChange)="onDrawerVisibleChange($event)"
      position="left"
      [modal]="true"
      [dismissible]="true"
      [closeOnEscape]="true"
      [appendTo]="'self'"
      styleClass="!w-64 !p-0 lg:!hidden"
    >
      <ng-template #headless>
        <div class="w-64 h-full bg-white flex flex-col">
          <ng-container *ngTemplateOutlet="sidebarContent; context: { isMobile: true }" />
        </div>
      </ng-template>
    </p-drawer>

    <!-- Desktop Persistent Sidebar -->
    <aside class="hidden lg:flex lg:sticky lg:top-0 lg:h-screen w-64 border-r border-zinc-200 bg-white flex-col shrink-0">
      <ng-container *ngTemplateOutlet="sidebarContent; context: { isMobile: false }" />
    </aside>

    <!-- Shared Navigation Content Template -->
    <ng-template #sidebarContent let-isMobile="isMobile">
      <!-- Brand Header -->
      <div class="h-16 px-6 border-b border-zinc-200 flex items-center justify-between shrink-0">
        <div>
          <span class="font-bold text-sm text-zinc-900 tracking-tight block">SW-000</span>
          <span class="text-[10px] uppercase text-zinc-400 font-medium tracking-wider block">Enterprise Platform</span>
        </div>

        @if (isMobile) {
          <!-- Mobile close button -->
          <p-button
            icon="pi pi-times"
            severity="secondary"
            variant="text"
            [rounded]="true"
            size="small"
            (onClick)="closeSidebar.emit()"
            aria-label="Cerrar menú"
          />
        }
      </div>

      <!-- Dynamic Navigation Items List -->
      <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        @for (item of filteredNavItems(); track item.route) {
          <a
            pRipple
            [routerLink]="item.route"
            routerLinkActive="!bg-zinc-900 !text-white font-semibold hover:!bg-zinc-800 hover:!text-white"
            [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
            (click)="closeSidebar.emit()"
            class="flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-zinc-600 rounded-lg hover:bg-zinc-100 hover:text-zinc-900 transition-colors group cursor-pointer"
          >
            <i
              [class]="item.icon"
              class="text-base text-zinc-400 group-hover:text-zinc-900 group-[.text-white]:!text-white group-[.bg-zinc-900]:!text-white transition-colors shrink-0"
            ></i>
            <span class="truncate">{{ item.label }}</span>
          </a>
        }
      </nav>

      <!-- Bottom User Profile Card & Logout Button -->
      <div class="p-4 border-t border-zinc-200 bg-zinc-50/70 shrink-0">
        @if (user(); as currentUser) {
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5 min-w-0">
              <p-avatar
                [label]="getUserInitials(currentUser.fullName || currentUser.email)"
                shape="square"
                class="bg-zinc-900 text-white font-bold text-xs shrink-0 shadow-2xs"
              />
              <div class="flex flex-col min-w-0">
                <span class="text-xs font-semibold text-zinc-900 truncate leading-tight">
                  {{ currentUser.fullName || currentUser.email }}
                </span>
              </div>
            </div>

            <!-- Logout Button -->
            <p-button
              icon="pi pi-sign-out"
              severity="secondary"
              variant="text"
              [rounded]="true"
              size="small"
              (onClick)="onLogout()"
              pTooltip="Cerrar sesión"
              tooltipPosition="top"
              tooltipStyleClass="text-xs"
              aria-label="Cerrar sesión"
              class="shrink-0"
            />
          </div>
        }
      </div>
    </ng-template>
  `,
})
export class SidebarComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly abilityService = inject(AbilityService);
  private readonly modulesService = inject(ModulesService, { optional: true });

  readonly isOpen = input<boolean>(false);
  readonly closeSidebar = output<void>();
  readonly user = this.authService.currentUser;

  ngOnInit(): void {
    if (this.user()) {
      this.modulesService?.loadMyModules();
    }
  }

  onDrawerVisibleChange(visible: boolean): void {
    if (!visible) {
      this.closeSidebar.emit();
    }
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

  private getIconForModule(code: string): string {
    const iconMap: Record<string, string> = {
      DASHBOARD: 'pi pi-th-large',
      USERS: 'pi pi-users',
      ROLES: 'pi pi-shield',
      WORKFLOWS: 'pi pi-sitemap',
      AUDIT: 'pi pi-history',
    };
    return iconMap[code.toUpperCase()] || 'pi pi-circle';
  }

  readonly allNavItems: NavItem[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      subject: 'Dashboard',
      icon: 'pi pi-th-large',
    },
    {
      label: 'Usuarios',
      route: '/users',
      subject: 'User',
      icon: 'pi pi-users',
    },
    {
      label: 'Roles y Permisos',
      route: '/roles',
      subject: 'Role',
      icon: 'pi pi-shield',
    },
    {
      label: 'Flujos de Trabajo',
      route: '/workflow-engine',
      subject: 'WorkflowTransition',
      icon: 'pi pi-sitemap',
    },
    {
      label: 'Auditoría',
      route: '/audit-logs',
      subject: 'AuditLog',
      icon: 'pi pi-history',
    },
  ];

  readonly filteredNavItems = computed<NavItem[]>(() => {
    const dynamicModules = this.modulesService?.modules() || [];
    if (dynamicModules.length > 0) {
      return dynamicModules.map((m) => ({
        label: m.name,
        route: m.route,
        subject: m.code,
        icon: this.getIconForModule(m.code),
      }));
    }
    return this.allNavItems.filter((item) => this.abilityService.can('read', item.subject));
  });
}

