import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
    private prisma: PrismaService,
  ) {}

  async register(email: string, password: string, firstName?: string, lastName?: string) {
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email já registado');
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await this.usersService.create({ email, password: hashed, firstName, lastName });

    return this.signToken(user);
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Credenciais inválidas');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');

    return this.signToken(user);
  }

  async forgotPassword(email: string) {
    // Responde sempre OK para não revelar se o email existe
    const user = await this.usersService.findByEmail(email);
    if (!user) return { ok: true };

    const token = this.jwtService.sign(
      { sub: user.id, type: 'password-reset' },
      { expiresIn: '15m' },
    );

    const frontendUrl = process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/pt/auth/reset?token=${token}`;

    try {
      await this.mailService.sendPasswordReset(user.email, user.firstName ?? 'Atleta', resetLink);
    } catch (err) {
      this.logger.error('Erro ao enviar email de reset', err);
    }

    return { ok: true };
  }

  async resetPassword(token: string, newPassword: string) {
    let payload: { sub: string; type: string };
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new BadRequestException('Link expirado ou inválido');
    }

    if (payload.type !== 'password-reset') {
      throw new BadRequestException('Token inválido');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: payload.sub },
      data: { password: hashed },
    });

    return { ok: true };
  }

  private signToken(user: { id: string; email: string; role: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      role: user.role,
    };
  }
}
