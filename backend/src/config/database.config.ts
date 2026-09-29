import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  type: 'mysql' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USER || 'nest_user',
  password: process.env.DB_PASSWORD || 'nest_password',
  database: process.env.DB_NAME || 'sw000_db',
  autoLoadEntities: true,
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
}));
