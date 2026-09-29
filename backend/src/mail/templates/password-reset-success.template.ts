import { renderBaseEmailLayout } from './base-email.layout.js';

export interface PasswordResetSuccessTemplateParams {
  fullName: string;
  loginUrl: string;
}

export function getPasswordResetSuccessTemplate({
  fullName,
  loginUrl,
}: PasswordResetSuccessTemplateParams): string {
  const contentHtml = `
    <h1 style="font-size:20px; font-weight:bold; color:#09090b; margin:0 0 12px 0;">Contraseña Actualizada</h1>
    <p style="font-size:14px; line-height:22px; color:#52525b; margin:0 0 24px 0;">
      Hola <strong>${fullName}</strong>, te informamos que la contraseña de tu cuenta en SW-000 ha sido restablecida exitosamente.
    </p>

    <div style="background-color:#fafafa; border:1px solid #e4e4e7; border-radius:8px; padding:16px; margin-bottom:24px;">
      <p style="font-size:13px; line-height:20px; color:#27272a; margin:0;">
        Ya puedes acceder a la plataforma con tu nueva contraseña. Si realizaste esta acción, puedes continuar de forma segura.
      </p>
    </div>

    <!-- Action Button -->
    <div style="text-align:center; margin:32px 0;">
      <a href="${loginUrl}" target="_blank" style="display:inline-block; background-color:#09090b; color:#ffffff; font-size:14px; font-weight:600; text-decoration:none; padding:12px 28px; border-radius:8px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
        Iniciar Sesión
      </a>
    </div>

    <p style="font-size:12px; line-height:18px; color:#a1a1aa; margin:0;">
      Si <strong>no</strong> realizaste este cambio, por favor ponte en contacto inmediatamente con el equipo de soporte para proteger tu cuenta.
    </p>
  `;

  return renderBaseEmailLayout({
    title: 'Contraseña Restablecida Exitosamente - SW-000 Platform',
    contentHtml,
  });
}
