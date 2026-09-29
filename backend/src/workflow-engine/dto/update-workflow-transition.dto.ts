import { PartialType } from '@nestjs/swagger';
import { CreateWorkflowTransitionDto } from './create-workflow-transition.dto.js';

export class UpdateWorkflowTransitionDto extends PartialType(
  CreateWorkflowTransitionDto,
) {}
