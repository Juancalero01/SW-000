import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { ModuleEntity } from './entities/module.entity.js';
import { ModulesRegistryController } from './modules-registry.controller.js';
import { ModulesRegistryService } from './modules-registry.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ModuleEntity]),
    forwardRef(() => AuthModule),
  ],
  controllers: [ModulesRegistryController],
  providers: [ModulesRegistryService],
  exports: [ModulesRegistryService, TypeOrmModule],
})
export class ModulesRegistryModule {}
