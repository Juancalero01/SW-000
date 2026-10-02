import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly messageService = inject(MessageService);

  show(options: {
    type?: 'success' | 'info' | 'warn' | 'error';
    severity?: 'success' | 'info' | 'warn' | 'error';
    title?: string;
    summary?: string;
    message?: string;
    detail?: string;
    duration?: number;
    life?: number;
  }): void {
    const severity = options.severity || options.type || 'info';
    const summary = options.summary || options.title || '';
    const detail = options.detail || options.message || '';
    const life = options.life || options.duration || 4000;

    this.messageService.add({
      severity,
      summary,
      detail,
      life,
    });
  }

  success(title: string, message?: string): void {
    this.messageService.add({
      severity: 'success',
      summary: title,
      detail: message,
      life: 4000,
    });
  }

  error(title: string, message?: string): void {
    this.messageService.add({
      severity: 'error',
      summary: title,
      detail: message,
      life: 6000,
    });
  }

  warning(title: string, message?: string): void {
    this.messageService.add({
      severity: 'warn',
      summary: title,
      detail: message,
      life: 5000,
    });
  }

  info(title: string, message?: string): void {
    this.messageService.add({
      severity: 'info',
      summary: title,
      detail: message,
      life: 4000,
    });
  }

  notifySaved(entityName: string = 'Registro'): void {
    this.success(`${entityName} guardado`, 'Los cambios se han guardado exitosamente.');
  }

  notifyUpdated(entityName: string = 'Registro'): void {
    this.success(`${entityName} actualizado`, 'La información ha sido actualizada exitosamente.');
  }

  notifyDeleted(entityName: string = 'Registro'): void {
    this.info(`${entityName} eliminado`, 'El registro ha sido eliminado del sistema.');
  }

  clear(): void {
    this.messageService.clear();
  }
}
