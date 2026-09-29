import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Action } from '../auth/authorization/authorization.types.js';
import { GetUser } from '../auth/decorators/get-user.decorator.js';
import { CheckPolicies } from '../auth/decorators/policies.decorator.js';
import { PoliciesGuard } from '../auth/guards/policies.guard.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { QueryUsersDto } from './dto/query-users.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserEntity } from './entities/user.entity.js';
import { UsersService } from './users.service.js';

@ApiBearerAuth()
@ApiTags('Usuarios')
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @CheckPolicies((ability) => ability.can(Action.CREATE, 'User'))
  @UseGuards(PoliciesGuard)
  @Post()
  @ApiOperation({ summary: 'Crear nuevo usuario con asignación de roles' })
  async create(
    @Body() createUserDto: CreateUserDto,
    @GetUser() currentUser: UserEntity,
  ) {
    return await this.usersService.create(createUserDto, currentUser);
  }

  @CheckPolicies((ability) => ability.can(Action.READ, 'User'))
  @UseGuards(PoliciesGuard)
  @Get()
  @ApiOperation({ summary: 'Obtener lista paginada de usuarios (Requiere permiso de lectura sobre User)' })
  async findAll(@Query() queryUsersDto: QueryUsersDto) {
    return await this.usersService.findAll(queryUsersDto);
  }

  @CheckPolicies((ability) => ability.can(Action.READ, 'User'))
  @UseGuards(PoliciesGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de usuario por ID' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() currentUser: UserEntity,
  ) {
    const isAdmin = currentUser.roles?.some((r) => r.name === 'ADMIN');
    if (currentUser.id !== id && !isAdmin) {
      throw new ForbiddenException('No posees permisos para consultar este perfil');
    }
    return await this.usersService.findById(id);
  }

  @CheckPolicies((ability) => ability.can(Action.UPDATE, 'User'))
  @UseGuards(PoliciesGuard)
  @Patch(':id/approve')
  @ApiOperation({ summary: 'Aprobar solicitud de registro de usuario (Solo Administrador)' })
  async approve(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() currentUser: UserEntity,
  ) {
    return await this.usersService.approveUser(id, currentUser);
  }

  @CheckPolicies((ability) => ability.can(Action.UPDATE, 'User'))
  @UseGuards(PoliciesGuard)
  @Patch(':id/reject')
  @ApiOperation({ summary: 'Rechazar solicitud de registro de usuario (Solo Administrador)' })
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason: string,
    @GetUser() currentUser: UserEntity,
  ) {
    return await this.usersService.rejectUser(id, reason, currentUser);
  }

  @CheckPolicies((ability) => ability.can(Action.UPDATE, 'User'))
  @UseGuards(PoliciesGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar información o roles de usuario' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() currentUser: UserEntity,
  ) {
    const isAdmin = currentUser.roles?.some((r) => r.name === 'ADMIN');
    if (currentUser.id !== id && !isAdmin) {
      throw new ForbiddenException('No posees permisos para actualizar este usuario');
    }
    return await this.usersService.updateUser(id, updateUserDto, currentUser);
  }

  @CheckPolicies((ability) => ability.can(Action.DELETE, 'User'))
  @UseGuards(PoliciesGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminación lógica de usuario (Soft Delete - Requiere permiso DELETE en User)' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() currentUser: UserEntity,
  ) {
    return await this.usersService.softDelete(id, currentUser);
  }

  @CheckPolicies((ability) => ability.can(Action.UPDATE, 'User'))
  @UseGuards(PoliciesGuard)
  @Post(':id/restore')
  @ApiOperation({ summary: 'Restaurar usuario eliminado lógicamente (Requiere permiso UPDATE en User)' })
  async restore(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.restore(id);
  }

  @CheckPolicies((ability) => ability.can(Action.READ, 'User'))
  @UseGuards(PoliciesGuard)
  @Get(':id/reset-password-status')
  @ApiOperation({ summary: 'Verificar si el usuario posee un token activo de restablecimiento de contraseña' })
  async getResetPasswordStatus(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.getResetPasswordStatus(id);
  }

  @CheckPolicies((ability) => ability.can(Action.UPDATE, 'User'))
  @UseGuards(PoliciesGuard)
  @Post(':id/reset-password-email')
  @ApiOperation({ summary: 'Enviar correo de restablecimiento de contraseña al usuario (Solo Administrador)' })
  async sendPasswordResetEmail(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.sendPasswordResetEmail(id);
  }
}
