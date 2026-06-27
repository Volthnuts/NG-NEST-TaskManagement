import { Component } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared-modules';

@Component({
  selector: 'app-forgot-password',
  imports: [
    SharedModule
  ],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPassword {
  email = '';
  isLoading = false;
  isSentSuccess = false;
  message = '';

  constructor(private apiService: ApiService) {}

  onSubmit() {
    if (!this.email.trim()) return;

    this.isLoading = true;
    this.apiService.post<{ message: string }>('/auth/forgot-password', { email: this.email }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.isSentSuccess = true;
        this.message = res.message;
      },
      error: (err) => {
        this.isLoading = false;
        alert(err.error?.message || 'เกิดข้อผิดพลาดในการส่งคำขอ');
      }
    });
  }
}
