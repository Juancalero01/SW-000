import { Component, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { UiCaptchaComponent } from '../../../shared/components/ui-captcha/ui-captcha.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    InputText,
    Button,
    Message,
    UiCaptchaComponent,
  ],
  template: `
    <div class="space-y-7">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-zinc-900">
          Recuperar Contraseña
        </h2>
        <p class="text-sm text-zinc-500 mt-1.5">
          Ingresa tu correo electrónico y te enviaremos un código para restablecer tu contraseña.
        </p>
      </div>

      @if (isSubmitted()) {
        <div class="space-y-6">
          <p-message severity="success" icon="pi pi-check-circle" styleClass="w-full">
            Se ha enviado un mensaje a tu correo electrónico con las instrucciones para restablecer tu contraseña.
          </p-message>
        </div>
      } @else {
        @if (errorMessage()) {
          <p-message severity="error" icon="pi pi-exclamation-triangle" [closable]="true" styleClass="w-full">
            {{ errorMessage() }}
          </p-message>
        }

        <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-5.5 w-full">
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
              <p-message severity="error" variant="simple" size="small" >
                {{ getEmailError() }}
              </p-message>
            }
          </div>

          <!-- Google reCAPTCHA v2 -->
          <div class="w-full flex items-center justify-center py-1">
            <app-ui-captcha
              (resolved)="onCaptchaResolved($event)"
              (expired)="onCaptchaExpired()"
            />
          </div>

          <!-- Submit Button -->
          <div class="pt-1">
            <p-button
              type="submit"
              label="Recuperar Contraseña"
              size="large"
              [fluid]="true"
              [loading]="isLoading()"
              [disabled]="forgotForm.invalid || !recaptchaToken() || isLoading()"
              styleClass="w-full"
            />
          </div>
        </form>
      }

      <!-- Footer Links -->
      <div class="mt-8 text-center text-sm text-zinc-500">
        <a
          pButton
          routerLink="/auth/login"
          class="font-semibold text-zinc-900 hover:underline cursor-pointer"
        >
          ¿Iniciar Sesión?
        </a>
      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {
  @ViewChild(UiCaptchaComponent) captchaComponent?: UiCaptchaComponent;

  private readonly fb = inject(FormBuilder);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoading = signal<boolean>(false);
  readonly isSubmitted = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly recaptchaToken = signal<string | null>(null);

  readonly forgotForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  onCaptchaResolved(token: string | null): void {
    this.recaptchaToken.set(token);
  }

  onCaptchaExpired(): void {
    this.recaptchaToken.set(null);
  }

  getEmailError(): string | null {
    const control = this.forgotForm.controls.email;
    if (control.touched && control.invalid) {
      if (control.hasError('required')) return 'El correo electrónico es requerido';
      if (control.hasError('email')) return 'Ingresa un correo electrónico válido';
    }
    return null;
  }


  onSubmit(): void {
    if (this.isLoading() || this.forgotForm.invalid || !this.recaptchaToken()) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const email = this.forgotForm.controls.email.value;
    const token = this.recaptchaToken() || undefined;

    this.authService.forgotPassword(email, token).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isSubmitted.set(true);
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.captchaComponent?.reset();
        this.recaptchaToken.set(null);

        const msg = err?.error?.message || 'Error al procesar la solicitud. Por favor reintenta.';
        this.errorMessage.set(msg);
      },
    });
  }
}
