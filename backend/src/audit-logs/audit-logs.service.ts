import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto.js';
import { AuditLogEntity } from './entities/audit-log.entity.js';

export interface CreateAuditLogParams {
  userId?: number | null;
  userEmail?: string | null;
  action: string;
  module: string;
  entityId?: string | null;
  changes?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
  ) {}

  async log(params: CreateAuditLogParams): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        userId: params.userId || null,
        userEmail: params.userEmail || null,
        action: params.action,
        module: params.module,
        entityId: params.entityId || null,
        changes: params.changes || null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      });

      await this.auditLogRepository.save(auditLog);
      this.logger.debug(
        `AuditLog grabado: [${params.module}] ${params.action} por usuario ${params.userEmail || 'Anonimo'}`,
      );
    } catch (err) {
      this.logger.error(`Error guardando AuditLog: ${err}`);
    }
  }

  async findAll(queryDto: QueryAuditLogsDto) {
    const {
      page = 1,
      limit = 20,
      module,
      action,
      userEmail,
      startDate,
      endDate,
    } = queryDto;
    const skip = (page - 1) * limit;

    const query = this.auditLogRepository.createQueryBuilder('log');

    if (module) {
      query.andWhere('log.module = :module', { module });
    }
    if (action) {
      query.andWhere('log.action = :action', { action });
    }
    if (userEmail) {
      query.andWhere('log.userEmail LIKE :userEmail', {
        userEmail: `%${userEmail}%`,
      });
    }
    if (startDate) {
      query.andWhere('log.createdAt >= :startDate', {
        startDate: new Date(startDate),
      });
    }
    if (endDate) {
      query.andWhere('log.createdAt <= :endDate', {
        endDate: new Date(endDate),
      });
    }

    query
      .orderBy('log.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }
}
