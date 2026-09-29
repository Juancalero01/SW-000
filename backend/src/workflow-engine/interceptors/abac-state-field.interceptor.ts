import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { from, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { WorkflowEngineService } from '../workflow-engine.service.js';

@Injectable()
export class AbacStateFieldInterceptor implements NestInterceptor {
  constructor(
    private readonly workflowEngineService: WorkflowEngineService,
    private readonly moduleCode: string,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const body = request.body;

    const state = body?.state || body?.currentState || body?.status;

    if (!user || !user.roles || !body || !state || typeof body !== 'object') {
      return next.handle();
    }

    const userRoles = user.roles.map((r: any) => (typeof r === 'string' ? r : r.name));

    return from(
      Promise.all([
        this.workflowEngineService.getEditableFieldsForUser(this.moduleCode, state, userRoles),
        this.workflowEngineService.getAllowedValuesForUser(this.moduleCode, state, userRoles),
      ]),
    ).pipe(
      switchMap(([editableFields, allowedValues]) => {
        const ignoredFields = [
          'id',
          'state',
          'status',
          'fromState',
          'toState',
          'targetState',
          'currentState',
        ];

        for (const field of Object.keys(body)) {
          if (ignoredFields.includes(field)) continue;

          // 1. Validar si el campo completo es editable para el rol
          if (editableFields !== null && !editableFields.includes(field)) {
            throw new ForbiddenException(
              `No posees permiso para modificar el campo '${field}' en el estado '${state}' para el módulo ${this.moduleCode}`,
            );
          }

          // 2. Validar si el valor enviado está dentro de la lista de valores permitidos (Option-level Whitelisting)
          if (allowedValues !== null && allowedValues[field]) {
            const fieldValue = body[field];
            const isAllowed = allowedValues[field].includes(String(fieldValue));
            if (!isAllowed) {
              throw new ForbiddenException(
                `El valor '${fieldValue}' no es una opción permitida para tu rol en el campo '${field}'`,
              );
            }
          }
        }

        return next.handle();
      }),
    );
  }
}
