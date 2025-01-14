import { NestFactory } from '@nestjs/core';
import { NatsServer } from './nats.transporter';
import { AppModule } from './app.module';
import { REQUIRED_ENV_KEYS } from './modules/config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  REQUIRED_ENV_KEYS.forEach((key) => {
    if (typeof process.env[key] === 'undefined') {
      console.warn(`${key} environment variable is missing.`);
    }
  });

  app.connectMicroservice({
    strategy: new NatsServer(),
    logger: ['error', 'warn', 'log'],
  });

  app.startAllMicroservices();
  app.enableCors();

  app.listen(3000);
}

bootstrap();

process.on('SIGTERM', () => process.exit());
