import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../mail/mail.module.js';
import { UsersModule } from '../users/users.module.js';
import { CaptchaModule } from '../captcha/captcha.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { CaslAbilityFactory } from './authorization/casl-ability.factory.js';
import { RefreshTokenEntity } from './entities/refresh-token.entity.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { PoliciesGuard } from './guards/policies.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { LocalStrategy } from './strategies/local.strategy.js';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    MailModule,
    CaptchaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([RefreshTokenEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>(
          'JWT_SECRET',
          'super_secret_jwt_key',
        ),
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRATION') ||
            '1d') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    CaslAbilityFactory,
    RolesGuard,
    PoliciesGuard,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [
    AuthService,
    PassportModule,
    JwtModule,
    CaslAbilityFactory,
    RolesGuard,
    PoliciesGuard,
  ],
})
export class AuthModule {}
