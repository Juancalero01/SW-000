import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import { ModuleEntity } from '../modules-registry/entities/module.entity.js';
import { UserEntity } from '../users/entities/user.entity.js';
import { CreateFieldStatePermissionDto } from './dto/create-field-state-permission.dto.js';
import { CreateWorkflowTransitionDto } from './dto/create-workflow-transition.dto.js';
import { UpdateFieldStatePermissionDto } from './dto/update-field-state-permission.dto.js';
import { UpdateWorkflowTransitionDto } from './dto/update-workflow-transition.dto.js';
import { FieldStatePermissionEntity } from './entities/field-state-permission.entity.js';
import { WorkflowTransitionEntity } from './entities/workflow-transition.entity.js';

@Injectable()
export class WorkflowEngineService {
  private readonly logger = new Logger(WorkflowEngineService.name);

  constructor(
    @InjectRepository(WorkflowTransitionEntity)
    private readonly transitionRepository: Repository<WorkflowTransitionEntity>,
    @InjectRepository(FieldStatePermissionEntity)
    private readonly fieldPermissionRepository: Repository<FieldStatePermissionEntity>,
    @InjectRepository(ModuleEntity)
    private readonly moduleRepository: Repository<ModuleEntity>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async canTransition(
    module: string,
    fromState: string,
    toState: string,
    userRoles: string[],
    context: Record<string, any> = {},
  ): Promise<boolean> {
    const result = await this.validateTransition(
      module,
      fromState,
      toState,
      userRoles,
      context,
    );
    return result.allowed;
  }

  async validateTransition(
    module: string,
    fromState: string,
    toState: string,
    userRoles: string[],
    context: Record<string, any> = {},
  ): Promise<{ allowed: boolean; reason?: string }> {
    const transitions = await this.transitionRepository.find({
      where: {
        module,
        fromState,
        toState,
        deletedAt: IsNull(),
      },
    });

    if (transitions.length === 0) {
      return {
        allowed: false,
        reason: `Transicion de '${fromState}' a '${toState}' no configurada en el modulo '${module}'`,
      };
    }

    for (const t of transitions) {
      const roleMatch = t.allowedRoles.some((role) => userRoles.includes(role));
      if (!roleMatch) continue;

      if (t.conditions && Object.keys(t.conditions).length > 0) {
        let conditionMet = true;
        for (const [key, expectedValue] of Object.entries(t.conditions)) {
          if (context[key] !== expectedValue) {
            conditionMet = false;
            break;
          }
        }
        if (!conditionMet) continue;
      }

      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `No posees el rol ni cumples las condiciones requeridas para transicionar de '${fromState}' a '${toState}'`,
    };
  }

  async getFieldPermissions(
    module: string,
    state: string,
    userRole: string,
  ): Promise<FieldStatePermissionEntity | null> {
    return await this.fieldPermissionRepository.findOne({
      where: {
        module,
        state,
        role: userRole,
        deletedAt: IsNull(),
      },
    });
  }

  async getEditableFieldsForUser(
    module: string,
    state: string,
    userRoles: string[],
  ): Promise<string[] | null> {
    const rules = await this.fieldPermissionRepository.find({
      where: {
        module,
        state,
        role: In(userRoles),
        deletedAt: IsNull(),
      },
    });

    if (rules.length === 0) {
      return null;
    }

    const editableFieldsSet = new Set<string>();
    for (const rule of rules) {
      if (rule.editableFields && Array.isArray(rule.editableFields)) {
        rule.editableFields.forEach((f) => editableFieldsSet.add(f));
      }
    }

    return Array.from(editableFieldsSet);
  }

  async getAllowedValuesForUser(
    module: string,
    state: string,
    userRoles: string[],
  ): Promise<Record<string, any[]> | null> {
    const rules = await this.fieldPermissionRepository.find({
      where: {
        module,
        state,
        role: In(userRoles),
        deletedAt: IsNull(),
      },
    });

    if (rules.length === 0) {
      return null;
    }

    const combined: Record<string, any[]> = {};
    for (const rule of rules) {
      if (rule.allowedValues && typeof rule.allowedValues === 'object') {
        for (const [field, values] of Object.entries(rule.allowedValues)) {
          if (!combined[field]) {
            combined[field] = [];
          }
          if (Array.isArray(values)) {
            values.forEach((v) => {
              if (!combined[field].includes(v)) {
                combined[field].push(v);
              }
            });
          }
        }
      }
    }

    return Object.keys(combined).length > 0 ? combined : null;
  }

  // --- Transiciones de Estado CRUD ---

  async findAllTransitions(
    moduleFilter?: string,
  ): Promise<WorkflowTransitionEntity[]> {
    const where: any = { deletedAt: IsNull() };
    if (moduleFilter) {
      where.module = moduleFilter.toUpperCase().trim();
    }
    return await this.transitionRepository.find({
      where,
      order: { module: 'ASC', fromState: 'ASC', toState: 'ASC' },
    });
  }

  async findTransitionById(id: number): Promise<WorkflowTransitionEntity> {
    const transition = await this.transitionRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!transition) {
      throw new NotFoundException(
        `Regla de transicion con ID ${id} no fue encontrada.`,
      );
    }

    return transition;
  }

