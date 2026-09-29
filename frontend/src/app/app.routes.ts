import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './core/layouts/auth-layout/auth-layout.component';
import { MainLayoutComponent } from './core/layouts/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { VerifyEmailComponent } from './features/auth/verify-email/verify-email.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password.component';
import { ChangePasswordComponent } from './features/auth/change-password/change-password.component';

export const routes: Routes = [
  {
    path: 'auth/change-password',
    component: AuthLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: ChangePasswordComponent,
      },
    ],
  },
  {
    path: 'auth',
    component: AuthLayoutComponent,
    canActivate: [guestGuard],
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', component: LoginComponent },
      { path: 'register', redirectTo: 'login' },
      { path: 'verify-email', component: VerifyEmailComponent },
      { path: 'forgot-password', component: ForgotPasswordComponent },
      { path: 'reset-password', component: ResetPasswordComponent },
    ],
  },
  {
    path: 'login',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
  {
    path: 'register',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'users',
        loadChildren: () =>
          import('./features/users/users.routes').then((m) => m.USERS_ROUTES),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
