import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Action } from '../auth/authorization/authorization.types.js';
import { GetUser } from '../auth/decorators/get-user.decorator.js';
import { CheckPolicies } from '../auth/decorators/policies.decorator.js';
import { PoliciesGuard } from '../auth/guards/policies.guard.js';
import { UserEntity } from '../users/entities/user.entity.js';
import { CreateFieldStatePermissionDto } from './dto/create-field-state-permission.dto.js';
import { CreateWorkflowTransitionDto } from './dto/create-workflow-transition.dto.js';
import { UpdateFieldStatePermissionDto } from './dto/update-field-state-permission.dto.js';
import { UpdateWorkflowTransitionDto } from './dto/update-workflow-transition.dto.js';
import { WorkflowEngineService } from './workflow-engine.service.js';

@ApiBearerAuth()
@ApiTags('Motor de Workflows 4D')
@Controller('workflow-engine')
export class WorkflowEngineController {
  constructor(private readonly workflowService: WorkflowEngineService) {}

  // --- Endpoints de Transiciones de Estado ---

  @CheckPolicies((ability) =>
    ability.can(Action.READ, 'WorkflowTransition'),
  )
  @UseGuards(PoliciesGuard)
  @Get('transitions')
  @ApiOperation({
    summary: 'Obtener lista de reglas de transicion de estado por modulo',
  })
  @ApiQuery({
    name: 'module',
    required: false,
    description: 'Filtrar por codigo del modulo (ej. CLIENTS)',
  })
  async findAllTransitions(@Query('module') moduleFilter?: string) {
    return await this.workflowService.findAllTransitions(moduleFilter);
  }

  @CheckPolicies((ability) =>
    ability.can(Action.READ, 'WorkflowTransition'),
  )
  @UseGuards(PoliciesGuard)
  @Get('transitions/:id')
  @ApiOperation({ summary: 'Obtener detalle de una regla de transicion por ID' })
  async findTransitionById(@Param('id', ParseIntPipe) id: number) {
    return await this.workflowService.findTransitionById(id);
  }

  @CheckPolicies((ability) =>
    ability.can(Action.CREATE, 'WorkflowTransition'),
  )
  @UseGuards(PoliciesGuard)
  @Post('transitions')
  @ApiOperation({ summary: 'Crear una nueva regla de transicion de estado' })
  async createTransition(
    @Body() dto: CreateWorkflowTransitionDto,
    @GetUser() currentUser: UserEntity,
  ) {
    return await this.workflowService.createTransition(dto, currentUser);
  }

  @CheckPolicies((ability) =>
    ability.can(Action.UPDATE, 'WorkflowTransition'),
  )
  @UseGuards(PoliciesGuard)
  @Patch('transitions/:id')
  @ApiOperation({ summary: 'Actualizar una regla de transicion de estado' })
  async updateTransition(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWorkflowTransitionDto,
    @GetUser() currentUser: UserEntity,
  ) {
    return await this.workflowService.updateTransition(id, dto, currentUser);
  }

  @CheckPolicies((ability) =>
    ability.can(Action.DELETE, 'WorkflowTransition'),
  )
  @UseGuards(PoliciesGuard)
  @Delete('transitions/:id')
  @ApiOperation({ summary: 'Eliminacion logica de regla de transicion' })
  async removeTransition(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() currentUser: UserEntity,
  ) {
    return await this.workflowService.removeTransition(id, currentUser);
  }

  // --- Endpoints de Permisos de Campo por Estado (ABAC) ---

  @CheckPolicies((ability) =>
    ability.can(Action.READ, 'FieldStatePermission'),
  )
  @UseGuards(PoliciesGuard)
  @Get('field-permissions')
  @ApiOperation({
    summary:
      'Obtener lista de reglas ABAC de campos y valores permitidos por estado',
  })
  @ApiQuery({
    name: 'module',
    required: false,
    description: 'Filtrar por codigo de modulo',
  })
  @ApiQuery({
    name: 'state',
    required: false,
    description: 'Filtrar por estado del modulo',
  })
  async findAllFieldPermissions(
    @Query('module') moduleFilter?: string,
    @Query('state') stateFilter?: string,
  ) {
    return await this.workflowService.findAllFieldPermissions(
      moduleFilter,
      stateFilter,
    );
  }

  @CheckPolicies((ability) =>
    ability.can(Action.READ, 'FieldStatePermission'),
  )
  @UseGuards(PoliciesGuard)
  @Get('field-permissions/:id')
  @ApiOperation({
    summary: 'Obtener detalle de una regla de permisos de campo por ID',
  })
  async findFieldPermissionById(@Param('id', ParseIntPipe) id: number) {
    return await this.workflowService.findFieldPermissionById(id);
  }

  @CheckPolicies((ability) =>
    ability.can(Action.CREATE, 'FieldStatePermission'),
  )
  @UseGuards(PoliciesGuard)
  @Post('field-permissions')
  @ApiOperation({
    summary: 'Crear una nueva regla de permisos de campo y valores (ABAC)',
  })
  async createFieldPermission(
    @Body() dto: CreateFieldStatePermissionDto,
    @GetUser() currentUser: UserEntity,
  ) {
    return await this.workflowService.createFieldPermission(dto, currentUser);
  }

  @CheckPolicies((ability) =>
    ability.can(Action.UPDATE, 'FieldStatePermission'),
  )
  @UseGuards(PoliciesGuard)
  @Patch('field-permissions/:id')
  @ApiOperation({ summary: 'Actualizar una regla de permisos de campo' })
  async updateFieldPermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFieldStatePermissionDto,
    @GetUser() currentUser: UserEntity,
  ) {
    return await this.workflowService.updateFieldPermission(
      id,
      dto,
      currentUser,
    );
  }

  @CheckPolicies((ability) =>
    ability.can(Action.DELETE, 'FieldStatePermission'),
  )
  @UseGuards(PoliciesGuard)
  @Delete('field-permissions/:id')
  @ApiOperation({ summary: 'Eliminacion logica de regla de permisos de campo' })
  async removeFieldPermission(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() currentUser: UserEntity,
  ) {
    return await this.workflowService.removeFieldPermission(id, currentUser);
  }
}
