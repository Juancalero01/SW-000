import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { UserApprovalStatus } from '../enums/approval-status.enum.js';

export class QueryUsersDto {
  @ApiPropertyOptional({ description: 'Número de página', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ description: 'Cantidad de elementos por página', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @ApiPropertyOptional({ description: 'Término de búsqueda por nombre o correo' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: UserApprovalStatus, description: 'Filtrar por estado de aprobación' })
  @IsOptional()
  @IsEnum(UserApprovalStatus)
  approvalStatus?: UserApprovalStatus;

  @ApiPropertyOptional({ description: 'Filtrar por nombre de rol' })
  @IsOptional()
  @IsString()
  roleName?: string;

  @ApiPropertyOptional({ description: 'Filtrar por estado activo/inactivo' })
  @IsOptional()
  @Transform(({ value, obj, key }) => {
    const raw = obj?.[key] !== undefined ? obj[key] : value;
    if (raw === 'true' || raw === true || raw === '1' || raw === 1) return true;
    if (raw === 'false' || raw === false || raw === '0' || raw === 0) return false;
    return undefined;
  })
  @IsBoolean()
  isActive?: boolean;
}
