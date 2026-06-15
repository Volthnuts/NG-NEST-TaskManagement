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
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // ทำให้เรียกใช้ ConfigService ได้จากทุก Module โดยไม่ต้อง Import ซ้ำ
    }),
    JwtModule.register({ // ใช้ authGuard อยู่แล้วทุกที่เลย global imoport
      global: true,
      secret: process.env.JWT_SECRET,
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