  async createTransition(
    dto: CreateWorkflowTransitionDto,
    currentUser?: UserEntity,
  ): Promise<WorkflowTransitionEntity> {
    await this.validateActiveModule(dto.module);

    const transition = this.transitionRepository.create({
      module: dto.module.toUpperCase().trim(),
      fromState: dto.fromState,
      toState: dto.toState,
      allowedRoles: dto.allowedRoles,
      conditions: dto.conditions || null,
      description: dto.description || null,
    });

    const saved = await this.transitionRepository.save(transition);

    await this.auditLogsService.log({
      userId: currentUser?.id ?? null,
      userEmail: currentUser?.email ?? null,
      action: 'WORKFLOW_TRANSITION_CREATED',
      module: 'WORKFLOW_ENGINE',
      entityId: String(saved.id),
      changes: { new: saved },
    });

    this.logger.log(
      `Transicion [${saved.module}] ${saved.fromState} -> ${saved.toState} creada (ID ${saved.id}).`,
    );
    return saved;
  }

  async updateTransition(
    id: number,
    dto: UpdateWorkflowTransitionDto,
    currentUser?: UserEntity,
  ): Promise<WorkflowTransitionEntity> {
    const transition = await this.findTransitionById(id);

    if (dto.module) {
      await this.validateActiveModule(dto.module);
      transition.module = dto.module.toUpperCase().trim();
    }

    Object.assign(transition, dto);
    if (dto.module) {
      transition.module = dto.module.toUpperCase().trim();
    }

    const updated = await this.transitionRepository.save(transition);

    await this.auditLogsService.log({
      userId: currentUser?.id ?? null,
      userEmail: currentUser?.email ?? null,
      action: 'WORKFLOW_TRANSITION_UPDATED',
      module: 'WORKFLOW_ENGINE',
      entityId: String(updated.id),
      changes: { updated },
    });

    this.logger.log(`Transicion con ID ${id} actualizada exitosamente.`);
    return updated;
  }

  async removeTransition(id: number, currentUser?: UserEntity): Promise<void> {
    const transition = await this.findTransitionById(id);

    transition.deletedAt = new Date();
    await this.transitionRepository.save(transition);

    await this.auditLogsService.log({
      userId: currentUser?.id ?? null,
      userEmail: currentUser?.email ?? null,
      action: 'WORKFLOW_TRANSITION_DELETED',
      module: 'WORKFLOW_ENGINE',
      entityId: String(id),
      changes: { deletedAt: transition.deletedAt },
    });

    this.logger.log(`Transicion con ID ${id} eliminada logicamente.`);
  }

  // --- Permisos de Campo por Estado CRUD ---

