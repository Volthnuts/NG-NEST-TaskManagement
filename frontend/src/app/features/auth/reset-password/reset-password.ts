import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
  
  showNewPassword = false;
  showConfirmPassword = false;
  
  isLoading = false;
  isSuccess = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // ดักแกะค่า ?token=xxxx ที่ส่งมาจากปุ่มในอีเมล
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    
    if (!this.token) {
      this.errorMessage = 'Invalid or missing password reset token.';
      // บังคับตรวจจับการเปลี่ยนแปลงทันทีตั้งแต่โหลดหน้าจอเสร็จ เพื่อให้กล่องสีแดงขึ้นโชว์โดยไม่ต้องรอคลิก
      this.cdr.detectChanges();
    }
  }

  onSubmit() {
    if (!this.newPassword || !this.confirmPassword) return;

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      this.cdr.detectChanges();
      return;
    }

    const body = {
      token: this.token,
      newPassword: this.newPassword,
      confirmPassword: this.confirmPassword
    };

    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges(); // สั่งให้ปุ่มขึ้นสถานะหมุนโหลดตัวล็อกทันที

    // ยิงหา Endpoint รีเซ็ตรหัสผ่านของ NestJS
    this.apiService.post<any>('/users/reset-password', body).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.isSuccess = true;
        this.cdr.detectChanges();
        
        // แก้ไขจาก 5000 เป็น 3000 เพื่อให้วาร์ปไปหน้า Login ภายใน 3 วินาทีตามหน้าจออธิบาย
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (err) => {
        this.isLoading = false;
        // ดึงข้อความ Error ภาษาอังกฤษจากฝั่งหลังบ้าน หรือใช้ Fallback ภาษาอังกฤษที่ระบุไว้
        this.errorMessage = err.error?.message || 'Failed to reset password. The link may have expired.';
        
        // บังคับรีเฟรชหน้าจอทันทีหลังจาก API ตอบกลับมาพัง ข้อความ Error จะได้เด้งขึ้นมาชัดเจน
        this.cdr.detectChanges();
      }
    });
  }
}