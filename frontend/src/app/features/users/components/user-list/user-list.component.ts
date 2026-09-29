import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiDataTableComponent } from '../../../../shared/components/ui-data-table/ui-data-table.component';
import { UiConfirmDialogComponent } from '../../../../shared/components/ui-confirm-dialog/ui-confirm-dialog.component';
import { UiPageHeaderComponent } from '../../../../shared/components/ui-page-header/ui-page-header.component';
import { UiBadgeComponent } from '../../../../shared/components/ui-badge/ui-badge.component';
import { UserModalComponent } from '../user-modal/user-modal.component';
import { UsersApiService, CreateUserPayload, UpdateUserPayload } from '../../services/users-api.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { AbilityService } from '../../../../core/services/ability.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Role, User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UiButtonComponent,
    UiDataTableComponent,
    UiConfirmDialogComponent,
    UiPageHeaderComponent,
    UiBadgeComponent,
    UserModalComponent,
  ],
  template: `
    <div class="space-y-8 sm:space-y-10">
      <!-- Standardized Reusable Page Header with Integrated Popover Filters -->
      <app-ui-page-header
        #pageHeader
        title="Gestión de Usuarios"
        subtitle="Administra los usuarios de la plataforma, asigna roles y gestiona la aprobación de registros."
        createButtonText="Nuevo Usuario"
        [canCreate]="canCreateUser()"
        [activeFilterCount]="activeFilterCount()"
        (filterClicked)="onOpenFilterModal()"
        (createClicked)="onOpenCreateModal()"
      >
        <!-- Inline Filter Popover Controls (No Backdrop Blur) -->
        <div filter-content class="space-y-4">
          <!-- Text Search Filter -->
          <div class="flex flex-col gap-2 w-full">
            <label class="text-sm font-medium text-zinc-800 tracking-wide">Buscar por Nombre o Email</label>
            <input
              type="text"
              [(ngModel)]="filterSearchTemp"
              placeholder="Ej: Juan Perez, admin@empresa.com..."
              class="w-full bg-white text-zinc-900 border border-zinc-300 rounded-lg placeholder-zinc-400 transition-all duration-150 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 px-4 py-2.5 text-sm min-h-[44px] font-normal"
            />
          </div>

          <!-- Role Filter Select -->
          <div class="flex flex-col gap-2 w-full">
            <label class="text-sm font-medium text-zinc-800 tracking-wide">Filtrar por Rol</label>
            <div class="relative flex items-center w-full">
              <select
                [(ngModel)]="filterRoleTemp"
                class="w-full bg-white text-zinc-900 border border-zinc-300 rounded-lg transition-all duration-150 appearance-none focus:outline-hidden focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 px-4 py-2.5 text-sm min-h-[44px] pr-10 font-normal"
              >
                <option value="">Todos los Roles</option>
                @for (role of availableRoles(); track role.id) {
                  <option [value]="role.name">{{ role.name }}</option>
                }
              </select>
              <div class="absolute right-3.5 pointer-events-none text-zinc-400">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Status Filter Select -->
          <div class="flex flex-col gap-2 w-full">
            <label class="text-sm font-medium text-zinc-800 tracking-wide">Filtrar por Estado de Cuenta</label>
            <div class="relative flex items-center w-full">
              <select
                [(ngModel)]="filterStatusTemp"
                class="w-full bg-white text-zinc-900 border border-zinc-300 rounded-lg transition-all duration-150 appearance-none focus:outline-hidden focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 px-4 py-2.5 text-sm min-h-[44px] pr-10 font-normal"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="ACTIVE">Solo Usuarios Activos</option>
                <option value="INACTIVE">Solo Usuarios Inactivos</option>
              </select>
              <div class="absolute right-3.5 pointer-events-none text-zinc-400">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Approval Status Filter Select -->
          <div class="flex flex-col gap-2 w-full">
            <label class="text-sm font-medium text-zinc-800 tracking-wide">Estado de Aprobación de Registro</label>
            <div class="relative flex items-center w-full">
              <select
                [(ngModel)]="filterApprovalTemp"
                class="w-full bg-white text-zinc-900 border border-zinc-300 rounded-lg transition-all duration-150 appearance-none focus:outline-hidden focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 px-4 py-2.5 text-sm min-h-[44px] pr-10 font-normal"
              >
                <option value="ALL">Todas las Solicitudes</option>
                <option value="APPROVED">Solo Aprobados</option>
                <option value="PENDING">Solo Pendientes de Aprobación</option>
                <option value="REJECTED">Solo Rechazados</option>
              </select>
              <div class="absolute right-3.5 pointer-events-none text-zinc-400">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Popover Action Footer Button -->
          <div class="pt-3 border-t border-zinc-100 w-full">
            <app-ui-button
              type="button"
              variant="primary"
              size="md"
              [fullWidth]="true"
              (clicked)="onApplyModalFilters(pageHeader)"
            >
              Aplicar Filtros
            </app-ui-button>
          </div>
        </div>
      </app-ui-page-header>

      <!-- Active Filters Tag Pills (Shown when filters are active) -->
      @if (activeFilterCount() > 0) {
        <div class="flex flex-wrap items-center gap-2 bg-zinc-50 p-3 rounded-lg border border-zinc-200/80 text-xs">
          <span class="text-zinc-500 font-medium mr-1">Filtros activos:</span>

          @if (searchQueryApplied()) {
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-zinc-200 rounded-md font-medium text-zinc-800 shadow-2xs">
              Búsqueda: "{{ searchQueryApplied() }}"
              <button type="button" (click)="removeSearchFilter()" class="text-zinc-400 hover:text-zinc-700">
                &times;
              </button>
            </span>
          }

          @if (selectedRoleFilterApplied()) {
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-zinc-200 rounded-md font-medium text-zinc-800 shadow-2xs">
              Rol: {{ selectedRoleFilterApplied() }}
              <button type="button" (click)="removeRoleFilter()" class="text-zinc-400 hover:text-zinc-700">
                &times;
              </button>
            </span>
          }

          @if (selectedStatusFilterApplied() !== 'ALL') {
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-zinc-200 rounded-md font-medium text-zinc-800 shadow-2xs">
              Estado: {{ selectedStatusFilterApplied() === 'ACTIVE' ? 'Activo' : 'Inactivo' }}
              <button type="button" (click)="removeStatusFilter()" class="text-zinc-400 hover:text-zinc-700">
                &times;
              </button>
            </span>
          }

          @if (selectedApprovalFilterApplied() !== 'ALL') {
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-zinc-200 rounded-md font-medium text-zinc-800 shadow-2xs">
              Aprobación: {{ getApprovalLabel(selectedApprovalFilterApplied()) }}
              <button type="button" (click)="removeApprovalFilter()" class="text-zinc-400 hover:text-zinc-700">
                &times;
              </button>
            </span>
          }

          <button
            type="button"
            (click)="onClearAllFilters()"
            class="text-xs font-semibold text-zinc-600 hover:text-zinc-900 underline ml-2 cursor-pointer"
          >
            Limpiar todos
          </button>
        </div>
      }

      <!-- Main Data Table Container -->
      <app-ui-data-table
        [loading]="isLoading()"
        [page]="page()"
        [pageSize]="limit()"
        [totalPages]="lastPage()"
        [totalItems]="total()"
        (pageChange)="onPageChange($event)"
        (pageSizeChange)="onPageSizeChange($event)"
      >
        <ng-container table-headers>
          <th class="px-4 py-3 text-xs font-semibold text-zinc-600">Usuario</th>
          <th class="px-4 py-3 text-xs font-semibold text-zinc-600">Contacto</th>
          <th class="px-4 py-3 text-xs font-semibold text-zinc-600">Roles</th>
          <th class="px-4 py-3 text-xs font-semibold text-zinc-600">Aprobación</th>
          <th class="px-4 py-3 text-xs font-semibold text-zinc-600">Estado</th>
          <th class="px-4 py-3 text-xs font-semibold text-zinc-600">Registro</th>
          <th class="px-4 py-3 text-xs font-semibold text-zinc-600 text-center">Acciones</th>
        </ng-container>

        <ng-container table-rows>
          @for (row of filteredUsers(); track row.id) {
            <tr class="hover:bg-zinc-50/80 transition-colors border-b border-zinc-100 last:border-0">
              <!-- User Profile Column -->
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-zinc-900 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                    {{ getUserInitials(row.fullName || row.email) }}
                  </div>
                  <div class="flex flex-col min-w-0">
                    <div class="flex items-center gap-1.5">
                      <span class="text-xs font-semibold text-zinc-900 truncate">
                        {{ row.fullName || 'Sin Nombre' }}
                      </span>
                      @if (row.isEmailVerified) {
                        <span class="inline-flex items-center text-emerald-600" title="Correo Electrónico Verificado">
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                        </span>
                      }
                    </div>
                    <span class="text-[11px] text-zinc-500 truncate">
                      {{ row.email }}
                    </span>
                  </div>
                </div>
              </td>

              <!-- Contact Phone Column -->
              <td class="px-4 py-3">
                <span class="text-xs text-zinc-600 font-medium">
                  {{ row.phoneNumber || '—' }}
                </span>
              </td>

              <!-- Roles Column -->
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                  @for (r of row.roles || []; track r.id || r.name) {
                    <app-ui-badge
                      [variant]="r.name === 'ADMIN' || r.name === 'SUPERADMIN' ? 'dark' : 'default'"
                      [uppercase]="true"
                    >
                      {{ r.name }}
                    </app-ui-badge>
                  } @empty {
                    <span class="text-[11px] text-zinc-400 italic">Sin Rol</span>
                  }
                </div>
              </td>

              <!-- Approval Status Column -->
              <td class="px-4 py-3">
                @if (row.approvalStatus === 'PENDING') {
                  <app-ui-badge variant="warning" [dot]="true">
                    Pendiente
                  </app-ui-badge>
                } @else if (row.approvalStatus === 'REJECTED') {
                  <app-ui-badge variant="danger" [dot]="true">
                    Rechazado
                  </app-ui-badge>
                } @else {
                  <app-ui-badge variant="success" [dot]="true">
                    Aprobado
                  </app-ui-badge>
                }
              </td>

              <!-- Active Status Column -->
              <td class="px-4 py-3">
                @if (row.isActive) {
                  <app-ui-badge variant="success" [dot]="true">
                    Activo
                  </app-ui-badge>
                } @else {
                  <app-ui-badge variant="secondary" [dot]="true">
                    Inactivo
                  </app-ui-badge>
                }
              </td>

              <!-- Created At Registration Date Column -->
              <td class="px-4 py-3">
                <span class="text-xs text-zinc-500 whitespace-nowrap">
                  {{ row.createdAt ? (row.createdAt | date: 'dd/MM/yyyy') : '—' }}
                </span>
              </td>

              <!-- Actions Column -->
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center">
                  <button
                    type="button"
                    (click)="onOpenEditModal(row)"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200/80 rounded-lg transition-colors border border-zinc-200/80 shadow-2xs cursor-pointer group"
                    title="Abrir detalles de usuario"
                  >
                    <svg class="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12H3m0 0l4-4m-4 4l4 4m14-9a2 2 0 012 2v10a2 2 0 01-2 2H9a2 2 0 01-2-2v-3"/>
                    </svg>
                    <span>Abrir</span>
                  </button>
                </div>
              </td>
            </tr>
          }
        </ng-container>
      </app-ui-data-table>

      <!-- Create / Edit User Modal (Slide-Over Drawer) -->
      <app-user-modal
        [isOpen]="isModalOpen()"
        [userToEdit]="selectedUser()"
        [availableRoles]="availableRoles()"
        [isSubmitting]="isSaving()"
        [closeOnBackdrop]="false"
        (closeModal)="onCloseModal()"
        (saveUser)="onSaveUser($event)"
        (deleteUser)="onConfirmDelete($event)"
        (approveUser)="onApproveUserFromModal($event)"
        (rejectUser)="onRejectUserFromModal($event)"
      ></app-user-modal>

      <!-- Delete Confirmation Dialog -->
      <app-ui-confirm-dialog
        [isOpen]="isConfirmOpen()"
        title="Eliminar Usuario"
        [message]="'¿Estás seguro de que deseas eliminar al usuario ' + (userToDelete()?.fullName || userToDelete()?.email) + '? Se realizará una eliminación lógica del sistema.'"
        confirmText="Eliminar Usuario"
        [isDanger]="false"
        (confirmed)="onExecuteDelete()"
        (cancelled)="isConfirmOpen.set(false)"
      ></app-ui-confirm-dialog>
    </div>
  `,
})
export class UserListComponent implements OnInit {
  private readonly usersApiService = inject(UsersApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly abilityService = inject(AbilityService);
  private readonly authService = inject(AuthService);

  readonly users = signal<User[]>([]);
  readonly availableRoles = signal<Role[]>([]);
  readonly total = signal<number>(0);
  readonly page = signal<number>(1);
  readonly limit = signal<number>(10);
  readonly lastPage = signal<number>(1);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);

