import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { beforeEach, describe, expect, it } from 'vitest';
import { UsersApiService, PaginatedUsersResponse } from './users-api.service';
import { User, Role } from '../../../core/models/user.model';

describe('UsersApiService', () => {
  let service: UsersApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UsersApiService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(UsersApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch paginated users list with query parameters', () => {
    const mockResponse: PaginatedUsersResponse = {
      data: [{ id: 1, email: 'admin@test.com', fullName: 'Admin User', isActive: true }],
      total: 1,
      page: 1,
      lastPage: 1,
    };

    service.getUsers({ page: 1, limit: 10, search: 'Admin' }).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne((r) => r.url === 'http://localhost:3000/api/users');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('limit')).toBe('10');
    expect(req.request.params.get('search')).toBe('Admin');
    req.flush(mockResponse);
  });

  it('should create a new user', () => {
    const payload = { fullName: 'New User', email: 'new@test.com', password: 'password123', roles: ['USER'] };
    const mockCreatedUser: User = { id: 2, fullName: 'New User', email: 'new@test.com', isActive: true };

    service.createUser(payload).subscribe((res) => {
      expect(res).toEqual(mockCreatedUser);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/users');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockCreatedUser);
  });

  it('should update user information and roles', () => {
    const payload = { fullName: 'Updated Name', roles: ['ADMIN'] };
    const mockUpdatedUser: User = { id: 2, fullName: 'Updated Name', email: 'new@test.com', isActive: true };

    service.updateUser(2, payload).subscribe((res) => {
      expect(res).toEqual(mockUpdatedUser);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/users/2');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(payload);
    req.flush(mockUpdatedUser);
  });

  it('should soft delete user', () => {
    service.deleteUser(2).subscribe((res) => {
      expect(res.message).toContain('eliminado');
    });

    const req = httpMock.expectOne('http://localhost:3000/api/users/2');
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Usuario #2 eliminado correctamente (Soft Delete)' });
  });

  it('should fetch available roles', () => {
    const mockRoles: Role[] = [{ id: 1, name: 'ADMIN' }, { id: 2, name: 'USER' }];

    service.getAvailableRoles().subscribe((roles) => {
      expect(roles.length).toBe(2);
      expect(roles).toEqual(mockRoles);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/roles');
    expect(req.request.method).toBe('GET');
    req.flush(mockRoles);
  });

  it('should fetch reset password status for user', () => {
    service.getResetPasswordStatus(5).subscribe((res) => {
      expect(res.hasActiveToken).toBe(true);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/users/5/reset-password-status');
    expect(req.request.method).toBe('GET');
    req.flush({ hasActiveToken: true });
  });

  it('should send password reset email', () => {
    service.sendPasswordResetEmail(5).subscribe((res) => {
      expect(res.message).toContain('enviado');
    });

    const req = httpMock.expectOne('http://localhost:3000/api/users/5/reset-password-email');
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Correo de restablecimiento enviado exitosamente' });
  });
});
