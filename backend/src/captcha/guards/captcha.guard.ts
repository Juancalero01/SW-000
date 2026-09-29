import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { CaptchaService } from '../captcha.service.js';

@Injectable()
export class CaptchaGuard implements CanActivate {
  constructor(private readonly captchaService: CaptchaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const rawHeader =
      request.headers['x-recaptcha-response'] ||
      request.headers['recaptcha-token'] ||
      request.body?.recaptchaToken;

    const token = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

    await this.captchaService.validateRecaptcha(
      typeof token === 'string' ? token : undefined,
    );

    return true;
  }
}
