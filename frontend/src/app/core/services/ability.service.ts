import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Permission } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AbilityService {
  private readonly authService = inject(AuthService);

  readonly permissions = computed<Permission[]>(() => {
    const user = this.authService.currentUser();
    if (!user) {
      return [];
    }

    const directPermissions = user.permissions || [];
    const rolePermissions = (user.roles || []).flatMap((r) => r.permissions || []);
    return [...directPermissions, ...rolePermissions];
  });

  can(action: string, subject: string): boolean {
    const user = this.authService.currentUser();
    if (!user) {
      return false;
    }

    // Dashboard and 'all' subjects are accessible to all authenticated users
    if (subject === 'Dashboard' || subject === 'all') {
      return true;
    }

    // Admin role bypass
    const isAdmin = (user.roles || []).some((r) => {
      const roleName = (r.name || '').toUpperCase();
      return roleName === 'ADMIN' || roleName === 'SUPERADMIN';
    });

    if (isAdmin) {
      return true;
    }

    const perms = this.permissions();

    // Direct match or 'all' match
    const hasPermission = perms.some((p) => {
      const matchAction = p.action === action || p.action === 'manage' || p.action === 'all';
      const matchSubject = p.subject === subject || p.subject === 'all';
      return matchAction && matchSubject && !p.inverted;
    });

    return hasPermission;
  }
}
