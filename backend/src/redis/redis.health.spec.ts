import { HealthIndicatorService } from '@nestjs/terminus';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RedisHealthIndicator } from './redis.health.js';
import { RedisService } from './redis.service.js';

describe('RedisHealthIndicator', () => {
  let indicator: RedisHealthIndicator;
  let redisService: RedisService;
  let healthIndicatorService: HealthIndicatorService;

  beforeEach(() => {
    redisService = {
      ping: vi.fn(),
    } as unknown as RedisService;

    healthIndicatorService = new HealthIndicatorService();

    indicator = new RedisHealthIndicator(redisService, healthIndicatorService);
  });

  it('should return healthy status when redis ping succeeds', async () => {
    vi.spyOn(redisService, 'ping').mockResolvedValue(true);

    const result = await indicator.isHealthy('redis');
    expect(result).toEqual({
      redis: {
        status: 'up',
      },
    });
  });

  it('should return down status when redis ping fails', async () => {
    vi.spyOn(redisService, 'ping').mockResolvedValue(false);

    const result = await indicator.isHealthy('redis');
    expect(result).toEqual({
      redis: {
        status: 'down',
        message: 'Redis connection unreachable',
      },
    });
  });
});
