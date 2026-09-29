import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';

@Entity('permissions')
export class PermissionEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ type: 'varchar', length: 100 })
  subject: string;

  @Column({ type: 'json', nullable: true })
  fields: string[] | null;

  @Column({ type: 'json', nullable: true })
  conditions: Record<string, any> | null;

  @Column({ type: 'boolean', default: false })
  inverted: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;
}
