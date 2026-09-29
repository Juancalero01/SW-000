import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuditLogsModule } from './audit-logs/audit-logs.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CaptchaModule } from './captcha/captcha.module.js';
import { DatabaseModule } from './database/database.module.js';
import { MailModule } from './mail/mail.module.js';
import { ModulesRegistryModule } from './modules-registry/modules-registry.module.js';
import { PermissionsModule } from './permissions/permissions.module.js';
import { RedisModule } from './redis/redis.module.js';
import { RolesModule } from './roles/roles.module.js';
import { UsersModule } from './users/users.module.js';
import { WorkflowEngineModule } from './workflow-engine/workflow-engine.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TerminusModule,
    RedisModule,
    DatabaseModule,
    AuditLogsModule,
    MailModule,
    PermissionsModule,
    RolesModule,
    UsersModule,
    AuthModule,
    CaptchaModule,
    ModulesRegistryModule,
    WorkflowEngineModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
