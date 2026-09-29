import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    const user = authService.currentUser();
    const isChangePasswordRoute = state.url.startsWith('/auth/change-password');

    if (user?.mustChangePassword && !isChangePasswordRoute) {
      return router.createUrlTree(['/auth/change-password']);
    }

    if (!user?.mustChangePassword && isChangePasswordRoute) {
      return router.createUrlTree(['/dashboard']);
    }

    return true;
  }

  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url },
  });
};
