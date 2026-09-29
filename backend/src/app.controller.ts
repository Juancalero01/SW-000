import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { AppService } from './app.service.js';
import { Public } from './auth/decorators/public.decorator.js';
import { RedisHealthIndicator } from './redis/redis.health.js';

@ApiTags('Health Check')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly redisIndicator: RedisHealthIndicator,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Verificar el estado del servicio' })
  checkHealth() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redisIndicator.isHealthy('redis'),
    ]);
  }
}
