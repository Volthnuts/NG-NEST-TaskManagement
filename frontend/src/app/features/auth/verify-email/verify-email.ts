import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
    private router: Router,
    private cdr: ChangeDetectorRef, // inject เพิ่ม สั่งให้ re-render เอง ไม่ค้องรอ Zone ที่จะคอยจับ async operation
  ) {}

  ngOnInit(): void {
    // แกะค่า token จาก URL query string (?token=xxxx)
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.isLoading = false;
      this.isSuccess = false;
      this.errorMessage = 'Verify Token Not Found';
      return;
    }

    // ส่งไปให้ NestJS ตรวจสอบความถูกต้อง
    this.apiService.get<{ message: string }>(`/auth/verify?token=${token}`).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.isSuccess = true;
        this.cdr.detectChanges(); // บอก Angular ให้มาเช็คและอัปเดต UI
      },
      error: (err) => {
        this.isLoading = false;
        this.isSuccess = false;
        this.errorMessage = err.error?.message || 'Token Expired or has been used';
      }
    });
  }
}