import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'usuario@empresa.com',
    description: 'Correo electrónico de la cuenta',
  })
  @IsNotEmpty({ message: 'El correo electrónico no puede estar vacío' })
  @IsEmail({}, { message: 'El formato del correo electrónico es inválido' })
  email: string;

  @ApiProperty({
    example: 'abcdef123456',
    description: 'Token de restablecimiento de contraseña enviado al correo',
  })
  @IsNotEmpty({ message: 'El token de restablecimiento es requerido' })
  token: string;

  @ApiProperty({
    example: 'NuevaContrasena123!',
    description: 'Nueva contraseña para la cuenta (mínimo 6 caracteres)',
  })
  @IsNotEmpty({ message: 'La nueva contraseña no puede estar vacía' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  newPassword: string;
}
