import {
  AbilityBuilder,
  createMongoAbility,
  ExtractSubjectType,
  InferSubjects,
  MongoAbility,
  RawRuleOf,
} from '@casl/ability';
import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service.js';
import { RoleEntity } from '../../roles/entities/role.entity.js';
import { UserEntity } from '../../users/entities/user.entity.js';
import { Action } from './authorization.types.js';

export type Subjects =
  | InferSubjects<typeof UserEntity | typeof RoleEntity>
  | RoleEntity
  | 'User'
  | 'UserEntity'
  | 'Form'
  | 'AuditLog'
  | 'Role'
  | 'RoleEntity'
  | 'Permission'
  | 'PermissionEntity'
  | 'Module'
  | 'ModuleEntity'
  | 'WorkflowTransition'
  | 'WorkflowTransitionEntity'
  | 'FieldStatePermission'
  | 'FieldStatePermissionEntity'
  | 'Dashboard'
  | 'all';

export type AppAbility = MongoAbility<[Action, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  private readonly logger = new Logger(CaslAbilityFactory.name);

  constructor(private readonly redisService: RedisService) {}

  async createForUserAsync(user: UserEntity): Promise<AppAbility> {
    const cacheKey = `user:permissions:${user.id}`;
    let rules = await this.redisService.get<RawRuleOf<AppAbility>[]>(cacheKey);

    if (!rules) {
      this.logger.debug(`Generando reglas de permisos desde BD para usuario ${user.id}...`);
      rules = this.extractRulesFromUser(user);
      await this.redisService.set(cacheKey, rules, 3600);
    } else {
      this.logger.debug(`Reglas cargadas desde caché de Redis para usuario ${user.id}`);
    }

    return createMongoAbility<AppAbility>(rules as any, {
      detectSubjectType: (item) => {
        if (typeof item === 'string') return item;
        if ((item as any)?.__caslSubjectType__) return (item as any).__caslSubjectType__;
        if ((item as any)?.__typename) return (item as any).__typename;
        const name = item.constructor?.name;
        if (name && name.endsWith('Entity')) {
          return name.replace(/Entity$/, '') as ExtractSubjectType<Subjects>;
        }
        return (item.constructor as ExtractSubjectType<Subjects>) || (item as any);
      },
    });
  }

  private extractRulesFromUser(user: UserEntity): RawRuleOf<AppAbility>[] {
    const { can, cannot, rules } = new AbilityBuilder<AppAbility>(createMongoAbility);

    // Permiso por defecto ABAC de pertenencia
    can(Action.UPDATE, UserEntity, { id: user.id });

    // Permisos dinámicos extraídos de la BD por roles asignados al usuario
    if (user.roles && Array.isArray(user.roles)) {
      for (const role of user.roles) {
        if (role.permissions && Array.isArray(role.permissions)) {
          for (const perm of role.permissions) {
            const action = perm.action as Action;
            const subject = perm.subject as any;
            const fields = perm.fields && perm.fields.length > 0 ? perm.fields : undefined;
            const conditions = perm.conditions || undefined;

            if (perm.inverted) {
              cannot(action, subject, fields, conditions);
            } else {
              can(action, subject, fields, conditions);
            }
          }
        }
      }
    }

    return rules;
  }

  async invalidateUserPermissionsCache(userId: number): Promise<void> {
    await this.redisService.del(`user:permissions:${userId}`);
  }
}
