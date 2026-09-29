import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import {
  AuthResponse,
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from '../models/auth.model';
import { User } from '../models/user.model';

const TOKEN_KEY = 'sw000_auth_token';
const REFRESH_TOKEN_KEY = 'sw000_refresh_token';
const USER_KEY = 'sw000_auth_user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  readonly token = signal<string | null>(this.getStoredToken());
  readonly refreshTokenSignal = signal<string | null>(this.getStoredRefreshToken());
  readonly currentUser = signal<User | null>(this.getStoredUser());
  readonly isAuthenticated = computed(() => !!this.token());

  login(credentials: LoginDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, credentials).pipe(
      tap((res) => this.setSession(res)),
    );
  }

  verifyEmail(email: string, token: string): Observable<{ message: string }> {
    const payload: VerifyEmailDto = { email, token };
    return this.http.post<{ message: string }>(`${this.baseUrl}/verify-email`, payload);
  }

  forgotPassword(email: string, recaptchaToken?: string): Observable<{ message: string }> {
    const headers: Record<string, string> = {};
    if (recaptchaToken) {
      headers['x-recaptcha-response'] = recaptchaToken;
    }
    const payload: ForgotPasswordDto = { email };
    return this.http.post<{ message: string }>(`${this.baseUrl}/forgot-password`, payload, { headers });
  }

  resetPassword(email: string, token: string, newPassword: string): Observable<{ message: string }> {
    const payload: ResetPasswordDto = { email, token, newPassword };
    return this.http.post<{ message: string }>(`${this.baseUrl}/reset-password`, payload);
  }

  changePassword(payload: { currentPassword: string; newPassword: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/change-password`, payload).pipe(
      tap(() => {
        const user = this.currentUser();
        if (user) {
          const updatedUser = { ...user, mustChangePassword: false };
          this.currentUser.set(updatedUser);
          localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        }
      }),
    );
  }

  refreshTokens(): Observable<AuthResponse> {
    const refreshToken = this.refreshTokenSignal();
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    const payload: RefreshTokenDto = { refreshToken };
    return this.http.post<AuthResponse>(`${this.baseUrl}/refresh`, payload).pipe(
      tap((res) => this.setSession(res)),
      catchError((err) => {
        this.logout();
        throw err;
      }),
    );
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/me`).pipe(
      tap((user) => {
        this.currentUser.set(user);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }),
    );
  }

  logout(): void {
    const currentToken = this.token();
    if (currentToken) {
      this.http.post(`${this.baseUrl}/logout`, {}).subscribe({
        error: () => {}, // silent fallback
      });
    }

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.token.set(null);
    this.refreshTokenSignal.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  setSession(authResult: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, authResult.accessToken);
    this.token.set(authResult.accessToken);

    if (authResult.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, authResult.refreshToken);
      this.refreshTokenSignal.set(authResult.refreshToken);
    }

    if (authResult.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(authResult.user));
      this.currentUser.set(authResult.user);
    }
  }

  private getStoredToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private getStoredRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private getStoredUser(): User | null {
    try {
      const userJson = localStorage.getItem(USER_KEY);
      return userJson ? (JSON.parse(userJson) as User) : null;
    } catch {
      return null;
    }
  }
}
