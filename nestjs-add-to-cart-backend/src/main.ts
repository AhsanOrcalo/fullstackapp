import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Cart Backend API')
    .setDescription('API documentation for Cart Backend - Full API endpoints')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('leads', 'Leads management endpoints')
    .addTag('purchases', 'Purchase management endpoints')
    .addTag('enquiries', 'Enquiry management endpoints')
    .addTag('dashboard', 'Dashboard statistics endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app as any, config);
  SwaggerModule.setup('api', app as any, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT ?? 8000);
  console.log(`Application is running on: http://localhost:${process.env.PORT ?? 8000}`);
  console.log(`Swagger documentation available at: http://localhost:${process.env.PORT ?? 8000}/api`);
}
bootstrap();
