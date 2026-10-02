import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { AppModule } from '../models/user.model';
import { catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ModulesService {
  private readonly apiService = inject(ApiService);
  readonly modules = signal<AppModule[]>([]);
  readonly isLoading = signal<boolean>(false);

  loadMyModules(): void {
    this.isLoading.set(true);
    this.apiService
      .get<AppModule[]>('modules/me')
      .pipe(
        catchError(() => of([])),
      )
      .subscribe((data) => {
        this.modules.set(data || []);
        this.isLoading.set(false);
      });
  }
}
