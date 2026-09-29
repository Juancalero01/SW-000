import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);

    this.client = new Redis({
      host,
      port,
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });

    this.client
      .connect()
      .then(() => this.logger.log(`Conectado exitosamente a Redis (${host}:${port})`))
      .catch((err) => this.logger.warn(`No se pudo conectar a Redis (${err.message}).`));
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.client?.status !== 'ready') return null;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds = 3600): Promise<void> {
    try {
      if (this.client?.status !== 'ready') return;
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
      this.logger.error(`Error guardando en Redis: ${err}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      if (this.client?.status !== 'ready') return;
      await this.client.del(key);
    } catch {
      // Ignorar errores
    }
  }

  async ping(): Promise<boolean> {
    try {
      if (this.client?.status !== 'ready') return false;
      const res = await this.client.ping();
      return res === 'PONG';
    } catch {
      return false;
    }
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }
}
