import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WorkflowEngineService } from '../workflow-engine.service.js';

export const WORKFLOW_MODULE_KEY = 'workflow_module';
export const WorkflowModule = (moduleCode: string) =>
  (target: object, key?: string | symbol, descriptor?: any) => {
    Reflector.prototype.get;
  };

@Injectable()
export class WorkflowTransitionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly workflowEngineService: WorkflowEngineService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const body = request.body;

    if (!user || !user.roles || !body) {
      return true;
    }

    const moduleCode =
      this.reflector.getAllAndOverride<string>('workflow_module', [
        context.getHandler(),
        context.getClass(),
      ]) || body.module;

    const fromState = body.fromState || body.currentState;
    const toState = body.toState || body.targetState || body.status;

    if (!moduleCode || !fromState || !toState) {
      return true;
    }

    const userRoles = user.roles.map((r: any) => (typeof r === 'string' ? r : r.name));

    const result = await this.workflowEngineService.validateTransition(
      moduleCode,
      fromState,
      toState,
      userRoles,
      body,
    );

    if (!result.allowed) {
      throw new ForbiddenException(result.reason);
    }

    return true;
  }
}
