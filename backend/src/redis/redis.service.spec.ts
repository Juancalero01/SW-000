import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RedisService } from './redis.service.js';

describe('RedisService', () => {
  let service: RedisService;

  const mockConfigService = {
    get: vi.fn().mockImplementation((key: string, defaultValue: any) => {
      if (key === 'REDIS_HOST') return 'localhost';
      if (key === 'REDIS_PORT') return 6379;
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('operaciones get, set y del', () => {
    it('debe retornar null cuando Redis no esta conectado o status no es ready', async () => {
      const result = await service.get('test:key');
      expect(result).toBeNull();
    });

    it('debe tolerar fallos en set cuando Redis no esta conectado', async () => {
      await expect(service.set('test:key', { foo: 'bar' })).resolves.not.toThrow();
    });

    it('debe tolerar fallos en del cuando Redis no esta conectado', async () => {
      await expect(service.del('test:key')).resolves.not.toThrow();
    });
  });

  describe('ciclo de vida del modulo', () => {
    it('debe inicializar el cliente en onModuleInit y desconectar en onModuleDestroy', () => {
      expect(() => service.onModuleInit()).not.toThrow();
      expect(() => service.onModuleDestroy()).not.toThrow();
    });
  });
});