  // Filter signals
  readonly searchQueryApplied = signal<string>('');
  readonly selectedRoleFilterApplied = signal<string>('');
  readonly selectedStatusFilterApplied = signal<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  readonly selectedApprovalFilterApplied = signal<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL');

  // Filter Popover temp values
  filterSearchTemp = '';
  filterRoleTemp = '';
  filterStatusTemp: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';
  filterApprovalTemp: 'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED' = 'ALL';

  // Create / Edit modal
  readonly isModalOpen = signal<boolean>(false);
  readonly selectedUser = signal<User | null>(null);

  // Delete confirm dialog
  readonly isConfirmOpen = signal<boolean>(false);
  readonly userToDelete = signal<User | null>(null);

  readonly canCreateUser = computed(() => this.abilityService.can('create', 'User'));
  readonly canUpdateUser = computed(() => this.abilityService.can('update', 'User'));
  readonly canDeleteUser = computed(() => this.abilityService.can('delete', 'User'));

  readonly activeFilterCount = computed(() => {
    let count = 0;
    if (this.searchQueryApplied()) count++;
    if (this.selectedRoleFilterApplied()) count++;
    if (this.selectedStatusFilterApplied() !== 'ALL') count++;
    if (this.selectedApprovalFilterApplied() !== 'ALL') count++;
    return count;
  });

