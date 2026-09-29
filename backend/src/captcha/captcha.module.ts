import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CaptchaService } from './captcha.service.js';
import { CaptchaGuard } from './guards/captcha.guard.js';

@Module({
  imports: [ConfigModule],
  providers: [CaptchaService, CaptchaGuard],
  exports: [CaptchaService, CaptchaGuard],
})
export class CaptchaModule {}
