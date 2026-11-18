import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { loadEnv } from './config/env';

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', 1);
  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: env.CORS_ORIGIN });
  app.enableShutdownHooks();

  if (env.NODE_ENV !== 'production' || env.ENABLE_SWAGGER) {
    const config = new DocumentBuilder()
      .setTitle('Coinbook API')
      .setVersion('1')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
  }

  await app.listen(env.PORT);
}

void bootstrap();
