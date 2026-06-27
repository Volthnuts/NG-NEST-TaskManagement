import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TasksModule } from './modules/tasks/tasks.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { AuthModule } from './modules/auth/auth.module';
import { LoggingInterceptor } from './common/interceptors/logging/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform/transform.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // ทำให้เรียกใช้ ConfigService ได้จากทุก Module โดยไม่ต้อง Import ซ้ำ
    }),
    JwtModule.register({ // ใช้ authGuard อยู่แล้วทุกที่เลย global imoport
      global: true,
      secret: process.env.JWT_SECRET,
    }),
    // ตั้งค่าระบบส่งอีเมลแบบ Global
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get<string>('MAIL_HOST') || 'smtp.gmail.com',
          port: config.get<number>('MAIL_PORT') || 587,
          secure: false, // true สำหรับพอร์ต 465, false สำหรับพอร์ตอื่น
          auth: {
            user: config.get<string>('MAIL_USER'), // อีเมลผู้ส่ง
            pass: config.get<string>('MAIL_PASS'), // App Password ของ Gmail
          },
        },
        defaults: {
          from: `"TaskFlow Support" <${config.get<string>('MAIL_USER')}>`,
        },
      }),
      inject: [ConfigService],
    }),
    TasksModule, 
    AuthModule, 
    ProjectsModule, 
    UsersModule, 
    PrismaModule], // เรียกใช้ prisma method ที่ทุก module เหมือน jwt เลย
  controllers: [AppController],
  providers: [
    AppService,
    // การประกาศ Global Interceptor ผ่าน Provider 
    // ใช้ตรงนี้แทน global ใน main.ts เผื่อต้องการบันทึกข้อมูลลง db
    // ซึ่่งต้องจัดการใน Interceptor เองว่าจะเชื่อมต่อ db ยังไง 
    // (ไม่ควรใช้ PrismaService ตรงๆ เพราะอาจเกิดปัญหา circular dependency)
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
