import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResetPasswordComponent } from './reset-password.component';
import { AuthService } from '../../../core/services/auth.service';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi, beforeEach } from 'vitest';

describe('ResetPasswordComponent', () => {
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let component: ResetPasswordComponent;
  let mockAuthService: any;
  let router: Router;
  let mockActivatedRoute: { snapshot: { queryParams: Record<string, string> } };

  beforeEach(async () => {
    mockAuthService = {
      resetPassword: vi.fn(),
      isAuthenticated: vi.fn().mockReturnValue(false),
    };

    mockActivatedRoute = {
      snapshot: { queryParams: { email: 'user@example.com', token: 'token123' } },
    };

    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockImplementation(() => Promise.resolve(true));
    fixture.detectChanges();
  });

  it('should create reset password component, populate form from query params and disable email field', () => {
    expect(component).toBeTruthy();
    expect(component.resetForm.controls.email.value).toBe('user@example.com');
    expect(component.resetForm.controls.email.disabled).toBe(true);
    expect(component.resetForm.controls.token.value).toBe('token123');
    expect(component.hasToken()).toBe(true);
  });

  it('should display error when email or token are missing in query params', () => {
    mockActivatedRoute.snapshot.queryParams = {};
    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.hasToken()).toBe(false);
    expect(component.errorMessage()).toContain('El enlace de restablecimiento es inválido');
  });

  it('should show progress spinner when isVerifying is true', () => {
    component.isVerifying.set(true);
    fixture.detectChanges();

    const spinner = fixture.nativeElement.querySelector('p-progress-spinner');
    expect(spinner).toBeTruthy();
  });

  it('should reset password successfully', () => {
    mockAuthService.resetPassword.mockReturnValue(of({ message: 'OK' }));

    component.resetForm.controls.newPassword.setValue('newpassword123');
    component.resetForm.controls.confirmPassword.setValue('newpassword123');

    component.onSubmit();

    expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
      'user@example.com',
      'token123',
      'newpassword123',
    );
    expect(component.isSuccess()).toBe(true);
  });

  it('should handle reset password error', () => {
    mockAuthService.resetPassword.mockReturnValue(
      throwError(() => ({ error: { message: 'Token expirado' } })),
    );

    component.resetForm.controls.newPassword.setValue('newpassword123');
    component.resetForm.controls.confirmPassword.setValue('newpassword123');

    component.onSubmit();

    expect(component.errorMessage()).toBe('Token expirado');
  });

  it('should not submit if form is invalid', () => {
    component.resetForm.controls.newPassword.setValue('');
    component.onSubmit();
    expect(mockAuthService.resetPassword).not.toHaveBeenCalled();
  });

  it('should return validation error messages for new password and confirm password', () => {
    component.resetForm.controls.newPassword.markAsTouched();
    expect(component.getNewPasswordError()).toBe('La nueva contraseña es requerida');

    component.resetForm.controls.newPassword.setValue('123');
    expect(component.getNewPasswordError()).toBe('La contraseña debe tener al menos 6 caracteres');

    component.resetForm.controls.confirmPassword.markAsTouched();
    expect(component.getConfirmPasswordError()).toBe('Confirma tu nueva contraseña');

    component.resetForm.controls.confirmPassword.setValue('different123');
    expect(component.getConfirmPasswordError()).toBe('Las contraseñas no coinciden');
  });

  it('should correctly evaluate password requirements helper getters for the popover', () => {
    expect(component.hasMinLength).toBe(false);
    expect(component.hasUpperAndLower).toBe(false);
    expect(component.hasNumberOrSymbol).toBe(false);

    component.resetForm.controls.newPassword.setValue('Abc123!');
    expect(component.hasMinLength).toBe(true);
    expect(component.hasUpperAndLower).toBe(true);
    expect(component.hasNumberOrSymbol).toBe(true);
    expect(component.requirements).toEqual([
      { id: 'min-length', label: 'Mínimo 6 caracteres', valid: true },
      { id: 'upper-lower', label: 'Mayúsculas y minúsculas', valid: true },
      { id: 'number-symbol', label: 'Al menos un número o símbolo', valid: true },
    ]);
  });

  it('should navigate to dashboard if authenticated on goToLogin()', () => {
    mockAuthService.isAuthenticated.mockReturnValue(true);
    component.goToLogin();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('should navigate to login if not authenticated on goToLogin()', () => {
    mockAuthService.isAuthenticated.mockReturnValue(false);
    component.goToLogin();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/auth/login');
  });
});
