import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';

// ตัวแปรล็อกระบบชั่วคราว ป้องกันปัญหากรณียิงพร้อมกันหลาย Request แล้วเกิดการรุม Refresh ซ้ำซ้อน
let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

export const jwtInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);

  // สั่งให้ทุก Request แนบ Cookie ไปด้วยอัตโนมัติ
  const credentialReq = req.clone({ withCredentials: true });

  return next(credentialReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // 💡 ดักจับ 401 Unauthorized (แปลว่า Access Token น่าจะหมดอายุแล้ว)
      if (error.status === 401 && !req.url.includes('/auth/refresh')) {
        return handle401Error(credentialReq, next, authService);
      }
      return throwError(() => error);
    })
  );
};

// ฟังก์ชันคุมคิว Silent Refresh
function handle401Error(request: HttpRequest<any>, next: HttpHandlerFn, authService: AuthService) {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    // ⚡ ยิงไป Endpoint Refresh หลังบ้าน เพื่อให้หลังบ้านเขียน Cookie AT ใบใหม่มาให้
    return authService.refreshTokens().pipe(
      switchMap((res: any) => {
        isRefreshing = false;
        refreshTokenSubject.next(res);
        // ยิง Request เดิมซ้ำอีกครั้งหลังจากได้คุกกี้อันใหม่มาแล้ว
        return next(request);
      }),
      catchError((err) => {
        isRefreshing = false;
        // ถ้าขนาด RT ก็ยังหมดอายุหรือพังด้วย แปลว่าหมดเวลาเซสชัน ให้เตะไปหน้า Login
        authService.logout();
        return throwError(() => err);
      })
    );
  } else {
    // ระหว่างรอคำขอ Refresh แรกทำงาน ตัวอื่นจะต่อคิวตรงนี้
    return refreshTokenSubject.pipe(
      filter(result => result !== null),
      take(1),
      switchMap(() => next(request))
    );
  }
}