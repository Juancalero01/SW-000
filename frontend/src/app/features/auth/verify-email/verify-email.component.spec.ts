import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VerifyEmailComponent } from './verify-email.component';
import { AuthService } from '../../../core/services/auth.service';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi, beforeEach } from 'vitest';

describe('VerifyEmailComponent', () => {
  let fixture: ComponentFixture<VerifyEmailComponent>;
  let component: VerifyEmailComponent;
  let mockAuthService: any;
  let router: Router;
  let mockActivatedRoute: { snapshot: { queryParams: Record<string, string> } };

  beforeEach(async () => {
    mockAuthService = {
      verifyEmail: vi.fn(),
      isAuthenticated: vi.fn().mockReturnValue(false),
    };

    mockActivatedRoute = {
      snapshot: { queryParams: {} },
    };

    await TestBed.configureTestingModule({
      imports: [VerifyEmailComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockImplementation(() => Promise.resolve(true));
  });

  it('should create verify email component', () => {
    fixture = TestBed.createComponent(VerifyEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display error when email or token are missing in query params', () => {
    mockActivatedRoute.snapshot.queryParams = {};
    fixture = TestBed.createComponent(VerifyEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isVerified()).toBe(false);
    expect(component.errorMessage()).toContain('El enlace de verificación es inválido');
    expect(mockAuthService.verifyEmail).not.toHaveBeenCalled();
  });

  it('should automatically verify email on init when email and token are provided', () => {
    mockActivatedRoute.snapshot.queryParams = {
      email: 'test@example.com',
      token: 'valid-token',
    };
    mockAuthService.verifyEmail.mockReturnValue(of({ message: 'OK' }));

    fixture = TestBed.createComponent(VerifyEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(mockAuthService.verifyEmail).toHaveBeenCalledWith('test@example.com', 'valid-token');
    expect(component.isVerified()).toBe(true);
    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toBeNull();
  });

  it('should handle verification error on init when verification fails', () => {
    mockActivatedRoute.snapshot.queryParams = {
      email: 'test@example.com',
      token: 'invalid-token',
    };
    mockAuthService.verifyEmail.mockReturnValue(
      throwError(() => ({ error: { message: 'Token expirado' } })),
    );

    fixture = TestBed.createComponent(VerifyEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(mockAuthService.verifyEmail).toHaveBeenCalledWith('test@example.com', 'invalid-token');
    expect(component.isVerified()).toBe(false);
    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toBe('Token expirado');
  });

  it('should navigate to dashboard if authenticated on goToLogin()', () => {
    mockAuthService.isAuthenticated.mockReturnValue(true);
    fixture = TestBed.createComponent(VerifyEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.goToLogin();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('should navigate to login if not authenticated on goToLogin()', () => {
    mockAuthService.isAuthenticated.mockReturnValue(false);
    fixture = TestBed.createComponent(VerifyEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.goToLogin();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/auth/login');
  });
});

