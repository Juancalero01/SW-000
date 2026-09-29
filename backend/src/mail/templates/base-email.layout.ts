export interface BaseEmailLayoutParams {
  title: string;
  contentHtml: string;
}

export function renderBaseEmailLayout({ title, contentHtml }: BaseEmailLayoutParams): string {
  const currentYear = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f5; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5; padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="500" cellspacing="0" cellpadding="0" style="max-width:500px; background-color:#ffffff; border-radius:12px; border:1px solid #e4e4e7; overflow:hidden; text-align:left;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 24px 32px; border-bottom:1px solid #f4f4f5;">
              <div style="display:inline-block; width:36px; height:36px; background-color:#09090b; color:#ffffff; font-weight:bold; font-size:14px; line-height:36px; text-align:center; border-radius:8px;">
                SW
              </div>
              <span style="font-size:16px; font-weight:bold; color:#09090b; margin-left:12px; vertical-align:middle;">SW-000 Platform</span>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding:32px;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px; background-color:#fafafa; border-top:1px solid #f4f4f5; text-align:center; font-size:12px; color:#71717a;">
              SW-000 Platform &copy; ${currentYear}. Todos los derechos reservados.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
