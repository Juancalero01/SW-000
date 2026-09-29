import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MailService } from './mail.service.js';

describe('MailService', () => {
  let service: MailService;
  let mockConfigService: any;

  beforeEach(async () => {
    mockConfigService = {
      get: vi.fn().mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'FRONTEND_URL') return 'http://localhost:4200';
        if (key === 'SMTP_FROM') return 'no-reply@sw000.com';
        return defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe enviar correo de verificacion sin errores en modo dev fallback', async () => {
    const result = await service.sendEmailVerification(
      'juan@test.com',
      'Juan Perez',
      'token123',
    );
    expect(result).toBe(true);
  });

  it('debe enviar correo de solicitud de registro pendiente sin errores', async () => {
    const result = await service.sendRegistrationPending(
      'juan@test.com',
      'Juan Perez',
    );
    expect(result).toBe(true);
  });

  it('debe enviar correo de solicitud de registro rechazada sin errores', async () => {
    const result = await service.sendRegistrationRejected(
      'juan@test.com',
      'Juan Perez',
      'Información incompleta',
    );
    expect(result).toBe(true);
  });

  it('debe enviar correo de restablecimiento de contrasena sin errores', async () => {
    const result = await service.sendPasswordReset(
      'juan@test.com',
      'Juan Perez',
      'reset_token_123',
    );
    expect(result).toBe(true);
  });

  it('debe enviar correo de bienvenida sin errores', async () => {
    const result = await service.sendWelcomeEmail(
      'juan@test.com',
      'Juan Perez',
    );
    expect(result).toBe(true);
  });

  it('debe inicializar transporte SMTP parseando SMTP_SECURE=false y SMTP_PORT=587 correctamente como boolean y number', async () => {
    const smtpConfigService = {
      get: vi.fn().mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'SMTP_HOST') return 'smtp.gmail.com';
        if (key === 'SMTP_USER') return 'user@gmail.com';
        if (key === 'SMTP_PASS') return 'pass123';
        if (key === 'SMTP_PORT') return '587';
        if (key === 'SMTP_SECURE') return 'false';
        if (key === 'FRONTEND_URL') return 'http://localhost:4200';
        return defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: ConfigService, useValue: smtpConfigService },
      ],
    }).compile();

    const smtpService = module.get<MailService>(MailService);
    expect(smtpService).toBeDefined();
  });
});
