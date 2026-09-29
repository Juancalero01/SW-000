import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Password } from 'primeng/password';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { Divider } from 'primeng/divider';
import { ProgressSpinner } from 'primeng/progressspinner';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return password && confirmPassword && password !== confirmPassword
    ? { passwordMismatch: true }
    : null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    Password,
    Button,
    Message,
    Divider,
    ProgressSpinner,
  ],
  template: `
    <div class="space-y-7">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-zinc-900">
          Restablecer Contraseña
        </h2>
        <p class="text-sm text-zinc-500 mt-1.5">
          Ingresa y confirma tu nueva contraseña de acceso.
        </p>
      </div>

      @if (isVerifying()) {
        <div class="py-12 text-center flex flex-col items-center justify-center gap-4">
          <p-progress-spinner strokeWidth="4" />
          <p class="text-sm text-zinc-600 font-medium">Verificando token de restablecimiento...</p>
        </div>
      } @else if (isSuccess()) {
        <div class="space-y-6">
          <p-message severity="success" icon="pi pi-check-circle" styleClass="w-full">
            ¡Tu contraseña ha sido restablecida exitosamente! Ya puedes iniciar sesión con tu nueva clave.
          </p-message>

          <div>
            <p-button
              [label]="authService.isAuthenticated() ? 'Ir al Panel Principal' : 'Iniciar Sesión'"
              size="large"
              [fluid]="true"
              styleClass="w-full"
              (onClick)="goToLogin()"
            />
          </div>
        </div>
      } @else {
        <div class="space-y-6">
          @if (errorMessage()) {
            <p-message severity="error" icon="pi pi-exclamation-triangle" [closable]="true" styleClass="w-full">
              {{ errorMessage() }}
            </p-message>
          }

          @if (hasToken()) {
            <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-5.5 w-full">
              <!-- New Password Input -->
              <div class="flex flex-col gap-1.5 w-full">
                <label for="newPassword" class="text-xs font-semibold text-zinc-700">
                  Nueva Contraseña <span class="text-rose-500">*</span>
                </label>
                <p-password
                  id="newPassword"
                  formControlName="newPassword"
                  placeholder="••••••••"
                  [feedback]="true"
                  promptLabel="Ingresa una nueva contraseña"
                  weakLabel="Demasiado simple"
                  mediumLabel="Complejidad media"
                  strongLabel="Contraseña segura"
                  [toggleMask]="true"
                  [fluid]="true"
                  [invalid]="!!getNewPasswordError()"
                  inputStyleClass="w-full p-inputtext-lg"
                >
                  <ng-template #header>
                    <div class="font-semibold text-xs text-zinc-700 pb-1">
                      Seguridad de la contraseña
                    </div>
                  </ng-template>
                  <ng-template #footer>
                    <p-divider styleClass="my-2" />
                    <p class="text-xs font-semibold text-zinc-700 mb-2">Requisitos de seguridad:</p>
                    <ul class="text-xs space-y-1.5 pl-0.5">
                      @for (req of requirements; track req.id) {
                        <li
                          class="flex items-center gap-2"
                          [class.text-emerald-600]="req.valid"
                          [class.text-zinc-500]="!req.valid"
                        >
                          <i
                            class="pi"
                            [ngClass]="req.valid ? 'pi-check text-emerald-500 font-bold' : 'pi-circle text-zinc-400'"
                            style="font-size: 0.7rem"
                          ></i>
                          <span [class.font-medium]="req.valid">{{ req.label }}</span>
                        </li>
                      }
                    </ul>
                  </ng-template>
                </p-password>
                @if (getNewPasswordError()) {
                  <p-message severity="error" variant="simple" size="small">
                    {{ getNewPasswordError() }}
                  </p-message>
                }
              </div>

              <!-- Confirm Password Input -->
              <div class="flex flex-col gap-1.5 w-full">
                <label for="confirmPassword" class="text-xs font-semibold text-zinc-700">
                  Confirmar Nueva Contraseña <span class="text-rose-500">*</span>
                </label>
                <p-password
                  id="confirmPassword"
                  formControlName="confirmPassword"
                  placeholder="••••••••"
                  [feedback]="false"
                  [toggleMask]="true"
                  [fluid]="true"
                  [invalid]="!!getConfirmPasswordError()"
                  inputStyleClass="w-full p-inputtext-lg"
                />
                @if (getConfirmPasswordError()) {
                  <p-message severity="error" variant="simple" size="small">
                    {{ getConfirmPasswordError() }}
                  </p-message>
                }
              </div>

              <!-- Submit Button -->
              <div class="pt-1">
                <p-button
                  type="submit"
                  label="Restablecer Contraseña"
                  size="large"
                  [fluid]="true"
                  [loading]="isLoading()"
                  [disabled]="resetForm.invalid || isLoading()"
                  styleClass="w-full"
                />
              </div>
            </form>
          }
        </div>

        <!-- Footer Links -->
        <div class="mt-8 text-center text-sm text-zinc-500">
          ¿Recordaste tu contraseña?
          <a
            routerLink="/auth/login"
            class="font-semibold text-zinc-900 hover:underline cursor-pointer ml-1"
          >
            Inicia sesión
          </a>
        </div>
      }
    </div>
  `,
})
export class ResetPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);

  readonly isVerifying = signal<boolean>(false);
  readonly hasToken = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly isSuccess = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly resetForm = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      token: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator },
  );

  get newPasswordValue(): string {
    return this.resetForm.controls.newPassword.value || '';
  }

  get hasMinLength(): boolean {
    return this.newPasswordValue.length >= 6;
  }

  get hasUpperAndLower(): boolean {
    const val = this.newPasswordValue;
    return /[a-z]/.test(val) && /[A-Z]/.test(val);
  }

  get hasNumberOrSymbol(): boolean {
    const val = this.newPasswordValue;
    return /[0-9!@#$%^&*(),.?":{}|<>]/.test(val);
  }

  get requirements(): { id: string; label: string; valid: boolean }[] {
    return [
      {
        id: 'min-length',
        label: 'Mínimo 6 caracteres',
        valid: this.hasMinLength,
      },
      {
        id: 'upper-lower',
        label: 'Mayúsculas y minúsculas',
        valid: this.hasUpperAndLower,
      },
      {
        id: 'number-symbol',
        label: 'Al menos un número o símbolo',
        valid: this.hasNumberOrSymbol,
      },
    ];
  }

  ngOnInit(): void {
    const email = this.route.snapshot.queryParams['email'];
    const token = this.route.snapshot.queryParams['token'];

    if (email && token) {
      this.resetForm.controls.email.setValue(email);
      this.resetForm.controls.email.disable();
      this.resetForm.controls.token.setValue(token);
      this.hasToken.set(true);
    } else {
      this.hasToken.set(false);
      this.errorMessage.set(
        'El enlace de restablecimiento es inválido o no contiene los parámetros necesarios. Por favor solicita un nuevo enlace.',
      );
    }
  }

  goToLogin(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigateByUrl('/dashboard');
    } else {
      this.router.navigateByUrl('/auth/login');
    }
  }

  getNewPasswordError(): string | null {
    const control = this.resetForm.controls.newPassword;
    if (control.touched && control.invalid) {
      if (control.hasError('required')) return 'La nueva contraseña es requerida';
      if (control.hasError('minlength')) return 'La contraseña debe tener al menos 6 caracteres';
    }
    return null;
  }

  getConfirmPasswordError(): string | null {
    const control = this.resetForm.controls.confirmPassword;
    if (control.touched) {
      if (control.hasError('required')) return 'Confirma tu nueva contraseña';
      if (this.resetForm.hasError('passwordMismatch')) return 'Las contraseñas no coinciden';
    }
    return null;
  }

  onSubmit(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const val = this.resetForm.getRawValue();

    this.authService.resetPassword(val.email, val.token, val.newPassword).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isSuccess.set(true);
      },
      error: (err: any) => {
        this.isLoading.set(false);
        const msg =
          err?.error?.message ||
          'Token inválido o expirado. Por favor solicita uno nuevo.';
        this.errorMessage.set(msg);
      },
    });
  }
}
