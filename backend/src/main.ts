import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module';

const logger = new Logger('Bootstrap');

/**
 * Warn loudly when production is running with development defaults.
 * Refuses to start in NODE_ENV=production if any critical secret is unset.
 */
function checkSecrets() {
  const isProd = process.env.NODE_ENV === 'production';
  const issues: string[] = [];

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'dev-secret-change-me') {
    issues.push('JWT_SECRET');
  }
  if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD === 'changeme123') {
    issues.push('ADMIN_PASSWORD');
  }
  if (!process.env.POS_PIN || process.env.POS_PIN === '4567') {
    issues.push('POS_PIN');
  }
  if (isProd && !process.env.CORS_ORIGIN) {
    issues.push('CORS_ORIGIN');
  }

  if (issues.length === 0) return;

  if (isProd) {
    logger.error(
      `Refusing to start: production env is missing/using default values for: ${issues.join(', ')}`,
    );
    process.exit(1);
  } else {
    logger.warn(
      `Using DEV defaults for ${issues.join(', ')} — set them in .env before deploying to production.`,
    );
  }
}

async function bootstrap() {
  checkSecrets();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve uploaded files from <cwd>/uploads at /uploads/* (publicly readable).
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
  app.useStaticAssets(uploadsDir, { prefix: '/uploads/' });

  // Restrict CORS in production via env. Defaults to permissive for dev.
  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
    : true;
  app.enableCors({ origin: corsOrigin, credentials: true });

  // Standard HTTP security headers (CSP off by default since we don't yet
  // enumerate inline scripts/styles; turn it on once frontend assets are stable).
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Strip unknown fields and coerce types where DTOs use class-validator.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const port = process.env.PORT || 5001;
  await app.listen(port);
  logger.log(`🚀 Server running on port ${port}`);
}

void bootstrap();
