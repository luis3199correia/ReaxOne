import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  // Falha logo no arranque se faltar o segredo dos JWT (sem ele os tokens seriam inseguros/inválidos)
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET não definido — a API não pode arrancar sem ele.');
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Atrás de proxy (Docker/hosting) o IP real vem no X-Forwarded-For — necessário
  // para o rate limiting funcionar por cliente. TRUST_PROXY=0 desativa.
  app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1));
  const logger = new Logger('CORS');

  // Cookie parser (para JWT em httpOnly cookies)
  app.use(cookieParser());

  // Validação global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // CORS — permite pedidos do frontend
  // FRONTEND_URL pode ser uma lista separada por vírgulas, ex:
  //   https://reaxone.com,https://www.reaxone.com
  const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Permite pedidos sem Origin (ex: Postman, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // callback(null, false) em vez de callback(new Error(...)): rejeita o CORS
        // de forma limpa (sem cabeçalho Access-Control-Allow-Origin), sem fazer o
        // Nest tratar isto como uma exceção não apanhada e devolver 500.
        logger.warn(`Origem não permitida: ${origin}`);
        callback(null, false);
      }
    },
    credentials: true, // necessário para cookies httpOnly
  });

  // Prefixo global da API
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 API a correr em http://localhost:${port}/api`);
}

bootstrap();
