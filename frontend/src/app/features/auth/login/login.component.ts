import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Button, } from 'primeng/button';
import { Message } from 'primeng/message';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    InputText,
    Password,
    Button,
    Message,
  ],
  template: `
    <div class="space-y-7">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-zinc-900">
          Iniciar Sesión
        </h2>
        <p class="text-sm text-zinc-500 mt-1.5">
          Ingresa tus credenciales para acceder a la plataforma.
        </p>
      </div>

      @if (errorMessage()) {
        <p-message severity="error" icon="pi pi-exclamation-triangle" [closable]="true" styleClass="w-full">
          {{ errorMessage() }}
        </p-message>
      }

      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-5.5 w-full">
        <!-- Email Input -->
        <div class="flex flex-col gap-1.5 w-full">
          <label for="email" class="text-xs font-semibold text-zinc-700">
            Correo Electrónico <span class="text-rose-500">*</span>
          </label>
          <input
              pInputText
              id="email"
              type="email"
              formControlName="email"
              placeholder="usuario@empresa.com"
              pSize="large"
              [fluid]="true"
              [invalid]="!!getEmailError()"
              class="w-full"
            />
          @if (getEmailError()) {
            <p-message severity="error" variant="simple" size="small">
              {{ getEmailError() }}
            </p-message>
          }
        </div>

        <!-- Password Input -->
        <div class="flex flex-col gap-1.5 w-full">
          <label for="password" class="text-xs font-semibold text-zinc-700">
            Contraseña <span class="text-rose-500">*</span>
          </label>
          <p-password
            id="password"
            formControlName="password"
            placeholder="••••••••"
            [feedback]="false"
            [toggleMask]="true"
            [fluid]="true"
            [invalid]="!!getPasswordError()"
            inputStyleClass="w-full p-inputtext-lg"
          />
          @if (getPasswordError()) {
            <p-message severity="error" variant="simple" size="small">
              {{ getPasswordError() }}
            </p-message>
          }
        </div>

        <!-- Submit Button -->
        <div class="pt-1">
          <p-button
            type="submit"
            label="Iniciar Sesión"
            size="large"
            [fluid]="true"
            [loading]="isLoading()"
            [disabled]="loginForm.invalid || isLoading()"
            styleClass="w-full"
          />
        </div>
      </form>

      <!-- Footer Links -->
      <div class="mt-8 text-center text-sm text-zinc-500">
        <a pButton routerLink="/auth/forgot-password" class="font-semibold hover:underline text-zinc-900">¿Restablecer Contraseña?</a>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly isLoading = signal<boolean>(false);
  readonly showPassword = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  togglePasswordVisibility(): void {
    this.showPassword.update((show) => !show);
  }

  getEmailError(): string | null {
    const control = this.loginForm.controls.email;
    if (control.touched && control.invalid) {
      if (control.hasError('required')) return 'El correo electrónico es requerido';
      if (control.hasError('email')) return 'Ingresa un correo electrónico válido';
    }
    return null;
  }

  getPasswordError(): string | null {
    const control = this.loginForm.controls.password;
    if (control.touched && control.invalid) {
      if (control.hasError('required')) return 'La contraseña es requerida';
    }
    return null;
  }

  onSubmit(): void {
    if (this.isLoading() || this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const credentials = this.loginForm.getRawValue();

    this.authService.login(credentials).subscribe({
      next: () => {
        this.isLoading.set(false);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err: any) => {
        this.isLoading.set(false);

        const msg =
          err?.error?.message ||
          'Credenciales incorrectas. Por favor verifica tu correo y contraseña.';
        this.errorMessage.set(msg);
      },
    });
  }
}
