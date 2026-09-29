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
import { CreateModuleDto } from './dto/create-module.dto.js';
import { UpdateModuleDto } from './dto/update-module.dto.js';
import { ModulesRegistryService } from './modules-registry.service.js';

@ApiBearerAuth()
@ApiTags('Registro de Módulos')
@Controller('modules')
export class ModulesRegistryController {
  constructor(
    private readonly modulesRegistryService: ModulesRegistryService,
  ) {}

  @Get('me')
  @ApiOperation({
    summary:
      'Obtener lista de modulos autorizados para el usuario autenticado (Menu dinamico)',
  })
  async getMyModules(@GetUser() user: UserEntity) {
    return await this.modulesRegistryService.getAuthorizedModulesForUser(user);
  }

  @CheckPolicies((ability) => ability.can(Action.READ, 'Module'))
  @UseGuards(PoliciesGuard)
  @Get()
  @ApiOperation({
    summary: 'Obtener lista completa de modulos del sistema (Vista Admin)',
  })
  async findAll() {
    return await this.modulesRegistryService.findAll();
  }

  @CheckPolicies((ability) => ability.can(Action.READ, 'Module'))
  @UseGuards(PoliciesGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un modulo por ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.modulesRegistryService.findOne(id);
  }

  @CheckPolicies((ability) => ability.can(Action.CREATE, 'Module'))
  @UseGuards(PoliciesGuard)
  @Post()
  @ApiOperation({ summary: 'Crear un nuevo modulo de navegacion' })
  async create(
    @Body() createModuleDto: CreateModuleDto,
    @GetUser() currentUser: UserEntity,
  ) {
    return await this.modulesRegistryService.create(
      createModuleDto,
      currentUser,
    );
  }

  @CheckPolicies((ability) => ability.can(Action.UPDATE, 'Module'))
  @UseGuards(PoliciesGuard)
  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar propiedades, orden o estado de un modulo',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateModuleDto: UpdateModuleDto,
    @GetUser() currentUser: UserEntity,
  ) {
    return await this.modulesRegistryService.update(
      id,
      updateModuleDto,
      currentUser,
    );
  }

  @CheckPolicies((ability) => ability.can(Action.DELETE, 'Module'))
  @UseGuards(PoliciesGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminacion logica de modulo' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() currentUser: UserEntity,
  ) {
    return await this.modulesRegistryService.remove(id, currentUser);
  }
}
