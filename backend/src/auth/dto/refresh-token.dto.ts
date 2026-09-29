import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh Token emitido previamente' })
  @IsString()
  @IsNotEmpty({ message: 'El refreshToken no puede estar vacío' })
  refreshToken: string;
}
