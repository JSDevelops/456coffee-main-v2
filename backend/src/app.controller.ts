import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from './prisma.service';
import { Public } from './auth/public.decorator';

@Controller('api')
export class AppController {
  constructor(private prisma: PrismaService) {}

  /**
   * Liveness/readiness probe.
   * - Public so monitoring (Render, UptimeRobot, k8s) can hit it without auth.
   * - SkipThrottle so a tight default rate limit can't trip the probe.
   * - Pings the DB so the probe fails fast when Prisma can't connect.
   */
  @Public()
  @SkipThrottle()
  @Get('health')
  async health() {
    let db: 'ok' | 'down' = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      db = 'down';
    }
    return {
      status: db === 'ok' ? 'ok' : 'degraded',
      db,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
