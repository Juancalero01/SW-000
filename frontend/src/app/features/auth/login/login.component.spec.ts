import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let mockAuthService: any;
  let mockNotificationService: any;
  let router: Router;

  beforeEach(async () => {
    mockAuthService = {
      login: vi.fn(),
      isAuthenticated: vi.fn().mockReturnValue(false),
    };

    mockNotificationService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParams: { returnUrl: '/users' } },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockImplementation(() => Promise.resolve(true));
    fixture.detectChanges();
  });

  it('should create login component without reCAPTCHA', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-ui-captcha')).toBeNull();
  });

  it('should invalidate empty form and mark controls as touched on submit', () => {
    component.onSubmit();
    fixture.detectChanges();

    expect(component.loginForm.invalid).toBe(true);
    expect(mockAuthService.login).not.toHaveBeenCalled();
    expect(component.getEmailError()).toBe('El correo electrónico es requerido');
    expect(component.getPasswordError()).toBe('La contraseña es requerida');
  });

  it('should validate invalid email format', () => {
    component.loginForm.controls.email.setValue('invalid-email');
    component.loginForm.controls.email.markAsTouched();
    fixture.detectChanges();

    expect(component.getEmailError()).toBe('Ingresa un correo electrónico válido');
  });

  it('should toggle password visibility signal', () => {
    expect(component.showPassword()).toBe(false);
    component.togglePasswordVisibility();
    expect(component.showPassword()).toBe(true);
  });

  it('should execute login successfully and navigate to returnUrl without requiring reCAPTCHA', () => {
    mockAuthService.login.mockReturnValue(
      of({ accessToken: 'test-token', user: { id: 1, email: 'user@test.com' } }),
    );

    component.loginForm.setValue({
      email: 'user@test.com',
      password: 'password123',
    });

    component.onSubmit();

    expect(mockAuthService.login).toHaveBeenCalledWith({
      email: 'user@test.com',
      password: 'password123',
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/users');
    expect(component.isLoading()).toBe(false);
  });

  it('should handle login error and display error message', () => {
    mockAuthService.login.mockReturnValue(
      throwError(() => ({ error: { message: 'Credenciales inválidas' } })),
    );

    component.loginForm.setValue({
      email: 'wrong@test.com',
      password: 'wrongpassword',
    });

    component.onSubmit();

    expect(mockAuthService.login).toHaveBeenCalled();
    expect(component.errorMessage()).toBe('Credenciales inválidas');
    expect(component.isLoading()).toBe(false);
  });
});
