import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditLogsService, CreateAuditLogParams } from './audit-logs.service.js';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto.js';
import { AuditLogEntity } from './entities/audit-log.entity.js';

describe('AuditLogsService', () => {
  let service: AuditLogsService;

  const mockAuditLog: AuditLogEntity = {
    id: 1,
    userId: 10,
    userEmail: 'user@test.com',
    action: 'CLIENT_CREATED',
    module: 'CLIENTS',
    entityId: '10',
    changes: { new: { name: 'Acme Corp' } },
    ipAddress: '127.0.0.1',
    userAgent: 'VitestTestAgent',
    createdAt: new Date(),
  } as AuditLogEntity;

  const mockQueryBuilder = {
    andWhere: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    take: vi.fn().mockReturnThis(),
    getManyAndCount: vi.fn().mockResolvedValue([[mockAuditLog], 1]),
  };

  const mockAuditLogRepository = {
    create: vi.fn().mockImplementation((dto) => ({ ...dto })),
    save: vi.fn().mockImplementation((entity) => Promise.resolve({ id: 1, ...entity })),
    createQueryBuilder: vi.fn().mockReturnValue(mockQueryBuilder),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogsService,
        {
          provide: getRepositoryToken(AuditLogEntity),
          useValue: mockAuditLogRepository,
        },
      ],
    }).compile();

    service = module.get<AuditLogsService>(AuditLogsService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('debe crear y guardar un log de auditoria correctamente', async () => {
      const params: CreateAuditLogParams = {
        userId: 10,
        userEmail: 'user@test.com',
        action: 'CLIENT_CREATED',
        module: 'CLIENTS',
        entityId: '10',
        changes: { name: 'Acme' },
      };

      await service.log(params);

      expect(mockAuditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 10,
          userEmail: 'user@test.com',
          action: 'CLIENT_CREATED',
          module: 'CLIENTS',
        }),
      );
      expect(mockAuditLogRepository.save).toHaveBeenCalled();
    });

    it('debe capturar errores de persistencia sin lanzar excepciones hacia la transaccion de negocio', async () => {
      mockAuditLogRepository.save.mockRejectedValueOnce(
        new Error('Error de base de datos'),
      );

      const params: CreateAuditLogParams = {
        action: 'LOGIN',
        module: 'AUTH',
      };

      await expect(service.log(params)).resolves.not.toThrow();
    });
  });

  describe('findAll', () => {
    it('debe retornar lista paginada de logs sin filtros', async () => {
      const queryDto: QueryAuditLogsDto = { page: 1, limit: 20 };

      const result = await service.findAll(queryDto);

      expect(mockAuditLogRepository.createQueryBuilder).toHaveBeenCalledWith('log');
      expect(result).toEqual({
        data: [mockAuditLog],
        total: 1,
        page: 1,
        lastPage: 1,
      });
    });

    it('debe aplicar filtros por modulo, accion, email de usuario y fechas', async () => {
      const queryDto: QueryAuditLogsDto = {
        page: 1,
        limit: 10,
        module: 'CLIENTS',
        action: 'CLIENT_CREATED',
        userEmail: 'user@test.com',
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-12-31T23:59:59.000Z',
      };

      await service.findAll(queryDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'log.module = :module',
        { module: 'CLIENTS' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'log.action = :action',
        { action: 'CLIENT_CREATED' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'log.userEmail LIKE :userEmail',
        { userEmail: '%user@test.com%' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'log.createdAt >= :startDate',
        { startDate: expect.any(Date) },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'log.createdAt <= :endDate',
        { endDate: expect.any(Date) },
      );
    });
  });
});
