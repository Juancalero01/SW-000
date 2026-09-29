import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from './auth.service';
import { AuthResponse, LoginDto } from '../models/auth.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockAuthResponse: AuthResponse = {
    accessToken: 'test-jwt-token',
    refreshToken: 'test-refresh-token',
    user: {
      id: 1,
      email: 'test@example.com',
      fullName: 'Test User',
      isActive: true,
    },
  };

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideRouter([{ path: 'auth/login', component: class {} }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should initialize with null token when localstorage is empty', () => {
    expect(service.token()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should login and set session with refresh token', () => {
    const credentials: LoginDto = { email: 'test@example.com', password: 'password123' };

    service.login(credentials).subscribe((res) => {
      expect(res).toEqual(mockAuthResponse);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(mockAuthResponse);

    expect(service.token()).toBe('test-jwt-token');
    expect(service.refreshTokenSignal()).toBe('test-refresh-token');
    expect(service.currentUser()?.email).toBe('test@example.com');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should request forgot password email token', () => {
    service.forgotPassword('test@example.com').subscribe((res) => {
      expect(res.message).toContain('recibira las instrucciones');
    });

    const req = httpMock.expectOne('http://localhost:3000/api/auth/forgot-password');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'test@example.com' });
    req.flush({ message: 'recibira las instrucciones' });
  });

  it('should reset password using token', () => {
    service.resetPassword('test@example.com', 'token123', 'newpass123').subscribe((res) => {
      expect(res.message).toContain('restablecida exitosamente');
    });

    const req = httpMock.expectOne('http://localhost:3000/api/auth/reset-password');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      email: 'test@example.com',
      token: 'token123',
      newPassword: 'newpass123',
    });
    req.flush({ message: 'restablecida exitosamente' });
  });

  it('should logout and clear session', () => {
    service.setSession(mockAuthResponse);
    expect(service.isAuthenticated()).toBe(true);

    service.logout();
    expect(service.token()).toBeNull();
    expect(service.refreshTokenSignal()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });
});
