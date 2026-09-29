import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { FieldStatePermissionEntity } from '../../workflow-engine/entities/field-state-permission.entity.js';
import { WorkflowTransitionEntity } from '../../workflow-engine/entities/workflow-transition.entity.js';
import { ModuleEntity } from '../../modules-registry/entities/module.entity.js';
import { PermissionEntity } from '../../permissions/entities/permission.entity.js';
import { RoleEntity } from '../../roles/entities/role.entity.js';
import { UserEntity } from '../../users/entities/user.entity.js';
import { UserApprovalStatus } from '../../users/enums/approval-status.enum.js';
import { AppDataSource } from '../data-source.js';

async function runSeeds() {
  console.log('Inicializando conexión a la base de datos para sembrado (Seeding)...');
  await AppDataSource.initialize();

  try {
    console.log('Sembrando Roles y Permisos iniciales de la Aplicación Base...');
    const permRepo = AppDataSource.getRepository(PermissionEntity);
    const roleRepo = AppDataSource.getRepository(RoleEntity);
    const userRepo = AppDataSource.getRepository(UserEntity);

    // 1. Permisos Base
    let superadminPerm = await permRepo.findOneBy({ action: 'manage', subject: 'all' });
    if (!superadminPerm) {
      superadminPerm = await permRepo.save(
        permRepo.create({
          action: 'manage',
          subject: 'all',
          description: 'Control total de la plataforma',
        }),
      );
    }

    let userManagePerm = await permRepo.findOneBy({ action: 'manage', subject: 'User' });
    if (!userManagePerm) {
      userManagePerm = await permRepo.save(
        permRepo.create({
          action: 'manage',
          subject: 'User',
          description: 'Gestión completa de usuarios',
        }),
      );
    }

    let roleManagePerm = await permRepo.findOneBy({ action: 'manage', subject: 'Role', inverted: false });
    if (!roleManagePerm) {
      roleManagePerm = await permRepo.save(
        permRepo.create({
          action: 'manage',
          subject: 'Role',
          description: 'Gestión completa de roles',
        }),
      );
    }

    let adminRoleRestrictedPerm = await permRepo.findOneBy({
      action: 'manage',
      subject: 'Role',
      inverted: true,
    });
    if (!adminRoleRestrictedPerm) {
      adminRoleRestrictedPerm = await permRepo.save(
        permRepo.create({
          action: 'manage',
          subject: 'Role',
          conditions: { name: { $in: ['SUPERADMIN', 'ADMIN'] } },
          inverted: true,
          description: 'Restricción de gestión y asignación de roles Superadministrador y Administrador',
        }),
      );
    }

    let permManagePerm = await permRepo.findOneBy({ action: 'manage', subject: 'Permission' });
    if (!permManagePerm) {
      permManagePerm = await permRepo.save(
        permRepo.create({
          action: 'manage',
          subject: 'Permission',
          description: 'Gestión completa de permisos',
        }),
      );
    }

    let auditReadPerm = await permRepo.findOneBy({ action: 'read', subject: 'AuditLog' });
    if (!auditReadPerm) {
      auditReadPerm = await permRepo.save(
        permRepo.create({
          action: 'read',
          subject: 'AuditLog',
          description: 'Lectura de logs de auditoría',
        }),
      );
    }

    let userReadPerm = await permRepo.findOneBy({ action: 'read', subject: 'User' });
    if (!userReadPerm) {
      userReadPerm = await permRepo.save(
        permRepo.create({
          action: 'read',
          subject: 'User',
          description: 'Lectura de usuarios',
        }),
      );
    }

    let userUpdatePerm = await permRepo.findOneBy({ action: 'update', subject: 'User' });
    if (!userUpdatePerm) {
      userUpdatePerm = await permRepo.save(
        permRepo.create({
          action: 'update',
          subject: 'User',
          description: 'Edición propia de usuario',
        }),
      );
    }

    let workflowManagePerm = await permRepo.findOneBy({ action: 'manage', subject: 'WorkflowTransition' });
    if (!workflowManagePerm) {
      workflowManagePerm = await permRepo.save(
        permRepo.create({
          action: 'manage',
          subject: 'WorkflowTransition',
          description: 'Gestión de transiciones de flujos de trabajo',
        }),
      );
    }

    let fieldPermManagePerm = await permRepo.findOneBy({ action: 'manage', subject: 'FieldStatePermission' });
    if (!fieldPermManagePerm) {
      fieldPermManagePerm = await permRepo.save(
        permRepo.create({
          action: 'manage',
          subject: 'FieldStatePermission',
          description: 'Gestión de permisos de campo por estado',
        }),
      );
    }

    let moduleManagePerm = await permRepo.findOneBy({ action: 'manage', subject: 'Module' });
    if (!moduleManagePerm) {
      moduleManagePerm = await permRepo.save(
        permRepo.create({
          action: 'manage',
          subject: 'Module',
          description: 'Gestión de módulos del sistema',
        }),
      );
    }

    // 2. Roles Base
    let superadminRole = await roleRepo.findOneBy({ name: 'SUPERADMIN' });
    if (!superadminRole) {
      superadminRole = await roleRepo.save(
        roleRepo.create({
          name: 'SUPERADMIN',
          description: 'Super Administrador del Sistema',
          isSystem: true,
          permissions: [superadminPerm],
        }),
      );
    }

    let adminRole = await roleRepo.findOneBy({ name: 'ADMIN' });
    const adminPermissionsList = [
      userManagePerm,
      roleManagePerm,
      permManagePerm,
      auditReadPerm,
      adminRoleRestrictedPerm,
      workflowManagePerm,
      fieldPermManagePerm,
      moduleManagePerm,
    ];

    if (!adminRole) {
      adminRole = await roleRepo.save(
        roleRepo.create({
          name: 'ADMIN',
          description: 'Administrador del Sistema',
          isSystem: true,
          permissions: adminPermissionsList,
        }),
      );
    } else {
      adminRole.permissions = adminPermissionsList;
      await roleRepo.save(adminRole);
    }

    let userRole = await roleRepo.findOneBy({ name: 'USER' });
    if (!userRole) {
      userRole = await roleRepo.save(
        roleRepo.create({
          name: 'USER',
          description: 'Usuario Estándar de la Plataforma',
          isSystem: true,
          permissions: [userReadPerm, userUpdatePerm],
        }),
      );
    }

    console.log('Roles y Permisos creados y verificados.');

    // 3. Usuarios Maestros Iniciales
    console.log('Sembrando Cuentas Maestras Iniciales...');
    const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

    const testUsers = [
      {
        email: 'superadmin@sw000.com',
        fullName: 'Super Administrador',
        phoneNumber: '+54 9 11 0000 0001',
        password: defaultPasswordHash,
        roles: [superadminRole],
        isActive: true,
        isEmailVerified: true,
        approvalStatus: UserApprovalStatus.APPROVED,
      },
      {
        email: 'admin@sw000.com',
        fullName: 'Administrador General',
        phoneNumber: '+54 9 11 0000 0002',
        password: defaultPasswordHash,
        roles: [adminRole],
        isActive: true,
        isEmailVerified: true,
        approvalStatus: UserApprovalStatus.APPROVED,
      },
      {
        email: 'user@sw000.com',
        fullName: 'Usuario Normal',
        phoneNumber: '+54 9 11 0000 0003',
        password: defaultPasswordHash,
        roles: [userRole],
        isActive: true,
        isEmailVerified: true,
        approvalStatus: UserApprovalStatus.APPROVED,
      },
    ];

    for (const testUser of testUsers) {
      let existing = await userRepo.findOneBy({ email: testUser.email });
      if (!existing) {
        await userRepo.save(userRepo.create(testUser));
      } else {
        existing.fullName = testUser.fullName;
        existing.phoneNumber = testUser.phoneNumber;
        existing.roles = testUser.roles;
        existing.isActive = testUser.isActive;
        existing.approvalStatus = testUser.approvalStatus;
        await userRepo.save(existing);
      }
    }
    console.log('Cuentas maestras sembradas.');

    // 4. Registro de Módulos Base
    console.log('Sembrando Módulos Base...');
    const moduleRepo = AppDataSource.getRepository(ModuleEntity);
    if ((await moduleRepo.count()) === 0) {
      await moduleRepo.save([
        moduleRepo.create({
          code: 'DASHBOARD',
          name: 'Dashboard Principal',
          description: 'Panel de métricas del sistema y accesos directos',
          route: '/dashboard',
          icon: 'dashboard',
          order: 1,
        }),
        moduleRepo.create({
          code: 'USERS',
          name: 'Gestión de Usuarios',
          description: 'Módulo de administración de usuarios y estados de cuenta',
          route: '/users',
          icon: 'people',
          order: 2,
        }),
        moduleRepo.create({
          code: 'ROLES',
          name: 'Roles y Permisos',
          description: 'Módulo de administración de roles y matriz de permisos',
          route: '/roles',
          icon: 'security',
          order: 3,
        }),
        moduleRepo.create({
          code: 'WORKFLOWS',
          name: 'Flujos de Trabajo',
          description: 'Módulo de transiciones y permisos ABAC de estados y campos',
          route: '/workflow-engine',
          icon: 'account_tree',
          order: 4,
        }),
        moduleRepo.create({
          code: 'AUDIT',
          name: 'Auditoría del Sistema',
          description: 'Módulo de registro centralizado de eventos y auditoría',
          route: '/audit-logs',
          icon: 'history',
          order: 5,
        }),
      ]);
      console.log('Módulos Base de Navegación creados.');
    }

    // 5. Transiciones de Flujo de Trabajo para el Módulo USERS
    console.log('Sembrando Transiciones de Flujo de Trabajo para Módulo USERS...');
    const transitionRepo = AppDataSource.getRepository(WorkflowTransitionEntity);

    const userTransitions = [
      {
        module: 'USERS',
        fromState: 'PENDING',
        toState: 'APPROVED',
        allowedRoles: ['ADMIN', 'SUPERADMIN'],
        description: 'Aprobación de registro: activa la cuenta y envía credenciales temporales',
      },
      {
        module: 'USERS',
        fromState: 'PENDING',
        toState: 'REJECTED',
        allowedRoles: ['ADMIN', 'SUPERADMIN'],
        description: 'Rechazo de registro: desactiva la cuenta y envía motivo de rechazo',
      },
      {
        module: 'USERS',
        fromState: 'REJECTED',
        toState: 'DELETED',
        allowedRoles: ['ADMIN', 'SUPERADMIN'],
        description: 'Eliminación permitida para cuentas rechazadas',
      },
      {
        module: 'USERS',
        fromState: 'APPROVED',
        toState: 'DELETED',
        allowedRoles: ['SUPERADMIN'],
        description: 'Eliminación exclusiva de cuentas aprobadas para Superadministrador',
      },
      {
        module: 'USERS',
        fromState: 'PENDING',
        toState: 'DELETED',
        allowedRoles: ['SUPERADMIN'],
        description: 'Eliminación exclusiva de cuentas pendientes para Superadministrador',
      },
    ];

    for (const ut of userTransitions) {
      const existing = await transitionRepo.findOneBy({
        module: ut.module,
        fromState: ut.fromState,
        toState: ut.toState,
      });
      if (!existing) {
        await transitionRepo.save(transitionRepo.create(ut));
      } else {
        existing.allowedRoles = ut.allowedRoles;
        existing.description = ut.description;
        await transitionRepo.save(existing);
      }
    }
    console.log('Transiciones de flujo para Módulo USERS verificadas.');

    // 6. Permisos de Campos 4D para el Módulo USERS
    console.log('Sembrando Reglas de Campos para Módulo USERS...');
    const fieldPermRepo = AppDataSource.getRepository(FieldStatePermissionEntity);

    const usersApprovedRule = await fieldPermRepo.findOneBy({ module: 'USERS', state: 'APPROVED', role: 'ADMIN' });
    if (!usersApprovedRule) {
      await fieldPermRepo.save(
        fieldPermRepo.create({
          module: 'USERS',
          state: 'APPROVED',
          role: 'ADMIN',
          editableFields: ['fullName', 'phoneNumber', 'roleName', 'isActive'],
          readOnlyFields: ['email', 'approvalStatus'],
          allowedValues: null,
        }),
      );
    } else {
      usersApprovedRule.editableFields = ['fullName', 'phoneNumber', 'roleName', 'isActive'];
      usersApprovedRule.readOnlyFields = ['email', 'approvalStatus'];
      await fieldPermRepo.save(usersApprovedRule);
    }

    const usersRejectedRule = await fieldPermRepo.findOneBy({ module: 'USERS', state: 'REJECTED', role: 'ADMIN' });
    if (!usersRejectedRule) {
      await fieldPermRepo.save(
        fieldPermRepo.create({
          module: 'USERS',
          state: 'REJECTED',
          role: 'ADMIN',
          editableFields: ['fullName', 'phoneNumber'],
          readOnlyFields: ['email', 'approvalStatus', 'roleName', 'isActive'],
          allowedValues: null,
        }),
      );
    } else {
      usersRejectedRule.editableFields = ['fullName', 'phoneNumber'];
      usersRejectedRule.readOnlyFields = ['email', 'approvalStatus', 'roleName', 'isActive'];
      await fieldPermRepo.save(usersRejectedRule);
    }

    const usersPendingRule = await fieldPermRepo.findOneBy({ module: 'USERS', state: 'PENDING', role: 'ADMIN' });
    if (!usersPendingRule) {
      await fieldPermRepo.save(
        fieldPermRepo.create({
          module: 'USERS',
          state: 'PENDING',
          role: 'ADMIN',
          editableFields: ['fullName', 'phoneNumber', 'roleName', 'approvalStatus'],
          readOnlyFields: ['email', 'isActive'],
          allowedValues: { approvalStatus: ['APPROVED', 'REJECTED'] },
        }),
      );
    } else {
      usersPendingRule.editableFields = ['fullName', 'phoneNumber', 'roleName', 'approvalStatus'];
      usersPendingRule.readOnlyFields = ['email', 'isActive'];
      usersPendingRule.allowedValues = { approvalStatus: ['APPROVED', 'REJECTED'] };
      await fieldPermRepo.save(usersPendingRule);
    }

    console.log('Reglas de campos del módulo USERS verificadas.');
    console.log('Sembrado (Seeding) de Aplicación Base finalizado exitosamente.');
  } catch (err) {
    console.error('Error ejecutando semillas:', err);
  } finally {
    await AppDataSource.destroy();
  }
}

runSeeds();
