import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    example: 'usuario@correo.com',
    description: 'Correo electronico del usuario a verificar',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'a1b2c3d4e5f6',
    description: 'Codigo o token de verificacion enviado por correo',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
