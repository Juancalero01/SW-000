import { renderBaseEmailLayout } from './base-email.layout.js';

export interface UserCredentialsEmailOptions {
  fullName: string;
  email: string;
  tempPassword: string;
  verifyUrl: string;
}

export function getUserCredentialsTemplate(options: UserCredentialsEmailOptions): string {
  const { fullName, email, tempPassword, verifyUrl } = options;

  const contentHtml = `
    <h1 style="font-size:20px; font-weight:bold; color:#09090b; margin:0 0 12px 0;">¡Bienvenido a SW-000 Platform!</h1>
    <p style="font-size:14px; line-height:22px; color:#52525b; margin:0 0 20px 0;">
      Hola <strong>${fullName}</strong>, se ha creado exitosamente tu cuenta dentro de la plataforma SW-000. A continuación encontrarás tus credenciales temporales de acceso:
    </p>

    <!-- Credentials Display Box -->
    <div style="background-color:#fafafa; border:1px solid #e4e4e7; border-radius:8px; padding:16px 20px; margin-bottom:24px;">
      <div style="font-size:13px; line-height:20px; color:#27272a; margin-bottom:8px;">
        <span style="font-weight:600; color:#71717a;">Correo Electrónico:</span>
        <span style="font-weight:600; color:#09090b; margin-left:4px;">${email}</span>
      </div>
      <div style="font-size:13px; line-height:20px; color:#27272a;">
        <span style="font-weight:600; color:#71717a;">Contraseña Inicial Temporal:</span>
        <code style="font-family:monospace; font-size:14px; font-weight:700; color:#09090b; background-color:#e4e4e7; padding:3px 8px; border-radius:4px; margin-left:4px;">${tempPassword}</code>
      </div>
    </div>

    <p style="font-size:14px; line-height:22px; color:#52525b; margin:0 0 24px 0;">
      Por motivos de seguridad, deberás verificar tu correo electrónico para activar tu cuenta e ingresar con esta clave temporal. En tu primer inicio de sesión se te solicitará cambiar la contraseña por una nueva.
    </p>

    <!-- Action Button -->
    <div style="text-align:center; margin:32px 0;">
      <a href="${verifyUrl}" target="_blank" style="display:inline-block; background-color:#09090b; color:#ffffff; font-size:14px; font-weight:600; text-decoration:none; padding:12px 28px; border-radius:8px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
        Activar Cuenta e Iniciar Sesión
      </a>
    </div>

    <p style="font-size:12px; line-height:18px; color:#a1a1aa; margin:0;">
      Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:<br>
      <a href="${verifyUrl}" target="_blank" style="color:#09090b; word-break:break-all;">${verifyUrl}</a>
    </p>
  `;

  return renderBaseEmailLayout({
    title: 'Bienvenido a SW-000 Platform',
    contentHtml,
  });
}
