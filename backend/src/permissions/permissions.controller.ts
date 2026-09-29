import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Action } from '../auth/authorization/authorization.types.js';
import { CheckPolicies } from '../auth/decorators/policies.decorator.js';
import { PoliciesGuard } from '../auth/guards/policies.guard.js';
import { PermissionsService } from './permissions.service.js';

@ApiBearerAuth()
@ApiTags('Permisos')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @CheckPolicies((ability) => ability.can(Action.READ, 'Permission'))
  @UseGuards(PoliciesGuard)
  @Get()
  @ApiOperation({ summary: 'Obtener catalogo completo de permisos del sistema' })
  async findAll() {
    return await this.permissionsService.findAll();
  }
}
