import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateFieldStatePermissionDto {
  @ApiProperty({
    example: 'CLIENTS',
    description: 'Codigo del modulo activo al que aplica la regla de campos',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase().trim() : value,
  )
  module: string;

  @ApiProperty({
    example: 'ACTIVE',
    description: 'Estado del modulo donde aplica la regla',
  })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({
    example: 'GERENTE_VENTAS',
    description: 'Rol de usuario al que aplica la restriccion de campos',
  })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiPropertyOptional({
    example: ['creditLimit', 'notes'],
    description: 'Lista de campos editables para este rol y estado',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  editableFields?: string[];

  @ApiPropertyOptional({
    example: ['taxId', 'clientType'],
    description: 'Lista de campos de solo lectura para este rol y estado',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readOnlyFields?: string[];

  @ApiPropertyOptional({
    example: { priority: ['ALTA', 'MEDIA'] },
    description:
      'Esquema JSON flexible de valores permitidos por campo (Whitelist)',
  })
  @IsOptional()
  @IsObject()
  allowedValues?: Record<string, any[]>;
}
