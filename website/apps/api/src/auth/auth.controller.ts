import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

class RegisterDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

class ResetPasswordDto {
  @IsString()
  @MaxLength(2048)
  token: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}

const CUSTOMER_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias (JWT_EXPIRES_IN)
const ADMIN_COOKIE_MAX_AGE_MS = 12 * 60 * 60 * 1000;       // 12 h (ADMIN_TOKEN_TTL)

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res() res: Response) {
    const result = await this.authService.register(
      dto.email,
      dto.password,
      dto.firstName,
      dto.lastName,
    );
    this.setTokenCookie(res, result.access_token, result.role);
    return res.json({ role: result.role });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    const result = await this.authService.login(dto.email, dto.password);
    this.setTokenCookie(res, result.access_token, result.role);
    return res.json({ role: result.role });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: Request) {
    return req.user; // { id, email, role } injetado pelo JwtStrategy
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.token, body.password);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res() res: Response) {
    const isProd = process.env.NODE_ENV === 'production';
    // Must pass the exact same options used when setting the cookie,
    // otherwise the browser ignores the clear request.
    res.clearCookie('reaxone_token', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax', // site e API em reaxone.com (mesmo site): Lax chega e trava CSRF entre sites
      domain: isProd ? '.reaxone.com' : undefined,
    });
    return res.json({ ok: true });
  }

  private setTokenCookie(res: Response, token: string, role: string) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('reaxone_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax', // site e API em reaxone.com (mesmo site): Lax chega e trava CSRF entre sites
      domain: isProd ? '.reaxone.com' : undefined,
      maxAge: role === 'ADMIN' ? ADMIN_COOKIE_MAX_AGE_MS : CUSTOMER_COOKIE_MAX_AGE_MS, // igual à validade do token
    });
  }
}
