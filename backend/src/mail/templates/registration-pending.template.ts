import { renderBaseEmailLayout } from './base-email.layout.js';

export interface RegistrationPendingTemplateParams {
  fullName: string;
  email: string;
}

export function getRegistrationPendingTemplate({
  fullName,
  email,
}: RegistrationPendingTemplateParams): string {
  const contentHtml = `
    <div style="display:inline-block; padding:4px 12px; background-color:#fffbeb; border:1px solid #fde68a; border-radius:6px; color:#92400e; font-size:12px; font-weight:600; margin-bottom:16px;">
      Solicitud Recibida - Pendiente de Aprobación
    </div>
    <h1 style="font-size:20px; font-weight:bold; color:#09090b; margin:0 0 12px 0;">¡Solicitud de Registro Recibida!</h1>
    <p style="font-size:14px; line-height:22px; color:#52525b; margin:0 0 16px 0;">
      Hola <strong>${fullName}</strong>, hemos recibido tu solicitud de registro para la cuenta <strong>${email}</strong> en la plataforma SW-000.
    </p>
    <p style="font-size:14px; line-height:22px; color:#52525b; margin:0 0 24px 0;">
      Por motivos de seguridad, tu cuenta requiere ser aprobada por un Administrador antes de quedar activa. En cuanto tu solicitud sea aprobada, recibirás un correo con el enlace de confirmación y activación de tu cuenta.
    </p>

    <!-- Info Box -->
    <div style="background-color:#fafafa; border:1px solid #e4e4e7; border-radius:8px; padding:16px; margin-bottom:24px;">
      <span style="font-size:12px; color:#71717a; text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:6px;">Próximo Paso</span>
      <p style="font-size:13px; color:#3f3f46; margin:0; font-weight:500;">
        No necesitas realizar ninguna acción adicional en este momento. Te notificaremos por este medio en cuanto un Administrador apruebe tu registro.
      </p>
    </div>

    <p style="font-size:12px; line-height:18px; color:#a1a1aa; margin:0;">
      Si no solicitaste este registro, por favor ignora este correo.
    </p>
  `;

  return renderBaseEmailLayout({
    title: 'Solicitud de Registro Recibida - SW-000 Platform',
    contentHtml,
  });
}
