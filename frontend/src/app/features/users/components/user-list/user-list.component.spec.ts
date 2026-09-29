import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserListComponent } from './user-list.component';
import { UsersApiService } from '../../services/users-api.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { AbilityService } from '../../../../core/services/ability.service';
import { AuthService } from '../../../../core/services/auth.service';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { User } from '../../../../core/models/user.model';

describe('UserListComponent', () => {
  let fixture: ComponentFixture<UserListComponent>;
  let component: UserListComponent;
  let mockUsersApiService: any;
  let mockNotificationService: any;
  let mockAbilityService: any;
  let mockAuthService: any;

  const mockCurrentUserSignal = signal<User | null>({
    id: 1,
    email: 'admin@test.com',
    fullName: 'Juan Admin',
    isActive: true,
    roles: [{ id: 1, name: 'ADMIN' }],
  });

  beforeEach(async () => {
    mockUsersApiService = {
      getUsers: vi.fn().mockReturnValue(
        of({
          data: [
            { id: 1, email: 'admin@test.com', fullName: 'Juan Admin', isActive: true, roles: [{ id: 1, name: 'ADMIN' }] },
            { id: 2, email: 'user@test.com', fullName: 'Pedro User', isActive: false, roles: [{ id: 2, name: 'USER' }] },
          ],
          total: 2,
          page: 1,
          lastPage: 1,
        }),
      ),
      getAvailableRoles: vi.fn().mockReturnValue(of([{ id: 1, name: 'ADMIN' }, { id: 2, name: 'USER' }])),
      createUser: vi.fn().mockReturnValue(of({ id: 3, fullName: 'New User' })),
      updateUser: vi.fn().mockReturnValue(of({ id: 1, fullName: 'Updated Admin' })),
      deleteUser: vi.fn().mockReturnValue(of({ message: 'Deleted' })),
      approveUser: vi.fn().mockReturnValue(of({ id: 2, fullName: 'Pedro User', approvalStatus: 'APPROVED', isActive: true })),
      rejectUser: vi.fn().mockReturnValue(of({ id: 2, fullName: 'Pedro User', approvalStatus: 'REJECTED', isActive: false })),
    };

    mockNotificationService = {
      notifySaved: vi.fn(),
      notifyUpdated: vi.fn(),
      notifyDeleted: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
    };

    mockAbilityService = {
      can: vi.fn().mockReturnValue(true),
    };

    mockAuthService = {
      currentUser: mockCurrentUserSignal,
      getProfile: vi.fn().mockReturnValue(of({ id: 1, email: 'admin@test.com' })),
    };

    await TestBed.configureTestingModule({
      imports: [UserListComponent],
      providers: [
        { provide: UsersApiService, useValue: mockUsersApiService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: AbilityService, useValue: mockAbilityService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create user list component and load users', () => {
    expect(component).toBeTruthy();
    expect(mockUsersApiService.getUsers).toHaveBeenCalled();
    expect(component.users().length).toBe(2);
  });

  it('should pass role and status filters to API when modal filters are applied', () => {
    component.filterRoleTemp = 'ADMIN';
    component.filterStatusTemp = 'ACTIVE';
    component.onApplyModalFilters();
    fixture.detectChanges();

    expect(component.selectedRoleFilterApplied()).toBe('ADMIN');
    expect(component.selectedStatusFilterApplied()).toBe('ACTIVE');
    expect(mockUsersApiService.getUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        roleName: 'ADMIN',
        isActive: true,
      }),
    );
  });

  it('should open create user modal', () => {
    component.onOpenCreateModal();
    expect(component.isModalOpen()).toBe(true);
    expect(component.selectedUser()).toBeNull();
  });

  it('should open edit user modal with selected user', () => {
    const targetUser = component.users()[0];
    component.onOpenEditModal(targetUser);
    expect(component.isModalOpen()).toBe(true);
    expect(component.selectedUser()).toBe(targetUser);
  });

  it('should call deleteUser and reload list on confirm delete', () => {
    const targetUser = component.users()[1];
    component.onConfirmDelete(targetUser);
    expect(component.isConfirmOpen()).toBe(true);

    component.onExecuteDelete();
    expect(mockUsersApiService.deleteUser).toHaveBeenCalledWith(2);
    expect(mockNotificationService.notifyDeleted).toHaveBeenCalled();
  });

  it('should handle approveUser from modal and update selected user state', () => {
    component.onApproveUserFromModal(2);
    expect(mockUsersApiService.approveUser).toHaveBeenCalledWith(2);
    expect(mockNotificationService.success).toHaveBeenCalledWith(
      'Solicitud Aprobada',
      expect.stringContaining('credenciales provisorias'),
    );
    expect(component.selectedUser()?.approvalStatus).toBe('APPROVED');
    expect(component.selectedUser()?.isActive).toBe(true);
  });

  it('should handle rejectUser from modal with reason and update selected user state', () => {
    component.onRejectUserFromModal({ id: 2, reason: 'No cumple perfil requerido' });
    expect(mockUsersApiService.rejectUser).toHaveBeenCalledWith(2, 'No cumple perfil requerido');
    expect(mockNotificationService.success).toHaveBeenCalledWith(
      'Solicitud Rechazada',
      expect.stringContaining('desactivada'),
    );
    expect(component.selectedUser()?.approvalStatus).toBe('REJECTED');
    expect(component.selectedUser()?.isActive).toBe(false);
  });

  it('should refresh auth profile if edited user is the current authenticated user', () => {
    component.onSaveUser({
      isEdit: true,
      id: 1,
      payload: { fullName: 'Juan Super Admin', roles: ['SUPERADMIN'] },
    });

    expect(mockUsersApiService.updateUser).toHaveBeenCalledWith(1, expect.any(Object));
    expect(mockAuthService.getProfile).toHaveBeenCalled();
  });

  it('should have modal-sized filter fields, remove Limpiar button, and have full-width Aplicar Filtros button', () => {
    const filterButton = Array.from(fixture.nativeElement.querySelectorAll('button'))
      .find((b: any) => b.textContent?.includes('Filtros')) as HTMLButtonElement;
    filterButton?.click();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const filterContainer = compiled.querySelector('[filter-content]');
    expect(filterContainer).toBeTruthy();

    const buttons = Array.from(filterContainer?.querySelectorAll('button') || []);
    const hasLimpiarButton = buttons.some((b) => b.textContent?.trim() === 'Limpiar');
    expect(hasLimpiarButton).toBe(false);

    const applyButton = buttons.find((b) => b.textContent?.trim() === 'Aplicar Filtros');
    expect(applyButton).toBeTruthy();
    expect(applyButton?.classList.contains('w-full')).toBe(true);

    const inputs = Array.from(filterContainer?.querySelectorAll('input') || []);
    inputs.forEach((input) => {
      expect(input.className).toContain('min-h-[44px]');
      expect(input.className).toContain('text-sm');
    });

    const selects = Array.from(filterContainer?.querySelectorAll('select') || []);
    selects.forEach((select) => {
      expect(select.className).toContain('min-h-[44px]');
      expect(select.className).toContain('text-sm');
    });
  });
});
