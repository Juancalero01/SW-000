import { renderBaseEmailLayout } from './base-email.layout.js';

export interface RegistrationRejectedTemplateParams {
  fullName: string;
  email: string;
  reason?: string;
}

export function getRegistrationRejectedTemplate({
  fullName,
  email,
  reason,
}: RegistrationRejectedTemplateParams): string {
  const contentHtml = `
    <div style="display:inline-block; padding:4px 12px; background-color:#fef2f2; border:1px solid #fecaca; border-radius:6px; color:#991b1b; font-size:12px; font-weight:600; margin-bottom:16px;">
      Solicitud de Registro No Aprobada
    </div>
    <h1 style="font-size:20px; font-weight:bold; color:#09090b; margin:0 0 12px 0;">Notificación sobre tu Solicitud de Registro</h1>
    <p style="font-size:14px; line-height:22px; color:#52525b; margin:0 0 16px 0;">
      Hola <strong>${fullName}</strong>, te informamos que tu solicitud de registro para la cuenta <strong>${email}</strong> en la plataforma SW-000 ha sido revisada por un Administrador y no ha sido aprobada en este momento.
    </p>

    ${
      reason
        ? `
    <div style="background-color:#fafafa; border:1px solid #e4e4e7; border-radius:8px; padding:16px; margin-bottom:24px;">
      <span style="font-size:12px; color:#71717a; text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:6px;">Motivo indicado:</span>
      <p style="font-size:13px; color:#3f3f46; margin:0; font-weight:500;">${reason}</p>
    </div>
    `
        : ''
    }

    <p style="font-size:14px; line-height:22px; color:#52525b; margin:0 0 24px 0;">
      Si consideras que esto se debe a un error o deseas solicitar más información sobre esta decisión, por favor ponte en contacto con nuestro equipo de soporte técnico.
    </p>

    <p style="font-size:12px; line-height:18px; color:#a1a1aa; margin:0;">
      Atentamente,<br/>Equipo de Administración de SW-000 Platform
    </p>
  `;

  return renderBaseEmailLayout({
    title: 'Solicitud de Registro No Aprobada - SW-000 Platform',
    contentHtml,
  });
}
