import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import { ModuleEntity } from '../modules-registry/entities/module.entity.js';
import { UserEntity } from '../users/entities/user.entity.js';
import { CreateFieldStatePermissionDto } from './dto/create-field-state-permission.dto.js';
import { CreateWorkflowTransitionDto } from './dto/create-workflow-transition.dto.js';
import { FieldStatePermissionEntity } from './entities/field-state-permission.entity.js';
import { WorkflowTransitionEntity } from './entities/workflow-transition.entity.js';
import { WorkflowEngineService } from './workflow-engine.service.js';

describe('WorkflowEngineService', () => {
  let service: WorkflowEngineService;

  const mockUser: UserEntity = {
    id: 1,
    email: 'admin@system.com',
  } as UserEntity;

  const mockActiveModule: ModuleEntity = {
    id: 1,
    code: 'CLIENTS',
    name: 'Clientes',
    isActive: true,
  } as ModuleEntity;

  const mockTransition: WorkflowTransitionEntity = {
    id: 100,
    module: 'CLIENTS',
    fromState: 'LEAD',
    toState: 'ACTIVE',
    allowedRoles: ['ADMIN', 'GERENTE_VENTAS'],
    conditions: { isWarranty: false },
    description: 'Aprobacion comercial',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null as any,
  } as WorkflowTransitionEntity;

  const mockFieldPermission: FieldStatePermissionEntity = {
    id: 200,
    module: 'CLIENTS',
    state: 'ACTIVE',
    role: 'GERENTE_VENTAS',
    editableFields: ['creditLimit'],
    readOnlyFields: ['taxId'],
    allowedValues: { priority: ['ALTA', 'MEDIA'] },
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null as any,
  } as FieldStatePermissionEntity;

  const mockTransitionRepository = {
    create: vi.fn().mockImplementation((dto) => ({ ...dto })),
    save: vi.fn().mockImplementation((item) => Promise.resolve({ id: 100, ...item })),
    findOne: vi.fn(),
    find: vi.fn().mockResolvedValue([mockTransition]),
  };

  const mockFieldPermissionRepository = {
    create: vi.fn().mockImplementation((dto) => ({ ...dto })),
    save: vi.fn().mockImplementation((item) => Promise.resolve({ id: 200, ...item })),
    findOne: vi.fn(),
    find: vi.fn().mockResolvedValue([mockFieldPermission]),
  };

  const mockModuleRepository = {
    findOne: vi.fn().mockResolvedValue(mockActiveModule),
  };

  const mockAuditLogsService = {
    log: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockTransitionRepository.findOne.mockReset();
    mockTransitionRepository.findOne.mockResolvedValue(mockTransition);
    mockFieldPermissionRepository.findOne.mockReset();
    mockFieldPermissionRepository.findOne.mockResolvedValue(mockFieldPermission);
    mockModuleRepository.findOne.mockResolvedValue(mockActiveModule);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowEngineService,
        {
          provide: getRepositoryToken(WorkflowTransitionEntity),
          useValue: mockTransitionRepository,
        },
        {
          provide: getRepositoryToken(FieldStatePermissionEntity),
          useValue: mockFieldPermissionRepository,
        },
        {
          provide: getRepositoryToken(ModuleEntity),
          useValue: mockModuleRepository,
        },
        {
          provide: AuditLogsService,
          useValue: mockAuditLogsService,
        },
      ],
    }).compile();

    service = module.get<WorkflowEngineService>(WorkflowEngineService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('canTransition', () => {
    it('debe retornar true si el rol y las condiciones coinciden', async () => {
      mockTransitionRepository.find.mockResolvedValue([mockTransition]);

      const result = await service.canTransition(
        'CLIENTS',
        'LEAD',
        'ACTIVE',
        ['ADMIN'],
        { isWarranty: false },
      );

      expect(result).toBe(true);
    });

    it('debe retornar false si las condiciones no coinciden', async () => {
      mockTransitionRepository.find.mockResolvedValue([mockTransition]);

      const result = await service.canTransition(
        'CLIENTS',
        'LEAD',
        'ACTIVE',
        ['ADMIN'],
        { isWarranty: true },
      );

      expect(result).toBe(false);
    });
  });

  describe('getFieldPermissions', () => {
    it('debe retornar la regla de permisos de campo para un estado y rol', async () => {
      mockFieldPermissionRepository.findOne.mockResolvedValue(mockFieldPermission);

      const result = await service.getFieldPermissions('CLIENTS', 'ACTIVE', 'GERENTE_VENTAS');
      expect(result).toEqual(mockFieldPermission);
    });
  });

  describe('createTransition', () => {
    it('debe crear una transicion validando el modulo activo y registrar audit log', async () => {
      mockModuleRepository.findOne.mockResolvedValue(mockActiveModule);

      const dto: CreateWorkflowTransitionDto = {
        module: 'CLIENTS',
        fromState: 'LEAD',
        toState: 'ACTIVE',
        allowedRoles: ['ADMIN'],
      };

      const result = await service.createTransition(dto, mockUser);

      expect(mockModuleRepository.findOne).toHaveBeenCalled();
      expect(mockTransitionRepository.save).toHaveBeenCalled();
      expect(mockAuditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'WORKFLOW_TRANSITION_CREATED',
          module: 'WORKFLOW_ENGINE',
        }),
      );
      expect(result.id).toBe(100);
    });

    it('debe lanzar BadRequestException si el modulo no esta activo o no existe', async () => {
      mockModuleRepository.findOne.mockResolvedValue(null);

      const dto: CreateWorkflowTransitionDto = {
        module: 'INEXISTENT',
        fromState: 'A',
        toState: 'B',
        allowedRoles: ['ADMIN'],
      };

      await expect(service.createTransition(dto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('createFieldPermission', () => {
    it('debe crear una regla de campos validando el modulo activo y registrar audit log', async () => {
      mockModuleRepository.findOne.mockResolvedValue(mockActiveModule);

      const dto: CreateFieldStatePermissionDto = {
        module: 'CLIENTS',
        state: 'ACTIVE',
        role: 'GERENTE_VENTAS',
        editableFields: ['creditLimit'],
      };

      const result = await service.createFieldPermission(dto, mockUser);

      expect(mockFieldPermissionRepository.save).toHaveBeenCalled();
      expect(mockAuditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'FIELD_PERMISSION_CREATED',
          module: 'WORKFLOW_ENGINE',
        }),
      );
      expect(result.id).toBe(200);
    });

    it('debe lanzar BadRequestException si el modulo no existe', async () => {
      mockModuleRepository.findOne.mockResolvedValue(null);

      const dto: CreateFieldStatePermissionDto = {
        module: 'INEXISTENT',
        state: 'ACTIVE',
        role: 'USER',
      };

      await expect(service.createFieldPermission(dto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('removeTransition', () => {
    it('debe realizar eliminacion logica de la transicion y registrar audit log', async () => {
      mockTransitionRepository.findOne.mockResolvedValue(mockTransition);

      await service.removeTransition(100, mockUser);

      expect(mockTransitionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          deletedAt: expect.any(Date),
        }),
      );
      expect(mockAuditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'WORKFLOW_TRANSITION_DELETED',
          module: 'WORKFLOW_ENGINE',
        }),
      );
    });
  });
});
