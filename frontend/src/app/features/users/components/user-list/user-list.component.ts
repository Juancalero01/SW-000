import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
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
    TableModule,
    ButtonModule,
    TagModule,
    AvatarModule,
    DialogModule,
    SelectModule,
    UserModalComponent,
  ],
  styles: [
    `
      :host ::ng-deep .p-datatable-header {
        background: transparent;
        border: none;
        padding: 0;
      }

      :host ::ng-deep .p-datatable-thead > tr > th {
        padding: 1rem 1.25rem !important;
        background-color: #fafafa !important;
        color: #52525b !important;
        font-size: 0.75rem !important;
        font-weight: 600 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.05em !important;
        border-bottom: 1px solid #e4e4e7 !important;
        border-top: none !important;
        border-left: none !important;
        border-right: none !important;
        white-space: nowrap;
      }

      :host ::ng-deep .p-datatable-tbody > tr > td {
        padding: 1.125rem 1.25rem !important;
        vertical-align: middle !important;
        border-bottom: 1px solid #f4f4f5 !important;
        border-top: none !important;
        border-left: none !important;
        border-right: none !important;
        background-color: #ffffff;
      }

      :host ::ng-deep .p-datatable-tbody > tr:hover > td {
        background-color: #fafafa !important;
      }

      :host ::ng-deep .p-datatable-tbody > tr:last-child > td {
        border-bottom: none !important;
      }

      :host ::ng-deep .p-paginator {
        padding: 0.875rem 1.5rem !important;
        border-top: 1px solid #e4e4e7 !important;
        background-color: #ffffff !important;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.5rem;
      }

      :host ::ng-deep .p-paginator .p-paginator-current {
        font-size: 0.8125rem;
        color: #71717a;
        margin-right: auto;
      }

      :host ::ng-deep .p-column-filter-menu-button {
        width: 1.75rem;
        height: 1.75rem;
        border-radius: 0.375rem;
      }
    `,
  ],
  template: `
    <div class="space-y-8 sm:space-y-10">
      <!-- Standardized Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-2 pb-2 sm:pb-3">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
            Gestión de Usuarios
          </h1>
          <p class="text-xs sm:text-sm text-zinc-500 mt-1">
            Administra los usuarios de la plataforma, asigna roles y gestiona el estado de las cuentas.
          </p>
        </div>

        @if (canCreateUser()) {
          <div class="flex items-center gap-2.5 shrink-0">
            <p-button
              label="Nuevo Usuario"
              icon="pi pi-plus"
              severity="contrast"
              (onClick)="onOpenCreateModal()"
            />
          </div>
        }
      </div>

      <!-- Main Data Table Container (PrimeNG Table) -->
      <div class="bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-2xs">
        <p-table
          #dt
          [value]="users()"
          [loading]="isLoading()"
          [lazy]="true"
          filterDisplay="menu"
          (onPage)="onPrimePageChange($event)"
          (onFilter)="onTableFilter($event)"
          [paginator]="true"
          [rows]="limit()"
          [totalRecords]="total()"
          [first]="(page() - 1) * limit()"
          [rowsPerPageOptions]="[5, 10, 20, 50]"
          [showCurrentPageReport]="true"
          paginatorDropdownAppendTo="body"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} usuarios"
        >
          <!-- Table Caption: Buscador positioned in the table header -->
          <ng-template #caption>
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border-b border-zinc-200/80">
              <!-- Search Bar -->
              <div class="relative flex items-center w-full sm:w-80">
                <div class="absolute left-3.5 pointer-events-none text-zinc-400 flex items-center">
                  <i class="pi pi-search text-sm"></i>
                </div>
                <input
                  type="text"
                  [ngModel]="searchQueryApplied()"
                  (ngModelChange)="onSearchInput($event)"
                  placeholder="Buscar por nombre o email..."
                  class="w-full pl-9 pr-8 py-2 text-sm bg-white text-zinc-900 border border-zinc-300 rounded-lg placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 font-normal transition-all"
                />
                @if (searchQueryApplied()) {
                  <button
                    type="button"
                    (click)="removeSearchFilter()"
                    class="absolute right-2.5 text-zinc-400 hover:text-zinc-700 cursor-pointer p-1"
                    title="Limpiar búsqueda"
                  >
                    <i class="pi pi-times text-xs"></i>
                  </button>
                }
              </div>

              <!-- Filter Reset / Total Count -->
              <div class="flex items-center gap-3 shrink-0">
                @if (activeFilterCount() > 0) {
                  <p-button
                    label="Limpiar Filtros"
                    icon="pi pi-filter-slash"
                    severity="secondary"
                    variant="outlined"
                    size="small"
                    (onClick)="onClearAllFilters(dt)"
                  />
                }
                <span class="text-xs text-zinc-500 font-medium whitespace-nowrap">
                  Total: {{ total() }} {{ total() === 1 ? 'usuario' : 'usuarios' }}
                </span>
              </div>
            </div>
          </ng-template>

          <!-- Table Header with Display Menu Filters -->
          <ng-template #header>
            <tr class="border-b border-zinc-200/80 bg-zinc-50/75">
              <!-- Usuario Column (Search is handled by header caption input) -->
              <th class="px-4 py-3 text-xs font-semibold text-zinc-600 tracking-wider text-left">
                Usuario
              </th>

              <!-- Contacto Column -->
              <th class="px-4 py-3 text-xs font-semibold text-zinc-600 tracking-wider text-left">
                Contacto
              </th>

              <!-- Roles Column -->
              <th class="px-4 py-3 text-xs font-semibold text-zinc-600 tracking-wider text-left">
                <div class="flex items-center justify-between gap-2">
                  <span>Roles</span>
                  <p-columnFilter
                    field="role"
                    matchMode="equals"
                    display="menu"
                    [showMatchModes]="false"
                    [showOperator]="false"
                    [showAddButton]="false"
                    
                  >
                    <ng-template #filter let-value let-filter="filterCallback">
                      <div class="p-1 min-w-[200px]">
                        <label class="block text-xs font-semibold text-zinc-700 mb-2">Filtrar por Rol</label>
                        <p-select
                          [ngModel]="selectedRoleFilterApplied()"
                          (ngModelChange)="onRoleSelectFilter($event, filter)"
                          [options]="roleFilterOptions()"
                          optionLabel="label"
                          optionValue="value"
                          placeholder="Todos los roles"
                          [showClear]="true"
                          size="small"
                          class="w-full text-xs"
                        />
                      </div>
                    </ng-template>
                  </p-columnFilter>
                </div>
              </th>

              <!-- Estado Column -->
              <th class="px-4 py-3 text-xs font-semibold text-zinc-600 tracking-wider text-left">
                <div class="flex items-center justify-between gap-2">
                  <span>Estado</span>
                  <p-columnFilter
                    field="isActive"
                    matchMode="equals"
                    display="menu"
                    [showMatchModes]="false"
                    [showOperator]="false"
                    [showAddButton]="false"
                  >
                    <ng-template #filter let-value let-filter="filterCallback">
                      <div class="p-1 min-w-[200px]">
                        <label class="block text-xs font-semibold text-zinc-700 mb-2">Estado de Cuenta</label>
                        <p-select
                          [ngModel]="selectedStatusFilterApplied()"
                          (ngModelChange)="onStatusSelectFilter($event, filter)"
                          [options]="statusFilterOptions"
                          optionLabel="label"
                          optionValue="value"
                          placeholder="Todos los estados"
                          size="small"
                          class="w-full text-xs"
                        />
                      </div>
                    </ng-template>
                  </p-columnFilter>
                </div>
              </th>

              <!-- Registro Column -->
              <th class="px-4 py-3 text-xs font-semibold text-zinc-600 tracking-wider text-left">
                Registro
              </th>

              <!-- Acciones Column -->
              <th class="px-4 py-3 text-xs font-semibold text-zinc-600 tracking-wider text-center">
                Acciones
              </th>
            </tr>
          </ng-template>

          <ng-template #body let-row>
            <tr class="hover:bg-zinc-50/80 transition-colors border-b border-zinc-100 last:border-0">
              <!-- User Profile Column -->
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <p-avatar
                    [label]="getUserInitials(row.fullName || row.email)"
                    shape="square"
                    class="bg-zinc-900 text-white font-bold text-xs shrink-0 shadow-2xs"
                  />
                  <div class="flex flex-col min-w-0">
                    <div class="flex items-center gap-1.5">
                      <span class="text-xs font-semibold text-zinc-900 truncate">
                        {{ row.fullName || 'Sin Nombre' }}
                      </span>
                      @if (row.isEmailVerified) {
                        <i class="pi pi-verified text-emerald-600 text-xs" title="Correo Electrónico Verificado"></i>
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
                    <p-tag
                      [value]="r.name"
                      [severity]="r.name === 'ADMIN' || r.name === 'SUPERADMIN' ? 'contrast' : 'secondary'"
                      class="text-xs font-medium tracking-wider"
                    />
                  } @empty {
                    <span class="text-xs text-zinc-400 italic">Sin Rol</span>
                  }
                </div>
              </td>

              <!-- Active Status Column -->
              <td class="px-4 py-3">
                @if (row.isActive) {
                  <p-tag severity="contrast" value="Activo" class="text-xs font-medium" />
                } @else {
                  <p-tag severity="secondary" value="Inactivo" class="text-xs font-medium" />
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
                  <p-button
                    label="Abrir"
                    icon="pi pi-external-link"
                    iconPos="right"
                    size="small"
                    severity="secondary"
                    variant="outlined"
                    (onClick)="onOpenEditModal(row)"
                    title="Abrir detalles de usuario"
                  />
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template #emptymessage>
            <tr>
              <td colspan="6" class="text-center py-12 text-zinc-500 text-sm">
                No se encontraron usuarios registrados con los criterios seleccionados.
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

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
      ></app-user-modal>

      <!-- Delete Confirmation Dialog (PrimeNG Dialog) -->
      <p-dialog
        header="Eliminar Usuario"
        [visible]="isConfirmOpen()"
        (visibleChange)="isConfirmOpen.set($event)"
        [modal]="true"
        [closable]="true"
        [draggable]="false"
        [resizable]="false"
        [style]="{ width: '90vw', maxWidth: '440px' }"
      >
        <p class="text-sm text-zinc-600 leading-relaxed py-2">
          ¿Estás seguro de que deseas eliminar al usuario <strong>{{ userToDelete()?.fullName || userToDelete()?.email }}</strong>? Se realizará una eliminación lógica del sistema.
        </p>
        <ng-template #footer>
          <div class="flex items-center justify-end gap-2 pt-2">
            <p-button
              label="Cancelar"
              severity="secondary"
              variant="outlined"
              (onClick)="isConfirmOpen.set(false)"
            />
            <p-button
              label="Eliminar Usuario"
              severity="danger"
              (onClick)="onExecuteDelete()"
            />
          </div>
        </ng-template>
      </p-dialog>
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
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);

  // Filter signals
  readonly searchQueryApplied = signal<string>('');
  readonly selectedRoleFilterApplied = signal<string>('');
  readonly selectedStatusFilterApplied = signal<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Create / Edit modal
  readonly isModalOpen = signal<boolean>(false);
  readonly selectedUser = signal<User | null>(null);

  // Delete confirm dialog
  readonly isConfirmOpen = signal<boolean>(false);
  readonly userToDelete = signal<User | null>(null);

  readonly canCreateUser = computed(() => this.abilityService.can('create', 'User'));

  readonly activeFilterCount = computed(() => {
    let count = 0;
    if (this.searchQueryApplied()) count++;
    if (this.selectedRoleFilterApplied()) count++;
    if (this.selectedStatusFilterApplied() !== 'ALL') count++;
    return count;
  });

  readonly roleFilterOptions = computed(() => [
    { label: 'Todos los Roles', value: '' },
    ...this.availableRoles().map((r) => ({ label: r.name, value: r.name })),
  ]);

  readonly statusFilterOptions = [
    { label: 'Todos los Estados', value: 'ALL' },
    { label: 'Activo', value: 'ACTIVE' },
    { label: 'Inactivo', value: 'INACTIVE' },
  ];

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
  }

  loadUsers(): void {
    this.isLoading.set(true);
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
        roleName: roleFilter || undefined,
        isActive: isActiveParam,
      })
      .subscribe({
        next: (res) => {
          this.users.set(res.data || []);
          this.total.set(res.total || 0);
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

  onSearchInput(query: string): void {
    this.searchQueryApplied.set(query.trim());
    this.page.set(1);
    this.loadUsers();
  }

  onRoleSelectFilter(val: string, filterCallback?: Function): void {
    this.selectedRoleFilterApplied.set(val || '');
    this.page.set(1);
    if (filterCallback) {
      filterCallback(val || null);
    }
    this.loadUsers();
  }

  onStatusSelectFilter(val: 'ALL' | 'ACTIVE' | 'INACTIVE', filterCallback?: Function): void {
    this.selectedStatusFilterApplied.set(val || 'ALL');
    this.page.set(1);
    if (filterCallback) {
      filterCallback(val !== 'ALL' ? val : null);
    }
    this.loadUsers();
  }

  onTableFilter(event: any): void {
    const filters = event.filters || {};
    const roleVal = this.extractFilterValue(filters['role']);
    if (roleVal !== undefined) {
      this.selectedRoleFilterApplied.set(roleVal || '');
    }

    const statusVal = this.extractFilterValue(filters['isActive']);
    if (statusVal !== undefined) {
      this.selectedStatusFilterApplied.set(statusVal || 'ALL');
    }

    const nameVal = this.extractFilterValue(filters['fullName']);
    if (nameVal !== undefined) {
      this.searchQueryApplied.set(nameVal || '');
    }

    this.page.set(1);
    this.loadUsers();
  }

  private extractFilterValue(filterMeta: any): any {
    if (!filterMeta) return undefined;
    if (Array.isArray(filterMeta)) {
      return filterMeta[0]?.value;
    }
    return filterMeta.value;
  }

  onClearAllFilters(table?: any): void {
    this.searchQueryApplied.set('');
    this.selectedRoleFilterApplied.set('');
    this.selectedStatusFilterApplied.set('ALL');
    this.page.set(1);
    if (table) {
      table.clear();
    }
    this.loadUsers();
  }

  removeSearchFilter(): void {
    this.searchQueryApplied.set('');
    this.loadUsers();
  }

  onPrimePageChange(event: any): void {
    const newPage = event.page !== undefined ? event.page + 1 : Math.floor((event.first || 0) / (event.rows || 10)) + 1;
    const newLimit = event.rows || this.limit();

    if (newLimit !== this.limit()) {
      this.limit.set(newLimit);
      this.page.set(1);
    } else {
      this.page.set(newPage);
    }
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
}
