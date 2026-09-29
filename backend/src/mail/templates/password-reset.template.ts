import { renderBaseEmailLayout } from './base-email.layout.js';

export interface PasswordResetTemplateParams {
  fullName: string;
  resetUrl: string;
  token: string;
}

export function getPasswordResetTemplate({
  fullName,
  resetUrl,
  token,
}: PasswordResetTemplateParams): string {
  const contentHtml = `
    <h1 style="font-size:20px; font-weight:bold; color:#09090b; margin:0 0 12px 0;">Recuperación de Contraseña</h1>
    <p style="font-size:14px; line-height:22px; color:#52525b; margin:0 0 24px 0;">
      Hola <strong>${fullName}</strong>, hemos recibido una solicitud para restablecer la contraseña de tu cuenta en SW-000. Haz clic en el siguiente botón para continuar:
    </p>

    <!-- Action Button -->
    <div style="text-align:center; margin:32px 0;">
      <a href="${resetUrl}" target="_blank" style="display:inline-block; background-color:#09090b; color:#ffffff; font-size:14px; font-weight:600; text-decoration:none; padding:12px 28px; border-radius:8px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
        Restablecer mi Contraseña
      </a>
    </div>

    <!-- Token Display -->
    <div style="background-color:#fafafa; border:1px solid #e4e4e7; border-radius:8px; padding:16px; text-align:center; margin-bottom:24px;">
      <span style="font-size:12px; color:#71717a; text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:6px;">Tu Token de Recuperación</span>
      <code style="font-family:monospace; font-size:16px; font-weight:bold; color:#09090b; letter-spacing:2px;">${token}</code>
    </div>

    <p style="font-size:12px; line-height:18px; color:#a1a1aa; margin:0;">
      Este enlace y token expirarán en 1 hora. Si no solicitaste este cambio, ignora este correo.
    </p>
  `;

  return renderBaseEmailLayout({
    title: 'Restablecer Contraseña - SW-000 Platform',
    contentHtml,
  });
}
