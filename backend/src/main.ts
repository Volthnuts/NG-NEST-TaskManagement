import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser'; // 💡 1. อิมพอร์ตเข้ามา

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // เปิดใช้งาน Cookie Parser (ต้องใส่ก่อนพวกระบบสิทธิ์/Guard)
  app.use(cookieParser());

  // ตั้งค่า CORS สำหรับการใช้ Cookie (สำคัญ)
  app.enableCors({
    origin: 'http://localhost:4200', // ระบุ URL หน้าบ้านตรงๆ ห้ามใส่ '*' เด็ดขาดเมื่อใช้คุกกี้
    credentials: true,               // อนุญาตให้เปิดรับและส่ง Cookie ข้ามโดเมนได้
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist:true })); //ตัวนี้ มันจะตัดฟิลด์ที่ไม่อยู่ใน dto ออก
  //ถ้าเพิ่ม ,forbidNonWhitelisted: true จะเป็นการโยน error มาว่ามีฟิลด์แปลกๆ
  app.setGlobalPrefix('api/v1'); //กำหนด path หน้าทุก route
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Server is running on port ${process.env.PORT ?? 3000}`);
}
bootstrap();
