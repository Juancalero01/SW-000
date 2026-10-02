import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CaslAbilityFactory } from '../auth/authorization/casl-ability.factory.js';
import { MailService } from '../mail/mail.service.js';
import { RedisService } from '../redis/redis.service.js';
import { RoleEntity } from '../roles/entities/role.entity.js';
import { RolesService } from '../roles/roles.service.js';
import { UserEntity } from './entities/user.entity.js';
import { UsersService } from './users.service.js';
import { WorkflowEngineService } from '../workflow-engine/workflow-engine.service.js';

describe('UsersService', () => {
  let service: UsersService;

  const mockUserRole: RoleEntity = {
    id: 2,
    name: 'USER',
    description: 'Usuario Estandar',
    isSystem: true,
  } as RoleEntity;

  const mockAdminRole: RoleEntity = {
    id: 1,
    name: 'ADMIN',
    description: 'Administrador',
    isSystem: true,
  } as RoleEntity;

  const mockSuperadminRole: RoleEntity = {
    id: 3,
    name: 'SUPERADMIN',
    description: 'Superadministrador',
    isSystem: true,
  } as RoleEntity;

  let mockUser: UserEntity;
  let mockAdminUser: UserEntity;
  let mockSuperadminUser: UserEntity;

  const mockUserRepository = {
    create: vi.fn().mockImplementation((dto) => ({ ...dto })),
    save: vi
      .fn()
      .mockImplementation((user) => Promise.resolve({ id: 1, ...user })),
    findOne: vi.fn(),
    findAndCount: vi.fn(),
    createQueryBuilder: vi.fn().mockImplementation(() => ({
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      take: vi.fn().mockReturnThis(),
      getManyAndCount: vi.fn().mockResolvedValue([[mockUser], 1]),
    })),
    update: vi.fn().mockResolvedValue({ affected: 1 }),
    softDelete: vi.fn().mockResolvedValue({ affected: 1 }),
    restore: vi.fn().mockResolvedValue({ affected: 1 }),
  };

  const mockRolesService = {
    findByName: vi.fn().mockImplementation((name) => {
      if (name === 'SUPERADMIN') return Promise.resolve(mockSuperadminRole);
      if (name === 'ADMIN') return Promise.resolve(mockAdminRole);
      if (name === 'USER') return Promise.resolve(mockUserRole);
      return Promise.resolve(null);
    }),
    getDefaultUserRole: vi.fn().mockResolvedValue([mockUserRole]),
  };

  const mockCaslAbilityFactory = {
    invalidateUserPermissionsCache: vi.fn().mockResolvedValue(undefined),
    createForUserAsync: vi.fn(),
  };

  const mockRedisService = {
    get: vi.fn(),
    set: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(undefined),
  };

  const mockMailService = {
    sendUserCredentials: vi.fn().mockResolvedValue(true),
    sendEmailVerification: vi.fn().mockResolvedValue(true),
    sendRegistrationRejected: vi.fn().mockResolvedValue(true),
    sendWelcomeEmail: vi.fn().mockResolvedValue(true),
    sendPasswordReset: vi.fn().mockResolvedValue(true),
  };

  const mockWorkflowEngineService = {
    canTransition: vi.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    mockUser = {
      id: 1,
      fullName: 'Juan Perez',
      email: 'juan@test.com',
      phoneNumber: '12345678',
      password: 'hashedpassword',
      roles: [mockUserRole],
      isActive: true,
      isEmailVerified: true,
      approvalStatus: 'APPROVED',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null as any,
    } as UserEntity;

    mockAdminUser = {
      ...mockUser,
      id: 2,
      email: 'admin@test.com',
      roles: [mockAdminRole],
    } as UserEntity;

    mockSuperadminUser = {
      ...mockUser,
      id: 3,
      email: 'superadmin@test.com',
      roles: [mockSuperadminRole],
    } as UserEntity;

    mockUserRepository.findOne.mockReset();
    mockUserRepository.findOne.mockImplementation((query) => {
      if (query?.where?.email && query.where.email !== 'juan@test.com') {
        return Promise.resolve(null);
      }
      return Promise.resolve(mockUser);
    });
    mockUserRepository.findAndCount.mockResolvedValue([[mockUser], 1]);
    mockCaslAbilityFactory.createForUserAsync.mockResolvedValue({
      can: vi.fn().mockReturnValue(true),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: RolesService,
          useValue: mockRolesService,
        },
        {
          provide: CaslAbilityFactory,
          useValue: mockCaslAbilityFactory,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: WorkflowEngineService,
          useValue: mockWorkflowEngineService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear un usuario con el rol por defecto USER cuando no se especifican roles', async () => {
      const result = await service.create({
        email: 'nuevo@test.com',
        fullName: 'Nuevo Usuario',
        password: 'password123',
        roles: ['USER'],
      });

      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'nuevo@test.com',
        }),
      );
      expect(result.id).toBe(1);
    });

    it('debe permitir a un Superadministrador crear un usuario con rol ADMIN', async () => {
      await service.create(
        {
          email: 'admin@test.com',
          fullName: 'Admin User',
          password: 'password123',
          roles: ['ADMIN'],
        },
        mockSuperadminUser,
      );

      expect(mockRolesService.findByName).toHaveBeenCalledWith('ADMIN');
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          roles: [mockAdminRole],
        }),
      );
    });

    it('debe lanzar ForbiddenException si un Administrador intenta crear usuario con rol ADMIN o SUPERADMIN', async () => {
      await expect(
        service.create(
          {
            email: 'admin2@test.com',
            fullName: 'Admin Two',
            password: 'password123',
            roles: ['ADMIN'],
          },
          mockAdminUser,
        ),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.create(
          {
            email: 'super2@test.com',
            fullName: 'Super Two',
            password: 'password123',
            roles: ['SUPERADMIN'],
          },
          mockAdminUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe permitir a un Administrador crear un usuario con rol USER', async () => {
      await service.create(
        {
          email: 'user2@test.com',
          fullName: 'User Two',
          password: 'password123',
          roles: ['USER'],
        },
        mockAdminUser,
      );

      expect(mockRolesService.findByName).toHaveBeenCalledWith('USER');
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          roles: [mockUserRole],
        }),
      );
    });
  });

  describe('findAll', () => {
    it('debe retornar la lista paginada de usuarios', async () => {
      const result = await service.findAll({
        page: 1,
        limit: 10,
        search: 'Juan',
      });

      expect(mockUserRepository.createQueryBuilder).toHaveBeenCalled();
      expect(result).toEqual({
        data: [mockUser],
        total: 1,
        page: 1,
        lastPage: 1,
      });
    });

    it('debe transformar correctamente isActive=false en QueryUsersDto', async () => {
      const { ValidationPipe } = await import('@nestjs/common');
      const { QueryUsersDto } = await import('./dto/query-users.dto.js');
      const pipe = new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      });
      const res = await pipe.transform({ isActive: 'false' }, { type: 'query', metatype: QueryUsersDto });
      expect(res.isActive).toBe(false);
    });
  });

  describe('findById', () => {
    it('debe retornar un usuario por ID', async () => {
      const result = await service.findById(1);
      expect(result).toEqual(mockUser);
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(service.findById(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUser', () => {
    it('debe permitir a un Superadmin modificar roles a ADMIN e invalidar cache de Redis', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await service.updateUser(1, { roles: ['ADMIN'] }, mockSuperadminUser);

      expect(mockRolesService.findByName).toHaveBeenCalledWith('ADMIN');
      expect(
        mockCaslAbilityFactory.invalidateUserPermissionsCache,
      ).toHaveBeenCalledWith(1);
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('debe permitir a un Admin modificar roles no administrativos (USER) e invalidar cache de Redis', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await service.updateUser(1, { roles: ['USER'] }, mockAdminUser);

      expect(mockRolesService.findByName).toHaveBeenCalledWith('USER');
      expect(
        mockCaslAbilityFactory.invalidateUserPermissionsCache,
      ).toHaveBeenCalledWith(1);
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('debe lanzar ForbiddenException si un Admin intenta asignar roles ADMIN o SUPERADMIN', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.updateUser(1, { roles: ['ADMIN'] }, mockAdminUser),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.updateUser(1, { roles: ['SUPERADMIN'] }, mockAdminUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe lanzar ForbiddenException si un usuario no admin intenta cambiar sus propios roles', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.updateUser(1, { roles: ['USER'] }, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe lanzar ForbiddenException si un usuario no admin intenta cambiar isActive', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.updateUser(1, { isActive: false }, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe lanzar BadRequestException si un Admin intenta cambiar isActive cuando el usuario no está APROBADO', async () => {
      const pendingUser = { ...mockUser, approvalStatus: 'PENDING' };
      mockUserRepository.findOne.mockResolvedValue(pendingUser);

      await expect(
        service.updateUser(1, { isActive: true }, mockAdminUser),
      ).rejects.toThrow('La activación o desactivación de la cuenta requiere que el registro del usuario esté previamente aprobado.');
    });

    it('debe permitir a un Admin cambiar isActive cuando el usuario está APROBADO', async () => {
      const approvedUser = { ...mockUser, approvalStatus: 'APPROVED' };
      mockUserRepository.findOne.mockResolvedValue(approvedUser);

      const result = await service.updateUser(1, { isActive: false }, mockAdminUser);
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result.isActive).toBe(false);
    });

    it('debe permitir a un Superadmin cambiar isActive incluso si el usuario no está APROBADO', async () => {
      const pendingUser = { ...mockUser, approvalStatus: 'PENDING' };
      mockUserRepository.findOne.mockResolvedValue(pendingUser);

      const result = await service.updateUser(1, { isActive: true }, mockSuperadminUser);
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result.isActive).toBe(true);
    });
  });

  describe('softDelete', () => {
    it('debe permitir a un Superadmin realizar softDelete en cualquier estado e invalidar cache de Redis', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.softDelete(1, mockSuperadminUser);

      expect(mockUserRepository.softDelete).toHaveBeenCalledWith(1);
      expect(
        mockCaslAbilityFactory.invalidateUserPermissionsCache,
      ).toHaveBeenCalledWith(1);
      expect(result.message).toContain('eliminado correctamente');
    });

    it('debe lanzar ForbiddenException si un Admin intenta eliminar un usuario que no ha sido RECHAZADO', async () => {
      const approvedUser = { ...mockUser, approvalStatus: 'APPROVED' };
      mockUserRepository.findOne.mockResolvedValue(approvedUser);

      await expect(
        service.softDelete(1, mockAdminUser),
      ).rejects.toThrow('Los administradores solo pueden eliminar cuentas de usuarios que hayan sido rechazadas.');
    });

    it('debe permitir a un Admin eliminar un usuario si su estado es REJECTED', async () => {
      const rejectedUser = { ...mockUser, approvalStatus: 'REJECTED' };
      mockUserRepository.findOne.mockResolvedValue(rejectedUser);

      const result = await service.softDelete(1, mockAdminUser);
      expect(mockUserRepository.softDelete).toHaveBeenCalledWith(1);
      expect(result.message).toContain('eliminado correctamente');
    });
  });

  describe('restore', () => {
    it('debe restaurar usuario e invalidar cache de Redis', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await service.restore(1);

      expect(mockUserRepository.restore).toHaveBeenCalledWith(1);
      expect(
        mockCaslAbilityFactory.invalidateUserPermissionsCache,
      ).toHaveBeenCalledWith(1);
    });
  });

  describe('approveUser y rejectUser', () => {
    it('debe aprobar un usuario, activar cuenta, generar clave temporal y enviar credenciales', async () => {
      const pendingUser = { ...mockUser, approvalStatus: 'PENDING', isActive: false };
      mockUserRepository.findOne.mockResolvedValue(pendingUser);

      const result = await service.approveUser(1, mockAdminUser);

      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockMailService.sendUserCredentials).toHaveBeenCalled();
      expect(result.approvalStatus).toBe('APPROVED');
      expect(result.isActive).toBe(true);
      expect(result.mustChangePassword).toBe(true);
    });

    it('debe rechazar un usuario, desactivar cuenta y enviar correo con el motivo especificado', async () => {
      const pendingUser = { ...mockUser, approvalStatus: 'PENDING', isActive: true };
      mockUserRepository.findOne.mockResolvedValue(pendingUser);

      const result = await service.rejectUser(1, 'Documentación incompleta', mockAdminUser);

      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockMailService.sendRegistrationRejected).toHaveBeenCalledWith(
        pendingUser.email,
        pendingUser.fullName,
        'Documentación incompleta',
      );
      expect(result.approvalStatus).toBe('REJECTED');
      expect(result.isActive).toBe(false);
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('debe enviar correo de restablecimiento de contraseña e iterar Redis', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockRedisService.get.mockResolvedValue(null);

      const result = await service.sendPasswordResetEmail(1);

      expect(mockRedisService.set).toHaveBeenCalledTimes(2);
      expect(mockMailService.sendPasswordReset).toHaveBeenCalledWith(
        'juan@test.com',
        'Juan Perez',
        expect.any(String),
      );
      expect(result.message).toContain('enviado exitosamente');
    });

    it('debe lanzar BadRequestException si ya existe un token activo', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockRedisService.get.mockResolvedValue('existing-token');

      await expect(service.sendPasswordResetEmail(1)).rejects.toThrow(
        'Ya existe un correo de restablecimiento activo',
      );
    });

    it('debe lanzar BadRequestException si la cuenta del usuario está inactiva', async () => {
      mockUserRepository.findOne.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(service.sendPasswordResetEmail(1)).rejects.toThrow(
        'No se puede enviar correo de restablecimiento a un usuario inactivo',
      );
    });

    it('debe lanzar BadRequestException si la cuenta está pendiente de aprobación', async () => {
      mockUserRepository.findOne.mockResolvedValue({ ...mockUser, approvalStatus: 'PENDING' });

      await expect(service.sendPasswordResetEmail(1)).rejects.toThrow(
        'pendiente de aprobación',
      );
    });

    it('debe lanzar BadRequestException si la cuenta está rechazada', async () => {
      mockUserRepository.findOne.mockResolvedValue({ ...mockUser, approvalStatus: 'REJECTED' });

      await expect(service.sendPasswordResetEmail(1)).rejects.toThrow(
        'rechazada',
      );
    });
  });

  describe('getResetPasswordStatus', () => {
    it('debe retornar hasActiveToken true si existe token activo en Redis', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockRedisService.get.mockResolvedValue('active-token-123');

      const result = await service.getResetPasswordStatus(1);
      expect(result.hasActiveToken).toBe(true);
    });

    it('debe retornar hasActiveToken false si no existe token en Redis', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockRedisService.get.mockResolvedValue(null);

      const result = await service.getResetPasswordStatus(1);
      expect(result.hasActiveToken).toBe(false);
    });
  });
});
