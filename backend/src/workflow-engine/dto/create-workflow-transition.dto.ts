import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateWorkflowTransitionDto {
  @ApiProperty({
    example: 'CLIENTS',
    description: 'Codigo del modulo activo al que aplica la transicion',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase().trim() : value,
  )
  module: string;

  @ApiProperty({
    example: 'LEAD',
    description: 'Estado inicial de la transicion',
  })
  @IsString()
  @IsNotEmpty()
  fromState: string;

  @ApiProperty({
    example: 'ACTIVE',
    description: 'Estado final destino de la transicion',
  })
  @IsString()
  @IsNotEmpty()
  toState: string;

  @ApiProperty({
    example: ['ADMIN', 'GERENTE_VENTAS'],
    description: 'Lista de roles autorizados para ejecutar la transicion',
  })
  @IsArray()
  @IsString({ each: true })
  allowedRoles: string[];

  @ApiPropertyOptional({
    example: { isWarranty: false },
    description: 'Esquema JSON flexible de condiciones ABAC de contexto',
  })
  @IsOptional()
  @IsObject()
  conditions?: Record<string, any>;

  @ApiPropertyOptional({
    example: 'Aprobacion comercial de cliente activo',
    description: 'Descripcion legible de la transicion',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
