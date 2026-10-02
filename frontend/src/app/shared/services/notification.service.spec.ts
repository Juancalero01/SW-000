import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationService } from './notification.service';
import { MessageService } from 'primeng/api';

describe('NotificationService', () => {
  let service: NotificationService;
  let mockMessageService: any;

  beforeEach(() => {
    mockMessageService = {
      add: vi.fn(),
      clear: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: MessageService, useValue: mockMessageService },
      ],
    });
    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should delegate success to MessageService.add', () => {
    service.success('Guardado', 'Cambios guardados');
    expect(mockMessageService.add).toHaveBeenCalledWith({
      severity: 'success',
      summary: 'Guardado',
      detail: 'Cambios guardados',
      life: 4000,
    });
  });

  it('should delegate error, warning, info to MessageService.add', () => {
    service.error('Error', 'Ha fallado');
    expect(mockMessageService.add).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'Error',
      detail: 'Ha fallado',
      life: 6000,
    });

    service.warning('Atencion', 'Cuidado');
    expect(mockMessageService.add).toHaveBeenCalledWith({
      severity: 'warn',
      summary: 'Atencion',
      detail: 'Cuidado',
      life: 5000,
    });

    service.info('Info', 'Detalle');
    expect(mockMessageService.add).toHaveBeenCalledWith({
      severity: 'info',
      summary: 'Info',
      detail: 'Detalle',
      life: 4000,
    });
  });

  it('should call helper methods notifySaved, notifyUpdated, notifyDeleted', () => {
    service.notifySaved('Producto');
    expect(mockMessageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'success',
        summary: 'Producto guardado',
      }),
    );

    service.notifyUpdated('Cliente');
    expect(mockMessageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'success',
        summary: 'Cliente actualizado',
      }),
    );

    service.notifyDeleted('Proveedor');
    expect(mockMessageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'info',
        summary: 'Proveedor eliminado',
      }),
    );
  });

  it('should delegate clear to MessageService.clear', () => {
    service.clear();
    expect(mockMessageService.clear).toHaveBeenCalled();
  });
});
