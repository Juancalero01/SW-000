import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'Correo electrónico', example: 'usuario@example.com' })
  @IsEmail({}, { message: 'Formato de correo electrónico inválido' })
  email: string;

  @ApiProperty({ description: 'Contraseña del usuario', example: 'Password123!' })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña no puede estar vacía' })
  password: string;
}
