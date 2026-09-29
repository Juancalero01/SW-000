import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import { Action } from '../auth/authorization/authorization.types.js';
import { CaslAbilityFactory } from '../auth/authorization/casl-ability.factory.js';
import { PermissionEntity } from '../permissions/entities/permission.entity.js';
import { PermissionsService } from '../permissions/permissions.service.js';
import { UserEntity } from '../users/entities/user.entity.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { RoleEntity } from './entities/role.entity.js';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly permissionsService: PermissionsService,
    private readonly caslAbilityFactory: CaslAbilityFactory,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async findAll(currentUser?: UserEntity): Promise<RoleEntity[]> {
    const roles = await this.roleRepository.find({
      where: { deletedAt: IsNull() },
      relations: { permissions: true },
      order: { id: 'ASC' },
    });

    if (!currentUser) {
      return roles;
    }

    const ability = await this.caslAbilityFactory.createForUserAsync(currentUser);

    if (ability.can(Action.MANAGE, 'all')) {
      return roles;
    }

    return roles.filter((role) => ability.can(Action.READ, role));
  }

  async findOne(id: number): Promise<RoleEntity> {
    const role = await this.roleRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: { permissions: true },
    });

    if (!role) {
      throw new NotFoundException(`El rol con ID ${id} no existe.`);
    }

    return role;
  }

  async findByName(name: string): Promise<RoleEntity | null> {
    return await this.roleRepository.findOne({
      where: { name, deletedAt: IsNull() },
      relations: { permissions: true },
    });
  }

  async getDefaultUserRole(): Promise<RoleEntity[]> {
    const defaultRole = await this.findByName('USER');
    return defaultRole ? [defaultRole] : [];
  }

  async create(
    createRoleDto: CreateRoleDto,
    currentUser?: UserEntity,
  ): Promise<RoleEntity> {
    const existing = await this.roleRepository.findOne({
      where: { name: createRoleDto.name, deletedAt: IsNull() },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe un rol registrado con el nombre '${createRoleDto.name}'`,
      );
    }

    const permissions: PermissionEntity[] = [];

    if (
      createRoleDto.permissionIds &&
      createRoleDto.permissionIds.length > 0
    ) {
      const existingPerms = await this.permissionsService.findByIds(
        createRoleDto.permissionIds,
      );
      permissions.push(...existingPerms);
    }

    if (
      createRoleDto.newPermissions &&
      createRoleDto.newPermissions.length > 0
    ) {
      for (const newPermDto of createRoleDto.newPermissions) {
        const createdPerm = await this.permissionsService.create(newPermDto);
        permissions.push(createdPerm);
      }
    }

    const role = this.roleRepository.create({
      name: createRoleDto.name,
      description: createRoleDto.description || null,
      isSystem: false,
      permissions,
    });

    const savedRole = await this.roleRepository.save(role);

    await this.auditLogsService.log({
      userId: currentUser?.id ?? null,
      userEmail: currentUser?.email ?? null,
      action: 'ROLE_CREATED',
      module: 'ROLES',
      entityId: String(savedRole.id),
      changes: { new: savedRole },
    });

    this.logger.log(
      `Rol '${savedRole.name}' (ID ${savedRole.id}) creado exitosamente.`,
    );
    return savedRole;
  }

  async update(
    id: number,
    updateRoleDto: UpdateRoleDto,
    currentUser?: UserEntity,
  ): Promise<RoleEntity> {
    const role = await this.findOne(id);

    if (
      role.isSystem &&
      updateRoleDto.name &&
      updateRoleDto.name !== role.name
    ) {
      throw new ForbiddenException(
        'Los roles de sistema no pueden ser renombrados.',
      );
    }

    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existing = await this.roleRepository.findOne({
        where: { name: updateRoleDto.name, deletedAt: IsNull() },
      });
      if (existing) {
        throw new ConflictException(
          `Ya existe otro rol con el nombre '${updateRoleDto.name}'`,
        );
      }
      role.name = updateRoleDto.name;
    }

    if (updateRoleDto.description !== undefined) {
      role.description = updateRoleDto.description || null;
    }

    if (
      updateRoleDto.permissionIds !== undefined ||
      updateRoleDto.newPermissions !== undefined
    ) {
      const permissions: PermissionEntity[] = [];

      if (
        updateRoleDto.permissionIds &&
        updateRoleDto.permissionIds.length > 0
      ) {
        const existingPerms = await this.permissionsService.findByIds(
          updateRoleDto.permissionIds,
        );
        permissions.push(...existingPerms);
      }

      if (
        updateRoleDto.newPermissions &&
        updateRoleDto.newPermissions.length > 0
      ) {
        for (const newPermDto of updateRoleDto.newPermissions) {
          const createdPerm = await this.permissionsService.create(newPermDto);
          permissions.push(createdPerm);
        }
      }

      role.permissions = permissions;
    }

    const updatedRole = await this.roleRepository.save(role);

    await this.invalidateAffectedUsersCache(id);

    await this.auditLogsService.log({
      userId: currentUser?.id ?? null,
      userEmail: currentUser?.email ?? null,
      action: 'ROLE_UPDATED',
      module: 'ROLES',
      entityId: String(updatedRole.id),
      changes: { updatedRole },
    });

    this.logger.log(`Rol con ID ${id} actualizado exitosamente.`);
    return updatedRole;
  }

  async remove(id: number, currentUser?: UserEntity): Promise<void> {
    const role = await this.findOne(id);

    if (role.isSystem) {
      throw new ForbiddenException(
        'No es posible eliminar roles de sistema.',
      );
    }

    const assignedUsersCount = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.roles', 'role', 'role.id = :roleId', { roleId: id })
      .andWhere('user.deletedAt IS NULL')
      .getCount();

    if (assignedUsersCount > 0) {
      throw new ConflictException(
        `No se puede eliminar el rol '${role.name}' porque tiene ${assignedUsersCount} usuario(s) asignado(s). Reasigne los usuarios antes de eliminar el rol.`,
      );
    }

    role.deletedAt = new Date();
    await this.roleRepository.save(role);

    await this.invalidateAffectedUsersCache(id);

    await this.auditLogsService.log({
      userId: currentUser?.id ?? null,
      userEmail: currentUser?.email ?? null,
      action: 'ROLE_DELETED',
      module: 'ROLES',
      entityId: String(id),
      changes: { deletedAt: role.deletedAt },
    });

    this.logger.log(`Rol '${role.name}' (ID ${id}) eliminado logicamente.`);
  }

  private async invalidateAffectedUsersCache(roleId: number): Promise<void> {
    try {
      const users = await this.userRepository
        .createQueryBuilder('user')
        .innerJoin('user.roles', 'role', 'role.id = :roleId', { roleId })
        .andWhere('user.deletedAt IS NULL')
        .getMany();

      for (const user of users) {
        await this.caslAbilityFactory.invalidateUserPermissionsCache(user.id);
      }
    } catch (err) {
      this.logger.error(
        `Error invalidando cache de Redis para usuarios del rol ${roleId}: ${err}`,
      );
    }
  }
}
