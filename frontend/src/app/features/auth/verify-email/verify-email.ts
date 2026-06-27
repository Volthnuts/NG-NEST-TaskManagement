import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../shared/shared-modules';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-verify-email',
  imports: [
    SharedModule
  ],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.scss',
})
export class VerifyEmail implements OnInit {
  isLoading = true;
  isSuccess = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 💡 แกะค่า token จาก URL query string (?token=xxxx)
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.isLoading = false;
      this.isSuccess = false;
      this.errorMessage = 'ไม่พบ Token สำหรับการยืนยันตัวตน';
      return;
    }

    // ⚡ ส่งไปให้ NestJS ตรวจสอบความถูกต้อง
    this.apiService.get<{ message: string }>(`/auth/verify?token=${token}`).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.isSuccess = true;
      },
      error: (err) => {
        this.isLoading = false;
        this.isSuccess = false;
        this.errorMessage = err.error?.message || 'ลิงก์หมดอายุ หรือถูกใช้งานไปแล้ว';
      }
    });
  }
}