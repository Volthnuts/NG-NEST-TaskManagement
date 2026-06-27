import { Injectable } from '@angular/core';
import { ApiService } from '../services/api.service';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

interface UserState {
  id: string;
  name: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // เก็บสถานะข้อมูลผู้ใช้ปัจจุบัน (ถ้าล็อกอินแล้วจะมีค่า ถ้ายังจะเป็น null)
  private currentUserSubject = new BehaviorSubject<UserState | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private apiService: ApiService, private router: Router) {
    // โหลดข้อมูลผู้ใช้จาก localStorage ป้องกันข้อมูลหายตอนกด Refresh หน้าเว็บ (F5)
    const savedUser = localStorage.getItem('current_user');
    if (savedUser) {
      // 💡 แก้จาก JSON.deserialize เป็น JSON.parse ครับ
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  login(credentials: any): Observable<UserState> {
    return this.apiService.post<UserState>('/auth/login', credentials).pipe(
      tap(user => {
        // บันทึกสถานะผู้ใช้ลงในแอป
        this.currentUserSubject.next(user);
        localStorage.setItem('current_user', JSON.stringify(user));
      })
    );
  }

  // 💡 ฟังก์ชันที่ถูกเรียกใช้โดย Interceptor เพื่อชุบชีวิตคุกกี้ Access Token
  refreshTokens() {
    return this.apiService.post('/auth/refresh', {});
  }

  logout() {
    // เคลียร์ค่าออกให้หมด
    this.currentUserSubject.next(null);
    localStorage.removeItem('current_user');
    
    // อัปชันเสริม: อาจจะยิง API ไปบอกหลังบ้านให้เคลียร์ Cookie ล้างตารางใน DB ด้วยก็ได้
    this.apiService.post('/auth/logout', {}).subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }

  getUserId(): string | null {
    return this.currentUserSubject.value?.id || null;
  }
}