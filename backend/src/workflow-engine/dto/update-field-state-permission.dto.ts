import { PartialType } from '@nestjs/swagger';
import { CreateFieldStatePermissionDto } from './create-field-state-permission.dto.js';

export class UpdateFieldStatePermissionDto extends PartialType(
  CreateFieldStatePermissionDto,
) {}
