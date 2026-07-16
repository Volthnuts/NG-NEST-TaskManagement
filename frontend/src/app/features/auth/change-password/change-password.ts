import { ChangeDetectorRef, Component } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared-modules';
import { Location } from '@angular/common'; // 🎯 Import ตัวนี้เข้ามาครับ

@Component({
  selector: 'app-change-password',
  imports: [
    SharedModule
  ],
  templateUrl: './change-password.html',
  styleUrl: './change-password.scss',
})
export class ChangePassword {
  email = '';
  isLoading = false;
  isSentSuccess = false;
  message = '';

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    private location: Location,
  ) {}

  onSubmit() {
    if (!this.email.trim()) return;

    this.isLoading = true;

    const body = {
      email: this.email,
      resetUrl: 'http://localhost:4200/resetPassword'
    }

    this.apiService.post<any>('/users/change-password', body).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.isSentSuccess = true;
        this.message = res.message;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        alert(err.error?.message || 'เกิดข้อผิดพลาดในการส่งคำขอ');
      }
    });
  }

  goBack(): void {
    this.location.back();
  }
}
