import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserModalComponent } from './user-modal.component';
import { SimpleChange, signal } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { Role, User } from '../../../../core/models/user.model';

describe('UserModalComponent', () => {
  let fixture: ComponentFixture<UserModalComponent>;
  let component: UserModalComponent;

  const mockCurrentUser = signal<User | null>(null);
  const mockAuthService = {
    currentUser: mockCurrentUser,
  };

  const sampleRoles: Role[] = [
    { id: 1, name: 'SUPERADMIN', description: 'Superadministrador' },
    { id: 2, name: 'ADMIN', description: 'Administrador' },
    { id: 3, name: 'USER', description: 'Usuario Estándar' },
    { id: 4, name: 'AUDITOR', description: 'Auditor' },
  ];

  beforeEach(async () => {
    mockCurrentUser.set(null);

    await TestBed.configureTestingModule({
      imports: [UserModalComponent],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compileComponents();

    fixture = TestBed.createComponent(UserModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create modal component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form for new user mode with required roleName empty', () => {
    fixture.componentRef.setInput('userToEdit', null);
    component.ngOnChanges({
      userToEdit: new SimpleChange(null, null, true),
    });
    fixture.detectChanges();

    expect(component.userForm.get('fullName')?.value).toBe('');
    expect(component.userForm.get('roleName')?.value).toBe('');
    expect(component.userForm.get('roleName')?.valid).toBe(false);
    expect(component.userForm.valid).toBe(false);
  });

  it('should populate form when editing user', () => {
    const mockUser = {
      id: 5,
      email: 'john@example.com',
      fullName: 'John Doe',
      isActive: true,
      approvalStatus: 'APPROVED' as const,
      roles: [{ id: 1, name: 'ADMIN' }],
    };

    fixture.componentRef.setInput('userToEdit', mockUser);
    component.ngOnChanges({
      userToEdit: new SimpleChange(null, mockUser, false),
    });
    fixture.detectChanges();

    expect(component.userForm.get('fullName')?.value).toBe('John Doe');
    expect(component.userForm.get('email')?.value).toBe('john@example.com');
    expect(component.userForm.get('roleName')?.value).toBe('ADMIN');
  });

  it('should validate 255 characters for fullName and email, and 50 characters for phoneNumber', () => {
    const longString256 = 'a'.repeat(256);

    // FullName validation
    component.userForm.get('fullName')?.setValue(longString256);
    expect(component.userForm.get('fullName')?.errors?.['maxlength']).toBeTruthy();

    component.userForm.get('fullName')?.setValue('Juan Perez');
    expect(component.userForm.get('fullName')?.valid).toBe(true);

    // Email validation
    component.userForm.get('email')?.setValue(`${'a'.repeat(250)}@test.com`);
    expect(component.userForm.get('email')?.errors?.['maxlength']).toBeTruthy();

    component.userForm.get('email')?.setValue('valido@test.com');
    expect(component.userForm.get('email')?.valid).toBe(true);

    // PhoneNumber validation
    const longPhone51 = '+54' + '9'.repeat(49);
    component.userForm.get('phoneNumber')?.setValue(longPhone51);
    expect(component.userForm.get('phoneNumber')?.errors?.['maxlength']).toBeTruthy();

    component.userForm.get('phoneNumber')?.setValue('+54 9 11 1234 5678');
    expect(component.userForm.get('phoneNumber')?.valid).toBe(true);
  });

  it('should accurately map roles provided by availableRoles input without client-side hardcoding or filtering', () => {
    fixture.componentRef.setInput('availableRoles', sampleRoles);
    fixture.detectChanges();

    const options = component.roleOptions();
    const roleValues = options.map((opt) => opt.value);

    expect(roleValues).toHaveLength(4);
    expect(roleValues).toEqual(['SUPERADMIN', 'ADMIN', 'USER', 'AUDITOR']);
  });

  it('should return empty options when availableRoles is empty without generating synthetic fallback roles', () => {
    fixture.componentRef.setInput('availableRoles', []);
    fixture.detectChanges();

    const options = component.roleOptions();
    expect(options).toEqual([]);
  });

  it('should trigger confirm dialog on submit and emit saveUser when confirmed', () => {
    let emitted: any = null;
    component.saveUser.subscribe((val) => (emitted = val));

    component.userForm.patchValue({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      roleName: 'USER',
    });

    component.onSubmit();
    expect(component.showSubmitConfirm()).toBe(true);
    expect(emitted).toBeNull();

    component.onConfirmSave();
    expect(component.showSubmitConfirm()).toBe(false);
    expect(emitted).not.toBeNull();
    expect(emitted.isEdit).toBe(false);
    expect(emitted.payload.fullName).toBe('Jane Doe');
    expect(emitted.payload.email).toBe('jane@example.com');
  });

  it('should close directly if form is pristine without changes when onClose is called', () => {
    let closed = false;
    component.closeModal.subscribe(() => (closed = true));

    component.onClose();

    expect(component.showCancelConfirm()).toBe(false);
    expect(closed).toBe(true);
  });

  it('should prompt cancel confirmation if form is modified and has changes when onClose is called', () => {
    let closed = false;
    component.closeModal.subscribe(() => (closed = true));

    component.userForm.patchValue({ fullName: 'Nuevo Nombre' });
    component.userForm.markAsDirty();
    component.onClose();

    expect(component.showCancelConfirm()).toBe(true);
    expect(closed).toBe(false);

    component.onConfirmDiscard();
    expect(component.showCancelConfirm()).toBe(false);
    expect(closed).toBe(true);
  });

  it('should trigger approval confirmation and emit approveUser when confirmed', () => {
    const mockUser = {
      id: 20,
      email: 'pending@example.com',
      fullName: 'Pending User',
      isActive: false,
      approvalStatus: 'PENDING' as const,
      roles: [{ id: 3, name: 'USER' }],
    };

    fixture.componentRef.setInput('userToEdit', mockUser);
    component.ngOnChanges({ userToEdit: new SimpleChange(null, mockUser, false) });
    fixture.detectChanges();

    let approvedId: number | null = null;
    component.approveUser.subscribe((id) => (approvedId = id));

    component.onOpenApproveConfirm();
    expect(component.showApproveConfirm()).toBe(true);

    component.onConfirmApprove();
    expect(component.showApproveConfirm()).toBe(false);
    expect(approvedId).toBe(20);
  });

  it('should open rejection modal, validate reason, and emit rejectUser when confirmed', () => {
    const mockUser = {
      id: 21,
      email: 'candidate@example.com',
      fullName: 'Candidate User',
      isActive: false,
      approvalStatus: 'PENDING' as const,
      roles: [{ id: 3, name: 'USER' }],
    };

    fixture.componentRef.setInput('userToEdit', mockUser);
    component.ngOnChanges({ userToEdit: new SimpleChange(null, mockUser, false) });
    fixture.detectChanges();

    let rejectedPayload: { id: number; reason: string } | null = null;
    component.rejectUser.subscribe((payload) => (rejectedPayload = payload));

    component.onOpenRejectModal();
    expect(component.showRejectModal()).toBe(true);

    // Empty reason should show error and not emit
    component.onConfirmReject();
    expect(component.rejectReasonError()).toBe('Debes indicar el motivo del rechazo.');
    expect(rejectedPayload).toBeNull();

    // Valid reason should emit
    component.rejectReason.set('No cumple con los requisitos de la organización.');
    component.onConfirmReject();
    expect(component.showRejectModal()).toBe(false);
    expect(rejectedPayload).toEqual({
      id: 21,
      reason: 'No cumple con los requisitos de la organización.',
    });
  });

  it('should govern activation toggle: Admin can only toggle if approved, Superadmin has full access', () => {
    // 1. Current user is ADMIN
    mockCurrentUser.set({
      id: 1,
      email: 'admin@company.com',
      fullName: 'Admin',
      isActive: true,
      roles: [{ id: 2, name: 'ADMIN' }],
    });

    const pendingUser = {
      id: 30,
      email: 'p@test.com',
      fullName: 'P',
      isActive: false,
      approvalStatus: 'PENDING' as const,
      roles: [{ id: 3, name: 'USER' }],
    };
    fixture.componentRef.setInput('userToEdit', pendingUser);
    component.ngOnChanges({ userToEdit: new SimpleChange(null, pendingUser, false) });
    fixture.detectChanges();

    // Admin cannot toggle pending user
    expect(component.canToggleActive()).toBe(false);

    // Admin can toggle approved user
    component.userForm.patchValue({ approvalStatus: 'APPROVED' });
    expect(component.canToggleActive()).toBe(true);

    // 2. Current user is SUPERADMIN -> Full access always
    mockCurrentUser.set({
      id: 99,
      email: 'super@company.com',
      fullName: 'Superadmin',
      isActive: true,
      roles: [{ id: 1, name: 'SUPERADMIN' }],
    });
    component.userForm.patchValue({ approvalStatus: 'PENDING' });
    expect(component.canToggleActive()).toBe(true);

    component.userForm.patchValue({ approvalStatus: 'REJECTED' });
    expect(component.canToggleActive()).toBe(true);
  });

  it('should govern user deletion: Admin can ONLY delete rejected users, Superadmin can delete any', () => {
    // 1. Current user is ADMIN
    mockCurrentUser.set({
      id: 1,
      email: 'admin@company.com',
      fullName: 'Admin',
      isActive: true,
      roles: [{ id: 2, name: 'ADMIN' }],
    });

    // Approved user -> Admin CANNOT delete
    component.userForm.patchValue({ approvalStatus: 'APPROVED' });
    expect(component.canDeleteUserAccount()).toBe(false);

    // Pending user -> Admin CANNOT delete
    component.userForm.patchValue({ approvalStatus: 'PENDING' });
    expect(component.canDeleteUserAccount()).toBe(false);

    // Rejected user -> Admin CAN delete (enabled by rejection)
    component.userForm.patchValue({ approvalStatus: 'REJECTED' });
    expect(component.canDeleteUserAccount()).toBe(true);

    // 2. Current user is SUPERADMIN -> Full access
    mockCurrentUser.set({
      id: 99,
      email: 'super@company.com',
      fullName: 'Superadmin',
      isActive: true,
      roles: [{ id: 1, name: 'SUPERADMIN' }],
    });

    component.userForm.patchValue({ approvalStatus: 'APPROVED' });
    expect(component.canDeleteUserAccount()).toBe(true);

    component.userForm.patchValue({ approvalStatus: 'PENDING' });
    expect(component.canDeleteUserAccount()).toBe(true);

    component.userForm.patchValue({ approvalStatus: 'REJECTED' });
    expect(component.canDeleteUserAccount()).toBe(true);
  });

  it('should completely remove credential management card and password manual input', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('userToEdit', {
      id: 10,
      email: 'user@test.com',
      fullName: 'Test User',
      isActive: true,
      approvalStatus: 'APPROVED',
      roles: [{ id: 3, name: 'USER' }],
    });
    component.ngOnChanges({ userToEdit: new SimpleChange(null, component.userToEdit(), false) });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Gestión de Credenciales');
    expect(compiled.textContent).not.toContain('Enviar Email de Restablecimiento');
    expect(compiled.textContent).not.toContain('Definir Contraseña Manualmente');
  });
});
