import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaslAbilityFactory } from '../auth/authorization/casl-ability.factory.js';
import { MailModule } from '../mail/mail.module.js';
import { RedisModule } from '../redis/redis.module.js';
import { RolesModule } from '../roles/roles.module.js';
import { WorkflowEngineModule } from '../workflow-engine/workflow-engine.module.js';
import { UserEntity } from './entities/user.entity.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    RolesModule,
    MailModule,
    RedisModule,
    WorkflowEngineModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, CaslAbilityFactory],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
