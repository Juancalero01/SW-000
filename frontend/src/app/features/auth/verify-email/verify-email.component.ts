import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Message } from 'primeng/message';
import { ProgressSpinner } from 'primeng/progressspinner';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    Message,
    ProgressSpinner,
  ],
  template: `
    <div class="space-y-7">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-zinc-900">
          Verificación de Correo
        </h2>
        <p class="text-sm text-zinc-500 mt-1.5">
          Confirmación de tu dirección de correo electrónico para activar tu cuenta.
        </p>
      </div>

      @if (isLoading()) {
        <div class="py-12 text-center flex flex-col items-center justify-center gap-4">
          <p-progress-spinner strokeWidth="4" />
          <p class="text-sm text-zinc-600 font-medium">Verificando token de activación...</p>
        </div>
      } @else if (isVerified()) {
        <div class="space-y-6">
          <p-message severity="success" icon="pi pi-check-circle" styleClass="w-full">
            ¡Correo electrónico verificado exitosamente! Ya puedes acceder a la plataforma.
          </p-message>
        </div>
      } @else {
        <div class="space-y-6">
          @if (errorMessage()) {
            <p-message severity="error" icon="pi pi-exclamation-triangle" styleClass="w-full">
              {{ errorMessage() }}
            </p-message>
          }
        </div>
      }

      <!-- Footer Links -->
      <div class="mt-8 text-center text-sm text-zinc-500">
        <a
          routerLink="/auth/login"
          class="font-semibold text-zinc-900 hover:underline cursor-pointer"
        >
          ¿Iniciar Sesión?
        </a>
      </div>
    </div>
  `,
})
export class VerifyEmailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);

  readonly isLoading = signal<boolean>(false);
  readonly isVerified = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const email = this.route.snapshot.queryParams['email'];
    const token = this.route.snapshot.queryParams['token'];

    if (email && token) {
      this.executeVerification(email, token);
    } else {
      this.errorMessage.set(
        'El enlace de verificación es inválido o no contiene los parámetros necesarios. Por favor revisa el enlace enviado a tu correo.',
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

  private executeVerification(email: string, token: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.verifyEmail(email, token).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isVerified.set(true);
      },
      error: (err: any) => {
        this.isLoading.set(false);
        const msg =
          err?.error?.message ||
          'Token o correo de verificación inválido o expirado.';
        this.errorMessage.set(msg);
      },
    });
  }
}

