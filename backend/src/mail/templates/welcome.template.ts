import { renderBaseEmailLayout } from './base-email.layout.js';

export interface WelcomeTemplateParams {
  fullName: string;
  appUrl: string;
}

export function getWelcomeTemplate({ fullName, appUrl }: WelcomeTemplateParams): string {
  const contentHtml = `
    <h1 style="font-size:20px; font-weight:bold; color:#09090b; margin:0 0 12px 0;">¡Bienvenido a SW-000 Platform!</h1>
    <p style="font-size:14px; line-height:22px; color:#52525b; margin:0 0 20px 0;">
      Hola <strong>${fullName}</strong>, tu cuenta ha sido creada y configurada correctamente en nuestra plataforma.
    </p>
    <p style="font-size:14px; line-height:22px; color:#52525b; margin:0 0 24px 0;">
      Ya tienes acceso total a todas las funcionalidades del sistema.
    </p>

    <!-- Action Button -->
    <div style="text-align:center; margin:32px 0;">
      <a href="${appUrl}" target="_blank" style="display:inline-block; background-color:#09090b; color:#ffffff; font-size:14px; font-weight:600; text-decoration:none; padding:12px 28px; border-radius:8px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
        Ir a la Aplicación
      </a>
    </div>

    <p style="font-size:12px; line-height:18px; color:#a1a1aa; margin:0;">
      Si no realizaste este registro, por favor ponte en contacto con nuestro equipo de soporte inmediatamente.
    </p>
  `;

  return renderBaseEmailLayout({
    title: '¡Bienvenido a SW-000 Platform!',
    contentHtml,
  });
}
