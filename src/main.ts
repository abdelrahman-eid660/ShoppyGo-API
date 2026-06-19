import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { port } from './config';
import { ValidationPipe } from '@nestjs/common';
import { LanguageIntercaptor, ResponseInterceptor } from './common/interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors()
  app.useGlobalInterceptors(new LanguageIntercaptor() , new ResponseInterceptor())
  app.useGlobalPipes(
    new ValidationPipe({
      transform : true,
      stopAtFirstError: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );
  await app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}
void bootstrap();
