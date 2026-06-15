import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { tap } from 'rxjs/operators'; // นำเข้า tap เพื่อแอบดูข้อมูลใน Stream ของ RxJS โดยไม่ไปแก้ไขข้อมูลนั้น

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler) {
    // --- ส่วนที่ 1: ทำงาน "ก่อน" เข้า Controller ---
    const now = Date.now(); // บันทึกเวลาเริ่มต้น (Timestamp)
    const request = ctx.switchToHttp().getRequest(); // ดึงข้อมูล Request มาเพื่อดู Method และ URL
    
    // --- ส่วนที่ 2: จัดการกับผลลัพธ์ที่จะส่งกลับ ---
    return next.handle().pipe(
      // next.handle() คือการสั่งให้ Request วิ่งต่อไปที่ Controller
      // .pipe() คือการใช้ความสามารถของ RxJS มาจัดการผลลัพธ์ที่ส่งกลับมา
      
      tap(() => {
        // tap จะทำงาน "หลังจาก" Controller ทำงานเสร็จแล้ว
        const delay = Date.now() - now; // เอาเวลาปัจจุบัน ลบ เวลาเริ่มต้น = เวลาที่ใช้ไป
        console.log(`${request.method} ${request.url} - ${delay}ms`);
        // แสดงผลใน Console เช่น: GET /users - 15ms
      }),
    );
  }
}