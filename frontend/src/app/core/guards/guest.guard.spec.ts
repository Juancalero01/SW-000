import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { guestGuard } from './guest.guard';
import { AuthService } from '../services/auth.service';

describe('guestGuard', () => {
  let mockAuthService: any;
  let router: Router;

  beforeEach(() => {
    mockAuthService = {
      isAuthenticated: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('should allow access if user is not authenticated', () => {
    mockAuthService.isAuthenticated.mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));

    expect(result).toBe(true);
  });

  it('should redirect to dashboard if user is authenticated', () => {
    mockAuthService.isAuthenticated.mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));

    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/dashboard');
  });
});
