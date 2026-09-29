import { ExecutionContext } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CaptchaGuard } from './captcha.guard.js';

describe('CaptchaGuard', () => {
  let guard: CaptchaGuard;
  let mockCaptchaService: any;
  let mockContext: ExecutionContext;

  beforeEach(() => {
    mockCaptchaService = {
      validateRecaptcha: vi.fn().mockResolvedValue(true),
    };
    guard = new CaptchaGuard(mockCaptchaService);
  });

  it('debe estar definido', () => {
    expect(guard).toBeDefined();
  });

  it('debe extraer el token de x-recaptcha-response y llamar a validateRecaptcha', async () => {
    mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { 'x-recaptcha-response': 'test_token' },
          body: {},
        }),
      }),
    } as any;

    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
    expect(mockCaptchaService.validateRecaptcha).toHaveBeenCalledWith('test_token');
  });

  it('debe extraer el token del body si las cabeceras no lo incluyen', async () => {
    mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
          body: { recaptchaToken: 'body_token' },
        }),
      }),
    } as any;

    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
    expect(mockCaptchaService.validateRecaptcha).toHaveBeenCalledWith('body_token');
  });
});
