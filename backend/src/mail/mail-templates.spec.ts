import { describe, expect, it } from 'vitest';
import { getEmailVerificationTemplate } from './templates/email-verification.template.js';
import { getPasswordResetSuccessTemplate } from './templates/password-reset-success.template.js';
import { getPasswordResetTemplate } from './templates/password-reset.template.js';
import { getUserCredentialsTemplate } from './templates/user-credentials.template.js';
import { getWelcomeTemplate } from './templates/welcome.template.js';

describe('Mail Templates Architecture Standardization', () => {
  const currentYear = new Date().getFullYear();

  it('getUserCredentialsTemplate debe renderizar con la maquetación maestra unificada', () => {
    const html = getUserCredentialsTemplate({
      fullName: 'Juan Perez',
      email: 'juan@test.com',
      tempPassword: 'TempPassword123!',
      verifyUrl: 'http://localhost:4200/auth/verify-email?token=xyz',
    });

    expect(html).toContain('SW-000 Platform');
    expect(html).toContain('SW');
    expect(html).toContain('Juan Perez');
    expect(html).toContain('juan@test.com');
    expect(html).toContain('TempPassword123!');
    expect(html).toContain('http://localhost:4200/auth/verify-email?token=xyz');
    expect(html).toContain(`SW-000 Platform &copy; ${currentYear}`);
  });

  it('getEmailVerificationTemplate debe renderizar con la maquetación maestra unificada', () => {
    const html = getEmailVerificationTemplate({
      fullName: 'Maria Gomez',
      verifyUrl: 'http://localhost:4200/auth/verify-email?token=abc',
      token: '123456',
    });

    expect(html).toContain('SW-000 Platform');
    expect(html).toContain('SW');
    expect(html).toContain('Maria Gomez');
    expect(html).toContain('123456');
    expect(html).toContain('http://localhost:4200/auth/verify-email?token=abc');
    expect(html).toContain(`SW-000 Platform &copy; ${currentYear}`);
  });

  it('getPasswordResetTemplate debe renderizar con la maquetación maestra unificada', () => {
    const html = getPasswordResetTemplate({
      fullName: 'Pedro Lopez',
      resetUrl: 'http://localhost:4200/auth/reset-password?token=def',
      token: '654321',
    });

    expect(html).toContain('SW-000 Platform');
    expect(html).toContain('SW');
    expect(html).toContain('Pedro Lopez');
    expect(html).toContain('654321');
    expect(html).toContain('http://localhost:4200/auth/reset-password?token=def');
    expect(html).toContain(`SW-000 Platform &copy; ${currentYear}`);
  });

  it('getPasswordResetSuccessTemplate debe renderizar con la maquetación maestra unificada', () => {
    const html = getPasswordResetSuccessTemplate({
      fullName: 'Ana Martinez',
      loginUrl: 'http://localhost:4200/auth/login',
    });

    expect(html).toContain('SW-000 Platform');
    expect(html).toContain('SW');
    expect(html).toContain('Ana Martinez');
    expect(html).toContain('http://localhost:4200/auth/login');
    expect(html).toContain(`SW-000 Platform &copy; ${currentYear}`);
  });

  it('getWelcomeTemplate debe renderizar con la maquetación maestra unificada', () => {
    const html = getWelcomeTemplate({
      fullName: 'Lucas Ruiz',
      appUrl: 'http://localhost:4200/dashboard',
    });

    expect(html).toContain('SW-000 Platform');
    expect(html).toContain('SW');
    expect(html).toContain('Lucas Ruiz');
    expect(html).toContain('http://localhost:4200/dashboard');
    expect(html).toContain(`SW-000 Platform &copy; ${currentYear}`);
  });
});
