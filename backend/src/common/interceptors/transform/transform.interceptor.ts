import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { map } from 'rxjs/operators'; // นำเข้า map เพื่อเปลี่ยนแปลงข้อมูลใน Stream ของ RxJS

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler) {
    // next.handle() คือการปล่อยให้ Controller ทำงานจนเสร็จ
    // .pipe() คือการเอาผลลัพธ์จาก Controller มาเข้ากระบวนการต่อไป
    return next.handle().pipe(
      // map((data) => ...) รับ 'data' ซึ่งก็คือข้อมูลที่ Controller return ออกมา
      map((data) => ({
        success: true, // ใส่สถานะบอกว่าทำงานสำเร็จ
        statusCode: ctx.switchToHttp().getResponse().statusCode, // ดึง HTTP Status Code จริงๆ มาแปะ (เช่น 200, 201)
        data: data,    // เอาข้อมูลเดิมจาก Controller มาใส่ไว้ในฟิลด์ data
        message: 'Success', // ใส่ข้อความมาตรฐาน
      })),
    );
  }
}