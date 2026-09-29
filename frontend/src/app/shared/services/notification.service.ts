import { Injectable, signal } from '@angular/core';
import { ToastMessage, ToastType } from '../models/notification.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  readonly toasts = signal<ToastMessage[]>([]);

  show(toast: Omit<ToastMessage, 'id'>): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const duration = toast.duration ?? 4000;
    const newToast: ToastMessage = { ...toast, id };

    this.toasts.update((current) => [...current, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  }

  success(title: string, message?: string): void {
    this.show({ type: 'success', title, message });
  }

  error(title: string, message?: string): void {
    this.show({ type: 'error', title, message, duration: 6000 });
  }

  warning(title: string, message?: string): void {
    this.show({ type: 'warning', title, message });
  }

  info(title: string, message?: string): void {
    this.show({ type: 'info', title, message });
  }

  notifySaved(entityName: string = 'Registro'): void {
    this.success(`${entityName} guardado`, 'Los cambios se han guardado exitosamente.');
  }

  notifyUpdated(entityName: string = 'Registro'): void {
    this.success(`${entityName} actualizado`, 'La informacion ha sido actualizada exitosamente.');
  }

  notifyDeleted(entityName: string = 'Registro'): void {
    this.info(`${entityName} eliminado`, 'El registro ha sido eliminado del sistema.');
  }

  dismiss(id: string): void {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }
}
