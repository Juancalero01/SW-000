import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { RedisHealthIndicator } from './redis/redis.health.js';

describe('AppController', () => {
  let appController: AppController;
  let healthCheckService: HealthCheckService;
  let dbHealthIndicator: TypeOrmHealthIndicator;
  let redisHealthIndicator: RedisHealthIndicator;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: HealthCheckService,
          useValue: {
            check: vi.fn(),
          },
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: {
            pingCheck: vi.fn(),
          },
        },
        {
          provide: RedisHealthIndicator,
          useValue: {
            isHealthy: vi.fn(),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    healthCheckService = app.get<HealthCheckService>(HealthCheckService);
    dbHealthIndicator = app.get<TypeOrmHealthIndicator>(TypeOrmHealthIndicator);
    redisHealthIndicator = app.get<RedisHealthIndicator>(RedisHealthIndicator);
  });

  describe('checkHealth', () => {
    it('should invoke HealthCheckService.check with health indicators', async () => {
      const mockResult = {
        status: 'ok',
        info: { database: { status: 'up' }, redis: { status: 'up' } },
        error: {},
        details: { database: { status: 'up' }, redis: { status: 'up' } },
      };

      vi.spyOn(healthCheckService, 'check').mockImplementation(async (indicators) => {
        for (const indicator of indicators) {
          await indicator();
        }
        return mockResult as any;
      });

      const result = await appController.checkHealth();

      expect(result).toEqual(mockResult);
      expect(healthCheckService.check).toHaveBeenCalled();
      expect(dbHealthIndicator.pingCheck).toHaveBeenCalledWith('database');
      expect(redisHealthIndicator.isHealthy).toHaveBeenCalledWith('redis');
    });
  });
});
