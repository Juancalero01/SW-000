import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import { CaslAbilityFactory } from '../auth/authorization/casl-ability.factory.js';
import { Action } from '../auth/authorization/authorization.types.js';
import { UserEntity } from '../users/entities/user.entity.js';
import { CreateModuleDto } from './dto/create-module.dto.js';
import { UpdateModuleDto } from './dto/update-module.dto.js';
import { ModuleEntity } from './entities/module.entity.js';

@Injectable()
export class ModulesRegistryService {
  private readonly logger = new Logger(ModulesRegistryService.name);

  constructor(
    @InjectRepository(ModuleEntity)
    private readonly moduleRepository: Repository<ModuleEntity>,
    private readonly caslAbilityFactory: CaslAbilityFactory,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private readonly moduleSubjectMap: Record<string, string> = {
    DASHBOARD: 'Dashboard',
    USERS: 'User',
    ROLES: 'Role',
    WORKFLOWS: 'WorkflowTransition',
    AUDIT: 'AuditLog',
  };

  async getAuthorizedModulesForUser(user: UserEntity): Promise<ModuleEntity[]> {
    const ability = await this.caslAbilityFactory.createForUserAsync(user);
    const allModules = await this.moduleRepository.find({
      where: { isActive: true, deletedAt: IsNull() },
      order: { order: 'ASC' },
    });

    return allModules.filter((mod) => {
      if (ability.can(Action.MANAGE, 'all') || ability.can(Action.READ, 'all')) {
        return true;
      }
      if (mod.code === 'DASHBOARD') {
        return true;
      }
      const subject = this.moduleSubjectMap[mod.code] || mod.code;
      return (
        ability.can(Action.READ, subject as any) ||
        ability.can(Action.MANAGE, subject as any) ||
        ability.can(Action.READ, mod.code as any)
      );
    });
  }

  async findAll(): Promise<ModuleEntity[]> {
    return await this.moduleRepository.find({
      where: { deletedAt: IsNull() },
      order: { order: 'ASC', id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<ModuleEntity> {
    const module = await this.moduleRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!module) {
      throw new NotFoundException(`El modulo con ID ${id} no fue encontrado.`);
    }

    return module;
  }

  async create(
    createModuleDto: CreateModuleDto,
    currentUser?: UserEntity,
  ): Promise<ModuleEntity> {
    const codeUpper = createModuleDto.code.toUpperCase().trim();

    const existing = await this.moduleRepository.findOne({
      where: { code: codeUpper, deletedAt: IsNull() },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe un modulo registrado con el codigo '${codeUpper}'`,
      );
    }

    const newModule = this.moduleRepository.create({
      ...createModuleDto,
      code: codeUpper,
    });

    const savedModule = await this.moduleRepository.save(newModule);

    await this.auditLogsService.log({
      userId: currentUser?.id ?? null,
      userEmail: currentUser?.email ?? null,
      action: 'MODULE_CREATED',
      module: 'MODULES_REGISTRY',
      entityId: String(savedModule.id),
      changes: { new: savedModule },
    });

    this.logger.log(`Modulo '${savedModule.code}' (ID ${savedModule.id}) creado exitosamente.`);
    return savedModule;
  }

  async update(
    id: number,
    updateModuleDto: UpdateModuleDto,
    currentUser?: UserEntity,
  ): Promise<ModuleEntity> {
    const module = await this.findOne(id);

    if (updateModuleDto.code) {
      const codeUpper = updateModuleDto.code.toUpperCase().trim();
      if (codeUpper !== module.code) {
        const existing = await this.moduleRepository.findOne({
          where: { code: codeUpper, deletedAt: IsNull() },
        });

        if (existing) {
          throw new ConflictException(
            `Ya existe un modulo registrado con el codigo '${codeUpper}'`,
          );
        }
        module.code = codeUpper;
      }
    }

    Object.assign(module, updateModuleDto);
    if (updateModuleDto.code) {
      module.code = updateModuleDto.code.toUpperCase().trim();
    }

    const updatedModule = await this.moduleRepository.save(module);

    await this.auditLogsService.log({
      userId: currentUser?.id ?? null,
      userEmail: currentUser?.email ?? null,
      action: 'MODULE_UPDATED',
      module: 'MODULES_REGISTRY',
      entityId: String(updatedModule.id),
      changes: { updatedModule },
    });

    this.logger.log(`Modulo con ID ${id} actualizado exitosamente.`);
    return updatedModule;
  }

  async remove(id: number, currentUser?: UserEntity): Promise<void> {
    const module = await this.findOne(id);

    module.deletedAt = new Date();
    await this.moduleRepository.save(module);

    await this.auditLogsService.log({
      userId: currentUser?.id ?? null,
      userEmail: currentUser?.email ?? null,
      action: 'MODULE_DELETED',
      module: 'MODULES_REGISTRY',
      entityId: String(id),
      changes: { deletedAt: module.deletedAt },
    });

    this.logger.log(`Modulo '${module.code}' (ID ${id}) eliminado logicamente.`);
  }
}
