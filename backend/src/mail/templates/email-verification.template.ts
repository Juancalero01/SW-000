import { renderBaseEmailLayout } from './base-email.layout.js';

export interface EmailVerificationTemplateParams {
  fullName: string;
  verifyUrl: string;
  token: string;
}

export function getEmailVerificationTemplate({
  fullName,
  verifyUrl,
  token,
}: EmailVerificationTemplateParams): string {
  const contentHtml = `
    <h1 style="font-size:20px; font-weight:bold; color:#09090b; margin:0 0 12px 0;">Verifica tu cuenta</h1>
    <p style="font-size:14px; line-height:22px; color:#52525b; margin:0 0 24px 0;">
      Hola <strong>${fullName}</strong>, gracias por registrarte en la plataforma SW-000. Por favor haz clic en el siguiente botón para confirmar tu dirección de correo electrónico:
    </p>

    <!-- Action Button -->
    <div style="text-align:center; margin:32px 0;">
      <a href="${verifyUrl}" target="_blank" style="display:inline-block; background-color:#09090b; color:#ffffff; font-size:14px; font-weight:600; text-decoration:none; padding:12px 28px; border-radius:8px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
        Confirmar mi Correo
      </a>
    </div>

    <!-- Token Display -->
    <div style="background-color:#fafafa; border:1px solid #e4e4e7; border-radius:8px; padding:16px; text-align:center; margin-bottom:24px;">
      <span style="font-size:12px; color:#71717a; text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:6px;">Tu Código de Verificación</span>
      <code style="font-family:monospace; font-size:16px; font-weight:bold; color:#09090b; letter-spacing:2px;">${token}</code>
    </div>

    <p style="font-size:12px; line-height:18px; color:#a1a1aa; margin:0;">
      Si no creaste esta cuenta, puedes ignorar este mensaje de forma segura.
    </p>
  `;

  return renderBaseEmailLayout({
    title: 'Verificación de Correo - SW-000 Platform',
    contentHtml,
  });
}
