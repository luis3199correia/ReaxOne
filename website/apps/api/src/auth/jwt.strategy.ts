import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { SessionPayload, sessionUser } from './session.rules';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private prisma: PrismaService) {
    super({
      // Extrai o JWT do cookie httpOnly
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.['reaxone_token'] ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /** Cada pedido confirma a sessão na BD: utilizador apagado, despromovido ou com password nova perde o acesso. */
  async validate(payload: SessionPayload) {
    const user = await this.prisma.user.findUnique({
      where:  { id: payload.sub },
      select: { id: true, email: true, role: true, password: true },
    });
    const session = sessionUser(payload, user);
    if (!session) throw new UnauthorizedException('Sessão inválida');
    return session;
  }
}
