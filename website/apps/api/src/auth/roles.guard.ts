import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const ROLES_KEY = 'roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // Sem @Roles explícito, o guard exige ADMIN — antes deixava passar qualquer
    // utilizador autenticado, o que abria as rotas de backoffice a clientes.
    const roles = requiredRoles ?? ['ADMIN'];

    const { user } = context.switchToHttp().getRequest();
    return roles.includes(user?.role);
  }
}