  async findAllFieldPermissions(
    moduleFilter?: string,
    stateFilter?: string,
  ): Promise<FieldStatePermissionEntity[]> {
    const where: any = { deletedAt: IsNull() };
    if (moduleFilter) {
      where.module = moduleFilter.toUpperCase().trim();
    }
    if (stateFilter) {
      where.state = stateFilter;
    }
    return await this.fieldPermissionRepository.find({
      where,
      order: { module: 'ASC', state: 'ASC', role: 'ASC' },
    });
  }

  async findFieldPermissionById(
    id: number,
  ): Promise<FieldStatePermissionEntity> {
    const permission = await this.fieldPermissionRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!permission) {
      throw new NotFoundException(
        `Regla de permisos de campo con ID ${id} no fue encontrada.`,
      );
    }

    return permission;
  }

  async createFieldPermission(
    dto: CreateFieldStatePermissionDto,
    currentUser?: UserEntity,
  ): Promise<FieldStatePermissionEntity> {
    await this.validateActiveModule(dto.module);

    const permission = this.fieldPermissionRepository.create({
      module: dto.module.toUpperCase().trim(),
      state: dto.state,
      role: dto.role,
      editableFields: dto.editableFields || [],
      readOnlyFields: dto.readOnlyFields || null,
      allowedValues: (dto.allowedValues as Record<string, string[]>) || null,
    });

    const saved = await this.fieldPermissionRepository.save(permission);

    await this.auditLogsService.log({
      userId: currentUser?.id ?? null,
      userEmail: currentUser?.email ?? null,
      action: 'FIELD_PERMISSION_CREATED',
      module: 'WORKFLOW_ENGINE',
      entityId: String(saved.id),
      changes: { new: saved },
    });

    this.logger.log(
      `Regla de permisos de campo [${saved.module}/${saved.state}/${saved.role}] creada (ID ${saved.id}).`,
    );
    return saved;
  }

  async updateFieldPermission(
    id: number,
    dto: UpdateFieldStatePermissionDto,
    currentUser?: UserEntity,
  ): Promise<FieldStatePermissionEntity> {
    const permission = await this.findFieldPermissionById(id);

    if (dto.module) {
      await this.validateActiveModule(dto.module);
      permission.module = dto.module.toUpperCase().trim();
    }

    Object.assign(permission, dto);
    if (dto.module) {
      permission.module = dto.module.toUpperCase().trim();
    }

    const updated = await this.fieldPermissionRepository.save(permission);

    await this.auditLogsService.log({
      userId: currentUser?.id ?? null,
      userEmail: currentUser?.email ?? null,
      action: 'FIELD_PERMISSION_UPDATED',
      module: 'WORKFLOW_ENGINE',
      entityId: String(updated.id),
      changes: { updated },
    });

    this.logger.log(`Regla de permisos de campo con ID ${id} actualizada.`);
    return updated;
  }

  async removeFieldPermission(
    id: number,
    currentUser?: UserEntity,
  ): Promise<void> {
    const permission = await this.findFieldPermissionById(id);

    permission.deletedAt = new Date();
    await this.fieldPermissionRepository.save(permission);

    await this.auditLogsService.log({
      userId: currentUser?.id ?? null,
      userEmail: currentUser?.email ?? null,
      action: 'FIELD_PERMISSION_DELETED',
      module: 'WORKFLOW_ENGINE',
      entityId: String(id),
      changes: { deletedAt: permission.deletedAt },
    });

    this.logger.log(
      `Regla de permisos de campo con ID ${id} eliminada logicamente.`,
    );
  }

  private async validateActiveModule(moduleCode: string): Promise<void> {
    const codeUpper = moduleCode.toUpperCase().trim();
    const module = await this.moduleRepository.findOne({
      where: { code: codeUpper, isActive: true, deletedAt: IsNull() },
    });

    if (!module) {
      throw new BadRequestException(
        `El modulo '${codeUpper}' no esta registrado o no se encuentra activo en el sistema.`,
      );
    }
  }
}
