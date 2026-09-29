import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { from, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Action } from './authorization.types.js';
import { CaslAbilityFactory } from './casl-ability.factory.js';

@Injectable()
export class AbacFieldFilterInterceptor implements NestInterceptor {
  constructor(
    private readonly caslAbilityFactory: CaslAbilityFactory,
    private readonly subject: string,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const body = request.body;

    if (user && body && typeof body === 'object') {
      return from(this.caslAbilityFactory.createForUserAsync(user)).pipe(
        switchMap((ability) => {
          for (const field of Object.keys(body)) {
            if (ability.cannot(Action.UPDATE, this.subject as any, field)) {
              throw new ForbiddenException(
                `No posees atributos suficientes para modificar el campo restringido '${field}' en ${this.subject}`,
              );
            }
          }
          return next.handle();
        }),
      );
    }

    return next.handle();
  }
}
