import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserApprovalStatus } from '../enums/approval-status.enum.js';

export class CreateUserDto {
  @ApiProperty({ description: 'Correo electrónico del usuario', example: 'juan.perez@example.com' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @MaxLength(255, { message: 'El correo electrónico no puede exceder los 255 caracteres' })
  email: string;

  @ApiPropertyOptional({ description: 'Contraseña del usuario (mínimo 8 caracteres)', example: 'Password123!' })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password?: string;

  @ApiProperty({ description: 'Nombre completo del usuario', example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre completo es requerido' })
  @MinLength(2, { message: 'El nombre completo debe tener al menos 2 caracteres' })
  @MaxLength(255, { message: 'El nombre completo no puede exceder los 255 caracteres' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/, { message: 'El nombre completo solo debe contener letras y espacios' })
  fullName: string;

  @ApiPropertyOptional({ description: 'Número telefónico', example: '+5491123456789' })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'El número telefónico no puede exceder los 50 caracteres' })
  @Matches(/^\+?[0-9\s\-()]{6,50}$/, { message: 'El número telefónico no tiene un formato válido' })
  phoneNumber?: string;

  @ApiProperty({
    type: [String],
    example: ['USER'],
    description: 'Nombres de los roles asignados al usuario (almacenados dinámicamente en BD)',
  })
  @IsArray({ message: 'El rol asignado debe ser un arreglo' })
  @ArrayNotEmpty({ message: 'El rol asignado es requerido' })
  @IsString({ each: true, message: 'Cada rol debe ser una cadena de texto' })
  roles?: string[];

  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(UserApprovalStatus)
  approvalStatus?: UserApprovalStatus;

  @IsOptional()
  @IsBoolean()
  mustChangePassword?: boolean;
}
