import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Como o JwtAuthGuard, mas nunca bloqueia: se houver token válido preenche
 * req.user, caso contrário segue como visitante anónimo (req.user = null).
 * Usado em rotas públicas que mostram mais dados a admins (ex: ?all=true).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(_err: any, user: any): TUser {
    return (user || null) as TUser;
  }
}
