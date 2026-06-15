import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist:true })); //ตัวนี้ มันจะตัดฟิลด์ที่ไม่อยู่ใน dto ออก
  //ถ้าเพิ่ม ,forbidNonWhitelisted: true จะเป็นการโยน error มาว่ามีฟิลด์แปลกๆ
  app.setGlobalPrefix('api/v1'); //กำหนด path หน้าทุก route
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Server is running on port ${process.env.PORT ?? 3000}`);
}
bootstrap();
