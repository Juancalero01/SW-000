import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthService } from '../../../core/services/auth.service';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi, beforeEach } from 'vitest';

describe('ForgotPasswordComponent', () => {
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let component: ForgotPasswordComponent;
  let mockAuthService: any;
  let mockNotificationService: any;
  let router: Router;

  beforeEach(async () => {
    mockAuthService = {
      forgotPassword: vi.fn(),
      isAuthenticated: vi.fn().mockReturnValue(false),
    };

    mockNotificationService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockImplementation(() => Promise.resolve(true));
    vi.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));
    fixture.detectChanges();
  });

  it('should create forgot password component', () => {
    expect(component).toBeTruthy();
  });

  it('should invalidate empty form on submit', () => {
    component.onSubmit();
    fixture.detectChanges();

    expect(component.forgotForm.invalid).toBe(true);
    expect(mockAuthService.forgotPassword).not.toHaveBeenCalled();
    expect(component.getEmailError()).toBe('El correo electrónico es requerido');
  });

  it('should submit request successfully and set isSubmitted to true', () => {
    mockAuthService.forgotPassword.mockReturnValue(of({ message: 'OK' }));

    component.forgotForm.controls.email.setValue('user@example.com');
    component.recaptchaToken.set('test-token');
    component.onSubmit();

    expect(mockAuthService.forgotPassword).toHaveBeenCalledWith('user@example.com', 'test-token');
    expect(component.isSubmitted()).toBe(true);
  });

  it('should handle error when submission fails and reset captcha token', () => {
    mockAuthService.forgotPassword.mockReturnValue(
      throwError(() => ({ error: { message: 'Error de servidor' } })),
    );

    component.forgotForm.controls.email.setValue('user@example.com');
    component.recaptchaToken.set('test-token');
    component.onSubmit();

    expect(component.errorMessage()).toBe('Error de servidor');
    expect(component.recaptchaToken()).toBeNull();
  });

  it('should clear recaptchaToken when captcha expires', () => {
    component.recaptchaToken.set('existing-token');
    component.onCaptchaExpired();
    expect(component.recaptchaToken()).toBeNull();
  });

});
