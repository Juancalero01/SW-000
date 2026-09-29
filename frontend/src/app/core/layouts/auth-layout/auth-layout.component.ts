import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-zinc-900 selection:text-white">
      <div class="sm:mx-auto sm:w-full sm:max-w-lg text-center mb-8">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-900 text-white font-bold text-xl tracking-tight mb-4 shadow-xs">
          SW
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-zinc-900">
          SW-000 Platform
        </h1>
        <p class="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-medium">
          Gestión Integral de Operaciones
        </p>
      </div>

      <div class="sm:mx-auto sm:w-full sm:max-w-lg">
        <div class="bg-white py-10 px-8 shadow-xs border border-zinc-200 sm:rounded-xl sm:px-10">
          <router-outlet />
        </div>
        <div class="mt-6 text-center text-xs text-zinc-400">
          SW-000 Platform &copy; 2026. Todos los derechos reservados.
        </div>
      </div>
    </div>
  `,
})
export class AuthLayoutComponent {}
