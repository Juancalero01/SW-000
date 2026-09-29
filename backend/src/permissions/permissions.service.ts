import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { CreatePermissionDto } from '../roles/dto/create-permission.dto.js';
import { PermissionEntity } from './entities/permission.entity.js';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(PermissionEntity)
    private readonly permissionRepository: Repository<PermissionEntity>,
  ) {}

  async findAll(): Promise<PermissionEntity[]> {
    return await this.permissionRepository.find({
      where: { deletedAt: IsNull() },
      order: { subject: 'ASC', action: 'ASC' },
    });
  }

  async findByIds(ids: number[]): Promise<PermissionEntity[]> {
    if (!ids || ids.length === 0) return [];
    return await this.permissionRepository.find({
      where: { id: In(ids), deletedAt: IsNull() },
    });
  }

  async create(dto: CreatePermissionDto): Promise<PermissionEntity> {
    const perm = this.permissionRepository.create({
      action: dto.action,
      subject: dto.subject,
      fields: dto.fields || null,
      conditions: dto.conditions || null,
      inverted: dto.inverted ?? false,
      description: dto.description || null,
    });

    return await this.permissionRepository.save(perm);
  }
}
