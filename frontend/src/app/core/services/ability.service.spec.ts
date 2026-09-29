import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { beforeEach, describe, expect, it } from 'vitest';
import { AbilityService } from './ability.service';
import { AuthService } from './auth.service';

describe('AbilityService', () => {
  let abilityService: AbilityService;
  let authService: AuthService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [AbilityService, AuthService, provideHttpClient(), provideHttpClientTesting()],
    });

    abilityService = TestBed.inject(AbilityService);
    authService = TestBed.inject(AuthService);
  });

  it('should return false when user is not authenticated', () => {
    expect(abilityService.can('read', 'Product')).toBe(false);
  });

  it('should evaluate permissions from user roles and direct permissions', () => {
    authService.currentUser.set({
      id: 1,
      email: 'admin@test.com',
      fullName: 'Admin',
      isActive: true,
      permissions: [{ id: 1, action: 'read', subject: 'Product' }],
      roles: [
        {
          id: 1,
          name: 'MANAGER',
          permissions: [{ id: 2, action: 'create', subject: 'Sale' }],
        },
      ],
    });

    expect(abilityService.can('read', 'Product')).toBe(true);
    expect(abilityService.can('create', 'Sale')).toBe(true);
    expect(abilityService.can('delete', 'Product')).toBe(false);
  });

  it('should allow everything for ADMIN or SUPERADMIN role', () => {
    authService.currentUser.set({
      id: 1,
      email: 'admin@test.com',
      fullName: 'Super Admin',
      isActive: true,
      roles: [{ id: 1, name: 'ADMIN' }],
    });

    expect(abilityService.can('read', 'User')).toBe(true);
    expect(abilityService.can('delete', 'Product')).toBe(true);
    expect(abilityService.can('manage', 'WorkflowTransition')).toBe(true);
  });

  it('should allow Dashboard subject for any authenticated user', () => {
    authService.currentUser.set({
      id: 2,
      email: 'user@test.com',
      fullName: 'Standard User',
      isActive: true,
      roles: [{ id: 2, name: 'USER' }],
    });

    expect(abilityService.can('read', 'Dashboard')).toBe(true);
    expect(abilityService.can('read', 'AuditLog')).toBe(false);
  });
});
