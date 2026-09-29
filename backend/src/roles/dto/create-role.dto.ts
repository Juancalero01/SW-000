import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreatePermissionDto } from './create-permission.dto.js';

export class CreateRoleDto {
  @ApiProperty({
    example: 'GERENTE_VENTAS',
    description: 'Nombre unico identificador del rol',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'Gerente Comercial y de Ventas',
    description: 'Descripcion del rol y responsabilidades',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: [1, 2],
    description: 'Lista de IDs de permisos existentes a asociar',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  permissionIds?: number[];

  @ApiPropertyOptional({
    type: [CreatePermissionDto],
    description: 'Lista de nuevos permisos dinamicos a crear inline',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePermissionDto)
  newPermissions?: CreatePermissionDto[];
}
