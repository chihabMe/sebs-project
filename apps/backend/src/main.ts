import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser = require('cookie-parser');
import helmet from 'helmet';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Global Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: false,
  }));

  // CORS
  const configuredOrigins = (
    process.env.FRONTEND_URLS ||
    process.env.FRONTEND_URL ||
    'http://localhost:5173,http://localhost:5174'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  console.log('Configured CORS Origins:', configuredOrigins);

  app.enableCors({
    origin: configuredOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  });

  // Global pipes & middlewares
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // Static files
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  // Prefix
  app.setGlobalPrefix('api');

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('SEBS API')
    .setDescription('Smart Event Booking System API Documentation')
    .setVersion('1.0')
    .addCookieAuth('accessToken')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);
}
bootstrap();
