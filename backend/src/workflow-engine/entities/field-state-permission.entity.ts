import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';

@Entity('field_state_permissions')
export class FieldStatePermissionEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  module: string;

  @Column({ type: 'varchar', length: 100 })
  state: string;

  @Column({ type: 'varchar', length: 100 })
  role: string;

  @Column({ type: 'json' })
  editableFields: string[];

  @Column({ type: 'json', nullable: true })
  readOnlyFields: string[] | null;

  @Column({ type: 'json', nullable: true })
  allowedValues: Record<string, string[]> | null;
}
