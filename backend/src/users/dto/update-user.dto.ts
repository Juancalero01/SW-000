import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateUserDto } from './create-user.dto.js';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ description: 'Estado activo/inactivo del usuario (Solo Administradores)' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
