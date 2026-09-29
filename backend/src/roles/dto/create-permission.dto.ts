import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({
    example: 'read',
    description: 'Accion CASL (create, read, update, delete, manage)',
  })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiProperty({
    example: 'Client',
    description: 'Sujeto sobre el que aplica el permiso (Client, User, Form, all)',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiPropertyOptional({
    example: ['creditLimit'],
    description: 'Lista de campos restringidos (ABAC por campo)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[];

  @ApiPropertyOptional({
    example: { isWarranty: true },
    description: 'Condiciones JSON de contexto ABAC',
  })
  @IsOptional()
  @IsObject()
  conditions?: Record<string, any>;

  @ApiPropertyOptional({
    example: false,
    description: 'Indica si el permiso es de prohibicion (cannot)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  inverted?: boolean;

  @ApiPropertyOptional({
    example: 'Lectura de datos de clientes',
    description: 'Descripcion legible del permiso',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
