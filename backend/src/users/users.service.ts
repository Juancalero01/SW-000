import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Like, Repository } from 'typeorm';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import { Action } from '../auth/authorization/authorization.types.js';
import { CaslAbilityFactory } from '../auth/authorization/casl-ability.factory.js';
import { MailService } from '../mail/mail.service.js';
import { RedisService } from '../redis/redis.service.js';
import { RolesService } from '../roles/roles.service.js';
import { WorkflowEngineService } from '../workflow-engine/workflow-engine.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { QueryUsersDto } from './dto/query-users.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserApprovalStatus } from './enums/approval-status.enum.js';
import { UserEntity } from './entities/user.entity.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly rolesService: RolesService,
    private readonly caslAbilityFactory: CaslAbilityFactory,
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
    private readonly workflowEngineService: WorkflowEngineService,
    @Optional()
    private readonly auditLogsService?: AuditLogsService,
  ) {}

  async create(createUserDto: CreateUserDto, currentUser?: UserEntity): Promise<UserEntity> {
    const existing = await this.findByEmail(createUserDto.email, true);
    if (existing) {
      throw new ConflictException('El correo electrónico ya se encuentra registrado');
    }

    const {
      roles,
      password: providedPassword,
      approvalStatus,
      mustChangePassword,
      ...userData
    } = createUserDto;

    // Validar jerarquía de roles: Administrador no puede asignar SUPERADMIN ni ADMIN
    if (currentUser) {
      const isSuperAdmin = currentUser.roles?.some((r) => r.name?.toUpperCase() === 'SUPERADMIN');
      if (!isSuperAdmin && roles && roles.length > 0) {
        const restrictedRoles = ['SUPERADMIN', 'ADMIN'];
        const attemptsRestrictedRole = roles.some((roleName) =>
          restrictedRoles.includes(String(roleName).toUpperCase()),
        );
        if (attemptsRestrictedRole) {
          throw new ForbiddenException(
            'Los administradores no tienen permisos para asignar roles de Administrador o Superadministrador',
          );
        }

        const ability = await this.caslAbilityFactory.createForUserAsync(currentUser);
        for (const roleName of roles) {
          const roleEntity = await this.rolesService.findByName(String(roleName));
          if (roleEntity && !ability.can(Action.READ, roleEntity)) {
            throw new ForbiddenException(
              `Los administradores no tienen permisos para asignar roles de Administrador o Superadministrador`,
            );
          }
        }
      }
    }

    // Generate secure random initial password if not provided
    const plainPassword = providedPassword || `TempPass!${crypto.randomBytes(4).toString('hex')}`;
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const user = this.userRepository.create({
      ...userData,
      password: hashedPassword,
      mustChangePassword: mustChangePassword ?? true,
      approvalStatus: approvalStatus || UserApprovalStatus.APPROVED,
      isEmailVerified: false,
      isActive: userData.isActive ?? true,
    });

    if (roles && roles.length > 0) {
      const foundRoles = await Promise.all(
        roles.map((name) => this.rolesService.findByName(String(name))),
      );
      user.roles = foundRoles.filter((r): r is NonNullable<typeof r> => r !== null);
    } else {
      user.roles = await this.rolesService.getDefaultUserRole();
    }

    let savedUser: UserEntity;
    try {
      savedUser = await this.userRepository.save(user);
    } catch (error: any) {
      if (
        error?.code === 'ER_DUP_ENTRY' ||
        error?.driverError?.code === 'ER_DUP_ENTRY' ||
        error?.number === 1062 ||
        error?.message?.includes('Duplicate entry')
      ) {
        throw new ConflictException('El correo electrónico ya se encuentra registrado');
      }
      throw error;
    }

    // Only send credentials / verification email if user is APPROVED (platform creation)
    if (savedUser.approvalStatus === UserApprovalStatus.APPROVED) {
      const verificationToken = crypto.randomBytes(32).toString('hex');
      await this.redisService.set(
        `user:email_verification:${savedUser.email}`,
        verificationToken,
        86400,
      );

      this.mailService
        .sendUserCredentials(savedUser.email, savedUser.fullName, plainPassword, verificationToken)
        .catch((err) => {});
    }

    if (this.auditLogsService) {
      await this.auditLogsService.log({
        userId: savedUser.id,
        userEmail: savedUser.email,
        action: 'USER_CREATED_BY_ADMIN',
        module: 'USERS',
      });
    }

    return savedUser;
  }

  async findAll(queryDto: QueryUsersDto) {
    const { page = 1, limit = 10, search, approvalStatus, roleName, isActive } = queryDto;
    const skip = (page - 1) * limit;

    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles');

    if (approvalStatus) {
      query.andWhere('user.approvalStatus = :approvalStatus', { approvalStatus });
    }

    if (isActive !== undefined) {
      query.andWhere('user.isActive = :isActive', { isActive });
    }

    if (roleName) {
      query.andWhere('roles.name = :roleName', { roleName });
    }

    if (search) {
      query.andWhere('(user.fullName LIKE :search OR user.email LIKE :search)', {
        search: `%${search}%`,
      });
    }

    query
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit) || 1,
    };
  }

  async findByEmail(email: string, includeDeleted = false): Promise<UserEntity | null> {
    return await this.userRepository.findOne({
      where: { email },
      withDeleted: includeDeleted,
    });
  }

  async findById(id: number): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return user;
  }

  async getResetPasswordStatus(id: number): Promise<{ hasActiveToken: boolean }> {
    const user = await this.findById(id);
    const existingToken = await this.redisService.get<string>(
      `user:password_reset:${user.email}`,
    );
    return { hasActiveToken: !!existingToken };
  }

  async sendPasswordResetEmail(id: number): Promise<{ message: string }> {
    const user = await this.findById(id);

    if (!user.isActive) {
      throw new BadRequestException(
        'No se puede enviar correo de restablecimiento a un usuario inactivo. Activa la cuenta primero.',
      );
    }

    if (user.approvalStatus !== UserApprovalStatus.APPROVED) {
      const statusMsg =
        user.approvalStatus === UserApprovalStatus.PENDING
          ? 'pendiente de aprobación'
          : 'rechazada';
      throw new BadRequestException(
        `No se puede enviar correo de restablecimiento a una cuenta ${statusMsg}.`,
      );
    }

    const existingToken = await this.redisService.get<string>(
      `user:password_reset:${user.email}`,
    );

    if (existingToken) {
      throw new BadRequestException(
        'Ya existe un correo de restablecimiento activo enviado a este usuario. Intenta nuevamente más tarde.',
      );
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    await this.redisService.set(
      `user:password_reset:${user.email}`,
      resetToken,
      3600,
    );
    await this.redisService.set(
      `user:password_reset_token:${resetToken}`,
      user.email,
      3600,
    );

    this.mailService
      .sendPasswordReset(user.email, user.fullName, resetToken)
      .catch((err) => {});

    if (this.auditLogsService) {
      await this.auditLogsService.log({
        userId: user.id,
        userEmail: user.email,
        action: 'ADMIN_SENT_PASSWORD_RESET_EMAIL',
        module: 'USERS',
      });
    }

    return {
      message: `Correo de restablecimiento enviado exitosamente a ${user.email}`,
    };
  }

  async approveUser(id: number, currentUser?: UserEntity): Promise<UserEntity> {
    const user = await this.findById(id);
    if (user.approvalStatus === UserApprovalStatus.APPROVED) {
      return user;
    }

    if (currentUser) {
      const userRoleNames = (currentUser.roles || []).map((r) => r.name.toUpperCase());
      const can = await this.workflowEngineService.canTransition(
        'USERS',
        user.approvalStatus,
        UserApprovalStatus.APPROVED,
        userRoleNames,
      );
      if (!can) {
        throw new ForbiddenException(
          `No posees permisos para aprobar usuarios en estado ${user.approvalStatus}`,
        );
      }
    }

    // Aprobación: Activa la cuenta, genera contraseña provisoria temporal y envía credenciales
    user.approvalStatus = UserApprovalStatus.APPROVED;
    user.isActive = true;

    const tempPassword = crypto.randomBytes(5).toString('hex');
    user.password = await bcrypt.hash(tempPassword, 10);
    user.mustChangePassword = true;

    const updatedUser = await this.userRepository.save(user);

    // Guardar token de verificación
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await this.redisService.set(
      `user:email_verification:${updatedUser.email}`,
      verificationToken,
      86400,
    );

    this.mailService
      .sendUserCredentials(updatedUser.email, updatedUser.fullName, tempPassword, verificationToken)
      .catch((err) => {});

    await this.caslAbilityFactory.invalidateUserPermissionsCache(updatedUser.id);

    if (this.auditLogsService) {
      await this.auditLogsService.log({
        userId: updatedUser.id,
        userEmail: updatedUser.email,
        action: 'USER_APPROVED',
        module: 'USERS',
      });
    }

    return updatedUser;
  }

  async rejectUser(id: number, reason?: string, currentUser?: UserEntity): Promise<UserEntity> {
    const user = await this.findById(id);

    if (currentUser) {
      const userRoleNames = (currentUser.roles || []).map((r) => r.name.toUpperCase());
      const can = await this.workflowEngineService.canTransition(
        'USERS',
        user.approvalStatus,
        UserApprovalStatus.REJECTED,
        userRoleNames,
      );
      if (!can) {
        throw new ForbiddenException(
          `No posees permisos para rechazar usuarios en estado ${user.approvalStatus}`,
        );
      }
    }

    // Rechazo: Desactiva la cuenta y envía email con motivo
    user.approvalStatus = UserApprovalStatus.REJECTED;
    user.isActive = false;
    const updatedUser = await this.userRepository.save(user);

    this.mailService
      .sendRegistrationRejected(updatedUser.email, updatedUser.fullName, reason)
      .catch((err) => {});

    await this.caslAbilityFactory.invalidateUserPermissionsCache(updatedUser.id);

    if (this.auditLogsService) {
      await this.auditLogsService.log({
        userId: updatedUser.id,
        userEmail: updatedUser.email,
        action: 'USER_REJECTED',
        module: 'USERS',
        changes: { reason: reason || 'Sin motivo especificado' },
      });
    }

    return updatedUser;
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto, currentUser: UserEntity): Promise<UserEntity> {
    const user = await this.findById(id);
    const { roles, password, ...updateData } = updateUserDto;
    const isSuperAdmin = currentUser.roles?.some((r) => r.name?.toUpperCase() === 'SUPERADMIN');
    const isAdmin = currentUser.roles?.some((r) => r.name?.toUpperCase() === 'ADMIN') || isSuperAdmin;

    if (roles && !isAdmin) {
      throw new ForbiddenException('Solo un Administrador puede modificar los roles de usuario');
    }

    if (roles && !isSuperAdmin) {
      const restrictedRoles = ['SUPERADMIN', 'ADMIN'];
      const attemptsRestrictedRole = roles.some((roleName) =>
        restrictedRoles.includes(String(roleName).toUpperCase()),
      );
      if (attemptsRestrictedRole) {
        throw new ForbiddenException(
          'Los administradores no tienen permisos para asignar roles de Administrador o Superadministrador',
        );
      }

      const ability = await this.caslAbilityFactory.createForUserAsync(currentUser);
      for (const roleName of roles) {
        const roleEntity = await this.rolesService.findByName(String(roleName));
        if (roleEntity && !ability.can(Action.READ, roleEntity)) {
          throw new ForbiddenException(
            'Los administradores no tienen permisos para asignar roles de Administrador o Superadministrador',
          );
        }
      }
    }

    if (updateUserDto.isActive !== undefined) {
      if (!isAdmin) {
        throw new ForbiddenException('Solo un Administrador puede cambiar el estado de activación');
      }
      // Regla de activación: Admin solo puede activar/desactivar si la cuenta está APROBADA
      if (!isSuperAdmin && user.approvalStatus !== UserApprovalStatus.APPROVED) {
        throw new BadRequestException(
          'La activación o desactivación de la cuenta requiere que el registro del usuario esté previamente aprobado.',
        );
      }
    }

    if (roles && isAdmin) {
      const foundRoles = await Promise.all(
        roles.map((name) => this.rolesService.findByName(String(name))),
      );
      user.roles = foundRoles.filter((r): r is NonNullable<typeof r> => r !== null);
      await this.caslAbilityFactory.invalidateUserPermissionsCache(id);
    }

    if (password && password.trim().length > 0) {
      user.password = await bcrypt.hash(password, 10);
      user.mustChangePassword = true;
    }

    Object.assign(user, updateData);
    const savedUser = await this.userRepository.save(user);

    if (this.auditLogsService) {
      await this.auditLogsService.log({
        userId: savedUser.id,
        userEmail: savedUser.email,
        action: 'USER_UPDATED_BY_ADMIN',
        module: 'USERS',
      });
    }

    return savedUser;
  }

  async update(id: number, updateData: Partial<UserEntity>): Promise<UserEntity> {
    await this.userRepository.update(id, updateData);
    return this.findById(id);
  }

  async softDelete(id: number, currentUser?: UserEntity): Promise<{ message: string }> {
    const user = await this.findById(id);

    if (currentUser) {
      const userRoleNames = (currentUser.roles || []).map((r) => r.name.toUpperCase());
      const isSuperAdmin = userRoleNames.includes('SUPERADMIN');
      if (!isSuperAdmin) {
        // El administrador NO puede eliminar cuentas de usuario, EXCEPTO si están en REJECTED
        if (user.approvalStatus !== UserApprovalStatus.REJECTED) {
          throw new ForbiddenException(
            'Los administradores solo pueden eliminar cuentas de usuarios que hayan sido rechazadas.',
          );
        }
      }
    }

    await this.userRepository.softDelete(user.id);
    await this.caslAbilityFactory.invalidateUserPermissionsCache(id);

    if (this.auditLogsService) {
      await this.auditLogsService.log({
        userId: currentUser?.id ?? null,
        userEmail: currentUser?.email ?? null,
        action: 'USER_DELETED',
        module: 'USERS',
        entityId: String(id),
      });
    }

    return { message: `Usuario #${id} eliminado correctamente (Soft Delete)` };
  }

  async restore(id: number): Promise<UserEntity> {
    await this.userRepository.restore(id);
    await this.caslAbilityFactory.invalidateUserPermissionsCache(id);
    return this.findById(id);
  }
}
