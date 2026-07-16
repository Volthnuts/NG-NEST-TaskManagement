import { Injectable } from '@angular/core';
import { ApiService } from '../services/api.service';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // เก็บสถานะข้อมูลผู้ใช้ปัจจุบัน (ถ้าล็อกอินแล้วจะมีค่า ถ้ายังจะเป็น null)
  private currentUserSubject = new BehaviorSubject<any>(null); // Behavior เป็นตัวเก็บข้อมูลแบบ private ค่าเริ่มต้นคือ null
  public currentUser$ = this.currentUserSubject.asObservable(); // เอาค่าที่เก็บใน Behavior ไปใช้ต่อที่อื่นได้ โดยใช่ชื่อ currentUser$
  // มันโดนเรียกไปใช้ใน auth.guard (ป้องกันการถูกแก้ไขจากหน้าอื่น)

  constructor(
    private apiService: ApiService, 
    private router: Router
  ) {
    // โหลดข้อมูลผู้ใช้จาก localStorage ป้องกันข้อมูลหายตอนกด Refresh หน้าเว็บ (F5)
    const savedUser = localStorage.getItem('current_user');
    if (savedUser) {
      // แก้จาก JSON.deserialize เป็น JSON.parse 
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  // login(credentials: any): Observable<any> {
  //   return this.apiService.post<any>('/auth/login', credentials).pipe(
  //     tap(user => {
  //       // บันทึกสถานะผู้ใช้ลงในแอป
  //       this.currentUserSubject.next(user);
  //       localStorage.setItem('current_user', JSON.stringify(user));
  //     })
  //   );
  // }
  login(credentials: any): Observable<any> {
    return this.apiService.post<any>('/auth/login', credentials).pipe(
      tap(user => {
        console.log('User from API:', user); // เช็คว่า API ส่งอะไรมา
        this.currentUserSubject.next(user);
        localStorage.setItem('current_user', JSON.stringify(user));
      })
    );
  }

  // ฟังก์ชันที่ถูกเรียกใช้โดย Interceptor เพื่อชุบชีวิตคุกกี้ Access Token
  refreshTokens() {
    return this.apiService.post('/auth/refreshToken', {});
  }

  // logout() {
  //   // เคลียร์ค่าออกให้หมด
  //   this.currentUserSubject.next(null);
  //   localStorage.removeItem('current_user');
    
  //   // อัปชันเสริม: อาจจะยิง API ไปบอกหลังบ้านให้เคลียร์ Cookie ล้างตารางใน DB ด้วยก็ได้
  //   this.apiService.post('/auth/logout', {}).subscribe({
  //     next: () => this.router.navigate(['/login']),
  //     error: () => this.router.navigate(['/login'])
  //   });
  // }

  logout() {
    // 1. ทำลายหลักฐานและเตะผู้ใช้กลับหน้า Login ทันทีชัวร์ที่สุด ไม่ต้องรอ API
    this.currentUserSubject.next(null);
    localStorage.removeItem('current_user');
    this.router.navigate(['/login']);

    // 2. ยิงบอกหลังบ้านแบบยิงแล้วทิ้ง (Fire and Forget) ไม่ต้องไปเกาะสตรีมตรวจ Error ซ้ำ
    this.apiService.post('/auth/logout', {}).subscribe({
      next: () => console.log('Backend session cleared'),
      error: (err) => console.log('Backend already cleared or expired')
    });
  }

  getUserId(): string | null {
    return this.currentUserSubject.value?.id || null;
  }
}