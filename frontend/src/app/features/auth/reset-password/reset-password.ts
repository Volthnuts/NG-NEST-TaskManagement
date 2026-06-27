import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared-modules';

@Component({
  selector: 'app-reset-password',
  imports: [
    SharedModule
  ],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword implements OnInit {
  token = '';
  newPassword = '';
  confirmPassword = '';
  
  isLoading = false;
  isSuccess = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 💡 ดักแกะค่า ?token=xxxx ที่ส่งมาจากปุ่มในอีเมล
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    
    if (!this.token) {
      this.errorMessage = 'ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง หรือไม่มีรหัสตั๋วแนบมา';
    }
  }

  onSubmit() {
    if (!this.newPassword || !this.confirmPassword) return;

    if (this.newPassword !== this.confirmPassword) {
      alert('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    const body = {
      token: this.token,
      newPassword: this.newPassword,
      confirmPassword: this.confirmPassword
    };

    this.isLoading = true;
    this.errorMessage = '';

    // ⚡ ยิงหา Endpoint รีเซ็ตรหัสผ่านของ NestJS
    this.apiService.post<{ message: string }>('/auth/reset-password', body).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.isSuccess = true;
        // หลังจากตั้งรหัสผ่านใหม่สำเร็จ 3 วินาที ให้วาร์ปไปหน้า Login อัตโนมัติ
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ ลิงก์อาจจะหมดอายุแล้ว';
      }
    });
  }
}