  readonly filteredUsers = computed(() => {
    return this.users();
  });

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    const approvalFilter = this.selectedApprovalFilterApplied();
    const roleFilter = this.selectedRoleFilterApplied();
    const statusFilter = this.selectedStatusFilterApplied();

    let isActiveParam: boolean | undefined = undefined;
    if (statusFilter === 'ACTIVE') isActiveParam = true;
    if (statusFilter === 'INACTIVE') isActiveParam = false;

    this.usersApiService
      .getUsers({
        page: this.page(),
        limit: this.limit(),
        search: this.searchQueryApplied().trim() || undefined,
        approvalStatus: approvalFilter !== 'ALL' ? approvalFilter : undefined,
        roleName: roleFilter || undefined,
        isActive: isActiveParam,
      })
      .subscribe({
        next: (res) => {
          this.users.set(res.data || []);
          this.total.set(res.total || 0);
          this.lastPage.set(res.lastPage || 1);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.notificationService.error(
            'Error al cargar usuarios',
            err.error?.message || 'No se pudo obtener la lista de usuarios.',
          );
        },
      });
  }

  loadRoles(): void {
    this.usersApiService.getAvailableRoles().subscribe({
      next: (roles) => this.availableRoles.set(roles || []),
      error: () => {},
    });
  }

  onOpenFilterModal(): void {
    this.filterSearchTemp = this.searchQueryApplied();
    this.filterRoleTemp = this.selectedRoleFilterApplied();
    this.filterStatusTemp = this.selectedStatusFilterApplied();
    this.filterApprovalTemp = this.selectedApprovalFilterApplied();
  }

  onApplyModalFilters(pageHeader?: UiPageHeaderComponent): void {
    this.searchQueryApplied.set(this.filterSearchTemp.trim());
    this.selectedRoleFilterApplied.set(this.filterRoleTemp);
    this.selectedStatusFilterApplied.set(this.filterStatusTemp);
    this.selectedApprovalFilterApplied.set(this.filterApprovalTemp);
    this.page.set(1);
    pageHeader?.closeFilterPopover();
    this.loadUsers();
  }

  onClearModalFilters(pageHeader?: UiPageHeaderComponent): void {
    this.filterSearchTemp = '';
    this.filterRoleTemp = '';
    this.filterStatusTemp = 'ALL';
    this.filterApprovalTemp = 'ALL';
    this.onApplyModalFilters(pageHeader);
  }

  onClearAllFilters(): void {
    this.searchQueryApplied.set('');
    this.selectedRoleFilterApplied.set('');
    this.selectedStatusFilterApplied.set('ALL');
    this.selectedApprovalFilterApplied.set('ALL');
    this.page.set(1);
    this.loadUsers();
  }

  removeSearchFilter(): void {
    this.searchQueryApplied.set('');
    this.loadUsers();
  }

  removeRoleFilter(): void {
    this.selectedRoleFilterApplied.set('');
    this.loadUsers();
  }

  removeStatusFilter(): void {
    this.selectedStatusFilterApplied.set('ALL');
    this.loadUsers();
  }

  removeApprovalFilter(): void {
    this.selectedApprovalFilterApplied.set('ALL');
    this.loadUsers();
  }

  getApprovalLabel(status: string): string {
    if (status === 'APPROVED') return 'Aprobados';
    if (status === 'PENDING') return 'Pendientes';
    if (status === 'REJECTED') return 'Rechazados';
    return 'Todos';
  }

  onApproveUser(user: User): void {
    this.usersApiService.approveUser(user.id).subscribe({
      next: () => {
        this.notificationService.success(
          'Solicitud Aprobada',
          `Se aprobó la solicitud de ${user.fullName || user.email} y se le envió el correo de verificación.`,
        );
        this.loadUsers();
      },
      error: (err) => {
        this.notificationService.error(
          'Error al aprobar',
          err.error?.message || 'No se pudo aprobar la solicitud.',
        );
      },
    });
  }

  onRejectUser(user: User): void {
    this.usersApiService.rejectUser(user.id).subscribe({
      next: () => {
        this.notificationService.success('Solicitud Rechazada', 'El registro de usuario ha sido denegado.');
        this.loadUsers();
      },
      error: (err) => {
        this.notificationService.error(
          'Error al rechazar',
          err.error?.message || 'No se pudo rechazar la solicitud.',
        );
      },
    });
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
    this.loadUsers();
  }

  onPageSizeChange(newSize: number): void {
    this.limit.set(newSize);
    this.page.set(1);
    this.loadUsers();
  }

  getUserInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  onOpenCreateModal(): void {
    this.selectedUser.set(null);
    this.isModalOpen.set(true);
  }

  onOpenEditModal(user: User): void {
    this.selectedUser.set(user);
    this.isModalOpen.set(true);
  }

  onCloseModal(): void {
    this.isModalOpen.set(false);
    this.selectedUser.set(null);
  }

  onSaveUser(event: { isEdit: boolean; id?: number; payload: CreateUserPayload | UpdateUserPayload }): void {
    this.isSaving.set(true);

    if (event.isEdit && event.id) {
      this.usersApiService.updateUser(event.id, event.payload as UpdateUserPayload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.onCloseModal();
          this.notificationService.notifyUpdated('Usuario');
          if (event.id === this.authService.currentUser()?.id) {
            this.authService.getProfile().subscribe();
          }
          this.loadUsers();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.notificationService.error(
            'Error al actualizar',
            err.error?.message || 'No se pudo actualizar el usuario',
          );
        },
      });
    } else {
      this.usersApiService.createUser(event.payload as CreateUserPayload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.onCloseModal();
          this.notificationService.notifySaved('Usuario');
          this.loadUsers();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.notificationService.error(
            'Error al crear',
            err.error?.message || 'No se pudo crear el usuario',
          );
        },
      });
    }
  }

  onConfirmDelete(user: User): void {
    this.userToDelete.set(user);
    this.isConfirmOpen.set(true);
  }

  onExecuteDelete(): void {
    const user = this.userToDelete();
    if (!user) return;

    this.usersApiService.deleteUser(user.id).subscribe({
      next: () => {
        this.isConfirmOpen.set(false);
        this.userToDelete.set(null);
        this.isModalOpen.set(false);
        this.selectedUser.set(null);
        this.notificationService.notifyDeleted('Usuario');
        this.loadUsers();
      },
      error: (err) => {
        this.isConfirmOpen.set(false);
        this.notificationService.error(
          'Error al eliminar',
          err.error?.message || 'No se pudo eliminar el usuario',
        );
      },
    });
  }

  onApproveUserFromModal(userId: number): void {
    this.isSaving.set(true);
    this.usersApiService.approveUser(userId).subscribe({
      next: (updatedUser) => {
        this.isSaving.set(false);
        this.notificationService.success(
          'Solicitud Aprobada',
          'Se aprobó la cuenta y se enviaron las credenciales provisorias al usuario por correo electrónico.',
        );
        this.selectedUser.set(updatedUser);
        this.loadUsers();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.notificationService.error(
          'Error al aprobar solicitud',
          err.error?.message || 'No se pudo aprobar la solicitud del usuario.',
        );
      },
    });
  }

  onRejectUserFromModal(event: { id: number; reason: string }): void {
    this.isSaving.set(true);
    this.usersApiService.rejectUser(event.id, event.reason).subscribe({
      next: (updatedUser) => {
        this.isSaving.set(false);
        this.notificationService.success(
          'Solicitud Rechazada',
          'El registro de usuario ha sido rechazado, la cuenta desactivada y se envió el motivo por correo.',
        );
        this.selectedUser.set(updatedUser);
        this.loadUsers();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.notificationService.error(
          'Error al rechazar solicitud',
          err.error?.message || 'No se pudo rechazar la solicitud del usuario.',
        );
      },
    });
  }
}
