import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NotificationService],
    });
    service = TestBed.inject(NotificationService);
  });

  it('should initialize with empty toasts', () => {
    expect(service.toasts()).toEqual([]);
  });

  it('should add success toast and dismiss it', () => {
    service.success('Guardado', 'Cambios guardados');
    expect(service.toasts()).toHaveLength(1);
    expect(service.toasts()[0].title).toBe('Guardado');
    expect(service.toasts()[0].type).toBe('success');

    const toastId = service.toasts()[0].id;
    service.dismiss(toastId);
    expect(service.toasts()).toHaveLength(0);
  });

  it('should call helper methods notifySaved, notifyUpdated, notifyDeleted', () => {
    service.notifySaved('Producto');
    expect(service.toasts()).toHaveLength(1);
    expect(service.toasts()[0].title).toBe('Producto guardado');

    service.notifyUpdated('Cliente');
    expect(service.toasts()).toHaveLength(2);
    expect(service.toasts()[1].title).toBe('Cliente actualizado');

    service.notifyDeleted('Proveedor');
    expect(service.toasts()).toHaveLength(3);
    expect(service.toasts()[2].title).toBe('Proveedor eliminado');
  });
});
