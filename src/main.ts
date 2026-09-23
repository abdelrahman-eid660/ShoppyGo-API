import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { port } from './config';
import { ValidationPipe } from '@nestjs/common';
import { LanguageIntercaptor, ResponseInterceptor } from './common/interceptor';
import * as express from 'express'
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet({crossOriginResourcePolicy: { policy: 'cross-origin' }}));
  app.use(cookieParser());
  app.enableCors({origin : "http://localhost:4200" , credentials: true})
  app.use("/order/webhook" , express.raw({type : 'application/json'}))
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
