import { Exclude } from 'class-transformer';
import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { RoleEntity } from '../../roles/entities/role.entity.js';
import { UserApprovalStatus } from '../enums/approval-status.enum.js';

@Entity('users')
export class UserEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  fullName: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phoneNumber: string | null;

  @Exclude({ toPlainOnly: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  password: string | null;

  @ManyToMany(() => RoleEntity, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: RoleEntity[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Column({
    type: 'enum',
    enum: UserApprovalStatus,
    default: UserApprovalStatus.APPROVED,
  })
  approvalStatus: UserApprovalStatus;

  @Column({ type: 'boolean', default: false })
  mustChangePassword: boolean;

  @Exclude({ toPlainOnly: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  resetPasswordToken: string | null;

  @Exclude({ toPlainOnly: true })
  @Column({ type: 'datetime', nullable: true })
  resetPasswordExpires: Date | null;
}
