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

  it('should pass role and status filters to API when column filters are applied', () => {
    component.onRoleSelectFilter('ADMIN');
    component.onStatusSelectFilter('INACTIVE');
    fixture.detectChanges();

    expect(component.selectedRoleFilterApplied()).toBe('ADMIN');
    expect(component.selectedStatusFilterApplied()).toBe('INACTIVE');
    expect(mockUsersApiService.getUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        roleName: 'ADMIN',
        isActive: false,
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

  it('should have table search input and column filters with display menu', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const searchInput = compiled.querySelector('input[placeholder*="Buscar"]') as HTMLInputElement;
    expect(searchInput).toBeTruthy();

    component.onSearchInput('Juan');
    fixture.detectChanges();
    expect(component.searchQueryApplied()).toBe('Juan');
    expect(mockUsersApiService.getUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'Juan',
      }),
    );

    component.onRoleSelectFilter('ADMIN');
    fixture.detectChanges();
    expect(component.selectedRoleFilterApplied()).toBe('ADMIN');
    expect(mockUsersApiService.getUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        roleName: 'ADMIN',
      }),
    );

    component.onClearAllFilters();
    fixture.detectChanges();
    expect(component.searchQueryApplied()).toBe('');
    expect(component.selectedRoleFilterApplied()).toBe('');
  });
});
