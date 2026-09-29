import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);

  constructor(private readonly configService: ConfigService) {}

  async validateRecaptcha(token?: string): Promise<boolean> {
    const isEnabled =
      this.configService.get<string>('RECAPTCHA_ENABLED', 'true') !== 'false';

    if (!isEnabled) {
      return true;
    }

    const rawToken = typeof token === 'string' ? token.trim() : '';
    if (!rawToken) {
      throw new BadRequestException(
        'La verificación de CAPTCHA es requerida. Por favor marca "No soy un robot".',
      );
    }

    const secretKey = (
      this.configService.get<string>(
        'RECAPTCHA_SECRET_KEY',
        '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe', // Google official test secret key
      ) || ''
    ).trim();

    try {
      const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(rawToken)}`;
      const response = await fetch(verifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.ok !== undefined && !response.ok) {
        this.logger.error(`API de Google reCAPTCHA respondió con código HTTP: ${response.status}`);
        throw new BadRequestException(
          'Error al comunicarse con el servicio de verificación de Google reCAPTCHA.',
        );
      }

      const data = (await response.json()) as {
        success: boolean;
        'error-codes'?: string[];
      };

      if (data && data.success) {
        return true;
      }

      const errorCodes = data?.['error-codes'] || [];
      this.logger.warn(
        `Validación de reCAPTCHA fallida. Codigos de error de Google: ${JSON.stringify(errorCodes)}`,
      );

      let message =
        'La verificación de CAPTCHA ha fallado. Por favor marca "No soy un robot" e intenta nuevamente.';

      if (errorCodes.includes('invalid-input-secret')) {
        message =
          'Error de configuración: La clave secreta de reCAPTCHA en backend (.env) no es válida o no corresponde a esta clave del sitio.';
      } else if (errorCodes.includes('hostname-mismatch')) {
        message =
          'Error de configuración: El dominio actual (ej: localhost) no está agregado en la lista de dominios permitidos de la consola de Google reCAPTCHA.';
      } else if (errorCodes.includes('missing-input-secret')) {
        message =
          'Error de configuración: La clave secreta (RECAPTCHA_SECRET_KEY) no fue enviada a Google.';
      } else if (errorCodes.includes('timeout-or-duplicate')) {
        message =
          'El token de reCAPTCHA ha expirado o ya fue utilizado. Por favor marca "No soy un robot" de nuevo.';
      }

      throw new BadRequestException(message);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error verificando reCAPTCHA con Google: ${errMessage}`);
      throw new BadRequestException(
        'No se pudo verificar el CAPTCHA con el servicio de autenticación.',
      );
    }
  }
}
