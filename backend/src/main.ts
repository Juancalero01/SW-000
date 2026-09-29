import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const corsOrigin = configService.get<string>('CORS_ORIGIN', 'http://localhost:4200');

  // 1. Configurar Prefijo Global de API
  app.setGlobalPrefix('api');

  // 2. Configurar CORS seguro
  app.enableCors({
    origin: corsOrigin.includes(',') ? corsOrigin.split(',').map((o) => o.trim()) : corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 3. Configurar Validación Global (ValidationPipe)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 4. Configurar Swagger OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SW-000 API Backend')
    .setDescription('Documentación interactiva OpenAPI de la API REST del proyecto SW-000.')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'Authorization',
      description: 'Ingrese su token JWT de autenticación',
      in: 'header',
    })
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // 5. Habilitar Graceful Shutdown Hooks
  app.enableShutdownHooks();

  await app.listen(port);
  logger.log(`Servidor ejecutándose en: http://localhost:${port}/api`);
  logger.log(`Documentación Swagger disponible en: http://localhost:${port}/api/docs`);
}

await bootstrap();
