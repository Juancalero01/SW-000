import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Action } from '../auth/authorization/authorization.types.js';
import { GetUser } from '../auth/decorators/get-user.decorator.js';
import { CheckPolicies } from '../auth/decorators/policies.decorator.js';
import { PoliciesGuard } from '../auth/guards/policies.guard.js';
import { UserEntity } from '../users/entities/user.entity.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { RolesService } from './roles.service.js';

@ApiBearerAuth()
@ApiTags('Roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @CheckPolicies((ability) => ability.can(Action.READ, 'Role'))
  @UseGuards(PoliciesGuard)
  @Get()
  @ApiOperation({ summary: 'Obtener lista completa de roles con sus permisos' })
  async findAll(@GetUser() currentUser: UserEntity) {
    return await this.rolesService.findAll(currentUser);
  }

  @CheckPolicies((ability) => ability.can(Action.READ, 'Role'))
  @UseGuards(PoliciesGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un rol por ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.rolesService.findOne(id);
  }

  @CheckPolicies((ability) => ability.can(Action.CREATE, 'Role'))
  @UseGuards(PoliciesGuard)
  @Post()
  @ApiOperation({ summary: 'Crear un nuevo rol personalizado con permisos existentes o inline' })
  async create(
    @Body() createRoleDto: CreateRoleDto,
    @GetUser() currentUser: UserEntity,
  ) {
    return await this.rolesService.create(createRoleDto, currentUser);
  }

  @CheckPolicies((ability) => ability.can(Action.UPDATE, 'Role'))
  @UseGuards(PoliciesGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un rol y/o sus permisos asignados' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
    @GetUser() currentUser: UserEntity,
  ) {
    return await this.rolesService.update(id, updateRoleDto, currentUser);
  }

  @CheckPolicies((ability) => ability.can(Action.DELETE, 'Role'))
  @UseGuards(PoliciesGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminacion logica de rol personalizado (si no tiene usuarios asignados)' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() currentUser: UserEntity,
  ) {
    return await this.rolesService.remove(id, currentUser);
  }
}
