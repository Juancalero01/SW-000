import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import { CaslAbilityFactory } from '../auth/authorization/casl-ability.factory.js';
import { UserEntity } from '../users/entities/user.entity.js';
import { CreateModuleDto } from './dto/create-module.dto.js';
import { ModuleEntity } from './entities/module.entity.js';
import { ModulesRegistryService } from './modules-registry.service.js';

describe('ModulesRegistryService', () => {
  let service: ModulesRegistryService;

  const mockUser: UserEntity = {
    id: 1,
    email: 'admin@system.com',
  } as UserEntity;

  const mockModule: ModuleEntity = {
    id: 10,
    code: 'CLIENTS',
    name: 'Gestion de Clientes',
    description: 'Modulo comercial',
    route: '/clients',
    icon: 'business',
    order: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null as any,
  } as ModuleEntity;

  const mockModuleRepository = {
    create: vi.fn().mockImplementation((dto) => ({ ...dto })),
    save: vi.fn().mockImplementation((mod) => Promise.resolve({ id: 10, ...mod })),
    findOne: vi.fn(),
    find: vi.fn().mockResolvedValue([mockModule]),
  };

  const mockCaslAbilityFactory = {
    createForUserAsync: vi.fn().mockResolvedValue({
      can: vi.fn().mockReturnValue(true),
    }),
  };

  const mockAuditLogsService = {
    log: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockModuleRepository.findOne.mockReset();
    mockModuleRepository.findOne.mockResolvedValue(mockModule);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModulesRegistryService,
        {
          provide: getRepositoryToken(ModuleEntity),
          useValue: mockModuleRepository,
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

    service = module.get<ModulesRegistryService>(ModulesRegistryService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('getAuthorizedModulesForUser', () => {
    it('debe retornar modulos autorizados para el usuario', async () => {
      const result = await service.getAuthorizedModulesForUser(mockUser);
      expect(result).toEqual([mockModule]);
      expect(mockCaslAbilityFactory.createForUserAsync).toHaveBeenCalledWith(
        mockUser,
      );
    });
  });

  describe('findAll', () => {
    it('debe retornar todos los modulos', async () => {
      const result = await service.findAll();
      expect(result).toEqual([mockModule]);
    });
  });

  describe('findOne', () => {
    it('debe retornar un modulo por ID', async () => {
      const result = await service.findOne(10);
      expect(result).toEqual(mockModule);
    });

    it('debe lanzar NotFoundException si el modulo no existe', async () => {
      mockModuleRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('debe convertir el codigo a mayusculas, guardar y registrar audit log', async () => {
      mockModuleRepository.findOne.mockResolvedValue(null);

      const dto: CreateModuleDto = {
        code: 'purchases',
        name: 'Compras',
        route: '/purchases',
      };

      const result = await service.create(dto, mockUser);

      expect(mockModuleRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'PURCHASES',
        }),
      );
      expect(mockAuditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MODULE_CREATED',
          module: 'MODULES_REGISTRY',
        }),
      );
      expect(result.id).toBe(10);
    });

    it('debe lanzar ConflictException si el codigo ya existe', async () => {
      mockModuleRepository.findOne.mockResolvedValue(mockModule);

      const dto: CreateModuleDto = {
        code: 'CLIENTS',
        name: 'Clientes',
        route: '/clients',
      };

      await expect(service.create(dto, mockUser)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('debe actualizar el modulo y registrar audit log', async () => {
      mockModuleRepository.findOne
        .mockResolvedValueOnce(mockModule)
        .mockResolvedValueOnce(null);

      await service.update(10, { name: 'Clientes V2' }, mockUser);

      expect(mockModuleRepository.save).toHaveBeenCalled();
      expect(mockAuditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MODULE_UPDATED',
          module: 'MODULES_REGISTRY',
        }),
      );
    });
  });

  describe('remove', () => {
    it('debe realizar eliminacion logica de modulo y registrar audit log', async () => {
      mockModuleRepository.findOne.mockResolvedValue(mockModule);

      await service.remove(10, mockUser);

      expect(mockModuleRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          deletedAt: expect.any(Date),
        }),
      );
      expect(mockAuditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MODULE_DELETED',
          module: 'MODULES_REGISTRY',
        }),
      );
    });
  });
});
