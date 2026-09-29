import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.roles) {
      return false;
    }

    // Extraer nombres de roles dinámicos provenientes de RoleEntity en MySQL
    const userRoleNames = user.roles.map((r: any) => (typeof r === 'string' ? r : r.name));

    // El rol 'ADMIN' tiene acceso concedido por defecto a cualquier endpoint protegido por rol
    if (userRoleNames.includes('ADMIN')) {
      return true;
    }

    return requiredRoles.some((role) => userRoleNames.includes(role));
  }
}
