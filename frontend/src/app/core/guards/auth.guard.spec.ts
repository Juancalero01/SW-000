import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: Router,
          useValue: {
            createUrlTree: vi.fn().mockImplementation((path, extras) => ({ path, extras })),
          },
        },
      ],
    });

    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  it('should allow access when user is authenticated', () => {
    authService.token.set('valid-token');
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, { url: '/dashboard' } as any),
    );
    expect(result).toBe(true);
  });

  it('should redirect to /login when user is not authenticated', () => {
    authService.token.set(null);
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, { url: '/dashboard' } as any),
    );

    expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: { returnUrl: '/dashboard' },
    });
    expect(result).toEqual({ path: ['/auth/login'], extras: { queryParams: { returnUrl: '/dashboard' } } });
  });
});
