import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { getEmailVerificationTemplate } from './templates/email-verification.template.js';
import { getPasswordResetTemplate } from './templates/password-reset.template.js';
import { getPasswordResetSuccessTemplate } from './templates/password-reset-success.template.js';
import { getWelcomeTemplate } from './templates/welcome.template.js';
import { getUserCredentialsTemplate } from './templates/user-credentials.template.js';
import { getRegistrationPendingTemplate } from './templates/registration-pending.template.js';
import { getRegistrationRejectedTemplate } from './templates/registration-rejected.template.js';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.initTransporter();
  }

  private initTransporter(): void {
    const host = this.configService.get<string>('SMTP_HOST');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const rawPort = this.configService.get<string | number>('SMTP_PORT', 587);
    const port = Number(rawPort) || 587;
    const rawSecure = this.configService.get<string | boolean>('SMTP_SECURE');

    let secure: boolean;
    if (rawSecure !== undefined && rawSecure !== null && rawSecure !== '') {
      secure = String(rawSecure).toLowerCase() === 'true';
    } else {
      secure = port === 465;
    }

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
      this.logger.log(
        `Transporte SMTP inicializado para el servidor: ${host}:${port} (secure: ${secure})`,
      );
    } else {
      // Dev mode stream / logger fallback
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
      this.logger.warn(
        'SMTP no configurado en variables de entorno. Usando transporte de log interno (modo desarrollo).',
      );
    }
  }

  async sendRegistrationPending(
    to: string,
    fullName: string,
  ): Promise<boolean> {
    const htmlBody = getRegistrationPendingTemplate({
      fullName,
      email: to,
    });

    return await this.sendMail({
      to,
      subject: 'Solicitud de Registro Recibida - SW-000 Platform',
      html: htmlBody,
    });
  }

  async sendRegistrationRejected(
    to: string,
    fullName: string,
    reason?: string,
  ): Promise<boolean> {
    const htmlBody = getRegistrationRejectedTemplate({
      fullName,
      email: to,
      reason,
    });

    return await this.sendMail({
      to,
      subject: 'Notificación sobre tu Solicitud de Registro - SW-000 Platform',
      html: htmlBody,
    });
  }

  async sendUserCredentials(
    to: string,
    fullName: string,
    tempPassword: string,
    token: string,
  ): Promise<boolean> {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:4200',
    );
    const verifyUrl = `${frontendUrl}/auth/verify-email?email=${encodeURIComponent(to)}&token=${encodeURIComponent(token)}`;

    const htmlBody = getUserCredentialsTemplate({
      fullName,
      email: to,
      tempPassword,
      verifyUrl,
    });

    return await this.sendMail({
      to,
      subject: 'Activación de Cuenta y Credenciales Temporales - SW-000 Platform',
      html: htmlBody,
    });
  }

  async sendEmailVerification(
    to: string,
    fullName: string,
    token: string,
  ): Promise<boolean> {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:4200',
    );
    const verifyUrl = `${frontendUrl}/auth/verify-email?email=${encodeURIComponent(to)}&token=${encodeURIComponent(token)}`;

    const htmlBody = getEmailVerificationTemplate({
      fullName,
      verifyUrl,
      token,
    });

    return await this.sendMail({
      to,
      subject: 'Verificación de Correo - SW-000 Platform',
      html: htmlBody,
    });
  }

  async sendPasswordReset(
    to: string,
    fullName: string,
    token: string,
  ): Promise<boolean> {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:4200',
    );
    const resetUrl = `${frontendUrl}/auth/reset-password?email=${encodeURIComponent(to)}&token=${encodeURIComponent(token)}`;

    const htmlBody = getPasswordResetTemplate({
      fullName,
      resetUrl,
      token,
    });

    return await this.sendMail({
      to,
      subject: 'Restablecimiento de Contraseña - SW-000 Platform',
      html: htmlBody,
    });
  }

  async sendPasswordResetSuccess(
    to: string,
    fullName: string,
  ): Promise<boolean> {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:4200',
    );
    const loginUrl = `${frontendUrl}/auth/login`;

    const htmlBody = getPasswordResetSuccessTemplate({
      fullName,
      loginUrl,
    });

    return await this.sendMail({
      to,
      subject: 'Contraseña Restablecida Exitosamente - SW-000 Platform',
      html: htmlBody,
    });
  }

  async sendWelcomeEmail(
    to: string,
    fullName: string,
  ): Promise<boolean> {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:4200',
    );
    const appUrl = `${frontendUrl}/dashboard`;

    const htmlBody = getWelcomeTemplate({
      fullName,
      appUrl,
    });

    return await this.sendMail({
      to,
      subject: '¡Bienvenido a SW-000 Platform!',
      html: htmlBody,
    });
  }

  private async sendMail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<boolean> {
    const from =
      this.configService.get<string>('SMTP_FROM') ||
      '"SW-000 Platform" <no-reply@sw000.com>';

    try {
      const info = await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      this.logger.log(
        `Correo enviado exitosamente a ${options.to} [Asunto: ${options.subject}] - ID: ${info.messageId || 'json-dev'}`,
      );
      return true;
    } catch (err: any) {
      this.logger.error(
        `Error al enviar correo a ${options.to}: ${err.message}`,
        err.stack,
      );
      return false;
    }
  }
}
