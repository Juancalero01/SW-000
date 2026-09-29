import { Global, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { RedisHealthIndicator } from './redis.health.js';
import { RedisService } from './redis.service.js';

@Global()
@Module({
  imports: [TerminusModule],
  providers: [RedisService, RedisHealthIndicator],
  exports: [RedisService, RedisHealthIndicator, TerminusModule],
})
export class RedisModule {}
