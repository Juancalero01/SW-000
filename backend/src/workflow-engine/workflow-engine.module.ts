import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { ModuleEntity } from '../modules-registry/entities/module.entity.js';
import { FieldStatePermissionEntity } from './entities/field-state-permission.entity.js';
import { WorkflowTransitionEntity } from './entities/workflow-transition.entity.js';
import { WorkflowTransitionGuard } from './guards/workflow-transition.guard.js';
import { WorkflowEngineController } from './workflow-engine.controller.js';
import { WorkflowEngineService } from './workflow-engine.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkflowTransitionEntity,
      FieldStatePermissionEntity,
      ModuleEntity,
    ]),
    forwardRef(() => AuthModule),
  ],
  controllers: [WorkflowEngineController],
  providers: [WorkflowEngineService, WorkflowTransitionGuard],
  exports: [WorkflowEngineService, WorkflowTransitionGuard, TypeOrmModule],
})
export class WorkflowEngineModule {}
