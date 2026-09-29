import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';

@Entity('workflow_transitions')
export class WorkflowTransitionEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  module: string;

  @Column({ type: 'varchar', length: 100 })
  fromState: string;

  @Column({ type: 'varchar', length: 100 })
  toState: string;

  @Column({ type: 'json' })
  allowedRoles: string[];

  @Column({ type: 'json', nullable: true })
  conditions: Record<string, any> | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;
}
