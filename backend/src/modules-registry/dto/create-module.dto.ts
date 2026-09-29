import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateModuleDto {
  @ApiProperty({
    example: 'CLIENTS',
    description: 'Codigo unico del modulo en mayusculas (SNAKE_CASE)',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase().trim() : value,
  )
  code: string;

  @ApiProperty({
    example: 'Gestion de Clientes',
    description: 'Nombre visible del modulo en el menu',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'Modulo comercial de administracion de clientes',
    description: 'Descripcion del modulo',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: '/clients',
    description: 'Ruta de navegacion en el frontend',
  })
  @IsString()
  @IsNotEmpty()
  route: string;

  @ApiPropertyOptional({
    example: 'business',
    description: 'Identificador dinamico del icono para el menu',
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Orden de despliegue en la barra lateral',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Estado de activacion del modulo',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
