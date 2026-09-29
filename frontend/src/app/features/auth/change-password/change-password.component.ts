import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Password } from 'primeng/password';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { Divider } from 'primeng/divider';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Password,
    Button,
    Message,
    Divider,
  ],
  template: `
    <div class="space-y-7">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-zinc-900">
          Cambio Obligatorio de Contraseña
        </h2>
        <p class="text-sm text-zinc-500 mt-1.5">
          Por motivos de seguridad, debes actualizar tu contraseña inicial antes de ingresar a la plataforma.
        </p>
      </div>

      @if (errorMessage()) {
        <p-message severity="error" icon="pi pi-exclamation-triangle" [closable]="true" styleClass="w-full">
          {{ errorMessage() }}
        </p-message>
      }

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-5.5 w-full">
        <!-- Current Temporary Password Input -->
        <div class="flex flex-col gap-1.5 w-full">
          <label for="currentPassword" class="text-xs font-semibold text-zinc-700">
            Contraseña Actual / Temporal <span class="text-rose-500">*</span>
          </label>
          <p-password
            id="currentPassword"
            formControlName="currentPassword"
            placeholder="••••••••"
            [feedback]="false"
            [toggleMask]="true"
            [fluid]="true"
            [invalid]="!!getCurrentPasswordError()"
            inputStyleClass="w-full p-inputtext-lg"
          />
          @if (getCurrentPasswordError()) {
            <p-message severity="error" variant="simple" size="small">
              {{ getCurrentPasswordError() }}
            </p-message>
          }
        </div>

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
            label="Actualizar e Ingresar"
            size="large"
            [fluid]="true"
            [loading]="isLoading()"
            [disabled]="form.invalid || isLoading()"
            styleClass="w-full"
          />
        </div>
      </form>
    </div>
  `,
})
export class ChangePasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: (group) => {
        const pass = group.get('newPassword')?.value;
        const confirm = group.get('confirmPassword')?.value;
        return pass === confirm ? null : { passwordMismatch: true };
      },
    },
  );

  get newPasswordValue(): string {
    return this.form.controls.newPassword.value || '';
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

  getCurrentPasswordError(): string | null {
    const control = this.form.controls.currentPassword;
    if (control.touched && control.invalid) {
      if (control.hasError('required')) return 'La contraseña actual es requerida';
    }
    return null;
  }

  getNewPasswordError(): string | null {
    const control = this.form.controls.newPassword;
    if (control.touched && control.invalid) {
      if (control.hasError('required')) return 'La nueva contraseña es requerida';
      if (control.hasError('minlength')) return 'Mínimo 6 caracteres requeridos';
    }
    return null;
  }

  getConfirmPasswordError(): string | null {
    const control = this.form.controls.confirmPassword;
    if (control.touched) {
      if (control.hasError('required')) return 'Confirma la nueva contraseña';
      if (this.form.hasError('passwordMismatch')) return 'Las contraseñas no coinciden';
    }
    return null;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const val = this.form.getRawValue();

    this.authService
      .changePassword({
        currentPassword: val.currentPassword,
        newPassword: val.newPassword,
      })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigateByUrl('/dashboard');
        },
        error: (err: any) => {
          this.isLoading.set(false);
          const msg =
            err?.error?.message ||
            'Error al cambiar la contraseña. Por favor verifica tus datos.';
          this.errorMessage.set(msg);
        },
      });
  }
}
