import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Action } from '../auth/authorization/authorization.types.js';
import { CheckPolicies } from '../auth/decorators/policies.decorator.js';
import { PoliciesGuard } from '../auth/guards/policies.guard.js';
import { AuditLogsService } from './audit-logs.service.js';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto.js';

@ApiBearerAuth()
@ApiTags('Auditoría de Logs')
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @CheckPolicies((ability) => ability.can(Action.READ, 'AuditLog'))
  @UseGuards(PoliciesGuard)
  @Get()
  @ApiOperation({ summary: 'Obtener historial de registros de auditoría de la plataforma (Solo Administradores/Auditores)' })
  async findAll(@Query() queryDto: QueryAuditLogsDto) {
    return await this.auditLogsService.findAll(queryDto);
  }
}
