import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { beforeEach, describe, expect, it } from 'vitest';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
  });

  it('should attach Bearer token when authenticated and calling API', () => {
    authService.token.set('my-secret-jwt');

    http.get('http://localhost:3000/api/products').subscribe();

    const req = httpMock.expectOne('http://localhost:3000/api/products');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-secret-jwt');
    req.flush([]);
  });

  it('should NOT attach Bearer token when not authenticated', () => {
    authService.token.set(null);

    http.get('http://localhost:3000/api/products').subscribe();

    const req = httpMock.expectOne('http://localhost:3000/api/products');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });
});
