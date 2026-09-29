import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import { CaslAbilityFactory } from '../auth/authorization/casl-ability.factory.js';
import { PermissionEntity } from '../permissions/entities/permission.entity.js';
import { PermissionsService } from '../permissions/permissions.service.js';
import { UserEntity } from '../users/entities/user.entity.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { RoleEntity } from './entities/role.entity.js';
import { RolesService } from './roles.service.js';

describe('RolesService', () => {
  let service: RolesService;

  const mockUser: UserEntity = {
    id: 1,
    email: 'admin@system.com',
  } as UserEntity;

  const mockPermission: PermissionEntity = {
    id: 100,
    action: 'read',
    subject: 'Client',
    fields: null,
    conditions: null,
    inverted: false,
    description: 'Lectura de clientes',
  } as PermissionEntity;

  const mockCustomRole: RoleEntity = {
    id: 5,
    name: 'SUPERVISOR',
    description: 'Supervisor de ventas',
    isSystem: false,
    permissions: [mockPermission],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null as any,
  } as RoleEntity;

  const mockSystemRole: RoleEntity = {
    id: 1,
    name: 'ADMIN',
    description: 'Administrador del sistema',
    isSystem: true,
    permissions: [mockPermission],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null as any,
  } as RoleEntity;

  const mockRoleRepository = {
    create: vi.fn().mockImplementation((dto) => ({ ...dto })),
    save: vi
      .fn()
      .mockImplementation((role) => Promise.resolve({ id: 5, ...role })),
    findOne: vi.fn(),
    find: vi.fn().mockResolvedValue([mockCustomRole]),
  };

  const mockQueryBuilder = {
    innerJoin: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    getCount: vi.fn().mockResolvedValue(0),
    getMany: vi.fn().mockResolvedValue([mockUser]),
  };

  const mockUserRepository = {
    createQueryBuilder: vi.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockPermissionsService = {
    findByIds: vi.fn().mockResolvedValue([mockPermission]),
    create: vi.fn().mockResolvedValue({
      id: 101,
      action: 'create',
      subject: 'Client',
    }),
  };

  const mockCaslAbilityFactory = {
    invalidateUserPermissionsCache: vi.fn().mockResolvedValue(undefined),
    createForUserAsync: vi.fn(),
  };

  const mockAuditLogsService = {
    log: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockRoleRepository.findOne.mockReset();
    mockRoleRepository.findOne.mockResolvedValue(mockCustomRole);
    mockRoleRepository.find.mockReset();
    mockRoleRepository.find.mockResolvedValue([mockCustomRole]);
    mockQueryBuilder.getCount.mockResolvedValue(0);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: getRepositoryToken(RoleEntity),
          useValue: mockRoleRepository,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: PermissionsService,
          useValue: mockPermissionsService,
        },
        {
          provide: CaslAbilityFactory,
          useValue: mockCaslAbilityFactory,
        },
        {
          provide: AuditLogsService,
          useValue: mockAuditLogsService,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('debe retornar todos los roles si no se proporciona currentUser', async () => {
      mockRoleRepository.find.mockResolvedValue([mockSystemRole, mockCustomRole]);

      const result = await service.findAll();

      expect(result).toEqual([mockSystemRole, mockCustomRole]);
      expect(mockCaslAbilityFactory.createForUserAsync).not.toHaveBeenCalled();
    });

    it('debe retornar todos los roles si el usuario tiene permiso manage all', async () => {
      mockRoleRepository.find.mockResolvedValue([mockSystemRole, mockCustomRole]);
      mockCaslAbilityFactory.createForUserAsync.mockResolvedValue({
        can: vi.fn().mockImplementation((action, subject) => {
          if (action === 'manage' && subject === 'all') return true;
          return true;
        }),
      });

      const result = await service.findAll(mockUser);

      expect(result).toHaveLength(2);
    });

    it('debe filtrar roles restringidos mediante CASL si el usuario es ADMIN', async () => {
      const superRole = { id: 1, name: 'SUPERADMIN' } as RoleEntity;
      const adminRole = { id: 2, name: 'ADMIN' } as RoleEntity;
      const userRole = { id: 3, name: 'USER' } as RoleEntity;
      mockRoleRepository.find.mockResolvedValue([superRole, adminRole, userRole]);

      mockCaslAbilityFactory.createForUserAsync.mockResolvedValue({
        can: vi.fn().mockImplementation((action, subject) => {
          if (action === 'manage' && subject === 'all') return false;
          if (action === 'read') {
            return subject.name === 'USER';
          }
          return false;
        }),
      });

      const result = await service.findAll(mockUser);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('USER');
    });
  });

  describe('create', () => {
    it('debe crear un rol con permisos existentes y permisos inline', async () => {
      mockRoleRepository.findOne.mockResolvedValue(null);

      const dto: CreateRoleDto = {
        name: 'SUPERVISOR',
        permissionIds: [100],
        newPermissions: [
          {
            action: 'create',
            subject: 'Client',
          },
        ],
      };

      const result = await service.create(dto, mockUser);

      expect(mockPermissionsService.findByIds).toHaveBeenCalledWith([100]);
      expect(mockPermissionsService.create).toHaveBeenCalledWith({
        action: 'create',
        subject: 'Client',
      });
      expect(mockRoleRepository.save).toHaveBeenCalled();
      expect(mockAuditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ROLE_CREATED',
          module: 'ROLES',
        }),
      );
      expect(result.id).toBe(5);
    });

    it('debe lanzar ConflictException si el nombre del rol ya existe', async () => {
      mockRoleRepository.findOne.mockResolvedValue(mockCustomRole);
      const dto: CreateRoleDto = { name: 'SUPERVISOR' };

      await expect(service.create(dto, mockUser)).rejects.toThrow(
        ConflictException,
      );
    });
  });


  describe('findOne', () => {
    it('debe retornar un rol por id', async () => {
      mockRoleRepository.findOne.mockResolvedValue(mockCustomRole);
      const result = await service.findOne(5);
      expect(result).toEqual(mockCustomRole);
    });

    it('debe lanzar NotFoundException si el rol no existe', async () => {
      mockRoleRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('debe actualizar el rol e invalidar cache de usuarios asignados', async () => {
      mockRoleRepository.findOne
        .mockResolvedValueOnce(mockCustomRole)
        .mockResolvedValueOnce(null);

      await service.update(5, { description: 'Nueva desc' }, mockUser);

      expect(mockRoleRepository.save).toHaveBeenCalled();
      expect(
        mockCaslAbilityFactory.invalidateUserPermissionsCache,
      ).toHaveBeenCalledWith(mockUser.id);
      expect(mockAuditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ROLE_UPDATED',
          module: 'ROLES',
        }),
      );
    });

    it('debe lanzar ForbiddenException al intentar renombrar un rol de sistema', async () => {
      mockRoleRepository.findOne.mockResolvedValue(mockSystemRole);

      await expect(
        service.update(1, { name: 'NUEVO_NOMBRE' }, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('debe realizar eliminacion logica de un rol sin usuarios asignados', async () => {
      mockRoleRepository.findOne.mockResolvedValue(mockCustomRole);
      mockQueryBuilder.getCount.mockResolvedValue(0);

      await service.remove(5, mockUser);

      expect(mockRoleRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          deletedAt: expect.any(Date),
        }),
      );
      expect(mockAuditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ROLE_DELETED',
          module: 'ROLES',
        }),
      );
    });

    it('debe lanzar ForbiddenException al intentar eliminar un rol de sistema', async () => {
      mockRoleRepository.findOne.mockResolvedValue(mockSystemRole);

      await expect(service.remove(1, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('debe lanzar ConflictException al intentar eliminar un rol con usuarios asignados', async () => {
      mockRoleRepository.findOne.mockResolvedValue(mockCustomRole);
      mockQueryBuilder.getCount.mockResolvedValue(3);

      await expect(service.remove(5, mockUser)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
