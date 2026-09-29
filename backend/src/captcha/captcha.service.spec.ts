import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CaptchaService } from './captcha.service.js';

describe('CaptchaService', () => {
  let service: CaptchaService;
  let mockConfigService: any;

  beforeEach(() => {
    mockConfigService = {
      get: vi.fn((key: string, defaultValue?: any) => {
        if (key === 'RECAPTCHA_ENABLED') return 'true';
        if (key === 'RECAPTCHA_SECRET_KEY') return 'test_secret';
        return defaultValue;
      }),
    };

    service = new CaptchaService(mockConfigService as ConfigService);
    vi.stubGlobal('fetch', vi.fn());
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe retornar true si RECAPTCHA_ENABLED es false', async () => {
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'RECAPTCHA_ENABLED') return 'false';
      return null;
    });

    const result = await service.validateRecaptcha();
    expect(result).toBe(true);
  });

  it('debe lanzar BadRequestException si no se proporciona el token', async () => {
    await expect(service.validateRecaptcha('')).rejects.toThrow(
      'La verificación de CAPTCHA es requerida',
    );
  });

  it('debe retornar true si Google responde success: true', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true }),
    });

    const result = await service.validateRecaptcha('valid_token');
    expect(result).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://www.google.com/recaptcha/api/siteverify'),
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('debe lanzar BadRequestException si Google responde success: false', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: false, 'error-codes': ['invalid-input-response'] }),
    });

    await expect(service.validateRecaptcha('invalid_token')).rejects.toThrow(
      'La verificación de CAPTCHA ha fallado',
    );
  });

  it('debe manejar errores de red y lanzar BadRequestException', async () => {
    (fetch as any).mockRejectedValue(new Error('Network error'));

    await expect(service.validateRecaptcha('some_token')).rejects.toThrow(
      'No se pudo verificar el CAPTCHA con el servicio de autenticación.',
    );
  });
});
