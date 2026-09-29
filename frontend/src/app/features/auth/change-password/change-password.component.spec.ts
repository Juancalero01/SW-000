import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangePasswordComponent } from './change-password.component';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('ChangePasswordComponent', () => {
  let fixture: ComponentFixture<ChangePasswordComponent>;
  let component: ChangePasswordComponent;

  let mockAuthService = {
    changePassword: vi.fn(),
  };

  let mockNotificationService = {
    success: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(async () => {
    mockAuthService.changePassword.mockReset();
    mockNotificationService.success.mockReset();
    mockNotificationService.error.mockReset();

    await TestBed.configureTestingModule({
      imports: [ChangePasswordComponent],
      providers: [
        provideRouter([
          { path: 'dashboard', component: ChangePasswordComponent },
        ]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangePasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create change password component', () => {
    expect(component).toBeTruthy();
  });

  it('should validate password mismatch', () => {
    component.form.patchValue({
      currentPassword: 'OldPassword1!',
      newPassword: 'NewPassword1!',
      confirmPassword: 'DifferentPassword!',
    });

    expect(component.form.invalid).toBe(true);
    expect(component.form.hasError('passwordMismatch')).toBe(true);
  });

  it('should call changePassword and notify on success', () => {
    mockAuthService.changePassword.mockReturnValue(of({ message: 'Success' }));

    component.form.patchValue({
      currentPassword: 'OldPassword1!',
      newPassword: 'NewPassword1!',
      confirmPassword: 'NewPassword1!',
    });

    component.onSubmit();

    expect(mockAuthService.changePassword).toHaveBeenCalledWith({
      currentPassword: 'OldPassword1!',
      newPassword: 'NewPassword1!',
    });
  });

  it('should correctly evaluate password requirement helper getters for the popover', () => {
    // Initial / empty state
    expect(component.hasMinLength).toBe(false);
    expect(component.hasUpperAndLower).toBe(false);
    expect(component.hasNumberOrSymbol).toBe(false);

    // Only lowercase short
    component.form.controls.newPassword.setValue('abc');
    expect(component.hasMinLength).toBe(false);
    expect(component.hasUpperAndLower).toBe(false);
    expect(component.hasNumberOrSymbol).toBe(false);

    // 6 chars lowercase
    component.form.controls.newPassword.setValue('abcdef');
    expect(component.hasMinLength).toBe(true);
    expect(component.hasUpperAndLower).toBe(false);
    expect(component.hasNumberOrSymbol).toBe(false);

    // Mixed case
    component.form.controls.newPassword.setValue('Abcdef');
    expect(component.hasMinLength).toBe(true);
    expect(component.hasUpperAndLower).toBe(true);
    expect(component.hasNumberOrSymbol).toBe(false);

    // Mixed case + number/symbol
    component.form.controls.newPassword.setValue('Abcdef1!');
    expect(component.hasMinLength).toBe(true);
    expect(component.hasUpperAndLower).toBe(true);
    expect(component.hasNumberOrSymbol).toBe(true);
    expect(component.requirements).toEqual([
      { id: 'min-length', label: 'Mínimo 6 caracteres', valid: true },
      { id: 'upper-lower', label: 'Mayúsculas y minúsculas', valid: true },
      { id: 'number-symbol', label: 'Al menos un número o símbolo', valid: true },
    ]);
  });
});
